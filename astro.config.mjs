// @ts-check
import { defineConfig } from 'astro/config'
import sanity from '@sanity/astro'
import react from '@astrojs/react'

export default defineConfig({
  integrations: [
    sanity({
      projectId: 'rlg8i7d8',
      dataset: 'production',
      apiVersion: '2026-08-28',
      useCdn: false,
    }),
    react(),
  ],
})