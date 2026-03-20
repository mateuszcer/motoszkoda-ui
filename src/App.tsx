import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import './App.css'
import { AdminLoginView } from './components/AdminLoginView'
import { AppHeader } from './components/AppHeader'
import { AppLayout } from './components/AppLayout'
import { AppSidebar } from './components/AppSidebar'
import { AppTopbar } from './components/AppTopbar'
import { CheckEmailView } from './components/CheckEmailView'
import { EnrollmentGate } from './components/EnrollmentGate'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ForgotPasswordView } from './components/ForgotPasswordView'
import { LoginView } from './components/LoginView'
import { RegisterView } from './components/RegisterView'
import { ResetPasswordView } from './components/ResetPasswordView'
import { SettingsView } from './components/SettingsView'
import { ShopRegisterView } from './components/ShopRegisterView'
import { SignupConfirmationView } from './components/SignupConfirmationView'
import { UpgradeLimitModal } from './components/UpgradeLimitModal'
import type { BillingInterval, ShopRegistrationRequest, UserPlanInfo } from './domain/apiTypes'
import type { AuthState } from './domain/auth-types'
import type {
  Attachment,
  CreateRepairRequestPayload,
  EnrollmentStatus,
  NotificationEvent,
  RepairRequest,
} from './domain/types'
import { useRouting } from './hooks/useRouting'
import { usePlan } from './hooks/usePlan'
import { usePlanCatalog } from './hooks/usePlanCatalog'
import { useShopPortal } from './hooks/useShopPortal'
import { cancelProactiveRefresh, clearApiCache, setOnUnauthorized } from './services/apiClient'
import { authApi } from './services/authApi'
import { billingApi } from './services/billingApi'
import { enrollmentApi } from './services/enrollmentApi'
import * as localPrefs from './services/localPreferences'
import { fetchNotifications } from './services/notificationsApi'
import { uploadAttachments } from './services/attachmentApi'
import { repairRequestApi } from './services/repairRequestApi'
import { updateLanguagePreference } from './services/userSettingsApi'
import { assertSafeRedirectUrl } from './utils/validation'

import { AdminVouchersView } from './components/AdminVouchersView'
import { CreateRepairRequestFlow } from './components/CreateRepairRequestFlow'
import { HomeView } from './components/HomeView'
import { LandingPage } from './components/LandingPage'
import { MessagesView } from './components/MessagesView'
import { MyRequestsView } from './components/MyRequestsView'
import { PlanCancelView } from './components/PlanCancelView'
import { PlanSuccessView } from './components/PlanSuccessView'
import { PlanView } from './components/PlanView'
import { RepairRequestDetail } from './components/RepairRequestDetail'
import { ShopInboxView } from './components/ShopInboxView'
import { ShopMessagesView } from './components/ShopMessagesView'
import { ShopPlanView } from './components/ShopPlanView'
import { ShopProfileView } from './components/ShopProfileView'
import { ShopRequestDetailView } from './components/ShopRequestDetailView'
import { ShopSendQuoteView } from './components/ShopSendQuoteView'

const NOTIFICATION_POLL_INTERVAL = 60_000
const PUBLIC_SCREENS = new Set([
  'landing',
  'login',
  'register',
  'check-email',
  'signup-confirmation',
  'forgot-password',
  'reset-password',
  'shop-login',
  'shop-register',
  'admin-login',
])

const sortRequests = (requests: RepairRequest[]): RepairRequest[] => {
  return [...requests].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
}

function BannerStack({ banners }: { banners: NotificationEvent[] }) {
  if (banners.length === 0) return null
  return (
    <section className="banner-stack" aria-live="polite">
      {banners.map((banner) => (
        <article className={`banner banner-${banner.type}`} key={banner.id}>
          <strong>{banner.title}</strong>
          <p>{banner.message}</p>
        </article>
      ))}
    </section>
  )
}

