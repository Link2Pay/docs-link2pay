# Why Link2Pay?

Traditional payment systems are broken. Link2Pay fixes them.

## The Problem with Traditional Payments

### High Fees
Payment processors like Stripe, PayPal, and Square charge 2.9% + $0.30 per transaction. For a $100 invoice, that's $3.20 in fees - money that should be yours.

**Link2Pay alternative:** < $0.01 per transaction (Stellar network fee)

### Slow Settlement
Credit card payments take 2-3 business days to settle. International wire transfers can take 3-5 days. Your money is held hostage during this time.

**Link2Pay alternative:** 3-5 second settlement on Stellar blockchain

### Geographical Restrictions
Many payment processors don't work in certain countries. Opening a business account can be impossible depending on your location.

**Link2Pay alternative:** Global by default - if you have internet, you can receive payments

### Chargebacks & Fraud
Credit card chargebacks can occur up to 120 days after a transaction, creating uncertainty and risk for merchants.

**Link2Pay alternative:** Immutable blockchain transactions - once confirmed, payments cannot be reversed

### Privacy Concerns
Traditional payment processors collect extensive personal information and track all your transactions.

**Link2Pay alternative:** Non-custodial - only your wallet address is required, no KYC for basic usage

## The Link2Pay Advantage

### 1. Dramatically Lower Costs

| Service | Fee per $100 |
|---------|--------------|
| Stripe | $3.20 (2.9% + $0.30) |
| PayPal | $3.20 (2.9% + $0.30) |
| Wire Transfer | $25-45 (international) |
| **Link2Pay** | **< $0.01** |

For a freelancer making $50,000/year:
- **Traditional processor**: $1,600 in fees
- **Link2Pay**: ~$5 in fees
- **Savings**: $1,595/year (99.7% cost reduction)

### 2. Instant Access to Funds

No more waiting for payment processors to release your money. Stellar blockchain settlement happens in 3-5 seconds, and funds arrive directly in your wallet.

**Real-world impact:**
- Pay bills immediately after client payment
- Invest earnings without delay
- No cash flow gaps waiting for settlement

### 3. True Ownership

Your private keys remain on your device. Your wallet is yours forever. No account can be frozen, restricted, or terminated.

**Compare:**
- PayPal: Can freeze your account for 180 days
- Stripe: Can hold funds during "reviews"
- Link2Pay: Your keys, your crypto, your control

### 4. Global & Borderless

Accept payments from clients in:
- 🇺🇸 United States
- 🇪🇺 European Union
- 🇧🇷 Brazil
- 🇳🇬 Nigeria
- 🇮🇳 India
- 🌍 Anywhere with internet access

No additional fees for international transactions. No currency conversion fees (when using stablecoins).

### 5. Transparent & Auditable

Every transaction is recorded on the Stellar blockchain - a public, immutable ledger that anyone can verify.

**Benefits:**
- Complete audit trail for accounting
- Cryptographic proof of payment
- Transparent transaction history
- Dispute resolution with on-chain evidence

### 6. Developer-Friendly

Built by developers, for developers:

```typescript
// Traditional payment integration (simplified)
const stripe = require('stripe')('sk_test_...')
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: [{...}],
  success_url: '...',
  cancel_url: '...'
})
// Complex redirect flow, webhook handling, etc.

// Link2Pay integration
const invoice = await link2pay.createInvoice({
  amount: 100,
  currency: 'USDC',
  clientEmail: 'client@example.com'
})
// Done. Payment link ready: /pay/${invoice.id}
```

### 7. Privacy-Preserving

Minimal data collection:
- **Required**: Stellar wallet address (public key)
- **Optional**: Email for notifications
- **Never collected**: SSN, bank account, credit card

No identity verification required for basic usage. You remain pseudonymous.

### 8. Stablecoin Support

Avoid cryptocurrency volatility with USDC and EURC stablecoins:
- **USDC**: 1 USDC = 1 USD (Circle-backed)
- **EURC**: 1 EURC = 1 EUR (Circle-backed)

Accept "crypto" payments without price risk.

## Use Cases

### Freelance Developers
"I invoice $5,000/month. With Stripe I was losing $160/month in fees. With Link2Pay I pay basically nothing. That's $1,920/year back in my pocket."

### International Contractors
"My client in the US used to pay me via wire transfer - $45 fee and 5 days wait. Now with Link2Pay, I get paid in USDC instantly with zero fees."

### SaaS Businesses
"We integrated Link2Pay alongside Stripe. Crypto-native users love the option, and we save on processing fees. Win-win."

### Content Creators
"I sell digital products. Before Link2Pay, PayPal would hold my funds for weeks. Now I get paid instantly after every sale."

## Comparing Payment Solutions

| Feature | Link2Pay | Stripe | PayPal | Wire |
|---------|----------|--------|--------|------|
| **Fees** | < $0.01 | 2.9% + $0.30 | 2.9% + $0.30 | $25-45 |
| **Settlement** | 3-5 seconds | 2-3 days | Instant to 3 days | 3-5 days |
| **Global Access** | ✅ Anywhere | ⚠️ Limited countries | ⚠️ Limited countries | ✅ Most banks |
| **Chargebacks** | ❌ None | ✅ Up to 120 days | ✅ Up to 180 days | ⚠️ Depends |
| **Account Freezes** | ❌ Impossible | ✅ Possible | ✅ Common | ⚠️ Possible |
| **Privacy** | ✅ Pseudonymous | ❌ Full KYC | ❌ Full KYC | ❌ Full KYC |
| **Integration** | ✅ Simple API | ✅ Comprehensive API | ⚠️ Complex | ❌ Manual |
| **Volatility Risk** | ✅ Stablecoins available | N/A | N/A | N/A |

## When NOT to Use Link2Pay

We believe in transparency. Link2Pay might not be right for you if:

1. **Your clients don't have crypto wallets**
   - Solution: Educate them or offer Link2Pay alongside traditional options

2. **You need credit card processing**
   - Link2Pay is blockchain-only (for now)

3. **You require chargebacks**
   - Blockchain transactions are final

4. **You can't handle some crypto volatility**
   - Use USDC/EURC stablecoins instead of XLM

## The Bottom Line

Link2Pay gives you:
- 💰 **99.7% cost savings** vs traditional processors
- ⚡ **500x faster settlement** (seconds vs days)
- 🌍 **Global access** without restrictions
- 🔐 **True ownership** of your funds
- 📊 **Complete transparency** via blockchain

Traditional payment systems were designed for the 1970s. Link2Pay is built for the internet age.

[Get Started Now](/guide/quick-start) • [View Pricing](/guide/pricing)
