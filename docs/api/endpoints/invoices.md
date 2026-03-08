# Invoice Endpoints

Comprehensive API reference for invoice management.

## Create Invoice

<span class="http-method post">POST</span> `/api/invoices`

Create a new invoice in DRAFT status.

### Authentication

Required. See [Authentication](/api/authentication).

### Rate Limit

**20 requests per hour** per wallet address.

### Request Body

```typescript
{
  clientName: string;           // Required, max 100 chars
  clientEmail: string;          // Required, valid email
  amount: number;               // Required, > 0
  currency: "XLM" | "USDC" | "EURC";  // Required
  dueDate: string;              // Optional, ISO 8601 date
  invoiceNumber?: string;       // Optional, auto-generated if blank
  taxRate?: number;             // Optional, 0-100
  discount?: number;            // Optional, >= 0
  notes?: string;               // Optional, max 500 chars
  items: Array<{
    description: string;        // Required, max 200 chars
    quantity: number;           // Required, > 0
    rate: number;               // Required, >= 0
  }>;
}
```

### Example Request

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
    "dueDate": "2024-12-31T23:59:59Z",
    "taxRate": 10,
    "discount": 50,
    "notes": "Net 30 payment terms",
    "items": [
      {
        "description": "Website Development - Phase 1",
        "quantity": 40,
        "rate": 25
      },
      {
        "description": "Logo Design",
        "quantity": 1,
        "rate": 500
      }
    ]
  }'
```

### Example Response

```json
{
  "success": true,
  "data": {
    "id": "clx7k8q9a0001mg08y2h3z8k4",
    "invoiceNumber": "INV-20240115-A7K3",
    "freelancerWallet": "GXXXXXX...",
    "clientName": "Acme Corporation",
    "clientEmail": "billing@acme.com",
    "amount": 1000,
    "currency": "USDC",
    "taxRate": 10,
    "discount": 50,
    "totalAmount": 1050,
    "dueDate": "2024-12-31T23:59:59.000Z",
    "notes": "Net 30 payment terms",
    "status": "DRAFT",
    "networkPassphrase": "Test SDF Network ; September 2015",
    "items": [
      {
        "id": "item-1",
        "description": "Website Development - Phase 1",
        "quantity": 40,
        "rate": 25,
        "amount": 1000
      },
      {
        "id": "item-2",
        "description": "Logo Design",
        "quantity": 1,
        "rate": 500,
        "amount": 500
      }
    ],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "paymentLink": "https://app.link2pay.dev/pay/clx7k8q9a0001mg08y2h3z8k4"
  }
}
```

### Error Responses

**400 Bad Request** - Validation error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid invoice data",
    "details": {
      "amount": "Amount must be positive",
      "clientEmail": "Invalid email format"
    }
  }
}
```

**401 Unauthorized** - Invalid authentication
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid authentication credentials"
  }
}
```

**429 Too Many Requests** - Rate limit exceeded
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many invoice creations. Try again in 45 minutes.",
    "retryAfter": 2700
  }
}
```

---

## List Invoices

<span class="http-method get">GET</span> `/api/invoices`

Retrieve all invoices for authenticated wallet.

### Authentication

Required.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 20 | Results per page (max 100) |
| `offset` | number | 0 | Number of results to skip |
| `status` | string | - | Filter by status |
| `currency` | string | - | Filter by currency |
| `network` | string | - | Filter by network |
| `sort` | string | `createdAt:desc` | Sort field and direction |

### Example Request

```bash
curl -X GET "https://api.link2pay.dev/api/invoices?status=PENDING&limit=10&sort=dueDate:asc" \
  -H "x-wallet-address: GXXXXXX..." \
  -H "x-auth-nonce: abc123..." \
  -H "x-auth-signature: def456..."
```

### Example Response

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "clx7k8q9a0001mg08y2h3z8k4",
        "invoiceNumber": "INV-20240115-A7K3",
        "clientName": "Acme Corporation",
        "amount": 1000,
        "currency": "USDC",
        "status": "PENDING",
        "dueDate": "2024-12-31T23:59:59.000Z",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "paymentLink": "https://app.link2pay.dev/pay/clx7k8q9a0001mg08y2h3z8k4"
      }
    ],
    "total": 45,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

---

## Get Invoice (Public)

<span class="http-method get">GET</span> `/api/invoices/:id`

Retrieve public invoice details (no authentication required).

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Invoice ID |

### Response

Returns limited invoice data (excludes sensitive information like freelancer wallet address).

