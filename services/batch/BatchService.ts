// services/batch/BatchService.ts
import admin from "firebase-admin";
import type { Firestore, WriteBatch } from "firebase-admin/firestore";
import type { BatchResult, RetryConfig } from "../../core/types";
import { DataSanitizer } from "../../core/sanitizer";
import { retryWithBackoff, validatePath, validateId, chunkArray } from "../../core/utils";
import { BatchOperationError } from "../../core/errors";

export class BatchService {
  private readonly MAX_BATCH_SIZE = 500;

  constructor(
    private readonly db: Firestore,
    private readonly enableRetry: boolean = true,
    private readonly retryConfig?: RetryConfig
  ) {}

  async batchCreate(
    collection: string,
    documents: Record<string, any>[]
  ): Promise<BatchResult> {
    validatePath(collection);

    const operation = async () => {
      const chunks = chunkArray(documents, this.MAX_BATCH_SIZE);
      const allIds: string[] = [];
      const failed: Array<{ id: string; error: string }> = [];

      for (const chunk of chunks) {
        const batch: WriteBatch = this.db.batch();
        const chunkIds: string[] = [];

        for (const doc of chunk) {
          try {
            const ref = this.db.collection(collection).doc();
            const sanitized = DataSanitizer.validateAndSanitize(doc);
            batch.set(ref, {
              ...sanitized,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            chunkIds.push(ref.id);
          } catch (error) {
            failed.push({
              id: "unknown",
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }

        try {
          await batch.commit();
          allIds.push(...chunkIds);
        } catch (error) {
          chunkIds.forEach((id) => {
            failed.push({
              id,
              error: error instanceof Error ? error.message : String(error),
            });
          });
        }
      }

      if (failed.length > 0 && allIds.length === 0) {
        throw new BatchOperationError(
          "All batch create operations failed",
          failed
        );
      }

      return {
        success: failed.length === 0,
        count: allIds.length,
        ids: allIds,
        failed: failed.length > 0 ? failed : undefined,
      };
    };

    return this.withRetry(operation, "batchCreate");
  }

  async batchSet(
    collection: string,
    documents: Array<{ id: string; data: Record<string, any>; merge?: boolean }>
  ): Promise<BatchResult> {
    validatePath(collection);

    const operation = async () => {
      const chunks = chunkArray(documents, this.MAX_BATCH_SIZE);
      const allIds: string[] = [];
      const failed: Array<{ id: string; error: string }> = [];

      for (const chunk of chunks) {
        const batch: WriteBatch = this.db.batch();

        for (const item of chunk) {
          try {
            validateId(item.id);
            const ref = this.db.collection(collection).doc(item.id);
            const sanitized = DataSanitizer.validateAndSanitize(item.data);
            batch.set(
              ref,
              {
                ...sanitized,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              },
              { merge: item.merge || false }
            );
            allIds.push(item.id);
          } catch (error) {
            failed.push({
              id: item.id,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }

        try {
          await batch.commit();
        } catch (error) {
          chunk.forEach((item) => {
            if (!failed.find((f) => f.id === item.id)) {
              failed.push({
                id: item.id,
                error: error instanceof Error ? error.message : String(error),
              });
            }
          });
        }
      }

      return {
        success: failed.length === 0,
        count: allIds.length - failed.length,
        ids: allIds,
        failed: failed.length > 0 ? failed : undefined,
      };
    };

    return this.withRetry(operation, "batchSet");
  }

  async batchUpdate(
    collection: string,
    updates: Array<{ id: string; data: Partial<Record<string, any>> }>
  ): Promise<BatchResult> {
    validatePath(collection);

    const operation = async () => {
      const chunks = chunkArray(updates, this.MAX_BATCH_SIZE);
      const allIds: string[] = [];
      const failed: Array<{ id: string; error: string }> = [];

      for (const chunk of chunks) {
        const batch: WriteBatch = this.db.batch();

        for (const item of chunk) {
          try {
            validateId(item.id);
            const ref = this.db.collection(collection).doc(item.id);
            const sanitized = DataSanitizer.validateAndSanitize(item.data);
            batch.update(ref, {
              ...sanitized,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            allIds.push(item.id);
          } catch (error) {
            failed.push({
              id: item.id,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }

        try {
          await batch.commit();
        } catch (error) {
          chunk.forEach((item) => {
            if (!failed.find((f) => f.id === item.id)) {
              failed.push({
                id: item.id,
                error: error instanceof Error ? error.message : String(error),
              });
            }
          });
        }
      }

      return {
        success: failed.length === 0,
        count: allIds.length - failed.length,
        ids: allIds,
        failed: failed.length > 0 ? failed : undefined,
      };
    };

    return this.withRetry(operation, "batchUpdate");
  }

  async batchDelete(
    collection: string,
    ids: string[]
  ): Promise<BatchResult> {
    validatePath(collection);

    const operation = async () => {
      const chunks = chunkArray(ids, this.MAX_BATCH_SIZE);
      let deletedCount = 0;
      const failed: Array<{ id: string; error: string }> = [];

      for (const chunk of chunks) {
        const batch: WriteBatch = this.db.batch();

        for (const id of chunk) {
          try {
            validateId(id);
            const ref = this.db.collection(collection).doc(id);
            batch.delete(ref);
          } catch (error) {
            failed.push({
              id,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }

        try {
          await batch.commit();
          deletedCount += chunk.length - failed.filter((f) => chunk.includes(f.id)).length;
        } catch (error) {
          chunk.forEach((id) => {
            if (!failed.find((f) => f.id === id)) {
              failed.push({
                id,
                error: error instanceof Error ? error.message : String(error),
              });
            }
          });
        }
      }

      return {
        success: failed.length === 0,
        count: deletedCount,
        ids,
        failed: failed.length > 0 ? failed : undefined,
      };
    };

    return this.withRetry(operation, "batchDelete");
  }

  async deleteCollection(
    collection: string,
    batchSize: number = 500
  ): Promise<{ deleted: number; batches: number }> {
    validatePath(collection);

    const operation = async () => {
      const collectionRef = this.db.collection(collection);
      let totalDeleted = 0;
      let batchCount = 0;

      while (true) {
        const snapshot = await collectionRef.limit(batchSize).get();

        if (snapshot.size === 0) {
          break;
        }

        const batch: WriteBatch = this.db.batch();
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });

        await batch.commit();
        totalDeleted += snapshot.size;
        batchCount++;

        if (snapshot.size < batchSize) {
          break;
        }
      }

      return { deleted: totalDeleted, batches: batchCount };
    };

    return this.withRetry(operation, "deleteCollection");
  }

  async batchIncrement(
    collection: string,
    updates: Array<{ id: string; field: string; amount: number }>
  ): Promise<BatchResult> {
    validatePath(collection);

    const operation = async () => {
      const chunks = chunkArray(updates, this.MAX_BATCH_SIZE);
      const allIds: string[] = [];
      const failed: Array<{ id: string; error: string }> = [];

      for (const chunk of chunks) {
        const batch: WriteBatch = this.db.batch();

        for (const item of chunk) {
          try {
            validateId(item.id);
            const ref = this.db.collection(collection).doc(item.id);
            batch.update(ref, {
              [item.field]: admin.firestore.FieldValue.increment(item.amount),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            allIds.push(item.id);
          } catch (error) {
            failed.push({
              id: item.id,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }

        try {
          await batch.commit();
        } catch (error) {
          chunk.forEach((item) => {
            if (!failed.find((f) => f.id === item.id)) {
              failed.push({
                id: item.id,
                error: error instanceof Error ? error.message : String(error),
              });
            }
          });
        }
      }

      return {
        success: failed.length === 0,
        count: allIds.length - failed.length,
        ids: allIds,
        failed: failed.length > 0 ? failed : undefined,
      };
    };

    return this.withRetry(operation, "batchIncrement");
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