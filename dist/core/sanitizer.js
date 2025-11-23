"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataSanitizer = void 0;
class DataSanitizer {
    static sanitizeDocument(data) {
        if (data === null || data === undefined) {
            return data;
        }
        if (Array.isArray(data)) {
            return data.map((item) => this.sanitizeDocument(item));
        }
        if (this.isTimestamp(data)) {
            return data.toDate();
        }
        if (this.isDocumentReference(data)) {
            return {
                _type: "DocumentReference",
                path: data.path,
                id: data.id,
            };
        }
        if (this.isGeoPoint(data)) {
            return {
                _type: "GeoPoint",
                latitude: data.latitude,
                longitude: data.longitude,
            };
        }
        if (typeof data === "object" && data.constructor === Object) {
            const sanitized = {};
            for (const [key, value] of Object.entries(data)) {
                sanitized[key] = this.sanitizeDocument(value);
            }
            return sanitized;
        }
        return data;
    }
    static sanitizeDocuments(docs) {
        return docs.map((doc) => this.sanitizeDocument(doc));
    }
    static removeUndefined(obj) {
        const cleaned = {};
        for (const [key, value] of Object.entries(obj)) {
            if (value === undefined) {
                continue;
            }
            if (Array.isArray(value)) {
                cleaned[key] = value.map((item) => typeof item === "object" && item !== null
                    ? this.removeUndefined(item)
                    : item);
            }
            else if (typeof value === "object" && value !== null && value.constructor === Object) {
                cleaned[key] = this.removeUndefined(value);
            }
            else {
                cleaned[key] = value;
            }
        }
        return cleaned;
    }
    static isTimestamp(value) {
        return (value &&
            typeof value === "object" &&
            typeof value.toDate === "function" &&
            typeof value.seconds === "number" &&
            typeof value.nanoseconds === "number");
    }
    static isDocumentReference(value) {
        return (value &&
            typeof value === "object" &&
            typeof value.path === "string" &&
            typeof value.id === "string" &&
            value.constructor?.name === "DocumentReference");
    }
    static isGeoPoint(value) {
        return (value &&
            typeof value === "object" &&
            typeof value.latitude === "number" &&
            typeof value.longitude === "number" &&
            value.constructor?.name === "GeoPoint");
    }
    static describeFieldValue(value) {
        if (!value || typeof value !== "object") {
            return value;
        }
        const className = value.constructor?.name;
        if (className === "FieldValue") {
            return "[FieldValue]";
        }
        return value;
    }
    static deepFreeze(obj) {
        Object.freeze(obj);
        Object.getOwnPropertyNames(obj).forEach((prop) => {
            const value = obj[prop];
            if (value &&
                typeof value === "object" &&
                !Object.isFrozen(value)) {
                this.deepFreeze(value);
            }
        });
        return obj;
    }
    static validateAndSanitize(data) {
        const sanitized = this.removeUndefined(data);
        this.validateNoCircularReferences(sanitized);
        return sanitized;
    }
    static validateNoCircularReferences(obj, seen = new WeakSet()) {
        if (obj === null || typeof obj !== "object") {
            return;
        }
        if (seen.has(obj)) {
            throw new Error("Circular reference detected in data");
        }
        seen.add(obj);
        if (Array.isArray(obj)) {
            obj.forEach((item) => this.validateNoCircularReferences(item, seen));
        }
        else {
            Object.values(obj).forEach((value) => this.validateNoCircularReferences(value, seen));
        }
    }
}
exports.DataSanitizer = DataSanitizer;
//# sourceMappingURL=sanitizer.js.map