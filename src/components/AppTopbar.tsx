import { memo, type ReactNode } from 'react'
import { LanguagePicker } from './LanguagePicker'
import { ThemeToggle } from './ThemeToggle'

interface BreadcrumbItem {
  label: string
  onClick?: () => void
}

interface AppTopbarProps {
  breadcrumb?: BreadcrumbItem[]
  title?: string
  searchPlaceholder?: string
  userInitials: string
  onMenuToggle?: () => void
  onAvatarClick?: () => void
  onLanguageChange?: (code: string) => void
  rightSlot?: ReactNode
}

export const AppTopbar = memo(function AppTopbar({
  breadcrumb,
  title,
  searchPlaceholder,
  userInitials,
  onMenuToggle,
  onAvatarClick,
  onLanguageChange,
  rightSlot,
}: AppTopbarProps) {
  return (
    <header className="app-topbar">
      <div className="app-topbar__left">
        {onMenuToggle ? (
          <button className="app-topbar__hamburger" onClick={onMenuToggle} type="button" aria-label="Menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        ) : null}
        {breadcrumb ? (
          <>
            {breadcrumb[0]?.onClick ? (
              <button
                className="app-topbar__breadcrumb-back"
                onClick={breadcrumb[0].onClick}
                type="button"
                aria-label={breadcrumb[0].label}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            ) : null}
            <nav className="app-topbar__breadcrumb">
              {breadcrumb.map((item, i) => {
                const isLast = i === breadcrumb.length - 1
                return isLast ? (
                  <span key={i} className="app-topbar__breadcrumb-current">
                    {item.label}
                  </span>
                ) : (
                  <span key={i} style={{ display: 'contents' }}>
                    {item.onClick ? (
                      <button className="app-topbar__breadcrumb-link" onClick={item.onClick} type="button">
                        {item.label}
                      </button>
                    ) : (
                      <span className="app-topbar__breadcrumb-link">{item.label}</span>
                    )}
                    <svg
                      className="app-topbar__breadcrumb-separator"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </span>
                )
              })}
            </nav>
          </>
        ) : searchPlaceholder ? (
          <label className="app-topbar__search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input type="text" placeholder={searchPlaceholder} />
          </label>
        ) : title ? (
          <span className="app-topbar__title">{title}</span>
        ) : null}
      </div>
      <div className="app-topbar__right">
        {rightSlot}
        <div className="app-topbar__utilities">
          <ThemeToggle />
          <LanguagePicker onLanguageChange={onLanguageChange} />
        </div>
        {onAvatarClick ? (
          <button className="avatar" type="button" onClick={onAvatarClick} aria-label="Profile">
            {userInitials}
          </button>
        ) : (
          <div className="avatar">{userInitials}</div>
        )}
      </div>
    </header>
  )
})
