# API Overview

The Link2Pay API is a RESTful API that enables you to programmatically create invoices, process payments, and manage your payment infrastructure on the Stellar blockchain.

## Base URL

**Production:**
```
https://api.link2pay.dev/api
```

**Development:**
```
http://localhost:3001/api
```

## Authentication

Link2Pay uses **cryptographic authentication** via ed25519 signatures. No API keys, no passwords - just your Stellar wallet.

### Quick Example

```typescript
// 1. Get a nonce
const { nonce, message } = await fetch('/api/auth/nonce', {
  method: 'POST',
  body: JSON.stringify({ walletAddress: 'G...' })
}).then(r => r.json());

// 2. Sign the message with Freighter
const signature = await window.freighter.signMessage(message);

// 3. Make authenticated requests
const response = await fetch('/api/invoices', {
  headers: {
    'x-wallet-address': 'G...',
    'x-auth-nonce': nonce,
    'x-auth-signature': signature
  }
});
```

[Full Authentication Guide →](/api/authentication)

## Rate Limits

Different endpoints have different rate limits to ensure fair usage:

| Endpoint Type | Rate Limit | Window |
|---------------|------------|--------|
| Global (all requests) | 100 requests | 15 minutes |
| Invoice creation | 20 requests | 1 hour |
| Payment intent | 10 requests | 5 minutes |
| Price feeds | 30 requests | 1 minute |

Rate limit headers are included in all responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

[Rate Limits Details →](/api/rate-limits)

## Response Format

All API responses follow a consistent JSON structure.

### Success Response

```json
{
  "success": true,
  "data": {
    "id": "clx7k8q9a0001...",
    "invoiceNumber": "INV-001",
    "amount": 100,
    "currency": "USDC"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid invoice data",
    "details": {
      "amount": "Amount must be positive"
    }
  }
}
```

[Error Codes Reference →](/api/errors)

## Pagination

List endpoints support pagination via query parameters:

```http
GET /api/invoices?limit=20&offset=40
```

**Parameters:**
- `limit`: Number of results (default: 20, max: 100)
- `offset`: Number of results to skip (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 150,
    "limit": 20,
    "offset": 40,
    "hasMore": true
  }
}
```

## Filtering & Sorting

Most list endpoints support filtering:

```http
GET /api/invoices?status=PENDING&currency=USDC&sort=dueDate:asc
```

**Common filters:**
- `status`: Invoice status (DRAFT, PENDING, PAID, etc.)
- `currency`: Asset type (XLM, USDC, EURC)
- `network`: Network passphrase (testnet/mainnet)
- `clientEmail`: Exact match on client email

**Sorting:**
- Format: `field:direction`
- Example: `dueDate:asc`, `createdAt:desc`

## Idempotency

Payment submission endpoints support idempotency to prevent duplicate transactions:

```http
POST /api/payments/submit
Idempotency-Key: unique-key-12345
```

If you retry a request with the same `Idempotency-Key`, you'll receive the original response without re-processing.

## Webhooks

Link2Pay can send real-time webhook events when invoices are paid:

```http
POST /api/webhooks
Content-Type: application/json

{
  "url": "https://yourapp.com/webhooks/link2pay",
  "events": ["invoice.paid", "invoice.expired"]
}
```

[Webhook Guide →](/guide/integration/webhooks)

## SDKs & Libraries

Official SDKs make integration even easier:

### TypeScript/JavaScript

```bash
npm install @link2pay/sdk
```

```typescript
import { Link2Pay } from '@link2pay/sdk';

const client = new Link2Pay({
  wallet: freighter,
  network: 'testnet'
});

const invoice = await client.invoices.create({
  clientName: "Acme Corp",
  amount: 100,
  currency: "USDC"
});
```

[SDK Documentation →](/sdk/overview)

### Community SDKs

- **Python**: `pip install link2pay` (community-maintained)
- **Go**: `go get github.com/link2pay/go-sdk` (community-maintained)

[Contribute a SDK →](https://github.com/Link2Pay)

## API Endpoints Overview

### Authentication
- `POST /auth/nonce` - Request authentication nonce

### Invoices
- `POST /invoices` - Create invoice
- `GET /invoices` - List invoices
- `GET /invoices/:id` - Get invoice (public view)
- `GET /invoices/:id/owner` - Get invoice (owner view)
- `PATCH /invoices/:id` - Update invoice
- `POST /invoices/:id/send` - Send invoice
- `DELETE /invoices/:id` - Delete invoice
- `GET /invoices/stats` - Get dashboard statistics

### Payments
- `POST /payments/:id/pay-intent` - Build payment transaction
- `POST /payments/submit` - Submit signed transaction
- `POST /payments/confirm` - Manual payment confirmation
- `GET /payments/:id/status` - Check payment status
- `POST /payments/verify-tx` - Verify transaction on-chain

### Payment Links
- `POST /links` - Create payment link
- `GET /links/:id` - Get link details
- `GET /links/:id/status` - Get link status

### Clients
- `GET /clients` - List saved clients
- `POST /clients` - Save new client
- `PATCH /clients/:id/favorite` - Toggle favorite
- `DELETE /clients/:id` - Delete client

### Prices
- `GET /prices/xlm` - Get XLM/USD price

[Detailed Endpoint Reference →](/api/endpoints/invoices)

## Request Examples

### Create Invoice

```bash
curl -X POST https://api.link2pay.dev/api/invoices \
  -H "Content-Type: application/json" \
  -H "x-wallet-address: GXXXXXX..." \
  -H "x-auth-nonce: abc123..." \
  -H "x-auth-signature: def456..." \
  -d '{
    "clientName": "Acme Corporation",
    "clientEmail": "billing@acme.com",
    "amount": 1000,
    "currency": "USDC",
    "dueDate": "2024-12-31",
    "items": [
      {
        "description": "Web Development",
        "quantity": 40,
        "rate": 25
      }
    ]
  }'
