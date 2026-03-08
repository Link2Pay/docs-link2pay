# Clients Endpoints

Client management endpoints allow you to save and manage frequent payers for quick invoice creation.

## Overview

The Clients feature helps you:
- Store client information (name, email, company, address)
- Mark favorite clients for quick access
- Auto-populate invoice creation forms
- Track payment history per client

**Use Cases:**
- Freelancers managing multiple clients
- Businesses with repeat customers
- Agencies with ongoing projects

---

## List Clients

Retrieve all saved clients for the authenticated wallet.

**Endpoint:** `GET /api/clients`

**Authentication:** Required (wallet signature)

**Success Response (200):**

```json
[
  {
    "id": "client_abc123",
    "freelancerWallet": "GABC123...",
    "name": "Acme Corporation",
    "email": "billing@acme.com",
    "company": "Acme Corp",
    "address": "123 Main St, San Francisco, CA 94105",
    "isFavorite": true,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-03-01T14:30:00.000Z"
  },
  {
    "id": "client_def456",
    "freelancerWallet": "GABC123...",
    "name": "Tech Startup Inc",
    "email": "payments@techstartup.io",
    "company": "Tech Startup Inc",
    "address": null,
    "isFavorite": false,
    "createdAt": "2024-02-20T09:15:00.000Z",
    "updatedAt": "2024-02-20T09:15:00.000Z"
  }
]
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique client ID |
| `freelancerWallet` | string | Owner's wallet address |
| `name` | string | Client name |
| `email` | string | Client email |
| `company` | string \| null | Company name |
| `address` | string \| null | Billing address |
| `isFavorite` | boolean | Favorite status |
| `createdAt` | string | ISO timestamp of creation |
| `updatedAt` | string | ISO timestamp of last update |

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 401 | Authentication required | Missing or invalid token |
| 500 | Failed to fetch clients | Server error |

**Example:**

```bash
curl -H "Authorization: Bearer ${TOKEN}" \
  https://api.link2pay.dev/api/clients