function App() {
  const { t } = useTranslation()
  const { screen, navigate } = useRouting()
  const [requests, setRequests] = useState<RepairRequest[]>([])
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [banners, setBanners] = useState<NotificationEvent[]>([])

  const [auth, setAuth] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
  })
  const [authLoading, setAuthLoading] = useState(true)

  const [loginMode, setLoginMode] = useState<'driver' | 'workshop'>('driver')
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)

  const [enrollmentStatus, setEnrollmentStatus] = useState<EnrollmentStatus | null>(null)
  const [enrollmentCancelAt, setEnrollmentCancelAt] = useState<string | null>(null)
  const [enrollmentLoading, setEnrollmentLoading] = useState(false)

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showCloseDialog, setShowCloseDialog] = useState(false)

  const lastNotificationTime = useRef<string | undefined>(undefined)
  const isFirstPoll = useRef(true)

  // Read reset-password token once, then strip it from the URL to prevent leakage via Referer headers / browser history
  const resetToken = useMemo(() => {
    if (screen !== 'reset-password') return ''
    const token = new URLSearchParams(window.location.search).get('token') ?? ''
    if (token) {
      const url = new URL(window.location.href)
      url.searchParams.delete('token')
      window.history.replaceState(null, '', url.pathname + url.hash)
    }
    return token
  }, [screen])

  const selectedRequest = useMemo(() => {
    if (!selectedRequestId) {
      return null
    }

    return requests.find((request) => request.id === selectedRequestId) ?? null
  }, [requests, selectedRequestId])

  const handleLanguageChange = useCallback(
    (code: string) => {
      if (!auth.isAuthenticated) return
      const map: Record<string, 'PL' | 'EN'> = { pl: 'PL', en: 'EN' }
      const backendCode = map[code]
      if (!backendCode) return
      void updateLanguagePreference(backendCode).catch(() => undefined)
    },
    [auth.isAuthenticated],
  )

  const doLogout = useCallback(() => {
    const wasAdmin = auth.user?.role === 'ADMIN'
    cancelProactiveRefresh()
    void authApi.logout()
    clearApiCache()
    setAuth({ user: null, token: null, isAuthenticated: false })
    setEnrollmentStatus(null)
    setEnrollmentCancelAt(null)
    setRequests([])
    setBanners([])
    lastNotificationTime.current = undefined
    isFirstPoll.current = true
    navigate(wasAdmin ? 'admin-login' : 'landing', { replace: true })
  }, [auth.user?.role, navigate])

  // Wire up 401 auto-logout
  useEffect(() => {
    setOnUnauthorized(doLogout)
  }, [doLogout])

  const pushBanner = useCallback((event: NotificationEvent) => {
    setBanners((previous) => [event, ...previous].slice(0, 4))

    window.setTimeout(() => {
      setBanners((previous) => previous.filter((entry) => entry.id !== event.id))
    }, 6000)
  }, [])

  const loadRequests = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await repairRequestApi.listRequests()
      setRequests(sortRequests(list))
    } catch {
      setError('app.loadError')
    } finally {
      setLoading(false)
    }
  }, [])

  // Shop portal hook
  const isShop = auth.user?.role === 'SHOP_USER'
  const isDriver = auth.isAuthenticated && !isShop && auth.user?.role !== 'ADMIN'
  const catalog = usePlanCatalog()
  const plan = usePlan(auth.isAuthenticated, isDriver, catalog.getEntitlements('FREE'))
  const [limitModal, setLimitModal] = useState<'open_orders' | 'daily_orders' | 'questions' | null>(null)
  const [upgradeLoading, setUpgradeLoading] = useState(false)
  const shop = useShopPortal()
  const [shopSelectedRequestId, setShopSelectedRequestId] = useState<string | null>(null)
  const [shopDetailInitialTab, setShopDetailInitialTab] = useState<'details' | 'messages'>('details')
  const [shopDetailSourceScreen, setShopDetailSourceScreen] = useState<'shop-inbox' | 'shop-messages'>('shop-inbox')

  // Restore session on mount
  useEffect(() => {
    const restore = async () => {
      const session = await authApi.restoreSession()
      if (session) {
        const currentPath = window.location.pathname
        setAuth({
          user: session.user,
          token: session.accessToken,
          isAuthenticated: true,
        })
        const currentScreen =
          currentPath === '/'
            ? 'landing'
            : currentPath === '/login'
              ? 'login'
              : currentPath === '/register'
                ? 'register'
                : currentPath === '/check-email'
                  ? 'check-email'
                  : currentPath === '/signup-confirmation'
                    ? 'signup-confirmation'
                    : currentPath === '/forgot-password'
                      ? 'forgot-password'
                      : currentPath === '/reset-password'
                        ? 'reset-password'
                        : currentPath === '/shop/login'
                          ? 'shop-login'
                          : currentPath === '/shop/register'
                            ? 'shop-register'
                            : currentPath === '/admin'
                              ? 'admin-login'
                              : null

        if (session.user.role === 'ADMIN') {
          if (currentScreen && PUBLIC_SCREENS.has(currentScreen)) {
            navigate('admin-vouchers', { replace: true })
          }
        } else if (session.user.role === 'SHOP_USER') {
          setEnrollmentLoading(true)
          try {
            const status = await enrollmentApi.getStatus()
            setEnrollmentStatus(status.status)
            setEnrollmentCancelAt(status.cancelAt ?? null)
          } catch {
            setEnrollmentStatus(null)
          } finally {
            setEnrollmentLoading(false)
          }
          if (currentScreen && PUBLIC_SCREENS.has(currentScreen)) {
            navigate('shop-inbox', { replace: true })
          }
        } else {
          if (currentScreen && PUBLIC_SCREENS.has(currentScreen)) {
            navigate('home', { replace: true })
          }
        }
      }
      setAuthLoading(false)
    }
    void restore()
  }, [navigate])

  // Redirect shop-login to unified login in workshop mode
  useEffect(() => {
    if (screen === 'shop-login') {
      setLoginMode('workshop')
      navigate('login', { replace: true })
    }
  }, [screen, navigate])

  const isAdmin = auth.user?.role === 'ADMIN'
  const { loadShopQueue } = shop

  // Load requests when authenticated (skip for admin)
  // For shops, re-fetch when enrollmentStatus becomes ACTIVE (e.g. after payment)
  useEffect(() => {
    if (auth.isAuthenticated && !isAdmin) {
      if (isShop) {
        if (enrollmentStatus === 'ACTIVE' || enrollmentStatus === 'CANCEL_SCHEDULED') {
          void loadShopQueue()
        }
      } else {
        void loadRequests()
      }
    }
  }, [auth.isAuthenticated, isAdmin, isShop, enrollmentStatus, loadRequests, loadShopQueue])

  const handleLogin = useCallback(
    async (email: string, password: string, captchaToken?: string) => {
      const result = await authApi.login(email, password, captchaToken)
      setAuth({ user: result.user, token: result.token, isAuthenticated: true })
      navigate('home', { replace: true })
    },
    [navigate],
  )

  const handleRegister = useCallback(
    async (email: string, password: string, captchaToken?: string) => {
      await authApi.register(email, password, captchaToken)
      setPendingEmail(email)
      navigate('check-email', { replace: true })
    },
    [navigate],
  )

  const handleShopLogin = useCallback(
    async (email: string, password: string, captchaToken?: string) => {
      const result = await authApi.shopLogin(email, password, captchaToken)
      setAuth({ user: result.user, token: result.token, isAuthenticated: true })
      setEnrollmentLoading(true)
      try {
        const status = await enrollmentApi.getStatus()
        setEnrollmentStatus(status.status)
        setEnrollmentCancelAt(status.cancelAt ?? null)
      } catch {
        setEnrollmentStatus(null)
      } finally {
        setEnrollmentLoading(false)
      }
      navigate('shop-inbox', { replace: true })
    },
    [navigate],
  )

  const handleShopRegister = useCallback(
    async (payload: ShopRegistrationRequest) => {
      await enrollmentApi.register(payload)
      setPendingEmail(payload.email)
      navigate('check-email', { replace: true })
    },
    [navigate],
  )

  const handleAdminLogin = useCallback(
    async (email: string, password: string, captchaToken?: string) => {
      const result = await authApi.adminLogin(email, password, captchaToken)
      setAuth({ user: result.user, token: result.token, isAuthenticated: true })
      navigate('admin-vouchers', { replace: true })
    },
    [navigate],
  )

  const handleRequestPasswordReset = useCallback(async (email: string, captchaToken?: string) => {
    await authApi.requestPasswordReset(email, captchaToken)
  }, [])

  const handleResendConfirmation = useCallback(async (email: string) => {
    await authApi.resendConfirmation(email)
  }, [])

  const handleResetPassword = useCallback(async (accessToken: string, newPassword: string) => {
    await authApi.resetPassword(accessToken, newPassword)
  }, [])

  const upsertRequest = useCallback((updatedRequest: RepairRequest) => {
    setRequests((previous) => {
      const withoutCurrent = previous.filter((request) => request.id !== updatedRequest.id)
      return sortRequests([...withoutCurrent, updatedRequest])
    })
  }, [])

  const openRequestDetail = useCallback(
    async (requestId: string) => {
      setSelectedRequestId(requestId)
      setShowCloseDialog(false)
      navigate('request-detail')

      if (!auth.user) return

      const detail = await repairRequestApi.fetchRequestDetail(requestId)
      if (detail) {
        upsertRequest(detail)
      }
    },
    [navigate, auth.user, upsertRequest],
  )

  const handleCreateRequest = async (
    payload: CreateRepairRequestPayload,
    files: Map<string, File>,
  ): Promise<RepairRequest> => {
    const created = await repairRequestApi.createRequest(payload)
    upsertRequest(created)
    pushBanner({
      id: `notif_${Date.now().toString(36)}`,
      requestId: created.id,
      type: 'request_submitted',
      title: t('notification.requestSubmittedTitle'),
      message: t('notification.requestSubmittedMessage'),
      createdAt: new Date().toISOString(),
    })

    // Upload attachments in the background — don't block the success flow
    if (files.size > 0) {
      void uploadAttachments(files, payload.issue.attachments, 'REPAIR_REQUEST', created.id)
    }

    return created
  }

  const handleCloseRequest = async (requestId: string) => {
    const updated = await repairRequestApi.closeRequest(requestId)
    upsertRequest(updated)
  }

  const handleMarkInterested = async (requestId: string, shopId: string) => {
    localPrefs.markInterested(requestId, shopId)
    // Optimistic UI update
    setRequests((previous) =>
      previous.map((req) => {
        if (req.id !== requestId) return req
        return {
          ...req,
          shopQuotes: req.shopQuotes.map((sq) =>
            sq.shopId === shopId ? { ...sq, interested: true, ignored: false } : sq,
          ),
        }
      }),
    )
  }

  const handleIgnoreShop = async (requestId: string, shopId: string) => {
    localPrefs.ignoreShop(requestId, shopId)
    // Optimistic UI update
    setRequests((previous) =>
      previous.map((req) => {
        if (req.id !== requestId) return req
        return {
          ...req,
          shopQuotes: req.shopQuotes.map((sq) =>
            sq.shopId === shopId ? { ...sq, ignored: true, interested: false } : sq,
          ),
        }
      }),
    )
  }

  const handleSendThreadMessage = async (
    requestId: string,
    shopId: string,
    text: string,
    attachments: Attachment[],
    files?: Map<string, File>,
  ) => {
    // Check question limit for free users
    const req = requests.find((r) => r.id === requestId)
    if (req && plan.isAtQuestionLimit(req, shopId)) {
      setLimitModal('questions')
      return
    }

    await repairRequestApi.sendThreadMessage({
      requestId,
      shopId,
      text,
      attachments: [],
    })

    // Upload attachments in the background
    if (files && files.size > 0) {
      void uploadAttachments(files, attachments, 'MESSAGE_THREAD', requestId, shopId)
    }

    // Re-fetch the detail to get updated threads
    if (auth.user) {
      const updated = await repairRequestApi.fetchRequestDetail(requestId)
      if (updated) {
        upsertRequest(updated)
      }
    }
  }

  // Notification polling
  useEffect(() => {
    if (!auth.isAuthenticated || isAdmin) return

    const poll = async () => {
      try {
        const page = await fetchNotifications(10)
        if (page.notifications.length === 0) return

        const newest = page.notifications[0]
        if (lastNotificationTime.current && newest.createdAt <= lastNotificationTime.current) {
          return // No new notifications
        }

        // On first poll after mount/refresh, just record the high-water mark
        // so we don't re-show already-existing unread notifications as banners.
        if (isFirstPoll.current) {
          isFirstPoll.current = false
          lastNotificationTime.current = newest.createdAt
          return
        }

        // Find notifications newer than what we've seen
        const newOnes = lastNotificationTime.current
          ? page.notifications.filter((n) => n.createdAt > lastNotificationTime.current!)
          : []

        lastNotificationTime.current = newest.createdAt

        for (const n of newOnes) {
          const payload = n.payload as Record<string, string>
          pushBanner({
            id: n.id,
            requestId: payload.repairRequestId ?? '',
            shopId: payload.shopId,
            type:
              n.type === 'SHOP_SENT_QUOTE'
                ? 'new_quote'
                : n.type === 'SHOP_ACKNOWLEDGED_REQUEST'
                  ? 'shop_acknowledged'
                  : n.type === 'SHOP_ASKED_QUESTION'
                    ? 'new_question'
                    : 'request_submitted',
            title:
              n.type === 'SHOP_SENT_QUOTE'
                ? t('notification.shopSentQuoteTitle')
                : n.type === 'SHOP_ACKNOWLEDGED_REQUEST'
                  ? t('notification.shopAcknowledgedTitle')
                  : n.type === 'SHOP_ASKED_QUESTION'
                    ? t('notification.shopAskedQuestionTitle')
                    : t('notification.requestSubmittedTitle'),
            message:
              n.type === 'SHOP_SENT_QUOTE'
                ? t('notification.shopSentQuoteMessage')
                : n.type === 'SHOP_ACKNOWLEDGED_REQUEST'
                  ? t('notification.shopAcknowledgedMessage')
                  : n.type === 'SHOP_ASKED_QUESTION'
                    ? t('notification.shopAskedQuestionMessage')
                    : t('notification.requestSubmittedMessage'),
            createdAt: n.createdAt,
          })

          // If we're viewing this request's detail, refresh it
          if (selectedRequestId && payload.repairRequestId === selectedRequestId && auth.user) {
            repairRequestApi.invalidateCache(selectedRequestId)
            const updated = await repairRequestApi.fetchRequestDetail(selectedRequestId)
            if (updated) {
              upsertRequest(updated)
            }
          }
        }
      } catch {
        // Polling errors are non-critical — silently ignore
      }
    }

    // Initial poll
    void poll()

    const intervalId = window.setInterval(() => {
      void poll()
    }, NOTIFICATION_POLL_INTERVAL)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [auth.isAuthenticated, auth.user, isAdmin, pushBanner, selectedRequestId, upsertRequest, t])

  // Auth loading state
  if (authLoading) {
    return (
      <main className="app-shell">
        <p className="loading">{t('app.loading')}</p>
      </main>
    )
  }

  // Landing page (unauthenticated entry point)
  if (!auth.isAuthenticated && screen === 'landing') {
    return (
      <ErrorBoundary>
        <LandingPage
          onGetStarted={() => navigate('login')}
          onJoinAsShop={() => {
            setLoginMode('workshop')
            navigate('login')
          }}
          billingCatalog={catalog.billingCatalog}
          enrollmentCatalog={catalog.enrollmentCatalog}
        />
      </ErrorBoundary>
    )
  }

  // Check-email screen (shown immediately after registration)
  if (!auth.isAuthenticated && screen === 'check-email' && pendingEmail) {
    return (
      <main className="app-shell">
        <AppHeader onBrandClick={() => navigate('landing')} />
        <CheckEmailView
          email={pendingEmail}
          onGoToLogin={() => navigate('login')}
          onResendConfirmation={handleResendConfirmation}
        />
      </main>
    )
  }

  // Signup confirmation screen (auth provider redirect target)
  if (!auth.isAuthenticated && screen === 'signup-confirmation') {
    return (
      <main className="app-shell">
        <AppHeader onBrandClick={() => navigate('landing')} />
        <SignupConfirmationView onGoToLogin={() => navigate('login')} />
      </main>
    )
  }

  // Forgot password screen
  if (!auth.isAuthenticated && screen === 'forgot-password') {
    return (
      <main className="app-shell">
        <AppHeader onBrandClick={() => navigate('landing')} />
        <ForgotPasswordView onSubmit={handleRequestPasswordReset} onBackToLogin={() => navigate('login')} />
      </main>
    )
  }

  // Reset password screen (accessed via email link with token in URL)
  if (!auth.isAuthenticated && screen === 'reset-password') {
    return (
      <main className="app-shell">
        <AppHeader onBrandClick={() => navigate('landing')} />
        <ResetPasswordView
          accessToken={resetToken}
          onSubmit={handleResetPassword}
          onGoToLogin={() => navigate('login')}
        />
      </main>
    )
  }

  // Admin login screen (unauthenticated)
  if (!auth.isAuthenticated && screen === 'admin-login') {
    return (
      <main className="app-shell admin-shell">
        <AppHeader />
        <AdminLoginView onLogin={handleAdminLogin} />
      </main>
    )
  }

  // Auth screens (login/register) — driver & shop
  if (!auth.isAuthenticated) {
    const authMode = screen === 'shop-register' ? 'workshop' : screen === 'register' ? 'driver' : loginMode
    return (
      <main className="app-shell" data-auth-mode={authMode}>
        <AppHeader onBrandClick={() => navigate('landing')} />
        {screen === 'shop-register' ? (
          <ShopRegisterView
            onRegister={handleShopRegister}
            onSwitchToLogin={() => {
              setLoginMode('workshop')
              navigate('login')
            }}
            onGoogleLogin={() => {
              /* TODO: wire up Google OAuth */
            }}
          />
        ) : screen === 'register' ? (
          <RegisterView
            onRegister={handleRegister}
            onSwitchToLogin={() => navigate('login')}
            onGoogleLogin={() => {
              /* TODO: wire up Google OAuth */
            }}
          />
        ) : (
          <LoginView
            onDriverLogin={handleLogin}
            onShopLogin={handleShopLogin}
            onSwitchToDriverRegister={() => navigate('register')}
            onSwitchToShopRegister={() => navigate('shop-register')}
            onForgotPassword={() => navigate('forgot-password')}
            onGoogleLogin={() => {
              /* TODO: wire up Google OAuth */
            }}
            initialMode={loginMode}
            onModeChange={setLoginMode}
          />
        )}
      </main>
    )
  }

  // Driver plan actions
  const handleUpgrade = async (billingInterval: BillingInterval = 'MONTHLY') => {
    setUpgradeLoading(true)
    try {
      const { checkoutUrl } = await billingApi.upgrade(billingInterval)
      assertSafeRedirectUrl(checkoutUrl)
      window.location.href = checkoutUrl
    } catch {
      setUpgradeLoading(false)
    }
  }

  const handleManageSubscription = async () => {
    try {
      const { portalUrl } = await billingApi.portal()
      assertSafeRedirectUrl(portalUrl)
      window.location.href = portalUrl
    } catch {
      // silently ignore
    }
  }

  // Enrollment actions for shop users
  const handleVoucherRedeem = async (code: string) => {
    const result = await enrollmentApi.redeemVoucher(code)
    setEnrollmentStatus(result.status)
  }

  const handleEnrollmentPayment = async (billingInterval: BillingInterval) => {
    return enrollmentApi.initiatePayment(billingInterval)
  }

  const handleEnrollmentStatusRefresh = async () => {
    try {
      const result = await enrollmentApi.getStatus()
      setEnrollmentStatus(result.status)
      setEnrollmentCancelAt(result.cancelAt ?? null)
    } catch {
      // keep current status
    }
  }

  // Admin portal (authenticated admin user)
  if (isAdmin) {
    return (
      <AppLayout
        sidebar={
          <AppSidebar
            role="admin"
            activeScreen={screen}
            userName="Admin"
            userEmail={auth.user?.email ?? ''}
            userInitials="A"
            onNavigate={navigate}
            onLogout={doLogout}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        }
        topbar={
          <AppTopbar
            title="Admin"
            userInitials="A"
            onMenuToggle={() => setSidebarOpen((p) => !p)}
            onLanguageChange={handleLanguageChange}
          />
        }
      >
        <ErrorBoundary>
          <AdminVouchersView onLogout={doLogout} />
        </ErrorBoundary>
        <BannerStack banners={banners} />
      </AppLayout>
    )
  }

  // Shop portal (authenticated shop user)
  if (isShop) {
    const shopScreenTitle =
      screen === 'shop-profile'
        ? t('sidebar.shopProfile')
        : screen === 'shop-plan'
          ? t('sidebar.subscription')
          : screen === 'shop-settings'
            ? t('sidebar.settings')
            : screen === 'shop-messages'
              ? t('sidebar.messages')
              : screen === 'shop-request-detail' || screen === 'shop-send-quote'
                ? shop.shopSelectedRequest
                  ? `${shop.shopSelectedRequest.car.make} ${shop.shopSelectedRequest.car.model}`
                  : t('shopInbox.headline')
                : t('shopInbox.headline')

    const shopOpenDetail = (
      requestId: string,
      initialTab: 'details' | 'messages' = 'details',
      sourceScreen: 'shop-inbox' | 'shop-messages' = 'shop-inbox',
    ) => {
      setShopSelectedRequestId(requestId)
      setShopDetailInitialTab(initialTab)
      setShopDetailSourceScreen(sourceScreen)
      void shop.openShopRequestDetail(requestId)
      navigate('shop-request-detail')
    }

    const shopUserName = shop.shopProfile?.name ?? auth.user?.email ?? ''
    const shopInitials =
      shopUserName
        .split(/\s+/)
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'W'

    return (
      <EnrollmentGate
        enrollmentStatus={enrollmentStatus}
        enrollmentLoading={enrollmentLoading}
        onVoucherRedeem={handleVoucherRedeem}
        onPayment={handleEnrollmentPayment}
        onStatusRefresh={handleEnrollmentStatusRefresh}
        onLogout={doLogout}
        enrollmentCatalog={catalog.enrollmentCatalog}
      >
        <AppLayout
          sidebar={
            <AppSidebar
              role="shop"
              activeScreen={screen}
              userName={shopUserName}
              userEmail={auth.user?.email ?? ''}
              userInitials={shopInitials}
              notificationCounts={{
                inbox: shop.shopQueue.filter((i) => i.status === 'PENDING' || i.status === null).length || undefined,
                messages: shop.shopQueue.filter((i) => i.hasMessages).length || undefined,
              }}
              onNavigate={(s) => {
                if (s === 'shop-profile') void shop.loadShopProfile()
                navigate(s)
              }}
              onLogout={doLogout}
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
            />
          }
          topbar={
            <AppTopbar
              title={shopScreenTitle}
              userInitials={shopInitials}
              onMenuToggle={() => setSidebarOpen((p) => !p)}
              onAvatarClick={() => navigate('shop-profile')}
              onLanguageChange={handleLanguageChange}
            />
          }
        >
          <BannerStack banners={banners} />

          {shop.shopLoading ? <p className="loading">{t('app.loading')}</p> : null}
          {shop.shopError ? <p className="field-error">{t(shop.shopError as 'app.loadError')}</p> : null}

          <ErrorBoundary>
            {!shop.shopLoading && !shop.shopError && screen === 'shop-inbox' ? (
              <ShopInboxView
                queueItems={shop.shopQueue}
                onOpenRequest={(requestId) => shopOpenDetail(requestId, 'details', 'shop-inbox')}
                onAcknowledge={(requestId) => {
                  void shop.handleShopAcknowledge(requestId)
                }}
                onDecline={(requestId) => {
                  void shop.handleShopDecline(requestId)
                }}
                onProfile={() => {
                  void shop.loadShopProfile()
                  navigate('shop-profile')
                }}
              />
            ) : null}

            {!shop.shopLoading && !shop.shopError && screen === 'shop-request-detail' && shop.shopSelectedRequest ? (
              <ShopRequestDetailView
                request={shop.shopSelectedRequest}
                shopResponse={shop.shopOwnResponse}
                messages={shop.shopMessages}
                initialTab={shopDetailInitialTab}
                onBack={() => {
                  void shop.loadShopQueue()
                  navigate(shopDetailSourceScreen)
                }}
                onAcknowledge={() => {
                  if (shopSelectedRequestId) {
                    void shop.handleShopAcknowledge(shopSelectedRequestId).then(() => {
                      void shop.openShopRequestDetail(shopSelectedRequestId)
                    })
                  }
                }}
                onDecline={() => {
                  if (shopSelectedRequestId) {
                    void shop.handleShopDecline(shopSelectedRequestId).then(() => {
                      void shop.loadShopQueue()
                      navigate('shop-inbox')
                    })
                  }
                }}
                onSendQuote={() => navigate('shop-send-quote')}
                onAskQuestion={async (text) => {
                  if (shopSelectedRequestId) {
                    await shop.handleShopAskQuestion(shopSelectedRequestId, text)
                  }
                }}
                onSendMessage={async (text) => {
                  if (shopSelectedRequestId) {
                    await shop.handleShopSendMessage(shopSelectedRequestId, text)
                  }
                }}
                onSharePhone={async (phone) => {
                  if (shopSelectedRequestId) {
                    await shop.handleSharePhone(shopSelectedRequestId, phone)
                  }
                }}
              />
            ) : null}

            {!shop.shopLoading && !shop.shopError && screen === 'shop-request-detail' && !shop.shopSelectedRequest ? (
              <article className="empty-state">{t('app.notFound')}</article>
            ) : null}

            {!shop.shopLoading && !shop.shopError && screen === 'shop-send-quote' && shop.shopSelectedRequest ? (
              <ShopSendQuoteView
                request={shop.shopSelectedRequest}
                onSubmit={async (payload, phone) => {
                  if (shopSelectedRequestId) {
                    await shop.handleSubmitQuote(shopSelectedRequestId, payload, phone)
                    navigate('shop-request-detail')
                  }
                }}
                onBack={() => navigate('shop-request-detail')}
              />
            ) : null}

            {screen === 'shop-profile' ? (
              <ShopProfileView
                profile={shop.shopProfile}
                onSave={shop.handleSaveProfile}
                onBack={() => navigate('shop-inbox')}
              />
            ) : null}

            {screen === 'shop-plan' && enrollmentStatus ? (
              <ShopPlanView
                enrollmentStatus={enrollmentStatus}
                cancelAt={enrollmentCancelAt}
                onBack={() => navigate('shop-inbox')}
              />
            ) : null}

            {screen === 'shop-settings' ? <SettingsView onBack={() => navigate('shop-inbox')} /> : null}

            {!shop.shopLoading && !shop.shopError && screen === 'shop-messages' ? (
              <ShopMessagesView
                queueItems={shop.shopQueue}
                onOpenRequest={(requestId) => shopOpenDetail(requestId, 'messages', 'shop-messages')}
              />
            ) : null}
          </ErrorBoundary>
        </AppLayout>
      </EnrollmentGate>
    )
  }

  // Authenticated driver app
  const driverName = auth.user?.email?.split('@')[0] ?? ''
  const driverInitials =
    driverName
      .split(/[._-]/)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U'

  // Count total unread messages across all threads
  const unreadMessageCount = requests.reduce(
    (sum, r) => sum + Object.values(r.threads).reduce((ts, th) => ts + th.unreadCount, 0),
    0,
  )

  const driverScreenTitle =
    screen === 'my-requests'
      ? t('myRequests.title')
      : screen === 'messages'
        ? t('messages.title')
        : screen === 'plan'
          ? t('plan.title')
          : screen === 'settings'
            ? t('settings.title')
            : screen === 'request-detail'
              ? selectedRequest
                ? `${selectedRequest.car.make} ${selectedRequest.car.model}`
                : t('sidebar.overview')
              : t('sidebar.overview')

  return (
    <AppLayout
      sidebar={
        <AppSidebar
          role="driver"
          activeScreen={screen}
          userName={driverName}
          userEmail={auth.user?.email ?? ''}
          userInitials={driverInitials}
          notificationCounts={{
            overview: requests.filter((r) => r.status === 'open').length || undefined,
            messages: unreadMessageCount || undefined,
          }}
          onNavigate={navigate}
          onLogout={doLogout}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      }
      topbar={
        <AppTopbar
          breadcrumb={
            screen === 'create-request'
              ? [{ label: t('sidebar.overview'), onClick: () => navigate('home') }, { label: t('form.newRequest') }]
              : screen === 'request-detail'
                ? [
                    { label: t('myRequests.title'), onClick: () => navigate('my-requests') },
                    {
                      label: selectedRequest ? `${selectedRequest.car.make} ${selectedRequest.car.model}` : '',
                    },
                  ]
                : undefined
          }
          title={screen === 'create-request' || screen === 'request-detail' ? undefined : driverScreenTitle}
          userInitials={driverInitials}
          onMenuToggle={() => setSidebarOpen((p) => !p)}
          onAvatarClick={() => navigate('plan')}
          onLanguageChange={handleLanguageChange}
          rightSlot={
            screen === 'create-request' ? (
              <button className="btn btn-secondary btn-compact-sm" onClick={() => navigate('home')}>
                {t('common.cancel')}
              </button>
            ) : screen === 'request-detail' && selectedRequest?.status !== 'closed' ? (
              <button className="btn btn-danger-outline btn-compact-sm" onClick={() => setShowCloseDialog(true)}>
                {t('detail.closeRequest')}
              </button>
            ) : undefined
          }
        />
      }
    >
      <BannerStack banners={banners} />

      {loading ? <p className="loading">{t('app.loading')}</p> : null}
      {error ? <p className="field-error">{t(error as 'app.loadError')}</p> : null}

      <ErrorBoundary>
        {!loading && !error && screen === 'home' ? (
          <HomeView
            requests={requests}
            onCreateRequest={() => {
              if (plan.isAtOpenLimit(requests)) {
                setLimitModal('open_orders')
                return
              }
              if (plan.isAtDailyLimit(requests)) {
                setLimitModal('daily_orders')
                return
              }
              navigate('create-request')
            }}
            onMyRequests={() => {
              navigate('my-requests')
            }}
            onOpenRequest={(requestId) => {
              void openRequestDetail(requestId)
            }}
            planInfo={plan.planInfo}
            onNavigatePlan={() => navigate('plan')}
            freeEntitlements={plan.freeEntitlements}
          />
        ) : null}

        {!loading && !error && screen === 'create-request' ? (
          <CreateRepairRequestFlow
            onSubmitRequest={handleCreateRequest}
            onViewRequest={(requestId) => {
              void openRequestDetail(requestId)
            }}
          />
        ) : null}

        {!loading && !error && screen === 'my-requests' ? (
          <MyRequestsView
            requests={requests}
            onBackHome={() => {
              navigate('home')
            }}
            onOpenRequest={(requestId) => {
              void openRequestDetail(requestId)
            }}
          />
        ) : null}

        {!loading && !error && screen === 'request-detail' && selectedRequest ? (
          <RepairRequestDetail
            request={selectedRequest}
            onCloseRequest={handleCloseRequest}
            onMarkInterested={handleMarkInterested}
            onIgnoreShop={handleIgnoreShop}
            onSendThreadMessage={handleSendThreadMessage}
            showCloseDialog={showCloseDialog}
            onShowCloseDialog={setShowCloseDialog}
          />
        ) : null}

        {!loading && !error && screen === 'request-detail' && !selectedRequest ? (
          <article className="empty-state">{t('app.notFound')}</article>
        ) : null}

        {screen === 'plan' ? (
          <PlanView
            planInfo={plan.planInfo}
            requests={requests}
            onUpgrade={(bi) => void handleUpgrade(bi)}
            onManageSubscription={() => void handleManageSubscription()}
            onBack={() => navigate('home')}
            upgradeLoading={upgradeLoading}
            freeEntitlements={plan.freeEntitlements}
            proPriceMonthly={catalog.getPlanPrice('PRO', 'MONTHLY')}
            proPriceAnnual={catalog.getPlanPrice('PRO', 'ANNUAL')}
            currency={catalog.currency}
          />
        ) : null}

        {screen === 'plan-success' ? (
          <PlanSuccessView
            onRefreshPlan={plan.refreshPlan as () => Promise<UserPlanInfo | null | undefined>}
            onContinue={() => navigate('home')}
          />
        ) : null}

        {screen === 'plan-cancel' ? <PlanCancelView onBack={() => navigate('home')} /> : null}

        {screen === 'settings' ? <SettingsView onBack={() => navigate('home')} /> : null}

        {screen === 'messages' ? (
          <MessagesView
            requests={requests}
            userName={auth.user?.name ?? ''}
            onOpenRequest={(requestId) => {
              void openRequestDetail(requestId)
            }}
            onSendMessage={async (requestId, shopId, text) => {
              await handleSendThreadMessage(requestId, shopId, text, [])
            }}
          />
        ) : null}
      </ErrorBoundary>

      {limitModal ? (
        <UpgradeLimitModal
          limitType={limitModal}
          onUpgrade={() => {
            setLimitModal(null)
            void handleUpgrade()
          }}
          onDismiss={() => setLimitModal(null)}
          loading={upgradeLoading}
          freeEntitlements={plan.freeEntitlements}
          proPriceMonthly={catalog.getPlanPrice('PRO', 'MONTHLY')}
          currency={catalog.currency}
        />
      ) : null}
    </AppLayout>
  )
}

export default App
