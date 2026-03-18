import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from './components/ErrorBoundary'
import './i18n'
import 'flag-icons/css/flag-icons.min.css'

import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <Suspense
        fallback={
          <main className="app-shell">
            <p className="loading">Loading...</p>
          </main>
        }
      >
        <App />
      </Suspense>
    </ErrorBoundary>
  </StrictMode>,
)
