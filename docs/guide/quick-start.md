# Quick Start

Get up and running with Link2Pay in under 5 minutes.

## Prerequisites

Before you begin, ensure you have:

- ✅ A web browser (Chrome, Firefox, or Brave recommended)
- ✅ Internet connection
- ✅ 5 minutes of time

That's it! No credit card, no registration, no complex setup.

## Step 1: Install Freighter Wallet

Freighter is a Stellar wallet browser extension (similar to MetaMask for Ethereum).

1. **Install the extension:**
   - [Chrome/Brave](https://chrome.google.com/webstore/detail/freighter/bcacfldlkkdogcmkkibnjlakofdplcbk)
   - [Firefox](https://addons.mozilla.org/en-US/firefox/addon/freighter/)

2. **Create a new wallet:**
   - Click the Freighter icon in your browser
   - Select "Create new wallet"
   - **IMPORTANT**: Write down your 24-word recovery phrase
   - Store it safely (this cannot be recovered if lost)

3. **Switch to Testnet (for testing):**
   - Open Freighter
   - Click settings (gear icon)
   - Select "Testnet" from network dropdown

::: tip Testnet vs Mainnet
**Testnet**: Free test tokens for development and testing
**Mainnet**: Real transactions with real value

Start on Testnet to experiment safely!
:::

## Step 2: Fund Your Testnet Account

You need XLM to activate your account and pay network fees (< $0.01 per transaction).

**Get free testnet XLM:**

1. Visit [Stellar Laboratory - Friendbot](https://laboratory.stellar.org/#account-creator?network=test)
2. Paste your Freighter wallet address
3. Click "Get test network lumens"
4. Wait ~5 seconds for confirmation

You now have 10,000 testnet XLM to experiment with!

::: warning Mainnet Activation
On mainnet, you need to receive at least 1 XLM from another account to activate yours. Exchanges like Coinbase or Kraken can send you XLM.
:::

## Step 3: Access Link2Pay

Open the application:

**Testnet:** [https://app.link2pay.dev](https://app.link2pay.dev)

::: tip No Account Needed
Link2Pay uses your Stellar wallet address as your identity. No email, no password, no registration forms!
:::

## Step 4: Connect Your Wallet

1. Click **"Connect Wallet"** in the top right
2. Freighter popup will appear
3. Click **"Approve"** to connect
4. Your wallet address will appear in the navbar

**Authentication:**
- First connection requires signing a message (proves you own the wallet)
- No password needed - your private key stays in Freighter
- Sessions last 30 minutes

## Step 5: Create Your First Invoice

1. **Navigate to Dashboard:**
   - Click "Dashboard" in the sidebar
   - Click "Create Invoice" button

2. **Fill in Invoice Details:**
   ```
   Client Name: Acme Corporation
   Client Email: billing@acme.com
   Invoice Number: INV-001 (auto-generated if blank)
   Due Date: 2024-12-31
   Currency: USDC
   ```

3. **Add Line Items:**
   ```
   Description: Website Development
   Quantity: 40
   Rate: 50
   Amount: $2,000 (calculated automatically)
   ```

4. **Optional Fields:**
   - Tax Rate: 10%
   - Discount: $100
   - Notes: "Payment due upon completion"

5. **Click "Create Invoice"**

Your invoice is now in `DRAFT` status!

## Step 6: Send the Invoice

1. **Review your invoice:**
   - Check all details are correct
   - Preview the PDF

2. **Mark as sent:**
   - Click "Send Invoice" button
   - Status changes to `PENDING`
   - Payment link is now active

3. **Share payment link:**
   ```
   https://app.link2pay.dev/pay/clx7k8q9a0001...
   ```

   Copy this link and send it to your client via:
   - Email
   - Slack
   - WhatsApp
   - Any messaging platform

## Step 7: Make a Test Payment

Let's simulate a client payment:

1. **Open the payment link** (in a new incognito window to simulate client)
2. **Review invoice details** (client view)
3. **Click "Pay with Freighter"**
4. **Freighter popup appears** with transaction details:
   - Destination: Your wallet address
   - Amount: Invoice total in selected currency
   - Memo: Invoice number (for matching)
5. **Click "Approve"** to sign and submit
6. **Wait 3-5 seconds** for blockchain confirmation

## Step 8: See Instant Confirmation

Return to your dashboard:

1. **Invoice status** automatically updates to `PAID`
2. **Transaction hash** appears in invoice details
3. **Audit log** shows payment confirmation
4. **Funds** are in your wallet immediately

**Verify on blockchain:**
- Click transaction hash
- Opens Stellar Expert (blockchain explorer)
- See complete transaction details

::: tip Real-Time Updates
The dashboard updates automatically via polling. No page refresh needed!
:::

## Next Steps

Congratulations! You've completed the full Link2Pay flow. 🎉

### Learn More

- **[Core Concepts](/guide/concepts)** - Understand invoice lifecycle, payment matching, etc.
- **[Features](/guide/features/payment-links)** - Explore all Link2Pay capabilities
- **[API Integration](/guide/integration/frontend)** - Integrate into your app
- **[Security Model](/guide/advanced/security)** - How Link2Pay keeps you safe

### Try Advanced Features

- **Multi-Asset Support**: Create invoices in XLM, USDC, or EURC
- **Saved Clients**: Build a client book for faster invoicing
- **Bulk Operations**: Create multiple invoices at once
- **Webhook Events**: Get notified when invoices are paid
- **API Access**: Build custom integrations

### Move to Mainnet

When you're ready for real transactions:

1. Switch Freighter to **Mainnet**
2. Fund your account with real XLM (buy from exchange)
3. Connect to Link2Pay (same URL, auto-detects network)
4. Create production invoices

::: danger Security Reminder
On mainnet, your funds are real. Always:
- Back up your recovery phrase securely
- Never share your private key
- Verify transaction details before signing
- Use hardware wallets for large amounts
:::

## Getting Help

Stuck? We're here to help:

- 📚 [Full Documentation](/guide/introduction)
- 💬 [Discord Community](#)
- 🐛 [Report Bug](https://github.com/Link2Pay/link2pay-app/issues)
- 📧 [Email Support](mailto:support@link2pay.dev)

## Quick Reference

**Common Tasks:**

| Task | Navigation |
|------|-----------|
| Create invoice | Dashboard → Create Invoice |
| View invoices | Dashboard → Invoice List |
| Check payment status | Dashboard → Click invoice |
| Download PDF | Invoice Detail → Download PDF |
| View transaction | Invoice Detail → Transaction Hash |
| Switch network | Navbar → Network Toggle |
| Disconnect wallet | Navbar → Wallet Address → Disconnect |

**Keyboard Shortcuts:**

- `Ctrl/Cmd + K`: Search
- `Ctrl/Cmd + /`: Toggle sidebar
- `Escape`: Close modals

**Testnet Resources:**

- Friendbot: https://laboratory.stellar.org/#account-creator?network=test
- Horizon API: https://horizon-testnet.stellar.org
- Stellar Expert: https://stellar.expert/explorer/testnet

Happy invoicing! 🚀
