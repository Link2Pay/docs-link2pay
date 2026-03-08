# Backend Integration

Complete guide to integrating Link2Pay into your Node.js/Express backend application.

## Overview

This guide covers:
- API client setup
- Server-side authentication
- Webhook handling
- Payment verification
- Error handling
- Security best practices

**Tech Stack:**
- Node.js 18+
- Express 4.18+
- TypeScript 5.3+
- Prisma (optional, for database)

---

## Installation

### Install Dependencies

```bash
npm install @stellar/stellar-sdk axios
```

**Optional (recommended):**
```bash
npm install zod prisma @prisma/client
```

---

## API Client Setup

### Base Client

```typescript
// lib/link2pay.ts
import axios, { AxiosInstance } from 'axios';

export class Link2PayClient {
  private client: AxiosInstance;

  constructor(
    private apiUrl: string = 'https://api.link2pay.dev',
    private token?: string
  ) {
    this.client = axios.create({
      baseURL: apiUrl,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });
  }

  // Authentication
  async requestNonce(walletAddress: string) {
    const { data } = await this.client.post('/api/auth/nonce', {
      walletAddress
    });
    return data;
  }

  async createSession(walletAddress: string, nonce: string, signature: string) {
    const { data } = await this.client.post('/api/auth/session', {
      walletAddress,
      nonce,
      signature
    });

    // Store token for future requests
    this.token = data.token;
    this.client.defaults.headers['Authorization'] = `Bearer ${data.token}`;

    return data;
  }

  // Invoices
  async createInvoice(invoiceData: any) {
    const { data } = await this.client.post('/api/invoices', invoiceData);
    return data;
  }

  async getInvoice(invoiceId: string) {
    const { data } = await this.client.get(`/api/invoices/${invoiceId}`);
    return data;
  }

  async listInvoices(params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    const { data } = await this.client.get('/api/invoices', { params });
    return data;
  }

  async sendInvoice(invoiceId: string) {
    const { data } = await this.client.post(`/api/invoices/${invoiceId}/send`);
    return data;
  }

  async deleteInvoice(invoiceId: string) {
    const { data } = await this.client.delete(`/api/invoices/${invoiceId}`);
    return data;
  }

  // Payment Links
  async createPaymentLink(linkData: any) {
    const { data} = await this.client.post('/api/links', linkData);
    return data;
  }

  async getPaymentLink(linkId: string) {
    const { data } = await this.client.get(`/api/links/${linkId}`);
    return data;
  }

  async getPaymentLinkStatus(linkId: string) {
    const { data } = await this.client.get(`/api/links/${linkId}/status`);
    return data;
  }

  // Payments
  async createPayIntent(invoiceId: string, senderPublicKey: string, networkPassphrase: string) {
    const { data } = await this.client.post(
      `/api/payments/${invoiceId}/pay-intent`,
      { senderPublicKey, networkPassphrase }
    );
    return data;
  }

  async submitPayment(invoiceId: string, signedTransactionXdr: string) {
    const { data } = await this.client.post('/api/payments/submit', {
      invoiceId,
      signedTransactionXdr
    });
    return data;
  }

  async confirmPayment(invoiceId: string, transactionHash: string) {
    const { data } = await this.client.post('/api/payments/confirm', {
      invoiceId,
      transactionHash
    });
    return data;
  }

  async getPaymentStatus(invoiceId: string) {
    const { data } = await this.client.get(`/api/payments/${invoiceId}/status`);
    return data;
  }

  // Clients
  async listClients() {
    const { data } = await this.client.get('/api/clients');
    return data;
  }

  async saveClient(clientData: any) {
    const { data } = await this.client.post('/api/clients', clientData);
    return data;
  }

  async updateClientFavorite(clientId: string, isFavorite: boolean) {
    const { data } = await this.client.patch(
      `/api/clients/${clientId}/favorite`,
      { isFavorite }
    );
    return data;
  }

  // Prices
  async getXLMPrice() {
    const { data } = await this.client.get('/api/prices/xlm');
    return data;
  }
}

// Export singleton instance
export const link2pay = new Link2PayClient();

// Usage
const invoice = await link2pay.createInvoice({
  freelancerWallet: 'GABC...',
  clientName: 'John Doe',
  clientEmail: 'john@example.com',
  title: 'Services',
  currency: 'USDC',
  networkPassphrase: 'Test SDF Network ; September 2015',
  lineItems: [
    { description: 'Consulting', quantity: 10, rate: 100 }
  ]
});
```

---

