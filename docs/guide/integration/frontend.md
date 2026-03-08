# Frontend Integration

Complete guide to integrating Link2Pay into your React/TypeScript frontend application.

## Overview

This guide covers:
- Setting up Freighter wallet integration
- Creating invoices from your app
- Processing payments
- State management
- Error handling
- Best practices

**Tech Stack:**
- React 18.2+
- TypeScript 5.3+
- Freighter Wallet API 2.0+
- React Query (optional but recommended)

---

## Installation

### Install Dependencies

```bash
npm install @stellar/freighter-api @stellar/stellar-sdk
```

**Optional (recommended):**
```bash
npm install @tanstack/react-query zustand
```

---

## Wallet Integration

### Detect Freighter

Check if Freighter wallet is installed:

```typescript
// utils/freighter.ts
export function isFreighterInstalled(): boolean {
  return typeof window !== 'undefined' && window.freighterApi !== undefined;
}

// Usage in component
function WalletConnect() {
  const [hasFreighter, setHasFreighter] = useState(false);

  useEffect(() => {
    setHasFreighter(isFreighterInstalled());
  }, []);

  if (!hasFreighter) {
    return (
      <div className="alert alert-warning">
        <p>Freighter wallet not detected</p>
        <a href="https://freighter.app" target="_blank" rel="noopener">
          Install Freighter
        </a>
      </div>
    );
  }

  return <ConnectButton />;
}
```

---

### Connect Wallet

Request user's public key:

```typescript
import { getPublicKey, getNetwork } from '@stellar/freighter-api';

async function connectWallet() {
  try {
    // 1. Request public key
    const publicKey = await getPublicKey();

    // 2. Get network
    const { networkPassphrase } = await getNetwork();

    // 3. Store in state
    return {
      publicKey,
      networkPassphrase,
      connected: true
    };
  } catch (error) {
    if (error.message === 'User declined access') {
      throw new Error('Please approve wallet connection');
    }
    throw error;
  }
}

// Usage
function ConnectButton() {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleConnect() {
    setLoading(true);
    try {
      const walletData = await connectWallet();
      setWallet(walletData);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  if (wallet) {
    return (
      <div className="wallet-connected">
        <span>Connected: {wallet.publicKey.slice(0, 8)}...</span>
        <button onClick={() => setWallet(null)}>Disconnect</button>
      </div>
    );
  }

  return (
    <button onClick={handleConnect} disabled={loading}>
      {loading ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}
```

---

### Wallet State Management (Zustand)

```typescript
// store/walletStore.ts
import { create } from 'zustand';
import { getPublicKey, getNetwork } from '@stellar/freighter-api';

interface WalletState {
  publicKey: string | null;
  networkPassphrase: string | null;
  connected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  publicKey: null,
  networkPassphrase: null,
  connected: false,

  connect: async () => {
    try {
      const publicKey = await getPublicKey();
      const { networkPassphrase } = await getNetwork();

      set({
        publicKey,
        networkPassphrase,
        connected: true
      });
    } catch (error) {
      throw error;
    }
  },

  disconnect: () => {
    set({
      publicKey: null,
      networkPassphrase: null,
      connected: false
    });
  }
}));

// Usage in components
function MyComponent() {
  const { publicKey, connected, connect, disconnect } = useWalletStore();

  if (!connected) {
    return <button onClick={connect}>Connect Wallet</button>;
  }

  return (
    <div>
      <p>Connected: {publicKey}</p>
      <button onClick={disconnect}>Disconnect</button>
    </div>
  );
}
```

---

## Authentication

### Request Nonce

```typescript
// services/auth.ts
const API_BASE = 'https://api.link2pay.dev';

export async function requestNonce(walletAddress: string) {
  const response = await fetch(`${API_BASE}/api/auth/nonce`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress })
  });

  if (!response.ok) {
    throw new Error('Failed to request nonce');
  }

  return response.json();
}
```

---

### Sign Message

```typescript
import { signAuthEntry } from '@stellar/freighter-api';

export async function signMessage(
  message: string,
  walletAddress: string
): Promise<string> {
  try {
    const signature = await signAuthEntry(message, {
      accountToSign: walletAddress
    });

    return signature;
  } catch (error) {
    if (error.message === 'User declined access') {
      throw new Error('Please approve the signature request');
    }
    throw error;
  }
}
```

---

### Get Session Token

