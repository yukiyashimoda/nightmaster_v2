import { defineConfig } from 'vite'
import { reactRouter } from '@react-router/dev/vite'
import { cloudflareDevProxy } from '@react-router/dev/vite/cloudflare'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [
    cloudflareDevProxy(),
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
  ],
})
