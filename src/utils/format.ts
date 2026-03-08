import type { LineItem, QuoteOffer } from '../domain/types'

const localeMap: Record<string, string> = {
  pl: 'pl-PL',
  en: 'en-GB',
}

const dateFormatters = new Map<string, Intl.DateTimeFormat>()
const currencyFormatters = new Map<string, Intl.NumberFormat>()

const getDateFormatter = (locale: string): Intl.DateTimeFormat => {
  const resolved = localeMap[locale] ?? locale
  let formatter = dateFormatters.get(resolved)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(resolved, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    dateFormatters.set(resolved, formatter)
  }
  return formatter
}

const getCurrencyFormatter = (locale: string): Intl.NumberFormat => {
  const resolved = localeMap[locale] ?? locale
  let formatter = currencyFormatters.get(resolved)
  if (!formatter) {
    formatter = new Intl.NumberFormat(resolved, {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
    currencyFormatters.set(resolved, formatter)
  }
  return formatter
}

export const formatDateTime = (iso: string, locale: string): string => {
  return getDateFormatter(locale).format(new Date(iso))
}

export const formatCurrencyPln = (value: number, locale: string): string => {
  return getCurrencyFormatter(locale).format(value)
}

export const formatQuoteRange = (quote: QuoteOffer, locale: string): string => {
  const min = formatCurrencyPln(quote.minPricePln, locale)
  if (!quote.maxPricePln || quote.maxPricePln === quote.minPricePln) {
    return min
  }

  return `${min} – ${formatCurrencyPln(quote.maxPricePln, locale)}`
}

export const formatMinorCurrency = (minorUnits: number, currency: string, locale: string): string => {
  const resolved = localeMap[locale] ?? locale
  return new Intl.NumberFormat(resolved, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(minorUnits / 100)
}

export const formatLineItemRange = (item: LineItem, locale: string): string => {
  const min = item.totalPriceMinPln ?? (item.workPriceMinPln ?? 0) + (item.partsPriceMinPln ?? 0)
  const max = item.totalPriceMaxPln ?? (item.workPriceMaxPln ?? 0) + (item.partsPriceMaxPln ?? 0)
  const minStr = formatCurrencyPln(min, locale)
  if (max === min || max === 0) return minStr
  return `${minStr} – ${formatCurrencyPln(max, locale)}`
}
