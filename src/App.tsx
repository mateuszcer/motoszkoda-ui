import { lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import './App.css'
import { AppHeader } from './components/AppHeader'
import { ErrorBoundary } from './components/ErrorBoundary'
import { EnrollmentGate } from './components/EnrollmentGate'
import { LoginView } from './components/LoginView'
import { RegisterView } from './components/RegisterView'
import { CheckEmailView } from './components/CheckEmailView'
import { SignupConfirmationView } from './components/SignupConfirmationView'
import { ForgotPasswordView } from './components/ForgotPasswordView'
import { ResetPasswordView } from './components/ResetPasswordView'
import { AdminLoginView } from './components/AdminLoginView'
import { ShopRegisterView } from './components/ShopRegisterView'
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
import { setOnUnauthorized } from './services/apiClient'
import { authApi } from './services/authApi'
import { billingApi } from './services/billingApi'
import { enrollmentApi } from './services/enrollmentApi'
import * as localPrefs from './services/localPreferences'
import { fetchNotifications } from './services/notificationsApi'
import { uploadAttachments } from './services/attachmentApi'
import { repairRequestApi } from './services/repairRequestApi'

// Lazy-loaded route components
const LandingPage = lazy(() => import('./components/LandingPage').then((m) => ({ default: m.LandingPage })))
const HomeView = lazy(() => import('./components/HomeView').then((m) => ({ default: m.HomeView })))
const CreateRepairRequestFlow = lazy(() =>
  import('./components/CreateRepairRequestFlow').then((m) => ({ default: m.CreateRepairRequestFlow })),
)
const MyRequestsView = lazy(() => import('./components/MyRequestsView').then((m) => ({ default: m.MyRequestsView })))
const RepairRequestDetail = lazy(() =>
  import('./components/RepairRequestDetail').then((m) => ({ default: m.RepairRequestDetail })),
)
const PlanView = lazy(() => import('./components/PlanView').then((m) => ({ default: m.PlanView })))
const PlanSuccessView = lazy(() => import('./components/PlanSuccessView').then((m) => ({ default: m.PlanSuccessView })))
const PlanCancelView = lazy(() => import('./components/PlanCancelView').then((m) => ({ default: m.PlanCancelView })))
const AdminVouchersView = lazy(() =>
  import('./components/AdminVouchersView').then((m) => ({ default: m.AdminVouchersView })),
)
const ShopInboxView = lazy(() => import('./components/ShopInboxView').then((m) => ({ default: m.ShopInboxView })))
const ShopRequestDetailView = lazy(() =>
  import('./components/ShopRequestDetailView').then((m) => ({ default: m.ShopRequestDetailView })),
)
const ShopSendQuoteView = lazy(() =>
  import('./components/ShopSendQuoteView').then((m) => ({ default: m.ShopSendQuoteView })),
)
const ShopProfileView = lazy(() => import('./components/ShopProfileView').then((m) => ({ default: m.ShopProfileView })))

const NOTIFICATION_POLL_INTERVAL = 60_000

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

  const [pendingEmail, setPendingEmail] = useState<string | null>(null)

  const [enrollmentStatus, setEnrollmentStatus] = useState<EnrollmentStatus | null>(null)
  const [enrollmentLoading, setEnrollmentLoading] = useState(false)

  const lastNotificationTime = useRef<string | undefined>(undefined)

  // Read reset-password token once, not on every render
  const resetToken = useMemo(() => {
    if (screen !== 'reset-password') return ''
    return new URLSearchParams(window.location.search).get('token') ?? ''
  }, [screen])

  const selectedRequest = useMemo(() => {
    if (!selectedRequestId) {
      return null
    }

    return requests.find((request) => request.id === selectedRequestId) ?? null
  }, [requests, selectedRequestId])

  const doLogout = useCallback(() => {
    const wasAdmin = auth.user?.role === 'ADMIN'
    void authApi.logout()
    setAuth({ user: null, token: null, isAuthenticated: false })
    setEnrollmentStatus(null)
    setRequests([])
    setBanners([])
    lastNotificationTime.current = undefined
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
  const shop = useShopPortal(auth.user?.id ?? null)
  const [shopSelectedRequestId, setShopSelectedRequestId] = useState<string | null>(null)

  // Restore session on mount
  useEffect(() => {
    const restore = async () => {
      const session = authApi.restoreSession()
      if (session) {
        setAuth({
          user: session.user,
          token: session.accessToken,
          isAuthenticated: true,
        })
        if (session.user.role === 'ADMIN') {
          navigate('admin-vouchers', { replace: true })
        } else if (session.user.role === 'SHOP_USER') {
          setEnrollmentLoading(true)
          try {
            const status = await enrollmentApi.getStatus()
            setEnrollmentStatus(status.status)
          } catch {
            setEnrollmentStatus(null)
          } finally {
            setEnrollmentLoading(false)
          }
          navigate('shop-inbox', { replace: true })
        } else {
          navigate('home', { replace: true })
        }
      }
      setAuthLoading(false)
    }
    void restore()
  }, [])

  const isAdmin = auth.user?.role === 'ADMIN'

  // Load requests when authenticated (skip for admin)
  // For shops, re-fetch when enrollmentStatus becomes ACTIVE (e.g. after payment)
  useEffect(() => {
    if (auth.isAuthenticated && !isAdmin) {
      if (isShop) {
        if (enrollmentStatus === 'ACTIVE') {
          void shop.loadShopQueue()
        }
      } else {
        void loadRequests()
      }
    }
  }, [auth.isAuthenticated, isAdmin, isShop, enrollmentStatus, loadRequests, shop.loadShopQueue])

  const handleLogin = async (email: string, password: string, captchaToken?: string) => {
    const result = await authApi.login(email, password, captchaToken)
    setAuth({ user: result.user, token: result.token, isAuthenticated: true })
    navigate('home', { replace: true })
  }

  const handleRegister = async (email: string, password: string, captchaToken?: string) => {
    await authApi.register(email, password, captchaToken)
    setPendingEmail(email)
    navigate('check-email', { replace: true })
  }

  const handleShopLogin = async (email: string, password: string, captchaToken?: string) => {
    const result = await authApi.shopLogin(email, password, captchaToken)
    setAuth({ user: result.user, token: result.token, isAuthenticated: true })
    setEnrollmentLoading(true)
    try {
      const status = await enrollmentApi.getStatus()
      setEnrollmentStatus(status.status)
    } catch {
      setEnrollmentStatus(null)
    } finally {
      setEnrollmentLoading(false)
    }
    navigate('shop-inbox', { replace: true })
  }

  const handleShopRegister = async (payload: ShopRegistrationRequest) => {
    await enrollmentApi.register(payload)
    setPendingEmail(payload.email)
    navigate('check-email', { replace: true })
  }

  const handleAdminLogin = async (email: string, password: string, captchaToken?: string) => {
    const result = await authApi.adminLogin(email, password, captchaToken)
    setAuth({ user: result.user, token: result.token, isAuthenticated: true })
    navigate('admin-vouchers', { replace: true })
  }

  const handleRequestPasswordReset = async (email: string, captchaToken?: string) => {
    await authApi.requestPasswordReset(email, captchaToken)
  }

  const handleResendConfirmation = async (email: string) => {
    await authApi.resendConfirmation(email)
  }

  const handleResetPassword = async (accessToken: string, newPassword: string) => {
    await authApi.resetPassword(accessToken, newPassword)
  }

  const upsertRequest = useCallback((updatedRequest: RepairRequest) => {
    setRequests((previous) => {
      const withoutCurrent = previous.filter((request) => request.id !== updatedRequest.id)
      return sortRequests([...withoutCurrent, updatedRequest])
    })
  }, [])

  const openRequestDetail = async (requestId: string) => {
    setSelectedRequestId(requestId)
    navigate('request-detail')

    if (!auth.user) return

    const detail = await repairRequestApi.fetchRequestDetail(requestId, auth.user.id)
    if (detail) {
      upsertRequest(detail)
    }
  }

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
      const updated = await repairRequestApi.fetchRequestDetail(requestId, auth.user.id)
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

        // Find notifications newer than what we've seen
        const newOnes = lastNotificationTime.current
          ? page.notifications.filter((n) => n.createdAt > lastNotificationTime.current!)
          : [] // Don't banner on first poll

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
            const updated = await repairRequestApi.fetchRequestDetail(selectedRequestId, auth.user.id)
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
  }, [auth.isAuthenticated, auth.user, pushBanner, selectedRequestId, upsertRequest, t])

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
          onJoinAsShop={() => navigate('shop-login')}
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
        <AppHeader brandMark="AC" onBrandClick={() => navigate('landing')} />
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
        <AppHeader brandMark="AC" onBrandClick={() => navigate('landing')} />
        <SignupConfirmationView onGoToLogin={() => navigate('login')} />
      </main>
    )
  }

  // Forgot password screen
  if (!auth.isAuthenticated && screen === 'forgot-password') {
    return (
      <main className="app-shell">
        <AppHeader brandMark="AC" onBrandClick={() => navigate('landing')} />
        <ForgotPasswordView onSubmit={handleRequestPasswordReset} onBackToLogin={() => navigate('login')} />
      </main>
    )
  }

  // Reset password screen (accessed via email link with token in URL)
  if (!auth.isAuthenticated && screen === 'reset-password') {
    return (
      <main className="app-shell">
        <AppHeader brandMark="AC" onBrandClick={() => navigate('landing')} />
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
        <AppHeader brandMark="AD" brandMarkClass="admin-brand-mark" />
        <AdminLoginView onLogin={handleAdminLogin} />
      </main>
    )
  }

  // Auth screens (login/register) — driver & shop
  if (!auth.isAuthenticated) {
    const isShopAuth = screen === 'shop-login' || screen === 'shop-register'
    return (
      <main className="app-shell">
        <AppHeader brandMark={isShopAuth ? 'W' : 'AC'} onBrandClick={() => navigate('landing')} />

        {screen === 'shop-register' ? (
          <ShopRegisterView onRegister={handleShopRegister} onSwitchToLogin={() => navigate('shop-login')} />
        ) : screen === 'shop-login' ? (
          <LoginView
            onLogin={handleShopLogin}
            onSwitchToRegister={() => navigate('shop-register')}
            onForgotPassword={() => navigate('forgot-password')}
            titleKey="shopAuth.loginTitle"
            subtitleKey="shopAuth.loginSubtitle"
            brandMark="W"
          />
        ) : screen === 'register' ? (
          <RegisterView onRegister={handleRegister} onSwitchToLogin={() => navigate('login')} />
        ) : (
          <LoginView
            onLogin={handleLogin}
            onSwitchToRegister={() => navigate('register')}
            onForgotPassword={() => navigate('forgot-password')}
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
      window.location.href = checkoutUrl
    } catch {
      setUpgradeLoading(false)
    }
  }

  const handleManageSubscription = async () => {
    try {
      const { portalUrl } = await billingApi.portal()
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
    } catch {
      // keep current status
    }
  }

  // Admin portal (authenticated admin user)
  if (isAdmin) {
    return (
      <main className="app-shell admin-shell">
        <AppHeader brandMark="AD" brandMarkClass="admin-brand-mark" />
        <ErrorBoundary>
          <AdminVouchersView onLogout={doLogout} />
        </ErrorBoundary>
      </main>
    )
  }

  // Shop portal (authenticated shop user)
  if (isShop) {
    const shopOpenDetail = (requestId: string) => {
      setShopSelectedRequestId(requestId)
      void shop.openShopRequestDetail(requestId)
      navigate('shop-request-detail')
    }

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
        <main className="app-shell">
          <AppHeader
            brandMark="W"
            onBrandClick={() => navigate('shop-inbox')}
            navSlot={
              <>
                {screen !== 'shop-inbox' ? (
                  <button className="btn btn-ghost" onClick={() => navigate('shop-inbox')}>
                    {t('shopNav.inbox')}
                  </button>
                ) : null}
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    void shop.loadShopProfile()
                    navigate('shop-profile')
                  }}
                >
                  {t('shopNav.profile')}
                </button>
                <button className="btn btn-ghost" onClick={doLogout}>
                  {t('auth.logout')}
                </button>
              </>
            }
          />

          <BannerStack banners={banners} />

          {shop.shopLoading ? <p className="loading">{t('app.loading')}</p> : null}
          {shop.shopError ? <p className="field-error">{t(shop.shopError as 'app.loadError')}</p> : null}

          <ErrorBoundary>
            {!shop.shopLoading && !shop.shopError && screen === 'shop-inbox' ? (
              <ShopInboxView
                queueItems={shop.shopQueue}
                onOpenRequest={shopOpenDetail}
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
                onBack={() => {
                  void shop.loadShopQueue()
                  navigate('shop-inbox')
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
          </ErrorBoundary>
        </main>
      </EnrollmentGate>
    )
  }

  // Authenticated driver app
  return (
    <main className="app-shell">
      <AppHeader
        brandMark="AC"
        onBrandClick={() => navigate('home')}
        navSlot={
          <>
            {screen !== 'home' ? (
              <button
                className="btn btn-ghost"
                onClick={() => {
                  navigate('home')
                }}
              >
                {t('app.home')}
              </button>
            ) : null}
            <button className="btn btn-ghost" onClick={() => navigate('plan')}>
              {t('plan.nav')}
            </button>
            <button className="btn btn-ghost" onClick={doLogout}>
              {t('auth.logout')}
            </button>
          </>
        }
      />

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
            onCancel={() => {
              navigate('home')
            }}
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
            onBackHome={() => {
              navigate('home')
            }}
            onCloseRequest={handleCloseRequest}
            onMarkInterested={handleMarkInterested}
            onIgnoreShop={handleIgnoreShop}
            onSendThreadMessage={handleSendThreadMessage}
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
    </main>
  )
}

export default App
