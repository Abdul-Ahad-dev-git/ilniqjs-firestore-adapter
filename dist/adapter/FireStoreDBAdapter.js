"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FSDB = exports.FireStoreDBAdapter = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const connection_factory_1 = require("../config/connection.factory");
const adapter_options_1 = require("../config/adapter.options");
const SimpleCrudService_1 = require("../services/crud/SimpleCrudService");
const RelationalCrudService_1 = require("../services/crud/RelationalCrudService");
const QueryService_1 = require("../services/query/QueryService");
const BatchService_1 = require("../services/batch/BatchService");
const TransactionService_1 = require("../services/transaction/TransactionService");
const MigrationService_1 = require("../services/migration/MigrationService");
class FireStoreDBAdapter {
    constructor(options) {
        this.crudService = null;
        this.relationalService = null;
        this.queryService = null;
        this.batchService = null;
        this.transactionService = null;
        this.migrationService = null;
        this.isInitialized = false;
        this.options = (0, adapter_options_1.mergeOptions)(options);
        this.connectionFactory = connection_factory_1.ConnectionFactory.getInstance(this.options);
        if (this.options.enableGracefulShutdown) {
            this.setupGracefulShutdown();
        }
    }
    async ensureInitialized() {
        if (this.isInitialized)
            return;
        await this.connectionFactory.initialize();
        this.isInitialized = true;
    }
    async getDb() {
        await this.ensureInitialized();
        return this.connectionFactory.getFirestore();
    }
    async getCrudService() {
        if (!this.crudService) {
            const db = await this.getDb();
            this.crudService = new SimpleCrudService_1.SimpleCrudService(db, this.options.enableRetry, this.options.retryConfig);
        }
        return this.crudService;
    }
    async getRelationalService() {
        if (!this.relationalService) {
            const db = await this.getDb();
            this.relationalService = new RelationalCrudService_1.RelationalCrudService(db, this.options.enableRetry, this.options.retryConfig);
        }
        return this.relationalService;
    }
    async getQueryService() {
        if (!this.queryService) {
            const db = await this.getDb();
            this.queryService = new QueryService_1.QueryService(db, this.options.enableRetry, this.options.retryConfig);
        }
        return this.queryService;
    }
    async getBatchService() {
        if (!this.batchService) {
            const db = await this.getDb();
            this.batchService = new BatchService_1.BatchService(db, this.options.enableRetry, this.options.retryConfig);
        }
        return this.batchService;
    }
    async getTransactionService() {
        if (!this.transactionService) {
            const db = await this.getDb();
            this.transactionService = new TransactionService_1.TransactionService(db, this.options.enableRetry, this.options.retryConfig);
        }
        return this.transactionService;
    }
    async getMigrationService() {
        if (!this.migrationService) {
            const db = await this.getDb();
            this.migrationService = new MigrationService_1.MigrationService(db, this.options.enableRetry, this.options.retryConfig);
        }
        return this.migrationService;
    }
    async create(collection, data) {
        const service = await this.getCrudService();
        return service.create(collection, data);
    }
    async set(collection, id, data, merge = false) {
        const service = await this.getCrudService();
        return service.set(collection, id, data, merge);
    }
    async read(collection, id) {
        const service = await this.getCrudService();
        return service.read(collection, id);
    }
    async update(collection, id, data) {
        const service = await this.getCrudService();
        return service.update(collection, id, data);
    }
    async delete(collection, id) {
        const service = await this.getCrudService();
        return service.delete(collection, id);
    }
    async exists(collection, id) {
        const service = await this.getCrudService();
        return service.exists(collection, id);
    }
    async upsert(collection, id, data) {
        const service = await this.getCrudService();
        return service.upsert(collection, id, data);
    }
    async list(collection) {
        const service = await this.getCrudService();
        return service.list(collection);
    }
    async count(collection) {
        const service = await this.getCrudService();
        return service.count(collection);
    }
    async findOne(collection, filters) {
        const service = await this.getCrudService();
        return service.findOne(collection, filters);
    }
    async createRelational(collection, data, refs = {}, docId) {
        const service = await this.getRelationalService();
        return service.createRelational(collection, data, refs, docId);
    }
    async setRelational(collection, id, data, refs = {}, merge = false) {
        const service = await this.getRelationalService();
        return service.setRelational(collection, id, data, refs, merge);
    }
    async readRelational(collection, id) {
        const service = await this.getRelationalService();
        return service.readRelational(collection, id);
    }
    async readFlattened(collection, id) {
        const service = await this.getRelationalService();
        return service.readFlattened(collection, id);
    }
    async updateData(collection, id, updates) {
        const service = await this.getRelationalService();
        return service.updateData(collection, id, updates);
    }
    async updateRefs(collection, id, refs) {
        const service = await this.getRelationalService();
        return service.updateRefs(collection, id, refs);
    }
    async updateRelational(collection, id, dataUpdates, refUpdates) {
        const service = await this.getRelationalService();
        return service.updateRelational(collection, id, dataUpdates, refUpdates);
    }
    async queryByRef(collection, refKey, refValue) {
        const service = await this.getRelationalService();
        return service.queryByRef(collection, refKey, refValue);
    }
    async queryByRefWithData(collection, refKey, refValue, dataFilters) {
        const service = await this.getRelationalService();
        return service.queryByRefWithData(collection, refKey, refValue, dataFilters);
    }
    async queryByRefs(collection, refs) {
        const service = await this.getRelationalService();
        return service.queryByRefs(collection, refs);
    }
    async queryByRefsWithData(collection, refs, dataFilters) {
        const service = await this.getRelationalService();
        return service.queryByRefsWithData(collection, refs, dataFilters);
    }
    async queryByRefFlattened(collection, refKey, refValue) {
        const service = await this.getRelationalService();
        return service.queryByRefFlattened(collection, refKey, refValue);
    }
    async countByRef(collection, refKey, refValue) {
        const service = await this.getRelationalService();
        return service.countByRef(collection, refKey, refValue);
    }
    async relationExists(collection, refs) {
        const service = await this.getRelationalService();
        return service.relationExists(collection, refs);
    }
    async findOneByRefs(collection, refs) {
        const service = await this.getRelationalService();
        return service.findOneByRefs(collection, refs);
    }
    async findOrCreateWithRefs(collection, data, refs) {
        const service = await this.getRelationalService();
        return service.findOrCreateWithRefs(collection, data, refs);
    }
    async upsertWithRefs(collection, data, refs) {
        const service = await this.getRelationalService();
        return service.upsertWithRefs(collection, data, refs);
    }
    async toggleRelation(collection, data, refs) {
        const service = await this.getRelationalService();
        return service.toggleRelation(collection, data, refs);
    }
    async deleteByRef(collection, refKey, refValue, batchSize = 500) {
        const service = await this.getRelationalService();
        return service.deleteByRef(collection, refKey, refValue, batchSize);
    }
    async getRelated(parentCollection, parentId, childCollection, relationKey) {
        const service = await this.getRelationalService();
        return service.getRelated(parentCollection, parentId, childCollection, relationKey);
    }
    async cascadeDeleteRelational(parentCollection, parentId, cascadeRules) {
        const service = await this.getRelationalService();
        return service.cascadeDeleteRelational(parentCollection, parentId, cascadeRules);
    }
    async batchCreateRelational(collection, documents) {
        const service = await this.getRelationalService();
        return service.batchCreateRelational(collection, documents);
    }
    async aggregateCountByParent(collection, refKey, parentIds) {
        const service = await this.getRelationalService();
        return service.aggregateCountByParent(collection, refKey, parentIds);
    }
    async query(collection, filters) {
        const service = await this.getQueryService();
        return service.query(collection, filters);
    }
    async queryAdvanced(collection, filters) {
        const service = await this.getQueryService();
        return service.queryAdvanced(collection, filters);
    }
    async queryOrdered(collection, filters, orderField, direction = "asc") {
        const service = await this.getQueryService();
        return service.queryOrdered(collection, filters, orderField, direction);
    }
    async queryOrderedAdvanced(collection, filters, orderField, direction = "asc") {
        const service = await this.getQueryService();
        return service.queryOrderedAdvanced(collection, filters, orderField, direction);
    }
    async queryPaginated(collection, filters, limit, startAfter) {
        const service = await this.getQueryService();
        return service.queryPaginated(collection, filters, limit, startAfter);
    }
    async queryPaginatedAdvanced(collection, filters, limit, startAfter) {
        const service = await this.getQueryService();
        return service.queryPaginatedAdvanced(collection, filters, limit, startAfter);
    }
    async findOneAdvanced(collection, filters) {
        const service = await this.getQueryService();
        return service.findOneAdvanced(collection, filters);
    }
    async countWhere(collection, filters) {
        const service = await this.getQueryService();
        return service.countWhere(collection, filters);
    }
    async countWhereAdvanced(collection, filters) {
        const service = await this.getQueryService();
        return service.countWhereAdvanced(collection, filters);
    }
    async queryWithOptions(collection, filters, options) {
        const service = await this.getQueryService();
        return service.queryWithOptions(collection, filters, options);
    }
    async batchCreate(collection, documents) {
        const service = await this.getBatchService();
        return service.batchCreate(collection, documents);
    }
    async batchSet(collection, documents) {
        const service = await this.getBatchService();
        return service.batchSet(collection, documents);
    }
    async batchUpdate(collection, updates) {
        const service = await this.getBatchService();
        return service.batchUpdate(collection, updates);
    }
    async batchDelete(collection, ids) {
        const service = await this.getBatchService();
        return service.batchDelete(collection, ids);
    }
    async deleteCollection(collection, batchSize = 500) {
        const service = await this.getBatchService();
        return service.deleteCollection(collection, batchSize);
    }
    async batchIncrement(collection, updates) {
        const service = await this.getBatchService();
        return service.batchIncrement(collection, updates);
    }
    async runTransaction(operation) {
        const service = await this.getTransactionService();
        return service.runTransaction(operation);
    }
    async atomicIncrement(collection, id, field, amount) {
        const service = await this.getTransactionService();
        return service.atomicIncrement(collection, id, field, amount);
    }
    async atomicDecrement(collection, id, field, amount, minValue) {
        const service = await this.getTransactionService();
        return service.atomicDecrement(collection, id, field, amount, minValue);
    }
    async atomicTransfer(fromCollection, fromId, toCollection, toId, field, amount) {
        const service = await this.getTransactionService();
        return service.atomicTransfer(fromCollection, fromId, toCollection, toId, field, amount);
    }
    async conditionalUpdate(collection, id, condition, updates) {
        const service = await this.getTransactionService();
        return service.conditionalUpdate(collection, id, condition, updates);
    }
    async readModifyWrite(collection, id, modifier) {
        const service = await this.getTransactionService();
        return service.readModifyWrite(collection, id, modifier);
    }
    async compareAndSwap(collection, id, field, expectedValue, newValue) {
        const service = await this.getTransactionService();
        return service.compareAndSwap(collection, id, field, expectedValue, newValue);
    }
    async convertToRelational(collection, docId, refKeys) {
        const service = await this.getMigrationService();
        return service.convertToRelational(collection, docId, refKeys);
    }
    async batchConvertToRelational(collection, refKeys, batchSize = 500) {
        const service = await this.getMigrationService();
        return service.batchConvertToRelational(collection, refKeys, batchSize);
    }
    async batchTransform(collection, transformation, batchSize = 500) {
        const service = await this.getMigrationService();
        return service.batchTransform(collection, transformation, batchSize);
    }
    async addFieldToAll(collection, field, value, batchSize = 500) {
        const service = await this.getMigrationService();
        return service.addFieldToAll(collection, field, value, batchSize);
    }
    async removeFieldFromAll(collection, field, batchSize = 500) {
        const service = await this.getMigrationService();
        return service.removeFieldFromAll(collection, field, batchSize);
    }
    async renameField(collection, oldField, newField, batchSize = 500) {
        const service = await this.getMigrationService();
        return service.renameField(collection, oldField, newField, batchSize);
    }
    async copyCollection(sourceCollection, targetCollection, batchSize = 500) {
        const service = await this.getMigrationService();
        return service.copyCollection(sourceCollection, targetCollection, batchSize);
    }
    async validateMigration(collection, validator) {
        const service = await this.getMigrationService();
        return service.validateMigration(collection, validator);
    }
    serverTimestamp() {
        return firebase_admin_1.default.firestore.FieldValue.serverTimestamp();
    }
    arrayUnion(...items) {
        return firebase_admin_1.default.firestore.FieldValue.arrayUnion(...items);
    }
    arrayRemove(...items) {
        return firebase_admin_1.default.firestore.FieldValue.arrayRemove(...items);
    }
    increment(by) {
        return firebase_admin_1.default.firestore.FieldValue.increment(by);
    }
    deleteField() {
        return firebase_admin_1.default.firestore.FieldValue.delete();
    }
    getMetrics() {
        return this.connectionFactory.getMetrics();
    }
    async getFirestoreInstance() {
        return this.getDb();
    }
    async close() {
        await this.connectionFactory.close();
        this.isInitialized = false;
        this.crudService = null;
        this.relationalService = null;
        this.queryService = null;
        this.batchService = null;
        this.transactionService = null;
        this.migrationService = null;
    }
    setupGracefulShutdown() {
        const shutdown = async (signal) => {
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
            }
            catch (error) {
                console.error("[FirestoreAdapter] Error during shutdown:", error);
                clearTimeout(timeout);
                process.exit(1);
            }
        };
        process.once("SIGTERM", () => shutdown("SIGTERM"));
        process.once("SIGINT", () => shutdown("SIGINT"));
    }
}
exports.FireStoreDBAdapter = FireStoreDBAdapter;
exports.FSDB = new FireStoreDBAdapter();
//# sourceMappingURL=FireStoreDBAdapter.js.map