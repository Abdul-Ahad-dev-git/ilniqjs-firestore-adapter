import type { ServiceAccount } from "firebase-admin";
import type { RetryConfig } from "../core/types";
export interface AdapterOptions {
    serviceAccount?: ServiceAccount | object;
    projectId?: string;
    clientEmail?: string;
    privateKey?: string;
    enablePooling?: boolean;
    idleTimeout?: number;
    maxIdleTime?: number;
    enableRetry?: boolean;
    retryConfig?: RetryConfig;
    enableMetrics?: boolean;
    enableTracing?: boolean;
    enableCache?: boolean;
    cacheTTL?: number;
    maxCacheSize?: number;
    logLevel?: "debug" | "info" | "warn" | "error";
    logger?: any;
    environment?: string;
    enableGracefulShutdown?: boolean;
    shutdownTimeout?: number;
}
export declare const DEFAULT_ADAPTER_OPTIONS: Required<Omit<AdapterOptions, 'serviceAccount' | 'projectId' | 'clientEmail' | 'privateKey' | 'logger'>>;
export declare function mergeOptions(options?: Partial<AdapterOptions>): AdapterOptions;
//# sourceMappingURL=adapter.options.d.ts.map