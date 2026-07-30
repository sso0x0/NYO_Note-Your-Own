import { useEffect, useRef, useState } from 'react'
import './BoardSearchBar.css'

const OPTIONS = [
  { value: 'all', label: '통합검색' },
  { value: 'title', label: '제목' },
  { value: 'content', label: '내용' },
  { value: 'author', label: '작성자' },
]

function BoardSearchBar({ value, onChange, searchType, onSearchTypeChange, onSubmit, onClear, placeholder }) {
  const [open, setOpen] = useState(false)
  const typeRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const close = (event) => {
      if (event.type === 'keydown' && event.key !== 'Escape') return
      if (event.type === 'mousedown' && typeRef.current?.contains(event.target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', close)
    window.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      window.removeEventListener('keydown', close)
    }
  }, [open])

  return (
    <form className="board-search" onSubmit={onSubmit}>
      <div className="board-search__type" ref={typeRef}>
        <button type="button" className="board-search__type-btn" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          <span>{OPTIONS.find((option) => option.value === searchType)?.label}</span>
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">
            <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {open && (
          <ul className="board-search__menu">
            {OPTIONS.map((option) => (
              <li key={option.value}>
                <button type="button" className={searchType === option.value ? 'is-selected' : ''} onClick={() => { onSearchTypeChange(option.value); setOpen(false) }}>
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="board-search__box">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="7" stroke="#999" strokeWidth="2" />
          <line x1="16.4" y1="16.4" x2="21" y2="21" stroke="#999" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
        {value && <button type="button" className="board-search__clear" onClick={onClear}>×</button>}
      </div>
      <button type="submit" className="board-search__submit">검색</button>
    </form>
  )
}

export default BoardSearchBar
