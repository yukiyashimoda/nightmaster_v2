import type { PlatformProxy } from 'wrangler'

interface Env {
  DATABASE_URL: string
}

type Cloudflare = Omit<PlatformProxy<Env>, 'dispose'>

declare module 'react-router' {
  interface AppLoadContext {
    cloudflare: Cloudflare
  }
}
