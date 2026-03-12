import { memo, useEffect, useRef, useState } from 'react'
import { CAR_BRANDS } from '../domain/constants'

interface CarBrandComboboxProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export const CarBrandCombobox = memo(function CarBrandCombobox({
  value,
  onChange,
  placeholder = 'Audi',
}: CarBrandComboboxProps) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const query = value.toLowerCase()
  const filtered = query ? CAR_BRANDS.filter((b) => b.toLowerCase().includes(query)) : [...CAR_BRANDS]

  const showList = open && filtered.length > 0 && value !== filtered[0]

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return
    const item = listRef.current.children[activeIndex] as HTMLElement | undefined
    item?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  function select(brand: string) {
    onChange(brand)
    setOpen(false)
    setActiveIndex(-1)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showList) {
      if (e.key === 'ArrowDown') {
        setOpen(true)
        e.preventDefault()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex((i) => (i < filtered.length - 1 ? i + 1 : 0))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex((i) => (i > 0 ? i - 1 : filtered.length - 1))
        break
      case 'Enter':
        e.preventDefault()
        if (activeIndex >= 0 && activeIndex < filtered.length) {
          select(filtered[activeIndex])
        }
        break
      case 'Escape':
        setOpen(false)
        setActiveIndex(-1)
        break
      case 'Tab':
        setOpen(false)
        setActiveIndex(-1)
        break
    }
  }

  // Highlight the matching substring
  function highlight(brand: string) {
    if (!query) return brand
    const idx = brand.toLowerCase().indexOf(query)
    if (idx < 0) return brand
    return (
      <>
        {brand.slice(0, idx)}
        <strong>{brand.slice(idx, idx + query.length)}</strong>
        {brand.slice(idx + query.length)}
      </>
    )
  }

  return (
    <div className="combobox" ref={containerRef}>
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
          setActiveIndex(-1)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        role="combobox"
        aria-expanded={showList}
        aria-autocomplete="list"
        autoComplete="off"
      />
      {showList && (
        <ul className="combobox-list" ref={listRef} role="listbox">
          {filtered.map((brand, i) => (
            <li
              key={brand}
              role="option"
              aria-selected={i === activeIndex}
              className={i === activeIndex ? 'combobox-item active' : 'combobox-item'}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseDown={(e) => {
                e.preventDefault() // keep focus on input
                select(brand)
              }}
            >
              {highlight(brand)}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
})
