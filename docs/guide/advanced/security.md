# Security Model

Link2Pay implements a comprehensive security model designed to protect merchants, customers, and the payment infrastructure from common threats while maintaining the decentralized and trustless properties of the Stellar network.

## Overview

Link2Pay's security architecture is built on multiple layers of defense:

```mermaid
graph TD
    A[Client Security] --> B[Transport Security]
    B --> C[Authentication Security]
    C --> D[Authorization Security]
    D --> E[Data Security]
    E --> F[Payment Security]
    F --> G[Network Security]

    style A fill:#e1f5ff
    style B fill:#e1f5ff
    style C fill:#fff4e1
    style D fill:#fff4e1
    style E fill:#ffe1f5
    style F fill:#ffe1f5
    style G fill:#e1ffe1
```

### Security Principles

1. **Defense in Depth**: Multiple security layers prevent single points of failure
2. **Least Privilege**: Components and users have minimal required permissions
3. **Zero Trust**: All requests are authenticated and validated
4. **Cryptographic Verification**: All signatures and payments are cryptographically verified
5. **Transparency**: Security model is documented and auditable

## Threat Model

### Assets to Protect

**Primary Assets:**
- Merchant funds and wallet keys
- Customer payment information
- API credentials and session tokens
- Invoice and payment data
- Webhook endpoints and secrets

**Secondary Assets:**
- User session data
- Transaction metadata
- Analytics and metrics
- System availability

### Threat Actors

**External Attackers:**
- Attempting to steal funds
- Trying to compromise accounts
- Performing DoS attacks
- Intercepting payment data

**Malicious Merchants:**
- Creating fraudulent invoices
- Manipulating payment amounts
- Phishing customers

**Compromised Customers:**
- Stolen wallet credentials
- Malware on client device
- Man-in-the-middle attacks

### Attack Vectors

1. **Network Attacks**
   - Man-in-the-middle (MITM)
   - DNS spoofing
   - SSL stripping
   - DDoS attacks

2. **Application Attacks**
   - SQL injection
   - XSS (Cross-Site Scripting)
   - CSRF (Cross-Site Request Forgery)
   - Session hijacking
   - API abuse

3. **Cryptographic Attacks**
   - Signature forgery
   - Replay attacks
   - Nonce reuse
   - Key extraction

4. **Social Engineering**
   - Phishing
   - Invoice fraud
   - Support impersonation

## Authentication Security

### Wallet-Based Authentication

Link2Pay uses cryptographic signatures for passwordless authentication:

```typescript
// Authentication flow with security measures
async function authenticate(walletAddress: string) {
  // 1. Nonce generation with expiry
  const nonce = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  await redis.setex(
    `nonce:${nonce}`,
    300, // 5 minutes TTL
    JSON.stringify({ walletAddress, expiresAt })
  );

  // 2. Build message with timestamp
  const timestamp = Date.now();
  const message = `Link2Pay Authentication\n` +
    `Wallet: ${walletAddress}\n` +
    `Nonce: ${nonce}\n` +
    `Timestamp: ${timestamp}\n` +
    `This signature will not be used for any transactions.`;

  return { nonce, message, expiresAt };
}

async function verifyAuthentication(
  walletAddress: string,
  nonce: string,
  signature: string
) {
  // 1. Verify nonce hasn't been used
  const nonceData = await redis.get(`nonce:${nonce}`);
  if (!nonceData) {
    throw new Error('Invalid or expired nonce');
  }

  const { walletAddress: storedAddress, expiresAt } = JSON.parse(nonceData);

  // 2. Verify nonce belongs to this wallet
  if (storedAddress !== walletAddress) {
    throw new Error('Nonce does not match wallet');
  }

  // 3. Verify nonce hasn't expired
  if (Date.now() > expiresAt) {
    throw new Error('Nonce has expired');
  }

  // 4. Verify signature
  const keypair = Keypair.fromPublicKey(walletAddress);
  const message = buildMessage(walletAddress, nonce);
  const isValid = keypair.verify(
    Buffer.from(message, 'utf-8'),
    Buffer.from(signature, 'hex')
  );

  if (!isValid) {
    throw new Error('Invalid signature');
  }

  // 5. Invalidate nonce (one-time use)
  await redis.del(`nonce:${nonce}`);

  // 6. Issue session token
  const token = jwt.sign(
    {
      walletAddress,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour
    },
    JWT_SECRET,
    { algorithm: 'HS256' }
  );

  return { token };
}
```

