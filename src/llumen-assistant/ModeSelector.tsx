import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { llumenAssets } from './assets'
import styles from './compact-assistant.module.css'

export type AssistantMode = 'build' | 'analyze' | 'search'

const MODE_LABELS: Record<AssistantMode, string> = {
  build: 'Build',
  analyze: 'Analyze',
  search: 'Search',
}

const ORDER: AssistantMode[] = ['build', 'analyze', 'search']

export type ModeSelectorProps = {
  value: AssistantMode
  onChange: (mode: AssistantMode) => void
}

export function ModeSelector({ value, onChange }: ModeSelectorProps) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const onKeyMenu = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) return
      const i = ORDER.indexOf(value)
      if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        const next = ORDER[(i + 1) % ORDER.length]
        onChange(next)
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        const next = ORDER[(i - 1 + ORDER.length) % ORDER.length]
        onChange(next)
      }
    },
    [open, onChange, value],
  )

  return (
    <div
      className={styles.modeWrap}
      ref={wrapRef}
      onKeyDown={onKeyMenu}
    >
      <button
        type="button"
        className={`${styles.modeBtn} ${open ? styles.modeBtnOpen : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
      >
        <img className={styles.iconBtnImg} src={llumenAssets.stack} alt="" width={20} height={20} />
        <span className={styles.modeLabel}>{MODE_LABELS[value]}</span>
        <img className={styles.caret} src={llumenAssets.caretDown} alt="" width={16} height={16} />
      </button>
      {open && (
        <ul className={styles.modeMenu} id={listId} role="listbox" aria-label="Assistant mode">
          {ORDER.map((m) => (
            <li key={m} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={value === m}
                className={`${styles.modeMenuItem} ${value === m ? styles.modeMenuItemActive : ''}`}
                onClick={() => {
                  onChange(m)
                  setOpen(false)
                }}
              >
                {MODE_LABELS[m]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