```typescript
export async function getSessionToken(
  walletAddress: string,
  nonce: string,
  signature: string
) {
  const response = await fetch(`${API_BASE}/api/auth/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletAddress,
      nonce,
      signature
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Authentication failed');
  }

  return response.json();
}
```

---

### Complete Auth Flow

```typescript
// hooks/useAuth.ts
import { useState } from 'react';
import { useWalletStore } from '../store/walletStore';
import { requestNonce, signMessage, getSessionToken } from '../services/auth';

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const { publicKey } = useWalletStore();

  async function authenticate() {
    if (!publicKey) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);

    try {
      // 1. Request nonce
      const { nonce, message } = await requestNonce(publicKey);

      // 2. Sign message
      const signature = await signMessage(message, publicKey);

      // 3. Get session token
      const { token, expiresAt } = await getSessionToken(publicKey, nonce, signature);

      // 4. Store token
      setToken(token);
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_expires', expiresAt);

      return token;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_expires');
  }

  return {
    token,
    loading,
    authenticate,
    logout,
    isAuthenticated: !!token
  };
}

// Usage
function ProtectedComponent() {
  const { token, authenticate, loading, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <button onClick={authenticate} disabled={loading}>
        {loading ? 'Authenticating...' : 'Sign In'}
      </button>
    );
  }

  return <div>Authenticated! Token: {token.slice(0, 20)}...</div>;
}
```

---

## Creating Invoices

### Invoice Form Component

```typescript
// components/InvoiceForm.tsx
import { useState } from 'react';
import { useWalletStore } from '../store/walletStore';
import { useAuth } from '../hooks/useAuth';

interface LineItem {
  description: string;
  quantity: number;
  rate: number;
}

export function InvoiceForm() {
  const { publicKey, networkPassphrase } = useWalletStore();
  const { token } = useAuth();

  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    title: '',
    description: '',
    currency: 'USDC',
    dueDate: '',
    lineItems: [{ description: '', quantity: 1, rate: 0 }] as LineItem[]
  });

  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('https://api.link2pay.dev/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          freelancerWallet: publicKey,
          networkPassphrase,
          ...formData
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      const invoice = await response.json();
      alert(`Invoice created: ${invoice.invoiceNumber}`);

      // Reset form
      setFormData({
        clientName: '',
        clientEmail: '',
        title: '',
        description: '',
        currency: 'USDC',
        dueDate: '',
        lineItems: [{ description: '', quantity: 1, rate: 0 }]
      });
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  function addLineItem() {
    setFormData(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, { description: '', quantity: 1, rate: 0 }]
    }));
  }

  function updateLineItem(index: number, field: keyof LineItem, value: any) {
    setFormData(prev => ({
      ...prev,
      lineItems: prev.lineItems.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  }

  const subtotal = formData.lineItems.reduce(
    (sum, item) => sum + item.quantity * item.rate,
    0
  );

  return (
    <form onSubmit={handleSubmit} className="invoice-form">
      <h2>Create Invoice</h2>

      {/* Client Info */}
      <div className="form-group">
        <label>Client Name</label>
        <input
          type="text"
          value={formData.clientName}
          onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
          required
        />
      </div>

      <div className="form-group">
        <label>Client Email</label>
        <input
          type="email"
          value={formData.clientEmail}
          onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
          required
        />
      </div>

      {/* Invoice Details */}
      <div className="form-group">
        <label>Title</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      {/* Currency */}
      <div className="form-group">
        <label>Currency</label>
        <select
          value={formData.currency}
          onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
        >
          <option value="XLM">XLM</option>
          <option value="USDC">USDC</option>
          <option value="EURC">EURC</option>
        </select>
      </div>

      {/* Due Date */}
      <div className="form-group">
        <label>Due Date</label>
        <input
          type="date"
          value={formData.dueDate}
          onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
          min={new Date().toISOString().split('T')[0]}
        />
      </div>

      {/* Line Items */}
      <div className="line-items">
        <h3>Line Items</h3>
        {formData.lineItems.map((item, index) => (
          <div key={index} className="line-item">
            <input
              type="text"
              placeholder="Description"
              value={item.description}
              onChange={(e) => updateLineItem(index, 'description', e.target.value)}
              required
            />
            <input
              type="number"
              placeholder="Qty"
              value={item.quantity}
              onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value))}
              min="0.01"
              step="0.01"
              required
            />
            <input
              type="number"
              placeholder="Rate"
              value={item.rate}
              onChange={(e) => updateLineItem(index, 'rate', parseFloat(e.target.value))}
              min="0"
              step="0.01"
              required
            />
            <span className="amount">
              ${(item.quantity * item.rate).toFixed(2)}
            </span>
          </div>
        ))}
        <button type="button" onClick={addLineItem}>+ Add Line Item</button>
      </div>

      {/* Total */}
      <div className="total">
        <strong>Subtotal:</strong> ${subtotal.toFixed(2)} {formData.currency}
      </div>

      {/* Submit */}
      <button type="submit" disabled={loading || !token}>
        {loading ? 'Creating...' : 'Create Invoice'}
      </button>
    </form>
  );
}
```

---

## Processing Payments

### Payment Flow Component

```typescript
// components/PaymentFlow.tsx
import { useState, useEffect } from 'react';
import { signTransaction } from '@stellar/freighter-api';
import { useWalletStore } from '../store/walletStore';

