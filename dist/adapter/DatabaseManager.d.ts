import { FireStoreDBAdapter } from "./FireStoreDBAdapter";
import type { AdapterOptions } from "../config/adapter.options";
export declare class DatabaseManager {
    private static instances;
    private static defaultInstanceName;
    private constructor();
    static createInstance(name: string, config: Partial<AdapterOptions>): FireStoreDBAdapter;
    static getInstance(name?: string): FireStoreDBAdapter;
    static getDefault(): FireStoreDBAdapter;
    static setDefault(name: string): void;
    static hasInstance(name: string): boolean;
    static getInstanceNames(): string[];
    static getInstanceCount(): number;
    static closeInstance(name: string): Promise<void>;
    static closeAll(): Promise<void>;
    static getAllMetrics(): Record<string, any>;
    static getInstanceMetrics(name: string): any;
    static healthCheck(): {
        healthy: boolean;
        totalInstances: number;
        defaultInstance: string;
        instances: Record<string, {
            connected: boolean;
            operations: number;
            idleTime: string;
        }>;
    };
    static reset(): Promise<void>;
}
//# sourceMappingURL=DatabaseManager.d.ts.map