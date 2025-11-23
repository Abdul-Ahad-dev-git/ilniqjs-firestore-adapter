// adapter/DatabaseManager.ts (ADD THIS TO YOUR LIBRARY)
import { FireStoreDBAdapter } from "./FireStoreDBAdapter";
import type { AdapterOptions } from "../config/adapter.options";

/**
 * Database Manager - Manage multiple Firestore database instances
 * Part of @zyljs/firestore-adapter library
 */
export class DatabaseManager {
  private static instances: Map<string, FireStoreDBAdapter> = new Map();
  private static defaultInstanceName: string = "default";

  private constructor() {
    // Private constructor prevents direct instantiation
  }

  /**
   * Create or get a database instance
   */
  public static createInstance(
    name: string,
    config: Partial<AdapterOptions>
  ): FireStoreDBAdapter {
    if (this.instances.has(name)) {
      console.warn(`⚠️  Instance "${name}" already exists. Returning existing instance.`);
      return this.instances.get(name)!;
    }

    const adapter = new FireStoreDBAdapter({
      // Default configuration
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
      // Override with provided config
      ...config,
    });

    this.instances.set(name, adapter);
    console.log(`✅ Database instance "${name}" created`);

    // Set as default if it's the first instance
    if (this.instances.size === 1) {
      this.defaultInstanceName = name;
    }

    return adapter;
  }

  /**
   * Get existing instance (throws if not found)
   */
  public static getInstance(name: string = "default"): FireStoreDBAdapter {
    const instance = this.instances.get(name);
    
    if (!instance) {
      const available = Array.from(this.instances.keys()).join(", ");
      throw new Error(
        `Database instance "${name}" not found. Available instances: ${available || "none"}. Use createInstance() to create it.`
      );
    }

    return instance;
  }

  /**
   * Get default instance
   */
  public static getDefault(): FireStoreDBAdapter {
    if (this.instances.size === 0) {
      throw new Error("No database instances created. Use createInstance() first.");
    }
    return this.getInstance(this.defaultInstanceName);
  }

  /**
   * Set default instance name
   */
  public static setDefault(name: string): void {
    if (!this.instances.has(name)) {
      throw new Error(`Cannot set default: instance "${name}" not found`);
    }
    this.defaultInstanceName = name;
    console.log(`✅ Default database set to: "${name}"`);
  }

  /**
   * Check if instance exists
   */
  public static hasInstance(name: string): boolean {
    return this.instances.has(name);
  }

  /**
   * Get all instance names
   */
  public static getInstanceNames(): string[] {
    return Array.from(this.instances.keys());
  }

  /**
   * Get instance count
   */
  public static getInstanceCount(): number {
    return this.instances.size;
  }

  /**
   * Close a specific instance
   */
  public static async closeInstance(name: string): Promise<void> {
    const instance = this.instances.get(name);
    
    if (instance) {
      await instance.close();
      this.instances.delete(name);
      console.log(`✅ Database instance "${name}" closed`);

      // Reset default if it was the default instance
      if (this.defaultInstanceName === name) {
        const remaining = Array.from(this.instances.keys());
        this.defaultInstanceName = remaining[0] || "default";
      }
    }
  }

  /**
   * Close all instances
   */
  public static async closeAll(): Promise<void> {
    console.log(`Closing ${this.instances.size} database instances...`);
    
    const closePromises = Array.from(this.instances.entries()).map(
      async ([name, instance]) => {
        await instance.close();
        console.log(`✅ Closed: "${name}"`);
      }
    );

    await Promise.all(closePromises);
    this.instances.clear();
    this.defaultInstanceName = "default";
    console.log("✅ All database instances closed");
  }

  /**
   * Get metrics for all instances
   */
  public static getAllMetrics(): Record<string, any> {
    const metrics: Record<string, any> = {};
    
    this.instances.forEach((instance, name) => {
      metrics[name] = instance.getMetrics();
    });

    return metrics;
  }

  /**
   * Get metrics for specific instance
   */
  public static getInstanceMetrics(name: string): any {
    const instance = this.getInstance(name);
    return instance.getMetrics();
  }

  /**
   * Health check for all instances
   */
  public static healthCheck(): {
    healthy: boolean;
    totalInstances: number;
    defaultInstance: string;
    instances: Record<string, { connected: boolean; operations: number; idleTime: string }>;
  } {
    const instances: Record<string, any> = {};
    let allHealthy = true;

    this.instances.forEach((instance, name) => {
      const metrics = instance.getMetrics();
      const isHealthy = metrics.isConnected;
      
      instances[name] = {
        connected: metrics.isConnected,
        operations: metrics.operationCount,
        idleTime: `${Math.round(metrics.idleTime / 1000)}s`,
      };

      if (!isHealthy) allHealthy = false;
    });

    return {
      healthy: allHealthy,
      totalInstances: this.instances.size,
      defaultInstance: this.defaultInstanceName,
      instances,
    };
  }

  /**
   * Reset all instances (useful for testing)
   */
  public static async reset(): Promise<void> {
    await this.closeAll();
  }
}