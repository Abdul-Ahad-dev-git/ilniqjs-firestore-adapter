// config/connection.factory.ts
import admin from "firebase-admin";
import type { ServiceAccount } from "firebase-admin";
import type { Firestore } from "firebase-admin/firestore";
import type { AdapterOptions } from "./adapter.options";
import { EdgeRuntimeError, ConnectionError } from "../core/errors";
import type { ConnectionMetrics } from "../core/types";

export class ConnectionFactory {
  private static instance: ConnectionFactory;
  private app: admin.app.App | null = null;
  private db: Firestore | null = null;
  private metrics: ConnectionMetrics = {
    isConnected: false,
    lastActivity: new Date(),
    idleTime: 0,
    operationCount: 0,
  };
  private idleCheckInterval: NodeJS.Timeout | null = null;
  private options: AdapterOptions;

  private constructor(options: AdapterOptions) {
    this.options = options;
    this.guardEdgeRuntime();
  }

  public static getInstance(options: AdapterOptions): ConnectionFactory {
    if (!ConnectionFactory.instance) {
      ConnectionFactory.instance = new ConnectionFactory(options);
    }
    return ConnectionFactory.instance;
  }

  /**
   * Guard detection for EdgeRuntime environments.
   * Use globalThis to avoid TypeScript complaining about an undeclared global name.
   */
  private guardEdgeRuntime(): void {
    try {
      if (typeof (globalThis as any).EdgeRuntime !== "undefined") {
        throw new EdgeRuntimeError();
      }
    } catch {
      // In very constrained runtimes, accessing globals might throw — swallow and continue.
      // The goal is to *fail fast* only when EdgeRuntime is actually present.
    }
  }

  public async initialize(): Promise<Firestore> {
    if (this.db && this.metrics.isConnected) {
      this.updateActivity();
      return this.db;
    }

    try {
      if (!admin.apps.length) {
        this.app = this.initializeApp();
        this.log("info", "Firebase Admin SDK initialized");
      } else {
        this.app = admin.app();
        this.log("info", "Reusing existing Firebase Admin SDK instance");
      }

      this.db = admin.firestore(this.app);

      this.db.settings({
        ignoreUndefinedProperties: true,
      });

      this.metrics.isConnected = true;
      this.metrics.lastActivity = new Date();

      if (this.options.enablePooling) {
        this.startIdleMonitoring();
      }

      return this.db;
    } catch (error) {
      this.log("error", "Failed to initialize Firestore", { error });
      throw new ConnectionError(
        "Failed to initialize Firestore connection",
        { error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  private initializeApp(): admin.app.App {
    if (this.options.serviceAccount) {
      return admin.initializeApp({
        credential: admin.credential.cert(this.options.serviceAccount as ServiceAccount),
      });
    }

    const projectId = this.options.projectId || process.env.FIREBASE_PROJECT_ID;
    const clientEmail = this.options.clientEmail || process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = (this.options.privateKey || process.env.FIREBASE_PRIVATE_KEY)?.replace(/\\n/g, "\n");

    if (projectId && clientEmail && privateKey) {
      return admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    }

    return admin.initializeApp();
  }

  public async getFirestore(): Promise<Firestore> {
    if (!this.db || !this.metrics.isConnected) {
      return this.initialize();
    }

    this.updateActivity();
    return this.db;
  }

  private updateActivity(): void {
    this.metrics.lastActivity = new Date();
    this.metrics.operationCount++;
  }

  private startIdleMonitoring(): void {
    if (this.idleCheckInterval) {
      return;
    }

    const checkInterval = this.options.idleTimeout || 60000;
    this.idleCheckInterval = setInterval(() => {
      this.checkIdleConnection();
    }, checkInterval);

    if (this.idleCheckInterval.unref) {
      this.idleCheckInterval.unref();
    }
  }

  private checkIdleConnection(): void {
    const now = Date.now();
    const lastActivity = this.metrics.lastActivity.getTime();
    const idleTime = now - lastActivity;

    this.metrics.idleTime = idleTime;

    const maxIdleTime = this.options.maxIdleTime || 600000;

    if (idleTime > maxIdleTime) {
      this.log("warn", "Connection idle for too long, preparing for reconnection", {
        idleTime: `${Math.round(idleTime / 1000)}s`,
        maxIdleTime: `${Math.round(maxIdleTime / 1000)}s`,
      });

      this.metrics.isConnected = false;
    }
  }

  public getMetrics(): ConnectionMetrics {
    return { ...this.metrics };
  }

  public async close(): Promise<void> {
    if (this.idleCheckInterval) {
      clearInterval(this.idleCheckInterval);
      this.idleCheckInterval = null;
    }

    if (this.app) {
      try {
        await this.app.delete();
        this.app = null;
        this.db = null;
        this.metrics.isConnected = false;
        this.log("info", "Firestore connection closed gracefully");
      } catch (error) {
        this.log("error", "Error during connection close", { error });
      }
    }
  }

  public static reset(): void {
    if (ConnectionFactory.instance) {
      ConnectionFactory.instance.close().catch(() => {});
      ConnectionFactory.instance = null as any;
    }
  }

  private log(level: string, message: string, context?: any): void {
    const logLevel = this.options.logLevel || "info";
    const levels = ["debug", "info", "warn", "error"];

    if (levels.indexOf(level) >= levels.indexOf(logLevel)) {
      if (this.options.logger) {
        this.options.logger[level](message, context);
      } else {
        console[level as "log"](`[FirestoreAdapter:${level.toUpperCase()}]`, message, context || "");
      }
    }
  }
}
