export { FireStoreDBAdapter, FSDB } from "./adapter/FireStoreDBAdapter";
export { DatabaseManager } from "./adapter/DatabaseManager";
export { ConnectionFactory } from "./config/connection.factory";
export { mergeOptions, DEFAULT_ADAPTER_OPTIONS } from "./config/adapter.options";
export type { AdapterOptions } from "./config/adapter.options";
export type { QueryFilter, RelationalDoc, DocWithId, PaginatedResult, CreateResult, UpdateResult, DeleteResult, UpsertResult, BatchResult, BulkUpdateResult, DeleteCollectionResult, MigrationResult, CascadeDeleteResult, AggregateCountResult, BatchAction, CacheEntry, RetryConfig, ConnectionMetrics, QueryOptions, TransactionContext, TraceContext, } from "./core/types";
export { FirestoreAdapterError, ConfigurationError, ConnectionError, DocumentNotFoundError, QueryError, TransactionError, BatchOperationError, ValidationError, MigrationError, RetryExhaustedError, EdgeRuntimeError, CacheError, } from "./core/errors";
export { DataSanitizer } from "./core/sanitizer";
export { sleep, retryWithBackoff, generateId, validatePath, validateId, chunkArray, deepClone, isPlainObject, flattenObject, measureTime, debounce, throttle, safeStringify, omit, pick, } from "./core/utils";
export type { ICrudService } from "./interfaces/ICrudService";
export type { IRelationalService } from "./interfaces/IRelationalService";
export type { IQueryService } from "./interfaces/IQueryService";
export { SimpleCrudService } from "./services/crud/SimpleCrudService";
export { RelationalCrudService } from "./services/crud/RelationalCrudService";
export { QueryService } from "./services/query/QueryService";
export { BatchService } from "./services/batch/BatchService";
export { TransactionService } from "./services/transaction/TransactionService";
export { MigrationService } from "./services/migration/MigrationService";
//# sourceMappingURL=index.d.ts.map