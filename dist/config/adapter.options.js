"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_ADAPTER_OPTIONS = void 0;
exports.mergeOptions = mergeOptions;
exports.DEFAULT_ADAPTER_OPTIONS = {
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
function mergeOptions(options) {
    return {
        ...exports.DEFAULT_ADAPTER_OPTIONS,
        ...options,
        retryConfig: {
            ...exports.DEFAULT_ADAPTER_OPTIONS.retryConfig,
            ...(options?.retryConfig || {}),
        },
    };
}
//# sourceMappingURL=adapter.options.js.map