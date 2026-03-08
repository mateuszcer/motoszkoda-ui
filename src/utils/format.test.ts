import { describe, expect, it } from 'vitest'
import { formatDateTime, formatCurrencyPln, formatQuoteRange, formatMinorCurrency, formatLineItemRange } from './format'
import type { QuoteOffer, LineItem } from '../domain/types'

describe('formatDateTime', () => {
  it('formats ISO date in Polish locale', () => {
    const result = formatDateTime('2024-03-15T14:30:00Z', 'pl')
    expect(result).toContain('2024')
    expect(result).toContain('15')
  })

  it('formats ISO date in English locale', () => {
    const result = formatDateTime('2024-03-15T14:30:00Z', 'en')
    expect(result).toContain('2024')
    expect(result).toContain('15')
  })
})

describe('formatCurrencyPln', () => {
  it('formats PLN in Polish locale', () => {
    const result = formatCurrencyPln(1500, 'pl')
    // Should contain the number and PLN symbol/text
    expect(result).toMatch(/1[\s\u00a0]?500/)
  })

  it('formats PLN in English locale', () => {
    const result = formatCurrencyPln(1500, 'en')
    expect(result).toMatch(/1,?500/)
  })

  it('formats zero', () => {
    const result = formatCurrencyPln(0, 'pl')
    expect(result).toContain('0')
  })
})

describe('formatQuoteRange', () => {
  it('formats single price when no max', () => {
    const quote: QuoteOffer = { minPricePln: 500 }
    const result = formatQuoteRange(quote, 'pl')
    expect(result).toContain('500')
    expect(result).not.toContain('–')
  })

  it('formats single price when max equals min', () => {
    const quote: QuoteOffer = { minPricePln: 500, maxPricePln: 500 }
    const result = formatQuoteRange(quote, 'pl')
    expect(result).not.toContain('–')
  })

  it('formats range when max differs', () => {
    const quote: QuoteOffer = { minPricePln: 500, maxPricePln: 800 }
    const result = formatQuoteRange(quote, 'pl')
    expect(result).toContain('–')
    expect(result).toContain('500')
    expect(result).toContain('800')
  })
})

describe('formatMinorCurrency', () => {
  it('converts minor units to major units', () => {
    const result = formatMinorCurrency(15000, 'PLN', 'pl')
    expect(result).toContain('150')
  })

  it('handles zero', () => {
    const result = formatMinorCurrency(0, 'PLN', 'pl')
    expect(result).toContain('0')
  })
})

describe('formatLineItemRange', () => {
  it('formats single price line item', () => {
    const item: LineItem = {
      position: 1,
      description: 'Brake pads',
      totalPriceMinPln: 200,
      totalPriceMaxPln: 200,
    }
    const result = formatLineItemRange(item, 'pl')
    expect(result).toContain('200')
    expect(result).not.toContain('–')
  })

  it('formats range line item', () => {
    const item: LineItem = {
      position: 1,
      description: 'Brake pads',
      totalPriceMinPln: 200,
      totalPriceMaxPln: 350,
    }
    const result = formatLineItemRange(item, 'pl')
    expect(result).toContain('200')
    expect(result).toContain('350')
    expect(result).toContain('–')
  })

  it('falls back to work + parts when no total', () => {
    const item: LineItem = {
      position: 1,
      description: 'Brake pads',
      workPriceMinPln: 100,
      workPriceMaxPln: 150,
      partsPriceMinPln: 80,
      partsPriceMaxPln: 120,
    }
    const result = formatLineItemRange(item, 'pl')
    // min = 100 + 80 = 180, max = 150 + 120 = 270
    expect(result).toContain('180')
    expect(result).toContain('270')
  })
})
