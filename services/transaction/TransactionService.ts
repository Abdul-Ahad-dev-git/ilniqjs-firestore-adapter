// services/transaction/TransactionService.ts
import admin from "firebase-admin";
import type { Firestore, Transaction } from "firebase-admin/firestore";
import type { UpdateResult, RetryConfig } from "../../core/types";
import { DataSanitizer } from "../../core/sanitizer";
import { retryWithBackoff, validatePath, validateId } from "../../core/utils";
import { TransactionError, DocumentNotFoundError } from "../../core/errors";

export class TransactionService {
  constructor(
    private readonly db: Firestore,
    private readonly enableRetry: boolean = true,
    private readonly retryConfig?: RetryConfig
  ) {}

  async runTransaction<T>(
    operation: (tx: Transaction) => Promise<T>
  ): Promise<T> {
    const txOperation = async () => {
      return this.db.runTransaction(async (tx) => {
        try {
          return await operation(tx);
        } catch (error) {
          throw new TransactionError(
            "Transaction operation failed",
            { error: error instanceof Error ? error.message : String(error) }
          );
        }
      });
    };

    return this.withRetry(txOperation, "runTransaction");
  }

  async atomicIncrement(
    collection: string,
    id: string,
    field: string,
    amount: number
  ): Promise<UpdateResult> {
    validatePath(collection);
    validateId(id);

    const operation = async () => {
      return this.db.runTransaction(async (tx) => {
        const ref = this.db.collection(collection).doc(id);
        const doc = await tx.get(ref);

        if (!doc.exists) {
          throw new DocumentNotFoundError(collection, id);
        }

        const currentValue = (doc.data()?.[field] as number) || 0;
        const newValue = currentValue + amount;

        tx.update(ref, {
          [field]: newValue,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return { id, timestamp: new Date() };
      });
    };

    return this.withRetry(operation, "atomicIncrement");
  }

  async atomicDecrement(
    collection: string,
    id: string,
    field: string,
    amount: number,
    minValue?: number
  ): Promise<UpdateResult> {
    validatePath(collection);
    validateId(id);

    const operation = async () => {
      return this.db.runTransaction(async (tx) => {
        const ref = this.db.collection(collection).doc(id);
        const doc = await tx.get(ref);

        if (!doc.exists) {
          throw new DocumentNotFoundError(collection, id);
        }

        const currentValue = (doc.data()?.[field] as number) || 0;
        const newValue = currentValue - amount;

        if (minValue !== undefined && newValue < minValue) {
          throw new TransactionError(
            `Cannot decrement ${field} below ${minValue}`,
            { currentValue, amount, minValue }
          );
        }

        tx.update(ref, {
          [field]: newValue,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return { id, timestamp: new Date() };
      });
    };

    return this.withRetry(operation, "atomicDecrement");
  }

  async atomicTransfer(
    fromCollection: string,
    fromId: string,
    toCollection: string,
    toId: string,
    field: string,
    amount: number
  ): Promise<{ from: UpdateResult; to: UpdateResult }> {
    validatePath(fromCollection);
    validatePath(toCollection);
    validateId(fromId);
    validateId(toId);

    const operation = async () => {
      return this.db.runTransaction(async (tx) => {
        const fromRef = this.db.collection(fromCollection).doc(fromId);
        const toRef = this.db.collection(toCollection).doc(toId);

        const [fromDoc, toDoc] = await Promise.all([
          tx.get(fromRef),
          tx.get(toRef),
        ]);

        if (!fromDoc.exists) {
          throw new DocumentNotFoundError(fromCollection, fromId);
        }
        if (!toDoc.exists) {
          throw new DocumentNotFoundError(toCollection, toId);
        }

        const fromValue = (fromDoc.data()?.[field] as number) || 0;
        const toValue = (toDoc.data()?.[field] as number) || 0;

        if (fromValue < amount) {
          throw new TransactionError(
            `Insufficient ${field} in source document`,
            { fromValue, amount }
          );
        }

        const timestamp = admin.firestore.FieldValue.serverTimestamp();

        tx.update(fromRef, {
          [field]: fromValue - amount,
          updatedAt: timestamp,
        });

        tx.update(toRef, {
          [field]: toValue + amount,
          updatedAt: timestamp,
        });

        return {
          from: { id: fromId, timestamp: new Date() },
          to: { id: toId, timestamp: new Date() },
        };
      });
    };

    return this.withRetry(operation, "atomicTransfer");
  }

  async conditionalUpdate<T = any>(
    collection: string,
    id: string,
    condition: (data: T) => boolean,
    updates: Partial<Record<string, any>>
  ): Promise<{ updated: boolean; result?: UpdateResult }> {
    validatePath(collection);
    validateId(id);

    const operation = async () => {
      return this.db.runTransaction(async (tx) => {
        const ref = this.db.collection(collection).doc(id);
        const doc = await tx.get(ref);

        if (!doc.exists) {
          throw new DocumentNotFoundError(collection, id);
        }

        const data = doc.data() as T;
        if (!condition(data)) {
          return { updated: false };
        }

        const sanitized = DataSanitizer.validateAndSanitize(updates);
        tx.update(ref, {
          ...sanitized,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return {
          updated: true,
          result: { id, timestamp: new Date() },
        };
      });
    };

    return this.withRetry(operation, "conditionalUpdate");
  }

  async readModifyWrite<T = any>(
    collection: string,
    id: string,
    modifier: (data: T) => Partial<T>
  ): Promise<UpdateResult> {
    validatePath(collection);
    validateId(id);

    const operation = async () => {
      return this.db.runTransaction(async (tx) => {
        const ref = this.db.collection(collection).doc(id);
        const doc = await tx.get(ref);

        if (!doc.exists) {
          throw new DocumentNotFoundError(collection, id);
        }

        const currentData = doc.data() as T;
        const updates = modifier(currentData);
        const sanitized = DataSanitizer.validateAndSanitize(updates as any);

        tx.update(ref, {
          ...sanitized,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return { id, timestamp: new Date() };
      });
    };

    return this.withRetry(operation, "readModifyWrite");
  }

  async transactionalBatchRead<T = any>(
    refs: Array<{ collection: string; id: string }>
  ): Promise<Array<(T & { id: string }) | null>> {
    refs.forEach((ref) => {
      validatePath(ref.collection);
      validateId(ref.id);
    });

    const operation = async () => {
      return this.db.runTransaction(async (tx) => {
        const docRefs = refs.map((ref) =>
          this.db.collection(ref.collection).doc(ref.id)
        );

        const docs = await Promise.all(docRefs.map((ref) => tx.get(ref)));

        return docs.map((doc, index) => {
          if (!doc.exists) {
            return null;
          }

          const data = doc.data();
          const sanitized = DataSanitizer.sanitizeDocument<T>(data);
          return { id: refs[index].id, ...sanitized } as T & { id: string };
        });
      });
    };

    return this.withRetry(operation, "transactionalBatchRead");
  }

  async compareAndSwap<T = any>(
    collection: string,
    id: string,
    field: string,
    expectedValue: any,
    newValue: any
  ): Promise<{ swapped: boolean; currentValue?: any }> {
    validatePath(collection);
    validateId(id);

    const operation = async () => {
      return this.db.runTransaction(async (tx) => {
        const ref = this.db.collection(collection).doc(id);
        const doc = await tx.get(ref);

        if (!doc.exists) {
          throw new DocumentNotFoundError(collection, id);
        }

        const data = doc.data() as T;
        const currentValue = (data as any)[field];

        if (currentValue !== expectedValue) {
          return { swapped: false, currentValue };
        }

        tx.update(ref, {
          [field]: newValue,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return { swapped: true };
      });
    };

    return this.withRetry(operation, "compareAndSwap");
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