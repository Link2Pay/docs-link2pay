# Webhook Events

Webhooks allow your application to receive real-time notifications when events occur in Link2Pay.

## Overview

Webhooks enable:
- Real-time payment notifications
- Automated order fulfillment
- Status change tracking
- Audit trail creation
- Third-party integrations

**How Webhooks Work:**
1. Event occurs in Link2Pay (e.g., invoice paid)
2. Link2Pay sends HTTP POST to your webhook URL
3. Your server receives and processes the event
4. Your server responds with 200 OK
5. Link2Pay marks webhook as delivered

---

## Setup

### Register Webhook URL

**Coming Soon:** Webhook registration will be available in the dashboard.

**Manual Setup (Current):**
Contact support to register your webhook endpoint:
- Email: support@link2pay.dev
- Provide: Your webhook URL and events to subscribe to

---

### Webhook Endpoint

Create an endpoint to receive webhooks:

```typescript
// routes/webhooks.ts
import express from 'express';
import crypto from 'crypto';

const router = express.Router();

router.post('/link2pay', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // 1. Verify signature (security)
    const signature = req.headers['x-link2pay-signature'] as string;
    if (!verifySignature(req.body, signature)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // 2. Parse event
    const event = JSON.parse(req.body.toString());

    // 3. Handle event
    await handleWebhookEvent(event);

    // 4. Respond quickly (within 5 seconds)
    res.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
```

---

## Event Types

### invoice.created

Triggered when an invoice is created.

**Payload:**
```json
{
  "id": "evt_abc123",
  "type": "invoice.created",
  "created": 1709816400,
  "data": {
    "id": "cm3g4h5i6j7k8l9m0n",
    "invoiceNumber": "INV-0042",
    "status": "DRAFT",
    "freelancerWallet": "GABC...",
    "clientName": "John Doe",
    "clientEmail": "john@example.com",
    "total": "1000.00",
    "currency": "USDC",
    "createdAt": "2024-03-07T12:00:00.000Z"
  }
}
```

**Handler:**
```typescript
async function handleInvoiceCreated(data: any) {
  console.log('New invoice created:', data.invoiceNumber);

  // Track in analytics
  await analytics.track('invoice_created', {
    invoiceId: data.id,
    amount: data.total,
    currency: data.currency
  });
}
```

---

### invoice.sent

Triggered when an invoice status changes from DRAFT to PENDING.

**Payload:**
```json
{
  "id": "evt_def456",
  "type": "invoice.sent",
  "created": 1709816700,
  "data": {
    "id": "cm3g4h5i6j7k8l9m0n",
    "invoiceNumber": "INV-0042",
    "status": "PENDING",
    "previousStatus": "DRAFT",
    "sentAt": "2024-03-07T12:05:00.000Z"
  }
}
```