### Security Features

**Nonce Management:**
- Cryptographically random (32 bytes)
- Single-use only
- Time-limited (5 minutes)
- Stored in Redis with TTL
- Wallet-bound

**Session Tokens:**
- JWT with HMAC-SHA256
- 1-hour expiration
- Includes issued-at timestamp
- Refresh token rotation
- Secure storage requirements

**Rate Limiting:**
```typescript
// Rate limiting configuration
const rateLimits = {
  nonce: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 nonce requests per window
    message: 'Too many authentication attempts'
  },
  verify: {
    windowMs: 15 * 60 * 1000,
    max: 20, // 20 verification attempts per window
    message: 'Too many verification attempts'
  },
  login: {
    windowMs: 15 * 60 * 1000,
    max: 5, // 5 failed logins per window
    skipSuccessfulRequests: true
  }
};

// Implementation with express-rate-limit
app.post('/auth/nonce',
  rateLimit(rateLimits.nonce),
  nonceController
);

app.post('/auth/verify',
  rateLimit(rateLimits.verify),
  verifyController
);
```

## Payment Security

### Payment Verification

Every payment is cryptographically verified on the Stellar network:

```typescript
// Comprehensive payment verification
async function verifyPayment(
  transactionHash: string,
  invoice: Invoice
): Promise<PaymentVerificationResult> {
  try {
    // 1. Fetch transaction from Stellar network
    const transaction = await server
      .transactions()
      .transaction(transactionHash)
      .call();

    // 2. Verify transaction succeeded
    if (!transaction.successful) {
      return {
        valid: false,
        error: 'TRANSACTION_FAILED',
        details: 'Transaction was not successful on Stellar network'
      };
    }

    // 3. Load and verify operations
    const operations = await transaction.operations();
    const paymentOp = operations.records.find(
      op => op.type === 'payment'
    );

    if (!paymentOp) {
      return {
        valid: false,
        error: 'NO_PAYMENT_OPERATION',
        details: 'Transaction does not contain a payment operation'
      };
    }

    // 4. Verify recipient matches merchant
    if (paymentOp.to !== invoice.merchantAddress) {
      return {
        valid: false,
        error: 'RECIPIENT_MISMATCH',
        expected: invoice.merchantAddress,
        actual: paymentOp.to
      };
    }

    // 5. Verify amount matches invoice
    const actualAmount = new BigNumber(paymentOp.amount);
    const expectedAmount = new BigNumber(invoice.amount);

    if (!actualAmount.isEqualTo(expectedAmount)) {
      return {
        valid: false,
        error: 'AMOUNT_MISMATCH',
        expected: expectedAmount.toString(),
        actual: actualAmount.toString()
      };
    }

    // 6. Verify asset matches
    const actualAsset = paymentOp.asset_code || 'XLM';
    if (actualAsset !== invoice.asset) {
      return {
        valid: false,
        error: 'ASSET_MISMATCH',
        expected: invoice.asset,
        actual: actualAsset
      };
    }

    // 7. Verify timestamp within acceptable range
    const txTimestamp = new Date(transaction.created_at).getTime();
    const invoiceCreated = new Date(invoice.createdAt).getTime();
    const invoiceExpiry = new Date(invoice.expiresAt).getTime();

    if (txTimestamp < invoiceCreated || txTimestamp > invoiceExpiry) {
      return {
        valid: false,
        error: 'TIMESTAMP_OUT_OF_RANGE',
        details: 'Payment timestamp outside invoice validity period'
      };
    }

    // 8. Check for memo (optional)
    if (invoice.memo && transaction.memo !== invoice.memo) {
      return {
        valid: false,
        error: 'MEMO_MISMATCH',
        expected: invoice.memo,
        actual: transaction.memo
      };
    }

    // 9. All checks passed
    return {
      valid: true,
      transactionHash,
      amount: actualAmount.toString(),
      asset: actualAsset,
      from: paymentOp.from,
      to: paymentOp.to,
      ledger: transaction.ledger_attr,
      timestamp: transaction.created_at
    };

  } catch (error) {
    if (error.response?.status === 404) {
      return {
        valid: false,
        error: 'TRANSACTION_NOT_FOUND',
        details: 'Transaction hash not found on Stellar network'
      };
    }

    throw error;
  }
}
```

