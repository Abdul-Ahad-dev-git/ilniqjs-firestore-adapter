export declare class FirestoreAdapterError extends Error {
    readonly code: string;
    readonly context?: Record<string, any> | undefined;
    constructor(message: string, code: string, context?: Record<string, any> | undefined);
}
export declare class ConfigurationError extends FirestoreAdapterError {
    constructor(message: string, context?: Record<string, any>);
}
export declare class ConnectionError extends FirestoreAdapterError {
    constructor(message: string, context?: Record<string, any>);
}
export declare class DocumentNotFoundError extends FirestoreAdapterError {
    constructor(collection: string, id: string);
}
export declare class QueryError extends FirestoreAdapterError {
    constructor(message: string, context?: Record<string, any>);
}
export declare class TransactionError extends FirestoreAdapterError {
    constructor(message: string, context?: Record<string, any>);
}
export declare class BatchOperationError extends FirestoreAdapterError {
    readonly failedOperations: Array<{
        id: string;
        error: string;
    }>;
    constructor(message: string, failedOperations: Array<{
        id: string;
        error: string;
    }>, context?: Record<string, any>);
}
export declare class ValidationError extends FirestoreAdapterError {
    constructor(message: string, context?: Record<string, any>);
}
export declare class MigrationError extends FirestoreAdapterError {
    constructor(message: string, context?: Record<string, any>);
}
export declare class RetryExhaustedError extends FirestoreAdapterError {
    constructor(operation: string, attempts: number, lastError: Error);
}
export declare class EdgeRuntimeError extends FirestoreAdapterError {
    constructor();
}
export declare class CacheError extends FirestoreAdapterError {
    constructor(message: string, context?: Record<string, any>);
}
//# sourceMappingURL=errors.d.ts.map