interface PaymentFlowProps {
  invoiceId: string;
}

export function PaymentFlow({ invoiceId }: PaymentFlowProps) {
  const { publicKey, networkPassphrase } = useWalletStore();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'signing' | 'submitting' | 'confirmed'>('idle');

  // Load invoice
  useEffect(() => {
    fetch(`https://api.link2pay.dev/api/invoices/${invoiceId}`)
      .then(r => r.json())
      .then(setInvoice);
  }, [invoiceId]);

  async function handlePayment() {
    if (!publicKey || !networkPassphrase) {
      alert('Please connect your wallet first');
      return;
    }

    setLoading(true);

    try {
      // 1. Create pay intent
      setStatus('signing');
      const intentResponse = await fetch(
        `https://api.link2pay.dev/api/payments/${invoiceId}/pay-intent`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderPublicKey: publicKey,
            networkPassphrase
          })
        }
      );

      if (!intentResponse.ok) {
        const error = await intentResponse.json();
        throw new Error(error.error);
      }

      const { transactionXdr } = await intentResponse.json();

      // 2. Sign with Freighter
      const signedXdr = await signTransaction(transactionXdr, {
        networkPassphrase
      });

      // 3. Submit to Stellar
      setStatus('submitting');
      const submitResponse = await fetch(
        'https://api.link2pay.dev/api/payments/submit',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invoiceId,
            signedTransactionXdr: signedXdr
          })
        }
      );

      if (!submitResponse.ok) {
        const error = await submitResponse.json();
        throw new Error(error.error);
      }

      const { transactionHash } = await submitResponse.json();

      // 4. Payment confirmed
      setStatus('confirmed');
      alert(`Payment successful! Transaction: ${transactionHash}`);

    } catch (error) {
      alert(error.message);
      setStatus('idle');
    } finally {
      setLoading(false);
    }
  }

  if (!invoice) {
    return <div>Loading invoice...</div>;
  }

  return (
    <div className="payment-flow">
      <h2>Pay Invoice</h2>

      <div className="invoice-details">
        <h3>{invoice.title}</h3>
        <p>{invoice.description}</p>
        <div className="total">
          <strong>Total:</strong> {invoice.total} {invoice.currency}
        </div>
      </div>

      {status === 'idle' && (
        <button onClick={handlePayment} disabled={loading}>
          Pay Now
        </button>
      )}

      {status === 'signing' && (
        <div className="status">
          <div className="spinner" />
          <p>Waiting for signature...</p>
        </div>
      )}

      {status === 'submitting' && (
        <div className="status">
          <div className="spinner" />
          <p>Submitting to Stellar network...</p>
          <small>This usually takes 3-5 seconds</small>
        </div>
      )}

      {status === 'confirmed' && (
        <div className="success">
          <div className="checkmark">✓</div>
          <h3>Payment Confirmed!</h3>
          <p>Your payment has been successfully processed.</p>
        </div>
      )}
    </div>
  );
}
```

---

## React Query Integration

### Setup Query Client

```typescript
// App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // 30 seconds
      refetchOnWindowFocus: false
    }
  }
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
    </QueryClientProvider>
  );
}
```

---

### Query Hooks

```typescript
// hooks/useInvoices.ts
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';

