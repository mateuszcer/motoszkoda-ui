import type { TFunction } from 'i18next'

export function isUnlimited(limit: number): boolean {
  return limit === -1
}

export function formatLimit(limit: number, t: TFunction): string {
  return isUnlimited(limit) ? t('plan.unlimited') : String(limit)
}
