import { memo, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { LanguagePicker } from './LanguagePicker'
import { ThemeToggle } from './ThemeToggle'

interface AppHeaderProps {
  brandMark?: ReactNode
  onBrandClick?: () => void
  navSlot?: ReactNode
  onLanguageChange?: (code: string) => void
}

const defaultBrandMark = <img src="/brand/white-logo.svg" alt="" className="app-header__logo" />

export const AppHeader = memo(function AppHeader({
  brandMark,
  onBrandClick,
  navSlot,
  onLanguageChange,
}: AppHeaderProps) {
  const { t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)

  const mark = brandMark ?? defaultBrandMark

  const closeMenu = useCallback(() => setMenuOpen(false), [])

  const toggleMenu = useCallback(() => setMenuOpen((prev) => !prev), [])

  // Close on Escape
  useEffect(() => {
    if (!menuOpen) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        toggleRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [menuOpen])

  // Close on click outside
  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        toggleRef.current &&
        !toggleRef.current.contains(target)
      ) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  // Close menu on nav item click (delegated)
  const handleNavClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement
      if (target.closest('button.btn-ghost') || target.closest('a')) {
        closeMenu()
      }
    },
    [closeMenu],
  )

  return (
    <header className={`app-header${menuOpen ? ' app-header--menu-open' : ''}`}>
      {onBrandClick ? (
        <button className="brand brand-btn" onClick={onBrandClick} type="button">
          {mark}
          <h1>Autoceny</h1>
        </button>
      ) : (
        <div className="brand">
          {mark}
          <h1>Autoceny</h1>
        </div>
      )}

      <button
        ref={toggleRef}
        className="mobile-menu-toggle"
        onClick={toggleMenu}
        aria-expanded={menuOpen}
        aria-label={t(menuOpen ? 'nav.closeMenu' : 'nav.openMenu')}
        type="button"
      >
        <span className="mobile-menu-toggle__bar" />
        <span className="mobile-menu-toggle__bar" />
        <span className="mobile-menu-toggle__bar" />
      </button>

      <div
        ref={menuRef}
        className={`header-actions${menuOpen ? ' header-actions--open' : ''}`}
        onClick={handleNavClick}
      >
        {navSlot}
        <div className="header-actions__utils">
          <ThemeToggle />
          <LanguagePicker onLanguageChange={onLanguageChange} />
        </div>
      </div>

      {menuOpen ? <div className="mobile-menu-backdrop" onClick={closeMenu} /> : null}
    </header>
  )
})
