import type { QueryFilter, PaginatedResult, DocWithId, QueryOptions } from "../core/types";
import type { OrderByDirection } from "firebase-admin/firestore";
export interface IQueryService {
    query<T = any>(collection: string, filters: Record<string, any>): Promise<DocWithId<T>[]>;
    queryAdvanced<T = any>(collection: string, filters: QueryFilter[]): Promise<DocWithId<T>[]>;
    queryOrdered<T = any>(collection: string, filters: Record<string, any>, orderField: string, direction?: OrderByDirection): Promise<DocWithId<T>[]>;
    queryOrderedAdvanced<T = any>(collection: string, filters: QueryFilter[], orderField: string, direction?: OrderByDirection): Promise<DocWithId<T>[]>;
    queryPaginated<T = any>(collection: string, filters: Record<string, any>, limit: number, startAfter?: any): Promise<PaginatedResult<T & {
        id: string;
    }>>;
    queryPaginatedAdvanced<T = any>(collection: string, filters: QueryFilter[], limit: number, startAfter?: any): Promise<PaginatedResult<T & {
        id: string;
    }>>;
    findOneAdvanced<T = any>(collection: string, filters: QueryFilter[]): Promise<DocWithId<T> | null>;
    countWhere(collection: string, filters: Record<string, any>): Promise<number>;
    countWhereAdvanced(collection: string, filters: QueryFilter[]): Promise<number>;
    queryWithOptions<T = any>(collection: string, filters: QueryFilter[], options: QueryOptions): Promise<DocWithId<T>[]>;
}
//# sourceMappingURL=IQueryService.d.ts.map