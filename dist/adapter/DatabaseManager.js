"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseManager = void 0;
const FireStoreDBAdapter_1 = require("./FireStoreDBAdapter");
class DatabaseManager {
    constructor() {
    }
    static createInstance(name, config) {
        if (this.instances.has(name)) {
            console.warn(`⚠️  Instance "${name}" already exists. Returning existing instance.`);
            return this.instances.get(name);
        }
        const adapter = new FireStoreDBAdapter_1.FireStoreDBAdapter({
            enablePooling: true,
            idleTimeout: 300000,
            maxIdleTime: 600000,
            enableRetry: true,
            retryConfig: {
                maxRetries: 3,
                initialDelay: 100,
                maxDelay: 5000,
                backoffMultiplier: 2,
            },
            enableMetrics: true,
            enableTracing: true,
            enableGracefulShutdown: true,
            shutdownTimeout: 10000,
            logLevel: "info",
            ...config,
        });
        this.instances.set(name, adapter);
        console.log(`✅ Database instance "${name}" created`);
        if (this.instances.size === 1) {
            this.defaultInstanceName = name;
        }
        return adapter;
    }
    static getInstance(name = "default") {
        const instance = this.instances.get(name);
        if (!instance) {
            const available = Array.from(this.instances.keys()).join(", ");
            throw new Error(`Database instance "${name}" not found. Available instances: ${available || "none"}. Use createInstance() to create it.`);
        }
        return instance;
    }
    static getDefault() {
        if (this.instances.size === 0) {
            throw new Error("No database instances created. Use createInstance() first.");
        }
        return this.getInstance(this.defaultInstanceName);
    }
    static setDefault(name) {
        if (!this.instances.has(name)) {
            throw new Error(`Cannot set default: instance "${name}" not found`);
        }
        this.defaultInstanceName = name;
        console.log(`✅ Default database set to: "${name}"`);
    }
    static hasInstance(name) {
        return this.instances.has(name);
    }
    static getInstanceNames() {
        return Array.from(this.instances.keys());
    }
    static getInstanceCount() {
        return this.instances.size;
    }
    static async closeInstance(name) {
        const instance = this.instances.get(name);
        if (instance) {
            await instance.close();
            this.instances.delete(name);
            console.log(`✅ Database instance "${name}" closed`);
            if (this.defaultInstanceName === name) {
                const remaining = Array.from(this.instances.keys());
                this.defaultInstanceName = remaining[0] || "default";
            }
        }
    }
    static async closeAll() {
        console.log(`Closing ${this.instances.size} database instances...`);
        const closePromises = Array.from(this.instances.entries()).map(async ([name, instance]) => {
            await instance.close();
            console.log(`✅ Closed: "${name}"`);
        });
        await Promise.all(closePromises);
        this.instances.clear();
        this.defaultInstanceName = "default";
        console.log("✅ All database instances closed");
    }
    static getAllMetrics() {
        const metrics = {};
        this.instances.forEach((instance, name) => {
            metrics[name] = instance.getMetrics();
        });
        return metrics;
    }
    static getInstanceMetrics(name) {
        const instance = this.getInstance(name);
        return instance.getMetrics();
    }
    static healthCheck() {
        const instances = {};
        let allHealthy = true;
        this.instances.forEach((instance, name) => {
            const metrics = instance.getMetrics();
            const isHealthy = metrics.isConnected;
            instances[name] = {
                connected: metrics.isConnected,
                operations: metrics.operationCount,
                idleTime: `${Math.round(metrics.idleTime / 1000)}s`,
            };
            if (!isHealthy)
                allHealthy = false;
        });
        return {
            healthy: allHealthy,
            totalInstances: this.instances.size,
            defaultInstance: this.defaultInstanceName,
            instances,
        };
    }
    static async reset() {
        await this.closeAll();
    }
}
exports.DatabaseManager = DatabaseManager;
DatabaseManager.instances = new Map();
DatabaseManager.defaultInstanceName = "default";
//# sourceMappingURL=DatabaseManager.js.map