import type { CreateResult, UpdateResult, RelationalDoc, DeleteCollectionResult, CascadeDeleteResult, BatchResult } from "../core/types";
export interface IRelationalService {
    createRelational<T = any>(collection: string, data: T, refs: Record<string, string>, docId?: string): Promise<CreateResult>;
    setRelational<T = any>(collection: string, id: string, data: T, refs: Record<string, string>, merge?: boolean): Promise<CreateResult>;
    readRelational<T = any>(collection: string, id: string): Promise<(RelationalDoc<T> & {
        id: string;
    }) | null>;
    readFlattened<T = any>(collection: string, id: string): Promise<(T & {
        id: string;
    }) | null>;
    updateData<T = any>(collection: string, id: string, updates: Partial<T>): Promise<UpdateResult>;
    updateRefs(collection: string, id: string, refs: Record<string, string>): Promise<UpdateResult>;
    updateRelational<T = any>(collection: string, id: string, dataUpdates?: Partial<T>, refUpdates?: Record<string, string>): Promise<UpdateResult>;
    queryByRef<T = any>(collection: string, refKey: string, refValue: string): Promise<(RelationalDoc<T> & {
        id: string;
    })[]>;
    queryByRefWithData<T = any>(collection: string, refKey: string, refValue: string, dataFilters: Record<string, any>): Promise<(RelationalDoc<T> & {
        id: string;
    })[]>;
    queryByRefs<T = any>(collection: string, refs: Record<string, string>): Promise<(RelationalDoc<T> & {
        id: string;
    })[]>;
    queryByRefsWithData<T = any>(collection: string, refs: Record<string, string>, dataFilters: Record<string, any>): Promise<(RelationalDoc<T> & {
        id: string;
    })[]>;
    queryByRefFlattened<T = any>(collection: string, refKey: string, refValue: string): Promise<(T & {
        id: string;
    })[]>;
    countByRef(collection: string, refKey: string, refValue: string): Promise<number>;
    relationExists(collection: string, refs: Record<string, string>): Promise<boolean>;
    findOneByRefs<T = any>(collection: string, refs: Record<string, string>): Promise<(RelationalDoc<T> & {
        id: string;
    }) | null>;
    findOrCreateWithRefs<T = any>(collection: string, data: T, refs: Record<string, string>): Promise<{
        id: string;
        created: boolean;
        doc: RelationalDoc<T> & {
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
    deleteByRef(collection: string, refKey: string, refValue: string, batchSize?: number): Promise<DeleteCollectionResult>;
    getRelated<T = any, R = any>(parentCollection: string, parentId: string, childCollection: string, relationKey: string): Promise<{
        parent: (RelationalDoc<T> & {
            id: string;
        }) | null;
        children: (RelationalDoc<R> & {
            id: string;
        })[];
    }>;
    cascadeDeleteRelational(parentCollection: string, parentId: string, cascadeRules: Array<{
        collection: string;
        refKey: string;
    }>): Promise<CascadeDeleteResult>;
    batchCreateRelational<T = any>(collection: string, documents: Array<{
        data: T;
        refs: Record<string, string>;
    }>): Promise<BatchResult>;
    aggregateCountByParent(collection: string, refKey: string, parentIds: string[]): Promise<Record<string, number>>;
}
//# sourceMappingURL=IRelationalService.d.ts.map