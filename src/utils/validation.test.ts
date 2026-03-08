import { describe, expect, it } from 'vitest'
import {
  isValidVin,
  normalizeVin,
  isValidNip,
  isValidE164Phone,
  isValidPolishPostalCode,
  validateYear,
} from './validation'

describe('normalizeVin', () => {
  it('uppercases and strips non-alphanumeric', () => {
    expect(normalizeVin('wba-3k5c5-5fk3-95803')).toBe('WBA3K5C55FK395803')
  })

  it('returns empty string for empty input', () => {
    expect(normalizeVin('')).toBe('')
  })
})

describe('isValidVin', () => {
  it('accepts valid 17-char VIN', () => {
    expect(isValidVin('WBA3K5C55FK395803')).toBe(true)
  })

  it('rejects VIN with excluded letters (I, O, Q)', () => {
    expect(isValidVin('WBA3K5C55FK39580I')).toBe(false)
    expect(isValidVin('WBA3K5C55FK39580O')).toBe(false)
    expect(isValidVin('WBA3K5C55FK39580Q')).toBe(false)
  })

  it('rejects too short VIN', () => {
    expect(isValidVin('WBA3K5C55FK3958')).toBe(false)
  })

  it('rejects too long VIN', () => {
    expect(isValidVin('WBA3K5C55FK3958031')).toBe(false)
  })

  it('rejects VIN with special characters', () => {
    expect(isValidVin('WBA3K5C55FK3958@3')).toBe(false)
  })
})

describe('isValidNip', () => {
  it('accepts valid NIP', () => {
    expect(isValidNip('1234563218')).toBe(true)
  })

  it('accepts NIP with dashes', () => {
    expect(isValidNip('123-456-32-18')).toBe(true)
  })

  it('accepts NIP with spaces', () => {
    expect(isValidNip('123 456 32 18')).toBe(true)
  })

  it('rejects invalid checksum', () => {
    expect(isValidNip('1234563219')).toBe(false)
  })

  it('rejects too short', () => {
    expect(isValidNip('12345632')).toBe(false)
  })

  it('rejects non-numeric', () => {
    expect(isValidNip('123456321a')).toBe(false)
  })
})

describe('isValidE164Phone', () => {
  it('accepts valid Polish number', () => {
    expect(isValidE164Phone('+48123456789')).toBe(true)
  })

  it('accepts valid US number', () => {
    expect(isValidE164Phone('+12025551234')).toBe(true)
  })

  it('rejects without plus prefix', () => {
    expect(isValidE164Phone('48123456789')).toBe(false)
  })

  it('rejects too short', () => {
    expect(isValidE164Phone('+1234')).toBe(false)
  })

  it('rejects leading zero after +', () => {
    expect(isValidE164Phone('+0123456789')).toBe(false)
  })
})

describe('isValidPolishPostalCode', () => {
  it('accepts valid format XX-XXX', () => {
    expect(isValidPolishPostalCode('00-001')).toBe(true)
    expect(isValidPolishPostalCode('99-999')).toBe(true)
  })

  it('rejects without dash', () => {
    expect(isValidPolishPostalCode('00001')).toBe(false)
  })

  it('rejects wrong format', () => {
    expect(isValidPolishPostalCode('000-01')).toBe(false)
  })
})

describe('validateYear', () => {
  it('returns null for valid year', () => {
    expect(validateYear(2020)).toBeNull()
  })

  it('rejects year below minimum', () => {
    expect(validateYear(1900)).toBe('validation.yearOutOfRange')
  })

  it('rejects non-integer', () => {
    expect(validateYear(2020.5)).toBe('validation.yearNotInteger')
  })

  it('accepts boundary years', () => {
    expect(validateYear(1980)).toBeNull()
    expect(validateYear(new Date().getFullYear() + 1)).toBeNull()
  })
})
