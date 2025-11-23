import type { Firestore } from "firebase-admin/firestore";
import type { ICrudService } from "../../interfaces/ICrudService";
import type { CreateResult, UpdateResult, DeleteResult, UpsertResult, DocWithId, RetryConfig } from "../../core/types";
export declare class SimpleCrudService implements ICrudService {
    private readonly db;
    private readonly enableRetry;
    private readonly retryConfig?;
    constructor(db: Firestore, enableRetry?: boolean, retryConfig?: RetryConfig | undefined);
    create<T = any>(collection: string, data: Record<string, any>): Promise<CreateResult>;
    set<T = any>(collection: string, id: string, data: Record<string, any>, merge?: boolean): Promise<CreateResult>;
    read<T = any>(collection: string, id: string): Promise<DocWithId<T> | null>;
    update<T = any>(collection: string, id: string, data: Partial<Record<string, any>>): Promise<UpdateResult>;
    delete(collection: string, id: string): Promise<DeleteResult>;
    exists(collection: string, id: string): Promise<boolean>;
    upsert<T = any>(collection: string, id: string, data: Record<string, any>): Promise<UpsertResult>;
    list<T = any>(collection: string): Promise<DocWithId<T>[]>;
    count(collection: string): Promise<number>;
    findOne<T = any>(collection: string, filters: Record<string, any>): Promise<DocWithId<T> | null>;
    private withRetry;
}
//# sourceMappingURL=SimpleCrudService.d.ts.map