### Double-Spend Prevention

```typescript
// Prevent the same transaction from being used multiple times
async function preventDoubleSpend(transactionHash: string): Promise<boolean> {
  // Check if transaction already used
  const existing = await prisma.payment.findUnique({
    where: { transactionHash }
  });

  if (existing) {
    logger.warn('Double-spend attempt detected', {
      transactionHash,
      existingPaymentId: existing.id,
      existingInvoiceId: existing.invoiceId
    });
    return false;
  }

  // Use database unique constraint as final guard
  // If race condition occurs, constraint will prevent duplicate
  return true;
}

// Database schema with unique constraint
// schema.prisma
model Payment {
  id              String   @id @default(cuid())
  transactionHash String   @unique  // Prevents double-spend at DB level
  invoiceId       String
  amount          String
  asset           String
  from            String
  to              String
  status          PaymentStatus
  createdAt       DateTime @default(now())

  invoice Invoice @relation(fields: [invoiceId], references: [id])

  @@index([invoiceId])
  @@index([status])
}
```

### Network Validation

```typescript
// Ensure payment is on correct Stellar network
async function validateNetwork(transaction: any): Promise<boolean> {
  const networkPassphrase = process.env.STELLAR_NETWORK === 'testnet'
    ? Networks.TESTNET
    : Networks.PUBLIC;

  // Verify transaction network matches expected network
  const txNetwork = transaction.network_passphrase;

  if (txNetwork !== networkPassphrase) {
    logger.error('Network mismatch detected', {
      expected: networkPassphrase,
      actual: txNetwork,
      transactionHash: transaction.hash
    });
    return false;
  }

  return true;
}
```

## API Security

### Input Validation

All API inputs are validated using Zod schemas:

```typescript
import { z } from 'zod';

// Invoice creation schema
const createInvoiceSchema = z.object({
  amount: z.string()
    .regex(/^\d+(\.\d{1,7})?$/, 'Invalid amount format')
    .refine(val => {
      const num = parseFloat(val);
      return num > 0 && num <= 1000000;
    }, 'Amount must be between 0 and 1,000,000'),

  asset: z.enum(['XLM', 'USDC', 'EURC'])
    .default('XLM'),

  description: z.string()
    .min(1, 'Description required')
    .max(500, 'Description too long')
    .trim(),

  clientName: z.string()
    .max(100, 'Client name too long')
    .optional(),

  clientEmail: z.string()
    .email('Invalid email format')
    .optional(),

  expiresIn: z.number()
    .int()
    .min(300, 'Minimum 5 minutes')
    .max(86400 * 30, 'Maximum 30 days')
    .default(3600),

  metadata: z.record(z.string(), z.any())
    .optional()
    .refine(val => {
      if (!val) return true;
      return JSON.stringify(val).length <= 2000;
    }, 'Metadata too large')
});

// Validation middleware
function validateRequest<T>(schema: z.ZodSchema<T>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }
      next(error);
    }
  };
}

// Usage
router.post('/invoices',
  authenticate,
  validateRequest(createInvoiceSchema),
  invoiceController.create
);
```

### SQL Injection Prevention

Using Prisma ORM with parameterized queries:

```typescript
// Safe - Prisma automatically parameterizes
const invoices = await prisma.invoice.findMany({
  where: {
    merchantId: userId,
    status: 'PENDING',
    amount: { gte: minAmount }
  }
});

// Safe - Using raw queries with parameterization
const result = await prisma.$queryRaw`
  SELECT * FROM invoices
  WHERE merchant_id = ${userId}
  AND status = ${status}
  AND amount >= ${minAmount}
