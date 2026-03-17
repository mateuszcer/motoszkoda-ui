import { MAX_CAR_YEAR, MIN_CAR_YEAR } from '../domain/constants'

const vinPattern = /^[A-HJ-NPR-Z0-9]{17}$/

export const normalizeVin = (value: string): string => {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export const isValidVin = (vin: string): boolean => {
  return vinPattern.test(vin)
}

const NIP_WEIGHTS = [6, 5, 7, 2, 3, 4, 5, 6, 7]

export const isValidNip = (nip: string): boolean => {
  const digits = nip.replace(/[\s-]/g, '')
  if (!/^\d{10}$/.test(digits)) return false
  const sum = NIP_WEIGHTS.reduce((acc, w, i) => acc + w * Number(digits[i]), 0)
  return sum % 11 === Number(digits[9])
}

export const isValidE164Phone = (phone: string): boolean => {
  return /^\+[1-9]\d{6,14}$/.test(phone)
}

export const isValidPolishPostalCode = (code: string): boolean => {
  return /^\d{2}-\d{3}$/.test(code)
}

export function isWeakPassword(password: string): boolean {
  if (password.length < 8) return true
  if (!/[a-z]/.test(password)) return true
  if (!/[A-Z]/.test(password)) return true
  if (!/\d/.test(password)) return true
  return false
}

const ALLOWED_REDIRECT_HOSTS = ['checkout.stripe.com', 'billing.stripe.com']

export function assertSafeRedirectUrl(url: string): void {
  const parsed = new URL(url)
  if (!ALLOWED_REDIRECT_HOSTS.includes(parsed.hostname)) {
    throw new Error(`Redirect blocked: untrusted host "${parsed.hostname}"`)
  }
}

export const validateYear = (yearValue: number): string | null => {
  if (!Number.isInteger(yearValue)) {
    return 'validation.yearNotInteger'
  }

  if (yearValue < MIN_CAR_YEAR || yearValue > MAX_CAR_YEAR) {
    return 'validation.yearOutOfRange'
  }

  return null
}
