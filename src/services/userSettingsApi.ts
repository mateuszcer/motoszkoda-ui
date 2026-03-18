import { api } from './apiClient'

type BackendLangCode = 'PL' | 'EN'

export async function updateLanguagePreference(language: BackendLangCode): Promise<void> {
  await api.put<void>('/api/user/settings/language', { body: { language } })
}
