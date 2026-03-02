import type { TFunction } from 'i18next'
import { ApiError } from '../services/apiClient'

export function getSignupErrorMessage(error: unknown, t: TFunction): string | null {
  if (!(error instanceof ApiError)) return null

  switch (error.code) {
    case 'DISPOSABLE_EMAIL_NOT_ALLOWED':
      return t('auth.disposableEmailNotAllowed')
    case 'RATE_LIMITED':
      if (error.retryAfterSeconds) {
        return t('auth.rateLimitedWithRetry', { seconds: error.retryAfterSeconds })
      }
      return t('auth.rateLimited')
    case 'EMAIL_ALREADY_REGISTERED':
      return t('auth.emailAlreadyRegistered')
    default:
      return null
  }
}
