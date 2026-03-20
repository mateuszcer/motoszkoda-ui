import type { ReactNode } from 'react'

interface AppLayoutProps {
  sidebar: ReactNode
  topbar: ReactNode
  children: ReactNode
}

export function AppLayout({ sidebar, topbar, children }: AppLayoutProps) {
  return (
    <div className="app-layout">
      {sidebar}
      <div className="app-layout__main">
        {topbar}
        <div className="app-layout__content">{children}</div>
      </div>
    </div>
  )
}