`;

// NEVER do this (vulnerable to SQL injection)
// const query = `SELECT * FROM invoices WHERE merchant_id = '${userId}'`;
```

### XSS Prevention

```typescript
// Content Security Policy headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://horizon.stellar.org'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Sanitize output in responses
import DOMPurify from 'isomorphic-dompurify';

function sanitizeOutput(data: any): any {
  if (typeof data === 'string') {
    return DOMPurify.sanitize(data);
  }
  if (Array.isArray(data)) {
    return data.map(sanitizeOutput);
  }
  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeOutput(value);
    }
    return sanitized;
  }
  return data;
}
```

### CSRF Protection

```typescript
import csrf from 'csurf';

// CSRF protection for state-changing operations
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

// Apply to state-changing routes
router.post('/invoices', csrfProtection, createInvoice);
router.patch('/invoices/:id', csrfProtection, updateInvoice);
router.delete('/invoices/:id', csrfProtection, deleteInvoice);

// Endpoint to get CSRF token
router.get('/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});
```

## Webhook Security

### Signature Verification

```typescript
// Generate webhook signature
function generateSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

// Verify webhook signature
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateSignature(payload, secret);

  // Timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Webhook handler with verification
router.post('/webhooks/link2pay',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['x-link2pay-signature'] as string;
    const timestamp = req.headers['x-link2pay-timestamp'] as string;

    // 1. Verify signature exists
    if (!signature || !timestamp) {
      return res.status(401).json({
        error: 'Missing signature or timestamp'
      });
    }

    // 2. Verify timestamp is recent (prevent replay attacks)
    const requestTime = parseInt(timestamp, 10);
    const currentTime = Math.floor(Date.now() / 1000);
    const timeDiff = Math.abs(currentTime - requestTime);

    if (timeDiff > 300) { // 5 minutes tolerance
      return res.status(401).json({
        error: 'Request timestamp too old'
      });
    }

    // 3. Verify signature
    const payload = req.body.toString('utf-8');
    const isValid = verifyWebhookSignature(
      payload,
      signature,
      process.env.WEBHOOK_SECRET!
    );

    if (!isValid) {
      logger.warn('Invalid webhook signature', {
        ip: req.ip,
        signature
      });
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // 4. Respond immediately
    res.json({ received: true });

    // 5. Process asynchronously
    const event = JSON.parse(payload);
    await processWebhookEvent(event);
  }
);
```

### Idempotency

```typescript
// Prevent duplicate webhook processing
async function processWebhookEvent(event: WebhookEvent) {
  const eventId = event.id;

  // Check if already processed
  const existing = await redis.get(`webhook:${eventId}`);
  if (existing) {
    logger.info('Duplicate webhook event ignored', { eventId });
    return;
  }

  // Mark as processing
  await redis.setex(
    `webhook:${eventId}`,
    86400 * 7, // Keep for 7 days
    JSON.stringify({ processedAt: new Date().toISOString() })
  );

  // Process event
  try {
    await handleEvent(event);
  } catch (error) {
    logger.error('Webhook processing failed', { eventId, error });
    // Don't throw - event is marked as processed to prevent retries
  }
}
```

## Transport Security

### TLS/HTTPS

All production deployments must use HTTPS:

```typescript
// Enforce HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      return res.redirect(`https://${req.header('host')}${req.url}`);
    }
    next();
  });
}

// HSTS header
app.use(helmet.hsts({
  maxAge: 31536000, // 1 year
  includeSubDomains: true,
  preload: true
}));
```

### CORS Configuration

```typescript
import cors from 'cors';

// Strict CORS policy
const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

    // Allow requests with no origin (mobile apps, curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Total-Count'],
  maxAge: 600 // 10 minutes
};

app.use(cors(corsOptions));
```

## Data Security

### Sensitive Data Handling

```typescript
// Never log sensitive data
logger.info('User authenticated', {
  userId: user.id,
  // DON'T log: walletAddress, signature, tokens
});

// Mask sensitive data in responses
function maskWalletAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

