# Architecture

Technical overview of Link2Pay's system architecture and components.

## System Components

### Frontend Application (React + Vite)

Modern single-page application providing:

- **Invoice Management**: Create, edit, send, and track invoices
- **Payment Interface**: Public payment pages for clients
- **Wallet Integration**: Freighter wallet connection and transaction signing
- **Real-Time Updates**: Live invoice status polling and notifications
- **Multi-Language**: English, Spanish, Portuguese support
- **Network Detection**: Automatic testnet/mainnet identification

**Technology Stack:**
- React 18 with TypeScript
- Vite (build tool)
- TailwindCSS (styling)
- Zustand (state management)
- React Query (data fetching & caching)
- React Router (navigation)

**Deployment:** Vercel (edge network, automatic HTTPS, CDN)

### Backend API (Express.js)

RESTful API providing core business logic:

- **Authentication**: Nonce-based ed25519 signature verification
- **Invoice Operations**: CRUD operations with wallet-scoped access
- **Payment Processing**: XDR transaction building and submission
- **Stellar Integration**: Horizon API communication, account validation
- **Watcher Service**: Real-time payment monitoring and confirmation
- **Rate Limiting**: Per-IP and per-wallet request throttling
- **Audit Logging**: Complete state transition tracking

**Technology Stack:**
- Node.js + Express
- TypeScript
- Prisma ORM
- Zod validation
- Winston logging
- Helmet.js security

**Deployment:** Render (managed Node.js hosting, auto-scaling)

### Database (PostgreSQL)

Relational database storing:

- **Invoices**: Invoice metadata, status, amounts, network info
- **LineItems**: Individual invoice line items
- **Payments**: Confirmed on-chain payment records
- **Clients**: Saved client book (reusable client information)
- **AuditLogs**: Complete audit trail of all state changes

**Schema Design:**
- CUID for non-sequential IDs (IDOR prevention)
- Composite indexes for common query patterns
- SERIALIZABLE isolation for payment operations (race condition prevention)
- Soft deletes preserve audit trail

**Deployment:** Render PostgreSQL or Supabase (managed PostgreSQL)

### Stellar Network Integration

Link2Pay interfaces with Stellar blockchain through:

#### Horizon API
REST API for blockchain interaction:
- Account balance queries
- Transaction submission
- Payment stream monitoring
- Asset information lookup

**Endpoints:**
- **Testnet**: `https://horizon-testnet.stellar.org`
- **Mainnet**: `https://horizon.stellar.org`

#### Stellar SDK
JavaScript SDK for:
- Building XDR transactions
- Signing operations (client-side only)
- Account management
- Asset handling (XLM, USDC, EURC)

#### Freighter Wallet
Browser extension providing:
- Private key storage and management
- Transaction signing (client-side)
- Network detection and validation
- Account authentication

### Watcher Service

Background service for real-time payment detection:

**Functionality:**
- Polls Horizon API every 5 seconds
- Monitors payments to all active invoice wallet addresses
- Matches transactions by memo field (invoice number)
- Validates payment amount and asset type
- Updates invoice status to PAID upon confirmation
- Creates Payment record with transaction hash

