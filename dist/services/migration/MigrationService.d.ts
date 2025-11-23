import type { Firestore } from "firebase-admin/firestore";
import type { MigrationResult, RetryConfig } from "../../core/types";
export declare class MigrationService {
    private readonly db;
    private readonly enableRetry;
    private readonly retryConfig?;
    private readonly BATCH_SIZE;
    constructor(db: Firestore, enableRetry?: boolean, retryConfig?: RetryConfig | undefined);
    convertToRelational(collection: string, docId: string, refKeys: string[]): Promise<MigrationResult>;
    batchConvertToRelational(collection: string, refKeys: string[], batchSize?: number): Promise<MigrationResult>;
    batchTransform<T = any>(collection: string, transformation: (doc: T & {
        id: string;
    }) => Record<string, any>, batchSize?: number): Promise<MigrationResult>;
    addFieldToAll(collection: string, field: string, value: any, batchSize?: number): Promise<MigrationResult>;
    removeFieldFromAll(collection: string, field: string, batchSize?: number): Promise<MigrationResult>;
    renameField(collection: string, oldField: string, newField: string, batchSize?: number): Promise<MigrationResult>;
    copyCollection(sourceCollection: string, targetCollection: string, batchSize?: number): Promise<MigrationResult>;
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
    private withRetry;
}
//# sourceMappingURL=MigrationService.d.ts.map