**Handler:**
```typescript
async function handleInvoiceSent(data: any) {
  console.log('Invoice sent:', data.invoiceNumber);

  // Send email to client
  await sendEmail({
    to: data.clientEmail,
    subject: `Invoice ${data.invoiceNumber}`,
    body: `You have received an invoice for ${data.total} ${data.currency}.
           Pay here: https://app.link2pay.dev/pay/${data.id}`
  });
}
```

---

### invoice.paid

Triggered when payment is confirmed on the blockchain.

**Payload:**
```json
{
  "id": "evt_ghi789",
  "type": "invoice.paid",
  "created": 1709817000,
  "data": {
    "id": "cm3g4h5i6j7k8l9m0n",
    "invoiceNumber": "INV-0042",
    "status": "PAID",
    "previousStatus": "PROCESSING",
    "total": "1000.00",
    "currency": "USDC",
    "transactionHash": "7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b",
    "ledgerNumber": 123456,
    "payerWallet": "GDPYEQVX...",
    "paidAt": "2024-03-07T12:10:30.000Z"
  }
}
```

**Handler:**
```typescript
async function handleInvoicePaid(data: any) {
  console.log('Invoice paid:', data.invoiceNumber);

  // 1. Update order status
  await db.order.update({
    where: { invoiceId: data.id },
    data: {
      status: 'PAID',
      transactionHash: data.transactionHash,
      paidAt: new Date(data.paidAt)
    }
  });

  // 2. Fulfill order
  await fulfillOrder(data.id);

  // 3. Send confirmation email
  await sendEmail({
    to: data.clientEmail,
    subject: 'Payment Received',
    body: `Your payment of ${data.total} ${data.currency} has been confirmed.
           Transaction: ${data.transactionHash}`
  });

  // 4. Trigger integrations
  await zapier.trigger('invoice_paid', data);
}
```

---

### invoice.expired

Triggered when invoice passes due date without payment.

**Payload:**
```json
{
  "id": "evt_jkl012",
  "type": "invoice.expired",
  "created": 1709900000,
  "data": {
    "id": "cm3g4h5i6j7k8l9m0n",
    "invoiceNumber": "INV-0042",
    "status": "EXPIRED",
    "previousStatus": "PENDING",
    "dueDate": "2024-03-31T23:59:59.000Z",
    "expiredAt": "2024-04-01T00:00:00.000Z"
  }
}
```

**Handler:**
```typescript
async function handleInvoiceExpired(data: any) {
  console.log('Invoice expired:', data.invoiceNumber);

  // 1. Update order
  await db.order.update({
    where: { invoiceId: data.id },
    data: { status: 'EXPIRED' }
  });

  // 2. Notify customer
  await sendEmail({
    to: data.clientEmail,
    subject: 'Invoice Expired',
    body: `Invoice ${data.invoiceNumber} has expired.
           Please request a new invoice if you still wish to pay.`
  });

  // 3. Notify merchant
  await sendEmail({
    to: data.freelancerEmail,
    subject: 'Invoice Expired (No Payment)',
    body: `Invoice ${data.invoiceNumber} expired without payment.`
  });
}
```

---

### invoice.cancelled

Triggered when invoice is cancelled by creator.

**Payload:**
```json
{
  "id": "evt_mno345",
  "type": "invoice.cancelled",
  "created": 1709820000,
  "data": {
    "id": "cm3g4h5i6j7k8l9m0n",
    "invoiceNumber": "INV-0042",
    "status": "CANCELLED",
    "previousStatus": "PENDING",
    "cancelledAt": "2024-03-07T13:00:00.000Z",
    "cancelledBy": "GABC...",
    "reason": "Customer requested cancellation"
  }
}
```

**Handler:**
```typescript
async function handleInvoiceCancelled(data: any) {
  console.log('Invoice cancelled:', data.invoiceNumber);

  // Update order
  await db.order.update({
    where: { invoiceId: data.id },
    data: {
      status: 'CANCELLED',
      cancelReason: data.reason
    }
  });

  // Refund if partially paid (future feature)
  if (data.partialPayment) {
    await initiateRefund(data.id);
  }
}
```

---

### payment.confirmed

Triggered when payment transaction is confirmed on Stellar.

**Payload:**
```json
{
  "id": "evt_pqr678",
  "type": "payment.confirmed",
  "created": 1709817000,
  "data": {
    "id": "pay_xyz789",
    "invoiceId": "cm3g4h5i6j7k8l9m0n",
    "transactionHash": "7a8b9c0d...",
    "ledgerNumber": 123456,
    "fromWallet": "GDPYEQVX...",
    "toWallet": "GABC...",
    "amount": "1000.00",
    "asset": "USDC",
    "confirmedAt": "2024-03-07T12:10:30.000Z"
  }
}
```

**Handler:**
```typescript
async function handlePaymentConfirmed(data: any) {
  console.log('Payment confirmed:', data.transactionHash);

  // Verify payment amount matches invoice
  const invoice = await getInvoice(data.invoiceId);

  if (parseFloat(data.amount) < parseFloat(invoice.total)) {
    // Underpayment
    await handleUnderpayment(invoice, data);
  } else {
    // Full payment
    await markOrderAsPaid(invoice.id, data);
  }
}
```

---

### link.created

Triggered when payment link is created.

**Payload:**
```json
{
  "id": "evt_stu901",
  "type": "link.created",
  "created": 1709816400,
  "data": {
    "id": "cm123abc",
    "checkoutUrl": "https://app.link2pay.dev/pay/cm123abc",
    "amount": "50.00",
    "asset": "USDC",
    "metadata": {
      "title": "Product Purchase",
      "reference": "ORDER-123"
    },
    "expiresAt": "2024-03-07T12:15:00.000Z",
    "createdAt": "2024-03-07T12:00:00.000Z"
  }
}
```

---

### link.paid

Triggered when payment link is successfully paid.

**Payload:**
```json
{
  "id": "evt_vwx234",
  "type": "link.paid",
  "created": 1709817000,
  "data": {
    "id": "cm123abc",
    "amount": "50.00",
    "asset": "USDC",
    "transactionHash": "7a8b9c0d...",
    "metadata": {
      "reference": "ORDER-123"
    },
    "paidAt": "2024-03-07T12:05:00.000Z"
  }
}
```

**Handler:**
```typescript
async function handleLinkPaid(data: any) {
  const reference = data.metadata?.reference;

  if (reference) {
    // Find order by reference
    const order = await db.order.findUnique({
      where: { reference }
    });

    if (order) {
      // Mark as paid
      await db.order.update({
        where: { id: order.id },
        data: {
          status: 'PAID',
          transactionHash: data.transactionHash
        }
      });

      // Fulfill order
      await fulfillOrder(order.id);
    }
  }
}
```

---

## Security

### Verify Webhook Signatures

All webhooks include an `X-Link2Pay-Signature` header for verification:

```typescript
import crypto from 'crypto';

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET!;

