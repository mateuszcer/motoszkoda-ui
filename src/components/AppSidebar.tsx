import type React from 'react'
import { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { AppScreen } from '../domain/types'

interface AppSidebarProps {
  role: 'driver' | 'shop' | 'admin'
  activeScreen: AppScreen
  userName: string
  userEmail: string
  userInitials: string
  notificationCounts?: { overview?: number; messages?: number; inbox?: number }
  onNavigate: (screen: AppScreen) => void
  onLogout: () => void
  isOpen?: boolean
  onClose?: () => void
}

interface NavItem {
  screen: AppScreen
  label: string
  icon: string
  badge?: number
}

const ICONS: Record<string, React.ReactNode> = {
  overview: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  requests: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  messages: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  plan: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  inbox: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    </svg>
  ),
  sentQuotes: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  shopProfile: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  subscription: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  admin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
}

function SidebarItem({
  item,
  isActive,
  onNavigate,
}: {
  item: NavItem
  isActive: boolean
  onNavigate: (screen: AppScreen) => void
}) {
  const handleClick = useCallback(() => onNavigate(item.screen), [onNavigate, item.screen])

  return (
    <button
      className={`app-sidebar__item${isActive ? ' app-sidebar__item--active' : ''}`}
      onClick={handleClick}
      type="button"
    >
      {ICONS[item.icon]}
      {item.label}
      {item.badge ? <span className="app-sidebar__badge">{item.badge}</span> : null}
    </button>
  )
}

export const AppSidebar = memo(function AppSidebar({
  role,
  activeScreen,
  userName,
  userEmail,
  userInitials,
  notificationCounts,
  onNavigate,
  onLogout,
  isOpen,
  onClose,
}: AppSidebarProps) {
  const { t } = useTranslation()

  const handleNav = useCallback(
    (screen: AppScreen) => {
      onNavigate(screen)
      onClose?.()
    },
    [onNavigate, onClose],
  )

  const driverMainNav: NavItem[] = [
    { screen: 'home', label: t('sidebar.overview'), icon: 'overview', badge: notificationCounts?.overview },
    { screen: 'my-requests', label: t('sidebar.myRequests'), icon: 'requests' },
    { screen: 'messages', label: t('sidebar.messages'), icon: 'messages', badge: notificationCounts?.messages },
  ]

  const driverAccountNav: NavItem[] = [
    { screen: 'plan', label: t('sidebar.myPlan'), icon: 'plan' },
    { screen: 'settings', label: t('sidebar.settings'), icon: 'settings' },
  ]

  const shopMainNav: NavItem[] = [
    { screen: 'shop-inbox', label: t('sidebar.inbox'), icon: 'inbox', badge: notificationCounts?.inbox },
    { screen: 'shop-messages', label: t('sidebar.messages'), icon: 'messages', badge: notificationCounts?.messages },
  ]

  const shopAccountNav: NavItem[] = [
    { screen: 'shop-profile', label: t('sidebar.shopProfile'), icon: 'shopProfile' },
    { screen: 'shop-plan', label: t('sidebar.subscription'), icon: 'subscription' },
    { screen: 'shop-settings', label: t('sidebar.settings'), icon: 'settings' },
  ]

  const adminMainNav: NavItem[] = [{ screen: 'admin-vouchers', label: 'Vouchers', icon: 'admin' }]

  const mainNav = role === 'driver' ? driverMainNav : role === 'shop' ? shopMainNav : adminMainNav
  const accountNav = role === 'driver' ? driverAccountNav : role === 'shop' ? shopAccountNav : []
  const sectionLabel =
    role === 'driver' ? t('sidebar.driver') : role === 'shop' ? t('sidebar.shop') : t('sidebar.admin')

  return (
    <>
      {isOpen ? (
        <div className="app-sidebar-backdrop app-sidebar-backdrop--open" onClick={onClose} aria-hidden="true" />
      ) : null}
      <aside className={`app-sidebar app-sidebar--${role}${isOpen ? ' app-sidebar--open' : ''}`}>
        <div className="app-sidebar__logo">
          <img src="/brand/white-logo.svg" alt="" className="app-sidebar__logo-img" />
          <span>Autoceny</span>
        </div>
        <nav className="app-sidebar__nav">
          <div className="app-sidebar__section">
            <div className="app-sidebar__section-label">{sectionLabel}</div>
            {mainNav.map((item) => (
              <SidebarItem
                key={item.screen}
                item={item}
                isActive={activeScreen === item.screen}
                onNavigate={handleNav}
              />
            ))}
          </div>
          {accountNav.length > 0 ? (
            <div className="app-sidebar__section" style={{ marginTop: 8 }}>
              <div className="app-sidebar__section-label">{t('sidebar.account')}</div>
              {accountNav.map((item) => (
                <SidebarItem
                  key={item.screen}
                  item={item}
                  isActive={activeScreen === item.screen}
                  onNavigate={handleNav}
                />
              ))}
            </div>
          ) : null}
        </nav>
        <div className="app-sidebar__footer">
          <div className="app-sidebar__user">
            <div className="avatar">{userInitials}</div>
            <div>
              <div className="app-sidebar__user-name">{userName}</div>
              <div className="app-sidebar__user-email">{userEmail}</div>
            </div>
          </div>
          <button
            className="app-sidebar__item"
            onClick={() => {
              onLogout()
              onClose?.()
            }}
            type="button"
          >
            {ICONS.logout}
            {t('sidebar.logout')}
          </button>
        </div>
      </aside>
    </>
  )
})
