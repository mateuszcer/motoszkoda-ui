import { useCallback, useEffect, useState } from 'react'
import type { AppScreen } from '../domain/types'

const PATH_TO_SCREEN: Record<string, AppScreen> = {
  '/': 'landing',
  '/login': 'login',
  '/register': 'register',
  '/check-email': 'check-email',
  '/signup-confirmation': 'signup-confirmation',
  '/forgot-password': 'forgot-password',
  '/reset-password': 'reset-password',
  '/home': 'home',
  '/create-request': 'create-request',
  '/my-requests': 'my-requests',
  '/request': 'request-detail',
  '/shop/login': 'shop-login',
  '/shop/register': 'shop-register',
  '/shop/inbox': 'shop-inbox',
  '/shop/request': 'shop-request-detail',
  '/shop/send-quote': 'shop-send-quote',
  '/shop/profile': 'shop-profile',
  '/shop/enroll': 'shop-enroll',
  '/shop/plan': 'shop-plan',
  '/plan': 'plan',
  '/plan/success': 'plan-success',
  '/plan/cancel': 'plan-cancel',
  '/admin': 'admin-login',
  '/admin/vouchers': 'admin-vouchers',
}

const SCREEN_TO_PATH = Object.fromEntries(
  Object.entries(PATH_TO_SCREEN).map(([path, screen]) => [screen, path]),
) as Record<AppScreen, string>

function screenFromPath(): AppScreen {
  return PATH_TO_SCREEN[window.location.pathname] ?? 'landing'
}

export function useRouting() {
  const [screen, setScreen] = useState<AppScreen>(screenFromPath)

  const navigate = useCallback((target: AppScreen, { replace = false } = {}) => {
    setScreen(target)
    const path = SCREEN_TO_PATH[target] ?? '/'
    if (window.location.pathname !== path) {
      if (replace) {
        window.history.replaceState({ screen: target }, '', path)
      } else {
        window.history.pushState({ screen: target }, '', path)
      }
    }
  }, [])

  // Sync on browser back / forward
  useEffect(() => {
    const onPopState = () => setScreen(screenFromPath())
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  return { screen, navigate }
}
