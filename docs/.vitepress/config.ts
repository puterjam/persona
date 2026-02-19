import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Persona',
  description: 'AI Coding CLI Provider Manager',
  base: '/persona/',
  head: [
    ['link', { rel: 'icon', href: '/persona/favicon.ico' }]
  ],
  themeConfig: {
    nav: [
      { text: 'Home', link: '/persona/' },
      { text: 'Guide', link: '/persona/guide/install' },
      { text: 'GitHub', link: 'https://github.com/puterjam/persona' }
    ],

    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Installation', link: '/persona/guide/install' },
          { text: 'Usage', link: '/persona/guide/usage' },
          { text: 'Commands', link: '/persona/guide/commands' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/puterjam/persona' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present'
    },

    search: {
      provider: 'local'
    },

    outline: 'deep'
  }
})
