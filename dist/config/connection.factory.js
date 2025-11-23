"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionFactory = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const errors_1 = require("../core/errors");
class ConnectionFactory {
    constructor(options) {
        this.app = null;
        this.db = null;
        this.metrics = {
            isConnected: false,
            lastActivity: new Date(),
            idleTime: 0,
            operationCount: 0,
        };
        this.idleCheckInterval = null;
        this.options = options;
        this.guardEdgeRuntime();
    }
    static getInstance(options) {
        if (!ConnectionFactory.instance) {
            ConnectionFactory.instance = new ConnectionFactory(options);
        }
        return ConnectionFactory.instance;
    }
    guardEdgeRuntime() {
        try {
            if (typeof globalThis.EdgeRuntime !== "undefined") {
                throw new errors_1.EdgeRuntimeError();
            }
        }
        catch {
        }
    }
    async initialize() {
        if (this.db && this.metrics.isConnected) {
            this.updateActivity();
            return this.db;
        }
        try {
            if (!firebase_admin_1.default.apps.length) {
                this.app = this.initializeApp();
                this.log("info", "Firebase Admin SDK initialized");
            }
            else {
                this.app = firebase_admin_1.default.app();
                this.log("info", "Reusing existing Firebase Admin SDK instance");
            }
            this.db = firebase_admin_1.default.firestore(this.app);
            this.db.settings({
                ignoreUndefinedProperties: true,
            });
            this.metrics.isConnected = true;
            this.metrics.lastActivity = new Date();
            if (this.options.enablePooling) {
                this.startIdleMonitoring();
            }
            return this.db;
        }
        catch (error) {
            this.log("error", "Failed to initialize Firestore", { error });
            throw new errors_1.ConnectionError("Failed to initialize Firestore connection", { error: error instanceof Error ? error.message : String(error) });
        }
    }
    initializeApp() {
        if (this.options.serviceAccount) {
            return firebase_admin_1.default.initializeApp({
                credential: firebase_admin_1.default.credential.cert(this.options.serviceAccount),
            });
        }
        const projectId = this.options.projectId || process.env.FIREBASE_PROJECT_ID;
        const clientEmail = this.options.clientEmail || process.env.FIREBASE_CLIENT_EMAIL;
        const privateKey = (this.options.privateKey || process.env.FIREBASE_PRIVATE_KEY)?.replace(/\\n/g, "\n");
        if (projectId && clientEmail && privateKey) {
            return firebase_admin_1.default.initializeApp({
                credential: firebase_admin_1.default.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey,
                }),
            });
        }
        return firebase_admin_1.default.initializeApp();
    }
    async getFirestore() {
        if (!this.db || !this.metrics.isConnected) {
            return this.initialize();
        }
        this.updateActivity();
        return this.db;
    }
    updateActivity() {
        this.metrics.lastActivity = new Date();
        this.metrics.operationCount++;
    }
    startIdleMonitoring() {
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
    checkIdleConnection() {
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
    getMetrics() {
        return { ...this.metrics };
    }
    async close() {
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
            }
            catch (error) {
                this.log("error", "Error during connection close", { error });
            }
        }
    }
    static reset() {
        if (ConnectionFactory.instance) {
            ConnectionFactory.instance.close().catch(() => { });
            ConnectionFactory.instance = null;
        }
    }
    log(level, message, context) {
        const logLevel = this.options.logLevel || "info";
        const levels = ["debug", "info", "warn", "error"];
        if (levels.indexOf(level) >= levels.indexOf(logLevel)) {
            if (this.options.logger) {
                this.options.logger[level](message, context);
            }
            else {
                console[level](`[FirestoreAdapter:${level.toUpperCase()}]`, message, context || "");
            }
        }
    }
}
exports.ConnectionFactory = ConnectionFactory;
//# sourceMappingURL=connection.factory.js.map