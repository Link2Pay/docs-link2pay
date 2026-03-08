# Error Handling

Link2Pay uses conventional HTTP status codes and returns JSON error responses for all API failures.

## Error Response Format

All errors follow a consistent structure:

```json
{
  "error": "Human-readable error message"
}
```

**Example:**
```json
{
  "error": "Invoice not found"
}
```

## HTTP Status Codes

### Success Codes

| Status | Meaning | Usage |
|--------|---------|-------|
| `200` | OK | Successful GET, PATCH, POST request |
| `201` | Created | Resource created successfully (POST /api/invoices, /api/links) |

### Client Error Codes (4xx)

| Status | Meaning | Common Causes |
|--------|---------|---------------|
| `400` | Bad Request | Invalid request body, validation failed, business logic error |
| `401` | Unauthorized | Missing or invalid authentication token |
| `403` | Forbidden | Authenticated but not authorized for this resource |
| `404` | Not Found | Resource doesn't exist |
| `429` | Too Many Requests | Rate limit exceeded |

### Server Error Codes (5xx)

| Status | Meaning | Action |
|--------|---------|--------|
| `500` | Internal Server Error | Unexpected server error, retry after delay |
| `503` | Service Unavailable | External service (Stellar Horizon) unavailable |

## Common Errors

### Authentication Errors

#### 401: Invalid or Expired Signature

```json
{
  "error": "Invalid or expired signature. Request a new nonce from POST /api/auth/nonce"
}
```

**Cause:** The nonce has expired (>5 minutes) or signature verification failed

**Solution:**
1. Request a new nonce from `POST /api/auth/nonce`
2. Sign the new message
3. Submit the new signature

#### 401: Invalid Token

```json
{
  "error": "Invalid token"
}
```

**Cause:** JWT token is malformed, expired, or missing

**Solution:** Re-authenticate using the wallet signature flow

### Validation Errors

#### 400: Invalid Stellar Address

```json
{
  "error": "Invalid Stellar address"
}
```

**Cause:** Wallet address doesn't match Stellar format (must be 56 chars starting with `G`)

**Example:**
```typescript
// ❌ Invalid
"walletAddress": "invalid"

// ✅ Valid
"walletAddress": "GAIXVVI3IHXPCFVD4NF6NFMYNHF7ZO5J5KN3AEVD67X3ZGXNCRQQ2AIC"
```

#### 400: Invalid Network Passphrase

```json
{
  "error": "Invalid network passphrase"
}
```

**Cause:** Network passphrase is not testnet or mainnet

**Valid passphrases:**
- Testnet: `Test SDF Network ; September 2015`
- Mainnet: `Public Global Stellar Network ; September 2015`

### Resource Errors

#### 404: Invoice Not Found

```json
{
  "error": "Invoice not found"
}
```

**Cause:** Invoice ID doesn't exist or has been deleted

**Solution:** Verify the invoice ID is correct

#### 404: Link Not Found

```json
{
  "error": "Link not found"
}
```

**Cause:** Payment link ID doesn't exist or has expired

### Authorization Errors

#### 403: Unauthorized

```json
{
  "error": "Unauthorized"
}
```

**Cause:** Attempting to access a resource you don't own

**Example scenarios:**
- Accessing an invoice created by another wallet
- Updating an invoice that belongs to another user
- Deleting someone else's invoice

#### 403: Freelancer Wallet Mismatch

```json
{
  "error": "Freelancer wallet must match authenticated wallet"
}
```

**Cause:** Creating an invoice with a different freelancer wallet than your authenticated wallet

**Solution:** Ensure `freelancerWallet` in request body matches your wallet address

### Business Logic Errors

#### 400: Invoice Already Paid

```json
{
  "error": "Invoice cannot be paid. Current status: PAID"
}
```

**Cause:** Attempting to pay an invoice that's already been paid

**Solution:** Check invoice status before initiating payment

#### 400: Self-Payment

```json
{
  "error": "Cannot pay your own invoice"
}
```

**Cause:** Attempting to pay an invoice you created

**Solution:** Share the invoice link with the client/payer

#### 400: Only DRAFT Invoices Can Be Modified

```json
{
  "error": "Only invoices in DRAFT status can be modified"
}
```

