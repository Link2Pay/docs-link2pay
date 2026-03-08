import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(defineConfig({
  base: '/docs-link2pay/',
  ignoreDeadLinks: true,
  title: 'Link2Pay',
  description: 'Stellar blockchain payment infrastructure for modern applications',

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#5f67ee' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'Link2Pay Documentation' }],
    ['meta', { property: 'og:description', content: 'Official documentation for Link2Pay - Stellar blockchain payment infrastructure' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
  ],

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/introduction' },
      { text: 'API', link: '/api/overview' },
      { text: 'SDK', link: '/sdk/overview' },
      {
        text: 'Resources',
        items: [
          { text: 'Dashboard', link: 'https://app.link2pay.dev' },
          { text: 'GitHub', link: 'https://github.com/Link2Pay' },
          { text: 'Discord', link: '#' },
        ]
      }
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          collapsed: false,
          items: [
            { text: 'Introduction', link: '/guide/introduction' },
            { text: 'Why Link2Pay?', link: '/guide/why-link2pay' },
            { text: 'Quick Start', link: '/guide/quick-start' },
            { text: 'Core Concepts', link: '/guide/concepts' },
          ]
        },
        {
          text: 'Features',
          collapsed: false,
          items: [
            { text: 'Payment Links', link: '/guide/features/payment-links' },
            { text: 'Invoicing', link: '/guide/features/invoicing' },
            { text: 'Multi-Asset Support', link: '/guide/features/multi-asset' },
            { text: 'Network Detection', link: '/guide/features/network-detection' },
            { text: 'Real-Time Settlement', link: '/guide/features/settlement' },
          ]
        },
        {
          text: 'Integration',
          collapsed: false,
          items: [
            { text: 'Frontend Integration', link: '/guide/integration/frontend' },
            { text: 'Backend Integration', link: '/guide/integration/backend' },
            { text: 'Webhook Events', link: '/guide/integration/webhooks' },
            { text: 'Authentication', link: '/guide/integration/authentication' },
          ]
        },
        {
          text: 'Advanced',
          collapsed: false,
          items: [
            { text: 'Security Model', link: '/guide/advanced/security' },
            { text: 'Network Architecture', link: '/guide/advanced/architecture' },
            { text: 'Database Schema', link: '/guide/advanced/database' },
            { text: 'Payment Watcher', link: '/guide/advanced/watcher' },
          ]
        }
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/overview' },
            { text: 'Authentication', link: '/api/authentication' },
            { text: 'Rate Limits', link: '/api/rate-limits' },
            { text: 'Errors', link: '/api/errors' },
          ]
        },
        {
          text: 'Endpoints',
          items: [
            { text: 'Auth', link: '/api/endpoints/auth' },
            { text: 'Invoices', link: '/api/endpoints/invoices' },
            { text: 'Payments', link: '/api/endpoints/payments' },
            { text: 'Payment Links', link: '/api/endpoints/links' },
            { text: 'Clients', link: '/api/endpoints/clients' },
            { text: 'Prices', link: '/api/endpoints/prices' },
          ]
        },
        {
          text: 'Resources',
          items: [
            { text: 'Invoice Object', link: '/api/resources/invoice' },
            { text: 'Payment Object', link: '/api/resources/payment' },
            { text: 'Client Object', link: '/api/resources/client' },
          ]
        }
      ],
      '/sdk/': [
        {
          text: 'SDK Documentation',
          items: [
            { text: 'Overview', link: '/sdk/overview' },
            { text: 'Installation', link: '/sdk/installation' },
          ]
        },
        {
          text: 'React Hooks',
          items: [
            { text: 'useWallet', link: '/sdk/hooks/use-wallet' },
            { text: 'useInvoice', link: '/sdk/hooks/use-invoice' },
            { text: 'usePayment', link: '/sdk/hooks/use-payment' },
            { text: 'useNetwork', link: '/sdk/hooks/use-network' },
          ]
        },
        {
          text: 'Examples',
          items: [
            { text: 'Create Invoice', link: '/sdk/examples/create-invoice' },
            { text: 'Process Payment', link: '/sdk/examples/process-payment' },
            { text: 'Payment Button', link: '/sdk/examples/payment-button' },
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/Link2Pay' },
      { icon: 'twitter', link: 'https://twitter.com/link2pay' },
      { icon: 'discord', link: '#' }
    ],

    footer: {
      message: 'Built on Stellar blockchain',
      copyright: 'Copyright © 2024-present Link2Pay'
    },

    search: {
      provider: 'local'
    },

    editLink: {
      pattern: 'https://github.com/Link2Pay/docs-link2pay/edit/main/docs/:path',
      text: 'Edit this page on GitHub'
    }
  },

  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    },
    lineNumbers: true
  },

  mermaid: {
    // Mermaid configuration options
  },

  mermaidPlugin: {
    class: 'mermaid'
  }
}))
