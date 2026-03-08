# Authentication

Link2Pay uses **passwordless wallet-based authentication** powered by ed25519 cryptographic signatures. No passwords, API keys, or OAuth flows are required.

## Authentication Flow

The authentication system uses a challenge-response mechanism:

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Freighter as Freighter Wallet

    Client->>API: POST /api/auth/nonce
    Note over Client,API: { walletAddress: "GABC..." }
    API->>API: Generate nonce
    API-->>Client: { nonce, message, expiresIn: 300 }

    Client->>Freighter: Sign message
    Note over Client,Freighter: User approves in wallet
    Freighter-->>Client: signature

    Client->>API: POST /api/auth/session
    Note over Client,API: { walletAddress, nonce, signature }
    API->>API: Verify ed25519 signature
    API-->>Client: { token, expiresAt }
```

## Step 1: Request a Nonce

Request a one-time nonce for your wallet address:

**Endpoint:** `POST /api/auth/nonce`

**Request Body:**
```json
{
  "walletAddress": "GAIXVVI3IHXPCFVD4NF6NFMYNHF7ZO5J5KN3AEVD67X3ZGXNCRQQ2AIC"
}
```

**Response:**
```json
{
  "nonce": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "message": "Link2Pay Authentication\nWallet: GAIXVVI3IHXPCFVD4NF6NFMYNHF7ZO5J5KN3AEVD67X3ZGXNCRQQ2AIC\nNonce: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6\nTimestamp: 2024-03-07T12:00:00.000Z",
  "expiresIn": 300
}
```

**Validation:**
- `walletAddress` must be a valid Stellar address (56 characters, starting with `G`)
- Nonce expires in 5 minutes (300 seconds)

## Step 2: Sign the Message

Use Freighter wallet or your Stellar keypair to sign the message returned in step 1:

```typescript
import { signAuthEntry } from '@stellar/freighter-api';

const signature = await signAuthEntry(
  message,
  { accountToSign: walletAddress }
);
```

## Step 3: Exchange for Session Token

Submit the signature to receive a session token:

**Endpoint:** `POST /api/auth/session`

**Request Body:**
```json
{
  "walletAddress": "GAIXVVI3IHXPCFVD4NF6NFMYNHF7ZO5J5KN3AEVD67X3ZGXNCRQQ2AIC",
  "nonce": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "signature": "3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d..."
}
```

**Success Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2024-03-07T13:00:00.000Z",
  "walletAddress": "GAIXVVI3IHXPCFVD4NF6NFMYNHF7ZO5J5KN3AEVD67X3ZGXNCRQQ2AIC"
}
```

**Error Response (401):**
```json
{
  "error": "Invalid or expired signature. Request a new nonce from POST /api/auth/nonce"
}
```

## Using the Session Token

Include the session token in the `Authorization` header for all authenticated requests:

```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  https://api.link2pay.dev/api/invoices
```

**Token Lifetime:**
- Session tokens are valid for 1 hour
- After expiration, repeat the authentication flow to get a new token

## Protected Endpoints

The following endpoints require authentication:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/invoices` | POST | Create invoice |
| `/api/invoices` | GET | List your invoices |
| `/api/invoices/:id/owner` | GET | Get invoice details (owner) |
| `/api/invoices/:id` | PATCH | Update invoice |
| `/api/invoices/:id/send` | POST | Send invoice |
| `/api/invoices/:id` | DELETE | Delete invoice |
| `/api/clients` | GET | List saved clients |
| `/api/clients` | POST | Save client |
| `/api/clients/:id/favorite` | PATCH | Update favorite status |
| `/api/links` | POST | Create payment link |

## Security Considerations

### Why Wallet-Based Auth?

1. **No Password Storage**: Users don't need to remember passwords or manage API keys
2. **Cryptographic Security**: Uses ed25519 signatures (same as Stellar network)
3. **Non-Custodial**: Your private keys never leave your wallet
4. **Phishing Resistant**: Users approve each signature in their wallet

### Implementation Details

- Nonces are single-use and expire in 5 minutes
- Session tokens use JWT with HS256 signing
- Signatures are verified using `@stellar/stellar-sdk`'s `Keypair.verify()` method
- Failed authentication attempts are rate-limited (see [Rate Limits](/api/rate-limits))

## Example: Complete Authentication Flow

```typescript
import { signAuthEntry } from '@stellar/freighter-api';

async function authenticate(walletAddress: string) {
  // Step 1: Request nonce
  const nonceRes = await fetch('https://api.link2pay.dev/api/auth/nonce', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress })
  });
  const { nonce, message } = await nonceRes.json();

  // Step 2: Sign with Freighter
  const signature = await signAuthEntry(message, {
    accountToSign: walletAddress
  });

  // Step 3: Get session token
  const sessionRes = await fetch('https://api.link2pay.dev/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress, nonce, signature })
  });
  const { token, expiresAt } = await sessionRes.json();

  return { token, expiresAt };
}

// Use the token
const { token } = await authenticate(myWalletAddress);

const invoices = await fetch('https://api.link2pay.dev/api/invoices', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

## Error Codes

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Invalid Stellar address | Wallet address format is invalid |
| 401 | Invalid or expired signature | Signature verification failed or nonce expired |
| 401 | Authentication required | No Authorization header provided |
| 401 | Invalid token | Token is malformed or expired |
| 429 | Too many requests | Rate limit exceeded (see [Rate Limits](/api/rate-limits)) |

## Next Steps

- Learn about [Rate Limits](/api/rate-limits)
- Explore [Invoice Endpoints](/api/endpoints/invoices)
- Check [Integration Guide](/guide/integration/authentication)
