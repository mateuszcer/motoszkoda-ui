import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LANG_CYCLE, LANG_META } from '@/utils/lang'

interface LanguagePickerProps {
  variant?: 'header' | 'landing'
  onLanguageChange?: (code: string) => void
}

export function LanguagePicker({ variant = 'header', onLanguageChange }: LanguagePickerProps) {
  const { i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const current = i18n.language.slice(0, 2)
  const meta = LANG_META[current] ?? LANG_META.pl

  const toggle = useCallback(() => setOpen((o) => !o), [])

  const select = useCallback(
    (code: string) => {
      void i18n.changeLanguage(code)
      onLanguageChange?.(code)
      setOpen(false)
    },
    [i18n, onLanguageChange],
  )

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  const triggerCls =
    variant === 'landing' ? 'lang-picker__trigger lang-picker__trigger--landing' : 'btn btn-ghost lang-picker__trigger'

  return (
    <div className="lang-picker" ref={ref}>
      <button className={triggerCls} onClick={toggle} aria-expanded={open} aria-haspopup="listbox">
        <span className={`fi fi-${meta.flagCode} lang-picker__flag`} aria-hidden="true" />
      </button>
      {open ? (
        <ul className="lang-picker__menu" role="listbox" aria-label="Language">
          {LANG_CYCLE.map((code) => {
            const m = LANG_META[code]
            const active = code === current
            return (
              <li key={code} role="option" aria-selected={active}>
                <button
                  className={`lang-picker__option${active ? ' lang-picker__option--active' : ''}`}
                  onClick={() => select(code)}
                >
                  <span className={`fi fi-${m.flagCode} lang-picker__flag`} aria-hidden="true" />
                  <span className="lang-picker__option-label">{m.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
