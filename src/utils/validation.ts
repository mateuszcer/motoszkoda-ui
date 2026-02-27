import { MAX_CAR_YEAR, MIN_CAR_YEAR } from '../domain/constants'

const vinPattern = /^[A-HJ-NPR-Z0-9]{17}$/

export const normalizeVin = (value: string): string => {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export const isValidVin = (vin: string): boolean => {
  return vinPattern.test(vin)
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
