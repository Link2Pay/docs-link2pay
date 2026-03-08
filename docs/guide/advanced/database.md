# Database Schema

Link2Pay uses PostgreSQL as its primary database with Prisma ORM for type-safe database access. This guide covers the complete database schema, relationships, indexing strategies, and optimization techniques.

## Overview

The database is designed with the following principles:

- **Normalization**: Minimize data redundancy while maintaining performance
- **Integrity**: Foreign keys and constraints ensure data consistency
- **Performance**: Strategic indexing for common query patterns
- **Scalability**: Designed to handle millions of invoices and payments
- **Auditability**: Timestamp tracking for all entities

## Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Invoice : creates
    User ||--o{ PaymentLink : creates
    User ||--o{ Client : manages
    User ||--o{ ApiKey : owns
    Invoice ||--o{ Payment : receives
    Invoice }o--|| Client : "billed to"
    PaymentLink ||--o{ Payment : receives
    Payment }o--|| Client : "paid by"

    User {
        string id PK
        string walletAddress UK
        string email UK
        string name
        boolean emailVerified
        datetime createdAt
        datetime updatedAt
    }

    Invoice {
        string id PK
        string merchantId FK
        string clientId FK
        string invoiceNumber UK
        decimal amount
        string asset
        string description
        string status
        datetime expiresAt
        datetime paidAt
        datetime createdAt
        datetime updatedAt
    }

    Payment {
        string id PK
        string transactionHash UK
        string invoiceId FK
        string linkId FK
        string clientId FK
        decimal amount
        string asset
        string from
        string to
        string status
        integer ledger
        datetime createdAt
    }

    PaymentLink {
        string id PK
        string merchantId FK
        string slug UK
        string title
        decimal amount
        string asset
        boolean active
        datetime expiresAt
        datetime createdAt
        datetime updatedAt
    }

    Client {
        string id PK
        string merchantId FK
        string name
        string email UK
        string walletAddress
        datetime createdAt
        datetime updatedAt
    }

    ApiKey {
        string id PK
        string userId FK
        string key UK
        string name
        datetime expiresAt
        datetime lastUsedAt
        datetime createdAt
    }
```

## Schema Definition

### User Model

Represents merchants using the Link2Pay platform.

```prisma
model User {
  id            String    @id @default(cuid())
  walletAddress String    @unique
  email         String?   @unique
  name          String?
  emailVerified Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  invoices     Invoice[]
  paymentLinks PaymentLink[]
  clients      Client[]
  apiKeys      ApiKey[]

  @@index([walletAddress])
  @@index([email])
  @@map("users")
}
```

**Key Fields:**
- `walletAddress`: Stellar public key (primary authentication)
- `email`: Optional email for notifications
- `emailVerified`: Email verification status

**Indexes:**
- Primary key on `id`
- Unique index on `walletAddress` (authentication lookups)
- Unique index on `email` (optional email-based lookups)

### Invoice Model

Core entity representing payment requests.

```prisma
model Invoice {
  id            String        @id @default(cuid())
  invoiceNumber String        @unique @default(cuid())
  merchantId    String
  clientId      String?

  // Payment details
  amount        Decimal       @db.Decimal(20, 7)
  asset         String        @default("XLM")
  description   String
  memo          String?

  // Status and lifecycle
  status        InvoiceStatus @default(PENDING)
  expiresAt     DateTime
  paidAt        DateTime?

  // Metadata
  metadata      Json?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  // Relations
  merchant User     @relation(fields: [merchantId], references: [id], onDelete: Cascade)
  client   Client?  @relation(fields: [clientId], references: [id], onDelete: SetNull)
  payments Payment[]

  @@index([merchantId])
  @@index([clientId])
  @@index([status])
  @@index([expiresAt])
  @@index([createdAt])
  @@index([invoiceNumber])
  @@map("invoices")
}

enum InvoiceStatus {
  PENDING
  PAID
  EXPIRED
  CANCELLED
}
```

**Key Fields:**
- `amount`: Decimal with 7 decimal precision (Stellar standard)
- `asset`: Asset code (XLM, USDC, EURC, etc.)
- `status`: Current invoice state
- `expiresAt`: Invoice expiration timestamp
- `metadata`: Flexible JSON field for custom data

**Indexes:**
- `merchantId`: Merchant's invoice queries
- `status`: Filter by status
- `expiresAt`: Find expiring invoices
- `createdAt`: Chronological queries
- `invoiceNumber`: Quick lookup by invoice number

### Payment Model

Records of Stellar blockchain transactions.

```prisma
model Payment {
  id              String        @id @default(cuid())
  transactionHash String        @unique

  // Relations
  invoiceId       String?
  linkId          String?
  clientId        String?

  // Payment details
  amount          Decimal       @db.Decimal(20, 7)
  asset           String
  from            String
  to              String

  // Blockchain data
  ledger          Int
  memo            String?

  // Status
  status          PaymentStatus @default(CONFIRMED)
  createdAt       DateTime      @default(now())

  // Relations
  invoice     Invoice?     @relation(fields: [invoiceId], references: [id], onDelete: SetNull)
  paymentLink PaymentLink? @relation(fields: [linkId], references: [id], onDelete: SetNull)
  client      Client?      @relation(fields: [clientId], references: [id], onDelete: SetNull)

  @@index([invoiceId])
  @@index([linkId])
  @@index([clientId])
  @@index([from])
  @@index([to])
  @@index([status])
  @@index([createdAt])
  @@map("payments")
}

enum PaymentStatus {
  PENDING
  CONFIRMED
  FAILED
}
```

**Key Fields:**
- `transactionHash`: Unique Stellar transaction identifier
- `ledger`: Stellar ledger number for the transaction
- `from`: Payer's Stellar address
- `to`: Recipient's Stellar address

**Unique Constraint:**
- `transactionHash`: Prevents double-spend attacks

**Indexes:**
- `invoiceId`: Find payments for invoice
- `from`: Query by payer
- `to`: Query by recipient
- `status`: Filter by payment status

### PaymentLink Model

Reusable payment links (like Stripe Payment Links).

```prisma
model PaymentLink {
  id          String   @id @default(cuid())
  merchantId  String
  slug        String   @unique

  // Link details
  title       String
  description String?
  amount      Decimal  @db.Decimal(20, 7)
  asset       String   @default("XLM")

  // Configuration
  active      Boolean  @default(true)
  expiresAt   DateTime?
  maxUses     Int?
  currentUses Int      @default(0)

  // Metadata
  metadata    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  merchant User      @relation(fields: [merchantId], references: [id], onDelete: Cascade)
  payments Payment[]

  @@index([merchantId])
  @@index([slug])
  @@index([active])
  @@map("payment_links")
}
```

**Key Fields:**
- `slug`: URL-friendly identifier
- `maxUses`: Optional limit on usage count
- `currentUses`: Tracks usage for limits

**Indexes:**
- `slug`: Quick link resolution
- `merchantId`: Merchant's link queries
- `active`: Filter active links

### Client Model

Customer/payer information.

```prisma
model Client {
  id            String   @id @default(cuid())
  merchantId    String

  // Client details
  name          String
  email         String?
  walletAddress String?

  // Metadata
  metadata      Json?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  merchant User      @relation(fields: [merchantId], references: [id], onDelete: Cascade)
  invoices Invoice[]
  payments Payment[]

  @@unique([merchantId, email])
  @@index([merchantId])
  @@index([email])
  @@index([walletAddress])
  @@map("clients")
}
```

**Key Fields:**
- `email`: Client's email (optional)
- `walletAddress`: Client's Stellar address (optional)

**Composite Unique:**
- `[merchantId, email]`: Prevent duplicate clients per merchant

**Indexes:**
- `merchantId`: Merchant's client queries
- `email`: Email-based lookups
- `walletAddress`: Wallet-based lookups

### ApiKey Model

API authentication credentials.

```prisma
model ApiKey {
  id         String    @id @default(cuid())
  userId     String
  key        String    @unique
  name       String
  expiresAt  DateTime?
  lastUsedAt DateTime?
  createdAt  DateTime  @default(now())

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([key])
  @@map("api_keys")
}
```

**Key Fields:**
- `key`: Hashed API key
- `expiresAt`: Optional expiration
- `lastUsedAt`: Track usage

**Security:**
- Store only hashed keys
- Never log full keys

## Common Queries

### Invoice Queries

**Get pending invoices for merchant:**

```typescript
const pendingInvoices = await prisma.invoice.findMany({
  where: {
    merchantId: userId,
    status: 'PENDING',
    expiresAt: { gte: new Date() }
  },
  include: {
    client: {
      select: { name: true, email: true }
    },
    payments: {
      where: { status: 'CONFIRMED' }
    }
  },
  orderBy: { createdAt: 'desc' },
  take: 20
});
```

**Get invoice with full payment history:**

```typescript
const invoice = await prisma.invoice.findUnique({
  where: { id: invoiceId },
  include: {
    merchant: {
      select: { walletAddress: true, name: true }
    },
    client: true,
    payments: {
      orderBy: { createdAt: 'desc' }
    }
  }
});
```

**Find expiring invoices (for cron job):**

```typescript
const expiringInvoices = await prisma.invoice.findMany({
  where: {
    status: 'PENDING',
    expiresAt: {
      lte: new Date(Date.now() + 15 * 60 * 1000), // Next 15 minutes
      gte: new Date()
    }
  },
  include: {
    merchant: {
      select: { email: true }
    }
  }
});
```

### Payment Queries

**Check if transaction already processed (double-spend):**

```typescript
const existingPayment = await prisma.payment.findUnique({
  where: { transactionHash: txHash }
});

if (existingPayment) {
  throw new Error('Transaction already processed');
}
```

**Get merchant payment history:**

```typescript
const payments = await prisma.payment.findMany({
  where: {
    OR: [
      { invoice: { merchantId: userId } },
      { paymentLink: { merchantId: userId } }
    ],
    status: 'CONFIRMED'
  },
  include: {
    invoice: {
      select: { invoiceNumber: true, description: true }
    },
    paymentLink: {
      select: { title: true }
    },
    client: {
      select: { name: true, email: true }
    }
  },
  orderBy: { createdAt: 'desc' },
  take: 50
});
```

**Calculate total revenue:**

```typescript
const revenue = await prisma.payment.aggregate({
  where: {
    invoice: { merchantId: userId },
    status: 'CONFIRMED',
    asset: 'XLM'
  },
  _sum: {
    amount: true
  }
});

console.log(`Total XLM revenue: ${revenue._sum.amount}`);
```

### Analytics Queries

**Monthly revenue by asset:**

```typescript
const monthlyRevenue = await prisma.$queryRaw<Array<{
  month: string;
  asset: string;
  total: number;
}>>`
  SELECT
    DATE_TRUNC('month', p.created_at) as month,
    p.asset,
    SUM(p.amount) as total
  FROM payments p
  JOIN invoices i ON p.invoice_id = i.id
  WHERE i.merchant_id = ${userId}
    AND p.status = 'CONFIRMED'
    AND p.created_at >= NOW() - INTERVAL '12 months'
  GROUP BY DATE_TRUNC('month', p.created_at), p.asset
  ORDER BY month DESC, asset ASC
`;
```

**Top clients by payment volume:**

```typescript
const topClients = await prisma.client.findMany({
  where: { merchantId: userId },
  include: {
    payments: {
      where: { status: 'CONFIRMED' },
      select: { amount: true, asset: true }
    },
    _count: {
      select: { payments: true }
    }
  },
  take: 10
});

// Calculate totals client-side
const clientsWithTotals = topClients.map(client => ({
  ...client,
  totalPayments: client.payments.reduce((sum, p) =>
    sum + parseFloat(p.amount.toString()), 0
  )
})).sort((a, b) => b.totalPayments - a.totalPayments);
```

## Indexing Strategy

### Index Types

**B-tree Indexes (Default):**
- Equality comparisons (`=`)
- Range queries (`<`, `>`, `BETWEEN`)
- Sorting (`ORDER BY`)

**Hash Indexes:**
- Only equality comparisons
- Faster than B-tree for exact matches
- Not supported in all databases

### Index Guidelines

**When to Add Index:**
- Columns in `WHERE` clauses
- Columns in `JOIN` conditions
- Columns in `ORDER BY`
- Foreign key columns
- Unique constraints

**When NOT to Add Index:**
- Small tables (<1000 rows)
- Columns rarely queried
- Columns with low cardinality (few distinct values)
- Write-heavy tables (indexes slow down writes)

### Current Indexes

All indexes in Link2Pay schema:

```typescript
// User indexes
@@index([walletAddress])  // Authentication queries
@@index([email])          // Email lookups

// Invoice indexes
@@index([merchantId])     // Merchant's invoices
@@index([clientId])       // Client's invoices
@@index([status])         // Status filters
@@index([expiresAt])      // Expiration queries
@@index([createdAt])      // Chronological sorting
@@index([invoiceNumber])  // Quick lookups

// Payment indexes
@@index([invoiceId])      // Invoice payments
@@index([linkId])         // Payment link payments
@@index([clientId])       // Client payments
@@index([from])           // Payer queries
@@index([to])             // Recipient queries
@@index([status])         // Status filters
@@index([createdAt])      // Chronological sorting

// PaymentLink indexes
@@index([merchantId])     // Merchant's links
@@index([slug])           // Link resolution
@@index([active])         // Active link filters

// Client indexes
@@index([merchantId])     // Merchant's clients
@@index([email])          // Email lookups
@@index([walletAddress])  // Wallet lookups

// ApiKey indexes
@@index([userId])         // User's keys
@@index([key])            // Key lookups
```

### Performance Monitoring

**Check index usage:**

```sql
-- PostgreSQL: Find unused indexes
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY schemaname, tablename;

-- Find missing indexes (table scans)
SELECT
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  seq_tup_read / seq_scan as avg_rows_per_scan
FROM pg_stat_user_tables
WHERE seq_scan > 0
ORDER BY seq_tup_read DESC
LIMIT 20;
```

## Database Optimization

### Connection Pooling

```typescript
// Prisma connection pool configuration
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")

  // Connection pool settings
  connection_limit = 10
  pool_timeout = 30
  statement_timeout = 60000
}

// PgBouncer configuration (recommended for production)
# pgbouncer.ini
[databases]
link2pay = host=localhost port=5432 dbname=link2pay

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
min_pool_size = 10
reserve_pool_size = 5
reserve_pool_timeout = 3
```

### Query Optimization

**Use SELECT specific columns:**

```typescript
// BAD: Fetches all columns
const invoices = await prisma.invoice.findMany({
  where: { merchantId: userId }
});

// GOOD: Only needed columns
const invoices = await prisma.invoice.findMany({
  where: { merchantId: userId },
  select: {
    id: true,
    invoiceNumber: true,
    amount: true,
    status: true,
    createdAt: true
  }
});
```

**Use pagination:**

```typescript
// Cursor-based pagination (recommended)
const invoices = await prisma.invoice.findMany({
  where: { merchantId: userId },
  take: 20,
  skip: 1,
  cursor: { id: lastInvoiceId },
  orderBy: { createdAt: 'desc' }
});

// Offset-based pagination (simpler, slower for large offsets)
const page = 2;
const pageSize = 20;

const invoices = await prisma.invoice.findMany({
  where: { merchantId: userId },
  take: pageSize,
  skip: (page - 1) * pageSize,
  orderBy: { createdAt: 'desc' }
});
```

**Batch operations:**

```typescript
// BAD: N+1 query problem
for (const invoice of invoices) {
  const payments = await prisma.payment.findMany({
    where: { invoiceId: invoice.id }
  });
}

// GOOD: Single query with includes
const invoices = await prisma.invoice.findMany({
  where: { merchantId: userId },
  include: { payments: true }
});
```

### Caching Strategy

**Redis caching for frequently accessed data:**

```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Cache invoice lookups
async function getInvoice(id: string) {
  // Check cache first
  const cached = await redis.get(`invoice:${id}`);
  if (cached) {
    return JSON.parse(cached);
  }

  // Fetch from database
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      merchant: { select: { walletAddress: true } },
      payments: true
    }
  });

  // Cache for 5 minutes
  if (invoice) {
    await redis.setex(
      `invoice:${id}`,
      300,
      JSON.stringify(invoice)
    );
  }

  return invoice;
}

