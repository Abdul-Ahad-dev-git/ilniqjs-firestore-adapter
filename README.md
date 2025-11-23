# 🔥 Firestore Enterprise Adapter

> Production-ready Firestore database adapter for serverless applications with 100+ operations, connection pooling, automatic retries, and advanced relational capabilities.

[![npm version](https://badge.fury.io/js/%40yourorg%2Ffirestore-enterprise-adapter.svg)](https://badge.fury.io/js/%40yourorg%2Ffirestore-enterprise-adapter)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- ✅ **100+ Database Operations** - CRUD, Relational, Batch, Transactions, Migrations
- ✅ **Serverless-Optimized** - Connection pooling, lazy loading, auto-reconnect
- ✅ **Works Everywhere** - Vercel, AWS Lambda, Cloud Functions, Express, Next.js
- ✅ **Relational Queries** - `{data, refs}` pattern for clean entity relationships
- ✅ **Automatic Retries** - Exponential backoff for transient failures
- ✅ **Full TypeScript** - Complete type safety and IntelliSense support
- ✅ **Production-Ready** - Used in production by multiple companies

## 📦 Installation
```bash
npm install @yourorg/firestore-enterprise-adapter firebase-admin
```

## 🚀 Quick Start
```typescript
import { FireStoreDBAdapter } from '@yourorg/firestore-enterprise-adapter';

// Initialize
const db = new FireStoreDBAdapter({
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY,
});

// Simple CRUD
await db.create("users", { name: "Alice", email: "alice@example.com" });
const user = await db.read("users", userId);
await db.update("users", userId, { age: 26 });

// Relational queries
await db.createRelational("comments", 
  { text: "Great post!" },
  { postId: "p123", userId: "u456" }
);
const comments = await db.queryByRef("comments", "postId", "p123");

// Batch operations
await db.batchCreate("posts", [...posts]);

// Transactions
await db.atomicIncrement("users", "u1", "balance", 100);
```

## 📖 Documentation

### Simple CRUD Operations
```typescript
// Create with auto-generated ID
const result = await db.create("users", { name: "Alice" });

// Create with specific ID
await db.set("users", "user_1", { name: "Bob" });

// Read
const user = await db.read("users", "user_1");

// Update
await db.update("users", "user_1", { age: 30 });

// Delete
await db.delete("users", "user_1");

// Upsert
await db.upsert("users", "user_1", { name: "Charlie" });

// List all
const users = await db.list("users");

// Query
const admins = await db.query("users", { role: "admin" });

// Count
const count = await db.count("users");
```

### Relational Operations
```typescript
// Create with relationships
await db.createRelational(
  "comments",
  { text: "Nice!", likes: 0 },
  { postId: "p123", userId: "u456" }
);

// Query by reference
const comments = await db.queryByRef("comments", "postId", "p123");

// Query with filters
const approved = await db.queryByRefWithData(
  "comments",
  "postId", "p123",
  { approved: true }
);

// Toggle relationships (like/unlike)
await db.toggleRelation(
  "likes",
  { value: 1 },
  { postId: "p123", userId: "u456" }
);

// Cascade delete
await db.cascadeDeleteRelational("posts", "p123", [
  { collection: "comments", refKey: "postId" },
  { collection: "likes", refKey: "postId" }
]);
```

### Advanced Queries
```typescript
// Query with operators
const adults = await db.queryAdvanced("users", [
  { field: "age", op: ">=", value: 18 },
  { field: "verified", op: "==", value: true }
]);

// Pagination
const page1 = await db.queryPaginated("users", { active: true }, 10);
const page2 = await db.queryPaginated("users", { active: true }, 10, page1.lastDoc);
```

### Batch Operations
```typescript
// Batch create
await db.batchCreate("users", [
  { name: "Alice" },
  { name: "Bob" }
]);

// Batch update
await db.batchUpdate("users", [
  { id: "u1", data: { age: 26 } },
  { id: "u2", data: { age: 31 } }
]);

// Batch delete
await db.batchDelete("users", ["u1", "u2"]);
```

### Transactions
```typescript
// Atomic increment
await db.atomicIncrement("users", "u1", "balance", 100);

// Atomic transfer
await db.atomicTransfer(
  "users", "u1",
  "users", "u2",
  "balance", 50
);

// Conditional update
await db.conditionalUpdate(
  "posts", "p1",
  (data) => data.status === "draft",
  { status: "published" }
);
```

## 🔧 Configuration
```typescript
const db = new FireStoreDBAdapter({
  // Firebase credentials
  projectId: "my-project",
  clientEmail: "service@my-project.iam.gserviceaccount.com",
  privateKey: "-----BEGIN PRIVATE KEY-----\n...",

  // Connection pooling
  enablePooling: true,
  idleTimeout: 300000,     // 5 minutes
  maxIdleTime: 600000,     // 10 minutes

  // Automatic retry
  enableRetry: true,
  retryConfig: {
    maxRetries: 3,
    initialDelay: 100,
    maxDelay: 5000,
    backoffMultiplier: 2,
  },

  // Monitoring
  enableMetrics: true,
  enableTracing: true,

  // Graceful shutdown
  enableGracefulShutdown: true,
  shutdownTimeout: 10000,

  // Logging
  logLevel: "info",
});
```

## 🌐 Platform Support

Works on all serverless platforms:

- ✅ **Vercel** - Serverless Functions
- ✅ **AWS Lambda** - With Serverless Framework
- ✅ **Google Cloud Functions** - Gen 1 & 2
- ✅ **Google Cloud Run** - Containerized apps
- ✅ **Next.js** - API Routes
- ✅ **Express.js** - Traditional servers
- ✅ **Nest.js** - Enterprise Node.js

## 📊 API Reference

### CRUD (10 methods)
`create`, `set`, `read`, `update`, `delete`, `exists`, `upsert`, `list`, `count`, `findOne`

### Relational (20+ methods)
`createRelational`, `readRelational`, `updateData`, `updateRefs`, `queryByRef`, `queryByRefs`, `toggleRelation`, `cascadeDeleteRelational`, and more

### Query (10+ methods)
`query`, `queryAdvanced`, `queryOrdered`, `queryPaginated`, `countWhere`, `findOneAdvanced`, and more

### Batch (6 methods)
`batchCreate`, `batchUpdate`, `batchDelete`, `batchIncrement`, `deleteCollection`

### Transaction (7 methods)
`runTransaction`, `atomicIncrement`, `atomicDecrement`, `atomicTransfer`, `conditionalUpdate`, `compareAndSwap`

### Migration (8 methods)
`convertToRelational`, `batchTransform`, `addFieldToAll`, `removeFieldFromAll`, `renameField`, `copyCollection`, `validateMigration`

## 📝 License

MIT © [Your Name]

## 🤝 Contributing

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

## 🔗 Links

- [Documentation](https://github.com/yourusername/firestore-enterprise-adapter)
- [GitHub](https://github.com/yourusername/firestore-enterprise-adapter)
- [Issues](https://github.com/yourusername/firestore-enterprise-adapter/issues)
- [NPM](https://www.npmjs.com/package/@yourorg/firestore-enterprise-adapter)

## 💬 Support

- 📧 Email: your.email@example.com
- 💬 GitHub Issues: [Report a bug](https://github.com/yourusername/firestore-enterprise-adapter/issues)