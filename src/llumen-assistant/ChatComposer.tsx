import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { llumenAssets } from './assets'
import styles from './compact-assistant.module.css'
import type { SendVisualState } from './SendButton'
import { SendButton } from './SendButton'
import type { AssistantMode } from './ModeSelector'
import { ModeSelector } from './ModeSelector'
import { useRevealScrollbarOnScroll } from './useRevealScrollbarOnScroll'

/** Fits Figma ChatBox max-h 180px with 20px pad ×2, 16px gap, Params + chip row */
const MAX_COMPOSER_PX = 60

export type ChatComposerProps = {
  value: string
  onChange: (v: string) => void
  onSend: () => void
  onStop: () => void
  sendState: SendVisualState
  mode: AssistantMode
  onModeChange: (m: AssistantMode) => void
  showParameters?: boolean
  onAttachClick?: () => void
  disabled?: boolean
  /** After the first message in the thread, placeholder switches to reply-focused copy. */
  hasThreadMessages?: boolean
}

export function ChatComposer({
  value,
  onChange,
  onSend,
  onStop,
  sendState,
  mode,
  onModeChange,
  showParameters = true,
  onAttachClick,
  disabled = false,
  hasThreadMessages = false,
}: ChatComposerProps) {
  const taRef = useRef<HTMLTextAreaElement>(null)
  const [contextRowOpen, setContextRowOpen] = useState(false)
  const chatScrollRef = useRevealScrollbarOnScroll()

  useEffect(() => {
    const el = taRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, MAX_COMPOSER_PX)}px`
  }, [value])

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (sendState === 'stop') return
      if (sendState === 'active') onSend()
    }
  }

  return (
    <div ref={chatScrollRef} className={styles.chatBox}>
      <div className={styles.textAreaWrap}>
        <textarea
          ref={taRef}
          className={styles.textArea}
          placeholder={hasThreadMessages ? 'Reply...' : 'Ask about anything'}
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={disabled || sendState === 'stop'}
          aria-label={hasThreadMessages ? 'Reply' : 'Message'}
        />
      </div>
      <div className={styles.paramsCol}>
        <div className={styles.rowPrimary}>
          <div className={styles.rowPrimaryLeft}>
            <button
              type="button"
              className={`${styles.contextBtn}${contextRowOpen && showParameters ? ` ${styles.contextBtnActive}` : ''}`}
              aria-label="Add context or attachment"
              aria-expanded={showParameters ? contextRowOpen : undefined}
              aria-controls={showParameters && contextRowOpen ? 'chat-composer-context-row' : undefined}
              onClick={() => {
                if (showParameters) setContextRowOpen((open) => !open)
                onAttachClick?.()
              }}
            >
              <img className={styles.iconBtnImg} src={llumenAssets.plus} alt="" width={20} height={20} />
            </button>
            <ModeSelector value={mode} onChange={onModeChange} />
          </div>
          <button type="button" className={styles.iconBtn} aria-label="Voice input">
            <img className={styles.iconBtnImg} src={llumenAssets.microphone} alt="" width={20} height={20} />
          </button>
          <SendButton
            state={sendState}
            onClick={() => {
              if (sendState === 'stop') onStop()
              else onSend()
            }}
          />
        </div>
        {showParameters && contextRowOpen && (
          <div id="chat-composer-context-row" className={styles.rowSecondary}>
            <div className={styles.chip}>
              <img className={styles.chipIcon} src={llumenAssets.paramImage} alt="" width={12} height={12} />
              <span className={styles.chipLabel}>photo.jpeg</span>
            </div>
            <div className={styles.chip}>
              <img className={styles.chipIcon} src={llumenAssets.paramFile} alt="" width={12} height={12} />
              <span className={styles.chipLabel}>file.ext</span>
            </div>
            <div className={styles.chip}>
              <img className={styles.chipIcon} src={llumenAssets.paramAt} alt="" width={12} height={12} />
              <span className={styles.chipLabel}>Topic</span>
            </div>
            <div className={styles.chip}>
              <img className={styles.chipIcon} src={llumenAssets.paramCalendar} alt="" width={12} height={12} />
              <span className={styles.chipLabel}>Date</span>
            </div>
            <div className={styles.chip}>
              <img className={styles.chipIcon} src={llumenAssets.paramChart} alt="" width={12} height={12} />
              <span className={styles.chipLabel}>Data</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
