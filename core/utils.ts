// core/utils.ts
import type { RetryConfig } from "./types";
import { RetryExhaustedError } from "./errors";

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config: RetryConfig,
  operationName: string = "operation"
): Promise<T> {
  let lastError: Error;
  let delay = config.initialDelay;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === config.maxRetries) {
        break;
      }

      if (!isRetryableError(error)) {
        throw error;
      }

      await sleep(Math.min(delay, config.maxDelay));
      delay *= config.backoffMultiplier;
    }
  }

  throw new RetryExhaustedError(operationName, config.maxRetries + 1, lastError!);
}

function isRetryableError(error: any): boolean {
  if (!error) return false;

  const retryableCodes = [
    "UNAVAILABLE",
    "DEADLINE_EXCEEDED",
    "RESOURCE_EXHAUSTED",
    "ABORTED",
    "INTERNAL",
  ];

  const code = error.code || error.status;
  return retryableCodes.includes(code);
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

export function validatePath(path: string): void {
  if (!path || typeof path !== "string") {
    throw new Error("Invalid path: must be a non-empty string");
  }
  
  if (path.startsWith("/") || path.endsWith("/")) {
    throw new Error("Invalid path: cannot start or end with '/'");
  }
}

export function validateId(id: string): void {
  if (!id || typeof id !== "string") {
    throw new Error("Invalid ID: must be a non-empty string");
  }
  
  if (id.includes("/")) {
    throw new Error("Invalid ID: cannot contain '/'");
  }
}

export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function isPlainObject(value: any): boolean {
  return value !== null && typeof value === "object" && value.constructor === Object;
}

export function flattenObject(
  obj: Record<string, any>,
  prefix: string = ""
): Record<string, any> {
  const flattened: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (isPlainObject(value) && !isSpecialFirestoreValue(value)) {
      Object.assign(flattened, flattenObject(value, fullKey));
    } else {
      flattened[fullKey] = value;
    }
  }

  return flattened;
}

function isSpecialFirestoreValue(value: any): boolean {
  if (!value) return false;
  
  const className = value.constructor?.name;
  return className === "FieldValue" || 
         className === "Timestamp" || 
         className === "DocumentReference" ||
         className === "GeoPoint";
}

export async function measureTime<T>(
  fn: () => Promise<T>,
  label?: string
): Promise<{ result: T; duration: number }> {
  const start = Date.now();
  const result = await fn();
  const duration = Date.now() - start;
  
  if (label) {
    console.log(`[${label}] took ${duration}ms`);
  }
  
  return { result, duration };
}

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function safeStringify(obj: any): string {
  try {
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === "bigint") {
        return value.toString();
      }
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    });
  } catch {
    return String(obj);
  }
}

export function omit<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}

export function pick<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}