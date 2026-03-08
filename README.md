# Link2Pay Documentation

Official documentation for [Link2Pay](https://link2pay.dev) - Stellar blockchain payment infrastructure.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run docs:dev

# Build for production
npm run docs:build

# Preview production build
npm run docs:preview
```

## 📚 Documentation Structure

```
docs/
├── .vitepress/
│   └── config.ts          # VitePress configuration
├── index.md               # Homepage
├── guide/                 # User guides
│   ├── introduction.md
│   ├── why-link2pay.md
│   ├── quick-start.md
│   ├── concepts.md
│   ├── features/          # Feature guides
│   │   ├── payment-links.md
│   │   ├── invoicing.md
│   │   ├── multi-asset.md
│   │   ├── network-detection.md
│   │   └── settlement.md
│   ├── integration/       # Integration guides
│   │   ├── frontend.md
│   │   ├── backend.md
│   │   ├── webhooks.md
│   │   └── authentication.md
│   └── advanced/          # Advanced topics
│       ├── security.md
│       ├── architecture.md
│       ├── database.md
│       └── watcher.md
├── api/                   # API Reference
│   ├── overview.md
│   ├── authentication.md
│   ├── rate-limits.md
│   ├── errors.md
│   ├── endpoints/         # API endpoints
│   │   ├── auth.md
│   │   ├── invoices.md
│   │   ├── payments.md
│   │   ├── links.md
│   │   ├── clients.md
│   │   └── prices.md
│   └── resources/         # Data models
│       ├── invoice.md
│       ├── payment.md
│       └── client.md
└── sdk/                   # SDK Documentation
    ├── overview.md
    ├── installation.md
    ├── hooks/             # React hooks
    │   ├── use-wallet.md
    │   ├── use-invoice.md
    │   ├── use-payment.md
    │   └── use-network.md
    └── examples/          # Code examples
        ├── create-invoice.md
        ├── process-payment.md
        └── payment-button.md
```

## 🛠️ Technology Stack

- **[VitePress](https://vitepress.dev/)** - Fast, modern documentation framework
- **[Vue 3](https://vuejs.org/)** - Progressive JavaScript framework
- **[Vite](https://vitejs.dev/)** - Next-generation frontend tooling
- **[Markdown](https://www.markdownguide.org/)** - Content authoring

## 📝 Writing Documentation

### Markdown Features

VitePress supports enhanced markdown:

**Code blocks with syntax highlighting:**
```markdown
\`\`\`typescript
const invoice = await api.createInvoice({
  amount: 100,
  currency: "USDC"
});
\`\`\`
```

**Admonitions:**
```markdown
::: tip
This is a helpful tip
:::

::: warning
This is a warning
:::

::: danger
This is dangerous information
:::
```

**Custom containers:**
```markdown
::: details Click to expand
Hidden content
:::
```

**Mermaid diagrams:**
```markdown
\`\`\`mermaid
graph LR
    A[Start] --> B[Process]
    B --> C[End]
\`\`\`
```

### File Organization

- Use descriptive filenames (kebab-case)
- Group related content in folders
- Keep files focused (one topic per file)
- Link between documents liberally

### Style Guidelines

1. **Headers**: Use sentence case
2. **Code**: Always specify language for syntax highlighting
3. **Links**: Use relative paths (`/guide/concepts`)
4. **Examples**: Show both request and response
5. **Clarity**: Write for beginners, link to advanced topics

## 🚀 Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Link2Pay/docs-link2pay)

**Manual deployment:**

1. Push to GitHub
2. Import project in Vercel
3. Set build command: `npm run docs:build`
4. Set output directory: `docs/.vitepress/dist`
5. Deploy!

### Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/Link2Pay/docs-link2pay)

**Configuration (`netlify.toml`):**
```toml
[build]
  command = "npm run docs:build"
  publish = "docs/.vitepress/dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### GitHub Pages

**GitHub Actions workflow (`.github/workflows/deploy.yml`):**
```yaml
name: Deploy Docs

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run docs:build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: docs/.vitepress/dist
```

## 🤝 Contributing

We welcome contributions! Here's how:

### Adding New Documentation

1. **Create a new markdown file** in the appropriate directory
2. **Add to sidebar** in `docs/.vitepress/config.ts`
3. **Write content** following style guidelines
4. **Test locally** with `npm run docs:dev`
5. **Submit PR** with clear description

### Fixing Typos/Errors

1. Click "Edit this page on GitHub" at bottom of any page
2. Make changes directly in GitHub UI
3. Submit PR

### Reporting Issues

Found a problem? [Open an issue](https://github.com/Link2Pay/docs-link2pay/issues) with:
- Page URL
- Description of issue
- Suggested improvement (optional)

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Live Docs**: [https://docs.link2pay.dev](https://docs.link2pay.dev)
- **Main App**: [https://app.link2pay.dev](https://app.link2pay.dev)
- **GitHub**: [https://github.com/Link2Pay](https://github.com/Link2Pay)
- **Discord**: [Join Community](#)

## 💬 Support

Need help?

- 📚 Read the docs (you are here!)
- 💬 Join our [Discord](#)
- 🐛 Report [issues](https://github.com/Link2Pay/docs-link2pay/issues)
- 📧 Email: [docs@link2pay.dev](mailto:docs@link2pay.dev)

---

Built with ❤️ by the Link2Pay team