// Invalidate cache on update
async function updateInvoice(id: string, data: any) {
  const invoice = await prisma.invoice.update({
    where: { id },
    data
  });

  // Invalidate cache
  await redis.del(`invoice:${id}`);

  return invoice;
}
```

## Database Migrations

### Creating Migrations

```bash
# Create a new migration
npx prisma migrate dev --name add_invoice_metadata

# Apply migrations in production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

### Migration Best Practices

**1. Always test migrations:**

```bash
# Test on development database
npx prisma migrate dev

# Test on staging before production
DATABASE_URL="postgresql://staging..." npx prisma migrate deploy
```

**2. Make migrations reversible:**

```sql
-- migration.sql
-- Up
ALTER TABLE invoices ADD COLUMN metadata JSONB;

-- Down (manual rollback if needed)
-- ALTER TABLE invoices DROP COLUMN metadata;
```

**3. Handle data transformations:**

```typescript
// Custom migration script for data transformation
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrate() {
  // Get all invoices without metadata
  const invoices = await prisma.invoice.findMany({
    where: { metadata: null }
  });

  // Transform and update
  for (const invoice of invoices) {
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        metadata: {
          migrated: true,
          migratedAt: new Date().toISOString()
        }
      }
    });
  }
}

migrate()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

**4. Use transactions for complex migrations:**

```typescript
await prisma.$transaction(async (tx) => {
  // Step 1: Add new column
  await tx.$executeRaw`
    ALTER TABLE invoices
    ADD COLUMN new_amount DECIMAL(20,7)
  `;

  // Step 2: Copy data
  await tx.$executeRaw`
    UPDATE invoices
    SET new_amount = amount
  `;

  // Step 3: Drop old column
  await tx.$executeRaw`
    ALTER TABLE invoices
    DROP COLUMN amount
  `;

  // Step 4: Rename column
  await tx.$executeRaw`
    ALTER TABLE invoices
    RENAME COLUMN new_amount TO amount
  `;
});
```

### Common Migration Patterns

**Adding a nullable column:**

```prisma
// Step 1: Add nullable column
model Invoice {
  // ... existing fields
  metadata Json?  // Added
}