## Server-Side Authentication

### Authentication Middleware

```typescript
// middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthRequest extends Request {
  walletAddress?: string;
}

export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { walletAddress: string };

    req.walletAddress = decoded.walletAddress;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Usage
app.get('/api/invoices', requireAuth, async (req: AuthRequest, res) => {
  const walletAddress = req.walletAddress; // Available after auth
  // ... fetch user's invoices
});
```

---

### Proxy Authentication

If your backend acts as proxy to Link2Pay API:

```typescript
// routes/invoices.ts
import express from 'express';
import { link2pay } from '../lib/link2pay';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Create invoice (proxied)
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    // Get Link2Pay session for this user
    const userSession = await getUserLink2PaySession(req.walletAddress!);

    // Create client with user's token
    const client = new Link2PayClient('https://api.link2pay.dev', userSession.token);

    // Create invoice
    const invoice = await client.createInvoice(req.body);

    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

---

## Request Validation

### Using Zod

```typescript
// schemas/invoice.ts
import { z } from 'zod';

export const lineItemSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.number().positive().max(999999),
  rate: z.number().min(0).max(999999999)
});

export const createInvoiceSchema = z.object({
  freelancerWallet: z
    .string()
    .regex(/^G[A-Z2-7]{55}$/, 'Invalid Stellar address'),
  freelancerName: z.string().max(200).optional(),
  freelancerEmail: z.string().email().optional(),
  freelancerCompany: z.string().max(200).optional(),

  clientName: z.string().min(1).max(200),
  clientEmail: z.string().email(),
  clientCompany: z.string().max(200).optional(),
  clientAddress: z.string().max(500).optional(),

  title: z.string().min(1).max(300),
  description: z.string().max(2000).optional(),
  notes: z.string().max(2000).optional(),

  currency: z.enum(['XLM', 'USDC', 'EURC']),
  taxRate: z.number().min(0).max(100).optional(),
  discount: z.number().min(0).optional(),
  dueDate: z.string().datetime().optional(),

  networkPassphrase: z
    .string()
    .refine(val =>
      val === 'Test SDF Network ; September 2015' ||
      val === 'Public Global Stellar Network ; September 2015',
      { message: 'Invalid network passphrase' }
    ),

  saveClient: z.boolean().optional(),
  favoriteClient: z.boolean().optional(),

  lineItems: z.array(lineItemSchema).min(1).max(50)
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
```

---

### Validation Middleware

```typescript
// middleware/validation.ts
import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
      }
      next(error);
    }
  };
}

// Usage
router.post(
  '/invoices',
  requireAuth,
  validateBody(createInvoiceSchema),
  async (req, res) => {
    // req.body is now typed and validated
    const invoice = await createInvoice(req.body);
    res.json(invoice);
  }
);
```

---

## Payment Verification

### Verify Transaction On-Chain

```typescript
// services/stellar.ts
import { Server, Horizon } from '@stellar/stellar-sdk';

const HORIZON_URL = process.env.HORIZON_URL || 'https://horizon-testnet.stellar.org';
const server = new Server(HORIZON_URL);

export async function verifyPayment(
  transactionHash: string,
  expectedRecipient: string,
  expectedAmount: string,
  expectedAsset: string
) {
  try {
    // 1. Fetch transaction
    const transaction = await server.transactions()
      .transaction(transactionHash)
      .call();

    // 2. Verify transaction succeeded
    if (!transaction.successful) {
      return { valid: false, error: 'Transaction failed' };
    }

    // 3. Get operations
    const operations = await server.operations()
      .forTransaction(transactionHash)
      .call();

    // 4. Find payment operation
    const paymentOp = operations.records.find((op: any) =>
      op.type === 'payment' ||
      op.type === 'create_account'
    );

    if (!paymentOp) {
      return { valid: false, error: 'No payment operation found' };
    }

    // 5. Verify recipient
    if (paymentOp.to !== expectedRecipient) {
      return {
        valid: false,
        error: `Wrong recipient: expected ${expectedRecipient}, got ${paymentOp.to}`
      };
    }

    // 6. Verify amount
    const actualAmount = parseFloat(paymentOp.amount);
    const requiredAmount = parseFloat(expectedAmount);

    if (actualAmount < requiredAmount) {
      return {
        valid: false,
        error: `Insufficient amount: expected ${requiredAmount}, got ${actualAmount}`
      };
    }

    // 7. Verify asset
    const actualAsset = paymentOp.asset_type === 'native'
      ? 'XLM'
      : paymentOp.asset_code;

    if (actualAsset !== expectedAsset) {
      return {
        valid: false,
        error: `Wrong asset: expected ${expectedAsset}, got ${actualAsset}`
      };
    }

    // ✅ Payment verified
    return {
      valid: true,
      amount: actualAmount,
      asset: actualAsset,
      from: paymentOp.from,
      to: paymentOp.to,
      ledger: transaction.ledger_attr,
      createdAt: transaction.created_at
    };

  } catch (error) {
    return { valid: false, error: error.message };
  }
}

