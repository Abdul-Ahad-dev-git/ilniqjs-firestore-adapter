"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = sleep;
exports.retryWithBackoff = retryWithBackoff;
exports.generateId = generateId;
exports.validatePath = validatePath;
exports.validateId = validateId;
exports.chunkArray = chunkArray;
exports.deepClone = deepClone;
exports.isPlainObject = isPlainObject;
exports.flattenObject = flattenObject;
exports.measureTime = measureTime;
exports.debounce = debounce;
exports.throttle = throttle;
exports.safeStringify = safeStringify;
exports.omit = omit;
exports.pick = pick;
const errors_1 = require("./errors");
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
async function retryWithBackoff(operation, config, operationName = "operation") {
    let lastError;
    let delay = config.initialDelay;
    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
        try {
            return await operation();
        }
        catch (error) {
            lastError = error;
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
    throw new errors_1.RetryExhaustedError(operationName, config.maxRetries + 1, lastError);
}
function isRetryableError(error) {
    if (!error)
        return false;
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
function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}
function validatePath(path) {
    if (!path || typeof path !== "string") {
        throw new Error("Invalid path: must be a non-empty string");
    }
    if (path.startsWith("/") || path.endsWith("/")) {
        throw new Error("Invalid path: cannot start or end with '/'");
    }
}
function validateId(id) {
    if (!id || typeof id !== "string") {
        throw new Error("Invalid ID: must be a non-empty string");
    }
    if (id.includes("/")) {
        throw new Error("Invalid ID: cannot contain '/'");
    }
}
function chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
function isPlainObject(value) {
    return value !== null && typeof value === "object" && value.constructor === Object;
}
function flattenObject(obj, prefix = "") {
    const flattened = {};
    for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (isPlainObject(value) && !isSpecialFirestoreValue(value)) {
            Object.assign(flattened, flattenObject(value, fullKey));
        }
        else {
            flattened[fullKey] = value;
        }
    }
    return flattened;
}
function isSpecialFirestoreValue(value) {
    if (!value)
        return false;
    const className = value.constructor?.name;
    return className === "FieldValue" ||
        className === "Timestamp" ||
        className === "DocumentReference" ||
        className === "GeoPoint";
}
async function measureTime(fn, label) {
    const start = Date.now();
    const result = await fn();
    const duration = Date.now() - start;
    if (label) {
        console.log(`[${label}] took ${duration}ms`);
    }
    return { result, duration };
}
function debounce(fn, delay) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}
function throttle(fn, limit) {
    let inThrottle;
    return (...args) => {
        if (!inThrottle) {
            fn(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}
function safeStringify(obj) {
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
    }
    catch {
        return String(obj);
    }
}
function omit(obj, keys) {
    const result = { ...obj };
    for (const key of keys) {
        delete result[key];
    }
    return result;
}
function pick(obj, keys) {
    const result = {};
    for (const key of keys) {
        if (key in obj) {
            result[key] = obj[key];
        }
    }
    return result;
}
//# sourceMappingURL=utils.js.map