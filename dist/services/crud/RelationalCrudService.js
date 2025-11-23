"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelationalCrudService = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const errors_1 = require("../../core/errors");
const sanitizer_1 = require("../../core/sanitizer");
const utils_1 = require("../../core/utils");
class RelationalCrudService {
    constructor(db, enableRetry = true, retryConfig) {
        this.db = db;
        this.enableRetry = enableRetry;
        this.retryConfig = retryConfig;
    }
    async createRelational(collection, data, refs = {}, docId) {
        (0, utils_1.validatePath)(collection);
        if (docId)
            (0, utils_1.validateId)(docId);
        const operation = async () => {
            const sanitizedData = sanitizer_1.DataSanitizer.validateAndSanitize(data);
            const docData = {
                data: sanitizedData,
                refs,
                createdAt: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
            };
            if (docId) {
                const ref = this.db.collection(collection).doc(docId);
                await ref.set(docData);
                return { id: docId, timestamp: new Date() };
            }
            else {
                const ref = this.db.collection(collection);
                const doc = await ref.add(docData);
                return { id: doc.id, timestamp: new Date() };
            }
        };
        return this.withRetry(operation, "createRelational");
    }
    async setRelational(collection, id, data, refs = {}, merge = false) {
        (0, utils_1.validatePath)(collection);
        (0, utils_1.validateId)(id);
        const operation = async () => {
            const sanitizedData = sanitizer_1.DataSanitizer.validateAndSanitize(data);
            const docData = {
                data: sanitizedData,
                refs,
                updatedAt: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
            };
            const ref = this.db.collection(collection).doc(id);
            await ref.set(docData, { merge });
            return { id, timestamp: new Date() };
        };
        return this.withRetry(operation, "setRelational");
    }
    async readRelational(collection, id) {
        (0, utils_1.validatePath)(collection);
        (0, utils_1.validateId)(id);
        const operation = async () => {
            const doc = await this.db.collection(collection).doc(id).get();
            if (!doc.exists) {
                return null;
            }
            const data = doc.data();
            const sanitized = sanitizer_1.DataSanitizer.sanitizeDocument(data);
            return { id: doc.id, ...sanitized };
        };
        return this.withRetry(operation, "readRelational");
    }
    async readFlattened(collection, id) {
        const doc = await this.readRelational(collection, id);
        if (!doc)
            return null;
        return {
            id: doc.id,
            ...doc.data,
            ...doc.refs,
        };
    }
    async updateData(collection, id, updates) {
        (0, utils_1.validatePath)(collection);
        (0, utils_1.validateId)(id);
        const operation = async () => {
            const ref = this.db.collection(collection).doc(id);
            const doc = await ref.get();
            if (!doc.exists) {
                throw new errors_1.DocumentNotFoundError(collection, id);
            }
            const nestedUpdates = {};
            for (const [key, value] of Object.entries(updates)) {
                nestedUpdates[`data.${key}`] = value;
            }
            await ref.update({
                ...nestedUpdates,
                updatedAt: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
            });
            return { id, timestamp: new Date() };
        };
        return this.withRetry(operation, "updateData");
    }
    async updateRefs(collection, id, refs) {
        (0, utils_1.validatePath)(collection);
        (0, utils_1.validateId)(id);
        const operation = async () => {
            const ref = this.db.collection(collection).doc(id);
            const doc = await ref.get();
            if (!doc.exists) {
                throw new errors_1.DocumentNotFoundError(collection, id);
            }
            const nestedRefs = {};
            for (const [key, value] of Object.entries(refs)) {
                nestedRefs[`refs.${key}`] = value;
            }
            await ref.update({
                ...nestedRefs,
                updatedAt: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
            });
            return { id, timestamp: new Date() };
        };
        return this.withRetry(operation, "updateRefs");
    }
    async updateRelational(collection, id, dataUpdates, refUpdates) {
        (0, utils_1.validatePath)(collection);
        (0, utils_1.validateId)(id);
        const operation = async () => {
            const ref = this.db.collection(collection).doc(id);
            const doc = await ref.get();
            if (!doc.exists) {
                throw new errors_1.DocumentNotFoundError(collection, id);
            }
            const updates = {
                updatedAt: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
            };
            if (dataUpdates) {
                for (const [key, value] of Object.entries(dataUpdates)) {
                    updates[`data.${key}`] = value;
                }
            }
            if (refUpdates) {
                for (const [key, value] of Object.entries(refUpdates)) {
                    updates[`refs.${key}`] = value;
                }
            }
            await ref.update(updates);
            return { id, timestamp: new Date() };
        };
        return this.withRetry(operation, "updateRelational");
    }
    async queryByRef(collection, refKey, refValue) {
        (0, utils_1.validatePath)(collection);
        const operation = async () => {
            const ref = this.db.collection(collection).where(`refs.${refKey}`, "==", refValue);
            const snap = await ref.get();
            return snap.docs.map((doc) => {
                const data = doc.data();
                const sanitized = sanitizer_1.DataSanitizer.sanitizeDocument(data);
                return { id: doc.id, ...sanitized };
            });
        };
        return this.withRetry(operation, "queryByRef");
    }
    async queryByRefWithData(collection, refKey, refValue, dataFilters) {
        (0, utils_1.validatePath)(collection);
        const operation = async () => {
            let ref = this.db.collection(collection).where(`refs.${refKey}`, "==", refValue);
            for (const [key, value] of Object.entries(dataFilters)) {
                ref = ref.where(`data.${key}`, "==", value);
            }
            const snap = await ref.get();
            return snap.docs.map((doc) => {
                const data = doc.data();
                const sanitized = sanitizer_1.DataSanitizer.sanitizeDocument(data);
                return { id: doc.id, ...sanitized };
            });
        };
        return this.withRetry(operation, "queryByRefWithData");
    }
    async queryByRefs(collection, refs) {
        (0, utils_1.validatePath)(collection);
        const operation = async () => {
            let ref = this.db.collection(collection);
            for (const [key, value] of Object.entries(refs)) {
                ref = ref.where(`refs.${key}`, "==", value);
            }
            const snap = await ref.get();
            return snap.docs.map((doc) => {
                const data = doc.data();
                const sanitized = sanitizer_1.DataSanitizer.sanitizeDocument(data);
                return { id: doc.id, ...sanitized };
            });
        };
        return this.withRetry(operation, "queryByRefs");
    }
    async queryByRefsWithData(collection, refs, dataFilters) {
        (0, utils_1.validatePath)(collection);
        const operation = async () => {
            let ref = this.db.collection(collection);
            for (const [key, value] of Object.entries(refs)) {
                ref = ref.where(`refs.${key}`, "==", value);
            }
            for (const [key, value] of Object.entries(dataFilters)) {
                ref = ref.where(`data.${key}`, "==", value);
            }
            const snap = await ref.get();
            return snap.docs.map((doc) => {
                const data = doc.data();
                const sanitized = sanitizer_1.DataSanitizer.sanitizeDocument(data);
                return { id: doc.id, ...sanitized };
            });
        };
        return this.withRetry(operation, "queryByRefsWithData");
    }
    async queryByRefFlattened(collection, refKey, refValue) {
        const results = await this.queryByRef(collection, refKey, refValue);
        return results.map((doc) => ({
            id: doc.id,
            ...doc.data,
            ...doc.refs,
        }));
    }
    async countByRef(collection, refKey, refValue) {
        (0, utils_1.validatePath)(collection);
        const operation = async () => {
            const ref = this.db.collection(collection).where(`refs.${refKey}`, "==", refValue);
            const snap = await ref.count().get();
            return snap.data().count;
        };
        return this.withRetry(operation, "countByRef");
    }
    async relationExists(collection, refs) {
        (0, utils_1.validatePath)(collection);
        const operation = async () => {
            let ref = this.db.collection(collection);
            for (const [key, value] of Object.entries(refs)) {
                ref = ref.where(`refs.${key}`, "==", value);
            }
            const snap = await ref.limit(1).get();
            return !snap.empty;
        };
        return this.withRetry(operation, "relationExists");
    }
    async findOneByRefs(collection, refs) {
        (0, utils_1.validatePath)(collection);
        const operation = async () => {
            let ref = this.db.collection(collection);
            for (const [key, value] of Object.entries(refs)) {
                ref = ref.where(`refs.${key}`, "==", value);
            }
            const snap = await ref.limit(1).get();
            if (snap.empty) {
                return null;
            }
            const doc = snap.docs[0];
            const data = doc.data();
            const sanitized = sanitizer_1.DataSanitizer.sanitizeDocument(data);
            return { id: doc.id, ...sanitized };
        };
        return this.withRetry(operation, "findOneByRefs");
    }
    async findOrCreateWithRefs(collection, data, refs) {
        const existing = await this.findOneByRefs(collection, refs);
        if (existing) {
            return { id: existing.id, created: false, doc: existing };
        }
        const result = await this.createRelational(collection, data, refs);
        const newDoc = await this.readRelational(collection, result.id);
        if (!newDoc) {
            throw new Error("Failed to read newly created document");
        }
        return { id: result.id, created: true, doc: newDoc };
    }
    async upsertWithRefs(collection, data, refs) {
        const existing = await this.findOneByRefs(collection, refs);
        if (existing) {
            await this.updateData(collection, existing.id, data);
            return { id: existing.id, created: false };
        }
        const result = await this.createRelational(collection, data, refs);
        return { id: result.id, created: true };
    }
    async toggleRelation(collection, data, refs) {
        const existing = await this.findOneByRefs(collection, refs);
        if (existing) {
            await this.db.collection(collection).doc(existing.id).delete();
            return { id: existing.id, action: "deleted" };
        }
        const result = await this.createRelational(collection, data, refs);
        return { id: result.id, action: "created" };
    }
    async deleteByRef(collection, refKey, refValue, batchSize = 500) {
        (0, utils_1.validatePath)(collection);
        const query = this.db
            .collection(collection)
            .where(`refs.${refKey}`, "==", refValue)
            .limit(batchSize);
        return new Promise((resolve, reject) => {
            this.deleteQueryBatch(query, resolve, reject, 0, 0);
        });
    }
    deleteQueryBatch(query, resolve, reject, deletedCount, batchCount) {
        query
            .get()
            .then((snapshot) => {
            if (snapshot.size === 0) {
                return resolve({ deleted: deletedCount, batches: batchCount });
            }
            const batch = this.db.batch();
            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });
            return batch.commit().then(() => {
                const newCount = deletedCount + snapshot.size;
                process.nextTick(() => {
                    this.deleteQueryBatch(query, resolve, reject, newCount, batchCount + 1);
                });
            });
        })
            .catch(reject);
    }
    async getRelated(parentCollection, parentId, childCollection, relationKey) {
        const parent = await this.readRelational(parentCollection, parentId);
        const children = await this.queryByRef(childCollection, relationKey, parentId);
        return { parent, children };
    }
    async cascadeDeleteRelational(parentCollection, parentId, cascadeRules) {
        const childrenDeleted = {};
        for (const rule of cascadeRules) {
            const result = await this.deleteByRef(rule.collection, rule.refKey, parentId);
            childrenDeleted[rule.collection] = result.deleted;
        }
        await this.db.collection(parentCollection).doc(parentId).delete();
        return {
            deleted: 1,
            children: childrenDeleted,
        };
    }
    async batchCreateRelational(collection, documents) {
        (0, utils_1.validatePath)(collection);
        const operation = async () => {
            const batch = this.db.batch();
            const ids = [];
            for (const doc of documents) {
                const ref = this.db.collection(collection).doc();
                const sanitizedData = sanitizer_1.DataSanitizer.validateAndSanitize(doc.data);
                const docData = {
                    data: sanitizedData,
                    refs: doc.refs,
                    createdAt: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
                };
                batch.set(ref, docData);
                ids.push(ref.id);
            }
            await batch.commit();
            return { success: true, count: documents.length, ids };
        };
        return this.withRetry(operation, "batchCreateRelational");
    }
    async aggregateCountByParent(collection, refKey, parentIds) {
        const counts = {};
        await Promise.all(parentIds.map(async (parentId) => {
            const count = await this.countByRef(collection, refKey, parentId);
            counts[parentId] = count;
        }));
        return counts;
    }
    async withRetry(operation, operationName) {
        if (!this.enableRetry || !this.retryConfig) {
            return operation();
        }
        return (0, utils_1.retryWithBackoff)(operation, this.retryConfig, operationName);
    }
}
exports.RelationalCrudService = RelationalCrudService;
//# sourceMappingURL=RelationalCrudService.js.map