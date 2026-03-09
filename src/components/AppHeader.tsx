import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ThemeToggle } from './ThemeToggle'

function LanguageToggle() {
  const { i18n } = useTranslation()
  const isPolish = i18n.language.startsWith('pl')

  return (
    <button
      className="btn btn-ghost lang-toggle"
      onClick={() => {
        void i18n.changeLanguage(isPolish ? 'en' : 'pl')
      }}
    >
      {isPolish ? 'EN' : 'PL'}
    </button>
  )
}

interface AppHeaderProps {
  brandMark?: ReactNode
  brandMarkClass?: string
  onBrandClick?: () => void
  navSlot?: ReactNode
}

const defaultBrandMark = <img src="/logo/logomark-whitee.svg" alt="" className="brand-mark-logo" />

export function AppHeader({ brandMark, brandMarkClass, onBrandClick, navSlot }: AppHeaderProps) {
  const mark = brandMark ?? defaultBrandMark
  return (
    <header className="app-header">
      {onBrandClick ? (
        <button className="brand brand-btn" onClick={onBrandClick} type="button">
          <div className={`brand-mark${brandMarkClass ? ` ${brandMarkClass}` : ''}`}>{mark}</div>
          <h1>Autoceny</h1>
        </button>
      ) : (
        <div className="brand">
          <div className={`brand-mark${brandMarkClass ? ` ${brandMarkClass}` : ''}`}>{mark}</div>
          <h1>Autoceny</h1>
        </div>
      )}
      <div className="header-actions">
        {navSlot}
        <ThemeToggle />
        <LanguageToggle />
      </div>
    </header>
  )
}
