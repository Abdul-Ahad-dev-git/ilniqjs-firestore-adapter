// core/errors.ts

export class FirestoreAdapterError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, any>
  ) {
    super(message);
    this.name = "FirestoreAdapterError";
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ConfigurationError extends FirestoreAdapterError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, "CONFIGURATION_ERROR", context);
    this.name = "ConfigurationError";
  }
}

export class ConnectionError extends FirestoreAdapterError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, "CONNECTION_ERROR", context);
    this.name = "ConnectionError";
  }
}

export class DocumentNotFoundError extends FirestoreAdapterError {
  constructor(collection: string, id: string) {
    super(
      `Document not found: ${collection}/${id}`,
      "DOCUMENT_NOT_FOUND",
      { collection, id }
    );
    this.name = "DocumentNotFoundError";
  }
}

export class QueryError extends FirestoreAdapterError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, "QUERY_ERROR", context);
    this.name = "QueryError";
  }
}

export class TransactionError extends FirestoreAdapterError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, "TRANSACTION_ERROR", context);
    this.name = "TransactionError";
  }
}

export class BatchOperationError extends FirestoreAdapterError {
  constructor(
    message: string,
    public readonly failedOperations: Array<{ id: string; error: string }>,
    context?: Record<string, any>
  ) {
    super(message, "BATCH_OPERATION_ERROR", context);
    this.name = "BatchOperationError";
  }
}

export class ValidationError extends FirestoreAdapterError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, "VALIDATION_ERROR", context);
    this.name = "ValidationError";
  }
}

export class MigrationError extends FirestoreAdapterError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, "MIGRATION_ERROR", context);
    this.name = "MigrationError";
  }
}

export class RetryExhaustedError extends FirestoreAdapterError {
  constructor(
    operation: string,
    attempts: number,
    lastError: Error
  ) {
    super(
      `Operation "${operation}" failed after ${attempts} retries`,
      "RETRY_EXHAUSTED",
      { operation, attempts, lastError: lastError.message }
    );
    this.name = "RetryExhaustedError";
  }
}

export class EdgeRuntimeError extends FirestoreAdapterError {
  constructor() {
    super(
      "Firestore Admin SDK cannot run in Edge runtime. Use standard Node.js runtime.",
      "EDGE_RUNTIME_ERROR"
    );
    this.name = "EdgeRuntimeError";
  }
}

export class CacheError extends FirestoreAdapterError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, "CACHE_ERROR", context);
    this.name = "CacheError";
  }
}