"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleCrudService = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const errors_1 = require("../../core/errors");
const sanitizer_1 = require("../../core/sanitizer");
const utils_1 = require("../../core/utils");
class SimpleCrudService {
    constructor(db, enableRetry = true, retryConfig) {
        this.db = db;
        this.enableRetry = enableRetry;
        this.retryConfig = retryConfig;
    }
    async create(collection, data) {
        (0, utils_1.validatePath)(collection);
        const operation = async () => {
            const sanitized = sanitizer_1.DataSanitizer.validateAndSanitize(data);
            const ref = this.db.collection(collection);
            const doc = await ref.add({
                ...sanitized,
                createdAt: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
            });
            return { id: doc.id, timestamp: new Date() };
        };
        return this.withRetry(operation, "create");
    }
    async set(collection, id, data, merge = false) {
        (0, utils_1.validatePath)(collection);
        (0, utils_1.validateId)(id);
        const operation = async () => {
            const sanitized = sanitizer_1.DataSanitizer.validateAndSanitize(data);
            const ref = this.db.collection(collection).doc(id);
            await ref.set({
                ...sanitized,
                updatedAt: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
            }, { merge });
            return { id, timestamp: new Date() };
        };
        return this.withRetry(operation, "set");
    }
    async read(collection, id) {
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
        return this.withRetry(operation, "read");
    }
    async update(collection, id, data) {
        (0, utils_1.validatePath)(collection);
        (0, utils_1.validateId)(id);
        const operation = async () => {
            const sanitized = sanitizer_1.DataSanitizer.validateAndSanitize(data);
            const ref = this.db.collection(collection).doc(id);
            const doc = await ref.get();
            if (!doc.exists) {
                throw new errors_1.DocumentNotFoundError(collection, id);
            }
            await ref.update({
                ...sanitized,
                updatedAt: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
            });
            return { id, timestamp: new Date() };
        };
        return this.withRetry(operation, "update");
    }
    async delete(collection, id) {
        (0, utils_1.validatePath)(collection);
        (0, utils_1.validateId)(id);
        const operation = async () => {
            await this.db.collection(collection).doc(id).delete();
            return { id, deleted: true, timestamp: new Date() };
        };
        return this.withRetry(operation, "delete");
    }
    async exists(collection, id) {
        (0, utils_1.validatePath)(collection);
        (0, utils_1.validateId)(id);
        const operation = async () => {
            const doc = await this.db.collection(collection).doc(id).get();
            return doc.exists;
        };
        return this.withRetry(operation, "exists");
    }
    async upsert(collection, id, data) {
        (0, utils_1.validatePath)(collection);
        (0, utils_1.validateId)(id);
        const operation = async () => {
            const sanitized = sanitizer_1.DataSanitizer.validateAndSanitize(data);
            const ref = this.db.collection(collection).doc(id);
            const doc = await ref.get();
            const exists = doc.exists;
            if (exists) {
                await ref.update({
                    ...sanitized,
                    updatedAt: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
                });
            }
            else {
                await ref.set({
                    ...sanitized,
                    createdAt: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
                });
            }
            return { id, exists, timestamp: new Date() };
        };
        return this.withRetry(operation, "upsert");
    }
    async list(collection) {
        (0, utils_1.validatePath)(collection);
        const operation = async () => {
            const snap = await this.db.collection(collection).get();
            return snap.docs.map((doc) => {
                const data = doc.data();
                const sanitized = sanitizer_1.DataSanitizer.sanitizeDocument(data);
                return { id: doc.id, ...sanitized };
            });
        };
        return this.withRetry(operation, "list");
    }
    async count(collection) {
        (0, utils_1.validatePath)(collection);
        const operation = async () => {
            const snap = await this.db.collection(collection).count().get();
            return snap.data().count;
        };
        return this.withRetry(operation, "count");
    }
    async findOne(collection, filters) {
        (0, utils_1.validatePath)(collection);
        const operation = async () => {
            let ref = this.db.collection(collection);
            for (const [key, value] of Object.entries(filters)) {
                ref = ref.where(key, "==", value);
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
        return this.withRetry(operation, "findOne");
    }
    async withRetry(operation, operationName) {
        if (!this.enableRetry || !this.retryConfig) {
            return operation();
        }
        return (0, utils_1.retryWithBackoff)(operation, this.retryConfig, operationName);
    }
}
exports.SimpleCrudService = SimpleCrudService;
//# sourceMappingURL=SimpleCrudService.js.map