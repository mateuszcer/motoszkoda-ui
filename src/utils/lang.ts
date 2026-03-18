export const LANG_CYCLE = ['pl', 'en', 'de'] as const

export type LangCode = (typeof LANG_CYCLE)[number]

export function getNextLang(current: string): string {
  const base = current.slice(0, 2)
  const idx = LANG_CYCLE.indexOf(base as LangCode)
  return LANG_CYCLE[(idx + 1) % LANG_CYCLE.length]
}

export const LANG_META: Record<string, { label: string; flagCode: string }> = {
  pl: { label: 'Polski', flagCode: 'pl' },
  en: { label: 'English', flagCode: 'gb' },
  de: { label: 'Deutsch', flagCode: 'de' },
}

/** @deprecated use LANG_META instead */
export const LANG_LABEL: Record<string, string> = { pl: 'PL', en: 'EN', de: 'DE' }
