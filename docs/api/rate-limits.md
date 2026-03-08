# Rate Limits

Link2Pay implements rate limiting to protect the API from abuse and ensure fair usage for all users.

## Overview

Rate limits are applied per endpoint and are keyed by:
- **Authenticated requests**: Wallet address
- **Unauthenticated requests**: IP address

## Global Rate Limits

All endpoints have a default rate limit:

| Limit | Window | Description |
|-------|--------|-------------|
| **100 requests** | per minute | General API rate limit |

**Response Headers:**
```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1709816460
```

## Endpoint-Specific Limits

### Invoice Creation

**Endpoint:** `POST /api/invoices`

| Limit | Window | Key |
|-------|--------|-----|
| **20 invoices** | per hour | Wallet address |

**Purpose:** Prevent invoice spam and DoS attacks (DoS.2 mitigation)

**Error Response (429):**
```json
{
  "error": "Invoice creation limit reached. Maximum 20 invoices per hour per wallet."
}
```

### Payment Link Creation

**Endpoint:** `POST /api/links`

| Limit | Window | Key |
|-------|--------|-----|
| **60 links** | per hour | Wallet address |

**Purpose:** Prevent payment link abuse

**Error Response (429):**
```json
{
  "error": "Payment link creation limit reached. Maximum 60 links per hour per wallet."
}
```

### Price Feed

**Endpoint:** `GET /api/prices/xlm`

| Limit | Window | Key |
|-------|--------|-----|
| **30 requests** | per minute | IP address |

**Purpose:** Protect CoinGecko API quota

**Error Response (429):**
```json
{
  "error": "Too many price requests"
}
```

**Note:** Price data is cached for 60 seconds server-side, so clients should implement their own caching.

## Rate Limit Headers

All responses include rate limit information in headers:

```http
HTTP/1.1 200 OK
RateLimit-Limit: 20
RateLimit-Remaining: 18
RateLimit-Reset: 1709816460
X-RateLimit-Policy: 20;w=3600;comment="invoice creation limit"
```

**Header Descriptions:**

| Header | Description |
|--------|-------------|
| `RateLimit-Limit` | Maximum requests allowed in the window |
| `RateLimit-Remaining` | Requests remaining in current window |
| `RateLimit-Reset` | Unix timestamp when the window resets |
| `X-RateLimit-Policy` | Human-readable policy description |

## Handling Rate Limits

### Strategy 1: Respect the Headers

Check `RateLimit-Remaining` before making requests:

```typescript
async function createInvoiceWithBackoff(invoiceData: any) {
  const res = await fetch('https://api.link2pay.dev/api/invoices', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(invoiceData)
  });

  const remaining = parseInt(res.headers.get('RateLimit-Remaining') || '0');
  const reset = parseInt(res.headers.get('RateLimit-Reset') || '0');

  if (res.status === 429) {
    const waitTime = (reset * 1000) - Date.now();
    console.log(`Rate limited. Retrying in ${waitTime}ms`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
    return createInvoiceWithBackoff(invoiceData);
  }

  if (remaining < 3) {
    console.warn(`Only ${remaining} requests remaining`);
  }

  return res.json();
}
```

### Strategy 2: Exponential Backoff

Implement exponential backoff for 429 responses:

```typescript
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const res = await fetch(url, options);

    if (res.status !== 429) {
      return res;
    }

    const resetHeader = res.headers.get('RateLimit-Reset');
    if (resetHeader) {
      const waitTime = (parseInt(resetHeader) * 1000) - Date.now();
      await new Promise(resolve => setTimeout(resolve, Math.max(waitTime, 0)));
    } else {
      // Exponential backoff: 1s, 2s, 4s
      const backoff = Math.pow(2, i) * 1000;
      await new Promise(resolve => setTimeout(resolve, backoff));
    }
  }

  throw new Error('Max retries exceeded');
}
```

### Strategy 3: Client-Side Caching

Cache responses to reduce API calls:

