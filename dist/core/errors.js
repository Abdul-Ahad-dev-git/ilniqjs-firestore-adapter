"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheError = exports.EdgeRuntimeError = exports.RetryExhaustedError = exports.MigrationError = exports.ValidationError = exports.BatchOperationError = exports.TransactionError = exports.QueryError = exports.DocumentNotFoundError = exports.ConnectionError = exports.ConfigurationError = exports.FirestoreAdapterError = void 0;
class FirestoreAdapterError extends Error {
    constructor(message, code, context) {
        super(message);
        this.code = code;
        this.context = context;
        this.name = "FirestoreAdapterError";
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.FirestoreAdapterError = FirestoreAdapterError;
class ConfigurationError extends FirestoreAdapterError {
    constructor(message, context) {
        super(message, "CONFIGURATION_ERROR", context);
        this.name = "ConfigurationError";
    }
}
exports.ConfigurationError = ConfigurationError;
class ConnectionError extends FirestoreAdapterError {
    constructor(message, context) {
        super(message, "CONNECTION_ERROR", context);
        this.name = "ConnectionError";
    }
}
exports.ConnectionError = ConnectionError;
class DocumentNotFoundError extends FirestoreAdapterError {
    constructor(collection, id) {
        super(`Document not found: ${collection}/${id}`, "DOCUMENT_NOT_FOUND", { collection, id });
        this.name = "DocumentNotFoundError";
    }
}
exports.DocumentNotFoundError = DocumentNotFoundError;
class QueryError extends FirestoreAdapterError {
    constructor(message, context) {
        super(message, "QUERY_ERROR", context);
        this.name = "QueryError";
    }
}
exports.QueryError = QueryError;
class TransactionError extends FirestoreAdapterError {
    constructor(message, context) {
        super(message, "TRANSACTION_ERROR", context);
        this.name = "TransactionError";
    }
}
exports.TransactionError = TransactionError;
class BatchOperationError extends FirestoreAdapterError {
    constructor(message, failedOperations, context) {
        super(message, "BATCH_OPERATION_ERROR", context);
        this.failedOperations = failedOperations;
        this.name = "BatchOperationError";
    }
}
exports.BatchOperationError = BatchOperationError;
class ValidationError extends FirestoreAdapterError {
    constructor(message, context) {
        super(message, "VALIDATION_ERROR", context);
        this.name = "ValidationError";
    }
}
exports.ValidationError = ValidationError;
class MigrationError extends FirestoreAdapterError {
    constructor(message, context) {
        super(message, "MIGRATION_ERROR", context);
        this.name = "MigrationError";
    }
}
exports.MigrationError = MigrationError;
class RetryExhaustedError extends FirestoreAdapterError {
    constructor(operation, attempts, lastError) {
        super(`Operation "${operation}" failed after ${attempts} retries`, "RETRY_EXHAUSTED", { operation, attempts, lastError: lastError.message });
        this.name = "RetryExhaustedError";
    }
}
exports.RetryExhaustedError = RetryExhaustedError;
class EdgeRuntimeError extends FirestoreAdapterError {
    constructor() {
        super("Firestore Admin SDK cannot run in Edge runtime. Use standard Node.js runtime.", "EDGE_RUNTIME_ERROR");
        this.name = "EdgeRuntimeError";
    }
}
exports.EdgeRuntimeError = EdgeRuntimeError;
class CacheError extends FirestoreAdapterError {
    constructor(message, context) {
        super(message, "CACHE_ERROR", context);
        this.name = "CacheError";
    }
}
exports.CacheError = CacheError;
//# sourceMappingURL=errors.js.map