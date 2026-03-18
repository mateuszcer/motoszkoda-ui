import type { EmailPreferenceResponse } from '../domain/apiTypes'
import { api } from './apiClient'

type BackendLangCode = 'PL' | 'EN'

export async function updateLanguagePreference(language: BackendLangCode): Promise<void> {
  await api.put<void>('/api/user/settings/language', { body: { language } })
}

export function getEmailPreferences(): Promise<EmailPreferenceResponse> {
  return api.get<EmailPreferenceResponse>('/api/email/preferences')
}

export function updateEmailPreferences(enabled: boolean): Promise<EmailPreferenceResponse> {
  return api.put<EmailPreferenceResponse>('/api/email/preferences', {
    body: { emailNotificationsEnabled: enabled },
  })
}