**Cause:** Attempting to update/delete an invoice that's been sent (PENDING, PAID, etc.)

**Solution:** Only modify invoices in DRAFT status

### Rate Limit Errors

#### 429: Invoice Creation Limit

```json
{
  "error": "Invoice creation limit reached. Maximum 20 invoices per hour per wallet."
}
```

**Cause:** Exceeded 20 invoice creations in the last hour

**Solution:** Wait for the rate limit window to reset (check `RateLimit-Reset` header)

#### 429: Payment Link Limit

```json
{
  "error": "Payment link creation limit reached. Maximum 60 links per hour per wallet."
}
```

**Cause:** Exceeded 60 payment link creations in the last hour

**Solution:** Wait or reduce creation frequency

## Stellar Network Errors

These errors occur during payment processing and are automatically mapped from Stellar's low-level error codes.

### Operation Errors

#### op_underfunded

```json
{
  "error": "Insufficient balance. Make sure the wallet has enough XLM for amount, reserve, and fees."
}
```

**Cause:** Wallet doesn't have enough funds to complete the payment

**Details:**
- Account must maintain minimum reserve (2.5 XLM base + 0.5 XLM per trustline)
- Transaction requires ~0.00001 XLM fee
- Payment amount must be available after reserve + fee

**Example calculation:**
```
Required balance = Payment amount + Base reserve (2.5 XLM) + Trustline reserves + Fee (0.00001 XLM)
```

#### op_no_trust

```json
{
  "error": "Your wallet does not have a trustline for this asset. Please add a trustline in your wallet."
}
```

**Cause:** Attempting to pay with an asset (USDC, EURC) the sender hasn't added a trustline for

**Solution:**
1. Open Freighter wallet
2. Go to "Manage Assets"
3. Add trustline for the required asset
4. Retry payment

#### op_no_destination

```json
{
  "error": "Recipient wallet is not activated on this network. It must be funded first."
}
```

**Cause:** Recipient wallet hasn't been activated (no XLM balance)

**Solution:**
- Recipient must receive at least 1 XLM to activate their account
- Or use payment links with `activateNewAccounts: true` flag (XLM only)

#### op_line_full

```json
{
  "error": "The recipient wallet cannot receive more of this asset (limit reached)."
}
```

**Cause:** Recipient's trustline limit is full

**Solution:** Recipient must increase their trustline limit in their wallet

#### op_low_reserve

```json
{
  "error": "Insufficient reserve in the sending wallet. Keep extra XLM above the minimum account reserve."
}
```

**Cause:** Payment would bring sender below minimum reserve requirement

**Details:** Each Stellar account must maintain:
- Base reserve: 2.5 XLM
- +0.5 XLM per trustline
- +0.5 XLM per open offer
- +0.5 XLM per signer

#### op_no_issuer

```json
{
  "error": "Asset issuer account was not found on this network."
}
```

**Cause:** The asset issuer doesn't exist (usually wrong network)

**Solution:** Verify you're on the correct network (testnet vs mainnet)

#### op_src_no_trust

```json
{
  "error": "Sender wallet does not trust this asset. Add a trustline and try again."
}
```

**Cause:** Sender needs to add trustline for the payment asset

### Transaction Errors

#### tx_bad_seq

```json
{
  "error": "Transaction sequence error. Please try again."
}
```

**Cause:** Transaction sequence number is out of sync

**Solution:** Retry payment (system will fetch fresh sequence number)

#### tx_too_late

```json
{
  "error": "The transaction timed out. Please create a new payment and try again."
}
```

**Cause:** Transaction took too long to submit (>300s timeout)

**Solution:** Create a new payment intent and retry

#### tx_insufficient_fee

```json
{
  "error": "Transaction fee was too low. Please try again."
}
```

**Cause:** Network congestion required higher fee

**Solution:** Retry (system uses dynamic fee calculation)

#### tx_bad_auth

```json
{
  "error": "Transaction authorization failed. Please reconnect your wallet and sign again."
}
```

**Cause:** Signature is invalid or missing

**Solution:**
1. Reconnect Freighter wallet
2. Sign the transaction again
3. Ensure correct network is selected

### Network Errors