// Redact sensitive fields from logs
const logRedaction = {
  paths: [
    'password',
    'token',
    'apiKey',
    'secret',
    'signature',
    'authorization'
  ],
  censor: '[REDACTED]'
};
```

### Data Encryption at Rest

```typescript
// Encrypt sensitive metadata before storage
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
const ALGORITHM = 'aes-256-gcm';

function encrypt(text: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decrypt(encrypted: string): string {
  const [ivHex, authTagHex, encryptedText] = encrypted.split(':');

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// Usage in database
await prisma.invoice.create({
  data: {
    amount: '100.00',
    metadata: encrypt(JSON.stringify(sensitiveMetadata))
  }
});
```

## Production Best Practices

### Environment Variables

```bash
# .env.example - never commit actual .env file
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@localhost:5432/link2pay
REDIS_URL=redis://localhost:6379

# JWT configuration
JWT_SECRET=<256-bit random hex>  # openssl rand -hex 32
JWT_EXPIRY=3600

# Encryption
ENCRYPTION_KEY=<256-bit random hex>  # openssl rand -hex 32

# Webhook security
WEBHOOK_SECRET=<256-bit random hex>

# Stellar configuration
STELLAR_NETWORK=public
HORIZON_URL=https://horizon.stellar.org

# API keys (rotate regularly)
API_KEY_SECRET=<256-bit random hex>

# CORS
ALLOWED_ORIGINS=https://app.link2pay.dev,https://www.link2pay.dev

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
```

### Security Headers

```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: true,
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: true,
  dnsPrefetchControl: true,
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true
}));
```

### Logging and Monitoring

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'link2pay-api' },
  transports: [
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  ]
});

// Security event logging
function logSecurityEvent(event: string, details: any) {
  logger.warn('Security event', {
    event,
    ...details,
    timestamp: new Date().toISOString(),
    ip: details.ip,
    userAgent: details.userAgent
  });
}

// Examples
logSecurityEvent('AUTHENTICATION_FAILED', {
  walletAddress,
  reason: 'Invalid signature',
  ip: req.ip,
  userAgent: req.headers['user-agent']
});

logSecurityEvent('RATE_LIMIT_EXCEEDED', {
  endpoint: req.path,
  ip: req.ip,
  limit: rateLimitConfig.max
});
```

### Incident Response

**Security Incident Checklist:**

1. **Detection**
   - Monitor logs for suspicious activity
   - Set up alerts for security events
   - Review Stellar transactions regularly

2. **Containment**
   - Revoke compromised API keys immediately
   - Rotate affected secrets
   - Block malicious IPs
   - Disable compromised webhooks

3. **Investigation**
   - Analyze logs and transaction history
   - Identify scope of compromise
   - Document timeline of events

4. **Recovery**
   - Deploy fixes for vulnerabilities
   - Restore from backups if needed
   - Verify system integrity

5. **Post-Incident**
   - Notify affected users
   - Update security measures
   - Document lessons learned

## Security Checklist

### Pre-Launch Security Review

- [ ] All API endpoints require authentication
- [ ] Input validation on all user inputs
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (CSP headers, output sanitization)
- [ ] CSRF protection on state-changing operations
- [ ] Rate limiting on all endpoints
- [ ] HTTPS enforced in production
- [ ] Security headers configured (Helmet)
- [ ] CORS properly configured
- [ ] Webhook signature verification
- [ ] Payment verification on Stellar network
- [ ] Double-spend prevention
- [ ] Sensitive data encrypted at rest
- [ ] Secrets in environment variables (not code)
- [ ] Error messages don't leak sensitive info
- [ ] Logging doesn't capture sensitive data
- [ ] Database backups encrypted
- [ ] Incident response plan documented
- [ ] Security monitoring and alerts configured
- [ ] Dependencies regularly updated
- [ ] Third-party code audited

### Regular Security Maintenance

**Weekly:**
- Review security logs
- Check for suspicious transactions
- Monitor rate limit violations

**Monthly:**
- Update dependencies
- Rotate API keys
- Review access controls
- Test backup restoration

**Quarterly:**
- Security audit
- Penetration testing
- Review and update security policies
- Staff security training

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Stellar Security Guide](https://developers.stellar.org/docs/encyclopedia/security)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
