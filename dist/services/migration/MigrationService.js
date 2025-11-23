"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrationService = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const utils_1 = require("../../core/utils");
const errors_1 = require("../../core/errors");
class MigrationService {
    constructor(db, enableRetry = true, retryConfig) {
        this.db = db;
        this.enableRetry = enableRetry;
        this.retryConfig = retryConfig;
        this.BATCH_SIZE = 500;
    }
    async convertToRelational(collection, docId, refKeys) {
        (0, utils_1.validatePath)(collection);
        (0, utils_1.validateId)(docId);
        const operation = async () => {
            const ref = this.db.collection(collection).doc(docId);
            const doc = await ref.get();
            if (!doc.exists) {
                throw new errors_1.DocumentNotFoundError(collection, docId);
            }
            const rawData = doc.data();
            if (!rawData) {
                throw new errors_1.MigrationError("Document has no data", { collection, docId });
            }
            const { createdAt, updatedAt, ...allData } = rawData;
            const data = {};
            const refs = {};
            for (const [key, value] of Object.entries(allData)) {
                if (refKeys.includes(key)) {
                    refs[key] = String(value);
                }
                else {
                    data[key] = value;
                }
            }
            await ref.set({
                data,
                refs,
                createdAt: createdAt || firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
            });
            return { converted: 1, batches: 1 };
        };
        return this.withRetry(operation, "convertToRelational");
    }
    async batchConvertToRelational(collection, refKeys, batchSize = this.BATCH_SIZE) {
        (0, utils_1.validatePath)(collection);
        const operation = async () => {
            const snapshot = await this.db.collection(collection).get();
            const docs = snapshot.docs;
            if (docs.length === 0) {
                return { converted: 0, batches: 0 };
            }
            const chunks = (0, utils_1.chunkArray)(docs, batchSize);
            let totalConverted = 0;
            const errors = [];
            for (const chunk of chunks) {
                const batch = this.db.batch();
                for (const doc of chunk) {
                    try {
                        const rawData = doc.data();
                        const { createdAt, updatedAt, ...allData } = rawData;
                        const data = {};
                        const refs = {};
                        for (const [key, value] of Object.entries(allData)) {
                            if (refKeys.includes(key)) {
                                refs[key] = String(value);
                            }
                            else {
                                data[key] = value;
                            }
                        }
                        batch.set(doc.ref, {
                            data,
                            refs,
                            createdAt: createdAt || firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
                            updatedAt: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
                        });
                        totalConverted++;
                    }
                    catch (error) {
                        errors.push({
                            id: doc.id,
                            error: error instanceof Error ? error.message : String(error),
                        });
                    }
                }
                await batch.commit();
            }
            return {
                converted: totalConverted,
                batches: chunks.length,
                failed: errors.length,
                errors: errors.length > 0 ? errors : undefined,
            };
        };
        return this.withRetry(operation, "batchConvertToRelational");
    }
    async batchTransform(collection, transformation, batchSize = this.BATCH_SIZE) {
        (0, utils_1.validatePath)(collection);
        const operation = async () => {
            const snapshot = await this.db.collection(collection).get();
            const docs = snapshot.docs;
            if (docs.length === 0) {
                return { converted: 0, batches: 0 };
            }
            const chunks = (0, utils_1.chunkArray)(docs, batchSize);
            let totalTransformed = 0;
            const errors = [];
            for (const chunk of chunks) {
                const batch = this.db.batch();
                for (const doc of chunk) {
                    try {
                        const data = doc.data();
                        const transformed = transformation({ id: doc.id, ...data });
                        batch.set(doc.ref, {
                            ...transformed,
                            updatedAt: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
                        });
                        totalTransformed++;
                    }
                    catch (error) {
                        errors.push({
                            id: doc.id,
                            error: error instanceof Error ? error.message : String(error),
                        });
                    }
                }
                await batch.commit();
            }
            return {
                converted: totalTransformed,
                batches: chunks.length,
                failed: errors.length,
                errors: errors.length > 0 ? errors : undefined,
            };
        };
        return this.withRetry(operation, "batchTransform");
    }
    async addFieldToAll(collection, field, value, batchSize = this.BATCH_SIZE) {
        (0, utils_1.validatePath)(collection);
        const operation = async () => {
            const snapshot = await this.db.collection(collection).get();
            const docs = snapshot.docs;
            if (docs.length === 0) {
                return { converted: 0, batches: 0 };
            }
            const chunks = (0, utils_1.chunkArray)(docs, batchSize);
            let totalUpdated = 0;
            for (const chunk of chunks) {
                const batch = this.db.batch();
                for (const doc of chunk) {
                    batch.update(doc.ref, {
                        [field]: value,
                        updatedAt: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
                    });
                    totalUpdated++;
                }
                await batch.commit();
            }
            return {
                converted: totalUpdated,
                batches: chunks.length,
            };
        };
        return this.withRetry(operation, "addFieldToAll");
    }
    async removeFieldFromAll(collection, field, batchSize = this.BATCH_SIZE) {
        (0, utils_1.validatePath)(collection);
        const operation = async () => {
            const snapshot = await this.db.collection(collection).get();
            const docs = snapshot.docs;
            if (docs.length === 0) {
                return { converted: 0, batches: 0 };
            }
            const chunks = (0, utils_1.chunkArray)(docs, batchSize);
            let totalUpdated = 0;
            for (const chunk of chunks) {
                const batch = this.db.batch();
                for (const doc of chunk) {
                    batch.update(doc.ref, {
                        [field]: firebase_admin_1.default.firestore.FieldValue.delete(),
                        updatedAt: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
                    });
                    totalUpdated++;
                }
                await batch.commit();
            }
            return {
                converted: totalUpdated,
                batches: chunks.length,
            };
        };
        return this.withRetry(operation, "removeFieldFromAll");
    }
    async renameField(collection, oldField, newField, batchSize = this.BATCH_SIZE) {
        (0, utils_1.validatePath)(collection);
        const operation = async () => {
            const snapshot = await this.db.collection(collection).get();
            const docs = snapshot.docs;
            if (docs.length === 0) {
                return { converted: 0, batches: 0 };
            }
            const chunks = (0, utils_1.chunkArray)(docs, batchSize);
            let totalUpdated = 0;
            const errors = [];
            for (const chunk of chunks) {
                const batch = this.db.batch();
                for (const doc of chunk) {
                    try {
                        const data = doc.data();
                        if (oldField in data) {
                            batch.update(doc.ref, {
                                [newField]: data[oldField],
                                [oldField]: firebase_admin_1.default.firestore.FieldValue.delete(),
                                updatedAt: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
                            });
                            totalUpdated++;
                        }
                    }
                    catch (error) {
                        errors.push({
                            id: doc.id,
                            error: error instanceof Error ? error.message : String(error),
                        });
                    }
                }
                await batch.commit();
            }
            return {
                converted: totalUpdated,
                batches: chunks.length,
                failed: errors.length,
                errors: errors.length > 0 ? errors : undefined,
            };
        };
        return this.withRetry(operation, "renameField");
    }
    async copyCollection(sourceCollection, targetCollection, batchSize = this.BATCH_SIZE) {
        (0, utils_1.validatePath)(sourceCollection);
        (0, utils_1.validatePath)(targetCollection);
        const operation = async () => {
            const snapshot = await this.db.collection(sourceCollection).get();
            const docs = snapshot.docs;
            if (docs.length === 0) {
                return { converted: 0, batches: 0 };
            }
            const chunks = (0, utils_1.chunkArray)(docs, batchSize);
            let totalCopied = 0;
            for (const chunk of chunks) {
                const batch = this.db.batch();
                for (const doc of chunk) {
                    const targetRef = this.db.collection(targetCollection).doc(doc.id);
                    batch.set(targetRef, doc.data());
                    totalCopied++;
                }
                await batch.commit();
            }
            return {
                converted: totalCopied,
                batches: chunks.length,
            };
        };
        return this.withRetry(operation, "copyCollection");
    }
    async validateMigration(collection, validator) {
        (0, utils_1.validatePath)(collection);
        const snapshot = await this.db.collection(collection).get();
        const docs = snapshot.docs;
        let validCount = 0;
        let invalidCount = 0;
        const errors = [];
        for (const doc of docs) {
            const data = doc.data();
            const result = validator({ id: doc.id, ...data });
            if (result.valid) {
                validCount++;
            }
            else {
                invalidCount++;
                if (result.errors) {
                    errors.push({ id: doc.id, errors: result.errors });
                }
            }
        }
        return {
            total: docs.length,
            valid: validCount,
            invalid: invalidCount,
            errors,
        };
    }
    async withRetry(operation, operationName) {
        if (!this.enableRetry || !this.retryConfig) {
            return operation();
        }
        return (0, utils_1.retryWithBackoff)(operation, this.retryConfig, operationName);
    }
}
exports.MigrationService = MigrationService;
//# sourceMappingURL=MigrationService.js.map