function verifySignature(payload: Buffer, signature: string): boolean {
  // Compute expected signature
  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  // Compare signatures (timing-safe)
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

// Usage
router.post('/webhooks/link2pay', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-link2pay-signature'] as string;
  const payload = req.body; // Buffer

  if (!verifySignature(payload, signature)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Process webhook...
});
```

---

### IP Whitelisting (Future)

**Coming Soon:** Link2Pay will provide a list of IP addresses for webhook requests.

Example implementation:

```typescript
const LINK2PAY_IPS = [
  '203.0.113.0/24',
  '198.51.100.0/24'
];

function isLink2PayIP(ip: string): boolean {
  // Check if IP is in whitelist
  return LINK2PAY_IPS.some(range => ipInRange(ip, range));
}

router.post('/webhooks/link2pay', (req, res, next) => {
  const clientIP = req.ip;

  if (!isLink2PayIP(clientIP)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  next();
});
```

---

## Best Practices

### 1. Respond Quickly

```typescript
// ✅ Good: Process async, respond immediately
router.post('/webhooks', async (req, res) => {
  const event = req.body;

  // Acknowledge immediately
  res.json({ received: true });

  // Process asynchronously
  processWebhook(event).catch(err => {
    console.error('Webhook processing error:', err);
  });
});

// ❌ Bad: Long processing blocks response
router.post('/webhooks', async (req, res) => {
  const event = req.body;

  // This might take 30+ seconds
  await sendEmails(event);
  await updateDatabase(event);
  await callThirdPartyAPI(event);

  res.json({ received: true }); // Too slow!
});
```

---

### 2. Handle Duplicate Events

```typescript
// Store processed event IDs
const processedEvents = new Set<string>();

async function handleWebhookEvent(event: any) {
  // Check if already processed
  if (processedEvents.has(event.id)) {
    console.log('Duplicate event, skipping:', event.id);
    return;
  }

  // Process event
  await processEvent(event);

  // Mark as processed
  processedEvents.add(event.id);

  // Persist to database
  await db.processedWebhook.create({
    data: {
      eventId: event.id,
      type: event.type,
      processedAt: new Date()
    }
  });
}
```

---

### 3. Retry Failed Webhooks

```typescript
// Queue for failed webhooks
import Bull from 'bull';

const webhookQueue = new Bull('webhooks', {
  redis: process.env.REDIS_URL
});

// Process webhooks from queue
webhookQueue.process(async (job) => {
  const event = job.data;

  try {
    await handleWebhookEvent(event);
  } catch (error) {
    // Retry with exponential backoff
    throw error; // Bull will retry automatically
  }
});

// Add webhook to queue
router.post('/webhooks', (req, res) => {
  const event = req.body;

  // Add to queue
  webhookQueue.add(event, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  });

  res.json({ received: true });
});
```

---

### 4. Log All Webhooks

```typescript
async function logWebhook(event: any) {
  await db.webhookLog.create({
    data: {
      eventId: event.id,
      type: event.type,
      payload: event,
      receivedAt: new Date(),
      signature: req.headers['x-link2pay-signature']
    }
  });
}

router.post('/webhooks', async (req, res) => {
  const event = req.body;

  // Log immediately
  await logWebhook(event);

  // Process
  await handleWebhookEvent(event);

  res.json({ received: true });
});
```

---

## Testing Webhooks

### Local Testing with ngrok

```bash
# 1. Install ngrok
npm install -g ngrok

# 2. Start your server
npm run dev

# 3. Expose to internet
ngrok http 3000

# 4. Use ngrok URL as webhook endpoint
# https://abc123.ngrok.io/webhooks/link2pay
```

---

### Mock Webhook Events

```typescript
// test/webhooks.test.ts
import request from 'supertest';
import app from '../app';

describe('Webhooks', () => {
  it('should handle invoice.paid event', async () => {
    const event = {
      id: 'evt_test123',
      type: 'invoice.paid',
      created: Date.now(),
      data: {
        id: 'cm123',
        invoiceNumber: 'INV-0001',
        status: 'PAID',
        total: '100.00',
        currency: 'USDC',
        transactionHash: '7a8b9c0d...'
      }
    };

    const signature = generateSignature(JSON.stringify(event));

    const response = await request(app)
      .post('/webhooks/link2pay')
      .set('X-Link2Pay-Signature', signature)
      .send(event);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ received: true });

    // Verify processing
    const order = await db.order.findUnique({
      where: { invoiceId: 'cm123' }
    });

    expect(order.status).toBe('PAID');
  });
});
```

---

## Complete Example

```typescript
// routes/webhooks.ts
import express from 'express';
import crypto from 'crypto';
import { db } from '../lib/db';
import { sendEmail } from '../lib/email';
import { fulfillOrder } from '../services/orders';

