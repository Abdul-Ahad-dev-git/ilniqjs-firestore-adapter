// services/query/QueryService.ts
import type { Firestore, Query, OrderByDirection } from "firebase-admin/firestore";
import type { IQueryService } from "../../interfaces/IQueryService";
import type {
  QueryFilter,
  PaginatedResult,
  DocWithId,
  QueryOptions,
  RetryConfig,
} from "../../core/types";
import { DataSanitizer } from "../../core/sanitizer";
import { retryWithBackoff, validatePath } from "../../core/utils";

export class QueryService implements IQueryService {
  constructor(
    private readonly db: Firestore,
    private readonly enableRetry: boolean = true,
    private readonly retryConfig?: RetryConfig
  ) {}

  async query<T = any>(
    collection: string,
    filters: Record<string, any>
  ): Promise<DocWithId<T>[]> {
    validatePath(collection);

    const operation = async () => {
      let ref: Query = this.db.collection(collection);

      for (const [key, value] of Object.entries(filters)) {
        ref = ref.where(key, "==", value);
      }

      const snap = await ref.get();

      return snap.docs.map((doc) => {
        const data = doc.data();
        const sanitized = DataSanitizer.sanitizeDocument<T>(data);
        return { id: doc.id, ...sanitized } as DocWithId<T>;
      });
    };

    return this.withRetry(operation, "query");
  }

  async queryAdvanced<T = any>(
    collection: string,
    filters: QueryFilter[]
  ): Promise<DocWithId<T>[]> {
    validatePath(collection);

    const operation = async () => {
      let ref: Query = this.db.collection(collection);

      for (const filter of filters) {
        ref = ref.where(filter.field, filter.op, filter.value);
      }

      const snap = await ref.get();

      return snap.docs.map((doc) => {
        const data = doc.data();
        const sanitized = DataSanitizer.sanitizeDocument<T>(data);
        return { id: doc.id, ...sanitized } as DocWithId<T>;
      });
    };

    return this.withRetry(operation, "queryAdvanced");
  }

  async queryOrdered<T = any>(
    collection: string,
    filters: Record<string, any>,
    orderField: string,
    direction: OrderByDirection = "asc"
  ): Promise<DocWithId<T>[]> {
    validatePath(collection);

    const operation = async () => {
      let ref: Query = this.db.collection(collection);

      for (const [key, value] of Object.entries(filters)) {
        ref = ref.where(key, "==", value);
      }

      ref = ref.orderBy(orderField, direction);
      const snap = await ref.get();

      return snap.docs.map((doc) => {
        const data = doc.data();
        const sanitized = DataSanitizer.sanitizeDocument<T>(data);
        return { id: doc.id, ...sanitized } as DocWithId<T>;
      });
    };

    return this.withRetry(operation, "queryOrdered");
  }

  async queryOrderedAdvanced<T = any>(
    collection: string,
    filters: QueryFilter[],
    orderField: string,
    direction: OrderByDirection = "asc"
  ): Promise<DocWithId<T>[]> {
    validatePath(collection);

    const operation = async () => {
      let ref: Query = this.db.collection(collection);

      for (const filter of filters) {
        ref = ref.where(filter.field, filter.op, filter.value);
      }

      ref = ref.orderBy(orderField, direction);
      const snap = await ref.get();

      return snap.docs.map((doc) => {
        const data = doc.data();
        const sanitized = DataSanitizer.sanitizeDocument<T>(data);
        return { id: doc.id, ...sanitized } as DocWithId<T>;
      });
    };

    return this.withRetry(operation, "queryOrderedAdvanced");
  }

  async queryPaginated<T = any>(
    collection: string,
    filters: Record<string, any>,
    limit: number,
    startAfter?: any
  ): Promise<PaginatedResult<T & { id: string }>> {
    validatePath(collection);

    const operation = async () => {
      let ref: Query = this.db.collection(collection);

      for (const [key, value] of Object.entries(filters)) {
        ref = ref.where(key, "==", value);
      }

      ref = ref.limit(limit);

      if (startAfter) {
        ref = ref.startAfter(startAfter);
      }

      const snap = await ref.get();

      const docs = snap.docs.map((doc) => {
        const data = doc.data();
        const sanitized = DataSanitizer.sanitizeDocument<T>(data);
        return { id: doc.id, ...sanitized } as T & { id: string };
      });

      return {
        docs,
        lastDoc: snap.docs[snap.docs.length - 1],
        hasMore: snap.docs.length === limit,
      };
    };

    return this.withRetry(operation, "queryPaginated");
  }

