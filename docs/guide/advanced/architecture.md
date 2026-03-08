# Architecture

Comprehensive technical documentation of Link2Pay's system architecture, technology stack, data flow, and critical components.

## Table of Contents

- [Technology Stack](#technology-stack)
- [System Components](#system-components)
- [On-Chain vs Off-Chain](#on-chain-vs-off-chain)
- [Data Flow](#data-flow)
- [Critical Business Logic](#critical-business-logic)
- [External Dependencies](#external-dependencies)
- [Database Schema](#database-schema)
- [Security Architecture](#security-architecture)
- [Technical Decisions](#technical-decisions)

---

## Technology Stack

### Frontend Stack (Complete)

#### Core Framework & Runtime
| Package | Version | Purpose | Why Chosen |
|---------|---------|---------|------------|
| `react` | 18.2.0 | UI framework | Industry standard, component-based, large ecosystem |
| `react-dom` | 18.2.0 | React renderer | Required for web applications |
| `vite` | 5.0.0 | Build tool & dev server | Lightning-fast HMR, ESM-native, superior DX vs Webpack |
| `typescript` | 5.3.0 | Type system | Catch errors at compile-time, better IDE support |

**Decision Rationale:**
- **React 18**: Concurrent features, automatic batching, improved SSR (future)
- **Vite**: 10x faster than CRA/Webpack, native ES modules, instant HMR
- **TypeScript**: Prevents 15-20% of runtime bugs, self-documenting code

#### State Management
| Package | Version | Purpose | Why Chosen |
|---------|---------|---------|------------|
| `zustand` | 4.4.0 | Global state management | Simpler than Redux, no boilerplate, 1KB size |
| `@tanstack/react-query` | 5.0.0 | Server state & caching | Handles async state, automatic refetching, built-in caching |

**Decision Rationale:**
- **Zustand**: Wallet state, network preferences - simple, no Context API overhead
- **React Query**: Invoice data, payment status - automatic cache invalidation, optimistic updates
- **Why not Redux**: Zustand is 90% less boilerplate for our use case
- **Why not SWR**: React Query has better DevTools and more features

#### Blockchain Integration
| Package | Version | Purpose | Why Chosen |
|---------|---------|---------|------------|
| `@stellar/stellar-sdk` | 12.0.0 | Stellar blockchain SDK | Official Stellar SDK, transaction building, account management |
| `@stellar/freighter-api` | 2.0.0 | Wallet connector | Most popular Stellar wallet (50K+ users), browser extension |

**Decision Rationale:**
- **Stellar SDK 12.0**: Latest stable version with Soroban support (future smart contracts)
- **Freighter**: Dominant wallet in Stellar ecosystem, MetaMask equivalent
- **Why not Albedo**: Freighter has better UX and active development
- **Why not custom wallet**: Security risk, requires key management

#### UI & Styling
| Package | Version | Purpose | Why Chosen |
|---------|---------|---------|------------|
| `tailwindcss` | 3.4.0 | Utility-first CSS | Rapid prototyping, consistent design system, tree-shakeable |
| `lucide-react` | 0.263.1 | Icon library | 1000+ icons, tree-shakeable, React-optimized |
| `react-hot-toast` | 2.4.1 | Toast notifications | Lightweight (3KB), beautiful defaults, accessible |
| `@react-pdf/renderer` | 4.3.2 | PDF generation | Client-side PDF generation, no server needed |

**Decision Rationale:**
- **Tailwind**: 30% faster development vs styled-components, smaller bundle
- **Lucide**: Modern alternative to Feather/Heroicons, better tree-shaking
- **react-hot-toast**: Simpler than react-toastify, better animations
- **react-pdf/renderer**: Generate invoices client-side, privacy-preserving

#### Routing
| Package | Version | Purpose | Why Chosen |
|---------|---------|---------|------------|
| `react-router-dom` | 6.20.0 | Client-side routing | Industry standard, nested routes, data loaders (future) |

**Decision Rationale:**
- **React Router v6**: Data APIs, nested routing, better TypeScript support than v5
- **Why not Tanstack Router**: Too new, smaller ecosystem
- **Why not Wouter**: Too minimal for complex routing needs

#### Build & Development Tools
| Package | Version | Purpose | Why Chosen |
|---------|---------|---------|------------|
| `@vitejs/plugin-react` | 4.2.1 | Vite React plugin | Fast Refresh, JSX transform |
| `autoprefixer` | 10.4.16 | CSS vendor prefixes | Browser compatibility |
| `postcss` | 8.4.32 | CSS processor | Required for Tailwind |
| `@types/react` | 18.2.43 | React TypeScript types | Type checking |
| `@types/react-dom` | 18.2.17 | ReactDOM types | Type checking |

---

### Backend Stack (Complete)

#### Core Framework & Runtime
| Package | Version | Purpose | Why Chosen |
|---------|---------|---------|------------|
| `express` | 4.18.2 | Web framework | Mature, 55K+ packages, flexible middleware |
| `typescript` | 5.3.0 | Type system | Type safety, refactoring confidence |
| `tsx` | 4.7.0 | TypeScript execution | Fast TS execution without compilation step (dev) |
| `vitest` | 4.0.18 | Testing framework | Fast, Vite-native, better DX than Jest |

**Decision Rationale:**
- **Express**: Proven at scale, massive ecosystem, simple and flexible
- **Why not Fastify**: Express plugins ecosystem more mature for our needs
- **Why not NestJS**: Over-engineered for this scale, adds complexity
- **tsx**: Instant TypeScript execution in development

#### Database & ORM
| Package | Version | Purpose | Why Chosen |
|---------|---------|---------|------------|
| `@prisma/client` | 5.10.0 | Database client | Type-safe queries, auto-generated types |
| `prisma` | 5.10.0 | ORM & migrations | Best-in-class TypeScript ORM, schema-first design |
| PostgreSQL | 16 | Relational database | ACID transactions, JSON support, proven at scale |

**Decision Rationale:**
- **Prisma**: Auto-generated types, migration management, best DX for TypeScript
- **PostgreSQL**: SERIALIZABLE isolation (prevents race conditions), JSON columns for audit logs
- **Why not MongoDB**: Invoices are relational (line items, payments), need ACID
- **Why not TypeORM**: Prisma has better TypeScript integration and DX
- **Why not Sequelize**: Prisma migrations are more reliable

#### Blockchain Integration
| Package | Version | Purpose | Why Chosen |
|---------|---------|---------|------------|
| `@stellar/stellar-sdk` | 12.0.0 | Stellar blockchain SDK | Transaction building, Horizon API client |

**Decision Rationale:**
- **Stellar SDK 12.0**: Official SDK, supports all Stellar operations
- **Horizon REST API**: Query ledger, submit transactions, stream payments
- **Why Stellar**: 3-5s finality, <$0.01 fees, built-in DEX for multi-asset

#### Security & Validation
| Package | Version | Purpose | Why Chosen |
|---------|---------|---------|------------|
| `helmet` | 7.1.0 | Security headers | CSP, HSTS, X-Frame-Options, XSS protection |
| `cors` | 2.8.5 | CORS middleware | Restrict API access to frontend origin |
| `express-rate-limit` | 7.1.0 | Rate limiting | Prevent abuse, DDoS protection |
| `zod` | 3.22.0 | Runtime validation | Type-safe request validation, auto-inferred types |

**Decision Rationale:**
- **Helmet**: Sets 11 security headers automatically
- **CORS**: Prevents unauthorized frontend origins
- **Rate limiting**: Per-IP and per-wallet limits prevent abuse
- **Zod**: Better DX than Joi/Yup, integrates with TypeScript

#### Utilities
| Package | Version | Purpose | Why Chosen |
|---------|---------|---------|------------|
| `winston` | 3.11.0 | Logging | Structured logs, log levels, transports |
| `dotenv` | 16.4.0 | Environment variables | Load .env files |
| `nanoid` | 5.0.4 | ID generation | Cryptographically secure, URL-safe, compact |

**Decision Rationale:**
- **Winston**: Production-grade logging, custom transports (future: Sentry)
- **nanoid**: Safer than UUID v4, 50% smaller, non-sequential (IDOR prevention)
- **Why not CUID**: nanoid is more widely adopted

---

## System Components

### 1. Frontend Application (React + Vite)

**Location:** `/frontend`
**Build Output:** Static files (HTML, JS, CSS)
**Deployment:** Vercel Edge Network
**Entry Point:** `src/main.tsx`

#### Module Structure

```
frontend/src/
├── components/          # Reusable UI components
│   ├── Invoice/        # Invoice management
│   │   ├── InvoiceForm.tsx       # Create/edit invoice
│   │   ├── InvoiceList.tsx       # List with filters
│   │   ├── InvoiceDetail.tsx     # Single invoice view
│   │   └── InvoicePDF.tsx        # PDF generation
│   ├── Payment/        # Payment processing
│   │   └── PaymentFlow.tsx       # Public payment page
│   ├── Wallet/         # Freighter integration
│   │   └── WalletConnect.tsx     # Connect/disconnect
│   ├── Layout.tsx      # App shell (sidebar, nav)
│   ├── NetworkToggle.tsx  # Testnet/mainnet switcher
│   └── ThemeToggle.tsx # Dark/light mode
├── pages/              # Route components
│   ├── Dashboard.tsx   # Freelancer dashboard
│   ├── CreateInvoice.tsx
│   ├── Clients.tsx     # Saved client book
│   └── ...
├── services/           # API & external services
│   ├── api.ts          # Backend API client (typed)
│   └── auth.ts         # Nonce fetch + signature caching
├── store/              # Zustand state management
│   ├── walletStore.ts  # Wallet state (address, network)
│   └── networkStore.ts # Network preferences
├── hooks/              # React hooks
│   └── useWalletRestore.ts
├── i18n/               # Internationalization
│   └── translations.ts # EN/ES/PT
└── config/             # Configuration
    └── index.ts        # Environment variables
```

#### Critical Modules

**`store/walletStore.ts`** - Wallet State Management
```typescript
interface WalletState {
  address: string | null;
  network: 'testnet' | 'mainnet';
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  signTransaction: (xdr: string) => Promise<string>;
  signMessage: (message: string) => Promise<string>;
}
```

**Purpose:**
- Manages Freighter wallet connection lifecycle
- Caches wallet address (localStorage)
- Handles network detection and validation
- Provides transaction signing interface

**`services/api.ts`** - Backend API Client
```typescript
// Type-safe API client with automatic auth headers
export const api = {
  invoices: {
    create: (data: CreateInvoiceDto) => Promise<Invoice>,
    list: (filters?: InvoiceFilters) => Promise<Invoice[]>,
    get: (id: string) => Promise<Invoice>,
    // ...
  },
  payments: {
    createPaymentIntent: (invoiceId: string) => Promise<{ xdr: string }>,
    submitPayment: (xdr: string, invoiceId: string) => Promise<{ hash: string }>,
    // ...
  }
};
```

**Purpose:**
- Centralized API communication
- Automatic authentication header injection
- Type-safe request/response
- Error handling and retry logic

**`services/auth.ts`** - Authentication Service
```typescript
// Nonce caching to reduce signature requests
const nonceCache = new Map<string, { nonce: string; expiresAt: number }>();

export async function getAuthHeaders(wallet: string): Promise<Headers> {
  // Check cache (4-minute TTL)
  const cached = nonceCache.get(wallet);
  if (cached && cached.expiresAt > Date.now()) {
    return buildHeaders(wallet, cached.nonce);
  }

  // Fetch new nonce from backend
  const { nonce, message } = await fetchNonce(wallet);

  // Sign with Freighter
  const signature = await freighter.signMessage(message);

  // Cache for 4 minutes (nonce expires in 5)
  nonceCache.set(wallet, {
    nonce,
    expiresAt: Date.now() + 4 * 60 * 1000
  });

  return buildHeaders(wallet, nonce, signature);
}
```

**Purpose:**
- Implements nonce-based authentication
- Caches nonces to reduce user friction (fewer signature prompts)
- Handles signature generation via Freighter

---

### 2. Backend API (Express + Prisma)

**Location:** `/backend`
**Build Output:** Compiled JavaScript (`dist/`)
**Deployment:** Render (managed Node.js hosting)
**Entry Point:** `src/index.ts`

#### Module Structure

```
backend/src/
├── routes/             # API endpoints
│   ├── auth.ts         # POST /auth/nonce
│   ├── invoices.ts     # Invoice CRUD + stats
│   ├── payments.ts     # Payment processing
│   ├── links.ts        # Payment link API
│   ├── clients.ts      # Saved client book
│   └── prices.ts       # GET /prices/xlm (CoinGecko)
├── services/           # Business logic
│   ├── stellarService.ts  # Stellar SDK wrapper
│   ├── watcherService.ts  # Payment monitoring
│   ├── invoiceService.ts  # Invoice operations
│   ├── authService.ts     # Nonce + signature verification
│   └── clientService.ts   # Client management
├── middleware/         # Express middleware
│   └── validation.ts   # Zod schemas + requireWallet guard
├── utils/              # Utilities
│   ├── generators.ts   # CUID / random invoice number
│   ├── logger.ts       # Winston configuration
│   ├── paymentLinks.ts # Payment link helpers
│   └── stellarErrors.ts # Stellar error handling
├── types/              # TypeScript types
│   ├── index.ts        # Shared types
│   └── express.d.ts    # Express augmentation
├── config/             # Configuration
│   └── index.ts        # Env validation (Zod)
├── db.ts               # Prisma client singleton
└── index.ts            # Express server setup
```

#### Critical Services

**`services/stellarService.ts`** - Stellar Blockchain Interface

**Responsibilities:**
- Build unsigned XDR transactions for payments
- Submit signed transactions to Horizon API
- Validate Stellar addresses (ed25519 public keys)
- Query account balances and transaction history
- Support both testnet and mainnet dynamically
- Exponential backoff for Horizon API rate limits

**Key Methods:**
```typescript
class StellarService {
  // Build payment transaction (unsigned)
  async buildPaymentTransaction(params: {
    senderPublicKey: string;
    recipientPublicKey: string;
    amount: string;
    assetCode: 'XLM' | 'USDC' | 'EURC';
    invoiceId: string;
    networkPassphrase: string;
  }): Promise<{ transactionXdr: string }>;

  // Submit signed XDR to network
  async submitTransaction(
    signedXdr: string,
    expectedNetworkPassphrase: string
  ): Promise<{ hash: string; ledger: number }>;

  // Verify transaction on-chain
  async verifyTransaction(
    txHash: string,
    networkPassphrase: string
  ): Promise<TransactionDetails>;

  // Get recent transactions for watcher
  async getTransactionHistory(
    accountId: string,
    limit: number,
    networkPassphrase: string
  ): Promise<Transaction[]>;
}
```

**Network Detection Logic:**
```typescript
// Invoices store their network passphrase in the database
const invoice = await prisma.invoice.findUnique({ where: { id } });

// Get correct Horizon server for this invoice's network
const server = new Horizon.Server(
  invoice.networkPassphrase === 'Test SDF Network ; September 2015'
    ? 'https://horizon-testnet.stellar.org'
    : 'https://horizon.stellar.org'
);

// Submit to correct network
await server.submitTransaction(signedTransaction);
```

**Asset Configuration:**
```typescript
// Mainnet issuers
const MAINNET_ASSETS = {
  USDC: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN', // Circle
  EURC: 'GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP2'  // Circle
};

// Testnet issuers
const TESTNET_ASSETS = {
  USDC: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
  EURC: 'CUSTOM_TESTNET_ISSUER'
};
```

**`services/watcherService.ts`** - Payment Monitoring

**Responsibilities:**
- Poll Stellar Horizon API every 5 seconds
- Query recent transactions for all wallets with PENDING invoices
- Match transactions by memo field (invoice ID or invoice number)
- Validate payment amount and asset type
- Update invoice status to PAID atomically
- Create Payment record with transaction details
- Handle both testnet and mainnet simultaneously
- Expire overdue invoices automatically

**Architecture:**
```typescript
class WatcherService {
  private pollInterval: NodeJS.Timeout;
  private isRunning: boolean = false;

  async start() {
    this.isRunning = true;

    // Initial check
    await this.checkPendingInvoices();

    // Poll every 5 seconds
    this.pollInterval = setInterval(async () => {
      await this.checkPendingInvoices();
    }, 5000);
  }

  private async checkPendingInvoices() {
    // 1. Expire overdue invoices
    await this.expireOverdueInvoices();

    // 2. Get all PENDING/PROCESSING invoices
    const pending = await prisma.invoice.findMany({
      where: { status: { in: ['PENDING', 'PROCESSING'] } }
    });

    // 3. Group by wallet + network
    const grouped = groupBy(pending, inv =>
      `${inv.freelancerWallet}:${inv.networkPassphrase}`
    );

    // 4. Check each wallet for payments
    for (const [key, invoices] of grouped) {
      const [wallet, network] = key.split(':');
      await this.checkWalletPayments(wallet, network, invoices);
    }
  }

  private async checkWalletPayments(
    wallet: string,
    network: string,
    invoices: Invoice[]
  ) {
    // Get last 20 transactions from Horizon
    const txs = await stellarService.getTransactionHistory(wallet, 20, network);

    for (const tx of txs) {
      // Match by memo
      const matchingInvoice = invoices.find(inv =>
        tx.memo === inv.id || tx.memo === inv.invoiceNumber
      );

      if (!matchingInvoice) continue;

      // Verify transaction details
      const details = await stellarService.verifyTransaction(tx.hash, network);

      // Find matching payment operation
      const payment = details.payments.find(p =>
        p.to === wallet &&
        p.assetCode === matchingInvoice.currency &&
        parseFloat(p.amount) >= parseFloat(matchingInvoice.total)
      );

      if (!payment) continue;

      // Atomically update invoice + create payment record
      await prisma.$transaction(async (tx) => {
        await tx.invoice.update({
          where: { id: matchingInvoice.id },
          data: {
            status: 'PAID',
            transactionHash: details.hash,
            ledgerNumber: details.ledger,
            payerWallet: payment.from,
            paidAt: new Date(details.createdAt)
          }
        });

        await tx.payment.create({
          data: {
            invoiceId: matchingInvoice.id,
            transactionHash: details.hash,
            ledgerNumber: details.ledger,
            fromWallet: payment.from,
            toWallet: wallet,
            amount: payment.amount,
            asset: payment.assetCode
          }
        });
      });
    }
  }
}
```

**Why Polling Instead of Webhooks:**
- Stellar Horizon doesn't provide webhooks
- SSE (Server-Sent Events) alternative exists but requires maintaining connections
- Polling is simpler, more reliable, and easier to scale
- 5-second latency is acceptable for payment confirmation
- Exponential backoff handles Horizon API rate limits

**`services/authService.ts`** - Cryptographic Authentication

**Responsibilities:**
- Generate single-use nonces with 5-minute TTL
- Verify ed25519 signatures from Freighter
- Prevent replay attacks (nonce consumption)
- No password storage or management

**Implementation:**
```typescript
class AuthService {
  private nonces = new Map<string, { nonce: string; expiresAt: number }>();

  // Generate nonce
  generateNonce(walletAddress: string): { nonce: string; message: string } {
    const nonce = nanoid(32); // Cryptographically secure random string
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    this.nonces.set(nonce, { walletAddress, expiresAt });

    const message = `
Link2Pay Authentication

Wallet: ${walletAddress}
Nonce: ${nonce}
Time: ${new Date().toISOString()}

This signature proves you own this wallet.
It will not trigger any blockchain transaction.
    `.trim();

    return { nonce, message };
  }

  // Verify signature
  async verifySignature(params: {
    walletAddress: string;
    nonce: string;
    signature: string;
  }): Promise<boolean> {
    // Check nonce exists and not expired
    const nonceData = this.nonces.get(params.nonce);
    if (!nonceData || nonceData.expiresAt < Date.now()) {
      throw new Error('INVALID_NONCE');
    }

    // Check nonce belongs to this wallet
    if (nonceData.walletAddress !== params.walletAddress) {
      throw new Error('NONCE_WALLET_MISMATCH');
    }

    // Reconstruct message
    const message = this.buildMessage(params.walletAddress, params.nonce);

    // Verify ed25519 signature using Stellar SDK
    const keypair = Keypair.fromPublicKey(params.walletAddress);
    const messageBuffer = Buffer.from(message, 'utf8');
    const signatureBuffer = Buffer.from(params.signature, 'hex');

    const isValid = keypair.verify(messageBuffer, signatureBuffer);

    if (isValid) {
      // Consume nonce (single-use)
      this.nonces.delete(params.nonce);
    }

    return isValid;
  }
}
```

**Security Properties:**
- **Non-repudiation**: Signature proves wallet ownership
- **Freshness**: Nonce ensures signature is recent (max 5 min old)
- **No replay**: Nonce consumed after first use
- **No secrets**: No passwords or API keys to leak

---

### 3. Database (PostgreSQL + Prisma)

**Deployment:** Render PostgreSQL / Supabase
**Schema Location:** `backend/prisma/schema.prisma`
**Migrations:** `backend/prisma/migrations/`

#### Complete Schema

**Tables:**
1. `invoices` - Invoice metadata and status
2. `line_items` - Individual invoice line items
3. `payments` - Confirmed on-chain payments
4. `clients` - Saved client book
5. `invoice_audit_logs` - Complete state change audit trail

**Enums:**
```prisma
enum InvoiceStatus {
  DRAFT       // Editable, not sent to client
  PENDING     // Sent, awaiting payment
  PROCESSING  // Payment submitted, not confirmed
  PAID        // Payment confirmed on-chain
  FAILED      // Payment submission failed
  EXPIRED     // Due date passed
  CANCELLED   // Manually cancelled
}

enum Currency {
  XLM   // Stellar Lumens (native)
  USDC  // USD Coin (Circle stablecoin)
  EURC  // Euro Coin (Circle stablecoin)
}

enum PaymentStatus {
  CONFIRMED  // Payment on-chain and verified
  FAILED     // Transaction failed
  REFUNDED   // Payment refunded (future)
}

enum AuditAction {
  CREATED    // Invoice created
  UPDATED    // Details edited
  SENT       // Marked as PENDING
  PAID       // Payment confirmed
  EXPIRED    // Due date passed
  CANCELLED  // Manually cancelled
  DELETED    // Soft deleted
}
```

**Invoice Table:**
```prisma
model Invoice {
  id            String   @id @default(cuid())
  invoiceNumber String   @unique
  status        InvoiceStatus @default(DRAFT)

  // Freelancer (creator)
  freelancerWallet  String
  freelancerName    String?
  freelancerEmail   String?
  freelancerCompany String?

  // Client (payer)
  clientName    String
  clientEmail   String
  clientCompany String?
  clientAddress String?
  clientWallet  String?  // Set after payment

  // Invoice details
  title       String
  description String?
  notes       String?

  // Financial (Decimal for precision)
  subtotal  Decimal  @db.Decimal(18, 7)  // 7 decimals for XLM precision
  taxRate   Decimal? @db.Decimal(5, 2)   // Percentage (0-100)
  taxAmount Decimal? @db.Decimal(18, 7)
  discount  Decimal? @db.Decimal(18, 7)
  total     Decimal  @db.Decimal(18, 7)
  currency  Currency @default(XLM)

  // Dates
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  dueDate   DateTime?
  paidAt    DateTime?

  // Blockchain reference
  transactionHash   String?  // Stellar tx hash
  ledgerNumber      Int?     // Ledger number for block explorer
  payerWallet       String?  // Who paid (from tx)
  networkPassphrase String   @default("Test SDF Network ; September 2015")

  // Soft delete
  deletedAt DateTime?

  // Relations
  lineItems  LineItem[]
  payments   Payment[]
  auditLogs  InvoiceAuditLog[]

  // Indexes for performance
  @@index([freelancerWallet])        // Get all invoices for a user
  @@index([status])                  // Filter by status
  @@index([invoiceNumber])           // Memo matching in watcher
  @@index([freelancerWallet, status]) // Combined filter
  @@index([freelancerWallet, deletedAt]) // Exclude deleted
  @@index([dueDate])                 // Expiry checks
}
```

**Why Decimal Instead of Float:**
- Financial amounts require exact precision
- Stellar supports up to 7 decimal places
- `Decimal(18, 7)` = 18 total digits, 7 after decimal
- Example: `1000000.0000001` XLM (stroop precision)

**Critical Indexes:**
- `freelancerWallet`: 99% of queries filter by wallet (wallet-scoped data)
- `invoiceNumber`: Watcher matches payments by memo (high-frequency lookups)
- `status`: Dashboard filters by status
- Composite indexes: Reduce query time for common combined filters

**Payment Table:**
```prisma
model Payment {
  id              String   @id @default(cuid())
  invoiceId       String
  transactionHash String   @unique  // On-chain proof
  ledgerNumber    Int      // Block number
  fromWallet      String   // Payer
  toWallet        String   // Recipient (freelancer)
  amount          Decimal  @db.Decimal(18, 7)
  asset           String   // "XLM", "USDC", "EURC"
  status          PaymentStatus @default(CONFIRMED)
  confirmedAt     DateTime @default(now())

  invoice Invoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)

  @@index([invoiceId])
  @@index([transactionHash])  // Prevent duplicate payment records
}
```

**Audit Log Table:**
```prisma
model InvoiceAuditLog {
  id          String      @id @default(cuid())
  invoiceId   String
  action      AuditAction
  actorWallet String     // Who performed the action
  changes     Json?      // Snapshot: { "status": { "from": "DRAFT", "to": "PENDING" } }
  createdAt   DateTime   @default(now())

  invoice Invoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)

  @@index([invoiceId])
  @@index([createdAt])
}
```

**Purpose:**
- Complete audit trail of all state changes
- Compliance and dispute resolution
- Analytics (how long invoices stay in each status)
- Forensic analysis if issues arise

---

## On-Chain vs Off-Chain

### On-Chain Data (Stellar Blockchain)

**What's stored on-chain:**

1. **Payment Transactions**
   - **Transaction hash**: Unique identifier (SHA-256)
   - **Ledger number**: Block number (increments every 3-5 seconds)
   - **Source account**: Payer's wallet address
   - **Destination account**: Freelancer's wallet address
   - **Amount**: Payment amount (7 decimal precision)
   - **Asset**: XLM (native) or USDC/EURC (issued asset)
   - **Memo**: Invoice ID or invoice number (max 28 bytes)
   - **Timestamp**: Transaction creation time
   - **Fee**: Network fee (<$0.01)
   - **Signatures**: ed25519 signature(s) authorizing the transaction

2. **Account State**
   - **Account balances**: XLM, USDC, EURC holdings
   - **Sequence number**: Prevents transaction replay
   - **Trustlines**: Which assets the account can hold
   - **Signers**: Multi-sig configuration (if any)

**Immutability:**
- Once confirmed on Stellar ledger: **permanent and immutable**
- Cannot be deleted, modified, or reversed
- Provides cryptographic proof of payment
- Publicly verifiable on blockchain explorers

**Query Method:**
```typescript
// Via Horizon REST API
const transaction = await server
  .transactions()
  .transaction('abc123...')
  .call();

// Returns on-chain data
{
  hash: 'abc123...',
  ledger: 12345678,
  source_account: 'GPAYER...',
  created_at: '2024-01-15T10:30:00Z',
  memo: 'INV-001',
  operations: [{
    type: 'payment',
    from: 'GPAYER...',
    to: 'GFREELANCER...',
    amount: '100.0000000',
    asset_type: 'credit_alphanum4',
    asset_code: 'USDC',
    asset_issuer: 'GA5ZSE...'
  }]
}
```

---

### Off-Chain Data (PostgreSQL Database)

**What's stored off-chain:**

1. **Invoice Metadata**
   - Invoice ID (CUID)
   - Invoice number (human-readable)
   - Client name, email, company
   - Freelancer name, email, company
   - Line items (descriptions, quantities, rates)
   - Tax rates, discounts
   - Notes, payment terms
   - Status (DRAFT, PENDING, PAID, etc.)
   - Due date
   - Created/updated timestamps

2. **User Preferences**
   - Saved clients
   - Favorite clients
   - Language preference (EN/ES/PT)
   - Theme (dark/light)

3. **Audit Logs**
   - State transitions
   - Who performed each action
   - When actions occurred
   - Field-level changes

**Why Off-Chain:**
- **Privacy**: Client names, emails not public
- **Mutability**: Can edit DRAFT invoices
- **Cost**: Storing large data on-chain is expensive
- **Query Performance**: SQL queries faster than blockchain scans
- **Rich Metadata**: Invoices have complex relational data

**Data Synchronization:**
```typescript
// Off-chain invoice references on-chain transaction
{
  id: 'clx7k8q9a...',        // Off-chain ID
  invoiceNumber: 'INV-001',  // Memo on-chain
  status: 'PAID',            // Derived from on-chain confirmation
  transactionHash: 'abc123...',  // Links to on-chain tx
  ledgerNumber: 12345678,    // On-chain block number
  payerWallet: 'GPAYER...',  // From on-chain tx
  paidAt: '2024-01-15T10:30:00Z'  // From on-chain timestamp
}
```

---

### Hybrid Architecture Benefits

**Best of Both Worlds:**

| Aspect | On-Chain | Off-Chain |
|--------|----------|-----------|
| **Payment proof** | ✅ Immutable | ❌ Mutable |
| **Privacy** | ❌ Public | ✅ Private |
| **Query speed** | ❌ Slow (API) | ✅ Fast (SQL) |
| **Cost** | ❌ Network fees | ✅ Free |
| **Complex data** | ❌ Limited (28-byte memo) | ✅ Unlimited |
| **Verification** | ✅ Cryptographic | ❌ Trust required |

**Trust Model:**
- **Payment settlement**: Trustless (on-chain)
- **Invoice metadata**: Trust Link2Pay database
- **Verification**: Anyone can verify payment on-chain using transaction hash

---

## Data Flow

### Complete Payment Flow (End-to-End)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: INVOICE CREATION (Off-Chain)                                       │
└─────────────────────────────────────────────────────────────────────────────┘

[Freelancer Browser]
      │
      │ 1. Fill invoice form
      │    (client name, items, amount, currency)
      │
      ▼
[React Frontend]
      │
      │ 2. Validate form (Zod)
      │    Check: amount > 0, valid email, etc.
      │
      ▼
[POST /api/invoices]
      │
      │ 3. Authenticate request
      │    Headers: x-wallet-address, x-auth-nonce, x-auth-signature
      │
      ▼
[Express Backend - Auth Middleware]
      │
      │ 4. Verify ed25519 signature
      │    - Check nonce valid & not expired
      │    - Verify signature with wallet's public key
      │    - Consume nonce (single-use)
      │
      ▼
[Invoice Route Handler]
      │
      │ 5. Validate request body (Zod schema)
      │    - Sanitize inputs
      │    - Calculate totals (subtotal + tax - discount)
      │
      ▼
[Prisma ORM]
      │
      │ 6. Create invoice record
      │    INSERT INTO invoices (...)
      │    INSERT INTO line_items (...)
      │    INSERT INTO invoice_audit_logs (action: CREATED)
      │
      ▼
[PostgreSQL Database]
      │
      │ 7. Return invoice with ID
      │    { id: "clx7k8q9a...", invoiceNumber: "INV-001", status: "DRAFT" }
      │
      ▼
[Frontend - Invoice List]
      │
      │ 8. Display invoice in dashboard
      │    React Query auto-updates cache
      │

┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 2: SEND INVOICE (Off-Chain Status Update)                             │
└─────────────────────────────────────────────────────────────────────────────┘

[Freelancer] Click "Send Invoice" button
      │
      ▼
[POST /api/invoices/:id/send]
      │
      │ 1. Authenticate (same as above)
      │ 2. Check invoice status === DRAFT
      │ 3. Update status to PENDING
      │ 4. Log audit trail (SENT)
      │
      ▼
[Database]
      │
      │ UPDATE invoices SET status = 'PENDING' WHERE id = ...
      │ INSERT INTO invoice_audit_logs (action: SENT)
      │
      ▼
[Frontend]
      │
      │ Generate payment link: https://app.link2pay.dev/pay/clx7k8q9a...
      │ Freelancer shares link with client (email, Slack, etc.)
      │

┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 3: CLIENT PAYMENT (Hybrid: Off-Chain → On-Chain)                      │
└─────────────────────────────────────────────────────────────────────────────┘

[Client Browser] Opens payment link
      │
      ▼
[GET /api/invoices/:id] (Public endpoint, no auth)
      │
      │ Returns invoice details (excluding sensitive data)
      │ { id, amount, currency, dueDate, items, ... }
      │
      ▼
[PaymentFlow Component] Displays invoice
      │
      │ Client clicks "Pay with Freighter"
      │
      ▼
[POST /api/payments/:id/pay-intent]
      │
      │ 1. Get client's wallet address from Freighter
      │ 2. Request unsigned transaction from backend
      │
      ▼
[StellarService.buildPaymentTransaction()]
      │
      │ 3. Fetch payer's sequence number from Horizon API
      │    GET https://horizon.stellar.org/accounts/GPAYER...
      │
      │ 4. Build transaction:
      │    - Operation: payment
      │    - Destination: freelancer wallet
      │    - Amount: invoice total
      │    - Asset: USDC (or XLM/EURC)
      │    - Memo: invoice number (for matching)
      │    - Timeout: 5 minutes
      │    - Fee: 100 stroops (0.00001 XLM)
      │
      │ 5. Return unsigned XDR
      │
      ▼
[Frontend] Receives unsigned XDR
      │
      │ 6. Prompt Freighter to sign transaction
      │    await freighter.signTransaction(xdr, { network: 'TESTNET' })
      │
      ▼
[Freighter Wallet Extension]
      │
      │ 7. Show transaction details to user:
      │    - "Send 100 USDC to GFREELANCER..."
      │    - "Memo: INV-001"
      │    - "Fee: 0.00001 XLM"
      │
      │ 8. User approves → Signs with private key (ed25519)
      │    Private key NEVER leaves Freighter
      │
      │ 9. Returns signed XDR
      │
      ▼
[POST /api/payments/submit]
      │
      │ 10. Backend receives signed XDR
      │
      ▼
[StellarService.submitTransaction()]
      │
      │ 11. Parse XDR to validate network
      │     - Check network passphrase matches invoice
      │     - Throw error if network mismatch
      │
      │ 12. Submit to Stellar Horizon API
      │     POST https://horizon.stellar.org/transactions
      │     Body: signed XDR
      │
      ▼
[Stellar Network]
      │
      │ 13. Validators consensus (3-5 seconds)
      │     - Validate signatures
      │     - Check account balances
      │     - Execute payment operation
      │     - Record in ledger
      │
      │ 14. Transaction confirmed ✅
      │     - Transaction hash: abc123...
      │     - Ledger number: 12345678
      │     - Funds transferred atomically
      │
      ▼
[Horizon API Response]
      │
      │ { hash: "abc123...", ledger: 12345678, successful: true }
      │
      ▼
[Backend] Update invoice status to PROCESSING
      │
      │ UPDATE invoices SET status = 'PROCESSING' WHERE id = ...
      │
      ▼
[Frontend] Shows "Processing..." state
      │
      │ Client sees: "Payment submitted! Confirming..."
      │

┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 4: PAYMENT CONFIRMATION (On-Chain → Off-Chain)                        │
└─────────────────────────────────────────────────────────────────────────────┘

[WatcherService] (Running every 5 seconds)
      │
      │ 1. Query database for PENDING/PROCESSING invoices
      │    SELECT * FROM invoices WHERE status IN ('PENDING', 'PROCESSING')
      │
      ▼
[Database] Returns list of pending invoices
      │
      │ [
      │   { id: "clx7k8q9a...", invoiceNumber: "INV-001",
      │     freelancerWallet: "GFREELANCER...",
      │     networkPassphrase: "Public Global...",
      │     total: 100, currency: "USDC" }
      │ ]
      │
      ▼
[Watcher] Group by wallet + network
      │
      │ Map {
      │   "GFREELANCER...:Public Global..." => [invoices for this wallet/network]
      │ }
      │
      ▼
[For each wallet group]
      │
      │ 2. Query Horizon API for recent transactions
      │    GET https://horizon.stellar.org/accounts/GFREELANCER.../transactions
      │    ?limit=20&order=desc
      │
      ▼
[Horizon API] Returns recent transactions
      │
      │ [
      │   { hash: "abc123...", memo: "INV-001", successful: true, ... },
      │   { hash: "def456...", memo: "INV-002", successful: true, ... }
      │ ]
      │
      ▼
[Watcher] Match transactions by memo
      │
      │ 3. Find transaction with memo === "INV-001"
      │    Found: { hash: "abc123...", memo: "INV-001" }
      │
      │ 4. Check if already recorded
      │    SELECT * FROM payments WHERE transactionHash = 'abc123...'
      │    → Not found, proceed
      │
      │ 5. Verify transaction details (double-check)
      │    GET https://horizon.stellar.org/transactions/abc123...
      │
      ▼
[Horizon API] Returns full transaction details
      │
      │ {
      │   hash: "abc123...",
      │   ledger: 12345678,
      │   successful: true,
      │   memo: "INV-001",
      │   operations: [{
      │     type: "payment",
      │     from: "GPAYER...",
      │     to: "GFREELANCER...",
      │     amount: "100.0000000",
      │     asset_code: "USDC"
      │   }]
      │ }
      │
      ▼
[Watcher] Validate payment
      │
      │ 6. Check:
      │    ✅ Destination matches freelancer wallet
      │    ✅ Asset matches invoice currency (USDC)
      │    ✅ Amount >= invoice total (100 USDC)
      │
      │ 7. All checks passed → Mark as PAID
      │
      ▼
[Prisma Transaction (SERIALIZABLE isolation)]
      │
      │ BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
      │
      │ 8. Update invoice status
      │    UPDATE invoices SET
      │      status = 'PAID',
      │      transactionHash = 'abc123...',
      │      ledgerNumber = 12345678,
      │      payerWallet = 'GPAYER...',
      │      paidAt = '2024-01-15T10:30:00Z'
      │    WHERE id = 'clx7k8q9a...' AND status != 'PAID';  -- Prevent double-update
      │
      │ 9. Create payment record
      │    INSERT INTO payments (
      │      invoiceId, transactionHash, ledgerNumber,
      │      fromWallet, toWallet, amount, asset, status
      │    ) VALUES (...);
      │
      │ 10. Create audit log
      │     INSERT INTO invoice_audit_logs (
      │       invoiceId, action, actorWallet, changes
      │     ) VALUES ('clx7k8q9a...', 'PAID', 'GPAYER...', {...});
      │
      │ COMMIT;
      │
      ▼
[Database] Transaction committed ✅
      │
      │ Invoice now in PAID state with on-chain proof
      │
      ▼
[Frontend Dashboard] (Next polling cycle)
      │
      │ 11. React Query refetches invoices
      │     GET /api/invoices?status=PAID
      │
      │ 12. UI updates automatically
      │     ✅ "Invoice INV-001 PAID"
      │     🔗 Transaction hash: abc123...
      │     📅 Paid at: 2024-01-15 10:30 AM
      │
      ▼
[Freelancer] Sees payment confirmed!
      │
      │ Can click transaction hash to view on Stellar Expert:
      │ https://stellar.expert/explorer/public/tx/abc123...
      │
```

**Key Points:**

1. **Invoice Creation**: 100% off-chain (fast, private, editable)
2. **Payment Intent**: Hybrid (off-chain request → on-chain transaction building)
3. **Payment Submission**: On-chain (immutable, public, cryptographic proof)
4. **Payment Confirmation**: Hybrid (on-chain verification → off-chain status update)

**Timing:**
- Invoice creation: < 100ms (database insert)
- Payment intent: ~500ms (Horizon API call for sequence number)
- Stellar confirmation: 3-5 seconds (network consensus)
- Watcher detection: 0-5 seconds (poll interval)
- **Total payment time: ~5-10 seconds**

---

## Critical Business Logic

### 1. Transaction Memo Matching

**Problem:** How to link on-chain payments to off-chain invoices?

**Solution:** Stellar memo field

**Implementation:**
```typescript
// When building payment transaction
const transaction = new TransactionBuilder(account, { ... })
  .addOperation(Operation.payment({ ... }))
  .addMemo(Memo.text(invoiceNumber.substring(0, 28)))  // Max 28 bytes
  .build();

// Watcher matches by memo
const matchingInvoice = invoices.find(inv =>
  tx.memo === inv.id || tx.memo === inv.invoiceNumber
);
```

**Edge Cases:**
- **Duplicate memos**: Use CUID-based IDs (collision probability: 1 in 10^21)
- **Missing memo**: Manual confirmation required (admin panel)
- **Wrong memo**: Payment succeeds but invoice stays unpaid (manual recovery)

---

### 2. Race Condition Prevention

**Problem:** Payment might be detected twice (submit endpoint + watcher)

**Solution:** SERIALIZABLE transaction isolation + unique constraint

**Implementation:**
```typescript
// In watcher
await prisma.$transaction(async (tx) => {
  // Update invoice (will fail if already PAID due to WHERE clause)
  await tx.invoice.update({
    where: { id: invoiceId },
    data: { status: 'PAID', ... }
  });

  // Create payment record (will fail if transactionHash already exists)
  await tx.payment.create({
    data: {
      transactionHash: 'abc123...',  // UNIQUE constraint
      ...
    }
  });
}, {
  isolationLevel: 'Serializable'  // Prevents phantom reads
});
```

**Why SERIALIZABLE:**
- Prevents two concurrent transactions from both updating the same invoice
- Database throws error if concurrent modification detected
- Ensures exactly-once payment recording

---

### 3. Network Mismatch Prevention

**Problem:** User might sign transaction on wrong network (testnet vs mainnet)

**Solution:** Force parse XDR with expected network passphrase

**Implementation:**
```typescript
async submitTransaction(signedXdr: string, expectedNetworkPassphrase: string) {
  let transaction;

  try {
    // Parse XDR with invoice's expected network passphrase
    transaction = TransactionBuilder.fromXDR(
      signedXdr,
      expectedNetworkPassphrase  // Will throw if signed with wrong network
    );
  } catch (parseError) {
    // Determine which network user is on
    const expectedName = expectedNetworkPassphrase.includes('Test')
      ? 'TESTNET'
      : 'MAINNET';
    const wrongName = expectedName === 'TESTNET' ? 'MAINNET' : 'TESTNET';

    throw new Error(
      `Network mismatch: This invoice requires ${expectedName} but ` +
      `your Freighter wallet signed with ${wrongName}. Please switch ` +
      `Freighter to ${expectedName}, disconnect and reconnect, then try again.`
    );
  }

  // Submit to correct Horizon endpoint
  const server = getServerForNetwork(expectedNetworkPassphrase);
  return await server.submitTransaction(transaction);
}
```

**Why Important:**
- Testnet and mainnet use different network passphrases
- Transactions signed with wrong passphrase are invalid
- Prevents accidental mainnet submission of testnet transactions (and vice versa)

---

### 4. Amount Validation

**Problem:** Client could tamper with payment amount in frontend

**Solution:** Server-side validation - NEVER trust client

**Implementation:**
```typescript
// ❌ WRONG - Don't trust client-provided amount
POST /payments/submit
{
  invoiceId: "clx7k8q9a...",
  amount: 0.01  // ← Client tampered this!
}

// ✅ CORRECT - Always read amount from database
async submitPayment(invoiceId: string, signedXdr: string) {
  // 1. Fetch invoice from database (source of truth)
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId }
  });

  // 2. Parse signed transaction
  const tx = TransactionBuilder.fromXDR(signedXdr, invoice.networkPassphrase);

  // 3. Extract payment operation
  const paymentOp = tx.operations.find(op => op.type === 'payment');

  // 4. Validate amount matches database
  if (parseFloat(paymentOp.amount) < parseFloat(invoice.total)) {
    throw new Error('INSUFFICIENT_PAYMENT_AMOUNT');
  }

  // 5. Validate destination matches freelancer wallet
  if (paymentOp.destination !== invoice.freelancerWallet) {
    throw new Error('INVALID_RECIPIENT');
  }

  // 6. Submit (already signed, validated)
  return await server.submitTransaction(tx);
}
```

**Security Properties:**
- Amount comes from database (immutable once sent)
- Client cannot reduce payment
- Destination verified server-side
- Even if client modifies frontend code, server rejects

---

### 5. Nonce Expiration & Cleanup

**Problem:** Nonces accumulate in memory, causing memory leak

**Solution:** Auto-cleanup expired nonces

**Implementation:**
```typescript
class AuthService {
  private nonces = new Map<string, { walletAddress: string; expiresAt: number }>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired nonces every 1 minute
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredNonces();
    }, 60 * 1000);
  }

  private cleanupExpiredNonces() {
    const now = Date.now();
    let removed = 0;

    for (const [nonce, data] of this.nonces.entries()) {
      if (data.expiresAt < now) {
        this.nonces.delete(nonce);
        removed++;
      }
    }

    if (removed > 0) {
      log.debug(`Cleaned up ${removed} expired nonces`);
    }
  }
}
```

**Alternative:** Store nonces in Redis with TTL (for multi-instance deployment)

---

## External Dependencies

### 1. Stellar Horizon API

**Provider:** Stellar Development Foundation
**Purpose:** Query blockchain data, submit transactions
**Endpoints Used:**

| Endpoint | Purpose | Frequency |
|----------|---------|-----------|
| `GET /accounts/{id}` | Load account data (balance, sequence number) | Per payment intent |
| `POST /transactions` | Submit signed transaction | Per payment |
| `GET /transactions/{hash}` | Verify transaction details | Per watcher confirmation |
| `GET /accounts/{id}/transactions` | Get recent transactions | Every 5 seconds (watcher) |
| `GET /accounts/{id}/payments` | Stream payment events | Future SSE alternative |

**Rate Limits:**
- **Testnet**: ~100 req/s (soft limit)
- **Mainnet**: ~100 req/s (enforced)
- **Strategy**: Exponential backoff on 429/503 responses

**Reliability:**
- **Uptime**: 99.9% (SDF SLA)
- **Fallback**: Retry with backoff (3 attempts)
- **Error Handling**: Specific error codes (tx_bad_seq, tx_insufficient_balance, etc.)

---

### 2. Freighter Wallet

**Provider:** Stellar community (maintained by SDF)
**Purpose:** Client-side transaction signing, wallet connection
**Integration Method:** Browser extension API

**API Methods Used:**
```typescript
// Check if Freighter is installed
await freighter.isConnected();

// Get user's wallet address
const address = await freighter.getPublicKey();

// Get current network
const network = await freighter.getNetwork();

// Sign transaction (XDR)
const signedXdr = await freighter.signTransaction(xdr, {
  network: 'TESTNET',
  networkPassphrase: 'Test SDF Network ; September 2015'
});

// Sign arbitrary message (for authentication)
const signature = await freighter.signMessage(message);
```

**Security Model:**
- Private keys stored in browser extension (isolated storage)
- User approval required for every signature
- Transaction details shown before signing
- Cannot extract private keys programmatically

**Limitations:**
- Browser-only (no mobile support via extension)
- Requires user to have Freighter installed
- Network switching requires page refresh

---

### 3. CoinGecko API

**Provider:** CoinGecko
**Purpose:** XLM/USD price feed
**Endpoint:** `GET /api/v3/simple/price?ids=stellar&vs_currencies=usd`

**Usage:**
```typescript
// GET /api/prices/xlm
async getXlmPrice(): Promise<{ xlm_usd: number }> {
  const response = await fetch(
    'https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd'
  );
  const data = await response.json();
  return { xlm_usd: data.stellar.usd };
}
```

**Rate Limiting:**
- **Free tier**: 10-50 calls/minute
- **Implementation**: Server-side caching (30 req/60s via express-rate-limit)

**Fallback:**
- Cache last known price (30-minute TTL)
- Show "Price unavailable" if API down

---

### 4. Circle USDC/EURC Issuers

**Provider:** Circle (regulated stablecoin issuer)
**Purpose:** USDC and EURC asset issuance
**Trust:** Users must add trustlines to Circle's issuer addresses

**Mainnet Issuers:**
```typescript
const MAINNET_ASSETS = {
  USDC: {
    code: 'USDC',
    issuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
    name: 'USD Coin',
    decimals: 7,
    toml: 'https://centre.io/.well-known/stellar.toml'
  },
  EURC: {
    code: 'EURC',
    issuer: 'GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP2',
    name: 'Euro Coin',
    decimals: 7,
    toml: 'https://centre.io/.well-known/stellar.toml'
  }
};
```

**Trustline Requirement:**
```typescript
// User must add trustline before receiving USDC/EURC
const asset = new Asset('USDC', 'GA5ZSE...');
const changeTrustOp = Operation.changeTrust({ asset });

// Costs 0.5 XLM base reserve (refundable when removed)
```

**Reliability:**
- Circle is a regulated financial institution
- USDC backed 1:1 with USD reserves
- Monthly attestation reports
- 24/7 redemption available

---

## Technical Decisions

### Why Stellar Over Ethereum?

| Criteria | Stellar | Ethereum |
|----------|---------|----------|
| **Transaction fees** | < $0.01 | $5-50 (gas fees) |
| **Finality time** | 3-5 seconds | 12-60 seconds |
| **Built-in DEX** | ✅ Yes | ❌ Requires Uniswap |
| **Multi-asset support** | ✅ Native | ❌ Requires ERC-20 |
| **Energy consumption** | ✅ Low (Stellar Consensus) | ⚠️ Higher (Proof of Stake) |
| **Ecosystem maturity** | ⚠️ Smaller | ✅ Larger |

**Decision:** Stellar wins for payment use case due to speed and cost.

---

### Why Zustand Over Redux?

**Redux:**
```typescript
// 50+ lines of boilerplate
const INCREMENT = 'INCREMENT';
const incrementAction = () => ({ type: INCREMENT });
const counterReducer = (state = 0, action) => {
  switch (action.type) {
    case INCREMENT: return state + 1;
    default: return state;
  }
};
const store = createStore(counterReducer);
```

**Zustand:**
```typescript
// 5 lines, same functionality
const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 }))
}));
```

**Decision:** Zustand is 90% less code for our use case.

---

### Why Prisma Over Raw SQL?

**Raw SQL Issues:**
- Manual type definitions
- SQL injection risk if not careful
- No migration management
- Difficult refactoring

**Prisma Benefits:**
- Auto-generated TypeScript types
- Type-safe queries (compile-time errors)
- Built-in migration tool
- Easy refactoring (rename columns, IDE updates all queries)

**Example:**
```typescript
// Prisma - Type-safe
const invoice = await prisma.invoice.findUnique({
  where: { id: 'abc' },
  include: { lineItems: true }  // Auto-complete, type-checked
});
// invoice.lineItems is typed as LineItem[]