```typescript
// Cache price data for 60 seconds
const priceCache = new Map<string, { value: number; expiresAt: number }>();

async function getXLMPrice(): Promise<number> {
  const cached = priceCache.get('xlm');
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const res = await fetch('https://api.link2pay.dev/api/prices/xlm');
  const { usd } = await res.json();

  priceCache.set('xlm', {
    value: usd,
    expiresAt: Date.now() + 60_000 // 60 seconds
  });

  return usd;
}
```

## Rate Limit Bypass

Rate limits **cannot be bypassed**. All users are subject to the same limits to ensure platform stability and fairness.

### Enterprise Plans

For higher rate limits, contact us at [enterprise@link2pay.dev](mailto:enterprise@link2pay.dev) to discuss custom plans.

## Best Practices

### 1. Batch Operations

Instead of creating invoices one at a time, batch them:

```typescript
// ❌ Bad: 10 separate requests
for (const client of clients) {
  await createInvoice(client);
}

// ✅ Good: Queue and batch
const queue = clients.map(client => ({
  client,
  invoice: buildInvoiceData(client)
}));

// Create with delays to respect rate limits
for (const item of queue) {
  await createInvoice(item.invoice);
  await sleep(200); // 5 requests per second = 300/hour
}
```

### 2. Local State Management

Minimize GET requests by caching data locally:

```typescript
// Cache invoice list
const invoiceCache = {
  data: [],
  lastFetch: 0,
  ttl: 30_000 // 30 seconds
};

async function getInvoices() {
  if (Date.now() - invoiceCache.lastFetch < invoiceCache.ttl) {
    return invoiceCache.data;
  }

  const data = await fetch('/api/invoices').then(r => r.json());
  invoiceCache.data = data;
  invoiceCache.lastFetch = Date.now();
  return data;
}
```

### 3. Webhook Events

Use webhooks instead of polling:

```typescript
// ❌ Bad: Poll every 5 seconds
setInterval(async () => {
  const status = await checkInvoiceStatus(invoiceId);
}, 5000);

// ✅ Good: Use payment watcher + webhooks
// See /guide/integration/webhooks
```

## Rate Limit Errors

### 429 Too Many Requests

```json
{
  "error": "Invoice creation limit reached. Maximum 20 invoices per hour per wallet."
}
```

**Solution:**
1. Wait until the rate limit window resets (check `RateLimit-Reset` header)
2. Implement exponential backoff
3. Reduce request frequency

### 503 Service Unavailable

```json
{
  "error": "Price feed temporarily unavailable"
}
```

**Cause:** External API (CoinGecko) rate limit exceeded

**Solution:**
- Use cached/stale price data (the API returns cached prices with `stale: true`)
- Implement client-side caching (60 second TTL)

## Monitoring Rate Limits

Track your rate limit usage:

```typescript
class RateLimitMonitor {
  private limits = new Map<string, { remaining: number; reset: number }>();

  recordResponse(endpoint: string, headers: Headers) {
    this.limits.set(endpoint, {
      remaining: parseInt(headers.get('RateLimit-Remaining') || '0'),
      reset: parseInt(headers.get('RateLimit-Reset') || '0')
    });
  }

  getStatus(endpoint: string) {
    return this.limits.get(endpoint);
  }

  isNearLimit(endpoint: string, threshold = 5): boolean {
    const status = this.limits.get(endpoint);
    return status ? status.remaining < threshold : false;
  }
}
```

## Summary

| Endpoint | Limit | Window | Key |
|----------|-------|--------|-----|
| Global default | 100 | 1 minute | Wallet/IP |
| `POST /api/invoices` | 20 | 1 hour | Wallet |
| `POST /api/links` | 60 | 1 hour | Wallet |
| `GET /api/prices/xlm` | 30 | 1 minute | IP |

## Next Steps

- Implement [Error Handling](/api/errors)
- Read [Authentication Guide](/api/authentication)
- Explore [API Endpoints](/api/endpoints/invoices)
