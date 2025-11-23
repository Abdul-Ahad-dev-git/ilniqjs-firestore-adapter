// interfaces/ICrudService.ts
import type {
  CreateResult,
  UpdateResult,
  DeleteResult,
  UpsertResult,
  DocWithId,
} from "../core/types";

export interface ICrudService {
  create(
    collection: string,
    data: Record<string, any>
  ): Promise<CreateResult>;

  set(
    collection: string,
    id: string,
    data: Record<string, any>,
    merge?: boolean
  ): Promise<CreateResult>;

  read<T = any>(
    collection: string,
    id: string
  ): Promise<DocWithId<T> | null>;

  update(
    collection: string,
    id: string,
    data: Partial<Record<string, any>>
  ): Promise<UpdateResult>;

  delete(
    collection: string,
    id: string
  ): Promise<DeleteResult>;

  exists(
    collection: string,
    id: string
  ): Promise<boolean>;

  upsert(
    collection: string,
    id: string,
    data: Record<string, any>
  ): Promise<UpsertResult>;

  list<T = any>(
    collection: string
  ): Promise<DocWithId<T>[]>;

  count(
    collection: string
  ): Promise<number>;

  findOne<T = any>(
    collection: string,
    filters: Record<string, any>
  ): Promise<DocWithId<T> | null>;
}