// Raw SQL - No type safety
const result = await db.query('SELECT * FROM invoices WHERE id = $1', ['abc']);
// result.rows[0] is typed as 'any'
```

---

### Why PostgreSQL Over MongoDB?

**Invoice Data is Relational:**
```
Invoice
  ├── LineItem 1
  ├── LineItem 2
  ├── Payment 1
  ├── Payment 2
  └── AuditLog 1-N
```

**PostgreSQL Strengths:**
- ACID transactions (critical for payments)
- SERIALIZABLE isolation (prevents double-payment)
- Foreign keys enforce referential integrity
- JSON columns for flexible data (audit logs)
- Mature ecosystem, proven at scale

**MongoDB Weaknesses for This Use Case:**
- No ACID transactions across documents (before v4)
- Weaker consistency guarantees
- No foreign keys (application-level enforcement)

---

### Why VitePress Over Other Doc Frameworks?

| Framework | Build Time | Hot Reload | Bundle Size | Markdown |
|-----------|-----------|------------|-------------|----------|
| **VitePress** | ⚡ Fast | ⚡ Instant | 📦 Small | ✅ Full |
| Docusaurus | 🐌 Slow | ⚠️ ~5s | 📦 Large | ✅ Full |
| GitBook | ☁️ SaaS | N/A | N/A | ✅ Full |
| Nextra | ⚡ Fast | ⚡ Instant | 📦 Medium | ✅ Full |

**Decision:** VitePress is fastest and most lightweight for our needs.

---

## Next Steps

### Related Documentation

- [Security Architecture](/guide/advanced/security) - Defense-in-depth security model
- [Database Schema](/guide/advanced/database) - Complete database documentation
- [Payment Watcher](/guide/advanced/watcher) - Watcher service deep dive
- [API Reference](/api/overview) - REST API documentation

### Further Reading

- [Stellar Developer Docs](https://developers.stellar.org)
- [Freighter Wallet API](https://docs.freighter.app)
- [Prisma Documentation](https://www.prisma.io/docs)
- [React Query Guide](https://tanstack.com/query/latest/docs/react/overview)
