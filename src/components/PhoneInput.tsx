import { memo } from 'react'
import { COUNTRY_LIST, parseE164 } from '../utils/phoneCountries'

interface PhoneInputProps {
  value: string
  onChange: (e164: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export const PhoneInput = memo(function PhoneInput({
  value,
  onChange,
  placeholder,
  disabled,
  className,
}: PhoneInputProps) {
  const { country, localNumber } = parseE164(value)

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDial = e.target.value
    onChange(localNumber ? newDial + localNumber : '')
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '')
    onChange(digits ? country.dialCode + digits : '')
  }

  return (
    <div className={`phone-input-group${className ? ` ${className}` : ''}`}>
      <select
        className="phone-input-country"
        value={country.dialCode}
        onChange={handleCountryChange}
        disabled={disabled}
      >
        {COUNTRY_LIST.map((c) => (
          <option key={c.code} value={c.dialCode}>
            {c.label}
          </option>
        ))}
      </select>
      <input
        className="phone-input-number"
        type="tel"
        value={localNumber}
        onChange={handleNumberChange}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  )
})
