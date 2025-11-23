// services/crud/SimpleCrudService.ts
import admin from "firebase-admin";
import type { Firestore, Query } from "firebase-admin/firestore";
import type { ICrudService } from "../../interfaces/ICrudService";
import type {
  CreateResult,
  UpdateResult,
  DeleteResult,
  UpsertResult,
  DocWithId,
  RetryConfig,
} from "../../core/types";
import { DocumentNotFoundError } from "../../core/errors";
import { DataSanitizer } from "../../core/sanitizer";
import { retryWithBackoff, validatePath, validateId } from "../../core/utils";

export class SimpleCrudService implements ICrudService {
  constructor(
    private readonly db: Firestore,
    private readonly enableRetry: boolean = true,
    private readonly retryConfig?: RetryConfig
  ) {}

  async create<T = any>(
    collection: string,
    data: Record<string, any>
  ): Promise<CreateResult> {
    validatePath(collection);
    
    const operation = async () => {
      const sanitized = DataSanitizer.validateAndSanitize(data);
      const ref = this.db.collection(collection);
      
      const doc = await ref.add({
        ...sanitized,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { id: doc.id, timestamp: new Date() };
    };

    return this.withRetry(operation, "create");
  }

  async set<T = any>(
    collection: string,
    id: string,
    data: Record<string, any>,
    merge: boolean = false
  ): Promise<CreateResult> {
    validatePath(collection);
    validateId(id);
    
    const operation = async () => {
      const sanitized = DataSanitizer.validateAndSanitize(data);
      const ref = this.db.collection(collection).doc(id);
      
      await ref.set(
        {
          ...sanitized,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge }
      );

      return { id, timestamp: new Date() };
    };

    return this.withRetry(operation, "set");
  }

  async read<T = any>(
    collection: string,
    id: string
  ): Promise<DocWithId<T> | null> {
    validatePath(collection);
    validateId(id);
    
    const operation = async () => {
      const doc = await this.db.collection(collection).doc(id).get();
      
      if (!doc.exists) {
        return null;
      }

      const data = doc.data();
      const sanitized = DataSanitizer.sanitizeDocument<T>(data);
      
      return { id: doc.id, ...sanitized } as DocWithId<T>;
    };

    return this.withRetry(operation, "read");
  }

  async update<T = any>(
    collection: string,
    id: string,
    data: Partial<Record<string, any>>
  ): Promise<UpdateResult> {
    validatePath(collection);
    validateId(id);
    
    const operation = async () => {
      const sanitized = DataSanitizer.validateAndSanitize(data);
      const ref = this.db.collection(collection).doc(id);
      
      const doc = await ref.get();
      if (!doc.exists) {
        throw new DocumentNotFoundError(collection, id);
      }

      await ref.update({
        ...sanitized,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { id, timestamp: new Date() };
    };

    return this.withRetry(operation, "update");
  }

  async delete(
    collection: string,
    id: string
  ): Promise<DeleteResult> {
    validatePath(collection);
    validateId(id);
    
    const operation = async () => {
      await this.db.collection(collection).doc(id).delete();
      return { id, deleted: true, timestamp: new Date() };
    };

    return this.withRetry(operation, "delete");
  }

  async exists(
    collection: string,
    id: string
  ): Promise<boolean> {
    validatePath(collection);
    validateId(id);
    
    const operation = async () => {
      const doc = await this.db.collection(collection).doc(id).get();
      return doc.exists;
    };

    return this.withRetry(operation, "exists");
  }

  async upsert<T = any>(
    collection: string,
    id: string,
    data: Record<string, any>
  ): Promise<UpsertResult> {
    validatePath(collection);
    validateId(id);
    
    const operation = async () => {
      const sanitized = DataSanitizer.validateAndSanitize(data);
      const ref = this.db.collection(collection).doc(id);
      const doc = await ref.get();
      const exists = doc.exists;

      if (exists) {
        await ref.update({
          ...sanitized,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        await ref.set({
          ...sanitized,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      return { id, exists, timestamp: new Date() };
    };

    return this.withRetry(operation, "upsert");
  }

  async list<T = any>(
    collection: string
  ): Promise<DocWithId<T>[]> {
    validatePath(collection);
    
    const operation = async () => {
      const snap = await this.db.collection(collection).get();
      
      return snap.docs.map((doc) => {
        const data = doc.data();
        const sanitized = DataSanitizer.sanitizeDocument<T>(data);
        return { id: doc.id, ...sanitized } as DocWithId<T>;
      });
    };

    return this.withRetry(operation, "list");
  }

  async count(
    collection: string
  ): Promise<number> {
    validatePath(collection);
    
    const operation = async () => {
      const snap = await this.db.collection(collection).count().get();
      return snap.data().count;
    };

    return this.withRetry(operation, "count");
  }

  async findOne<T = any>(
    collection: string,
    filters: Record<string, any>
  ): Promise<DocWithId<T> | null> {
    validatePath(collection);
    
    const operation = async () => {
      let ref: Query = this.db.collection(collection);

      for (const [key, value] of Object.entries(filters)) {
        ref = ref.where(key, "==", value);
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

    return this.withRetry(operation, "findOne");
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