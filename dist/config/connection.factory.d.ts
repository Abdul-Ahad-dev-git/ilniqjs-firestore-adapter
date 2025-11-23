import type { Firestore } from "firebase-admin/firestore";
import type { AdapterOptions } from "./adapter.options";
import type { ConnectionMetrics } from "../core/types";
export declare class ConnectionFactory {
    private static instance;
    private app;
    private db;
    private metrics;
    private idleCheckInterval;
    private options;
    private constructor();
    static getInstance(options: AdapterOptions): ConnectionFactory;
    private guardEdgeRuntime;
    initialize(): Promise<Firestore>;
    private initializeApp;
    getFirestore(): Promise<Firestore>;
    private updateActivity;
    private startIdleMonitoring;
    private checkIdleConnection;
    getMetrics(): ConnectionMetrics;
    close(): Promise<void>;
    static reset(): void;
    private log;
}
//# sourceMappingURL=connection.factory.d.ts.map