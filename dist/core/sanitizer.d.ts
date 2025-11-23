export declare class DataSanitizer {
    static sanitizeDocument<T = any>(data: any): T;
    static sanitizeDocuments<T = any>(docs: any[]): T[];
    static removeUndefined<T extends Record<string, any>>(obj: T): T;
    private static isTimestamp;
    private static isDocumentReference;
    private static isGeoPoint;
    static describeFieldValue(value: any): string | any;
    static deepFreeze<T>(obj: T): Readonly<T>;
    static validateAndSanitize<T extends Record<string, any>>(data: T): T;
    private static validateNoCircularReferences;
}
//# sourceMappingURL=sanitizer.d.ts.map