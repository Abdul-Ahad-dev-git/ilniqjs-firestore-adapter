import type { Firestore, FieldValue } from "firebase-admin/firestore";
import { type AdapterOptions } from "../config/adapter.options";
import type { ConnectionMetrics } from "../core/types";
export declare class FireStoreDBAdapter {
    private connectionFactory;
    private options;
    private crudService;
    private relationalService;
    private queryService;
    private batchService;
    private transactionService;
    private migrationService;
    private isInitialized;
    constructor(options?: Partial<AdapterOptions>);
    private ensureInitialized;
    private getDb;
    private getCrudService;
    private getRelationalService;
    private getQueryService;
    private getBatchService;
    private getTransactionService;
    private getMigrationService;
    create(collection: string, data: Record<string, any>): Promise<import("../core/types").CreateResult>;
    set(collection: string, id: string, data: Record<string, any>, merge?: boolean): Promise<import("../core/types").CreateResult>;
    read<T = any>(collection: string, id: string): Promise<import("../core/types").DocWithId<T> | null>;
    update(collection: string, id: string, data: Partial<Record<string, any>>): Promise<import("../core/types").UpdateResult>;
    delete(collection: string, id: string): Promise<import("../core/types").DeleteResult>;
    exists(collection: string, id: string): Promise<boolean>;
    upsert<T = any>(collection: string, id: string, data: Record<string, any>): Promise<import("../core/types").UpsertResult>;
    list<T = any>(collection: string): Promise<import("../core/types").DocWithId<T>[]>;
    count(collection: string): Promise<number>;
    findOne<T = any>(collection: string, filters: Record<string, any>): Promise<import("../core/types").DocWithId<T> | null>;
    createRelational<T = any>(collection: string, data: T, refs?: Record<string, string>, docId?: string): Promise<import("../core/types").CreateResult>;
    setRelational<T = any>(collection: string, id: string, data: T, refs?: Record<string, string>, merge?: boolean): Promise<import("../core/types").CreateResult>;
    readRelational<T = any>(collection: string, id: string): Promise<(import("../core/types").RelationalDoc<T> & {
        id: string;
    }) | null>;
    readFlattened<T = any>(collection: string, id: string): Promise<(T & {
        id: string;
    }) | null>;
    updateData<T = any>(collection: string, id: string, updates: Partial<T>): Promise<import("../core/types").UpdateResult>;
    updateRefs(collection: string, id: string, refs: Record<string, string>): Promise<import("../core/types").UpdateResult>;
    updateRelational<T = any>(collection: string, id: string, dataUpdates?: Partial<T>, refUpdates?: Record<string, string>): Promise<import("../core/types").UpdateResult>;
    queryByRef<T = any>(collection: string, refKey: string, refValue: string): Promise<(import("../core/types").RelationalDoc<T> & {
        id: string;
    })[]>;
    queryByRefWithData<T = any>(collection: string, refKey: string, refValue: string, dataFilters: Record<string, any>): Promise<(import("../core/types").RelationalDoc<T> & {
        id: string;
    })[]>;
    queryByRefs<T = any>(collection: string, refs: Record<string, string>): Promise<(import("../core/types").RelationalDoc<T> & {
        id: string;
    })[]>;
    queryByRefsWithData<T = any>(collection: string, refs: Record<string, string>, dataFilters: Record<string, any>): Promise<(import("../core/types").RelationalDoc<T> & {
        id: string;
    })[]>;
    queryByRefFlattened<T = any>(collection: string, refKey: string, refValue: string): Promise<(T & {
        id: string;
    })[]>;
    countByRef(collection: string, refKey: string, refValue: string): Promise<number>;
    relationExists(collection: string, refs: Record<string, string>): Promise<boolean>;
    findOneByRefs<T = any>(collection: string, refs: Record<string, string>): Promise<(import("../core/types").RelationalDoc<T> & {
        id: string;
    }) | null>;
    findOrCreateWithRefs<T = any>(collection: string, data: T, refs: Record<string, string>): Promise<{
        id: string;
        created: boolean;
        doc: import("../core/types").RelationalDoc<T> & {
            id: string;
        };
    }>;
    upsertWithRefs<T = any>(collection: string, data: T, refs: Record<string, string>): Promise<{
        id: string;
        created: boolean;
    }>;
    toggleRelation<T = any>(collection: string, data: T, refs: Record<string, string>): Promise<{
        id: string;
        action: "created" | "deleted";
    }>;
    deleteByRef(collection: string, refKey: string, refValue: string, batchSize?: number): Promise<import("../core/types").DeleteCollectionResult>;
    getRelated<T = any, R = any>(parentCollection: string, parentId: string, childCollection: string, relationKey: string): Promise<{
        parent: (import("../core/types").RelationalDoc<T> & {
            id: string;
        }) | null;
        children: (import("../core/types").RelationalDoc<R> & {
            id: string;
        })[];
    }>;
    cascadeDeleteRelational(parentCollection: string, parentId: string, cascadeRules: Array<{
        collection: string;
        refKey: string;
    }>): Promise<import("../core/types").CascadeDeleteResult>;
    batchCreateRelational<T = any>(collection: string, documents: Array<{
        data: T;
        refs: Record<string, string>;
    }>): Promise<import("../core/types").BatchResult>;
    aggregateCountByParent(collection: string, refKey: string, parentIds: string[]): Promise<Record<string, number>>;
    query<T = any>(collection: string, filters: Record<string, any>): Promise<import("../core/types").DocWithId<T>[]>;
    queryAdvanced<T = any>(collection: string, filters: any[]): Promise<import("../core/types").DocWithId<T>[]>;
    queryOrdered<T = any>(collection: string, filters: Record<string, any>, orderField: string, direction?: "asc" | "desc"): Promise<import("../core/types").DocWithId<T>[]>;
    queryOrderedAdvanced<T = any>(collection: string, filters: any[], orderField: string, direction?: "asc" | "desc"): Promise<import("../core/types").DocWithId<T>[]>;
    queryPaginated<T = any>(collection: string, filters: Record<string, any>, limit: number, startAfter?: any): Promise<import("../core/types").PaginatedResult<T & {
        id: string;
    }>>;
    queryPaginatedAdvanced<T = any>(collection: string, filters: any[], limit: number, startAfter?: any): Promise<import("../core/types").PaginatedResult<T & {
        id: string;
    }>>;
    findOneAdvanced<T = any>(collection: string, filters: any[]): Promise<import("../core/types").DocWithId<T> | null>;
    countWhere(collection: string, filters: Record<string, any>): Promise<number>;
    countWhereAdvanced(collection: string, filters: any[]): Promise<number>;
    queryWithOptions<T = any>(collection: string, filters: any[], options: any): Promise<import("../core/types").DocWithId<T>[]>;
    batchCreate(collection: string, documents: Record<string, any>[]): Promise<import("../core/types").BatchResult>;
    batchSet(collection: string, documents: Array<{
        id: string;
        data: Record<string, any>;
        merge?: boolean;
    }>): Promise<import("../core/types").BatchResult>;
    batchUpdate(collection: string, updates: Array<{
        id: string;
        data: Partial<Record<string, any>>;
    }>): Promise<import("../core/types").BatchResult>;
    batchDelete(collection: string, ids: string[]): Promise<import("../core/types").BatchResult>;
    deleteCollection(collection: string, batchSize?: number): Promise<{
        deleted: number;
        batches: number;
    }>;
    batchIncrement(collection: string, updates: Array<{
        id: string;
        field: string;
        amount: number;
    }>): Promise<import("../core/types").BatchResult>;
    runTransaction<T>(operation: (tx: any) => Promise<T>): Promise<T>;
    atomicIncrement(collection: string, id: string, field: string, amount: number): Promise<import("../core/types").UpdateResult>;
    atomicDecrement(collection: string, id: string, field: string, amount: number, minValue?: number): Promise<import("../core/types").UpdateResult>;
    atomicTransfer(fromCollection: string, fromId: string, toCollection: string, toId: string, field: string, amount: number): Promise<{
        from: import("../core/types").UpdateResult;
        to: import("../core/types").UpdateResult;
    }>;
    conditionalUpdate<T = any>(collection: string, id: string, condition: (data: T) => boolean, updates: Partial<Record<string, any>>): Promise<{
        updated: boolean;
        result?: import("../core/types").UpdateResult;
    }>;
    readModifyWrite<T = any>(collection: string, id: string, modifier: (data: T) => Partial<T>): Promise<import("../core/types").UpdateResult>;
    compareAndSwap<T = any>(collection: string, id: string, field: string, expectedValue: any, newValue: any): Promise<{
        swapped: boolean;
        currentValue?: any;
    }>;
    convertToRelational(collection: string, docId: string, refKeys: string[]): Promise<import("../core/types").MigrationResult>;
    batchConvertToRelational(collection: string, refKeys: string[], batchSize?: number): Promise<import("../core/types").MigrationResult>;
    batchTransform<T = any>(collection: string, transformation: (doc: T & {
        id: string;
    }) => Record<string, any>, batchSize?: number): Promise<import("../core/types").MigrationResult>;
    addFieldToAll(collection: string, field: string, value: any, batchSize?: number): Promise<import("../core/types").MigrationResult>;
    removeFieldFromAll(collection: string, field: string, batchSize?: number): Promise<import("../core/types").MigrationResult>;
    renameField(collection: string, oldField: string, newField: string, batchSize?: number): Promise<import("../core/types").MigrationResult>;
    copyCollection(sourceCollection: string, targetCollection: string, batchSize?: number): Promise<import("../core/types").MigrationResult>;
    validateMigration<T = any>(collection: string, validator: (doc: T & {
        id: string;
    }) => {
        valid: boolean;
        errors?: string[];
    }): Promise<{
        total: number;
        valid: number;
        invalid: number;
        errors: Array<{
            id: string;
            errors: string[];
        }>;
    }>;
    serverTimestamp(): FieldValue;
    arrayUnion(...items: any[]): FieldValue;
    arrayRemove(...items: any[]): FieldValue;
    increment(by: number): FieldValue;
    deleteField(): FieldValue;
    getMetrics(): ConnectionMetrics;
    getFirestoreInstance(): Promise<Firestore>;
    close(): Promise<void>;
    private setupGracefulShutdown;
}
export declare const FSDB: FireStoreDBAdapter;
//# sourceMappingURL=FireStoreDBAdapter.d.ts.map