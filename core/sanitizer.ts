// core/sanitizer.ts
import type { Timestamp } from "firebase-admin/firestore";

export class DataSanitizer {
  static sanitizeDocument<T = any>(data: any): T {
    if (data === null || data === undefined) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeDocument(item)) as any;
    }

    if (this.isTimestamp(data)) {
      return data.toDate() as any;
    }

    if (this.isDocumentReference(data)) {
      return {
        _type: "DocumentReference",
        path: data.path,
        id: data.id,
      } as any;
    }

    if (this.isGeoPoint(data)) {
      return {
        _type: "GeoPoint",
        latitude: data.latitude,
        longitude: data.longitude,
      } as any;
    }

    if (typeof data === "object" && data.constructor === Object) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitizeDocument(value);
      }
      return sanitized;
    }

    return data;
  }

  static sanitizeDocuments<T = any>(docs: any[]): T[] {
    return docs.map((doc) => this.sanitizeDocument<T>(doc));
  }

  static removeUndefined<T extends Record<string, any>>(obj: T): T {
    const cleaned: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined) {
        continue;
      }
      
      if (Array.isArray(value)) {
        cleaned[key] = value.map((item) =>
          typeof item === "object" && item !== null
            ? this.removeUndefined(item)
            : item
        );
      } else if (typeof value === "object" && value !== null && value.constructor === Object) {
        cleaned[key] = this.removeUndefined(value);
      } else {
        cleaned[key] = value;
      }
    }
    
    return cleaned;
  }

  private static isTimestamp(value: any): value is Timestamp {
    return (
      value &&
      typeof value === "object" &&
      typeof value.toDate === "function" &&
      typeof value.seconds === "number" &&
      typeof value.nanoseconds === "number"
    );
  }

  private static isDocumentReference(value: any): boolean {
    return (
      value &&
      typeof value === "object" &&
      typeof value.path === "string" &&
      typeof value.id === "string" &&
      value.constructor?.name === "DocumentReference"
    );
  }

  private static isGeoPoint(value: any): boolean {
    return (
      value &&
      typeof value === "object" &&
      typeof value.latitude === "number" &&
      typeof value.longitude === "number" &&
      value.constructor?.name === "GeoPoint"
    );
  }

  static describeFieldValue(value: any): string | any {
    if (!value || typeof value !== "object") {
      return value;
    }

    const className = value.constructor?.name;
    
    if (className === "FieldValue") {
      return "[FieldValue]";
    }
    
    return value;
  }

  static deepFreeze<T>(obj: T): Readonly<T> {
    Object.freeze(obj);

    Object.getOwnPropertyNames(obj).forEach((prop) => {
      const value = (obj as any)[prop];
      if (
        value &&
        typeof value === "object" &&
        !Object.isFrozen(value)
      ) {
        this.deepFreeze(value);
      }
    });

    return obj;
  }

  static validateAndSanitize<T extends Record<string, any>>(data: T): T {
    const sanitized = this.removeUndefined(data);
    this.validateNoCircularReferences(sanitized);
    return sanitized;
  }

  private static validateNoCircularReferences(obj: any, seen = new WeakSet()): void {
    if (obj === null || typeof obj !== "object") {
      return;
    }

    if (seen.has(obj)) {
      throw new Error("Circular reference detected in data");
    }

    seen.add(obj);

    if (Array.isArray(obj)) {
      obj.forEach((item) => this.validateNoCircularReferences(item, seen));
    } else {
      Object.values(obj).forEach((value) =>
        this.validateNoCircularReferences(value, seen)
      );
    }
  }
}