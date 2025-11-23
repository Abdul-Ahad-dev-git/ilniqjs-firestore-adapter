import type { Firestore } from "firebase-admin/firestore";
import type { BatchResult, RetryConfig } from "../../core/types";
export declare class BatchService {
    private readonly db;
    private readonly enableRetry;
    private readonly retryConfig?;
    private readonly MAX_BATCH_SIZE;
    constructor(db: Firestore, enableRetry?: boolean, retryConfig?: RetryConfig | undefined);
    batchCreate(collection: string, documents: Record<string, any>[]): Promise<BatchResult>;
    batchSet(collection: string, documents: Array<{
        id: string;
        data: Record<string, any>;
        merge?: boolean;
    }>): Promise<BatchResult>;
    batchUpdate(collection: string, updates: Array<{
        id: string;
        data: Partial<Record<string, any>>;
    }>): Promise<BatchResult>;
    batchDelete(collection: string, ids: string[]): Promise<BatchResult>;
    deleteCollection(collection: string, batchSize?: number): Promise<{
        deleted: number;
        batches: number;
    }>;
    batchIncrement(collection: string, updates: Array<{
        id: string;
        field: string;
        amount: number;
    }>): Promise<BatchResult>;
    private withRetry;
}
//# sourceMappingURL=BatchService.d.ts.map