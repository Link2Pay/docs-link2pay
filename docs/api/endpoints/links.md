# Payment Links Endpoints

Payment links provide a simple way to request cryptocurrency payments via shareable URLs. No invoice creation required—just specify amount and asset.

## Overview

Payment links are lightweight payment intents that:
- Generate instantly (no multi-step invoice creation)
- Support custom metadata
- Auto-expire after timeout
- Can activate new Stellar accounts (XLM only)

**Use Cases:**
- One-time payment requests
- Instant checkout experiences
- Crowdfunding/donations
- Event tickets or subscriptions

---

## Create Payment Link

Generate a new payment link with hosted checkout URL.

**Endpoint:** `POST /api/links`

**Authentication:** Required (wallet signature)

**Rate Limit:** 60 links per hour per wallet

**Request Body:**

```json
{
  "amount": 100.50,
  "asset": "USDC",
  "recipientWallet": "GABC123...",
  "expiresAt": "2024-03-07T13:00:00.000Z",
  "networkPassphrase": "Test SDF Network ; September 2015",
  "metadata": {
    "title": "Premium Subscription",
    "description": "Monthly premium plan",
    "reference": "SUB-2024-001",
    "payerName": "Customer Name",
    "payerEmail": "customer@example.com"
  },
  "activateNewAccounts": false
}
```

**Request Schema:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `amount` | number | Yes | Payment amount (must be > 0) |
| `asset` | string | Yes | Asset code: `XLM`, `USDC`, or `EURC` |
| `recipientWallet` | string | No | Recipient address (defaults to authenticated wallet) |
| `expiresAt` | string | No | ISO timestamp (default: 15 minutes) |
| `networkPassphrase` | string | Yes | Stellar network passphrase |
| `metadata.title` | string | No | Link title (default: "Payment Link") |
| `metadata.description` | string | No | Payment description |
| `metadata.reference` | string | No | External reference ID |
| `metadata.payerName` | string | No | Payer display name |
| `metadata.payerEmail` | string | No | Payer email (not exposed publicly) |
| `activateNewAccounts` | boolean | No | Enable account activation (XLM only, amount ≥ 1) |

**Success Response (201):**

```json
{
  "id": "cm123abc456def",
  "status": "PENDING",
  "checkoutUrl": "https://app.link2pay.dev/pay/cm123abc456def",
  "amount": "100.50",
  "asset": "USDC",
  "createdAt": "2024-03-07T12:00:00.000Z",
  "expiresAt": "2024-03-07T13:00:00.000Z",
  "metadata": {
    "title": "Premium Subscription",
    "description": "Monthly premium plan",
    "reference": "SUB-2024-001",
    "payerName": "Customer Name",
    "payerEmail": "customer@example.com"
  },
  "activateNewAccounts": false,
  "legacyInvoiceId": "cm123abc456def",
  "legacyInvoiceNumber": "INV-0001"
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique payment link ID |
| `status` | string | Link status: `PENDING`, `CONFIRMED`, `EXPIRED`, etc. |
| `checkoutUrl` | string | Hosted checkout page URL (shareable) |
| `amount` | string | Payment amount |
| `asset` | string | Asset code |
| `createdAt` | string | ISO timestamp of creation |
| `expiresAt` | string | ISO timestamp of expiration |
| `metadata` | object | Custom metadata |
| `activateNewAccounts` | boolean | Whether account activation is enabled |
| `legacyInvoiceId` | string | Internal invoice ID (for compatibility) |
| `legacyInvoiceNumber` | string | Internal invoice number |

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Invalid expiresAt date | Date format invalid or in the past |
| 400 | expiresAt must be in the future | Expiration date has passed |
| 400 | activateNewAccounts is supported only for XLM | Non-XLM asset with activation flag |
| 400 | activateNewAccounts requires amount >= 1 XLM | Amount too low for activation |
| 403 | Recipient wallet must match authenticated wallet | Recipient mismatch |
| 429 | Payment link creation limit reached | Rate limit: 60/hour exceeded |

**Example:**

```bash
curl -X POST https://api.link2pay.dev/api/links \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100.50,
    "asset": "USDC",
    "networkPassphrase": "Test SDF Network ; September 2015",
    "metadata": {
      "title": "Premium Subscription",
      "reference": "SUB-2024-001"
    }
  }'
