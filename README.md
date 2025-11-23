# 🔥 @zyljs/firestore-adapter

> Enterprise-grade Firestore database adapter for serverless applications with **multi-database management**, 100+ operations, connection pooling, automatic retries, and advanced relational capabilities.

[![npm version](https://badge.fury.io/js/%40zyljs%2Ffirestore-adapter.svg)](https://badge.fury.io/js/%40zyljs%2Ffirestore-adapter)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## ✨ Features

### 🚀 **Core Features**
- ✅ **100+ Database Operations** - CRUD, Relational, Batch, Transactions, Migrations
- ✅ **Multi-Database Manager** - MongoDB-style instance management for multiple Firestore projects
- ✅ **Serverless-Optimized** - Connection pooling, lazy loading, auto-reconnect
- ✅ **Works Everywhere** - Vercel, AWS Lambda, Cloud Functions, Express, Next.js
- ✅ **Relational Queries** - `{data, refs}` pattern for clean entity relationships
- ✅ **Automatic Retries** - Exponential backoff for transient failures
- ✅ **Full TypeScript** - Complete type safety and IntelliSense support
- ✅ **Production-Ready** - Battle-tested in production environments

### 🎯 **Advanced Features**
- 🔄 **Connection Pooling** - Reuse connections across serverless invocations
- 📊 **Health Monitoring** - Built-in metrics and health checks
- 🔐 **Multi-Tenant Support** - Easy management of tenant-specific databases
- 🛡️ **Error Handling** - Comprehensive error types and retry logic
- 📈 **Query Builder** - Simple and advanced query patterns
- 🔄 **Migrations** - Schema transformation and batch operations
- 💾 **Data Sanitization** - Automatic Firestore data cleaning

---

## 📦 Installation

```bash
npm install @zyljs/firestore-adapter firebase-admin
```

---

## 🚀 Quick Start

### **Single Database**

```typescript
import { FireStoreDBAdapter } from "@zyljs/firestore-adapter";

// Initialize
const db = new FireStoreDBAdapter({
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY,
});

// Use it
await db.create("users", { name: "Alice", email: "alice@example.com" });
const user = await db.read("users", userId);
await db.update("users", userId, { age: 26 });
```

### **Multiple Databases (Recommended)**

```typescript
import { DatabaseManager } from "@zyljs/firestore-adapter";

// Create multiple database instances
const mainDB = DatabaseManager.createInstance("main", {
  projectId: process.env.MAIN_PROJECT_ID,
  clientEmail: process.env.MAIN_CLIENT_EMAIL,
  privateKey: process.env.MAIN_PRIVATE_KEY,
});

const analyticsDB = DatabaseManager.createInstance("analytics", {
  projectId: process.env.ANALYTICS_PROJECT_ID,
  clientEmail: process.env.ANALYTICS_CLIENT_EMAIL,
  privateKey: process.env.ANALYTICS_PRIVATE_KEY,
});

// Use them
await mainDB.create("users", { name: "Alice" });
await analyticsDB.create("events", { type: "signup" });

// Or get by name anywhere
const db = DatabaseManager.getInstance("main");
await db.read("users", userId);
```

---

## 📖 Documentation

### **1. Database Manager (Multi-Database)**

The `DatabaseManager` allows you to manage multiple Firestore projects, similar to MongoDB connection management.

#### **Create Instances**

```typescript
import { DatabaseManager } from "@zyljs/firestore-adapter";

// Create instances
const usersDB = DatabaseManager.createInstance("users", {
  projectId: "users-project",
  clientEmail: process.env.USERS_EMAIL,
  privateKey: process.env.USERS_KEY,
});

const ordersDB = DatabaseManager.createInstance("orders", {
  projectId: "orders-project",
  clientEmail: process.env.ORDERS_EMAIL,
  privateKey: process.env.ORDERS_KEY,
});

const logsDB = DatabaseManager.createInstance("logs", {
  projectId: "logs-project",
  clientEmail: process.env.LOGS_EMAIL,
  privateKey: process.env.LOGS_KEY,
});
```

#### **Get Instances**

```typescript
// Get specific instance
const db = DatabaseManager.getInstance("users");

// Get default instance (first one created)
const defaultDB = DatabaseManager.getDefault();

// Set custom default
DatabaseManager.setDefault("users");
```

#### **Instance Management**

```typescript
// Check if instance exists
const exists = DatabaseManager.hasInstance("users");

// Get all instance names
const names = DatabaseManager.getInstanceNames(); // ["users", "orders", "logs"]

// Get instance count
const count = DatabaseManager.getInstanceCount(); // 3

// Close specific instance
await DatabaseManager.closeInstance("logs");

// Close all instances
await DatabaseManager.closeAll();
```

#### **Health & Metrics**

```typescript
// Health check all instances
const health = DatabaseManager.healthCheck();
/*
{
  healthy: true,
  totalInstances: 3,
  defaultInstance: "users",
  instances: {
    users: { connected: true, operations: 1234, idleTime: "5s" },
    orders: { connected: true, operations: 567, idleTime: "10s" },
    logs: { connected: true, operations: 890, idleTime: "2s" }
  }
}
*/

// Get metrics for all instances
const allMetrics = DatabaseManager.getAllMetrics();

// Get metrics for specific instance
const userMetrics = DatabaseManager.getInstanceMetrics("users");
```

---

### **2. CRUD Operations**

#### **Create**

```typescript
// Create with auto-generated ID
const result = await db.create("users", {
  name: "Alice",
  email: "alice@example.com",
  age: 25,
});
console.log(result.id); // "abc123"

// Create with specific ID
await db.set("users", "user_1", {
  name: "Bob",
  email: "bob@example.com",
});

// Create with merge
await db.set("users", "user_1", { age: 30 }, true);
```

#### **Read**

```typescript
// Read single document
const user = await db.read("users", "user_1");
console.log(user); // { id: "user_1", name: "Bob", age: 30 }

// Read returns null if not found
const notFound = await db.read("users", "invalid_id"); // null

// Check if exists
const exists = await db.exists("users", "user_1"); // true

// List all documents
const allUsers = await db.list("users");

// Count documents
const count = await db.count("users");
```

#### **Update**

```typescript
// Update document
await db.update("users", "user_1", {
  age: 31,
  lastLogin: new Date(),
});

// Upsert (create if not exists, update if exists)
await db.upsert("users", "user_1", {
  name: "Charlie",
  email: "charlie@example.com",
});
```

#### **Delete**

```typescript
// Delete single document
await db.delete("users", "user_1");

// Delete returns confirmation
const result = await db.delete("users", "user_1");
console.log(result); // { id: "user_1", deleted: true }
```

---

### **3. Relational Operations**

Perfect for entities with relationships (comments → posts, likes → users, etc.)

#### **Create with Relationships**

```typescript
// Create post
const post = await db.createRelational(
  "posts",
  { title: "Hello World", content: "My first post", views: 0 },
  { userId: "user_123" }
);

// Create comment
await db.createRelational(
  "comments",
  { text: "Great post!", likes: 0 },
  { postId: post.id, userId: "user_456" }
);
```

Document structure in Firestore:
```json
{
  "data": { "text": "Great post!", "likes": 0 },
  "refs": { "postId": "p123", "userId": "u456" },
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

#### **Query by References**

```typescript
// Get all comments for a post
const comments = await db.queryByRef("comments", "postId", "post_123");

// Query with data filters
const approvedComments = await db.queryByRefWithData(
  "comments",
  "postId",
  "post_123",
  { approved: true }
);

// Query by multiple refs
const userPostComments = await db.queryByRefs("comments", {
  postId: "post_123",
  userId: "user_456",
});

// Get flattened results (merges data + refs)
const flatComments = await db.queryByRefFlattened("comments", "postId", "post_123");
// Returns: [{ id: "c1", text: "Great!", likes: 5, postId: "p123", userId: "u456" }]
```

#### **Update Relational Data**

```typescript
// Update only data (preserves refs)
await db.updateData("comments", "comment_1", { likes: 10 });

// Update only refs (preserves data)
await db.updateRefs("comments", "comment_1", { featured: "true" });

// Update both
await db.updateRelational(
  "comments",
  "comment_1",
  { likes: 15 },           // data updates
  { highlighted: "true" }  // ref updates
);
```

#### **Relationship Operations**

```typescript
// Toggle relationship (like/unlike, follow/unfollow)
const result = await db.toggleRelation(
  "likes",
  { value: 1 },
  { postId: "post_123", userId: "user_456" }
);
console.log(result.action); // "created" or "deleted"

// Find or create (prevents duplicates)
const { id, created } = await db.findOrCreateWithRefs(
  "likes",
  { value: 1 },
  { postId: "post_123", userId: "user_456" }
);

// Check if relationship exists
const hasLiked = await db.relationExists("likes", {
  postId: "post_123",
  userId: "user_456",
});

// Count by reference
const commentCount = await db.countByRef("comments", "postId", "post_123");
```

#### **Advanced Relational**

```typescript
// Get related documents (join-like operation)
const { parent, children } = await db.getRelated(
  "posts",      // parent collection
  "post_123",   // parent id
  "comments",   // child collection
  "postId"      // relation key
);

// Cascade delete (deletes parent + all children)
await db.cascadeDeleteRelational("posts", "post_123", [
  { collection: "comments", refKey: "postId" },
  { collection: "likes", refKey: "postId" },
]);

// Aggregate counts by parent
const counts = await db.aggregateCountByParent(
  "comments",
  "postId",
  ["post_1", "post_2", "post_3"]
);
// Returns: { "post_1": 5, "post_2": 3, "post_3": 8 }
```

---

### **4. Query Operations**

#### **Simple Queries**

```typescript
// Query with equality filters
const admins = await db.query("users", {
  role: "admin",
  active: true,
});

// Find one document
const admin = await db.findOne("users", { email: "admin@example.com" });

// Count with filters
const activeCount = await db.countWhere("users", { active: true });
```

#### **Advanced Queries**

```typescript
// Query with operators
const adults = await db.queryAdvanced("users", [
  { field: "age", op: ">=", value: 18 },
  { field: "verified", op: "==", value: true },
]);

// Query with ordering
const recentUsers = await db.queryOrdered(
  "users",
  { active: true },
  "createdAt",
  "desc"
);

// Advanced query with ordering
const topScorers = await db.queryOrderedAdvanced(
  "users",
  [{ field: "score", op: ">=", value: 100 }],
  "score",
  "desc"
);
```

#### **Pagination**

```typescript
// First page
const page1 = await db.queryPaginated(
  "users",
  { active: true },
  10  // limit
);

// Next page
const page2 = await db.queryPaginated(
  "users",
  { active: true },
  10,
  page1.lastDoc  // start after last document
);

console.log(page1.hasMore); // true if more results exist

// Advanced pagination
const page = await db.queryPaginatedAdvanced(
  "users",
  [{ field: "age", op: ">=", value: 18 }],
  20
);
```

---

### **5. Batch Operations**

```typescript
// Batch create
await db.batchCreate("users", [
  { name: "Alice", age: 25 },
  { name: "Bob", age: 30 },
  { name: "Charlie", age: 35 },
]);

// Batch update
await db.batchUpdate("users", [
  { id: "user_1", data: { age: 26 } },
  { id: "user_2", data: { age: 31 } },
]);

// Batch delete
await db.batchDelete("users", ["user_1", "user_2", "user_3"]);

// Batch increment
await db.batchIncrement("posts", [
  { id: "post_1", field: "views", amount: 1 },
  { id: "post_2", field: "views", amount: 1 },
]);

// Delete entire collection
const result = await db.deleteCollection("temp_data");
console.log(result); // { deleted: 150, batches: 1 }
```

---

### **6. Transactions**

```typescript
// Atomic increment
await db.atomicIncrement("users", "user_1", "balance", 100);

// Atomic decrement (with minimum value)
await db.atomicDecrement(
  "users",
  "user_1",
  "balance",
  50,
  0  // minimum value (prevents negative balance)
);

// Atomic transfer between documents
await db.atomicTransfer(
  "users", "user_1",  // from
  "users", "user_2",  // to
  "balance",          // field
  100                 // amount
);

// Conditional update
const { updated } = await db.conditionalUpdate(
  "posts",
  "post_1",
  (data) => data.status === "draft",  // condition
  { status: "published" }              // updates
);

// Read-modify-write pattern
await db.readModifyWrite(
  "posts",
  "post_1",
  (data) => ({
    views: data.views + 1,
    lastViewed: new Date(),
  })
);

// Compare and swap
const { swapped } = await db.compareAndSwap(
  "settings",
  "config_1",
  "version",
  1,    // expected value
  2     // new value
);

// Custom transaction
await db.runTransaction(async (tx) => {
  const userRef = db.getFirestoreInstance().collection("users").doc("user_1");
  const user = await tx.get(userRef);
  const newBalance = user.data().balance + 100;
  tx.update(userRef, { balance: newBalance });
});
```

---

### **7. Migration Operations**

```typescript
// Convert single document to relational structure
await db.convertToRelational(
  "users",
  "user_1",
  ["groupId", "departmentId"]  // keys to move to refs
);

// Batch convert entire collection
const result = await db.batchConvertToRelational(
  "users",
  ["groupId", "departmentId"]
);
console.log(`Converted ${result.converted} documents`);

// Add field to all documents
await db.addFieldToAll("users", "verified", false);

// Remove field from all documents
await db.removeFieldFromAll("users", "deprecated_field");

// Rename field
await db.renameField("users", "old_name", "new_name");

// Custom transformation
await db.batchTransform("users", (doc) => ({
  ...doc,
  fullName: `${doc.firstName} ${doc.lastName}`,
}));

// Copy collection
await db.copyCollection("users", "users_backup");

// Validate migration (dry run)
const validation = await db.validateMigration("users", (doc) => {
  const errors = [];
  if (!doc.email) errors.push("Missing email");
  if (!doc.name) errors.push("Missing name");
  return { valid: errors.length === 0, errors };
});
```

---

## 🌐 Multi-Database Examples

### **Environment-Based Setup**

```typescript
// db/config.ts
import { DatabaseManager } from "@zyljs/firestore-adapter";

export function initializeDatabases() {
  const env = process.env.NODE_ENV || "development";

  // Create all environment databases
  DatabaseManager.createInstance("production", {
    projectId: process.env.PROD_PROJECT_ID,
    clientEmail: process.env.PROD_EMAIL,
    privateKey: process.env.PROD_KEY,
  });

  DatabaseManager.createInstance("staging", {
    projectId: process.env.STAGING_PROJECT_ID,
    clientEmail: process.env.STAGING_EMAIL,
    privateKey: process.env.STAGING_KEY,
  });

  DatabaseManager.createInstance("development", {
    projectId: process.env.DEV_PROJECT_ID,
    clientEmail: process.env.DEV_EMAIL,
    privateKey: process.env.DEV_KEY,
  });

  // Set current environment as default
  DatabaseManager.setDefault(env);

  console.log(`✅ Databases initialized. Default: ${env}`);
}

// Use in your app
initializeDatabases();
export const db = DatabaseManager.getDefault();
export const prodDB = DatabaseManager.getInstance("production");
export const stagingDB = DatabaseManager.getInstance("staging");
```

### **Multi-Tenant Setup**

```typescript
// services/tenant.service.ts
import { DatabaseManager } from "@zyljs/firestore-adapter";

export class TenantService {
  connectTenant(tenantId: string, config: any) {
    return DatabaseManager.createInstance(`tenant-${tenantId}`, config);
  }

  getTenantDB(tenantId: string) {
    return DatabaseManager.getInstance(`tenant-${tenantId}`);
  }

  async disconnectTenant(tenantId: string) {
    await DatabaseManager.closeInstance(`tenant-${tenantId}`);
  }
}

// Usage
const tenantService = new TenantService();

// Connect tenant
tenantService.connectTenant("acme-corp", {
  projectId: "acme-firestore",
  clientEmail: process.env.ACME_EMAIL,
  privateKey: process.env.ACME_KEY,
});

// Use tenant database
const acmeDB = tenantService.getTenantDB("acme-corp");
await acmeDB.create("users", { name: "John Doe" });
```

### **Microservices Architecture**

```typescript
// Each service manages its own database
import { DatabaseManager } from "@zyljs/firestore-adapter";

// User service
const usersDB = DatabaseManager.createInstance("users", {
  projectId: "users-microservice",
  clientEmail: process.env.USERS_EMAIL,
  privateKey: process.env.USERS_KEY,
});

// Orders service
const ordersDB = DatabaseManager.createInstance("orders", {
  projectId: "orders-microservice",
  clientEmail: process.env.ORDERS_EMAIL,
  privateKey: process.env.ORDERS_KEY,
});

// Products service
const productsDB = DatabaseManager.createInstance("products", {
  projectId: "products-microservice",
  clientEmail: process.env.PRODUCTS_EMAIL,
  privateKey: process.env.PRODUCTS_KEY,
});

// Use independently
await usersDB.create("users", { name: "Alice" });
await ordersDB.create("orders", { userId: "u1", total: 100 });
await productsDB.create("products", { name: "Widget", price: 29.99 });
```

---

## 🔧 Configuration

### **Full Configuration Options**

```typescript
import { FireStoreDBAdapter } from "@zyljs/firestore-adapter";

const db = new FireStoreDBAdapter({
  // Firebase credentials (required)
  projectId: "my-project",
  clientEmail: "service@my-project.iam.gserviceaccount.com",
  privateKey: "-----BEGIN PRIVATE KEY-----\n...",

  // Or use service account object
  // serviceAccount: require('./serviceAccount.json'),

  // Connection pooling (recommended for serverless)
  enablePooling: true,        // Default: true
  idleTimeout: 300000,        // 5 minutes
  maxIdleTime: 600000,        // 10 minutes

  // Automatic retry (recommended)
  enableRetry: true,          // Default: true
  retryConfig: {
    maxRetries: 3,
    initialDelay: 100,
    maxDelay: 5000,
    backoffMultiplier: 2,
  },

  // Monitoring
  enableMetrics: true,        // Default: true
  enableTracing: true,        // Default: true

  // Graceful shutdown
  enableGracefulShutdown: true,  // Default: true
  shutdownTimeout: 10000,        // 10 seconds

  // Logging
  logLevel: "info",           // "debug" | "info" | "warn" | "error"
  logger: customLogger,       // Optional custom logger

  // Environment
  environment: "production",  // Default: process.env.NODE_ENV
});
```

---

## 🚀 Platform Support

Works on all platforms:

| Platform | Status | Notes |
|----------|--------|-------|
| **Vercel** | ✅ Fully Supported | Serverless Functions |
| **AWS Lambda** | ✅ Fully Supported | With Serverless Framework |
| **Google Cloud Functions** | ✅ Fully Supported | Gen 1 & 2 |
| **Google Cloud Run** | ✅ Fully Supported | Containerized apps |
| **Next.js** | ✅ Fully Supported | API Routes & Server Actions |
| **Express.js** | ✅ Fully Supported | Traditional servers |
| **Nest.js** | ✅ Fully Supported | Enterprise Node.js |
| **Cloudflare Workers** | ⚠️ Limited | Use standard runtime only |

---

## 📊 API Reference

### **Complete Method List**

#### **CRUD (10 methods)**
- `create()` - Create with auto-generated ID
- `set()` - Create with specific ID
- `read()` - Read single document
- `update()` - Update document
- `delete()` - Delete document
- `exists()` - Check if exists
- `upsert()` - Create or update
- `list()` - List all documents
- `count()` - Count documents
- `findOne()` - Find single document

#### **Relational (20+ methods)**
- `createRelational()` - Create with refs
- `setRelational()` - Set with refs
- `readRelational()` - Read relational format
- `readFlattened()` - Read merged format
- `updateData()` - Update data only
- `updateRefs()` - Update refs only
- `updateRelational()` - Update both
- `queryByRef()` - Query by single ref
- `queryByRefWithData()` - Query ref + filters
- `queryByRefs()` - Query multiple refs
- `queryByRefsWithData()` - Query refs + filters
- `queryByRefFlattened()` - Query flat results
- `countByRef()` - Count by ref
- `relationExists()` - Check relation
- `findOneByRefs()` - Find by refs
- `findOrCreateWithRefs()` - Find or create
- `upsertWithRefs()` - Upsert with refs
- `toggleRelation()` - Toggle relationship
- `deleteByRef()` - Delete by ref
- `getRelated()` - Join-like operation
- `cascadeDeleteRelational()` - Cascade delete
- `batchCreateRelational()` - Batch create
- `aggregateCountByParent()` - Aggregate counts

#### **Query (10+ methods)**
- `query()` - Simple equality queries
- `queryAdvanced()` - Complex queries
- `queryOrdered()` - With ordering
- `queryOrderedAdvanced()` - Ordered + complex
- `queryPaginated()` - Pagination
- `queryPaginatedAdvanced()` - Pagination + complex
- `findOneAdvanced()` - Find with operators
- `countWhere()` - Count with filters
- `countWhereAdvanced()` - Count advanced
- `queryWithOptions()` - Full control

#### **Batch (6 methods)**
- `batchCreate()` - Bulk create
- `batchSet()` - Bulk set
- `batchUpdate()` - Bulk update
- `batchDelete()` - Bulk delete
- `batchIncrement()` - Bulk increment
- `deleteCollection()` - Delete collection

#### **Transaction (7 methods)**
- `runTransaction()` - Custom transaction
- `atomicIncrement()` - Atomic add
- `atomicDecrement()` - Atomic subtract
- `atomicTransfer()` - Transfer between docs
- `conditionalUpdate()` - Update if condition
- `readModifyWrite()` - Read-modify-write
- `compareAndSwap()` - CAS operation

#### **Migration (8 methods)**
- `convertToRelational()` - Convert single
- `batchConvertToRelational()` - Convert all
- `batchTransform()` - Custom transform
- `addFieldToAll()` - Add field
- `removeFieldFromAll()` - Remove field
- `renameField()` - Rename field
- `copyCollection()` - Copy collection
- `validateMigration()` - Dry run

#### **Utilities**
- `getMetrics()` - Get connection metrics
- `getFirestoreInstance()` - Get raw Firestore
- `close()` - Close connection
- `serverTimestamp()` - Get server timestamp
- `arrayUnion()` - Array union operation
- `arrayRemove()` - Array remove operation
- `increment()` - Increment field value
- `deleteField()` - Delete field

#### **DatabaseManager (Static Class)**
- `createInstance()` - Create new instance
- `getInstance()` - Get instance by name
- `getDefault()` - Get default instance
- `setDefault()` - Set default instance
- `hasInstance()` - Check if exists
- `getInstanceNames()` - List all names
- `getInstanceCount()` - Count instances
- `closeInstance()` - Close one
- `closeAll()` - Close all
- `getAllMetrics()` - All metrics
- `getInstanceMetrics()` - Instance metrics
- `healthCheck()` - Health status
- `reset()` - Reset all (testing)

---

## 🏥 Health Monitoring

```typescript
import { DatabaseManager } from "@zyljs/firestore-adapter";

// Health check endpoint
app.get("/health", (req, res) => {
  const health = DatabaseManager.healthCheck();
  res.json(health);
});

// Metrics endpoint
app.get("/metrics", (req, res) => {
  const metrics = DatabaseManager.getAllMetrics();
  res.json(metrics);
});

// Database info
app.get("/db/info", (req, res) => {
  res.json({
    instances: DatabaseManager.getInstanceNames(),
    count: DatabaseManager.getInstanceCount(),
  });
});
```

---

## 🧪 Testing

```typescript
import { DatabaseManager } from "@zyljs/firestore-adapter";

describe("User Service", () => {
  beforeAll(() => {
    DatabaseManager.createInstance("test", {
      projectId: "test-project",
      clientEmail: process.env.TEST_EMAIL,
      privateKey: process.env.TEST_KEY,
    });
  });

  afterAll(async () => {
    await DatabaseManager.reset();
  });

  it("should create user", async () => {
    const db = DatabaseManager.getInstance("test");
    const user = await db.create("users", { name: "Test" });
    expect(user.id).toBeDefined();
  });
});
```

---

## 🔒 Security Best Practices

1. **Never commit credentials** - Use environment variables
2. **Use minimal permissions** - Grant only necessary Firestore roles
3. **Implement Firestore security rules** - Don't rely solely on server-side auth
4. **Validate input data** - Always validate before database operations
5. **Use separate projects** - Different projects for dev/staging/production
6. **Enable audit logging** - Track database access in production
7. **Rotate service account keys** - Regularly update credentials

---

## 📝 Environment Variables

```bash
# Main database
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=service@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Additional databases (optional)
FIREBASE_ANALYTICS_PROJECT_ID=analytics-project
FIREBASE_ANALYTICS_CLIENT_EMAIL=service@analytics.iam.gserviceaccount.com
FIREBASE_ANALYTICS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# Application
NODE_ENV=production
```

---

## 🤝 Contributing

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

---

## 📄 License

MIT © [Your Name]

---

## 🔗 Links

- [GitHub](https://github.com/Abdul-Ahad-dev-git/ilniqjs-firestore-adapter)
- [NPM](https://www.npmjs.com/package/@ilniqjs/firestore-adapter)


---

## 💬 Support

- 📧 Email: abdulahadsn5680.dev@gmail.com

---

**Built with ❤️ for the serverless community**