import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getEmailPreferences, updateEmailPreferences } from '../services/userSettingsApi'

interface SettingsViewProps {
  onBack: () => void
}

export function SettingsView({ onBack }: SettingsViewProps) {
  const { t } = useTranslation()
  const [emailEnabled, setEmailEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<'saved' | 'error' | null>(null)
  const feedbackTimer = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    void getEmailPreferences()
      .then((res) => setEmailEnabled(res.emailNotificationsEnabled))
      .catch(() => {
        // Default to disabled on error
      })
      .finally(() => setLoading(false))
  }, [])

  const handleToggle = useCallback(() => {
    const newValue = !emailEnabled
    setEmailEnabled(newValue)
    setSaving(true)
    setFeedback(null)

    if (feedbackTimer.current) clearTimeout(feedbackTimer.current)

    void updateEmailPreferences(newValue)
      .then(() => {
        setFeedback('saved')
      })
      .catch(() => {
        setEmailEnabled(!newValue)
        setFeedback('error')
      })
      .finally(() => {
        setSaving(false)
        feedbackTimer.current = setTimeout(() => setFeedback(null), 2000)
      })
  }, [emailEnabled])

  useEffect(() => {
    return () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current)
    }
  }, [])

  return (
    <section className="settings-screen">
      <button className="btn btn-ghost" onClick={onBack}>
        {t('common.back')}
      </button>

      <h1 className="settings-title">{t('settings.title')}</h1>
      <p className="settings-subtitle">{t('settings.subtitle')}</p>

      <div className="settings-card">
        <div className="settings-row">
          <div className="settings-row-text">
            <span className="settings-row-label">{t('settings.emailNotifications')}</span>
            <span className="settings-row-description">{t('settings.emailNotificationsDescription')}</span>
          </div>
          {loading ? null : (
            <label className="checkbox-label">
              <input type="checkbox" checked={emailEnabled} onChange={handleToggle} disabled={saving} />
            </label>
          )}
        </div>

        {saving ? <p className="settings-feedback settings-feedback-info">{t('settings.saving')}</p> : null}
        {feedback === 'saved' ? (
          <p className="settings-feedback settings-feedback-success">{t('settings.saved')}</p>
        ) : null}
        {feedback === 'error' ? (
          <p className="settings-feedback settings-feedback-error">{t('settings.saveFailed')}</p>
        ) : null}
      </div>
    </section>
  )
}
