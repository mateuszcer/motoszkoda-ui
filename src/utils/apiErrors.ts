import type { TFunction } from 'i18next'
import { ApiError } from '../services/apiClient'

const CODE_TO_KEY: Record<string, string> = {
  INVALID_CREDENTIALS: 'errors.invalidCredentials',
  ROLE_MISMATCH: 'errors.roleMismatch',
  CAPTCHA_FAILED: 'errors.captchaFailed',
  RATE_LIMITED: 'errors.rateLimited',
  DISPOSABLE_EMAIL_NOT_ALLOWED: 'errors.disposableEmailNotAllowed',
  EMAIL_ALREADY_REGISTERED: 'errors.emailAlreadyRegistered',
  INVALID_VOUCHER: 'errors.invalidVoucher',
  EXPIRED_VOUCHER: 'errors.expiredVoucher',
  VOUCHER_ALREADY_USED: 'errors.voucherAlreadyUsed',
  FORBIDDEN: 'errors.forbidden',
  NOT_FOUND: 'errors.notFound',
  CONFLICT: 'errors.conflict',
  BAD_REQUEST: 'errors.badRequest',
  SAME_PASSWORD: 'errors.samePassword',
  WEAK_PASSWORD: 'errors.weakPassword',
  INVALID_RECOVERY_TOKEN: 'errors.invalidRecoveryToken',
  SERVER_ERROR: 'errors.serverError',
  SERVICE_UNAVAILABLE: 'errors.serviceUnavailable',
}

export function getApiErrorMessage(error: unknown, t: TFunction, fallbackKey: string): string {
  if (!(error instanceof ApiError)) {
    return t(fallbackKey)
  }

  if (error.code === 'RATE_LIMITED' && error.retryAfterSeconds) {
    return t('errors.rateLimitedWithRetry', { seconds: error.retryAfterSeconds })
  }

  const key = CODE_TO_KEY[error.code]
  if (key) {
    return t(key)
  }

  return t(fallbackKey)
}
