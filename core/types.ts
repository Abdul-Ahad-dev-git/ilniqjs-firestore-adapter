// core/types.ts
import type { 
  WhereFilterOp, 
  OrderByDirection,
  QueryDocumentSnapshot,
  FieldValue,
  Timestamp
} from "firebase-admin/firestore";

export interface QueryFilter {
  field: string;
  op: WhereFilterOp;
  value: any;
}

export interface RelationalDoc<T = any> {
  data: T;
  refs: Record<string, string>;
  createdAt?: FieldValue | Timestamp | Date;
  updatedAt?: FieldValue | Timestamp | Date;
}

export interface DocWithId<T = any> {
  id: string;
  [key: string]: any;
}

export interface PaginatedResult<T> {
  docs: T[];
  lastDoc: QueryDocumentSnapshot | undefined;
  hasMore: boolean;
  total?: number;
}

export interface CreateResult {
  id: string;
  timestamp?: Date;
}

export interface UpdateResult {
  id: string;
  timestamp?: Date;
}

export interface DeleteResult {
  id: string;
  deleted: boolean;
  timestamp?: Date;
}

export interface UpsertResult {
  id: string;
  exists: boolean;
  timestamp?: Date;
}

export interface BatchResult {
  success: boolean;
  count: number;
  ids?: string[];
  failed?: Array<{ id: string; error: string }>;
}

export interface BulkUpdateResult {
  success: boolean;
  updated: number;
  batches: number;
  failed?: number;
}

export interface DeleteCollectionResult {
  deleted: number;
  batches: number;
}

export interface MigrationResult {
  converted: number;
  batches: number;
  failed?: number;
  errors?: Array<{ id: string; error: string }>;
}

export interface CascadeDeleteResult {
  deleted: number;
  children: Record<string, number>;
}

export interface AggregateCountResult {
  counts: Record<string, number>;
  total: number;
}

export interface BatchAction {
  type: "set" | "update" | "delete";
  path: string;
  id: string;
  data?: any;
  refs?: Record<string, string>;
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export interface ConnectionMetrics {
  isConnected: boolean;
  lastActivity: Date;
  idleTime: number;
  operationCount: number;
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  direction?: OrderByDirection;
  startAfter?: any;
  startAt?: any;
  endBefore?: any;
  endAt?: any;
}

export interface TransactionContext {
  id: string;
  startTime: Date;
  operations: number;
}

export interface TraceContext {
  traceId: string;
  spanId: string;
  operation: string;
  startTime: number;
  metadata?: Record<string, any>;
}