export function useInvoices(status?: string) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['invoices', status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.set('status', status);

      const response = await fetch(
        `https://api.link2pay.dev/api/invoices?${params}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }

      return response.json();
    },
    enabled: !!token
  });
}

// Usage
function InvoiceList() {
  const { data, isLoading, error } = useInvoices('PENDING');

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data.invoices.map(invoice => (
        <div key={invoice.id}>
          {invoice.invoiceNumber} - ${invoice.total}
        </div>
      ))}
    </div>
  );
}
```

---

### Mutation Hooks

```typescript
// hooks/useCreateInvoice.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { useWalletStore } from '../store/walletStore';

export function useCreateInvoice() {
  const { token } = useAuth();
  const { publicKey, networkPassphrase } = useWalletStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceData: any) => {
      const response = await fetch('https://api.link2pay.dev/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...invoiceData,
          freelancerWallet: publicKey,
          networkPassphrase
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate invoices query to refetch
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    }
  });
}

// Usage
function CreateInvoiceButton() {
  const createInvoice = useCreateInvoice();

  async function handleCreate() {
    try {
      const invoice = await createInvoice.mutateAsync({
        clientName: 'John Doe',
        clientEmail: 'john@example.com',
        title: 'Services',
        currency: 'USDC',
        lineItems: [
          { description: 'Consulting', quantity: 10, rate: 100 }
        ]
      });

      alert(`Invoice created: ${invoice.invoiceNumber}`);
    } catch (error) {
      alert(error.message);
    }
  }

  return (
    <button
      onClick={handleCreate}
      disabled={createInvoice.isPending}
    >
      {createInvoice.isPending ? 'Creating...' : 'Create Invoice'}
    </button>
  );
}
```

---

## Error Handling

### Global Error Handler

```typescript
// components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-page">
          <h1>Something went wrong</h1>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

### API Error Helper

```typescript
// utils/errors.ts
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export async function handleAPIResponse(response: Response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));

    throw new APIError(
      error.error || 'Request failed',
      response.status,
      error.code
    );
  }

  return response.json();
}

// Usage
async function fetchInvoice(id: string) {
  try {
    const response = await fetch(`/api/invoices/${id}`);
    return await handleAPIResponse(response);
  } catch (error) {
    if (error instanceof APIError) {
      if (error.statusCode === 404) {
        alert('Invoice not found');
      } else if (error.statusCode === 401) {
        alert('Please sign in');
      } else {
        alert(error.message);
      }
    }
    throw error;
  }
}
```

---

## Best Practices

### 1. Environment Variables

```typescript
// .env
VITE_API_URL=https://api.link2pay.dev
VITE_NETWORK=testnet

// config.ts
export const config = {
  apiUrl: import.meta.env.VITE_API_URL,
  network: import.meta.env.VITE_NETWORK as 'testnet' | 'mainnet'
};
```

---

### 2. Token Refresh

```typescript
// hooks/useAuth.ts
function useAuth() {
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const expires = localStorage.getItem('auth_expires');

    if (token && expires) {
      const expiresAt = new Date(expires).getTime();
      const now = Date.now();

      if (now >= expiresAt) {
        // Token expired, logout
        logout();
      } else {
        // Token valid, set it
        setToken(token);

        // Schedule refresh before expiry
        const timeUntilExpiry = expiresAt - now;
        const refreshTime = timeUntilExpiry - 5 * 60 * 1000; // 5 min before

        if (refreshTime > 0) {
          setTimeout(() => {
            authenticate(); // Re-authenticate
          }, refreshTime);
        }
      }
    }
  }, []);
}
```

---

### 3. Loading States

```typescript
function LoadingButton({ loading, children, ...props }) {
  return (
    <button {...props} disabled={loading || props.disabled}>
      {loading && <span className="spinner" />}
      {children}
    </button>
  );
}

// Usage
<LoadingButton loading={createInvoice.isPending} onClick={handleCreate}>
  Create Invoice
</LoadingButton>
```

---

## Complete Example App

```typescript
// App.tsx
import { ErrorBoundary } from './components/ErrorBoundary';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WalletConnect } from './components/WalletConnect';
import { InvoiceList } from './components/InvoiceList';
import { useWalletStore } from './store/walletStore';

const queryClient = new QueryClient();

export default function App() {
  const { connected } = useWalletStore();

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <div className="app">
          <header>
            <h1>Link2Pay</h1>
            <WalletConnect />
          </header>

          <main>
            {connected ? (
              <InvoiceList />
            ) : (
              <div className="connect-prompt">
                <p>Please connect your wallet to continue</p>
              </div>
            )}
          </main>
        </div>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
```

---

## Next Steps

- Read [Backend Integration](/guide/integration/backend)
- Learn about [Webhook Events](/guide/integration/webhooks)
- Explore [Authentication Guide](/guide/integration/authentication)
- Check [API Reference](/api/overview)
