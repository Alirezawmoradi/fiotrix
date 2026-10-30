import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/App'
import { registerServiceWorker } from '@/sw/registerServiceWorker'
import './index.css'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element #root not found')

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Only in production: in development, a caching worker would serve stale code.
if (import.meta.env.PROD) registerServiceWorker()