```

**Usage Notes:**

- Results are automatically filtered by authenticated wallet
- Clients are ordered by: favorites first, then by creation date (newest first)
- Empty array returned if no clients saved

---

## Save Client

Create a new client or update an existing one.

**Endpoint:** `POST /api/clients`

**Authentication:** Required (wallet signature)

**Request Body:**

```json
{
  "name": "Acme Corporation",
  "email": "billing@acme.com",
  "company": "Acme Corp",
  "address": "123 Main St, San Francisco, CA 94105",
  "isFavorite": true
}
```

**Request Schema:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Client name (min 1 char) |
| `email` | string | Yes | Valid email address |
| `company` | string | No | Company name |
| `address` | string | No | Billing address |
| `isFavorite` | boolean | No | Mark as favorite (default: false) |

**Validation Rules:**

```typescript
{
  name: z.string().min(1).max(200),
  email: z.string().email().max(200),
  company: z.string().max(200).optional(),
  address: z.string().max(500).optional(),
  isFavorite: z.boolean().optional()
}
```

**Success Response (201):**

```json
{
  "id": "client_abc123",
  "freelancerWallet": "GABC123...",
  "name": "Acme Corporation",
  "email": "billing@acme.com",
  "company": "Acme Corp",
  "address": "123 Main St, San Francisco, CA 94105",
  "isFavorite": true,
  "createdAt": "2024-03-07T12:00:00.000Z",
  "updatedAt": "2024-03-07T12:00:00.000Z"
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Invalid email | Email format is invalid |
| 400 | Name is required | Missing name field |
| 401 | Authentication required | Missing or invalid token |
| 500 | Failed to save client | Server error |

**Example:**

```bash
curl -X POST https://api.link2pay.dev/api/clients \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corporation",
    "email": "billing@acme.com",
    "company": "Acme Corp",
    "isFavorite": true
  }'
```

**Upsert Behavior:**

The endpoint performs an **upsert** (update or insert):

- If client with same email exists for your wallet: **Updates** existing client
- If client email is new: **Creates** new client

**Example:**

```typescript
// First call - creates client
await saveClient({
  name: "John Doe",
  email: "john@example.com",
  company: "Example Inc"
});

// Second call - updates same client
await saveClient({
  name: "John Doe",
  email: "john@example.com", // Same email
  company: "Updated Company", // Company updated
  address: "456 New St" // Address added
});
```

---

## Update Favorite Status

Mark a client as favorite or remove favorite status.

**Endpoint:** `PATCH /api/clients/:id/favorite`

**Authentication:** Required (wallet signature)

**Parameters:**

| Parameter | Type | Location | Required | Description |
|-----------|------|----------|----------|-------------|
| `id` | string | Path | Yes | Client ID |

**Request Body:**

```json
{
  "isFavorite": true
}
```

**Success Response (200):**

```json
{
  "id": "client_abc123",
  "freelancerWallet": "GABC123...",
  "name": "Acme Corporation",
  "email": "billing@acme.com",
  "company": "Acme Corp",
  "address": "123 Main St, San Francisco, CA 94105",
  "isFavorite": true,
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-03-07T12:00:00.000Z"
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 401 | Authentication required | Missing or invalid token |
| 403 | Unauthorized | Client belongs to another wallet |
| 404 | Client not found | Invalid client ID |
| 500 | Failed to update client | Server error |

**Example:**

```bash
# Mark as favorite
curl -X PATCH https://api.link2pay.dev/api/clients/client_abc123/favorite \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"isFavorite": true}'

# Remove favorite
curl -X PATCH https://api.link2pay.dev/api/clients/client_abc123/favorite \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"isFavorite": false}'
```

**Usage Notes:**

- Only the client owner can update favorite status
- `updatedAt` timestamp is automatically updated
- Favorite clients appear first in `GET /api/clients` results

---

## Integration with Invoices

### Auto-Save During Invoice Creation

When creating an invoice, you can automatically save the client:

```json
{
  "freelancerWallet": "GABC123...",
  "clientName": "Acme Corporation",
  "clientEmail": "billing@acme.com",
  "clientCompany": "Acme Corp",
  "clientAddress": "123 Main St",
  "saveClient": true,
  "favoriteClient": true,
  // ... invoice fields
}
```

**Behavior:**
- If `saveClient: true`, client is upserted after invoice creation
- If `favoriteClient: true`, client is marked as favorite
- Non-fatal: If client save fails, invoice creation still succeeds

**Example:**

```typescript
const invoice = await createInvoice({
  freelancerWallet: myWallet,
  clientName: "New Client",
  clientEmail: "client@example.com",
  saveClient: true, // Auto-save to clients list
  favoriteClient: true,
  // ... other invoice fields
});

// Client is now saved and can be reused
const clients = await listClients();
// clients now includes "New Client"
```

---

## Complete Example

### Client Management Flow

```typescript
// 1. Authenticate
const { token } = await authenticate(walletAddress);

// 2. Save a new client
const client = await fetch('https://api.link2pay.dev/api/clients', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: "Tech Startup Inc",
    email: "billing@techstartup.io",
    company: "Tech Startup Inc",
    address: "456 Innovation Dr, Austin, TX",
    isFavorite: false
  })
}).then(r => r.json());

console.log('Client saved:', client.id);

// 3. Mark as favorite later
await fetch(`https://api.link2pay.dev/api/clients/${client.id}/favorite`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ isFavorite: true })
});

// 4. List all clients (favorites first)
const clients = await fetch('https://api.link2pay.dev/api/clients', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json());

console.log('Favorite clients:', clients.filter(c => c.isFavorite));

