import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Persona',
  description: 'AI Coding CLI Provider Manager',
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }]
  ],
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/install' },
      { text: 'GitHub', link: 'https://github.com/puterjam/persona' }
    ],

    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Installation', link: '/guide/install' },
          { text: 'Usage', link: '/guide/usage' },
          { text: 'Commands', link: '/guide/commands' }
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
