"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryService = void 0;
const sanitizer_1 = require("../../core/sanitizer");
const utils_1 = require("../../core/utils");
class QueryService {
    constructor(db, enableRetry = true, retryConfig) {
        this.db = db;
        this.enableRetry = enableRetry;
        this.retryConfig = retryConfig;
    }
    async query(collection, filters) {
        (0, utils_1.validatePath)(collection);
        const operation = async () => {
            let ref = this.db.collection(collection);
            for (const [key, value] of Object.entries(filters)) {
                ref = ref.where(key, "==", value);
            }
            const snap = await ref.get();
            return snap.docs.map((doc) => {
                const data = doc.data();
                const sanitized = sanitizer_1.DataSanitizer.sanitizeDocument(data);
                return { id: doc.id, ...sanitized };
            });
        };
        return this.withRetry(operation, "query");
    }
    async queryAdvanced(collection, filters) {
        (0, utils_1.validatePath)(collection);
        const operation = async () => {
            let ref = this.db.collection(collection);
            for (const filter of filters) {
                ref = ref.where(filter.field, filter.op, filter.value);
            }
            const snap = await ref.get();
            return snap.docs.map((doc) => {
                const data = doc.data();
                const sanitized = sanitizer_1.DataSanitizer.sanitizeDocument(data);
                return { id: doc.id, ...sanitized };
            });
        };
        return this.withRetry(operation, "queryAdvanced");
    }
    async queryOrdered(collection, filters, orderField, direction = "asc") {
        (0, utils_1.validatePath)(collection);
        const operation = async () => {
            let ref = this.db.collection(collection);
            for (const [key, value] of Object.entries(filters)) {
                ref = ref.where(key, "==", value);
            }
            ref = ref.orderBy(orderField, direction);
            const snap = await ref.get();
            return snap.docs.map((doc) => {
                const data = doc.data();
                const sanitized = sanitizer_1.DataSanitizer.sanitizeDocument(data);
                return { id: doc.id, ...sanitized };
            });
        };
        return this.withRetry(operation, "queryOrdered");
    }
    async queryOrderedAdvanced(collection, filters, orderField, direction = "asc") {
        (0, utils_1.validatePath)(collection);
        const operation = async () => {
            let ref = this.db.collection(collection);
            for (const filter of filters) {
                ref = ref.where(filter.field, filter.op, filter.value);
            }
            ref = ref.orderBy(orderField, direction);
            const snap = await ref.get();
            return snap.docs.map((doc) => {
                const data = doc.data();
                const sanitized = sanitizer_1.DataSanitizer.sanitizeDocument(data);
                return { id: doc.id, ...sanitized };
            });
        };
        return this.withRetry(operation, "queryOrderedAdvanced");
    }
    async queryPaginated(collection, filters, limit, startAfter) {
        (0, utils_1.validatePath)(collection);
        const operation = async () => {
            let ref = this.db.collection(collection);
            for (const [key, value] of Object.entries(filters)) {
                ref = ref.where(key, "==", value);
            }
            ref = ref.limit(limit);
            if (startAfter) {
                ref = ref.startAfter(startAfter);
            }
            const snap = await ref.get();
            const docs = snap.docs.map((doc) => {
                const data = doc.data();
                const sanitized = sanitizer_1.DataSanitizer.sanitizeDocument(data);
                return { id: doc.id, ...sanitized };
            });
            return {
                docs,
                lastDoc: snap.docs[snap.docs.length - 1],
                hasMore: snap.docs.length === limit,
            };
        };
        return this.withRetry(operation, "queryPaginated");
    }
    async queryPaginatedAdvanced(collection, filters, limit, startAfter) {
        (0, utils_1.validatePath)(collection);
        const operation = async () => {
            let ref = this.db.collection(collection);
            for (const filter of filters) {
                ref = ref.where(filter.field, filter.op, filter.value);
            }
            ref = ref.limit(limit);
            if (startAfter) {
                ref = ref.startAfter(startAfter);
            }
            const snap = await ref.get();
            const docs = snap.docs.map((doc) => {
                const data = doc.data();
                const sanitized = sanitizer_1.DataSanitizer.sanitizeDocument(data);
                return { id: doc.id, ...sanitized };
            });
            return {
                docs,
                lastDoc: snap.docs[snap.docs.length - 1],
                hasMore: snap.docs.length === limit,
            };
        };
        return this.withRetry(operation, "queryPaginatedAdvanced");
    }
    async findOneAdvanced(collection, filters) {
        (0, utils_1.validatePath)(collection);
        const operation = async () => {
            let ref = this.db.collection(collection);
            for (const filter of filters) {
                ref = ref.where(filter.field, filter.op, filter.value);
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
        return this.withRetry(operation, "findOneAdvanced");
    }
    async countWhere(collection, filters) {
        (0, utils_1.validatePath)(collection);
        const operation = async () => {
            let ref = this.db.collection(collection);
            for (const [key, value] of Object.entries(filters)) {
                ref = ref.where(key, "==", value);
            }
            const snap = await ref.count().get();
            return snap.data().count;
        };
        return this.withRetry(operation, "countWhere");
    }
    async countWhereAdvanced(collection, filters) {
        (0, utils_1.validatePath)(collection);
        const operation = async () => {
            let ref = this.db.collection(collection);
            for (const filter of filters) {
                ref = ref.where(filter.field, filter.op, filter.value);
            }
            const snap = await ref.count().get();
            return snap.data().count;
        };
        return this.withRetry(operation, "countWhereAdvanced");
    }
    async queryWithOptions(collection, filters, options) {
        (0, utils_1.validatePath)(collection);
        const operation = async () => {
            let ref = this.db.collection(collection);
            for (const filter of filters) {
                ref = ref.where(filter.field, filter.op, filter.value);
            }
            if (options.orderBy) {
                ref = ref.orderBy(options.orderBy, options.direction || "asc");
            }
            if (options.limit) {
                ref = ref.limit(options.limit);
            }
            if (options.startAfter) {
                ref = ref.startAfter(options.startAfter);
            }
            else if (options.startAt) {
                ref = ref.startAt(options.startAt);
            }
            if (options.endBefore) {
                ref = ref.endBefore(options.endBefore);
            }
            else if (options.endAt) {
                ref = ref.endAt(options.endAt);
            }
            const snap = await ref.get();
            return snap.docs.map((doc) => {
                const data = doc.data();
                const sanitized = sanitizer_1.DataSanitizer.sanitizeDocument(data);
                return { id: doc.id, ...sanitized };
            });
        };
        return this.withRetry(operation, "queryWithOptions");
    }
    async withRetry(operation, operationName) {
        if (!this.enableRetry || !this.retryConfig) {
            return operation();
        }
        return (0, utils_1.retryWithBackoff)(operation, this.retryConfig, operationName);
    }
}
exports.QueryService = QueryService;
//# sourceMappingURL=QueryService.js.map