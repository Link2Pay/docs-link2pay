---
layout: home

hero:
  name: Link2Pay
  text: Stellar Payment Infrastructure
  tagline: Create payment links, generate invoices, and receive instant on-chain confirmations with cryptographic proof
  actions:
    - theme: brand
      text: Get Started
      link: /guide/introduction
    - theme: alt
      text: View on GitHub
      link: https://github.com/Link2Pay/link2pay-app
  image:
    src: /hero-image.svg
    alt: Link2Pay

features:
  - icon: ⚡
    title: Instant Settlement
    details: 3-5 second finality on Stellar network with real-time payment detection and automatic confirmation

  - icon: 🔐
    title: Non-Custodial Security
    details: Private keys never leave your device. Cryptographic authentication with ed25519 signatures - no passwords needed

  - icon: 💰
    title: Multi-Asset Support
    details: Accept payments in XLM, USDC, and EURC with automatic conversion and live price feeds

  - icon: 🔗
    title: Shareable Payment Links
    details: Generate unique payment URLs for each invoice. Clients pay directly without registration

  - icon: 🌐
    title: Network Detection
    details: Automatic testnet/mainnet detection with Freighter wallet validation and clear network mismatch warnings

  - icon: 📊
    title: Immutable Audit Trail
    details: Complete transaction history stored on-chain with cryptographic proof and audit logs

  - icon: 🚀
    title: Developer-Friendly API
    details: RESTful API with TypeScript SDK, comprehensive docs, and code examples

  - icon: 🌍
    title: Global & Multilingual
    details: Support for English, Spanish, and Portuguese with near-zero transaction fees worldwide

  - icon: 📱
    title: Mobile-Ready
    details: SEP-7 deep linking for mobile wallets with responsive design and cross-device compatibility
---

## Why Choose Link2Pay?

Link2Pay eliminates traditional payment pain points by leveraging the Stellar blockchain network:

<div class="vp-doc">

### For Freelancers & Businesses

- **No Payment Processor Fees**: Near-zero Stellar network fees vs 2-3% traditional processors
- **Instant Settlement**: Get paid in seconds instead of days
- **Professional Invoicing**: Create detailed invoices with line items, taxes, and discounts
- **Global Reach**: Accept payments from anywhere in the world

### For Developers

- **Simple Integration**: RESTful API with TypeScript SDK
- **Comprehensive Docs**: Complete API reference with code examples
- **Webhook Events**: Real-time payment notifications
- **Open Source**: Fully transparent and auditable codebase

### For Clients

- **No Registration Required**: Pay invoices directly via payment link
- **Multiple Payment Options**: XLM, USDC, or EURC
- **Secure & Transparent**: All transactions verifiable on Stellar blockchain
- **Mobile-Friendly**: Pay from desktop or mobile devices

</div>

## Quick Example

```typescript
// Create an invoice
const invoice = await api.createInvoice({
  clientName: "Acme Corp",
  clientEmail: "billing@acme.com",
  amount: 100,
  currency: "USDC",
  dueDate: "2024-12-31",
  items: [
    { description: "Web Development", quantity: 10, rate: 10 }
  ]
});

// Share payment link
const paymentUrl = `https://app.link2pay.dev/pay/${invoice.id}`;

// Payment detected automatically
// Invoice status updates to "PAID" in 3-5 seconds
```

## Get Started in Minutes

<div class="vp-doc">

1. **Connect Your Wallet**: Install Freighter wallet extension
2. **Create an Invoice**: Fill in client details and line items
3. **Share Payment Link**: Send unique URL to your client
4. **Get Paid Instantly**: Receive confirmation in seconds

[Start Building →](/guide/quick-start)

</div>

## Trusted by Developers

<div class="vp-doc" style="text-align: center; margin-top: 3rem;">

Built on the **Stellar blockchain** - a fast, low-cost, and environmentally friendly network powering the future of global payments.

</div>
