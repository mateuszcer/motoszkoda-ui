export interface CountryEntry {
  code: string
  dialCode: string
  label: string
}

export const COUNTRY_LIST: CountryEntry[] = [
  { code: 'PL', dialCode: '+48', label: '🇵🇱 Poland (+48)' },
  { code: 'DE', dialCode: '+49', label: '🇩🇪 Germany (+49)' },
  { code: 'CZ', dialCode: '+420', label: '🇨🇿 Czechia (+420)' },
  { code: 'SK', dialCode: '+421', label: '🇸🇰 Slovakia (+421)' },
  { code: 'UA', dialCode: '+380', label: '🇺🇦 Ukraine (+380)' },
  { code: 'LT', dialCode: '+370', label: '🇱🇹 Lithuania (+370)' },
  { code: 'AT', dialCode: '+43', label: '🇦🇹 Austria (+43)' },
  { code: 'BE', dialCode: '+32', label: '🇧🇪 Belgium (+32)' },
  { code: 'BG', dialCode: '+359', label: '🇧🇬 Bulgaria (+359)' },
  { code: 'HR', dialCode: '+385', label: '🇭🇷 Croatia (+385)' },
  { code: 'DK', dialCode: '+45', label: '🇩🇰 Denmark (+45)' },
  { code: 'EE', dialCode: '+372', label: '🇪🇪 Estonia (+372)' },
  { code: 'FI', dialCode: '+358', label: '🇫🇮 Finland (+358)' },
  { code: 'FR', dialCode: '+33', label: '🇫🇷 France (+33)' },
  { code: 'HU', dialCode: '+36', label: '🇭🇺 Hungary (+36)' },
  { code: 'IT', dialCode: '+39', label: '🇮🇹 Italy (+39)' },
  { code: 'LV', dialCode: '+371', label: '🇱🇻 Latvia (+371)' },
  { code: 'NL', dialCode: '+31', label: '🇳🇱 Netherlands (+31)' },
  { code: 'NO', dialCode: '+47', label: '🇳🇴 Norway (+47)' },
  { code: 'RO', dialCode: '+40', label: '🇷🇴 Romania (+40)' },
  { code: 'ES', dialCode: '+34', label: '🇪🇸 Spain (+34)' },
  { code: 'SE', dialCode: '+46', label: '🇸🇪 Sweden (+46)' },
  { code: 'CH', dialCode: '+41', label: '🇨🇭 Switzerland (+41)' },
  { code: 'GB', dialCode: '+44', label: '🇬🇧 United Kingdom (+44)' },
]

// Sorted longest-first so +420 matches before +4, etc.
const DIAL_CODES_DESC = COUNTRY_LIST.map((c) => c.dialCode).sort((a, b) => b.length - a.length)

const DEFAULT_COUNTRY = COUNTRY_LIST[0] // Poland

export function parseE164(value: string): { country: CountryEntry; localNumber: string } {
  if (!value) {
    return { country: DEFAULT_COUNTRY, localNumber: '' }
  }
  if (!value.startsWith('+')) {
    return { country: DEFAULT_COUNTRY, localNumber: value.replace(/\D/g, '') }
  }

  for (const dial of DIAL_CODES_DESC) {
    if (value.startsWith(dial)) {
      const country = COUNTRY_LIST.find((c) => c.dialCode === dial)!
      return { country, localNumber: value.slice(dial.length) }
    }
  }

  return { country: DEFAULT_COUNTRY, localNumber: value.replace(/\D/g, '') }
}
