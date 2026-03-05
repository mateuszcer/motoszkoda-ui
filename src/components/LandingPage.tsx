import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SeoSchema } from './SeoSchema'
import { useTheme } from '../hooks/useTheme'
import './LandingPage.css'

interface LandingPageProps {
  onGetStarted: () => void
  onJoinAsShop: () => void
}

const STEP_KEYS = ['step1', 'step2', 'step3', 'step4', 'step5'] as const
const DEMO_INTERVAL = 3200

export function LandingPage({ onGetStarted, onJoinAsShop }: LandingPageProps) {
  const { t, i18n } = useTranslation()
  const isPolish = i18n.language.startsWith('pl')

  const [activeStep, setActiveStep] = useState(-1)
  const [stickyVisible, setStickyVisible] = useState(false)
  const [demoPhase, setDemoPhase] = useState(0)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')
  const [driverPlan, setDriverPlan] = useState<'free' | 'premium'>('free')

  const heroRef = useRef<HTMLElement>(null)
  const stepElements = useRef<(HTMLElement | null)[]>([])
  const faqContentRefs = useRef<(HTMLDivElement | null)[]>([])

  const { theme, toggle: toggleTheme } = useTheme()
  const toggleLang = () => void i18n.changeLanguage(isPolish ? 'en' : 'pl')

  // Sticky bar appears after scrolling past hero
  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return
    const observer = new IntersectionObserver(
      ([entry]) => setStickyVisible(!entry.isIntersecting),
      { threshold: 0.05 },
    )
    observer.observe(hero)
    return () => observer.disconnect()
  }, [])

  // Scroll spy for steps
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = stepElements.current.indexOf(entry.target as HTMLElement)
            if (idx !== -1) setActiveStep(idx)
          }
        }
      },
      { threshold: 0.3, rootMargin: '-5% 0px -5% 0px' },
    )
    for (const el of stepElements.current) {
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [])

  // Demo cycling
  useEffect(() => {
    const id = window.setInterval(() => setDemoPhase((p) => (p + 1) % 3), DEMO_INTERVAL)
    return () => window.clearInterval(id)
  }, [])

  const setStepRef = useCallback(
    (index: number) => (el: HTMLElement | null) => {
      stepElements.current[index] = el
    },
    [],
  )

  const setFaqRef = useCallback(
    (index: number) => (el: HTMLDivElement | null) => {
      faqContentRefs.current[index] = el
    },
    [],
  )

  const scrollToSection = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const faqItems = Array.from({ length: 10 }, (_, i) => ({
    q: t(`landing.faq.q${i + 1}`),
    a: t(`landing.faq.a${i + 1}`),
  }))

  const flowProgress = Math.max(0, ((activeStep + 1) / STEP_KEYS.length) * 100)

  return (
    <div className="lp">
      <SeoSchema />

      {/* ── STICKY BAR ── */}
      <div className={`lp-sticky ${stickyVisible ? 'lp-sticky--visible' : ''}`}>
        <div className="lp-sticky__inner">
          <div className="lp-sticky__brand">
            <div className="brand-mark">AC</div>
            <span className="lp-sticky__name">Autoceny</span>
          </div>
          <div className="lp-sticky__actions">
            <button className="lp-btn lp-btn--primary lp-btn--sm" onClick={onGetStarted}>
              {t('landing.stickyBar.cta')}
            </button>
            <button className="lp-btn lp-btn--outline lp-btn--sm" onClick={onJoinAsShop}>
              {t('landing.stickyBar.ctaShop')}
            </button>
            <button className="lp-theme-toggle" onClick={toggleTheme} aria-label={t(theme === 'dark' ? 'theme.switchToLight' : 'theme.switchToDark')}>
              {theme === 'dark' ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              )}
            </button>
            <button className="lp-lang" onClick={toggleLang} aria-label="Toggle language">
              {isPolish ? 'EN' : 'PL'}
            </button>
          </div>
        </div>
      </div>

      {/* ── HERO ── */}
      <section className="lp-hero" ref={heroRef}>
        <div className="lp-hero__bg">
          <div className="lp-hero__glow" />
          <div className="lp-hero__grid" />
        </div>

        <div className="lp-hero__top-bar">
          <div className="lp-hero__brand">
            <div className="brand-mark">AC</div>
            <span>Autoceny</span>
          </div>
          <div className="lp-hero__nav">
            <button className="lp-theme-toggle" onClick={toggleTheme} aria-label={t(theme === 'dark' ? 'theme.switchToLight' : 'theme.switchToDark')}>
              {theme === 'dark' ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              )}
            </button>
            <button className="lp-lang lp-lang--hero" onClick={toggleLang}>
              {isPolish ? 'EN' : 'PL'}
            </button>
          </div>
        </div>

        <div className="lp-hero__content">
          <div className="lp-hero__text">
            <h1 className="lp-hero__headline">{t('landing.hero.headline')}</h1>
            <p className="lp-hero__sub">{t('landing.hero.subheadline')}</p>
            <div className="lp-hero__ctas">
              <button className="lp-btn lp-btn--primary lp-btn--lg" onClick={onGetStarted}>
                {t('landing.hero.cta')}
              </button>
              <button
                className="lp-btn lp-btn--ghost lp-btn--lg"
                onClick={() => scrollToSection('lp-flow')}
              >
                {t('landing.hero.ctaShop')}
              </button>
            </div>
          </div>

          {/* Animated demo */}
          <div className="lp-demo">
            <div className="lp-demo__card">
              <div className="lp-demo__header">
                <div className="lp-demo__dots">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className={`lp-demo__dot ${demoPhase === i ? 'lp-demo__dot--active' : ''}`}
                    />
                  ))}
                </div>
                <span className="lp-demo__label">
                  {t(`landing.demo.step${demoPhase + 1}Label`)}
                </span>
              </div>
              <div className="lp-demo__body">
                {/* Phase 0: Car + Issue */}
                <div className={`lp-demo__phase ${demoPhase === 0 ? 'lp-demo__phase--active' : ''}`} aria-label={t('landing.demo.step1Label')}>
                  <div className="demo-row">
                    <span className="demo-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="8" width="18" height="10" rx="2"/><path d="M6 8V6a2 2 0 012-2h8a2 2 0 012 2v2"/><circle cx="8" cy="18" r="2"/><circle cx="16" cy="18" r="2"/></svg>
                    </span>
                    <span className="demo-val">Audi A3 Sportback &middot; 2019</span>
                  </div>
                  <div className="demo-row">
                    <span className="demo-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
                    </span>
                    <span className="demo-val">{t('landing.mockBrakes')}</span>
                  </div>
                  <div className="demo-tags">
                    <span className="demo-tag">{t('tags.brakes')}</span>
                    <span className="demo-tag">{t('tags.suspension')}</span>
                  </div>
                </div>

                {/* Phase 1: Radius */}
                <div className={`lp-demo__phase ${demoPhase === 1 ? 'lp-demo__phase--active' : ''}`} aria-label={t('landing.demo.step2Label')}>
                  <div className="demo-radius">
                    <div className="demo-radius__visual">
                      <div className="demo-radius__pin" />
                      <div className="demo-radius__ring demo-radius__ring--1" />
                      <div className="demo-radius__ring demo-radius__ring--2" />
                      <div className="demo-radius__ring demo-radius__ring--3" />
                      <div className="demo-radius__shop demo-radius__shop--1">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M3 21V9l9-7 9 7v12H3z"/></svg>
                      </div>
                      <div className="demo-radius__shop demo-radius__shop--2">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M3 21V9l9-7 9 7v12H3z"/></svg>
                      </div>
                      <div className="demo-radius__shop demo-radius__shop--3">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M3 21V9l9-7 9 7v12H3z"/></svg>
                      </div>
                    </div>
                    <div className="demo-radius__info">
                      <span className="demo-radius__km">15 km</span>
                      <span className="demo-radius__label">{t('landing.mockRadius')}</span>
                    </div>
                  </div>
                </div>

                {/* Phase 2: Quotes */}
                <div className={`lp-demo__phase ${demoPhase === 2 ? 'lp-demo__phase--active' : ''}`} aria-label={t('landing.demo.step3Label')}>
                  <div className="demo-quotes">
                    {[
                      { name: 'Auto Serwis Kowalski', price: '520\u2013680 PLN', delay: '0s' },
                      { name: 'Moto Expert', price: '480\u2013620 PLN', delay: '0.12s' },
                      { name: 'Quick Fix Garage', price: '550\u2013700 PLN', delay: '0.24s' },
                    ].map((q) => (
                      <div
                        key={q.name}
                        className="demo-quote"
                        style={{ animationDelay: q.delay }}
                      >
                        <span className="demo-quote__name">{q.name}</span>
                        <span className="demo-quote__price">{q.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          className="lp-hero__scroll"
          onClick={() => scrollToSection('lp-flow')}
          aria-label="Scroll down"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 8l5 5 5-5" />
          </svg>
        </button>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="lp-flow" id="lp-flow">
        <div className="lp-section-head">
          <h2>{t('landing.flow.title')}</h2>
          <p>{t('landing.flow.subtitle')}</p>
        </div>

        <div className="lp-flow__labels">
          <span className="lp-flow__col-label lp-flow__col-label--driver">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0112 0v1"/></svg>
            {t('landing.flow.driverColumn')}
          </span>
          <span className="lp-flow__col-label lp-flow__col-label--shop">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21V9l9-7 9 7v12"/><path d="M9 21v-6h6v6"/></svg>
            {t('landing.flow.shopColumn')}
          </span>
        </div>

        <div className="lp-flow__wrap">
          {/* Step navigation (sticky) */}
          <nav className="lp-step-nav" aria-label="Steps">
            {STEP_KEYS.map((key, i) => (
              <button
                key={key}
                className={`lp-step-nav__item ${activeStep === i ? 'lp-step-nav__item--active' : ''} ${activeStep > i ? 'lp-step-nav__item--done' : ''}`}
                onClick={() =>
                  stepElements.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }
              >
                <span className="lp-step-nav__dot">{i + 1}</span>
                <span className="lp-step-nav__label">{t(`landing.flow.${key}.title`)}</span>
              </button>
            ))}
          </nav>

          {/* Flow content with central line */}
          <div className="lp-flow__content">
            <div className="lp-flow__line" aria-hidden="true">
              <div className="lp-flow__line-fill" style={{ height: `${flowProgress}%` }} />
            </div>

            {STEP_KEYS.map((key, i) => (
              <div
                key={key}
                ref={setStepRef(i)}
                className={`lp-step ${activeStep >= i ? 'lp-step--active' : ''}`}
              >
                <div className="lp-step__dot" aria-hidden="true">
                  <span>{i + 1}</span>
                </div>
                <h3 className="lp-step__title">{t(`landing.flow.${key}.title`)}</h3>

                <div className="lp-step__grid">
                  {/* Driver */}
                  <div className="lp-step__side lp-step__side--driver">
                    <div className="lp-mock lp-mock--driver">
                      <DriverMock step={i} t={t} />
                    </div>
                    <p className="lp-step__caption">{t(`landing.flow.${key}.driverText`)}</p>
                  </div>
                  {/* Shop */}
                  <div className="lp-step__side lp-step__side--shop">
                    <div className="lp-mock lp-mock--shop">
                      <ShopMock step={i} t={t} />
                    </div>
                    <p className="lp-step__caption">{t(`landing.flow.${key}.shopText`)}</p>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST ── */}
      <section className="lp-trust">
        <h2>{t('landing.trust.title')}</h2>
        <div className="lp-trust__grid">
          <div className="lp-trust__col lp-trust__col--driver">
            <h3>{t('landing.trust.driver.title')}</h3>
            {(['benefit1', 'benefit2', 'benefit3'] as const).map((key) => (
              <div className="lp-trust__item" key={key}>
                <div className="lp-trust__icon">
                  {key === 'benefit1' && (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
                  )}
                  {key === 'benefit2' && (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/><line x1="1" y1="1" x2="23" y2="23" strokeWidth="2.5"/></svg>
                  )}
                  {key === 'benefit3' && (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                  )}
                </div>
                <div>
                  <strong>{t(`landing.trust.driver.${key}`)}</strong>
                  <p>{t(`landing.trust.driver.${key}Desc`)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="lp-trust__col lp-trust__col--shop">
            <h3>{t('landing.trust.shop.title')}</h3>
            {(['benefit1', 'benefit2', 'benefit3'] as const).map((key) => (
              <div className="lp-trust__item" key={key}>
                <div className="lp-trust__icon">
                  {key === 'benefit1' && (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="6"/></svg>
                  )}
                  {key === 'benefit2' && (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                  )}
                  {key === 'benefit3' && (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  )}
                </div>
                <div>
                  <strong>{t(`landing.trust.shop.${key}`)}</strong>
                  <p>{t(`landing.trust.shop.${key}Desc`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Partner logos placeholder */}
        <div className="lp-trust__logos">
          {Array.from({ length: 4 }, (_, i) => (
            <div className="lp-logo-ph" key={i}>
              <span>Logo</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="lp-pricing">
        <div className="lp-section-head">
          <h2>{t('landing.pricing.title')}</h2>
          <p>{t('landing.pricing.subtitle')}</p>
        </div>

        <div className="lp-pricing__labels">
          <span className="lp-flow__col-label lp-flow__col-label--driver">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0112 0v1"/></svg>
            {t('landing.pricing.driverLabel')}
          </span>
          <span className="lp-flow__col-label lp-flow__col-label--shop">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21V9l9-7 9 7v12"/><path d="M9 21v-6h6v6"/></svg>
            {t('landing.pricing.shopLabel')}
          </span>
        </div>

        <div className="lp-pricing__grid">
          {/* Driver Card */}
          <div className={`lp-pricing__card lp-pricing__card--driver ${driverPlan === 'premium' ? 'lp-pricing__card--premium' : ''}`}>
            <div className="lp-pricing__plan-toggle">
              <button
                className={`lp-pricing__plan-btn ${driverPlan === 'free' ? 'lp-pricing__plan-btn--active' : ''}`}
                onClick={() => setDriverPlan('free')}
              >
                {t('landing.pricing.freePlan')}
              </button>
              <button
                className={`lp-pricing__plan-btn lp-pricing__plan-btn--prem ${driverPlan === 'premium' ? 'lp-pricing__plan-btn--active' : ''}`}
                onClick={() => setDriverPlan('premium')}
              >
                {t('landing.pricing.premiumPlan')}
              </button>
            </div>

            <div className="lp-pricing__body">
              <p className="lp-pricing__desc">
                {driverPlan === 'free' ? t('landing.pricing.freeDesc') : t('landing.pricing.shopDesc')}
              </p>

              <div className="lp-pricing__features">
                <ul>
                  <li>{t('landing.pricing.freeBullet1')}</li>
                  <li>{t('landing.pricing.freeBullet2')}</li>
                  <li>{t('landing.pricing.freeBullet3')}</li>
                </ul>
              </div>

              <div className="lp-pricing__limits">
                <div className="lp-pricing__limit-row">
                  <span>{t('landing.pricing.limitOpen')}</span>
                  <span className={`lp-pricing__limit-val ${driverPlan === 'premium' ? 'lp-pricing__limit-val--unlimited' : ''}`}>{driverPlan === 'free' ? '3' : t('landing.pricing.unlimited')}</span>
                </div>
                <div className="lp-pricing__limit-row">
                  <span>{t('landing.pricing.limitDaily')}</span>
                  <span className={`lp-pricing__limit-val ${driverPlan === 'premium' ? 'lp-pricing__limit-val--unlimited' : ''}`}>{driverPlan === 'free' ? '1' : t('landing.pricing.unlimited')}</span>
                </div>
                <div className="lp-pricing__limit-row">
                  <span>{t('landing.pricing.limitQuestions')}</span>
                  <span className={`lp-pricing__limit-val ${driverPlan === 'premium' ? 'lp-pricing__limit-val--unlimited' : ''}`}>{driverPlan === 'free' ? '2' : t('landing.pricing.unlimited')}</span>
                </div>
              </div>
            </div>

            <div className="lp-pricing__footer">
              <div className="lp-pricing__price">
                <span className="lp-pricing__amount">{driverPlan === 'free' ? '0' : '15'} zł</span>
                <span className="lp-pricing__per-month">{t('landing.pricing.perMonth')}</span>
              </div>
              {driverPlan === 'free' ? (
                <button className="lp-btn lp-btn--primary lp-btn--lg" onClick={onGetStarted}>
                  {t('landing.pricing.driverCta')}
                </button>
              ) : (
                <button className="lp-btn lp-btn--primary lp-btn--lg lp-btn--disabled" disabled>
                  {t('landing.pricing.comingSoon')}
                </button>
              )}
              <p className="lp-pricing__disclaimer">{t('landing.pricing.driverDisclaimer')}</p>
            </div>
          </div>

          {/* Shop Card */}
          <div className="lp-pricing__card lp-pricing__card--shop">
            <div className="lp-pricing__toggle">
              <button
                className={`lp-pricing__toggle-btn ${billingCycle === 'monthly' ? 'lp-pricing__toggle-btn--active' : ''}`}
                onClick={() => setBillingCycle('monthly')}
              >
                {t('landing.pricing.monthly')}
              </button>
              <button
                className={`lp-pricing__toggle-btn ${billingCycle === 'annual' ? 'lp-pricing__toggle-btn--active' : ''}`}
                onClick={() => setBillingCycle('annual')}
              >
                {t('landing.pricing.annual')}
                {billingCycle === 'annual' && (
                  <span className="lp-pricing__save-pill">{t('landing.pricing.savePercent', { percent: Math.round((1 - 1200 / (120 * 12)) * 100) })}</span>
                )}
              </button>
            </div>

            <div className="lp-pricing__body">
              <p className="lp-pricing__desc">{t('landing.pricing.shopDesc')}</p>

              <div className="lp-pricing__features">
                <ul>
                  <li>{t('landing.pricing.shopBullet1')}</li>
                  <li>{t('landing.pricing.shopBullet2')}</li>
                  <li>{t('landing.pricing.shopBullet3')}</li>
                </ul>
              </div>
            </div>

            <div className="lp-pricing__footer">
              <div className="lp-pricing__price">
                {billingCycle === 'annual' && (
                  <span className="lp-pricing__original-price">{120 * 12} zł</span>
                )}
                <span className="lp-pricing__amount">{billingCycle === 'monthly' ? '120' : '1200'} zł</span>
                <span className="lp-pricing__per-month">{billingCycle === 'monthly' ? t('landing.pricing.perMonth') : t('landing.pricing.perYear')}</span>
              </div>
              <button className="lp-btn lp-btn--accent lp-btn--lg" onClick={onJoinAsShop}>
                {t('landing.pricing.shopCta')}
              </button>
              <p className="lp-pricing__disclaimer">{t('landing.pricing.shopDisclaimer')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONVERSION ── */}
      <section className="lp-cta-section">
        <div className="lp-cta__grid">
          <div className="lp-cta__card lp-cta__card--driver">
            <h3>{t('landing.conversion.driverTitle')}</h3>
            <button className="lp-btn lp-btn--primary lp-btn--lg" onClick={onGetStarted}>
              {t('landing.conversion.driverCta')}
            </button>
          </div>
          <div className="lp-cta__card lp-cta__card--shop">
            <h3>{t('landing.conversion.shopTitle')}</h3>
            <button className="lp-btn lp-btn--accent lp-btn--lg" onClick={onJoinAsShop}>
              {t('landing.conversion.shopCta')}
            </button>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="lp-faq">
        <h2>{t('landing.faq.title')}</h2>
        <div className="lp-faq__list">
          {faqItems.map((item, i) => (
            <div className={`lp-faq__item ${openFaq === i ? 'lp-faq__item--open' : ''}`} key={i}>
              <button className="lp-faq__q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <span>{item.q}</span>
                <svg
                  className="lp-faq__chevron"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M5 8l5 5 5-5" />
                </svg>
              </button>
              <div
                className="lp-faq__a"
                style={{
                  maxHeight: openFaq === i ? (faqContentRefs.current[i]?.scrollHeight ?? 200) : 0,
                }}
              >
                <div ref={setFaqRef(i)}>
                  <p>{item.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-footer__inner">
          <div className="lp-footer__brand">
            <div className="brand-mark">AC</div>
            <span>Autoceny</span>
          </div>
          <p>{t('landing.footer.copy')}</p>
        </div>
      </footer>
    </div>
  )
}

/* ─── Mock UI Cards ────────────────────────────────────────── */

function DriverMock({ step, t }: { step: number; t: (key: string) => string }) {
  switch (step) {
    case 0:
      return (
        <div className="mk mk-form">
          <div className="mk__row">
            <span className="mk__icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="8" width="18" height="10" rx="2"/><path d="M6 8V6a2 2 0 012-2h8a2 2 0 012 2v2"/><circle cx="8" cy="18" r="2"/><circle cx="16" cy="18" r="2"/></svg>
            </span>
            <div className="mk__input">Audi A3 Sportback &middot; 2019</div>
          </div>
          <div className="mk__row">
            <span className="mk__icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
            </span>
            <div className="mk__textarea">{t('landing.mockBrakesIssue')}</div>
          </div>
          <div className="mk__slider">
            <div className="mk__slider-track">
              <div className="mk__slider-fill" />
              <div className="mk__slider-thumb" />
            </div>
            <span className="mk__slider-label">15 km</span>
          </div>
          <div className="mk__btn mk__btn--primary">{t('landing.mockSubmit')}</div>
        </div>
      )
    case 1:
      return (
        <div className="mk mk-list">
          <div className="mk__shop-row">
            <div>
              <span className="mk__shop-name">Auto Serwis Kowalski</span>
              <span className="mk__shop-dist">2.4 km</span>
            </div>
            <span className="mk__badge mk__badge--reviewing">{t('landing.mockReviewing')}</span>
          </div>
          <div className="mk__shop-row mk__shop-row--dim">
            <div>
              <span className="mk__shop-name">Moto Expert</span>
              <span className="mk__shop-dist">5.1 km</span>
            </div>
            <span className="mk__badge mk__badge--delivered">{t('landing.mockDelivered')}</span>
          </div>
        </div>
      )
    case 2:
      return (
        <div className="mk mk-chat">
          <div className="mk__bubble mk__bubble--shop">
            <span>{t('landing.mockAskQuestion')}</span>
          </div>
          <div className="mk__chat-actions">
            <div className="mk__btn mk__btn--primary mk__btn--sm">{t('landing.mockAnswer')}</div>
            <div className="mk__btn mk__btn--ghost mk__btn--sm">{t('landing.mockIgnore')}</div>
          </div>
        </div>
      )
    case 3:
      return (
        <div className="mk mk-quotes">
          <div className="mk__quote mk__quote--hl">
            <div className="mk__quote-top">
              <span className="mk__shop-name">Auto Serwis Kowalski</span>
              <span className="mk__shop-dist">2.4 km</span>
            </div>
            <div className="mk__quote-price">520&ndash;680 PLN</div>
            <div className="mk__quote-actions">
              <div className="mk__btn mk__btn--primary mk__btn--sm">{t('landing.mockInterested')}</div>
              <div className="mk__btn mk__btn--ghost mk__btn--sm">{t('landing.mockIgnore')}</div>
            </div>
          </div>
          <div className="mk__quote">
            <div className="mk__quote-top">
              <span className="mk__shop-name">Quick Fix Garage</span>
              <span className="mk__shop-dist">7.8 km</span>
            </div>
            <div className="mk__quote-price">550&ndash;700 PLN</div>
          </div>
        </div>
      )
    case 4:
      return (
        <div className="mk mk-chosen">
          <div className="mk__chosen-card">
            <div className="mk__quote-top">
              <span className="mk__shop-name">Auto Serwis Kowalski</span>
              <span className="mk__badge mk__badge--interested">{t('landing.mockInterested')}</span>
            </div>
            <div className="mk__quote-price">520&ndash;680 PLN</div>
            <div className="mk__phone">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
              +48 555 123 456
            </div>
          </div>
        </div>
      )
    default:
      return null
  }
}

function ShopMock({ step, t }: { step: number; t: (key: string) => string }) {
  switch (step) {
    case 0:
      return (
        <div className="mk mk-inbox">
          <div className="mk__inbox-header">
            <span>{t('landing.mockInbox')}</span>
            <span className="mk__badge mk__badge--count">1</span>
          </div>
          <div className="mk__inbox-item">
            <div className="mk__inbox-bell">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
            </div>
            <div className="mk__inbox-info">
              <span className="mk__inbox-title">{t('landing.mockNewRequest')}</span>
              <span className="mk__inbox-sub">Audi A3 &middot; {t('tags.brakes')}</span>
              <span className="mk__inbox-dist">2.4 km</span>
            </div>
          </div>
        </div>
      )
    case 1:
      return (
        <div className="mk mk-ack">
          <div className="mk__ack-header">Audi A3 &middot; {t('tags.brakes')}</div>
          <div className="mk__ack-desc">{t('landing.mockBrakesIssue')}</div>
          <div className="mk__btn mk__btn--accent mk__btn--action">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
            {t('landing.mockAcknowledge')}
          </div>
        </div>
      )
    case 2:
      return (
        <div className="mk mk-ask">
          <div className="mk__ack-header">Audi A3 &middot; {t('tags.brakes')}</div>
          <div className="mk__ask-input">{t('landing.mockTypeQuestion')}</div>
          <div className="mk__btn mk__btn--accent mk__btn--action">{t('landing.mockSendQuestion')}</div>
        </div>
      )
    case 3:
      return (
        <div className="mk mk-send-quote">
          <div className="mk__ack-header">Audi A3 &middot; {t('tags.brakes')}</div>
          <div className="mk__sq-fields">
            <div className="mk__sq-field">
              <span className="mk__sq-label">{t('landing.mockMinPrice')}</span>
              <span className="mk__sq-value">520 PLN</span>
            </div>
            <span className="mk__sq-dash">&ndash;</span>
            <div className="mk__sq-field">
              <span className="mk__sq-label">{t('landing.mockMaxPrice')}</span>
              <span className="mk__sq-value">680 PLN</span>
            </div>
          </div>
          <div className="mk__btn mk__btn--accent mk__btn--action">{t('landing.mockSendQuote')}</div>
        </div>
      )
    case 4:
      return (
        <div className="mk mk-share">
          <div className="mk__share-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
            {t('landing.mockQuoteSent')}
          </div>
          <div className="mk__toggle-row">
            <span>{t('landing.mockSharePhone')}</span>
            <div className="mk__toggle mk__toggle--on">
              <div className="mk__toggle-thumb" />
            </div>
          </div>
          <div className="mk__phone mk__phone--muted">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
            +48 555 987 654
          </div>
        </div>
      )
    default:
      return null
  }
}