// Step 2: Migrate
npx prisma migrate dev --name add_invoice_metadata

// Step 3: Populate data (if needed)
// Step 4: Make non-nullable (if required)
```

**Renaming a column:**

```prisma
// schema.prisma
model Invoice {
  // OLD: invoiceNumber String @unique
  // NEW:
  number String @unique @map("invoice_number")
}

// Migration will preserve data
npx prisma migrate dev --name rename_invoice_number
```

**Adding a unique constraint:**

```prisma
// Ensure data doesn't violate constraint first
model Client {
  @@unique([merchantId, email])
}

npx prisma migrate dev --name add_client_email_unique
```

## Backup and Recovery

### Automated Backups

```bash
#!/bin/bash
# backup.sh - Run daily via cron

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/link2pay"
DATABASE_URL="postgresql://user:pass@localhost:5432/link2pay"

# Create backup
pg_dump $DATABASE_URL | gzip > "$BACKUP_DIR/backup_$TIMESTAMP.sql.gz"

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

# Upload to S3
aws s3 cp "$BACKUP_DIR/backup_$TIMESTAMP.sql.gz" \
  s3://link2pay-backups/postgres/
```

### Point-in-Time Recovery

Enable WAL archiving for PostgreSQL:

```bash
# postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'aws s3 cp %p s3://link2pay-backups/wal/%f'
```

### Restore from Backup

```bash
# Restore from backup file
gunzip -c backup_20240315_120000.sql.gz | psql $DATABASE_URL