// Usage
const verification = await verifyPayment(
  '7a8b9c0d...',
  'GABC123...', // Invoice recipient
  '100.00',     // Invoice total
  'USDC'        // Invoice currency
);

if (verification.valid) {
  // Mark invoice as paid
  await markInvoiceAsPaid(invoiceId, verification);
} else {
  console.error('Payment verification failed:', verification.error);
}
```

---

## Webhook Integration

### Webhook Handler

```typescript
// routes/webhooks.ts
import express from 'express';
import crypto from 'crypto';

const router = express.Router();

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET!;

// Verify webhook signature
function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

router.post('/link2pay', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-link2pay-signature'] as string;
    const payload = req.body.toString();

    // Verify signature
    if (!verifyWebhookSignature(payload, signature)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Parse event
    const event = JSON.parse(payload);

    // Handle event
    switch (event.type) {
      case 'invoice.paid':
        await handleInvoicePaid(event.data);
        break;

      case 'invoice.expired':
        await handleInvoiceExpired(event.data);
        break;

      case 'payment.confirmed':
        await handlePaymentConfirmed(event.data);
        break;

      default:
        console.log('Unknown event type:', event.type);
    }

    // Acknowledge receipt
    res.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Event handlers
async function handleInvoicePaid(data: any) {
  console.log('Invoice paid:', data.invoiceId);

  // Update your database
  await db.order.update({
    where: { invoiceId: data.invoiceId },
    data: {
      status: 'PAID',
      paidAt: new Date(),
      transactionHash: data.transactionHash
    }
  });

  // Send confirmation email
  await sendEmail(
    data.clientEmail,
    'Payment Received',
    `Your payment of ${data.amount} ${data.currency} has been confirmed.`
  );

  // Fulfill order
  await fulfillOrder(data.invoiceId);
}

async function handleInvoiceExpired(data: any) {
  console.log('Invoice expired:', data.invoiceId);

  await db.order.update({
    where: { invoiceId: data.invoiceId },
    data: { status: 'EXPIRED' }
  });

  // Notify user
  await sendEmail(
    data.clientEmail,
    'Invoice Expired',
    'Your invoice has expired. Please request a new one.'
  );
}

async function handlePaymentConfirmed(data: any) {
  console.log('Payment confirmed:', data.transactionHash);

  // Additional verification
  const verification = await verifyPayment(
    data.transactionHash,
    data.recipient,
    data.amount,
    data.asset
  );

  if (!verification.valid) {
    console.error('Payment verification failed:', verification.error);
    return;
  }

  // Process payment
  await processPayment(data);
}

export default router;
```

---

## Error Handling

### Global Error Handler

```typescript
// middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', error);

  if (error instanceof APIError) {
    return res.status(error.statusCode).json({
      error: error.message,
      code: error.code
    });
  }

  // Axios errors (from Link2Pay API)
  if (error.response) {
    return res.status(error.response.status).json({
      error: error.response.data.error || 'External API error'
    });
  }

  // Generic error
  res.status(500).json({
    error: 'Internal server error'
  });
}

// Usage
app.use(errorHandler);
```

---

### Retry Logic

```typescript
// utils/retry.ts
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }

      console.log(`Attempt ${attempt} failed, retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      delayMs *= 2; // Exponential backoff
    }
  }

  throw new Error('Max retries exceeded');
}

// Usage
const invoice = await withRetry(
  () => link2pay.createInvoice(invoiceData),
  3,
  1000
);
```

---

## Rate Limiting

### Client-Side Rate Limiting

```typescript
// lib/rateLimiter.ts
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  async checkLimit(
    key: string,
    maxRequests: number,
    windowMs: number
  ): Promise<boolean> {
    const now = Date.now();
    const requests = this.requests.get(key) || [];

    // Remove old requests outside window
    const validRequests = requests.filter(
      timestamp => now - timestamp < windowMs
    );

    if (validRequests.length >= maxRequests) {
      const oldestRequest = validRequests[0];
      const resetTime = oldestRequest + windowMs - now;

      throw new Error(
        `Rate limit exceeded. Try again in ${Math.ceil(resetTime / 1000)}s`
      );
    }

    // Add current request
    validRequests.push(now);
    this.requests.set(key, validRequests);

    return true;
  }
}

const limiter = new RateLimiter();

// Usage
async function createInvoice(walletAddress: string, data: any) {
  // Check rate limit: 20 invoices per hour
  await limiter.checkLimit(walletAddress, 20, 60 * 60 * 1000);

  return await link2pay.createInvoice(data);
}
```

---

## Database Integration

### Prisma Schema

```prisma
// prisma/schema.prisma
model Order {
  id            String   @id @default(cuid())
  userId        String
  invoiceId     String?  @unique
  invoiceNumber String?
  status        String   // PENDING, PAID, EXPIRED, CANCELLED
  amount        Decimal  @db.Decimal(18, 7)
  currency      String   // XLM, USDC, EURC
  transactionHash String?
  paidAt        DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user          User     @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([invoiceId])
  @@index([status])
}
```

---

### Sync Invoice Data

```typescript
// services/invoiceSync.ts
import { PrismaClient } from '@prisma/client';
import { link2pay } from '../lib/link2pay';

const prisma = new PrismaClient();

export async function createOrderWithInvoice(
  userId: string,
  orderData: any
) {
  // 1. Create invoice on Link2Pay
  const invoice = await link2pay.createInvoice({
    freelancerWallet: process.env.MERCHANT_WALLET!,
    clientName: orderData.customerName,
    clientEmail: orderData.customerEmail,
    title: `Order #${orderData.orderNumber}`,
    currency: 'USDC',
    networkPassphrase: 'Public Global Stellar Network ; September 2015',
    lineItems: orderData.items.map(item => ({
      description: item.name,
      quantity: item.quantity,
      rate: item.price
    }))
  });

  // 2. Store in database
  const order = await prisma.order.create({
    data: {
      userId,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status: 'PENDING',
      amount: invoice.total,
      currency: invoice.currency
    }
  });

  return { order, invoice };
}

