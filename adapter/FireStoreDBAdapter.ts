// adapter/FireStoreDBAdapter.ts
import admin from "firebase-admin";
import type { Firestore, FieldValue } from "firebase-admin/firestore";
import { ConnectionFactory } from "../config/connection.factory";
import { mergeOptions, type AdapterOptions } from "../config/adapter.options";
import { SimpleCrudService } from "../services/crud/SimpleCrudService";
import { RelationalCrudService } from "../services/crud/RelationalCrudService";
import { QueryService } from "../services/query/QueryService";
import { BatchService } from "../services/batch/BatchService";
import { TransactionService } from "../services/transaction/TransactionService";
import { MigrationService } from "../services/migration/MigrationService";
import type { ConnectionMetrics } from "../core/types";

export class FireStoreDBAdapter {
  private connectionFactory: ConnectionFactory;
  private options: AdapterOptions;
  
  private crudService: SimpleCrudService | null = null;
  private relationalService: RelationalCrudService | null = null;
  private queryService: QueryService | null = null;
  private batchService: BatchService | null = null;
  private transactionService: TransactionService | null = null;
  private migrationService: MigrationService | null = null;
  
  private isInitialized: boolean = false;

  constructor(options?: Partial<AdapterOptions>) {
    this.options = mergeOptions(options);
    this.connectionFactory = ConnectionFactory.getInstance(this.options);
    
    if (this.options.enableGracefulShutdown) {
      this.setupGracefulShutdown();
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (this.isInitialized) return;
    await this.connectionFactory.initialize();
    this.isInitialized = true;
  }

  private async getDb(): Promise<Firestore> {
    await this.ensureInitialized();
    return this.connectionFactory.getFirestore();
  }

  private async getCrudService(): Promise<SimpleCrudService> {
    if (!this.crudService) {
      const db = await this.getDb();
      this.crudService = new SimpleCrudService(
        db,
        this.options.enableRetry,
        this.options.retryConfig
      );
    }
    return this.crudService;
  }

  private async getRelationalService(): Promise<RelationalCrudService> {
    if (!this.relationalService) {
      const db = await this.getDb();
      this.relationalService = new RelationalCrudService(
        db,
        this.options.enableRetry,
        this.options.retryConfig
      );
    }
    return this.relationalService;
  }

  private async getQueryService(): Promise<QueryService> {
    if (!this.queryService) {
      const db = await this.getDb();
      this.queryService = new QueryService(
        db,
        this.options.enableRetry,
        this.options.retryConfig
      );
    }
    return this.queryService;
  }

  private async getBatchService(): Promise<BatchService> {
    if (!this.batchService) {
      const db = await this.getDb();
      this.batchService = new BatchService(
        db,
        this.options.enableRetry,
        this.options.retryConfig
      );
    }
    return this.batchService;
  }

  private async getTransactionService(): Promise<TransactionService> {
    if (!this.transactionService) {
      const db = await this.getDb();
      this.transactionService = new TransactionService(
        db,
        this.options.enableRetry,
        this.options.retryConfig
      );
    }
    return this.transactionService;
  }

  private async getMigrationService(): Promise<MigrationService> {
    if (!this.migrationService) {
      const db = await this.getDb();
      this.migrationService = new MigrationService(
        db,
        this.options.enableRetry,
        this.options.retryConfig
      );
    }
    return this.migrationService;
  }

  // SIMPLE CRUD
  async create(collection: string, data: Record<string, any>) {
    const service = await this.getCrudService();
    return service.create(collection, data);
  }

  async set(collection: string, id: string, data: Record<string, any>, merge = false) {
    const service = await this.getCrudService();
    return service.set(collection, id, data, merge);
  }

  async read<T = any>(collection: string, id: string) {
    const service = await this.getCrudService();
    return service.read<T>(collection, id);
  }

  async update(collection: string, id: string, data: Partial<Record<string, any>>) {
    const service = await this.getCrudService();
    return service.update(collection, id, data);
  }

  async delete(collection: string, id: string) {
    const service = await this.getCrudService();
    return service.delete(collection, id);
  }

  async exists(collection: string, id: string) {
    const service = await this.getCrudService();
    return service.exists(collection, id);
  }

  async upsert<T = any>(collection: string, id: string, data: Record<string, any>) {
    const service = await this.getCrudService();
    return service.upsert<T>(collection, id, data);
  }

  async list<T = any>(collection: string) {
    const service = await this.getCrudService();
    return service.list<T>(collection);
  }

  async count(collection: string) {
    const service = await this.getCrudService();
    return service.count(collection);
  }

  async findOne<T = any>(collection: string, filters: Record<string, any>) {
    const service = await this.getCrudService();
    return service.findOne<T>(collection, filters);
  }

  // RELATIONAL CRUD
  async createRelational<T = any>(
    collection: string,
    data: T,
    refs: Record<string, string> = {},
    docId?: string
  ) {
    const service = await this.getRelationalService();
    return service.createRelational(collection, data, refs, docId);
  }

  async setRelational<T = any>(
    collection: string,
    id: string,
    data: T,
    refs: Record<string, string> = {},
    merge = false
  ) {
    const service = await this.getRelationalService();
    return service.setRelational(collection, id, data, refs, merge);
  }

  async readRelational<T = any>(collection: string, id: string) {
    const service = await this.getRelationalService();
    return service.readRelational<T>(collection, id);
  }

  async readFlattened<T = any>(collection: string, id: string) {
    const service = await this.getRelationalService();
    return service.readFlattened<T>(collection, id);
  }

  async updateData<T = any>(collection: string, id: string, updates: Partial<T>) {
    const service = await this.getRelationalService();
    return service.updateData(collection, id, updates);
  }

  async updateRefs(collection: string, id: string, refs: Record<string, string>) {
    const service = await this.getRelationalService();
    return service.updateRefs(collection, id, refs);
  }

  async updateRelational<T = any>(
    collection: string,
    id: string,
    dataUpdates?: Partial<T>,
    refUpdates?: Record<string, string>
  ) {
    const service = await this.getRelationalService();
    return service.updateRelational(collection, id, dataUpdates, refUpdates);
  }

  async queryByRef<T = any>(collection: string, refKey: string, refValue: string) {
    const service = await this.getRelationalService();
    return service.queryByRef<T>(collection, refKey, refValue);
  }

  async queryByRefWithData<T = any>(
    collection: string,
    refKey: string,
    refValue: string,
    dataFilters: Record<string, any>
  ) {
    const service = await this.getRelationalService();
    return service.queryByRefWithData<T>(collection, refKey, refValue, dataFilters);
  }

  async queryByRefs<T = any>(collection: string, refs: Record<string, string>) {
    const service = await this.getRelationalService();
    return service.queryByRefs<T>(collection, refs);
  }

  async queryByRefsWithData<T = any>(
    collection: string,
    refs: Record<string, string>,
    dataFilters: Record<string, any>
  ) {
    const service = await this.getRelationalService();
    return service.queryByRefsWithData<T>(collection, refs, dataFilters);
  }

  async queryByRefFlattened<T = any>(
    collection: string,
    refKey: string,
    refValue: string
  ) {
    const service = await this.getRelationalService();
    return service.queryByRefFlattened<T>(collection, refKey, refValue);
  }

  async countByRef(collection: string, refKey: string, refValue: string) {
    const service = await this.getRelationalService();
    return service.countByRef(collection, refKey, refValue);
  }

  async relationExists(collection: string, refs: Record<string, string>) {
    const service = await this.getRelationalService();
    return service.relationExists(collection, refs);
  }

  async findOneByRefs<T = any>(collection: string, refs: Record<string, string>) {
    const service = await this.getRelationalService();
    return service.findOneByRefs<T>(collection, refs);
  }

  async findOrCreateWithRefs<T = any>(
    collection: string,
    data: T,
    refs: Record<string, string>
  ) {
    const service = await this.getRelationalService();
    return service.findOrCreateWithRefs(collection, data, refs);
  }

  async upsertWithRefs<T = any>(
    collection: string,
    data: T,
    refs: Record<string, string>
  ) {
    const service = await this.getRelationalService();
    return service.upsertWithRefs(collection, data, refs);
  }

  async toggleRelation<T = any>(
    collection: string,
    data: T,
    refs: Record<string, string>
  ) {
    const service = await this.getRelationalService();
    return service.toggleRelation(collection, data, refs);
  }

  async deleteByRef(
    collection: string,
    refKey: string,
    refValue: string,
    batchSize = 500
  ) {
    const service = await this.getRelationalService();
    return service.deleteByRef(collection, refKey, refValue, batchSize);
  }

  async getRelated<T = any, R = any>(
    parentCollection: string,
    parentId: string,
    childCollection: string,
    relationKey: string
  ) {
    const service = await this.getRelationalService();
    return service.getRelated<T, R>(
      parentCollection,
      parentId,
      childCollection,
      relationKey
    );
  }

  async cascadeDeleteRelational(
    parentCollection: string,
    parentId: string,
    cascadeRules: Array<{ collection: string; refKey: string }>
  ) {
    const service = await this.getRelationalService();
    return service.cascadeDeleteRelational(parentCollection, parentId, cascadeRules);
  }

  async batchCreateRelational<T = any>(
    collection: string,
    documents: Array<{ data: T; refs: Record<string, string> }>
  ) {
    const service = await this.getRelationalService();
    return service.batchCreateRelational(collection, documents);
  }

  async aggregateCountByParent(
    collection: string,
    refKey: string,
    parentIds: string[]
  ) {
    const service = await this.getRelationalService();
    return service.aggregateCountByParent(collection, refKey, parentIds);
  }

  // QUERY OPERATIONS
  async query<T = any>(collection: string, filters: Record<string, any>) {
    const service = await this.getQueryService();
    return service.query<T>(collection, filters);
  }

  async queryAdvanced<T = any>(collection: string, filters: any[]) {
    const service = await this.getQueryService();
    return service.queryAdvanced<T>(collection, filters);
  }

  async queryOrdered<T = any>(
    collection: string,
    filters: Record<string, any>,
    orderField: string,
    direction: "asc" | "desc" = "asc"
  ) {
    const service = await this.getQueryService();
    return service.queryOrdered<T>(collection, filters, orderField, direction);
  }

  async queryOrderedAdvanced<T = any>(
    collection: string,
    filters: any[],
    orderField: string,
    direction: "asc" | "desc" = "asc"
  ) {
    const service = await this.getQueryService();
    return service.queryOrderedAdvanced<T>(collection, filters, orderField, direction);
  }

  async queryPaginated<T = any>(
    collection: string,
    filters: Record<string, any>,
    limit: number,
    startAfter?: any
  ) {
    const service = await this.getQueryService();
    return service.queryPaginated<T>(collection, filters, limit, startAfter);
  }

  async queryPaginatedAdvanced<T = any>(
    collection: string,
    filters: any[],
    limit: number,
    startAfter?: any
  ) {
    const service = await this.getQueryService();
    return service.queryPaginatedAdvanced<T>(collection, filters, limit, startAfter);
  }

  async findOneAdvanced<T = any>(collection: string, filters: any[]) {
    const service = await this.getQueryService();
    return service.findOneAdvanced<T>(collection, filters);
  }

  async countWhere(collection: string, filters: Record<string, any>) {
    const service = await this.getQueryService();
    return service.countWhere(collection, filters);
  }

  async countWhereAdvanced(collection: string, filters: any[]) {
    const service = await this.getQueryService();
    return service.countWhereAdvanced(collection, filters);
  }

  async queryWithOptions<T = any>(collection: string, filters: any[], options: any) {
    const service = await this.getQueryService();
    return service.queryWithOptions<T>(collection, filters, options);
  }

  // BATCH OPERATIONS
  async batchCreate(collection: string, documents: Record<string, any>[]) {
    const service = await this.getBatchService();
    return service.batchCreate(collection, documents);
  }

  async batchSet(
    collection: string,
    documents: Array<{ id: string; data: Record<string, any>; merge?: boolean }>
  ) {
    const service = await this.getBatchService();
    return service.batchSet(collection, documents);
  }

  async batchUpdate(
    collection: string,
    updates: Array<{ id: string; data: Partial<Record<string, any>> }>
  ) {
    const service = await this.getBatchService();
    return service.batchUpdate(collection, updates);
  }

  async batchDelete(collection: string, ids: string[]) {
    const service = await this.getBatchService();
    return service.batchDelete(collection, ids);
  }

  async deleteCollection(collection: string, batchSize = 500) {
    const service = await this.getBatchService();
    return service.deleteCollection(collection, batchSize);
  }

  async batchIncrement(
    collection: string,
    updates: Array<{ id: string; field: string; amount: number }>
  ) {
    const service = await this.getBatchService();
    return service.batchIncrement(collection, updates);
  }

  // TRANSACTION OPERATIONS
  async runTransaction<T>(operation: (tx: any) => Promise<T>) {
    const service = await this.getTransactionService();
    return service.runTransaction(operation);
  }

  async atomicIncrement(
    collection: string,
    id: string,
    field: string,
    amount: number
  ) {
    const service = await this.getTransactionService();
    return service.atomicIncrement(collection, id, field, amount);
  }

  async atomicDecrement(
    collection: string,
    id: string,
    field: string,
    amount: number,
    minValue?: number
  ) {
    const service = await this.getTransactionService();
    return service.atomicDecrement(collection, id, field, amount, minValue);
  }

  async atomicTransfer(
    fromCollection: string,
    fromId: string,
    toCollection: string,
    toId: string,
    field: string,
    amount: number
  ) {
    const service = await this.getTransactionService();
    return service.atomicTransfer(
      fromCollection,
      fromId,
      toCollection,
      toId,
      field,
      amount
    );
  }

  async conditionalUpdate<T = any>(
    collection: string,
    id: string,
    condition: (data: T) => boolean,
    updates: Partial<Record<string, any>>
  ) {
    const service = await this.getTransactionService();
    return service.conditionalUpdate(collection, id, condition, updates);
  }

  async readModifyWrite<T = any>(
    collection: string,
    id: string,
    modifier: (data: T) => Partial<T>
  ) {
    const service = await this.getTransactionService();
    return service.readModifyWrite(collection, id, modifier);
  }

  async compareAndSwap<T = any>(
    collection: string,
    id: string,
    field: string,
    expectedValue: any,
    newValue: any
  ) {
    const service = await this.getTransactionService();
    return service.compareAndSwap<T>(collection, id, field, expectedValue, newValue);
  }

  // MIGRATION OPERATIONS
  async convertToRelational(collection: string, docId: string, refKeys: string[]) {
    const service = await this.getMigrationService();
    return service.convertToRelational(collection, docId, refKeys);
  }

  async batchConvertToRelational(
    collection: string,
    refKeys: string[],
    batchSize = 500
  ) {
    const service = await this.getMigrationService();
    return service.batchConvertToRelational(collection, refKeys, batchSize);
  }

  async batchTransform<T = any>(
    collection: string,
    transformation: (doc: T & { id: string }) => Record<string, any>,
    batchSize = 500
  ) {
    const service = await this.getMigrationService();
    return service.batchTransform(collection, transformation, batchSize);
  }

  async addFieldToAll(
    collection: string,
    field: string,
    value: any,
    batchSize = 500
  ) {
    const service = await this.getMigrationService();
    return service.addFieldToAll(collection, field, value, batchSize);
  }

  async removeFieldFromAll(collection: string, field: string, batchSize = 500) {
    const service = await this.getMigrationService();
    return service.removeFieldFromAll(collection, field, batchSize);
  }

  async renameField(
    collection: string,
    oldField: string,
    newField: string,
    batchSize = 500
  ) {
    const service = await this.getMigrationService();
    return service.renameField(collection, oldField, newField, batchSize);
  }

  async copyCollection(
    sourceCollection: string,
    targetCollection: string,
    batchSize = 500
  ) {
    const service = await this.getMigrationService();
    return service.copyCollection(sourceCollection, targetCollection, batchSize);
  }

  async validateMigration<T = any>(
    collection: string,
    validator: (doc: T & { id: string }) => { valid: boolean; errors?: string[] }
  ) {
    const service = await this.getMigrationService();
    return service.validateMigration(collection, validator);
  }

  // FIELD VALUE OPERATIONS
  serverTimestamp(): FieldValue {
    return admin.firestore.FieldValue.serverTimestamp();
  }

  arrayUnion(...items: any[]): FieldValue {
    return admin.firestore.FieldValue.arrayUnion(...items);
  }

  arrayRemove(...items: any[]): FieldValue {
    return admin.firestore.FieldValue.arrayRemove(...items);
  }

  increment(by: number): FieldValue {
    return admin.firestore.FieldValue.increment(by);
  }

  deleteField(): FieldValue {
    return admin.firestore.FieldValue.delete();
  }

  // UTILITY METHODS
  getMetrics(): ConnectionMetrics {
    return this.connectionFactory.getMetrics();
  }

  async getFirestoreInstance(): Promise<Firestore> {
    return this.getDb();
  }

  async close(): Promise<void> {
    await this.connectionFactory.close();
    this.isInitialized = false;
    this.crudService = null;
    this.relationalService = null;
    this.queryService = null;
    this.batchService = null;
    this.transactionService = null;
    this.migrationService = null;
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      console.log(`[FirestoreAdapter] Received ${signal}, shutting down...`);

      const timeout = setTimeout(() => {
        console.error("[FirestoreAdapter] Shutdown timeout, forcing exit");
        process.exit(1);
      }, this.options.shutdownTimeout);

      try {
        await this.close();
        clearTimeout(timeout);
        console.log("[FirestoreAdapter] Shutdown complete");
        process.exit(0);
      } catch (error) {
        console.error("[FirestoreAdapter] Error during shutdown:", error);
        clearTimeout(timeout);
        process.exit(1);
      }
    };

    process.once("SIGTERM", () => shutdown("SIGTERM"));
    process.once("SIGINT", () => shutdown("SIGINT"));
  }
}

export const FSDB = new FireStoreDBAdapter();