```json
{
  "success": true,
  "data": {
    "id": "clx7k8q9a0001mg08y2h3z8k4",
    "invoiceNumber": "INV-20240115-A7K3",
    "clientName": "Acme Corporation",
    "amount": 1000,
    "currency": "USDC",
    "totalAmount": 1050,
    "status": "PENDING",
    "dueDate": "2024-12-31T23:59:59.000Z",
    "items": [...],
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## Get Invoice (Owner)

<span class="http-method get">GET</span> `/api/invoices/:id/owner`

Retrieve complete invoice details (authentication required, owner only).

### Authentication

Required. Must be invoice owner.

### Response

Returns complete invoice data including wallet addresses, payments, and audit logs.

```json
{
  "success": true,
  "data": {
    "id": "clx7k8q9a0001mg08y2h3z8k4",
    "freelancerWallet": "GXXXXXX...",
    "invoiceNumber": "INV-20240115-A7K3",
    "clientName": "Acme Corporation",
    "clientEmail": "billing@acme.com",
    "amount": 1000,
    "currency": "USDC",
    "status": "PAID",
    "networkPassphrase": "Test SDF Network ; September 2015",
    "items": [...],
    "payments": [
      {
        "id": "payment-1",
        "transactionHash": "abc123...",
        "amount": 1050,
        "currency": "USDC",
        "confirmedAt": "2024-01-15T11:00:00.000Z"
      }
    ],
    "auditLog": [
      {
        "action": "CREATED",
        "actorWallet": "GXXXXXX...",
        "timestamp": "2024-01-15T10:30:00.000Z"
      },
      {
        "action": "SENT",
        "actorWallet": "GXXXXXX...",
        "timestamp": "2024-01-15T10:35:00.000Z"
      },
      {
        "action": "PAID",
        "actorWallet": "GYYYYYY...",
        "timestamp": "2024-01-15T11:00:00.000Z",
        "metadata": {
          "transactionHash": "abc123..."
        }
      }
    ],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

---

## Update Invoice

<span class="http-method patch">PATCH</span> `/api/invoices/:id`

Update invoice details (DRAFT status only).

### Authentication

Required. Must be invoice owner.

### Constraints

- Only DRAFT invoices can be updated
- Cannot change status via this endpoint
- All fields optional (partial update)

### Example Request

```bash
curl -X PATCH https://api.link2pay.dev/api/invoices/clx7k8q9a0001mg08y2h3z8k4 \
  -H "Content-Type: application/json" \
  -H "x-wallet-address: GXXXXXX..." \
  -H "x-auth-nonce: abc123..." \
  -H "x-auth-signature: def456..." \
  -d '{
    "amount": 1200,
    "notes": "Updated payment terms - Net 15"
  }'
```

---

## Send Invoice

<span class="http-method post">POST</span> `/api/invoices/:id/send`

Mark invoice as PENDING and activate payment link.

### Authentication

Required. Must be invoice owner.

### Constraints

- Invoice must be in DRAFT status
- Cannot be undone (use cancel instead)

### Example Request

```bash
curl -X POST https://api.link2pay.dev/api/invoices/clx7k8q9a0001mg08y2h3z8k4/send \
  -H "x-wallet-address: GXXXXXX..." \
  -H "x-auth-nonce: abc123..." \
  -H "x-auth-signature: def456..."
```

### Response

```json
{
  "success": true,
  "data": {
    "id": "clx7k8q9a0001mg08y2h3z8k4",
    "status": "PENDING",
    "paymentLink": "https://app.link2pay.dev/pay/clx7k8q9a0001mg08y2h3z8k4",
    "sentAt": "2024-01-15T10:35:00.000Z"
  }
}
```

---

## Delete Invoice

<span class="http-method delete">DELETE</span> `/api/invoices/:id`

Soft-delete invoice (DRAFT status only).

### Authentication

Required. Must be invoice owner.

### Constraints

- Only DRAFT invoices can be deleted
- Soft delete (preserved in database with `deletedAt` timestamp)
- Cannot be restored via API

### Example Request

```bash
curl -X DELETE https://api.link2pay.dev/api/invoices/clx7k8q9a0001mg08y2h3z8k4 \
  -H "x-wallet-address: GXXXXXX..." \
  -H "x-auth-nonce: abc123..." \
  -H "x-auth-signature: def456..."
```

### Response

```json
{
  "success": true,
  "message": "Invoice deleted successfully"
}
```

---

## Get Dashboard Statistics

<span class="http-method get">GET</span> `/api/invoices/stats`

Retrieve aggregated statistics for dashboard.

### Authentication

Required.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `network` | string | - | Filter by network |
| `includeDemoLinks` | boolean | false | Include demo preview links |

### Example Request

```bash
curl -X GET "https://api.link2pay.dev/api/invoices/stats?network=testnet" \
  -H "x-wallet-address: GXXXXXX..." \
  -H "x-auth-nonce: abc123..." \
  -H "x-auth-signature: def456..."
```

### Example Response

```json
{
  "success": true,
  "data": {
    "totalInvoices": 145,
    "totalRevenue": {
      "XLM": 5000,
      "USDC": 25000,
      "EURC": 10000
    },
    "pendingAmount": {
      "XLM": 500,
      "USDC": 2000,
      "EURC": 800
    },
    "statusBreakdown": {
      "DRAFT": 5,
      "PENDING": 12,
      "PAID": 120,
      "EXPIRED": 5,
      "CANCELLED": 3
    },
    "recentActivity": [
      {
        "invoiceId": "clx7k8q9a0001mg08y2h3z8k4",
        "action": "PAID",
        "amount": 1000,
        "currency": "USDC",
        "timestamp": "2024-01-15T11:00:00.000Z"
      }
    ]
  }
}
```

---

## Related Resources

- [Payment Endpoints](/api/endpoints/payments) - Process payments for invoices
- [Invoice Object](/api/resources/invoice) - Complete data model reference
- [Authentication](/api/authentication) - Authentication guide
