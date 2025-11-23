"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BatchService = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const sanitizer_1 = require("../../core/sanitizer");
const utils_1 = require("../../core/utils");
const errors_1 = require("../../core/errors");
class BatchService {
    constructor(db, enableRetry = true, retryConfig) {
        this.db = db;
        this.enableRetry = enableRetry;
        this.retryConfig = retryConfig;
        this.MAX_BATCH_SIZE = 500;
    }
    async batchCreate(collection, documents) {
        (0, utils_1.validatePath)(collection);
        const operation = async () => {
            const chunks = (0, utils_1.chunkArray)(documents, this.MAX_BATCH_SIZE);
            const allIds = [];
            const failed = [];
            for (const chunk of chunks) {
                const batch = this.db.batch();
                const chunkIds = [];
                for (const doc of chunk) {
                    try {
                        const ref = this.db.collection(collection).doc();
                        const sanitized = sanitizer_1.DataSanitizer.validateAndSanitize(doc);
                        batch.set(ref, {
                            ...sanitized,
                            createdAt: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
                        });
                        chunkIds.push(ref.id);
                    }
                    catch (error) {
                        failed.push({
                            id: "unknown",
                            error: error instanceof Error ? error.message : String(error),
                        });
                    }
                }
                try {
                    await batch.commit();
                    allIds.push(...chunkIds);
                }
                catch (error) {
                    chunkIds.forEach((id) => {
                        failed.push({
                            id,
                            error: error instanceof Error ? error.message : String(error),
                        });
                    });
                }
            }
            if (failed.length > 0 && allIds.length === 0) {
                throw new errors_1.BatchOperationError("All batch create operations failed", failed);
            }
            return {
                success: failed.length === 0,
                count: allIds.length,
                ids: allIds,
                failed: failed.length > 0 ? failed : undefined,
            };
        };
        return this.withRetry(operation, "batchCreate");
    }
    async batchSet(collection, documents) {
        (0, utils_1.validatePath)(collection);
        const operation = async () => {
            const chunks = (0, utils_1.chunkArray)(documents, this.MAX_BATCH_SIZE);
            const allIds = [];
            const failed = [];
            for (const chunk of chunks) {
                const batch = this.db.batch();
                for (const item of chunk) {
                    try {
                        (0, utils_1.validateId)(item.id);
                        const ref = this.db.collection(collection).doc(item.id);
                        const sanitized = sanitizer_1.DataSanitizer.validateAndSanitize(item.data);
                        batch.set(ref, {
                            ...sanitized,
                            updatedAt: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
                        }, { merge: item.merge || false });
                        allIds.push(item.id);
                    }
                    catch (error) {
                        failed.push({
                            id: item.id,
                            error: error instanceof Error ? error.message : String(error),
                        });
                    }
                }
                try {
                    await batch.commit();
                }
                catch (error) {
                    chunk.forEach((item) => {
                        if (!failed.find((f) => f.id === item.id)) {
                            failed.push({
                                id: item.id,
                                error: error instanceof Error ? error.message : String(error),
                            });
                        }
                    });
                }
            }
            return {
                success: failed.length === 0,
                count: allIds.length - failed.length,
                ids: allIds,
                failed: failed.length > 0 ? failed : undefined,
            };
        };
        return this.withRetry(operation, "batchSet");
    }
    async batchUpdate(collection, updates) {
        (0, utils_1.validatePath)(collection);
        const operation = async () => {
            const chunks = (0, utils_1.chunkArray)(updates, this.MAX_BATCH_SIZE);
            const allIds = [];
            const failed = [];
            for (const chunk of chunks) {
                const batch = this.db.batch();
                for (const item of chunk) {
                    try {
                        (0, utils_1.validateId)(item.id);
                        const ref = this.db.collection(collection).doc(item.id);
                        const sanitized = sanitizer_1.DataSanitizer.validateAndSanitize(item.data);
                        batch.update(ref, {
                            ...sanitized,
                            updatedAt: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
                        });
                        allIds.push(item.id);
                    }
                    catch (error) {
                        failed.push({
                            id: item.id,
                            error: error instanceof Error ? error.message : String(error),
                        });
                    }
                }
                try {
                    await batch.commit();
                }
                catch (error) {
                    chunk.forEach((item) => {
                        if (!failed.find((f) => f.id === item.id)) {
                            failed.push({
                                id: item.id,
                                error: error instanceof Error ? error.message : String(error),
                            });
                        }
                    });
                }
            }
            return {
                success: failed.length === 0,
                count: allIds.length - failed.length,
                ids: allIds,
                failed: failed.length > 0 ? failed : undefined,
            };
        };
        return this.withRetry(operation, "batchUpdate");
    }
    async batchDelete(collection, ids) {
        (0, utils_1.validatePath)(collection);
        const operation = async () => {
            const chunks = (0, utils_1.chunkArray)(ids, this.MAX_BATCH_SIZE);
            let deletedCount = 0;
            const failed = [];
            for (const chunk of chunks) {
                const batch = this.db.batch();
                for (const id of chunk) {
                    try {
                        (0, utils_1.validateId)(id);
                        const ref = this.db.collection(collection).doc(id);
                        batch.delete(ref);
                    }
                    catch (error) {
                        failed.push({
                            id,
                            error: error instanceof Error ? error.message : String(error),
                        });
                    }
                }
                try {
                    await batch.commit();
                    deletedCount += chunk.length - failed.filter((f) => chunk.includes(f.id)).length;
                }
                catch (error) {
                    chunk.forEach((id) => {
                        if (!failed.find((f) => f.id === id)) {
                            failed.push({
                                id,
                                error: error instanceof Error ? error.message : String(error),
                            });
                        }
                    });
                }
            }
            return {
                success: failed.length === 0,
                count: deletedCount,
                ids,
                failed: failed.length > 0 ? failed : undefined,
            };
        };
        return this.withRetry(operation, "batchDelete");
    }
    async deleteCollection(collection, batchSize = 500) {
        (0, utils_1.validatePath)(collection);
        const operation = async () => {
            const collectionRef = this.db.collection(collection);
            let totalDeleted = 0;
            let batchCount = 0;
            while (true) {
                const snapshot = await collectionRef.limit(batchSize).get();
                if (snapshot.size === 0) {
                    break;
                }
                const batch = this.db.batch();
                snapshot.docs.forEach((doc) => {
                    batch.delete(doc.ref);
                });
                await batch.commit();
                totalDeleted += snapshot.size;
                batchCount++;
                if (snapshot.size < batchSize) {
                    break;
                }
            }
            return { deleted: totalDeleted, batches: batchCount };
        };
        return this.withRetry(operation, "deleteCollection");
    }
    async batchIncrement(collection, updates) {
        (0, utils_1.validatePath)(collection);
        const operation = async () => {
            const chunks = (0, utils_1.chunkArray)(updates, this.MAX_BATCH_SIZE);
            const allIds = [];
            const failed = [];
            for (const chunk of chunks) {
                const batch = this.db.batch();
                for (const item of chunk) {
                    try {
                        (0, utils_1.validateId)(item.id);
                        const ref = this.db.collection(collection).doc(item.id);
                        batch.update(ref, {
                            [item.field]: firebase_admin_1.default.firestore.FieldValue.increment(item.amount),
                            updatedAt: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
                        });
                        allIds.push(item.id);
                    }
                    catch (error) {
                        failed.push({
                            id: item.id,
                            error: error instanceof Error ? error.message : String(error),
                        });
                    }
                }
                try {
                    await batch.commit();
                }
                catch (error) {
                    chunk.forEach((item) => {
                        if (!failed.find((f) => f.id === item.id)) {
                            failed.push({
                                id: item.id,
                                error: error instanceof Error ? error.message : String(error),
                            });
                        }
                    });
                }
            }
            return {
                success: failed.length === 0,
                count: allIds.length - failed.length,
                ids: allIds,
                failed: failed.length > 0 ? failed : undefined,
            };
        };
        return this.withRetry(operation, "batchIncrement");
    }
    async withRetry(operation, operationName) {
        if (!this.enableRetry || !this.retryConfig) {
            return operation();
        }
        return (0, utils_1.retryWithBackoff)(operation, this.retryConfig, operationName);
    }
}
exports.BatchService = BatchService;
//# sourceMappingURL=BatchService.js.map