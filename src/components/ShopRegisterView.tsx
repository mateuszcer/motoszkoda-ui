import { Turnstile } from '@marsidev/react-turnstile'
import type { TurnstileInstance } from '@marsidev/react-turnstile'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ShopRegistrationRequest } from '../domain/apiTypes'
import { useAddressAutocomplete } from '../hooks/useAddressAutocomplete'
import { getApiErrorMessage } from '../utils/apiErrors'
import { isValidE164Phone, isValidNip, isValidPolishPostalCode } from '../utils/validation'
import { PhoneInput } from './PhoneInput'

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY

type WizardStep = 1 | 2 | 3

interface ShopRegisterViewProps {
  onRegister: (payload: ShopRegistrationRequest) => Promise<void>
  onSwitchToLogin: () => void
}

export function ShopRegisterView({ onRegister, onSwitchToLogin }: ShopRegisterViewProps) {
  const { t } = useTranslation()
  const [step, setStep] = useState<WizardStep>(1)

  // Account
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Shop Profile
  const [shopName, setShopName] = useState('')
  const [description, setDescription] = useState('')
  const autocomplete = useAddressAutocomplete()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Contact
  const [contactPhone, setContactPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')

  // Billing / VAT
  const [legalName, setLegalName] = useState('')
  const [nip, setNip] = useState('')
  const [sameAsShop, setSameAsShop] = useState(true)
  const [billingStreet, setBillingStreet] = useState('')
  const [billingCity, setBillingCity] = useState('')
  const [billingPostalCode, setBillingPostalCode] = useState('')
  const [invoiceEmail, setInvoiceEmail] = useState('')

  // Terms
  const [termsAccepted, setTermsAccepted] = useState(false)

  // CAPTCHA
  const [captchaToken, setCaptchaToken] = useState<string | undefined>(undefined)
  const turnstileRef = useRef<TurnstileInstance>(null)

  // Form state
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const stepLabels = useMemo(
    () => [t('shopRegister.stepAccount'), t('shopRegister.stepShop'), t('shopRegister.stepCompany')],
    [t],
  )

  const stepSubtitle = useMemo(() => {
    switch (step) {
      case 1:
        return t('shopRegister.subtitleStep1')
      case 2:
        return t('shopRegister.subtitleStep2')
      case 3:
        return t('shopRegister.subtitleStep3')
    }
  }, [step, t])

  const validateStep1 = (): boolean => {
    const errs: Record<string, string> = {}
    if (!email.trim()) errs.email = t('shopRegister.emailRequired')
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = t('shopRegister.emailInvalid')
    if (password.length < 6) errs.password = t('shopRegister.passwordMinLength')
    if (password !== confirmPassword) errs.confirmPassword = t('shopRegister.passwordMismatch')
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const validateStep2 = (): boolean => {
    const errs: Record<string, string> = {}
    if (!shopName.trim()) errs.shopName = t('shopRegister.shopNameRequired')
    if (!autocomplete.query.trim()) errs.address = t('shopRegister.addressRequired')
    else if (!autocomplete.selected) errs.address = t('shopRegister.selectAddress')
    if (!contactPhone.trim()) errs.contactPhone = t('shopRegister.phoneRequired')
    else if (!isValidE164Phone(contactPhone.trim())) errs.contactPhone = t('shopRegister.phoneInvalid')
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const validateStep3 = (): boolean => {
    const errs: Record<string, string> = {}
    if (!legalName.trim()) errs.legalName = t('shopRegister.legalNameRequired')
    if (!nip.trim()) errs.nip = t('shopRegister.nipRequired')
    else if (!isValidNip(nip.trim())) errs.nip = t('shopRegister.nipInvalid')
    if (!sameAsShop) {
      if (!billingStreet.trim()) errs.billingStreet = t('shopRegister.billingStreetRequired')
      if (!billingCity.trim()) errs.billingCity = t('shopRegister.billingCityRequired')
      if (!billingPostalCode.trim()) errs.billingPostalCode = t('shopRegister.billingPostalCodeRequired')
      else if (!isValidPolishPostalCode(billingPostalCode.trim()))
        errs.billingPostalCode = t('shopRegister.billingPostalCodeInvalid')
    }
    if (!termsAccepted) errs.terms = t('shopRegister.termsRequired')
    if (TURNSTILE_SITE_KEY && !captchaToken) errs.captcha = t('auth.captchaRequired')
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2)
    else if (step === 2 && validateStep2()) setStep(3)
  }

  const handleBack = () => {
    setErrors({})
    if (step === 2) setStep(1)
    else if (step === 3) setStep(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    if (!validateStep3()) return

    const addressText = autocomplete.query.trim()

    const payload: ShopRegistrationRequest = {
      email: email.trim(),
      password,
      name: shopName.trim(),
      address: addressText,
      contactPhoneE164: contactPhone.trim(),
      contactEmail: contactEmail.trim() || undefined,
      description: description.trim() || undefined,
      lat: autocomplete.selected?.lat ?? 0,
      lon: autocomplete.selected?.lon ?? 0,
      legalName: legalName.trim(),
      nip: nip.replace(/[\s-]/g, ''),
      billingStreet: sameAsShop ? (autocomplete.selected?.street ?? addressText) : billingStreet.trim(),
      billingCity: sameAsShop ? (autocomplete.selected?.city ?? '') : billingCity.trim(),
      billingPostalCode: sameAsShop ? (autocomplete.selected?.postcode ?? '') : billingPostalCode.trim(),
      invoiceEmail: invoiceEmail.trim() || undefined,
      termsVersion: '2026-03-01',
      captchaToken: captchaToken ?? null,
    }

    setSubmitting(true)
    try {
      await onRegister(payload)
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, t, 'shopRegister.registerFailed'))
      setCaptchaToken(undefined)
      turnstileRef.current?.reset()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="shop-register-screen">
      {/* Stepper */}
      <nav className="stepper shop-register-stepper" aria-label="Registration progress">
        {stepLabels.map((label, index) => {
          const stepNum = (index + 1) as WizardStep
          const isActive = step === stepNum
          const isDone = step > stepNum
          return (
            <div key={label} className="u-contents">
              {index > 0 ? <div className={`stepper-line${isDone ? ' done' : ''}`} /> : null}
              <div className={`stepper-step${isActive ? ' active' : ''}${isDone ? ' done' : ''}`}>
                <span className="stepper-dot">{isDone ? '\u2713' : stepNum}</span>
                <span className="stepper-label">{label}</span>
              </div>
            </div>
          )
        })}
      </nav>

      {/* Card */}
      <div className="shop-register-card">
        <div className="shop-register-header">
          <h2>{t('shopRegister.title')}</h2>
          <p>{stepSubtitle}</p>
        </div>

        {submitError ? <div className="auth-error">{submitError}</div> : null}

        <form
          onSubmit={
            step === 3
              ? (e) => void handleSubmit(e)
              : (e) => {
                  e.preventDefault()
                  handleNext()
                }
          }
        >
          {/* Step 1: Account */}
          {step === 1 ? (
            <div className="form-grid">
              <label>
                {t('auth.email')}
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.emailPlaceholder')}
                  autoComplete="email"
                />
                {errors.email ? <small className="field-error">{errors.email}</small> : null}
              </label>

              <label>
                {t('auth.password')}
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.passwordPlaceholder')}
                  autoComplete="new-password"
                />
                {errors.password ? <small className="field-error">{errors.password}</small> : null}
              </label>

              <label>
                {t('auth.confirmPassword')}
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('auth.confirmPasswordPlaceholder')}
                  autoComplete="new-password"
                />
                {errors.confirmPassword ? <small className="field-error">{errors.confirmPassword}</small> : null}
              </label>
            </div>
          ) : null}

          {/* Step 2: Shop */}
          {step === 2 ? (
            <div className="form-grid">
              <label>
                {t('shopRegister.shopName')}
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder={t('shopRegister.shopNamePlaceholder')}
                />
                {errors.shopName ? <small className="field-error">{errors.shopName}</small> : null}
              </label>

              <label>
                {t('shopRegister.description')} <span className="optional-hint">({t('form.optional')})</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('shopRegister.descriptionPlaceholder')}
                  rows={3}
                />
              </label>

              <div className="address-autocomplete" ref={dropdownRef}>
                <label>
                  {t('shopRegister.address')}
                  <div className="address-input-wrap">
                    <input
                      type="text"
                      value={autocomplete.query}
                      onChange={(e) => {
                        autocomplete.setQuery(e.target.value)
                        setShowDropdown(true)
                        if (autocomplete.selected) {
                          autocomplete.clear()
                          autocomplete.setQuery(e.target.value)
                        }
                      }}
                      onFocus={() => {
                        if (autocomplete.suggestions.length > 0) setShowDropdown(true)
                      }}
                      placeholder={t('shopRegister.addressPlaceholder')}
                      autoComplete="off"
                    />
                    {autocomplete.loading ? <span className="address-spinner" /> : null}
                  </div>
                  {errors.address ? <small className="field-error">{errors.address}</small> : null}
                </label>

                {showDropdown && autocomplete.suggestions.length > 0 ? (
                  <ul className="address-suggestions">
                    {autocomplete.suggestions.map((s, i) => (
                      <li key={i}>
                        <button
                          type="button"
                          onClick={() => {
                            autocomplete.pick(s)
                            setShowDropdown(false)
                          }}
                        >
                          {s.displayName}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {autocomplete.selected ? (
                  <p className="address-coords">
                    {autocomplete.selected.lat.toFixed(5)}, {autocomplete.selected.lon.toFixed(5)}
                  </p>
                ) : null}
              </div>

              <label>
                {t('shopRegister.contactPhone')}
                <PhoneInput
                  value={contactPhone}
                  onChange={setContactPhone}
                  placeholder={t('shopRegister.contactPhonePlaceholder')}
                />
                {errors.contactPhone ? <small className="field-error">{errors.contactPhone}</small> : null}
              </label>

              <label>
                {t('shopRegister.contactEmail')} <span className="optional-hint">({t('form.optional')})</span>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder={t('shopRegister.contactEmailPlaceholder')}
                />
              </label>
            </div>
          ) : null}

          {/* Step 3: Company */}
          {step === 3 ? (
            <div className="form-grid">
              <label>
                {t('shopRegister.legalName')}
                <input
                  type="text"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder={t('shopRegister.legalNamePlaceholder')}
                />
                {errors.legalName ? <small className="field-error">{errors.legalName}</small> : null}
              </label>

              <label>
                {t('shopRegister.nip')}
                <input
                  type="text"
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  placeholder={t('shopRegister.nipPlaceholder')}
                  inputMode="numeric"
                />
                {errors.nip ? <small className="field-error">{errors.nip}</small> : null}
              </label>

              <label className="checkbox-label">
                <input type="checkbox" checked={sameAsShop} onChange={(e) => setSameAsShop(e.target.checked)} />
                {t('shopRegister.sameAsShopAddress')}
              </label>

              {!sameAsShop ? (
                <>
                  <label>
                    {t('shopRegister.billingStreet')}
                    <input
                      type="text"
                      value={billingStreet}
                      onChange={(e) => setBillingStreet(e.target.value)}
                      placeholder={t('shopRegister.billingStreetPlaceholder')}
                    />
                    {errors.billingStreet ? <small className="field-error">{errors.billingStreet}</small> : null}
                  </label>

                  <label>
                    {t('shopRegister.billingCity')}
                    <input
                      type="text"
                      value={billingCity}
                      onChange={(e) => setBillingCity(e.target.value)}
                      placeholder={t('shopRegister.billingCityPlaceholder')}
                    />
                    {errors.billingCity ? <small className="field-error">{errors.billingCity}</small> : null}
                  </label>

                  <label>
                    {t('shopRegister.billingPostalCode')}
                    <input
                      type="text"
                      value={billingPostalCode}
                      onChange={(e) => setBillingPostalCode(e.target.value)}
                      placeholder={t('shopRegister.billingPostalCodePlaceholder')}
                      inputMode="numeric"
                    />
                    {errors.billingPostalCode ? (
                      <small className="field-error">{errors.billingPostalCode}</small>
                    ) : null}
                  </label>
                </>
              ) : null}

              <label>
                {t('shopRegister.invoiceEmail')} <span className="optional-hint">({t('form.optional')})</span>
                <input
                  type="email"
                  value={invoiceEmail}
                  onChange={(e) => setInvoiceEmail(e.target.value)}
                  placeholder={t('shopRegister.invoiceEmailPlaceholder')}
                />
              </label>

              <label className="checkbox-label">
                <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} />
                {t('shopRegister.termsLabel')}
              </label>
              {errors.terms ? <small className="field-error">{errors.terms}</small> : null}

              {TURNSTILE_SITE_KEY ? (
                <div className="turnstile-wrap">
                  <Turnstile ref={turnstileRef} siteKey={TURNSTILE_SITE_KEY} onSuccess={setCaptchaToken} />
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Navigation */}
          <div className="shop-register-actions">
            {step > 1 ? (
              <button type="button" className="shop-register-back" onClick={handleBack}>
                {t('common.back')}
              </button>
            ) : null}
            <button className="shop-register-submit" type="submit" disabled={submitting}>
              {step === 3
                ? submitting
                  ? t('shopRegister.registering')
                  : t('shopRegister.register')
                : t('common.next')}
            </button>
          </div>
        </form>

        <p className="auth-switch">
          {t('auth.hasAccount')}{' '}
          <button type="button" className="btn-link" onClick={onSwitchToLogin}>
            {t('auth.loginLink')}
          </button>
        </p>
      </div>
    </section>
  )
}
