import type { RetryConfig } from "./types";
export declare function sleep(ms: number): Promise<void>;
export declare function retryWithBackoff<T>(operation: () => Promise<T>, config: RetryConfig, operationName?: string): Promise<T>;
export declare function generateId(): string;
export declare function validatePath(path: string): void;
export declare function validateId(id: string): void;
export declare function chunkArray<T>(array: T[], size: number): T[][];
export declare function deepClone<T>(obj: T): T;
export declare function isPlainObject(value: any): boolean;
export declare function flattenObject(obj: Record<string, any>, prefix?: string): Record<string, any>;
export declare function measureTime<T>(fn: () => Promise<T>, label?: string): Promise<{
    result: T;
    duration: number;
}>;
export declare function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void;
export declare function throttle<T extends (...args: any[]) => any>(fn: T, limit: number): (...args: Parameters<T>) => void;
export declare function safeStringify(obj: any): string;
export declare function omit<T extends Record<string, any>, K extends keyof T>(obj: T, keys: K[]): Omit<T, K>;
export declare function pick<T extends Record<string, any>, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>;
//# sourceMappingURL=utils.d.ts.map