  async queryPaginatedAdvanced<T = any>(
    collection: string,
    filters: QueryFilter[],
    limit: number,
    startAfter?: any
  ): Promise<PaginatedResult<T & { id: string }>> {
    validatePath(collection);

    const operation = async () => {
      let ref: Query = this.db.collection(collection);

      for (const filter of filters) {
        ref = ref.where(filter.field, filter.op, filter.value);
      }

      ref = ref.limit(limit);

      if (startAfter) {
        ref = ref.startAfter(startAfter);
      }

      const snap = await ref.get();

      const docs = snap.docs.map((doc) => {
        const data = doc.data();
        const sanitized = DataSanitizer.sanitizeDocument<T>(data);
        return { id: doc.id, ...sanitized } as T & { id: string };
      });

      return {
        docs,
        lastDoc: snap.docs[snap.docs.length - 1],
        hasMore: snap.docs.length === limit,
      };
    };

    return this.withRetry(operation, "queryPaginatedAdvanced");
  }

  async findOneAdvanced<T = any>(
    collection: string,
    filters: QueryFilter[]
  ): Promise<DocWithId<T> | null> {
    validatePath(collection);

    const operation = async () => {
      let ref: Query = this.db.collection(collection);

      for (const filter of filters) {
        ref = ref.where(filter.field, filter.op, filter.value);
      }

      const snap = await ref.limit(1).get();

      if (snap.empty) {
        return null;
      }

      const doc = snap.docs[0];
      const data = doc.data();
      const sanitized = DataSanitizer.sanitizeDocument<T>(data);
      return { id: doc.id, ...sanitized } as DocWithId<T>;
    };

    return this.withRetry(operation, "findOneAdvanced");
  }

  async countWhere(
    collection: string,
    filters: Record<string, any>
  ): Promise<number> {
    validatePath(collection);

    const operation = async () => {
      let ref: Query = this.db.collection(collection);

      for (const [key, value] of Object.entries(filters)) {
        ref = ref.where(key, "==", value);
      }

      const snap = await ref.count().get();
      return snap.data().count;
    };

    return this.withRetry(operation, "countWhere");
  }

  async countWhereAdvanced(
    collection: string,
    filters: QueryFilter[]
  ): Promise<number> {
    validatePath(collection);

    const operation = async () => {
      let ref: Query = this.db.collection(collection);

      for (const filter of filters) {
        ref = ref.where(filter.field, filter.op, filter.value);
      }

      const snap = await ref.count().get();
      return snap.data().count;
    };

    return this.withRetry(operation, "countWhereAdvanced");
  }

  async queryWithOptions<T = any>(
    collection: string,
    filters: QueryFilter[],
    options: QueryOptions
  ): Promise<DocWithId<T>[]> {
    validatePath(collection);

    const operation = async () => {
      let ref: Query = this.db.collection(collection);

      for (const filter of filters) {
        ref = ref.where(filter.field, filter.op, filter.value);
      }

      if (options.orderBy) {
        ref = ref.orderBy(options.orderBy, options.direction || "asc");
      }

      if (options.limit) {
        ref = ref.limit(options.limit);
      }

      if (options.startAfter) {
        ref = ref.startAfter(options.startAfter);
      } else if (options.startAt) {
        ref = ref.startAt(options.startAt);
      }

      if (options.endBefore) {
        ref = ref.endBefore(options.endBefore);
      } else if (options.endAt) {
        ref = ref.endAt(options.endAt);
      }

      const snap = await ref.get();

      return snap.docs.map((doc) => {
        const data = doc.data();
        const sanitized = DataSanitizer.sanitizeDocument<T>(data);
        return { id: doc.id, ...sanitized } as DocWithId<T>;
      });
    };

    return this.withRetry(operation, "queryWithOptions");
  }

  private async withRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    if (!this.enableRetry || !this.retryConfig) {
      return operation();
    }

    return retryWithBackoff(operation, this.retryConfig, operationName);
  }
}