const router = express.Router();

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET!;

// Verify signature
function verifySignature(payload: Buffer, signature: string): boolean {
  const expected = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

// Event handlers
const handlers = {
  'invoice.paid': async (data: any) => {
    // Update order
    await db.order.update({
      where: { invoiceId: data.id },
      data: {
        status: 'PAID',
        transactionHash: data.transactionHash,
        paidAt: new Date(data.paidAt)
      }
    });

    // Fulfill order
    await fulfillOrder(data.id);

    // Send confirmation
    await sendEmail({
      to: data.clientEmail,
      subject: 'Payment Received',
      template: 'payment-confirmed',
      data: {
        invoiceNumber: data.invoiceNumber,
        amount: data.total,
        currency: data.currency,
        transactionHash: data.transactionHash
      }
    });
  },

  'invoice.expired': async (data: any) => {
    await db.order.update({
      where: { invoiceId: data.id },
      data: { status: 'EXPIRED' }
    });

    await sendEmail({
      to: data.clientEmail,
      subject: 'Invoice Expired',
      template: 'invoice-expired',
      data: { invoiceNumber: data.invoiceNumber }
    });
  },

  'link.paid': async (data: any) => {
    const reference = data.metadata?.reference;

    if (reference) {
      const order = await db.order.findUnique({
        where: { reference }
      });

      if (order) {
        await db.order.update({
          where: { id: order.id },
          data: {
            status: 'PAID',
            transactionHash: data.transactionHash
          }
        });

        await fulfillOrder(order.id);
      }
    }
  }
};

// Webhook endpoint
router.post('/link2pay', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // 1. Verify signature
    const signature = req.headers['x-link2pay-signature'] as string;

    if (!verifySignature(req.body, signature)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // 2. Parse event
    const event = JSON.parse(req.body.toString());

    // 3. Log webhook
    await db.webhookLog.create({
      data: {
        eventId: event.id,
        type: event.type,
        payload: event,
        receivedAt: new Date()
      }
    });

    // 4. Respond immediately
    res.json({ received: true });

    // 5. Process asynchronously
    const handler = handlers[event.type];

    if (handler) {
      await handler(event.data).catch(error => {
        console.error(`Webhook processing error (${event.type}):`, error);
      });
    }

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
```

---

## Troubleshooting

### Webhooks not receiving

**Check:**
1. Endpoint is publicly accessible (not localhost)
2. HTTPS is enabled (required in production)
3. Firewall allows incoming connections
4. Server is running and responding
5. Webhook URL is correctly registered

**Test:**
```bash
curl -X POST https://your-domain.com/webhooks/link2pay \
  -H "Content-Type: application/json" \
  -H "X-Link2Pay-Signature: test" \
  -d '{"type":"test","data":{}}'
```

---

### Signature verification failing

**Check:**
1. Using correct webhook secret
2. Using raw body (not parsed JSON)
3. Signature header name is correct: `X-Link2Pay-Signature`
4. HMAC algorithm is SHA-256

---

### Events being duplicated

**Solution:**
Track processed event IDs in database:

```typescript
const alreadyProcessed = await db.processedWebhook.findUnique({
  where: { eventId: event.id }
});

if (alreadyProcessed) {
  return; // Skip duplicate
}
```

---

## Next Steps

- Read [Authentication Integration](/guide/integration/authentication)
- Learn about [Frontend Integration](/guide/integration/frontend)
- Explore [Backend Integration](/guide/integration/backend)
- Check [API Reference](/api/overview)