**Architecture:**
- In-process service (runs alongside Express server)
- Handles both testnet and mainnet simultaneously
- Exponential backoff on API errors
- Automatic recovery from connection failures

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Browser                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  React SPA (Vercel)                                     │ │
│  │  - Invoice Management UI                               │ │
│  │  - Payment Flow UI                                     │ │
│  │  - Dashboard & Analytics                               │ │
│  │  - Wallet Connection                                   │ │
│  └─────────────────┬──────────────────────────────────────┘ │
│  ┌─────────────────▼──────────────────────────────────────┐ │
│  │  Freighter Wallet Extension                            │ │
│  │  - Signs XDR transactions (client-side)                │ │
│  │  - Signs authentication nonces (ed25519)               │ │
│  │  - Private keys NEVER leave device                     │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────┬───────────────────────────────────┘
                          │
                   HTTPS REST API
        (nonce + ed25519 signature headers)
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend API (Render)                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Express.js Server                                      │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  Middleware Layer                                 │  │ │
│  │  │  - Helmet (CSP, HSTS, security headers)          │  │ │
│  │  │  - CORS (restricted origins)                     │  │ │
│  │  │  - Rate Limiters (global + per-endpoint)         │  │ │
│  │  │  - Zod Validation (all request bodies)           │  │ │
│  │  │  - requireWallet (cryptographic auth guard)      │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  Route Handlers                                   │  │ │
│  │  │  - /auth/* (nonce issuance)                      │  │ │
│  │  │  - /invoices/* (CRUD, send, stats)               │  │ │
│  │  │  - /payments/* (pay-intent, submit, confirm)     │  │ │
│  │  │  - /links/* (payment link API)                   │  │ │
│  │  │  - /clients/* (client book)                      │  │ │
│  │  │  - /prices/* (XLM/USD price feed)                │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  Service Layer                                    │  │ │
│  │  │  - AuthService (nonce + signature verification)  │  │ │
│  │  │  - StellarService (XDR building, Horizon calls)  │  │ │
│  │  │  - InvoiceService (business logic, validation)   │  │ │
│  │  │  - WatcherService (payment monitoring)           │  │ │
│  │  │  - ClientService (client management)             │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────┬─────────────────────────┬────────────────────────┘
           │                         │
           │ Prisma ORM              │ Stellar SDK
           │                         │ (build XDR, submit tx)
           ▼                         ▼
┌──────────────────────┐   ┌───────────────────────────────┐
│  PostgreSQL Database │   │  Stellar Network              │
│  (Render/Supabase)   │   │                               │
│                      │   │  ┌─────────────────────────┐  │
│  Tables:             │   │  │  Horizon API            │  │
│  - Invoice           │◄──┼──│  - Stream payments      │  │
│  - LineItem          │   │  │  - Query accounts       │  │
│  - Payment           │   │  │  - Submit transactions  │  │
│  - Client            │   │  └─────────────────────────┘  │
│  - InvoiceAuditLog   │   │                               │
│                      │   │  ┌─────────────────────────┐  │
│  Indexes:            │   │  │  Stellar Ledger         │  │
│  - freelancerWallet  │   │  │  - Immutable txs        │  │
│  - invoiceNumber     │   │  │  - Account balances     │  │
│  - status            │   │  │  - Asset issuance       │  │
└──────────────────────┘   └───────────────────────────────┘
```

## Authentication Model

Link2Pay uses **passwordless cryptographic authentication** via ed25519 signatures.

### Nonce-Based Challenge-Response

```
┌─────────┐                  ┌─────────┐                  ┌──────────┐
│ Browser │                  │ Backend │                  │ Freighter│
└────┬────┘                  └────┬────┘                  └────┬─────┘
     │                            │                             │
     │ 1. Request nonce           │                             │
     │───────────────────────────>│                             │
     │                            │ 2. Generate nonce (5min TTL)│
     │                            │    Store in memory          │
     │                            │                             │
     │<───────────────────────────│                             │
     │ { nonce, message }         │                             │
     │                            │                             │
     │ 3. Sign message with wallet│                             │
     │────────────────────────────────────────────────────────>│
     │                            │                             │
     │<────────────────────────────────────────────────────────│
     │ ed25519 signature (hex)    │                             │
     │                            │                             │
     │ 4. Authenticated API call  │                             │
     │    Headers:                │                             │
     │    - x-wallet-address      │                             │
     │    - x-auth-nonce          │                             │
     │    - x-auth-signature      │                             │
     │───────────────────────────>│                             │
     │                            │ 5. Verify signature:        │
     │                            │    - Check nonce valid      │
     │                            │    - Verify ed25519 sig     │
     │                            │    - Consume nonce (1-use)  │
     │                            │                             │
     │<───────────────────────────│                             │
     │ 200 OK + response data     │                             │
     │                            │                             │
```

**Security Properties:**
- Nonces are single-use (consumed after verification)
- 5-minute TTL prevents replay attacks
- ed25519 signature proves wallet ownership
- No password storage or management required
- Private keys never transmitted over network

**Bearer Session Alternative:**
After initial nonce verification, server can issue 30-minute bearer tokens to reduce re-signing frequency for better UX.

## Payment Flow

Complete end-to-end payment lifecycle:

```
┌───────────┐  ┌─────────┐  ┌─────────┐  ┌────────┐  ┌─────────┐  ┌────────┐
│Freelancer │  │Frontend │  │ Backend │  │Horizon │  │ Watcher │  │ Ledger │
└─────┬─────┘  └────┬────┘  └────┬────┘  └───┬────┘  └────┬────┘  └───┬────┘
      │             │              │           │            │           │
      │ Create      │              │           │            │           │
      │ invoice     │              │           │            │           │
      │────────────>│              │           │            │           │
      │             │ POST /invoices           │            │           │
      │             │─────────────>│           │            │           │
      │             │              │ Save to DB│            │           │
      │             │<─────────────│           │            │           │
      │             │ Invoice DRAFT│           │            │           │
      │<────────────│              │           │            │           │
      │             │              │           │            │           │
      │ Send to     │              │           │            │           │
      │ client      │              │           │            │           │
      │────────────>│ POST /invoices/:id/send  │            │           │
      │             │─────────────>│           │            │           │
      │             │<─────────────│           │            │           │
      │             │ PENDING      │           │            │           │
      │<────────────│              │           │            │           │
      │             │              │           │            │           │
      │ Share payment link to client           │            │           │
      │═══════════════════════════════════════════════════════════════>│
      │                            │           │            │           │
      │             ┌──────────────────────────┐            │           │
      │             │ Client opens /pay/:id    │            │           │
      │             │ Connects Freighter       │            │           │
      │             └──────────────────────────┘            │           │
      │             │              │           │            │           │
      │             │ POST /payments/:id/pay-intent         │           │
      │             │─────────────>│           │            │           │
      │             │              │ Fetch seq │            │           │
      │             │              │──────────>│            │           │
      │             │              │<──────────│            │           │
      │             │              │ Build XDR │            │           │
      │             │<─────────────│           │            │           │
      │             │ Unsigned XDR │           │            │           │
      │             │              │           │            │           │
      │             │ Sign in Freighter         │            │           │
      │             │              │           │            │           │
      │             │ POST /payments/submit     │            │           │
      │             │ (signed XDR) │           │            │           │
      │             │─────────────>│           │            │           │
      │             │              │ Submit tx │            │           │
      │             │              │──────────>│            │           │
      │             │              │           │ Execute on │           │
      │             │              │           │ network    │           │
      │             │              │           │───────────>│           │
      │             │              │           │<───────────│           │
      │             │              │<──────────│            │           │
      │             │<─────────────│ tx hash   │            │           │
      │             │              │           │            │           │
      │             │              │           │ Poll every │           │
      │             │              │           │ 5 seconds  │           │
      │             │              │           │<───────────│           │
      │             │              │           │ Payment    │           │
      │             │              │           │ found!     │           │
      │             │              │           │───────────>│           │
      │             │              │<────────────────────────│           │
      │             │              │ markAsPaid()            │           │
      │             │              │ (SERIALIZABLE tx)       │           │
      │             │              │                         │           │
      │<────────────────────────────────────────────────────────────────│
      │ Dashboard shows PAID with transaction hash                      │
      │                            │           │            │           │
```

**Key Steps:**

1. **Invoice Creation**: Freelancer creates invoice (DRAFT status)
2. **Send Invoice**: Mark as PENDING, activate payment link
3. **Payment Intent**: Client requests unsigned transaction (XDR)
4. **Client Signing**: Freighter signs XDR with private key (client-side)
5. **Submit Transaction**: Backend submits signed XDR to Horizon
6. **Blockchain Settlement**: Stellar network confirms in 3-5 seconds
7. **Watcher Detection**: Background service detects payment
8. **Status Update**: Invoice marked PAID, Payment record created

## Network Support

Link2Pay automatically handles both Stellar networks:

### Testnet Configuration

**Purpose:** Development, testing, and experimentation with free tokens

**Endpoints:**
- Horizon API: `https://horizon-testnet.stellar.org`
- Network Passphrase: `Test SDF Network ; September 2015`
- Stellar Expert: `https://stellar.expert/explorer/testnet`

**Asset Issuers (Testnet):**
- USDC: `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`
- EURC: (custom testnet issuer)

### Mainnet Configuration

**Purpose:** Production transactions with real value

**Endpoints:**
- Horizon API: `https://horizon.stellar.org`
- Network Passphrase: `Public Global Stellar Network ; September 2015`
- Stellar Expert: `https://stellar.expert/explorer/public`

**Asset Issuers (Mainnet):**
- USDC: `GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN` (Circle)
- EURC: `GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP2` (Circle)

### Multi-Network Architecture

Link2Pay supports both networks **simultaneously** without restart:

**Database Storage:**
- Each invoice stores `networkPassphrase` field
- Payment watcher monitors both networks concurrently
- Stellar Expert links auto-detect invoice network

**Network Detection:**
```typescript
// Backend auto-detects and handles both networks
const network = invoice.networkPassphrase === Networks.PUBLIC
  ? 'mainnet'
  : 'testnet';

// Frontend validates Freighter matches invoice network
const freighterNetwork = await getFreighterNetwork();
if (freighterNetwork !== invoiceNetwork) {
  throw new Error('Network mismatch - switch Freighter network');
}
```

**Environment Variables:**
- `STELLAR_NETWORK`: Default network (`public` or `testnet`)
- `HORIZON_URL`: Default Horizon endpoint
- `NETWORK_PASSPHRASE`: Default network passphrase

Backend dynamically switches context based on invoice's stored network.

## Security Architecture

### Defense in Depth

Link2Pay implements multiple security layers:

**Layer 1: Network Security**
- HTTPS enforced (TLS 1.3)
- Helmet.js security headers (CSP, HSTS, X-Frame-Options)
- CORS restricted to known frontend origins
- Rate limiting (global + per-endpoint)

**Layer 2: Application Security**
- Zod validation on all request bodies
- Parameterized queries (Prisma ORM - SQL injection prevention)
- Non-sequential IDs (CUID) - IDOR prevention
- Input sanitization and output encoding

**Layer 3: Authentication & Authorization**
- Cryptographic authentication (ed25519 signatures)
- Single-use nonces with 5-minute TTL
- Wallet-scoped data access (all queries filter by walletAddress)
- No legacy password-based auth

**Layer 4: Business Logic Security**
- Server-side amount validation (never trust client)
- SERIALIZABLE transaction isolation (double-payment prevention)
- XDR timeout enforcement (5-minute max)
- Memo field binding (payment matching)

**Layer 5: Audit & Monitoring**
- Complete audit log of all state transitions
- Winston logging with log levels
- Transaction hash proof for all payments
- Soft deletes preserve audit trail

### Threat Model

Link2Pay has been analyzed using the [STRIDE framework](https://github.com/Link2Pay/link2pay-app/blob/main/SECURITY.md):

| Threat | Mitigation |
|--------|------------|
| **Spoofing** | ed25519 signature verification |
| **Tampering** | Blockchain immutability + server-side validation |
| **Repudiation** | Audit logs + on-chain transaction records |
| **Information Disclosure** | Public/owner invoice views, minimal data collection |
| **Denial of Service** | Rate limiting + caching |
| **Elevation of Privilege** | Wallet-scoped queries, no role escalation |

## Scalability Considerations

### Current Architecture

- **Frontend**: Statically deployed on Vercel edge network (global CDN)
- **Backend**: Single Render instance (vertical scaling)
- **Database**: Managed PostgreSQL (connection pooling via Prisma)
- **Watcher**: In-process service (scales with backend)

### Scaling Path

**Phase 1 (< 1,000 invoices/day):**
- Current architecture sufficient
- Render auto-scaling handles load spikes
- Database connection pooling optimizes DB access

**Phase 2 (1,000-10,000 invoices/day):**
- Separate watcher into dedicated service
- Add Redis for nonce storage (currently in-memory)
- Implement caching layer for read-heavy endpoints
- Read replicas for database

**Phase 3 (10,000+ invoices/day):**
- Horizontal backend scaling (load balancer)
- Separate watcher fleet per network
- Webhook delivery service
- CDN caching for public invoice views

## Deployment Architecture

### Development Environment

```
┌─────────────────────────────────────┐
│  Developer Machine                  │
│                                     │
│  Frontend: localhost:4173 (Vite)    │
│  Backend:  localhost:3001 (tsx)     │
│  Database: localhost:5433 (Docker)  │
│  Network:  Stellar Testnet          │
└─────────────────────────────────────┘
```

### Production Environment

```
┌──────────────────────────────────────────────────────┐
│  Vercel (Frontend)                                   │
│  - Edge CDN (global)                                 │
│  - Automatic HTTPS                                   │
│  - Environment: VITE_API_URL, VITE_STELLAR_NETWORK   │
└───────────────────┬──────────────────────────────────┘
                    │ HTTPS
                    ▼
┌──────────────────────────────────────────────────────┐
│  Render (Backend)                                    │
│  - Node.js 18+ runtime                               │
│  - Auto-deploy from GitHub                           │
│  - Environment: DATABASE_URL, HORIZON_URL, etc.      │
│  - Health checks: GET /health                        │
└───────────────────┬──────────────────────────────────┘
                    │ Prisma
                    ▼
┌──────────────────────────────────────────────────────┐
│  Render PostgreSQL / Supabase                        │
│  - PostgreSQL 16                                     │
│  - Automated backups                                 │
│  - Connection pooling                                │
└──────────────────────────────────────────────────────┘
```

## API Versioning

Current version: **v1** (implicit)

Future versioning strategy:
- URL-based versioning: `/api/v2/invoices`
- Maintain v1 for backward compatibility
- Deprecation notices 6 months before sunset

## Monitoring & Observability

### Planned Observability Stack

**Application Monitoring:**
- Sentry for error tracking and performance monitoring
- Custom dashboard for key metrics

**Infrastructure Monitoring:**
- Render built-in metrics (CPU, memory, response time)
- Database query performance tracking

**Blockchain Monitoring:**
- Watcher service health checks
- Payment detection latency tracking
- Horizon API response time monitoring

**Key Metrics:**
- Invoice creation rate
- Payment success rate
- Average payment time (intent → confirmation)
- Watcher polling latency
- API response times (p50, p95, p99)

## Technology Decisions

### Why Stellar?

- Fast finality (3-5 seconds)
- Low fees (< $0.01 per transaction)
- Built-in DEX for multi-asset support
- Mature ecosystem and tooling
- Energy-efficient consensus (no mining)

### Why PostgreSQL over NoSQL?

- Invoices have relational data (line items, payments)
- ACID transactions critical for payment operations
- Strong consistency requirements
- Complex queries (dashboard stats, filtering)
- Mature tooling and operations knowledge

### Why Freighter Wallet?

- Most popular Stellar wallet extension
- Active development and community
- SEP-7 support (deep linking)
- Network switching capability
- Open-source and auditable

### Why Prisma ORM?

- Type-safe database access
- Automatic migrations
- Excellent TypeScript support
- Connection pooling built-in
- SQL injection prevention

---

**Next Steps:**
- [Database Schema Details](/guide/advanced/database)
- [Security Model Deep Dive](/guide/advanced/security)
- [Payment Watcher Implementation](/guide/advanced/watcher)
