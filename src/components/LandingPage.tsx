import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { EnrollmentPlanCatalog, UserPlanCatalog } from '../domain/apiTypes'
import { formatMinorCurrency } from '../utils/format'
import { formatLimit } from '../utils/plan'
import { SeoSchema } from './SeoSchema'
import './LandingPage.css'

interface LandingPageProps {
  onGetStarted: () => void
  onJoinAsShop: () => void
  billingCatalog: UserPlanCatalog | null
  enrollmentCatalog: EnrollmentPlanCatalog | null
}

export function LandingPage({ onGetStarted, onJoinAsShop, billingCatalog, enrollmentCatalog }: LandingPageProps) {
  const { t, i18n } = useTranslation()
  const isPolish = i18n.language.startsWith('pl')

  const [navSolid, setNavSolid] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [pricingAudience, setPricingAudience] = useState<'driver' | 'shop'>('driver')
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')

  const heroRef = useRef<HTMLElement>(null)
  const [faqHeights, setFaqHeights] = useState<number[]>([])

  const toggleLang = () => void i18n.changeLanguage(isPolish ? 'en' : 'pl')

  // Catalog-derived pricing with fallbacks
  const lang = i18n.language
  const freePlan = billingCatalog?.plans.find((p) => p.code === 'FREE') ?? null
  const proPlan = billingCatalog?.plans.find((p) => p.code === 'PRO') ?? null
  const billingCurrency = billingCatalog?.currency ?? 'PLN'
  const proMonthlyMinor = proPlan?.prices.find((p) => p.billingInterval === 'MONTHLY')?.price ?? 2900
  const proMonthlyLabel = formatMinorCurrency(proMonthlyMinor, billingCurrency, lang)

  const enrollCurrency = enrollmentCatalog?.currency ?? 'PLN'
  const shopMonthlyMinor = enrollmentCatalog?.prices.find((p) => p.billingInterval === 'MONTHLY')?.price ?? 12000
  const shopAnnualMinor = enrollmentCatalog?.prices.find((p) => p.billingInterval === 'ANNUAL')?.price ?? 120000
  const shopMonthlyLabel = formatMinorCurrency(shopMonthlyMinor, enrollCurrency, lang)
  const shopAnnualLabel = formatMinorCurrency(shopAnnualMinor, enrollCurrency, lang)
  const shopOriginalAnnualLabel = formatMinorCurrency(shopMonthlyMinor * 12, enrollCurrency, lang)
  const shopSavePercent = Math.round((1 - shopAnnualMinor / (shopMonthlyMinor * 12)) * 100)

  // Nav solid on scroll past hero
  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return
    const observer = new IntersectionObserver(([entry]) => setNavSolid(!entry.isIntersecting), { threshold: 0.7 })
    observer.observe(hero)
    return () => observer.disconnect()
  }, [])

  // Reveal animation
  useEffect(() => {
    const els = document.querySelectorAll('.lp-rv')
    if (!els.length) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) entry.target.classList.add('lp-rv--vis')
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -30px 0px' },
    )
    for (const el of els) observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const scrollToSection = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const setFaqRef = useCallback(
    (index: number) => (el: HTMLDivElement | null) => {
      if (el) {
        setFaqHeights((prev) => {
          const h = el.scrollHeight
          if (prev[index] === h) return prev
          const next = [...prev]
          next[index] = h
          return next
        })
      }
    },
    [],
  )

  const faqItems = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        q: t(`landing.faq.q${i + 1}`),
        a: t(`landing.faq.a${i + 1}`),
      })),
    [t],
  )

  return (
    <div className="lp">
      <SeoSchema />

      {/* ── NAV ── */}
      <nav className={`lp-nav ${navSolid ? 'lp-nav--solid' : ''}`}>
        <div className="lp-nav__inner">
          <div className="lp-nav__brand">
            <img src="/brand/main-logo.svg" alt="" className="lp-nav__logo" />
            <span className="lp-nav__brand-name">autoceny</span>
          </div>

          <ul className="lp-nav__links">
            <li>
              <button onClick={() => scrollToSection('lp-how')}>{t('landing.nav.howItWorks')}</button>
            </li>
            <li>
              <button onClick={() => scrollToSection('lp-pricing')}>{t('landing.nav.pricing')}</button>
            </li>
            <li>
              <button onClick={() => scrollToSection('lp-faq')}>{t('landing.nav.faq')}</button>
            </li>
            <li>
              <button onClick={() => scrollToSection('lp-contact')}>{t('landing.nav.contact')}</button>
            </li>
          </ul>

          <div className="lp-nav__actions">
            <button className="lp-lang" onClick={toggleLang}>
              {isPolish ? 'EN' : 'PL'}
            </button>
            <button className="lp-nav__btn-pri" onClick={onGetStarted}>
              {t('landing.hero.cta')}
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="lp-hero" ref={heroRef}>
        <div className="lp-hero__decor" aria-hidden="true">
          <div className="lp-hero__shape lp-hero__shape--1" />
          <div className="lp-hero__shape lp-hero__shape--2" />
          <div className="lp-hero__shape lp-hero__shape--3" />
        </div>
        <div className="lp-hero__content">
          <div className="lp-hero__text">
            <h1 className="lp-hero__headline">
              {t('landing.hero.headline')
                .split('\n')
                .map((line, i, arr) => (
                  <span key={i}>
                    {line}
                    {i < arr.length - 1 && <br />}
                  </span>
                ))}
            </h1>
            <p className="lp-hero__sub">{t('landing.hero.subheadline')}</p>
            <div>
              <button className="lp-hero__cta-primary" onClick={onGetStarted}>
                {t('landing.hero.cta')}
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            </div>
          </div>

          <div className="lp-hero__visual">
            <PhoneMockup />
          </div>
        </div>

        <button className="lp-hero__scroll" onClick={() => scrollToSection('lp-trust-bar')} aria-label="Scroll down">
          <svg viewBox="0 0 24 24">
            <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
          </svg>
        </button>
      </section>

      {/* ── TRUST BAR ── */}
      <section className="lp-trust-bar" id="lp-trust-bar">
        <div className="lp-trust-bar__inner">
          <TrustStat
            delay=""
            icon={<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />}
            value="120+"
            label={t('landing.trustBar.workshops')}
          />
          <TrustStat
            delay="lp-rv-d1"
            icon={<path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />}
            value="~30%"
            label={t('landing.trustBar.savings')}
          />
          <TrustStat
            delay="lp-rv-d2"
            icon={
              <>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </>
            }
            value="< 2h"
            label={t('landing.trustBar.response')}
          />
          <TrustStat
            delay="lp-rv-d3"
            icon={
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26" />
            }
            value="4.8/5"
            label={t('landing.trustBar.rating')}
          />
        </div>
      </section>

      {/* ── FEATURE 1 ── */}
      <section className="lp-feature lp-feature--a" id="lp-how">
        <div className="lp-feature__inner">
          <div className="lp-rv">
            <p className="lp-feature__overline">{t('landing.feature1.overline')}</p>
            <h2 className="lp-feature__headline">{t('landing.feature1.headline')}</h2>
            <p className="lp-feature__body">{t('landing.feature1.body')}</p>
            <button className="lp-feature__btn" onClick={onGetStarted}>
              {t('landing.feature1.cta')}
            </button>
          </div>
          <div className="lp-feature__visual lp-rv lp-rv-d1">
            <FeatureMockup1 t={t} />
          </div>
        </div>
      </section>

      {/* ── FEATURE 2 (reversed) ── */}
      <section className="lp-feature lp-feature--b lp-feature--rev">
        <div className="lp-feature__inner">
          <div className="lp-rv">
            <p className="lp-feature__overline">{t('landing.feature2.overline')}</p>
            <h2 className="lp-feature__headline">{t('landing.feature2.headline')}</h2>
            <p className="lp-feature__body">{t('landing.feature2.body')}</p>
            <button className="lp-feature__btn" onClick={onGetStarted}>
              {t('landing.feature2.cta')}
            </button>
          </div>
          <div className="lp-feature__visual lp-rv lp-rv-d1">
            <FeatureMockup2 t={t} />
          </div>
        </div>
      </section>

      {/* ── WORKSHOP CALLOUT (Step 3) ── */}
      <section className="lp-shop-callout">
        <div className="lp-shop-callout__inner">
          {/* Left: pitch + CTAs */}
          <div className="lp-shop-callout__content lp-rv">
            <p className="lp-shop-callout__overline">{t('landing.shopCallout.overline')}</p>
            <h2 className="lp-shop-callout__headline">{t('landing.shopCallout.headline')}</h2>
            <p className="lp-shop-callout__desc">{t('landing.shopCallout.desc')}</p>
            <div className="lp-shop-callout__actions">
              <button className="lp-shop-callout__cta" onClick={onJoinAsShop}>
                {t('landing.shopCallout.cta')}
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
              <button className="lp-shop-callout__cta-secondary" onClick={() => scrollToSection('lp-contact')}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
                </svg>
                {t('landing.contact.heroCta')}
              </button>
            </div>
          </div>

          {/* Right: mockup card */}
          <div className="lp-shop-callout__visual lp-rv lp-rv-d1">
            <FeatureMockup3 t={t} />
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="lp-pricing" id="lp-pricing">
        <div className="lp-pricing__inner">
          <h2 className="lp-pricing__title lp-rv">{t('landing.pricing.title')}</h2>
          <p className="lp-pricing__subtitle lp-rv">{t('landing.pricing.subtitle')}</p>

          <div className="lp-pricing__tabs lp-rv">
            <button
              className={`lp-pricing__tab ${pricingAudience === 'driver' ? 'lp-pricing__tab--active' : ''}`}
              onClick={() => setPricingAudience('driver')}
            >
              <svg viewBox="0 0 24 24">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              {t('landing.pricing.driverLabel')}
            </button>
            <button
              className={`lp-pricing__tab ${pricingAudience === 'shop' ? 'lp-pricing__tab--active' : ''}`}
              onClick={() => setPricingAudience('shop')}
            >
              <svg viewBox="0 0 24 24">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              </svg>
              {t('landing.pricing.shopLabel')}
            </button>
          </div>

          {pricingAudience === 'driver' ? (
            <div className="lp-pricing__grid">
              {/* Free card */}
              <div className="lp-pcard">
                <div className="lp-pcard__plan">{t('landing.pricing.freePlan')}</div>
                <div className="lp-pcard__price">
                  0 zł <span>{t('landing.pricing.perMonth')}</span>
                </div>
                <div className="lp-pcard__desc">{t('landing.pricing.freeDesc')}</div>
                <ul className="lp-pcard__features">
                  <li className="lp-pcard__feat">
                    <svg className="lp-pcard__check" viewBox="0 0 24 24">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    {t('landing.pricing.freeBullet1')}
                  </li>
                  <li className="lp-pcard__feat">
                    <svg className="lp-pcard__check" viewBox="0 0 24 24">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    {t('landing.pricing.freeBullet2')}
                  </li>
                  <li className="lp-pcard__feat">
                    <svg className="lp-pcard__check" viewBox="0 0 24 24">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    {t('landing.pricing.freeBullet3')}
                  </li>
                </ul>
                <div className="lp-pcard__limits">
                  <div className="lp-pcard__limit">
                    <span className="lp-pcard__limit-label">{t('landing.pricing.limitOpen')}</span>
                    <span className="lp-pcard__limit-val">
                      {formatLimit(freePlan?.entitlements.maxOpenRepairRequests ?? 3, t)}
                    </span>
                  </div>
                  <div className="lp-pcard__limit">
                    <span className="lp-pcard__limit-label">{t('landing.pricing.limitDaily')}</span>
                    <span className="lp-pcard__limit-val">
                      {formatLimit(freePlan?.entitlements.maxRepairRequestsPerDay ?? 1, t)}
                    </span>
                  </div>
                  <div className="lp-pcard__limit">
                    <span className="lp-pcard__limit-label">{t('landing.pricing.limitQuestions')}</span>
                    <span className="lp-pcard__limit-val">
                      {formatLimit(freePlan?.entitlements.maxQuestionsPerRepairRequest ?? 2, t)}
                    </span>
                  </div>
                </div>
                <button className="lp-pcard__cta lp-pcard__cta--sec" onClick={onGetStarted}>
                  {t('landing.pricing.driverCta')}
                </button>
                <div className="lp-pcard__foot">{t('landing.pricing.driverDisclaimer')}</div>
              </div>

              {/* Premium card */}
              <div className="lp-pcard lp-pcard--feat">
                <div className="lp-pcard__plan">{t('landing.pricing.premiumPlan')}</div>
                <div className="lp-pcard__price">
                  {proMonthlyLabel} <span>{t('landing.pricing.perMonth')}</span>
                </div>
                <div className="lp-pcard__desc">{t('landing.pricing.premiumDesc')}</div>
                <ul className="lp-pcard__features">
                  <li className="lp-pcard__feat">
                    <svg className="lp-pcard__check" viewBox="0 0 24 24">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    {t('landing.pricing.freeBullet1')}
                  </li>
                  <li className="lp-pcard__feat">
                    <svg className="lp-pcard__check" viewBox="0 0 24 24">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    {t('landing.pricing.freeBullet2')}
                  </li>
                  <li className="lp-pcard__feat">
                    <svg className="lp-pcard__check" viewBox="0 0 24 24">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    {t('landing.pricing.freeBullet3')}
                  </li>
                </ul>
                <div className="lp-pcard__limits">
                  <div className="lp-pcard__limit">
                    <span className="lp-pcard__limit-label">{t('landing.pricing.limitOpen')}</span>
                    <span className="lp-pcard__limit-val">
                      {formatLimit(proPlan?.entitlements.maxOpenRepairRequests ?? 10, t)}
                    </span>
                  </div>
                  <div className="lp-pcard__limit">
                    <span className="lp-pcard__limit-label">{t('landing.pricing.limitDaily')}</span>
                    <span className="lp-pcard__limit-val">
                      {formatLimit(proPlan?.entitlements.maxRepairRequestsPerDay ?? 5, t)}
                    </span>
                  </div>
                  <div className="lp-pcard__limit">
                    <span className="lp-pcard__limit-label">{t('landing.pricing.limitQuestions')}</span>
                    <span className="lp-pcard__limit-val">
                      {formatLimit(proPlan?.entitlements.maxQuestionsPerRepairRequest ?? 10, t)}
                    </span>
                  </div>
                </div>
                <button className="lp-pcard__cta lp-pcard__cta--pri" onClick={onGetStarted}>
                  {t('landing.pricing.driverCtaPremium')}
                </button>
              </div>
            </div>
          ) : (
            <div className="lp-pricing__grid lp-pricing__grid--single">
              <div className="lp-pcard lp-pcard--feat lp-pcard--centered">
                <div className="lp-pcard__plan">{t('landing.pricing.shopPlanName')}</div>
                <div className="lp-pricing__billing">
                  <button
                    className={`lp-pricing__billing-btn ${billingCycle === 'monthly' ? 'lp-pricing__billing-btn--active' : ''}`}
                    onClick={() => setBillingCycle('monthly')}
                  >
                    {t('landing.pricing.monthly')}
                  </button>
                  <button
                    className={`lp-pricing__billing-btn ${billingCycle === 'annual' ? 'lp-pricing__billing-btn--active' : ''}`}
                    onClick={() => setBillingCycle('annual')}
                  >
                    {t('landing.pricing.annual')}
                    {billingCycle === 'annual' && shopSavePercent > 0 && (
                      <span className="lp-pricing__save-pill">
                        {t('landing.pricing.savePercent', { percent: shopSavePercent })}
                      </span>
                    )}
                  </button>
                </div>
                <div className="lp-pcard__price">
                  {billingCycle === 'annual' && (
                    <span className="lp-pcard__original-price">{shopOriginalAnnualLabel}</span>
                  )}
                  {billingCycle === 'monthly' ? shopMonthlyLabel : shopAnnualLabel}{' '}
                  <span>
                    {billingCycle === 'monthly' ? t('landing.pricing.perMonth') : t('landing.pricing.perYear')}
                  </span>
                </div>
                <div className="lp-pcard__desc">{t('landing.pricing.shopDesc')}</div>
                <ul className="lp-pcard__features">
                  <li className="lp-pcard__feat">
                    <svg className="lp-pcard__check" viewBox="0 0 24 24">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    {t('landing.pricing.shopBullet1')}
                  </li>
                  <li className="lp-pcard__feat">
                    <svg className="lp-pcard__check" viewBox="0 0 24 24">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    {t('landing.pricing.shopBullet2')}
                  </li>
                  <li className="lp-pcard__feat">
                    <svg className="lp-pcard__check" viewBox="0 0 24 24">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    {t('landing.pricing.shopBullet3')}
                  </li>
                </ul>
                <button className="lp-pcard__cta lp-pcard__cta--pri" onClick={onJoinAsShop}>
                  {t('landing.pricing.shopCta')}
                </button>
                <div className="lp-pcard__foot">{t('landing.pricing.shopDisclaimer')}</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="lp-faq" id="lp-faq">
        <div className="lp-faq__inner">
          <h2 className="lp-faq__title lp-rv">{t('landing.faq.title')}</h2>
          <div className="lp-faq__list lp-rv">
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
                <div className="lp-faq__a" style={{ maxHeight: openFaq === i ? (faqHeights[i] ?? 200) : 0 }}>
                  <div ref={setFaqRef(i)}>
                    <p>{item.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section className="lp-contact" id="lp-contact">
        <div className="lp-contact__inner">
          <p className="lp-contact__overline lp-rv">{t('landing.contact.overline')}</p>
          <h2 className="lp-contact__headline lp-rv">{t('landing.contact.headline')}</h2>

          <div className="lp-contact__grid lp-rv">
            <a className="lp-contact__item" href="tel:+48XXXXXXXXX">
              <div className="lp-contact__icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.12.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.58 2.81.7A2 2 0 0122 16.92z" />
                </svg>
              </div>
              <div className="lp-contact__value">{t('landing.contact.phoneValue')}</div>
              <div className="lp-contact__hint">{t('landing.contact.phoneHint')}</div>
            </a>

            <div className="lp-contact__divider" />

            <a className="lp-contact__item" href="mailto:kontakt@autoceny.pl">
              <div className="lp-contact__icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M22 7l-10 7L2 7" />
                </svg>
              </div>
              <div className="lp-contact__value">{t('landing.contact.emailValue')}</div>
              <div className="lp-contact__hint">{t('landing.contact.emailHint')}</div>
            </a>

            <div className="lp-contact__divider" />

            <a
              className="lp-contact__item"
              href="https://instagram.com/autoceny"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="lp-contact__icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <circle cx="12" cy="12" r="5" />
                  <circle cx="17.5" cy="6.5" r="1.5" />
                </svg>
              </div>
              <div className="lp-contact__value">{t('landing.contact.igValue')}</div>
              <div className="lp-contact__hint">{t('landing.contact.igHint')}</div>
            </a>
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="lp-bottom-cta">
        <div className="lp-bottom-cta__inner lp-rv">
          <h2 className="lp-bottom-cta__headline">{t('landing.bottomCta.headline')}</h2>
          <p className="lp-bottom-cta__body">{t('landing.bottomCta.body')}</p>
          <button className="lp-bottom-cta__btn" onClick={onGetStarted}>
            {t('landing.bottomCta.cta')}
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-footer__inner">
          <div className="lp-footer__brand">
            <img src="/brand/white-logo.svg" alt="" className="lp-footer__logo" />
            <span className="lp-footer__brand-name">autoceny</span>
          </div>
          <ul className="lp-footer__links">
            <li>
              <button onClick={() => scrollToSection('lp-how')}>{t('landing.nav.howItWorks')}</button>
            </li>
            <li>
              <button onClick={() => scrollToSection('lp-pricing')}>{t('landing.nav.pricing')}</button>
            </li>
            <li>
              <button onClick={() => scrollToSection('lp-faq')}>{t('landing.nav.faq')}</button>
            </li>
            <li>
              <button onClick={() => scrollToSection('lp-contact')}>{t('landing.nav.contact')}</button>
            </li>
          </ul>
          <p className="lp-footer__copy">{t('landing.footer.copy')}</p>
        </div>
      </footer>
    </div>
  )
}

/* ─── Sub-components ─────────────────────────────────────── */

function TrustStat({
  delay,
  icon,
  value,
  label,
}: {
  delay: string
  icon: React.ReactNode
  value: string
  label: string
}) {
  return (
    <div className={`lp-trust-bar__stat lp-rv ${delay}`}>
      <div className="lp-trust-bar__icon">
        <svg viewBox="0 0 24 24">{icon}</svg>
      </div>
      <div className="lp-trust-bar__number">{value}</div>
      <div className="lp-trust-bar__label">{label}</div>
    </div>
  )
}

function useClockTime() {
  const [time, setTime] = useState(() => {
    const d = new Date()
    return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`
  })
  useEffect(() => {
    const id = setInterval(() => {
      const d = new Date()
      setTime(`${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`)
    }, 10_000)
    return () => clearInterval(id)
  }, [])
  return time
}

function PhoneMockup() {
  const { t } = useTranslation()
  const clockTime = useClockTime()
  return (
    <>
      {/* Floating card: savings summary */}
      <div className="lp-float-card">
        <div className="lp-float-card__label">{t('landing.phoneYourRequest')}</div>
        <div className="lp-float-card__row">
          <div className="lp-float-card__name">{t('landing.phoneCarBrakes')}</div>
        </div>
        <div className="lp-float-card__row">
          <span className="lp-demo-meta">{t('landing.phoneQuotesReceived')}</span>
          <span className="lp-demo-price">{t('landing.phonePriceFrom')}</span>
        </div>
        <div className="lp-float-card__bar">
          <div className="lp-float-card__fill" />
        </div>
        <div className="lp-float-card__sub">{t('landing.phoneShopsResponded')}</div>
      </div>

      {/* Floating badge: notification */}
      <div className="lp-float-badge">
        <div className="lp-float-badge__icon">
          <svg viewBox="0 0 24 24">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            <path d="M22 4L12 14.01l-3-3" />
          </svg>
        </div>
        <div>
          <div className="lp-float-badge__text">{t('landing.phoneNewQuote')}</div>
          <div className="lp-float-badge__sub">{t('landing.phoneNotifShop')}</div>
        </div>
      </div>

      {/* 3D Phone */}
      <div className="lp-phone">
        <div className="lp-phone__frame">
          <div className="lp-phone__island" />
          <div className="lp-phone__screen">
            <div className="lp-app">
              {/* Header */}
              <div className="lp-app__header">
                <div className="lp-app__header-top">
                  <span>{clockTime}</span>
                  <div className="lp-app__status-bar">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="rgba(255,255,255,.5)"
                      strokeWidth="2"
                    >
                      <path d="M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0M12 20h.01" />
                    </svg>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="rgba(255,255,255,.5)"
                      strokeWidth="2"
                    >
                      <rect x="1" y="6" width="18" height="12" rx="2" />
                      <path d="M23 13v-2" />
                    </svg>
                  </div>
                </div>
                <div className="lp-app__balance-label">{t('landing.phoneYourRequests')}</div>
                <div className="lp-app__balance">{t('landing.phoneActiveCount')}</div>
                <div className="lp-app__balance-sub">{t('landing.phoneQuoteSummary')}</div>
              </div>

              {/* Tabs */}
              <div className="lp-app__tabs">
                <div className="lp-app__tab lp-app__tab--active">{t('landing.phoneTabOpen')}</div>
                <div className="lp-app__tab">{t('landing.phoneTabClosed')}</div>
                <div className="lp-app__tab">{t('landing.phoneTabAll')}</div>
              </div>

              {/* Content */}
              <div className="lp-app__content">
                {/* Order 1: with quote */}
                <div className="lp-app__order">
                  <div className="lp-app__order-top">
                    <div className="lp-app__order-car">{t('landing.phoneCarBrakes')}</div>
                    <div className="lp-app__order-badge">{t('landing.phoneQuoteCount')}</div>
                  </div>
                  <div className="lp-app__order-desc">{t('landing.phoneBrakesDesc')}</div>
                  <div className="lp-app__order-meta">{t('landing.phoneRange15')}</div>

                  <div className="lp-app__quote">
                    <div className="lp-app__quote-head">
                      <div className="lp-app__quote-name">{t('landing.phoneShopName')}</div>
                      <div className="lp-app__quote-dist">{t('landing.phoneDist')}</div>
                    </div>
                    <div className="lp-app__quote-price">
                      {t('landing.phoneQuoteRange')} <span>{t('landing.phoneCurrency')}</span>
                    </div>
                    <div className="lp-app__quote-comment">{t('landing.phoneQuoteComment')}</div>
                    <div className="lp-app__quote-actions">
                      <button className="lp-app__quote-btn lp-app__quote-btn--pri">
                        {t('landing.phoneInterested')}
                      </button>
                      <button className="lp-app__quote-btn lp-app__quote-btn--sec">{t('landing.phoneIgnore')}</button>
                    </div>
                  </div>
                </div>

                {/* Order 2: dimmed */}
                <div className="lp-app__order lp-app__order--dim">
                  <div className="lp-app__order-top">
                    <div className="lp-app__order-car">{t('landing.phoneCarAC')}</div>
                    <div className="lp-app__order-badge lp-app__order-badge--pending">{t('landing.phonePending')}</div>
                  </div>
                  <div className="lp-app__order-desc">{t('landing.phoneACDesc')}</div>
                  <div className="lp-app__order-meta">{t('landing.phoneRange10')}</div>
                </div>
              </div>

              {/* Bottom nav */}
              <div className="lp-app__nav">
                <div className="lp-app__nav-item lp-app__nav-item--active">
                  <svg className="lp-app__nav-icon" viewBox="0 0 24 24">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  </svg>
                  {t('landing.phoneNavRequests')}
                </div>
                <div className="lp-app__nav-item">
                  <svg className="lp-app__nav-icon" viewBox="0 0 24 24">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                  </svg>
                  {t('landing.phoneNavQuotes')}
                </div>
                <div className="lp-app__nav-item">
                  <svg className="lp-app__nav-icon" viewBox="0 0 24 24">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
                  </svg>
                  {t('landing.phoneNavQuestions')}
                </div>
                <div className="lp-app__nav-item">
                  <svg className="lp-app__nav-icon" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                  </svg>
                  {t('landing.phoneNavSettings')}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="lp-phone__shadow" aria-hidden="true" />
      </div>
    </>
  )
}

function FeatureMockup1({ t }: { t: (key: string) => string }) {
  const [radius, setRadius] = useState(15)
  const pct = ((radius - 5) / (50 - 5)) * 100

  return (
    <div className="lp-fcard">
      <div className="lp-fcard__form">
        <div className="lp-ff">
          <svg viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18" />
          </svg>
          Audi A3 Sportback &middot; 2019
        </div>
        <div className="lp-ff">
          <svg viewBox="0 0 24 24">
            <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
          </svg>
          {t('landing.mockBrakesIssue')}
        </div>
        <div className="lp-fslider">
          <div className="lp-fslider__track">
            <div className="lp-fslider__fill" style={{ width: `${pct}%` }} />
            <div className="lp-fslider__thumb" style={{ left: `${pct}%` }} />
            <input
              className="lp-fslider__input"
              type="range"
              min={5}
              max={50}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              aria-label="Radius km"
            />
          </div>
          <div className="lp-fslider__val">{radius} km</div>
        </div>
        <div className="lp-ff-btn">{t('landing.mockSubmit')}</div>
      </div>
    </div>
  )
}

function FeatureMockup2({ t }: { t: (key: string) => string }) {
  return (
    <div className="lp-fcard lp-fcard--compact">
      <div className="lp-fcard__head">
        <div className="lp-fcard__title">Audi A3 &middot; {t('tags.brakes')}</div>
        <span className="lp-fcard__badge lp-fcard__badge--green">{t('status.open')}</span>
      </div>
      <div className="lp-fquote">
        <div className="lp-fq-name">Auto Serwis Kowalski</div>
        <div className="lp-fq-meta">2.4 km</div>
        <div className="lp-fq-desc">{t('landing.mockQuoteDesc')}</div>
        <div className="lp-fq-price">
          520–680 <span>PLN</span>
        </div>
        <div className="lp-fq-acts">
          <button className="lp-fq-btn lp-fq-btn--pri">{t('landing.mockInterested')}</button>
          <button className="lp-fq-btn lp-fq-btn--sec">{t('detail.ignore')}</button>
        </div>
      </div>
      <div className="lp-fquote lp-fquote--dim">
        <div className="lp-fq-name">Quick Fix Garage</div>
        <div className="lp-fq-meta">7.8 km</div>
        <div className="lp-fq-thread">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>{t('landing.mockQuoteThread')}</span>
        </div>
        <div className="lp-fq-price">
          550–700 <span>PLN</span>
        </div>
      </div>
    </div>
  )
}

const PARTS_DATA = [
  {
    suppliers: [
      { name: 'Inter Cars', price: 280 },
      { name: 'Hart', price: 305 },
      { name: 'Gordon', price: 295 },
    ],
  },
  {
    suppliers: [
      { name: 'Inter Cars', price: 410 },
      { name: 'Hart', price: 365 },
      { name: 'Gordon', price: 350 },
    ],
  },
] as const

function FeatureMockup3({ t }: { t: (key: string) => string }) {
  const [selected, setSelected] = useState([0, 2])
  const [labor, setLabor] = useState('180')
  const laborRef = useRef<HTMLInputElement>(null)

  const partsCost = PARTS_DATA.reduce((sum, group, gi) => sum + group.suppliers[selected[gi]].price, 0)
  const laborNum = parseInt(labor, 10) || 0
  const total = partsCost + laborNum

  const handleSelect = useCallback((groupIndex: number, supplierIndex: number) => {
    setSelected((prev) => {
      const next = [...prev]
      next[groupIndex] = supplierIndex
      return next
    })
  }, [])

  const handleLaborChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '')
    if (val.length <= 5) setLabor(val)
  }, [])

  return (
    <div className="lp-fcard">
      <div className="lp-fw-stats">
        <div className="lp-fw-stats__item">
          <span className="lp-fw-stats__num">3</span>
          <span className="lp-fw-stats__label">{t('shopInbox.statNew')}</span>
        </div>
        <div className="lp-fw-stats__div" />
        <div className="lp-fw-stats__item">
          <span className="lp-fw-stats__num">2</span>
          <span className="lp-fw-stats__label">{t('shopInbox.statInProgress')}</span>
        </div>
        <div className="lp-fw-stats__div" />
        <div className="lp-fw-stats__item">
          <span className="lp-fw-stats__num">5</span>
          <span className="lp-fw-stats__label">{t('shopInbox.statTotal')}</span>
        </div>
      </div>
      <div className="lp-fw-request lp-fw-request--anim">
        <div className="lp-fw-request__top">
          <span className="lp-fw-request__car">VW Golf VII &middot; 2019</span>
          <span className="lp-fcard__badge lp-fcard__badge--green">{t('shopInbox.statNew')}</span>
        </div>
        <div className="lp-fw-request__desc">{t('landing.mockShopDesc')}</div>
        <div className="lp-fw-request__meta">
          <span>3.2 km</span>
          <span className="lp-fw-request__tag">{t('tags.brakes')}</span>
        </div>
        <div className="lp-fw-request__ask">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>{t('landing.mockAskDriver')}</span>
        </div>
      </div>
      <div className="lp-fw-quote lp-fw-quote--anim">
        <div className="lp-fw-quote__label">{t('landing.mockShopYourQuote')}</div>
        {PARTS_DATA.map((group, gi) => (
          <div key={gi}>
            <div className={`lp-fw-parts-label ${gi === 0 ? 'lp-fw-parts--anim' : 'lp-fw-parts--anim2'}`}>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              <span>{t(gi === 0 ? 'landing.mockPartsName' : 'landing.mockPartsName2')}</span>
            </div>
            <div className={`lp-fw-parts ${gi === 0 ? 'lp-fw-parts--anim' : 'lp-fw-parts--anim2'}`}>
              {group.suppliers.map((s, si) => (
                <button
                  key={si}
                  className={`lp-fw-parts__card ${selected[gi] === si ? 'lp-fw-parts__card--best' : ''}`}
                  onClick={() => handleSelect(gi, si)}
                  type="button"
                >
                  <span className="lp-fw-parts__name">{s.name}</span>
                  <span className="lp-fw-parts__price">{s.price} PLN</span>
                </button>
              ))}
            </div>
          </div>
        ))}
        <div className="lp-fw-input lp-fw-input--interactive" onClick={() => laborRef.current?.focus()}>
          <label className="lp-fw-input__label" htmlFor="lp-labor-input">
            {t('landing.mockLaborPrice')}
          </label>
          <input
            id="lp-labor-input"
            ref={laborRef}
            className="lp-fw-input__real"
            type="text"
            inputMode="numeric"
            value={labor}
            onChange={handleLaborChange}
          />
          <span className="lp-fw-input__sfx">PLN</span>
        </div>
        <div className="lp-fw-total">
          <div className="lp-fw-total__breakdown">
            <span>{t('landing.mockPartsCost')}</span>
            <span>{partsCost} PLN</span>
          </div>
          <div className="lp-fw-total__sum">
            <span>{t('quoteDetail.total')}</span>
            <span>{total} PLN</span>
          </div>
        </div>
        <div className="lp-fw-meta">
          <svg
            className="lp-fw-meta__icon"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>{t('landing.mockEstDays')}</span>
          <span className="lp-fw-meta__val">{t('landing.mockEstDaysValue')}</span>
        </div>
      </div>
      <div className="lp-fw-submit">{t('landing.mockSendQuote')}</div>
    </div>
  )
}
