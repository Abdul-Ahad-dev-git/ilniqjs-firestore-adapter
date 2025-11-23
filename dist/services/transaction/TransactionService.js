"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionService = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const sanitizer_1 = require("../../core/sanitizer");
const utils_1 = require("../../core/utils");
const errors_1 = require("../../core/errors");
class TransactionService {
    constructor(db, enableRetry = true, retryConfig) {
        this.db = db;
        this.enableRetry = enableRetry;
        this.retryConfig = retryConfig;
    }
    async runTransaction(operation) {
        const txOperation = async () => {
            return this.db.runTransaction(async (tx) => {
                try {
                    return await operation(tx);
                }
                catch (error) {
                    throw new errors_1.TransactionError("Transaction operation failed", { error: error instanceof Error ? error.message : String(error) });
                }
            });
        };
        return this.withRetry(txOperation, "runTransaction");
    }
    async atomicIncrement(collection, id, field, amount) {
        (0, utils_1.validatePath)(collection);
        (0, utils_1.validateId)(id);
        const operation = async () => {
            return this.db.runTransaction(async (tx) => {
                const ref = this.db.collection(collection).doc(id);
                const doc = await tx.get(ref);
                if (!doc.exists) {
                    throw new errors_1.DocumentNotFoundError(collection, id);
                }
                const currentValue = doc.data()?.[field] || 0;
                const newValue = currentValue + amount;
                tx.update(ref, {
                    [field]: newValue,
                    updatedAt: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
                });
                return { id, timestamp: new Date() };
            });
        };
        return this.withRetry(operation, "atomicIncrement");
    }
    async atomicDecrement(collection, id, field, amount, minValue) {
        (0, utils_1.validatePath)(collection);
        (0, utils_1.validateId)(id);
        const operation = async () => {
            return this.db.runTransaction(async (tx) => {
                const ref = this.db.collection(collection).doc(id);
                const doc = await tx.get(ref);
                if (!doc.exists) {
                    throw new errors_1.DocumentNotFoundError(collection, id);
                }
                const currentValue = doc.data()?.[field] || 0;
                const newValue = currentValue - amount;
                if (minValue !== undefined && newValue < minValue) {
                    throw new errors_1.TransactionError(`Cannot decrement ${field} below ${minValue}`, { currentValue, amount, minValue });
                }
                tx.update(ref, {
                    [field]: newValue,
                    updatedAt: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
                });
                return { id, timestamp: new Date() };
            });
        };
        return this.withRetry(operation, "atomicDecrement");
    }
    async atomicTransfer(fromCollection, fromId, toCollection, toId, field, amount) {
        (0, utils_1.validatePath)(fromCollection);
        (0, utils_1.validatePath)(toCollection);
        (0, utils_1.validateId)(fromId);
        (0, utils_1.validateId)(toId);
        const operation = async () => {
            return this.db.runTransaction(async (tx) => {
                const fromRef = this.db.collection(fromCollection).doc(fromId);
                const toRef = this.db.collection(toCollection).doc(toId);
                const [fromDoc, toDoc] = await Promise.all([
                    tx.get(fromRef),
                    tx.get(toRef),
                ]);
                if (!fromDoc.exists) {
                    throw new errors_1.DocumentNotFoundError(fromCollection, fromId);
                }
                if (!toDoc.exists) {
                    throw new errors_1.DocumentNotFoundError(toCollection, toId);
                }
                const fromValue = fromDoc.data()?.[field] || 0;
                const toValue = toDoc.data()?.[field] || 0;
                if (fromValue < amount) {
                    throw new errors_1.TransactionError(`Insufficient ${field} in source document`, { fromValue, amount });
                }
                const timestamp = firebase_admin_1.default.firestore.FieldValue.serverTimestamp();
                tx.update(fromRef, {
                    [field]: fromValue - amount,
                    updatedAt: timestamp,
                });
                tx.update(toRef, {
                    [field]: toValue + amount,
                    updatedAt: timestamp,
                });
                return {
                    from: { id: fromId, timestamp: new Date() },
                    to: { id: toId, timestamp: new Date() },
                };
            });
        };
        return this.withRetry(operation, "atomicTransfer");
    }
    async conditionalUpdate(collection, id, condition, updates) {
        (0, utils_1.validatePath)(collection);
        (0, utils_1.validateId)(id);
        const operation = async () => {
            return this.db.runTransaction(async (tx) => {
                const ref = this.db.collection(collection).doc(id);
                const doc = await tx.get(ref);
                if (!doc.exists) {
                    throw new errors_1.DocumentNotFoundError(collection, id);
                }
                const data = doc.data();
                if (!condition(data)) {
                    return { updated: false };
                }
                const sanitized = sanitizer_1.DataSanitizer.validateAndSanitize(updates);
                tx.update(ref, {
                    ...sanitized,
                    updatedAt: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
                });
                return {
                    updated: true,
                    result: { id, timestamp: new Date() },
                };
            });
        };
        return this.withRetry(operation, "conditionalUpdate");
    }
    async readModifyWrite(collection, id, modifier) {
        (0, utils_1.validatePath)(collection);
        (0, utils_1.validateId)(id);
        const operation = async () => {
            return this.db.runTransaction(async (tx) => {
                const ref = this.db.collection(collection).doc(id);
                const doc = await tx.get(ref);
                if (!doc.exists) {
                    throw new errors_1.DocumentNotFoundError(collection, id);
                }
                const currentData = doc.data();
                const updates = modifier(currentData);
                const sanitized = sanitizer_1.DataSanitizer.validateAndSanitize(updates);
                tx.update(ref, {
                    ...sanitized,
                    updatedAt: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
                });
                return { id, timestamp: new Date() };
            });
        };
        return this.withRetry(operation, "readModifyWrite");
    }
    async transactionalBatchRead(refs) {
        refs.forEach((ref) => {
            (0, utils_1.validatePath)(ref.collection);
            (0, utils_1.validateId)(ref.id);
        });
        const operation = async () => {
            return this.db.runTransaction(async (tx) => {
                const docRefs = refs.map((ref) => this.db.collection(ref.collection).doc(ref.id));
                const docs = await Promise.all(docRefs.map((ref) => tx.get(ref)));
                return docs.map((doc, index) => {
                    if (!doc.exists) {
                        return null;
                    }
                    const data = doc.data();
                    const sanitized = sanitizer_1.DataSanitizer.sanitizeDocument(data);
                    return { id: refs[index].id, ...sanitized };
                });
            });
        };
        return this.withRetry(operation, "transactionalBatchRead");
    }
    async compareAndSwap(collection, id, field, expectedValue, newValue) {
        (0, utils_1.validatePath)(collection);
        (0, utils_1.validateId)(id);
        const operation = async () => {
            return this.db.runTransaction(async (tx) => {
                const ref = this.db.collection(collection).doc(id);
                const doc = await tx.get(ref);
                if (!doc.exists) {
                    throw new errors_1.DocumentNotFoundError(collection, id);
                }
                const data = doc.data();
                const currentValue = data[field];
                if (currentValue !== expectedValue) {
                    return { swapped: false, currentValue };
                }
                tx.update(ref, {
                    [field]: newValue,
                    updatedAt: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
                });
                return { swapped: true };
            });
        };
        return this.withRetry(operation, "compareAndSwap");
    }
    async withRetry(operation, operationName) {
        if (!this.enableRetry || !this.retryConfig) {
            return operation();
        }
        return (0, utils_1.retryWithBackoff)(operation, this.retryConfig, operationName);
    }
}
exports.TransactionService = TransactionService;
//# sourceMappingURL=TransactionService.js.map