```

**Usage Notes:**

- Default expiration: 15 minutes from creation
- Maximum expiration: No hard limit, but recommended < 24 hours
- Link status automatically changes to `PENDING` after creation
- `checkoutUrl` is the shareable payment page
- `recipientWallet` defaults to authenticated wallet (cannot differ in current version)

---

## Get Payment Link

Retrieve full details of a payment link.

**Endpoint:** `GET /api/links/:id`

**Authentication:** Not required (public endpoint)

**Parameters:**

| Parameter | Type | Location | Required | Description |
|-----------|------|----------|----------|-------------|
| `id` | string | Path | Yes | Payment link ID |

**Success Response (200):**

```json
{
  "id": "cm123abc456def",
  "status": "CONFIRMED",
  "checkoutUrl": "https://app.link2pay.dev/pay/cm123abc456def",
  "amount": "100.50",
  "asset": "USDC",
  "createdAt": "2024-03-07T12:00:00.000Z",
  "expiresAt": "2024-03-07T13:00:00.000Z",
  "metadata": {
    "title": "Premium Subscription",
    "description": "Monthly premium plan",
    "reference": "SUB-2024-001",
    "payerName": "Customer Name",
    "payerEmail": null
  },
  "activateNewAccounts": false,
  "transactionHash": "7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b",
  "confirmedAt": "2024-03-07T12:05:00.000Z",
  "legacyInvoiceId": "cm123abc456def",
  "legacyInvoiceNumber": "INV-0001"
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 404 | Link not found | Invalid link ID |
| 500 | Failed to fetch link | Server error |

**Example:**

```bash
curl https://api.link2pay.dev/api/links/cm123abc456def
```

**Usage Notes:**

- Public endpoint (no authentication required)
- Returns `transactionHash` and `confirmedAt` after payment
- Email addresses are hidden in public responses (`payerEmail: null`)

---

## Get Payment Link Status

Lightweight status endpoint for polling.

**Endpoint:** `GET /api/links/:id/status`

**Authentication:** Not required (public endpoint)

**Parameters:**

| Parameter | Type | Location | Required | Description |
|-----------|------|----------|----------|-------------|
| `id` | string | Path | Yes | Payment link ID |

**Success Response (200):**

```json
{
  "id": "cm123abc456def",
  "status": "CONFIRMED",
  "transactionHash": "7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b",
  "confirmedAt": "2024-03-07T12:05:00.000Z",
  "expiresAt": "2024-03-07T13:00:00.000Z"
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Payment link ID |
| `status` | string | Link status |
| `transactionHash` | string \| null | Stellar transaction hash (if paid) |
| `confirmedAt` | string \| null | ISO timestamp of confirmation |
| `expiresAt` | string \| null | ISO timestamp of expiration |

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 404 | Link not found | Invalid link ID |
| 500 | Failed to fetch link status | Server error |

**Example:**

```bash
curl https://api.link2pay.dev/api/links/cm123abc456def/status
```

**Usage Notes:**

- Optimized for polling (minimal response size)
- Recommended polling interval: 5 seconds
- Use for real-time payment status updates

---

## Payment Link Statuses

| Status | Description | Final? |
|--------|-------------|--------|
| `CREATED` | Link created (internal state) | No |
| `PENDING` | Awaiting payment | No |
| `CONFIRMED` | Payment confirmed on-chain | Yes |
| `EXPIRED` | Passed expiration without payment | Yes |
| `FAILED` | Payment failed | Yes |
| `CANCELLED` | Cancelled by owner | Yes |

**Status Mapping:**

Payment links use invoices internally, with status mapping:

| Invoice Status | Link Status |
|----------------|-------------|
| `DRAFT` | `CREATED` |
| `PENDING` | `PENDING` |
| `PROCESSING` | `PENDING` |
| `PAID` | `CONFIRMED` |
| `EXPIRED` | `EXPIRED` |
| `FAILED` | `FAILED` |
| `CANCELLED` | `CANCELLED` |

---

## Account Activation Feature

Payment links can automatically activate new Stellar accounts.

**Requirements:**
- Asset must be `XLM`
- Amount must be ≥ 1 XLM
- Set `activateNewAccounts: true`

**How It Works:**

When a payer's wallet is not yet activated on the Stellar network:
1. System detects `op_no_destination` error
2. Automatically creates account with 1+ XLM
3. Remaining amount sent as normal payment

**Example:**

```json
{
  "amount": 5.0,
  "asset": "XLM",
  "activateNewAccounts": true,
  "metadata": {
    "title": "Welcome Gift",
    "description": "Activate your Stellar wallet"
  }
}
```

**Result:**
- If payer's wallet is new: 1 XLM creates account, 4 XLM sent as payment
- If payer's wallet exists: Full 5 XLM sent as payment

**Limitations:**
- Only works with XLM (native asset)
- Minimum 1 XLM required
- Cannot activate accounts for non-native assets

---

## Complete Example

### Create and Share Link

```typescript
// 1. Authenticate
const { token } = await authenticate(walletAddress);

// 2. Create payment link
const link = await fetch('https://api.link2pay.dev/api/links', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    amount: 50,
    asset: 'USDC',
    networkPassphrase: 'Test SDF Network ; September 2015',
    metadata: {
      title: 'Freelance Work - March 2024',
      reference: 'PROJECT-123'
    },
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
  })
}).then(r => r.json());

