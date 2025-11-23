import type { Firestore, Transaction } from "firebase-admin/firestore";
import type { UpdateResult, RetryConfig } from "../../core/types";
export declare class TransactionService {
    private readonly db;
    private readonly enableRetry;
    private readonly retryConfig?;
    constructor(db: Firestore, enableRetry?: boolean, retryConfig?: RetryConfig | undefined);
    runTransaction<T>(operation: (tx: Transaction) => Promise<T>): Promise<T>;
    atomicIncrement(collection: string, id: string, field: string, amount: number): Promise<UpdateResult>;
    atomicDecrement(collection: string, id: string, field: string, amount: number, minValue?: number): Promise<UpdateResult>;
    atomicTransfer(fromCollection: string, fromId: string, toCollection: string, toId: string, field: string, amount: number): Promise<{
        from: UpdateResult;
        to: UpdateResult;
    }>;
    conditionalUpdate<T = any>(collection: string, id: string, condition: (data: T) => boolean, updates: Partial<Record<string, any>>): Promise<{
        updated: boolean;
        result?: UpdateResult;
    }>;
    readModifyWrite<T = any>(collection: string, id: string, modifier: (data: T) => Partial<T>): Promise<UpdateResult>;
    transactionalBatchRead<T = any>(refs: Array<{
        collection: string;
        id: string;
    }>): Promise<Array<(T & {
        id: string;
    }) | null>>;
    compareAndSwap<T = any>(collection: string, id: string, field: string, expectedValue: any, newValue: any): Promise<{
        swapped: boolean;
        currentValue?: any;
    }>;
    private withRetry;
}
//# sourceMappingURL=TransactionService.d.ts.map