export async function syncPaymentStatus(invoiceId: string) {
  // 1. Get status from Link2Pay
  const status = await link2pay.getPaymentStatus(invoiceId);

  // 2. Update database
  if (status.status === 'PAID') {
    await prisma.order.update({
      where: { invoiceId },
      data: {
        status: 'PAID',
        transactionHash: status.transactionHash,
        paidAt: new Date(status.paidAt)
      }
    });
  }

  return status;
}
```

---

## Complete Example API

```typescript
// server.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';
import { link2pay } from './lib/link2pay';
import { requireAuth } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import webhookRouter from './routes/webhooks';

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.post('/api/orders', requireAuth, async (req, res) => {
  try {
    const { order, invoice } = await createOrderWithInvoice(
      req.walletAddress!,
      req.body
    );

    res.status(201).json({
      order,
      checkoutUrl: `https://app.link2pay.dev/pay/${invoice.id}`
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/orders/:id/status', requireAuth, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Sync with Link2Pay
    if (order.invoiceId && order.status === 'PENDING') {
      await syncPaymentStatus(order.invoiceId);
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
});

// Webhooks
app.use('/webhooks', webhookRouter);

// Error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

## Security Best Practices

### 1. Environment Variables

```bash
# .env
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-key-here"
MERCHANT_WALLET="GABC..."
LINK2PAY_API_URL="https://api.link2pay.dev"
WEBHOOK_SECRET="webhook-secret-key"
STELLAR_NETWORK="testnet"
```

---

### 2. Input Sanitization

```typescript
import sanitizeHtml from 'sanitize-html';

function sanitizeInput(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {}
  });
}

// Usage
const safeTitle = sanitizeInput(req.body.title);
```

---

### 3. SQL Injection Prevention

```typescript
// ✅ Good: Using Prisma (parameterized queries)
const orders = await prisma.order.findMany({
  where: { userId: req.params.userId }
});

// ❌ Bad: Raw SQL with string interpolation
const orders = await prisma.$queryRaw`
  SELECT * FROM orders WHERE userId = ${req.params.userId}
`; // Still safe with Prisma, but avoid if possible
```

---

## Next Steps

- Read [Webhook Events](/guide/integration/webhooks)
- Learn about [Authentication](/guide/integration/authentication)
- Explore [API Reference](/api/overview)
- Check [Security Guide](/guide/advanced/security)