# Verify data
psql $DATABASE_URL -c "SELECT COUNT(*) FROM invoices;"
```

## Monitoring and Alerts

### Key Metrics to Monitor

**Database Performance:**
- Query execution time
- Connection pool usage
- Cache hit ratio
- Index usage statistics
- Table bloat

**Application Metrics:**
- Invoice creation rate
- Payment processing time
- Failed transactions
- API response times

### Monitoring Setup

```typescript
// Prisma middleware for query logging
prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();

  const duration = after - before;

  if (duration > 1000) {
    logger.warn('Slow query detected', {
      model: params.model,
      action: params.action,
      duration: `${duration}ms`
    });
  }

  return result;
});
```

## Troubleshooting

### Common Issues

**Slow queries:**

```sql
-- Find slow queries (PostgreSQL)
SELECT
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

**Connection pool exhaustion:**

```typescript
// Monitor pool status
prisma.$on('query', (e) => {
  console.log('Active connections:', e.params);
});

// Increase pool size if needed
// DATABASE_URL="postgresql://...?connection_limit=20"
```

**Lock contention:**

```sql
-- Find blocking queries
SELECT
  blocked_locks.pid AS blocked_pid,
  blocking_locks.pid AS blocking_pid,
  blocked_activity.query AS blocked_query,
  blocking_activity.query AS blocking_query
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity
  ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks
  ON blocking_locks.locktype = blocked_locks.locktype
WHERE NOT blocked_locks.granted;
```

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Database Design Best Practices](https://www.postgresql.org/docs/current/ddl.html)