#### Network Mismatch

```json
{
  "error": "Network mismatch: Transaction signed for 'Test SDF Network ; September 2015' but invoice requires 'Public Global Stellar Network ; September 2015'"
}
```

**Cause:** Wallet is on different network than invoice

**Solution:**
1. Switch wallet to correct network (testnet or mainnet)
2. Retry payment

#### 429: Network Busy

```json
{
  "error": "Network is busy. Please wait a moment and try again."
}
```

**Cause:** Stellar Horizon API rate limit hit

**Solution:** Retry with exponential backoff

#### 503: Network Unavailable

```json
{
  "error": "Stellar network is temporarily unavailable. Please try again later."
}
```

**Cause:** Horizon server is down or unreachable

**Solution:** Wait and retry (check [Stellar Status Page](https://status.stellar.org/))

## Error Handling Best Practices

### 1. Display User-Friendly Messages

```typescript
async function createInvoice(data: any) {
  try {
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error);
    }

    return res.json();
  } catch (error) {
    // Display error.message to user (already user-friendly)
    showNotification('error', error.message);
  }
}
```

### 2. Implement Retry Logic

```typescript
async function submitPaymentWithRetry(xdr: string, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await submitPayment(xdr);
    } catch (error: any) {
      const isRetryable =
        error.message.includes('sequence error') ||
        error.message.includes('Network is busy') ||
        error.message.includes('temporarily unavailable');

      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s
      await new Promise(resolve =>
        setTimeout(resolve, Math.pow(2, attempt - 1) * 1000)
      );
    }
  }
}
```

### 3. Handle Specific Errors

```typescript
async function handlePaymentError(error: any) {
  const message = error.message;

  if (message.includes('no trustline')) {
    return showTrustlineInstructions();
  }

  if (message.includes('Insufficient balance')) {
    return showInsufficientFundsModal();
  }

  if (message.includes('Network mismatch')) {
    return showNetworkSwitchPrompt();
  }

  if (message.includes('not activated')) {
    return showAccountActivationInfo();
  }

  // Generic error
  showNotification('error', message);
}
```

### 4. Log Errors for Debugging

```typescript
async function logError(endpoint: string, error: any, context?: any) {
  console.error('API Error:', {
    endpoint,
    message: error.message,
    status: error.status,
    context,
    timestamp: new Date().toISOString()
  });

  // Send to error tracking service
  if (window.Sentry) {
    Sentry.captureException(error, { extra: context });
  }
}
```

## Error Reference

### Complete List

| Error Code | HTTP | Message Pattern | Retryable |
|------------|------|----------------|-----------|
| AUTH_001 | 401 | Invalid or expired signature | No |
| AUTH_002 | 401 | Invalid token | No |
| AUTH_003 | 403 | Unauthorized | No |
| VALID_001 | 400 | Invalid Stellar address | No |
| VALID_002 | 400 | Invalid network passphrase | No |
| RES_001 | 404 | Invoice not found | No |
| RES_002 | 404 | Link not found | No |
| RES_003 | 404 | Transaction not found | No |
| BIZ_001 | 400 | Invoice cannot be paid | No |
| BIZ_002 | 400 | Cannot pay your own invoice | No |
| BIZ_003 | 400 | Only DRAFT can be modified | No |
| RATE_001 | 429 | Invoice creation limit | Yes |
| RATE_002 | 429 | Payment link limit | Yes |
| RATE_003 | 429 | Price request limit | Yes |
| STELLAR_001 | 400 | op_underfunded | No |
| STELLAR_002 | 400 | op_no_trust | No |
| STELLAR_003 | 400 | op_no_destination | No |
| STELLAR_004 | 400 | op_line_full | No |
| STELLAR_005 | 400 | op_low_reserve | No |
| STELLAR_006 | 400 | tx_bad_seq | Yes |
| STELLAR_007 | 400 | tx_too_late | Yes |
| NET_001 | 429 | Network is busy | Yes |
| NET_002 | 503 | Network unavailable | Yes |

## Next Steps

- Learn about [Authentication](/api/authentication)
- Understand [Rate Limits](/api/rate-limits)
- Explore [API Endpoints](/api/endpoints/invoices)
