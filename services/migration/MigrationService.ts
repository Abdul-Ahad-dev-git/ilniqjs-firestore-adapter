// services/migration/MigrationService.ts
import admin from "firebase-admin";
import type { Firestore, WriteBatch } from "firebase-admin/firestore";
import type { MigrationResult, RetryConfig } from "../../core/types";
import { retryWithBackoff, validatePath, validateId, chunkArray } from "../../core/utils";
import { MigrationError, DocumentNotFoundError } from "../../core/errors";

export class MigrationService {
  private readonly BATCH_SIZE = 500;

  constructor(
    private readonly db: Firestore,
    private readonly enableRetry: boolean = true,
    private readonly retryConfig?: RetryConfig
  ) {}

  async convertToRelational(
    collection: string,
    docId: string,
    refKeys: string[]
  ): Promise<MigrationResult> {
    validatePath(collection);
    validateId(docId);

    const operation = async () => {
      const ref = this.db.collection(collection).doc(docId);
      const doc = await ref.get();

      if (!doc.exists) {
        throw new DocumentNotFoundError(collection, docId);
      }

      const rawData = doc.data();
      if (!rawData) {
        throw new MigrationError("Document has no data", { collection, docId });
      }

      const { createdAt, updatedAt, ...allData } = rawData;
      const data: Record<string, any> = {};
      const refs: Record<string, string> = {};

      for (const [key, value] of Object.entries(allData)) {
        if (refKeys.includes(key)) {
          refs[key] = String(value);
        } else {
          data[key] = value;
        }
      }

      await ref.set({
        data,
        refs,
        createdAt: createdAt || admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { converted: 1, batches: 1 };
    };

    return this.withRetry(operation, "convertToRelational");
  }

  async batchConvertToRelational(
    collection: string,
    refKeys: string[],
    batchSize: number = this.BATCH_SIZE
  ): Promise<MigrationResult> {
    validatePath(collection);

    const operation = async () => {
      const snapshot = await this.db.collection(collection).get();
      const docs = snapshot.docs;

      if (docs.length === 0) {
        return { converted: 0, batches: 0 };
      }

      const chunks = chunkArray(docs, batchSize);
      let totalConverted = 0;
      const errors: Array<{ id: string; error: string }> = [];

      for (const chunk of chunks) {
        const batch: WriteBatch = this.db.batch();

        for (const doc of chunk) {
          try {
            const rawData = doc.data();
            const { createdAt, updatedAt, ...allData } = rawData;
            const data: Record<string, any> = {};
            const refs: Record<string, string> = {};

            for (const [key, value] of Object.entries(allData)) {
              if (refKeys.includes(key)) {
                refs[key] = String(value);
              } else {
                data[key] = value;
              }
            }

            batch.set(doc.ref, {
              data,
              refs,
              createdAt: createdAt || admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            totalConverted++;
          } catch (error) {
            errors.push({
              id: doc.id,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }

        await batch.commit();
      }

      return {
        converted: totalConverted,
        batches: chunks.length,
        failed: errors.length,
        errors: errors.length > 0 ? errors : undefined,
      };
    };

    return this.withRetry(operation, "batchConvertToRelational");
  }

  async batchTransform<T = any>(
    collection: string,
    transformation: (doc: T & { id: string }) => Record<string, any>,
    batchSize: number = this.BATCH_SIZE
  ): Promise<MigrationResult> {
    validatePath(collection);

    const operation = async () => {
      const snapshot = await this.db.collection(collection).get();
      const docs = snapshot.docs;

      if (docs.length === 0) {
        return { converted: 0, batches: 0 };
      }

      const chunks = chunkArray(docs, batchSize);
      let totalTransformed = 0;
      const errors: Array<{ id: string; error: string }> = [];

      for (const chunk of chunks) {
        const batch: WriteBatch = this.db.batch();

        for (const doc of chunk) {
          try {
            const data = doc.data() as T;
            const transformed = transformation({ id: doc.id, ...data });

            batch.set(doc.ref, {
              ...transformed,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            totalTransformed++;
          } catch (error) {
            errors.push({
              id: doc.id,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }

        await batch.commit();
      }

      return {
        converted: totalTransformed,
        batches: chunks.length,
        failed: errors.length,
        errors: errors.length > 0 ? errors : undefined,
      };
    };

    return this.withRetry(operation, "batchTransform");
  }

  async addFieldToAll(
    collection: string,
    field: string,
    value: any,
    batchSize: number = this.BATCH_SIZE
  ): Promise<MigrationResult> {
    validatePath(collection);

    const operation = async () => {
      const snapshot = await this.db.collection(collection).get();
      const docs = snapshot.docs;

      if (docs.length === 0) {
        return { converted: 0, batches: 0 };
      }

      const chunks = chunkArray(docs, batchSize);
      let totalUpdated = 0;

      for (const chunk of chunks) {
        const batch: WriteBatch = this.db.batch();

        for (const doc of chunk) {
          batch.update(doc.ref, {
            [field]: value,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          totalUpdated++;
        }

        await batch.commit();
      }

      return {
        converted: totalUpdated,
        batches: chunks.length,
      };
    };

    return this.withRetry(operation, "addFieldToAll");
  }

  async removeFieldFromAll(
    collection: string,
    field: string,
    batchSize: number = this.BATCH_SIZE
  ): Promise<MigrationResult> {
    validatePath(collection);

    const operation = async () => {
      const snapshot = await this.db.collection(collection).get();
      const docs = snapshot.docs;

      if (docs.length === 0) {
        return { converted: 0, batches: 0 };
      }

      const chunks = chunkArray(docs, batchSize);
      let totalUpdated = 0;

      for (const chunk of chunks) {
        const batch: WriteBatch = this.db.batch();

        for (const doc of chunk) {
          batch.update(doc.ref, {
            [field]: admin.firestore.FieldValue.delete(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          totalUpdated++;
        }

        await batch.commit();
      }

      return {
        converted: totalUpdated,
        batches: chunks.length,
      };
    };

    return this.withRetry(operation, "removeFieldFromAll");
  }

  async renameField(
    collection: string,
    oldField: string,
    newField: string,
    batchSize: number = this.BATCH_SIZE
  ): Promise<MigrationResult> {
    validatePath(collection);

    const operation = async () => {
      const snapshot = await this.db.collection(collection).get();
      const docs = snapshot.docs;

      if (docs.length === 0) {
        return { converted: 0, batches: 0 };
      }

      const chunks = chunkArray(docs, batchSize);
      let totalUpdated = 0;
      const errors: Array<{ id: string; error: string }> = [];

      for (const chunk of chunks) {
        const batch: WriteBatch = this.db.batch();

        for (const doc of chunk) {
          try {
            const data = doc.data();

            if (oldField in data) {
              batch.update(doc.ref, {
                [newField]: data[oldField],
                [oldField]: admin.firestore.FieldValue.delete(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              });
              totalUpdated++;
            }
          } catch (error) {
            errors.push({
              id: doc.id,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }

        await batch.commit();
      }

      return {
        converted: totalUpdated,
        batches: chunks.length,
        failed: errors.length,
        errors: errors.length > 0 ? errors : undefined,
      };
    };

    return this.withRetry(operation, "renameField");
  }

  async copyCollection(
    sourceCollection: string,
    targetCollection: string,
    batchSize: number = this.BATCH_SIZE
  ): Promise<MigrationResult> {
    validatePath(sourceCollection);
    validatePath(targetCollection);

    const operation = async () => {
      const snapshot = await this.db.collection(sourceCollection).get();
      const docs = snapshot.docs;

      if (docs.length === 0) {
        return { converted: 0, batches: 0 };
      }

      const chunks = chunkArray(docs, batchSize);
      let totalCopied = 0;

      for (const chunk of chunks) {
        const batch: WriteBatch = this.db.batch();

        for (const doc of chunk) {
          const targetRef = this.db.collection(targetCollection).doc(doc.id);
          batch.set(targetRef, doc.data());
          totalCopied++;
        }

        await batch.commit();
      }

      return {
        converted: totalCopied,
        batches: chunks.length,
      };
    };

    return this.withRetry(operation, "copyCollection");
  }

  async validateMigration<T = any>(
    collection: string,
    validator: (doc: T & { id: string }) => { valid: boolean; errors?: string[] }
  ): Promise<{
    total: number;
    valid: number;
    invalid: number;
    errors: Array<{ id: string; errors: string[] }>;
  }> {
    validatePath(collection);

    const snapshot = await this.db.collection(collection).get();
    const docs = snapshot.docs;

    let validCount = 0;
    let invalidCount = 0;
    const errors: Array<{ id: string; errors: string[] }> = [];

    for (const doc of docs) {
      const data = doc.data() as T;
      const result = validator({ id: doc.id, ...data });

      if (result.valid) {
        validCount++;
      } else {
        invalidCount++;
        if (result.errors) {
          errors.push({ id: doc.id, errors: result.errors });
        }
      }
    }

    return {
      total: docs.length,
      valid: validCount,
      invalid: invalidCount,
      errors,
    };
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