console.log('Share this link:', link.checkoutUrl);
// https://app.link2pay.dev/pay/cm123abc456def

// 3. Monitor status
async function pollStatus(linkId: string) {
  const status = await fetch(`https://api.link2pay.dev/api/links/${linkId}/status`)
    .then(r => r.json());

  if (status.status === 'CONFIRMED') {
    console.log('Payment received!', status.transactionHash);
    return true;
  }

  if (status.status === 'EXPIRED') {
    console.log('Link expired without payment');
    return true;
  }

  // Continue polling
  return false;
}

// Poll every 5 seconds
const pollInterval = setInterval(async () => {
  const done = await pollStatus(link.id);
  if (done) clearInterval(pollInterval);
}, 5000);
```

### Customer Payment Flow

1. Customer opens `checkoutUrl`
2. Payment page displays amount, asset, and metadata
3. Customer connects Freighter wallet
4. Customer approves transaction
5. Payment submits to Stellar network
6. Link status changes to `CONFIRMED`

---

## Integration Patterns

### Pattern 1: Simple Donation Button

```typescript
async function createDonationLink(amount: number) {
  const link = await createPaymentLink({
    amount,
    asset: 'XLM',
    activateNewAccounts: true, // Support new users
    metadata: {
      title: 'Support Our Project',
      description: 'Thank you for your donation!'
    }
  });

  window.location.href = link.checkoutUrl;
}
```

### Pattern 2: E-commerce Checkout

```typescript
async function checkoutCart(cart: CartItem[]) {
  const total = cart.reduce((sum, item) => sum + item.price, 0);

  const link = await createPaymentLink({
    amount: total,
    asset: 'USDC',
    metadata: {
      title: `Order #${orderId}`,
      description: cart.map(i => i.name).join(', '),
      reference: orderId,
      payerName: customer.name,
      payerEmail: customer.email
    },
    expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 min checkout
  });

  return link.checkoutUrl;
}
```

### Pattern 3: Subscription Payment

```typescript
async function createSubscriptionPayment(userId: string, plan: Plan) {
  const link = await createPaymentLink({
    amount: plan.price,
    asset: 'USDC',
    metadata: {
      title: `${plan.name} Subscription`,
      description: `Monthly subscription for ${userId}`,
      reference: `SUB-${userId}-${Date.now()}`,
      payerEmail: user.email
    },
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  });

  // Send link via email
  await sendEmail(user.email, 'Complete Your Subscription', link.checkoutUrl);

  return link;
}
```

---

## Best Practices

### 1. Set Appropriate Expiration

```typescript
// ❌ Too short (user might not finish in time)
expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

// ✅ Good for checkout
expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

// ✅ Good for invoices/subscriptions
expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
```

### 2. Use Meaningful Metadata

```typescript
// ❌ Generic
metadata: {
  title: 'Payment Link'
}

// ✅ Descriptive
metadata: {
  title: 'Invoice #INV-2024-001',
  description: 'Web development services - March 2024',
  reference: 'CLIENT-ABC-001'
}
```

### 3. Handle Errors Gracefully

```typescript
async function createLinkWithRetry(data: any, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await createPaymentLink(data);
    } catch (error: any) {
      if (error.status === 429) {
        // Rate limited, wait and retry
        await new Promise(resolve => setTimeout(resolve, 60000));
      } else {
        throw error;
      }
    }
  }
  throw new Error('Max retries exceeded');
}
```

---

## Next Steps

- Learn about [Invoice Endpoints](/api/endpoints/invoices)
- Understand [Payment Flow](/api/endpoints/payments)
- Explore [Integration Guide](/guide/integration/frontend)