```

### List Invoices

```bash
curl -X GET "https://api.link2pay.dev/api/invoices?status=PENDING&limit=10" \
  -H "x-wallet-address: GXXXXXX..." \
  -H "x-auth-nonce: abc123..." \
  -H "x-auth-signature: def456..."
```

### Process Payment

```bash
# Step 1: Get payment intent (unsigned transaction)
curl -X POST https://api.link2pay.dev/api/payments/invoice-123/pay-intent \
  -H "Content-Type: application/json" \
  -d '{
    "payerAddress": "GXXXXXX..."
  }'

# Returns: { "xdr": "AAAAAgAAAA..." }

# Step 2: Sign XDR with Freighter (client-side)

# Step 3: Submit signed transaction
curl -X POST https://api.link2pay.dev/api/payments/submit \
  -H "Content-Type: application/json" \
  -d '{
    "signedXdr": "AAAAAgAAAA...",
    "invoiceId": "invoice-123"
  }'
```

## OpenAPI Specification

Download the complete OpenAPI 3.0 specification:

```
https://api.link2pay.dev/openapi.json
```

Import into tools like:
- Postman
- Insomnia
- Swagger UI
- API testing frameworks

## Versioning

Current API version: **v1** (implicit in URL)

Breaking changes will be introduced in new versions (`/api/v2/...`) while maintaining backward compatibility with v1 for at least 12 months.

Non-breaking changes (new fields, new optional parameters) are deployed continuously to the current version.

## Best Practices

### 1. Cache Nonces Responsibly

Nonces are valid for 5 minutes. Cache them in your application to avoid excessive nonce requests:

```typescript
const nonceCache = new Map();

async function getValidNonce(wallet) {
  const cached = nonceCache.get(wallet);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.nonce;
  }

  const { nonce } = await fetchNonce(wallet);
  nonceCache.set(wallet, {
    nonce,
    expiresAt: Date.now() + 4 * 60 * 1000 // 4 minutes (safety margin)
  });

  return nonce;
}
```

### 2. Handle Rate Limits Gracefully

Implement exponential backoff when hitting rate limits:

```typescript
async function apiCall(url, options, retries = 3) {
  try {
    const response = await fetch(url, options);

    if (response.status === 429) {
      if (retries > 0) {
        const retryAfter = response.headers.get('Retry-After') || 60;
        await sleep(retryAfter * 1000);
        return apiCall(url, options, retries - 1);
      }
    }

    return response;
  } catch (error) {
    if (retries > 0) {
      await sleep(1000 * (4 - retries));
      return apiCall(url, options, retries - 1);
    }
    throw error;
  }
}
```

### 3. Validate Webhooks

Always verify webhook signatures to ensure they're from Link2Pay:

```typescript
function verifyWebhook(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const expected = hmac.digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
```

### 4. Handle Network Detection

Always check which network an invoice belongs to:

```typescript
const invoice = await api.getInvoice(id);

if (invoice.networkPassphrase !== expectedNetwork) {
  throw new Error(`Invoice is on ${invoice.network}, switch networks`);
}
```

### 5. Monitor Transaction Status

Poll payment status after submission:

```typescript
async function waitForPayment(invoiceId, timeout = 60000) {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const { status } = await api.getPaymentStatus(invoiceId);

    if (status === 'PAID') {
      return true;
    }

    if (status === 'FAILED') {
      return false;
    }

    await sleep(2000); // Poll every 2 seconds
  }

  throw new Error('Payment timeout');
}
```

## Support

Need help with the API?

- 📚 [API Reference](/api/endpoints/invoices) - Detailed endpoint documentation
- 💬 [Discord Community](#) - Ask questions, get help
- 🐛 [GitHub Issues](https://github.com/Link2Pay/link2pay-app/issues) - Report bugs
- 📧 [Email Support](mailto:api@link2pay.dev) - Technical support

## Status & Uptime

Check API status:
- Status Page: https://status.link2pay.dev
- Health Endpoint: `GET /health`

Current uptime: 99.9% (30-day average)
