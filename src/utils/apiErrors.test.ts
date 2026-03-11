import type { TFunction } from 'i18next'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../services/apiClient'
import { getApiErrorMessage } from './apiErrors'

const t = vi.fn((key: string, opts?: Record<string, unknown>) => {
  if (opts) return `${key}:${JSON.stringify(opts)}`
  return key
}) as unknown as TFunction

describe('getApiErrorMessage', () => {
  it('returns fallback for non-ApiError instances', () => {
    expect(getApiErrorMessage(new Error('boom'), t, 'fallback.key')).toBe('fallback.key')
    expect(getApiErrorMessage('string error', t, 'fallback.key')).toBe('fallback.key')
    expect(getApiErrorMessage(null, t, 'fallback.key')).toBe('fallback.key')
  })

  it('maps known error codes to i18n keys', () => {
    const cases: [string, string][] = [
      ['INVALID_CREDENTIALS', 'errors.invalidCredentials'],
      ['ROLE_MISMATCH', 'errors.roleMismatch'],
      ['CAPTCHA_FAILED', 'errors.captchaFailed'],
      ['DISPOSABLE_EMAIL_NOT_ALLOWED', 'errors.disposableEmailNotAllowed'],
      ['EMAIL_ALREADY_REGISTERED', 'errors.emailAlreadyRegistered'],
      ['INVALID_VOUCHER', 'errors.invalidVoucher'],
      ['EXPIRED_VOUCHER', 'errors.expiredVoucher'],
      ['VOUCHER_ALREADY_USED', 'errors.voucherAlreadyUsed'],
      ['FORBIDDEN', 'errors.forbidden'],
      ['NOT_FOUND', 'errors.notFound'],
      ['CONFLICT', 'errors.conflict'],
      ['BAD_REQUEST', 'errors.badRequest'],
      ['SAME_PASSWORD', 'errors.samePassword'],
      ['WEAK_PASSWORD', 'errors.weakPassword'],
      ['INVALID_RECOVERY_TOKEN', 'errors.invalidRecoveryToken'],
      ['SERVER_ERROR', 'errors.serverError'],
      ['SERVICE_UNAVAILABLE', 'errors.serviceUnavailable'],
    ]

    for (const [code, expectedKey] of cases) {
      const err = new ApiError(400, code)
      expect(getApiErrorMessage(err, t, 'fallback')).toBe(expectedKey)
    }
  })

  it('returns RATE_LIMITED message without retry seconds', () => {
    const err = new ApiError(429, 'RATE_LIMITED')
    expect(getApiErrorMessage(err, t, 'fallback')).toBe('errors.rateLimited')
  })

  it('returns RATE_LIMITED message with retry seconds', () => {
    const err = new ApiError(429, 'RATE_LIMITED', undefined, undefined, 30)
    const result = getApiErrorMessage(err, t, 'fallback')
    expect(result).toContain('errors.rateLimitedWithRetry')
    expect(result).toContain('"seconds":30')
  })

  it('returns fallback for unknown ApiError codes', () => {
    const err = new ApiError(418, 'TEAPOT')
    expect(getApiErrorMessage(err, t, 'my.fallback')).toBe('my.fallback')
  })
})
