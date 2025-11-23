// config/adapter.options.ts
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

export const DEFAULT_ADAPTER_OPTIONS: Required<Omit<AdapterOptions, 'serviceAccount' | 'projectId' | 'clientEmail' | 'privateKey' | 'logger'>> = {
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
  enableCache: false,
  cacheTTL: 60000,
  maxCacheSize: 1000,
  logLevel: "info",
  environment: process.env.NODE_ENV || "development",
  enableGracefulShutdown: true,
  shutdownTimeout: 10000,
};

export function mergeOptions(options?: Partial<AdapterOptions>): AdapterOptions {
  return {
    ...DEFAULT_ADAPTER_OPTIONS,
    ...options,
    retryConfig: {
      ...DEFAULT_ADAPTER_OPTIONS.retryConfig,
      ...(options?.retryConfig || {}),
    },
  };
}