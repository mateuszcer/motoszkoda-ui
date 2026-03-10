import { useCallback, useSyncExternalStore } from 'react'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'autoceny_theme'

function getTheme(): Theme {
  return (localStorage.getItem(STORAGE_KEY) as Theme) || 'light'
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#070707' : '#0FA3A3')
}

let listeners: (() => void)[] = []

function subscribe(cb: () => void) {
  listeners.push(cb)
  return () => {
    listeners = listeners.filter((l) => l !== cb)
  }
}

function getSnapshot(): Theme {
  return getTheme()
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot)

  const toggle = useCallback(() => {
    const next: Theme = getTheme() === 'light' ? 'dark' : 'light'
    localStorage.setItem(STORAGE_KEY, next)
    applyTheme(next)
    for (const l of listeners) l()
  }, [])

  return { theme, toggle } as const
}
