// services/crud/RelationalCrudService.ts
import admin from "firebase-admin";
import type { Firestore, Query, WriteBatch } from "firebase-admin/firestore";
import type { IRelationalService } from "../../interfaces/IRelationalService";
import type {
  CreateResult,
  UpdateResult,
  RelationalDoc,
  DeleteCollectionResult,
  CascadeDeleteResult,
  BatchResult,
  RetryConfig,
} from "../../core/types";
import { DocumentNotFoundError } from "../../core/errors";
import { DataSanitizer } from "../../core/sanitizer";
import { retryWithBackoff, validatePath, validateId } from "../../core/utils";

export class RelationalCrudService implements IRelationalService {
  constructor(
    private readonly db: Firestore,
    private readonly enableRetry: boolean = true,
    private readonly retryConfig?: RetryConfig
  ) {}

  async createRelational<T = any>(
    collection: string,
    data: T,
    refs: Record<string, string> = {},
    docId?: string
  ): Promise<CreateResult> {
    validatePath(collection);
    if (docId) validateId(docId);

    const operation = async () => {
      const sanitizedData = DataSanitizer.validateAndSanitize(data as any);
      const docData: RelationalDoc<T> = {
        data: sanitizedData as T,
        refs,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (docId) {
        const ref = this.db.collection(collection).doc(docId);
        await ref.set(docData);
        return { id: docId, timestamp: new Date() };
      } else {
        const ref = this.db.collection(collection);
        const doc = await ref.add(docData);
        return { id: doc.id, timestamp: new Date() };
      }
    };

    return this.withRetry(operation, "createRelational");
  }

  async setRelational<T = any>(
    collection: string,
    id: string,
    data: T,
    refs: Record<string, string> = {},
    merge: boolean = false
  ): Promise<CreateResult> {
    validatePath(collection);
    validateId(id);

    const operation = async () => {
      const sanitizedData = DataSanitizer.validateAndSanitize(data as any);
      const docData: RelationalDoc<T> = {
        data: sanitizedData as T,
        refs,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const ref = this.db.collection(collection).doc(id);
      await ref.set(docData, { merge });
      return { id, timestamp: new Date() };
    };

    return this.withRetry(operation, "setRelational");
  }

  async readRelational<T = any>(
    collection: string,
    id: string
  ): Promise<(RelationalDoc<T> & { id: string }) | null> {
    validatePath(collection);
    validateId(id);

    const operation = async () => {
      const doc = await this.db.collection(collection).doc(id).get();

      if (!doc.exists) {
        return null;
      }

      const data = doc.data() as RelationalDoc<T>;
      const sanitized = DataSanitizer.sanitizeDocument(data);

      return { id: doc.id, ...sanitized };
    };

    return this.withRetry(operation, "readRelational");
  }

  async readFlattened<T = any>(
    collection: string,
    id: string
  ): Promise<(T & { id: string }) | null> {
    const doc = await this.readRelational<T>(collection, id);
    if (!doc) return null;

    return {
      id: doc.id,
      ...doc.data,
      ...doc.refs,
    } as T & { id: string };
  }

  async updateData<T = any>(
    collection: string,
    id: string,
    updates: Partial<T>
  ): Promise<UpdateResult> {
    validatePath(collection);
    validateId(id);

    const operation = async () => {
      const ref = this.db.collection(collection).doc(id);

      const doc = await ref.get();
      if (!doc.exists) {
        throw new DocumentNotFoundError(collection, id);
      }

      const nestedUpdates: Record<string, any> = {};
      for (const [key, value] of Object.entries(updates)) {
        nestedUpdates[`data.${key}`] = value;
      }

      await ref.update({
        ...nestedUpdates,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { id, timestamp: new Date() };
    };

    return this.withRetry(operation, "updateData");
  }

  async updateRefs(
    collection: string,
    id: string,
    refs: Record<string, string>
  ): Promise<UpdateResult> {
    validatePath(collection);
    validateId(id);

    const operation = async () => {
      const ref = this.db.collection(collection).doc(id);

      const doc = await ref.get();
      if (!doc.exists) {
        throw new DocumentNotFoundError(collection, id);
      }

      const nestedRefs: Record<string, any> = {};
      for (const [key, value] of Object.entries(refs)) {
        nestedRefs[`refs.${key}`] = value;
      }

      await ref.update({
        ...nestedRefs,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { id, timestamp: new Date() };
    };

    return this.withRetry(operation, "updateRefs");
  }

  async updateRelational<T = any>(
    collection: string,
    id: string,
    dataUpdates?: Partial<T>,
    refUpdates?: Record<string, string>
  ): Promise<UpdateResult> {
    validatePath(collection);
    validateId(id);

    const operation = async () => {
      const ref = this.db.collection(collection).doc(id);

      const doc = await ref.get();
      if (!doc.exists) {
        throw new DocumentNotFoundError(collection, id);
      }

      const updates: Record<string, any> = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (dataUpdates) {
        for (const [key, value] of Object.entries(dataUpdates)) {
          updates[`data.${key}`] = value;
        }
      }

      if (refUpdates) {
        for (const [key, value] of Object.entries(refUpdates)) {
          updates[`refs.${key}`] = value;
        }
      }

      await ref.update(updates);
      return { id, timestamp: new Date() };
    };

    return this.withRetry(operation, "updateRelational");
  }

  async queryByRef<T = any>(
    collection: string,
    refKey: string,
    refValue: string
  ): Promise<(RelationalDoc<T> & { id: string })[]> {
    validatePath(collection);

    const operation = async () => {
      const ref = this.db.collection(collection).where(`refs.${refKey}`, "==", refValue);
      const snap = await ref.get();

      return snap.docs.map((doc) => {
        const data = doc.data() as RelationalDoc<T>;
        const sanitized = DataSanitizer.sanitizeDocument(data);
        return { id: doc.id, ...sanitized };
      });
    };

    return this.withRetry(operation, "queryByRef");
  }

  async queryByRefWithData<T = any>(
    collection: string,
    refKey: string,
    refValue: string,
    dataFilters: Record<string, any>
  ): Promise<(RelationalDoc<T> & { id: string })[]> {
    validatePath(collection);

    const operation = async () => {
      let ref: Query = this.db.collection(collection).where(`refs.${refKey}`, "==", refValue);

      for (const [key, value] of Object.entries(dataFilters)) {
        ref = ref.where(`data.${key}`, "==", value);
      }

      const snap = await ref.get();

      return snap.docs.map((doc) => {
        const data = doc.data() as RelationalDoc<T>;
        const sanitized = DataSanitizer.sanitizeDocument(data);
        return { id: doc.id, ...sanitized };
      });
    };

    return this.withRetry(operation, "queryByRefWithData");
  }

  async queryByRefs<T = any>(
    collection: string,
    refs: Record<string, string>
  ): Promise<(RelationalDoc<T> & { id: string })[]> {
    validatePath(collection);

    const operation = async () => {
      let ref: Query = this.db.collection(collection);

      for (const [key, value] of Object.entries(refs)) {
        ref = ref.where(`refs.${key}`, "==", value);
      }

      const snap = await ref.get();

      return snap.docs.map((doc) => {
        const data = doc.data() as RelationalDoc<T>;
        const sanitized = DataSanitizer.sanitizeDocument(data);
        return { id: doc.id, ...sanitized };
      });
    };

    return this.withRetry(operation, "queryByRefs");
  }

  async queryByRefsWithData<T = any>(
    collection: string,
    refs: Record<string, string>,
    dataFilters: Record<string, any>
  ): Promise<(RelationalDoc<T> & { id: string })[]> {
    validatePath(collection);

    const operation = async () => {
      let ref: Query = this.db.collection(collection);

      for (const [key, value] of Object.entries(refs)) {
        ref = ref.where(`refs.${key}`, "==", value);
      }

      for (const [key, value] of Object.entries(dataFilters)) {
        ref = ref.where(`data.${key}`, "==", value);
      }

      const snap = await ref.get();

      return snap.docs.map((doc) => {
        const data = doc.data() as RelationalDoc<T>;
        const sanitized = DataSanitizer.sanitizeDocument(data);
        return { id: doc.id, ...sanitized };
      });
    };

    return this.withRetry(operation, "queryByRefsWithData");
  }

  async queryByRefFlattened<T = any>(
    collection: string,
    refKey: string,
    refValue: string
  ): Promise<(T & { id: string })[]> {
    const results = await this.queryByRef<T>(collection, refKey, refValue);

    return results.map((doc) => ({
      id: doc.id,
      ...doc.data,
      ...doc.refs,
    })) as (T & { id: string })[];
  }

  async countByRef(
    collection: string,
    refKey: string,
    refValue: string
  ): Promise<number> {
    validatePath(collection);

    const operation = async () => {
      const ref = this.db.collection(collection).where(`refs.${refKey}`, "==", refValue);
      const snap = await ref.count().get();
      return snap.data().count;
    };

    return this.withRetry(operation, "countByRef");
  }

  async relationExists(
    collection: string,
    refs: Record<string, string>
  ): Promise<boolean> {
    validatePath(collection);

    const operation = async () => {
      let ref: Query = this.db.collection(collection);

      for (const [key, value] of Object.entries(refs)) {
        ref = ref.where(`refs.${key}`, "==", value);
      }

      const snap = await ref.limit(1).get();
      return !snap.empty;
    };

    return this.withRetry(operation, "relationExists");
  }

  async findOneByRefs<T = any>(
    collection: string,
    refs: Record<string, string>
  ): Promise<(RelationalDoc<T> & { id: string }) | null> {
    validatePath(collection);

    const operation = async () => {
      let ref: Query = this.db.collection(collection);

      for (const [key, value] of Object.entries(refs)) {
        ref = ref.where(`refs.${key}`, "==", value);
      }

      const snap = await ref.limit(1).get();

      if (snap.empty) {
        return null;
      }

      const doc = snap.docs[0];
      const data = doc.data() as RelationalDoc<T>;
      const sanitized = DataSanitizer.sanitizeDocument(data);
      return { id: doc.id, ...sanitized };
    };

    return this.withRetry(operation, "findOneByRefs");
  }

  async findOrCreateWithRefs<T = any>(
    collection: string,
    data: T,
    refs: Record<string, string>
  ): Promise<{ id: string; created: boolean; doc: RelationalDoc<T> & { id: string } }> {
    const existing = await this.findOneByRefs<T>(collection, refs);

    if (existing) {
      return { id: existing.id, created: false, doc: existing };
    }

    const result = await this.createRelational(collection, data, refs);
    const newDoc = await this.readRelational<T>(collection, result.id);

    if (!newDoc) {
      throw new Error("Failed to read newly created document");
    }

    return { id: result.id, created: true, doc: newDoc };
  }

  async upsertWithRefs<T = any>(
    collection: string,
    data: T,
    refs: Record<string, string>
  ): Promise<{ id: string; created: boolean }> {
    const existing = await this.findOneByRefs(collection, refs);

    if (existing) {
      await this.updateData(collection, existing.id, data as any);
      return { id: existing.id, created: false };
    }

    const result = await this.createRelational(collection, data, refs);
    return { id: result.id, created: true };
  }

  async toggleRelation<T = any>(
    collection: string,
    data: T,
    refs: Record<string, string>
  ): Promise<{ id: string; action: "created" | "deleted" }> {
    const existing = await this.findOneByRefs(collection, refs);

    if (existing) {
      await this.db.collection(collection).doc(existing.id).delete();
      return { id: existing.id, action: "deleted" };
    }

    const result = await this.createRelational(collection, data, refs);
    return { id: result.id, action: "created" };
  }

  async deleteByRef(
    collection: string,
    refKey: string,
    refValue: string,
    batchSize: number = 500
  ): Promise<DeleteCollectionResult> {
    validatePath(collection);

    const query = this.db
      .collection(collection)
      .where(`refs.${refKey}`, "==", refValue)
      .limit(batchSize);

    return new Promise<DeleteCollectionResult>((resolve, reject) => {
      this.deleteQueryBatch(query, resolve, reject, 0, 0);
    });
  }

  private deleteQueryBatch(
    query: Query,
    resolve: (result: DeleteCollectionResult) => void,
    reject: (error: Error) => void,
    deletedCount: number,
    batchCount: number
  ): void {
    query
      .get()
      .then((snapshot) => {
        if (snapshot.size === 0) {
          return resolve({ deleted: deletedCount, batches: batchCount });
        }

        const batch: WriteBatch = this.db.batch();
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });

        return batch.commit().then(() => {
          const newCount = deletedCount + snapshot.size;
          process.nextTick(() => {
            this.deleteQueryBatch(query, resolve, reject, newCount, batchCount + 1);
          });
        });
      })
      .catch(reject);
  }

  async getRelated<T = any, R = any>(
    parentCollection: string,
    parentId: string,
    childCollection: string,
    relationKey: string
  ): Promise<{
    parent: (RelationalDoc<T> & { id: string }) | null;
    children: (RelationalDoc<R> & { id: string })[];
  }> {
    const parent = await this.readRelational<T>(parentCollection, parentId);
    const children = await this.queryByRef<R>(childCollection, relationKey, parentId);

    return { parent, children };
  }

  async cascadeDeleteRelational(
    parentCollection: string,
    parentId: string,
    cascadeRules: Array<{ collection: string; refKey: string }>
  ): Promise<CascadeDeleteResult> {
    const childrenDeleted: Record<string, number> = {};

    for (const rule of cascadeRules) {
      const result = await this.deleteByRef(rule.collection, rule.refKey, parentId);
      childrenDeleted[rule.collection] = result.deleted;
    }

    await this.db.collection(parentCollection).doc(parentId).delete();

    return {
      deleted: 1,
      children: childrenDeleted,
    };
  }

  async batchCreateRelational<T = any>(
    collection: string,
    documents: Array<{ data: T; refs: Record<string, string> }>
  ): Promise<BatchResult> {
    validatePath(collection);

    const operation = async () => {
      const batch: WriteBatch = this.db.batch();
      const ids: string[] = [];

      for (const doc of documents) {
        const ref = this.db.collection(collection).doc();
        const sanitizedData = DataSanitizer.validateAndSanitize(doc.data as any);
        const docData: RelationalDoc<T> = {
          data: sanitizedData as T,
          refs: doc.refs,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        batch.set(ref, docData);
        ids.push(ref.id);
      }

      await batch.commit();
      return { success: true, count: documents.length, ids };
    };

    return this.withRetry(operation, "batchCreateRelational");
  }

  async aggregateCountByParent(
    collection: string,
    refKey: string,
    parentIds: string[]
  ): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};

    await Promise.all(
      parentIds.map(async (parentId) => {
        const count = await this.countByRef(collection, refKey, parentId);
        counts[parentId] = count;
      })
    );

    return counts;
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