// 5. Create invoice using saved client
const invoice = await createInvoice({
  freelancerWallet: walletAddress,
  clientName: client.name,
  clientEmail: client.email,
  clientCompany: client.company,
  clientAddress: client.address,
  // ... invoice details
});
```

---

## Use Cases

### 1. Quick Invoice Creation

```typescript
function ClientSelector({ onSelect }: { onSelect: (client: Client) => void }) {
  const [clients, setClients] = useState([]);

  useEffect(() => {
    fetchClients().then(setClients);
  }, []);

  return (
    <div>
      <h3>Select Client</h3>
      {clients.filter(c => c.isFavorite).map(client => (
        <button key={client.id} onClick={() => onSelect(client)}>
          ⭐ {client.name}
        </button>
      ))}
      {clients.filter(c => !c.isFavorite).map(client => (
        <button key={client.id} onClick={() => onSelect(client)}>
          {client.name}
        </button>
      ))}
    </div>
  );
}
```

### 2. Client Dashboard

```typescript
async function getClientStats(clientEmail: string) {
  const invoices = await listInvoices();
  const clientInvoices = invoices.filter(inv => inv.clientEmail === clientEmail);

  return {
    totalInvoices: clientInvoices.length,
    paidInvoices: clientInvoices.filter(inv => inv.status === 'PAID').length,
    totalRevenue: clientInvoices
      .filter(inv => inv.status === 'PAID')
      .reduce((sum, inv) => sum + parseFloat(inv.total), 0),
    lastInvoice: clientInvoices[0]?.createdAt
  };
}
```

### 3. Email Autocomplete

```typescript
function EmailAutocomplete() {
  const [clients, setClients] = useState([]);
  const [email, setEmail] = useState('');

  const suggestions = clients.filter(c =>
    c.email.toLowerCase().includes(email.toLowerCase())
  );

  return (
    <input
      type="email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      list="client-emails"
    >
    <datalist id="client-emails">
      {suggestions.map(client => (
        <option key={client.id} value={client.email}>
          {client.name} - {client.company}
        </option>
      ))}
    </datalist>
  );
}
```

---

## Best Practices

### 1. Validate Before Saving

```typescript
function validateClient(client: any): string[] {
  const errors: string[] = [];

  if (!client.name || client.name.trim().length === 0) {
    errors.push('Name is required');
  }

  if (!client.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client.email)) {
    errors.push('Valid email is required');
  }

  if (client.company && client.company.length > 200) {
    errors.push('Company name too long (max 200 chars)');
  }

  return errors;
}
```

### 2. Handle Duplicates Gracefully

```typescript
async function saveClientSafely(clientData: any) {
  try {
    return await saveClient(clientData);
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      // Update instead
      const existing = await findClientByEmail(clientData.email);
      return await updateClient(existing.id, clientData);
    }
    throw error;
  }
}
```

### 3. Cache Client List

```typescript
const clientCache = {
  data: [] as Client[],
  lastFetch: 0,
  ttl: 5 * 60 * 1000 // 5 minutes
};

async function getCachedClients(): Promise<Client[]> {
  const now = Date.now();
  if (now - clientCache.lastFetch < clientCache.ttl) {
    return clientCache.data;
  }

  const clients = await fetchClients();
  clientCache.data = clients;
  clientCache.lastFetch = now;
  return clients;
}
```

---

## Schema

### Client Object

```typescript
interface Client {
  id: string;
  freelancerWallet: string;
  name: string;
  email: string;
  company?: string;
  address?: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Database Schema

```prisma
model SavedClient {
  id               String   @id @default(cuid())
  freelancerWallet String
  name             String
  email            String
  company          String?
  address          String?
  isFavorite       Boolean  @default(false)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@unique([freelancerWallet, email])
  @@index([freelancerWallet])
}
```

**Unique Constraint:**
- Combination of `freelancerWallet + email` must be unique
- Prevents duplicate clients per wallet
- Enables upsert behavior

---

## Next Steps

- Learn about [Invoice Endpoints](/api/endpoints/invoices)
- Understand [Payment Links](/api/endpoints/links)
- Explore [Frontend Integration](/guide/integration/frontend)
