import { ArrowRight } from '@phosphor-icons/react'
import styles from './compact-assistant.module.css'

/** Maps to Figma Lumen-UI Send (node 678:7024): Inactive | Active | Stop */
export type SendVisualState = 'inactive' | 'active' | 'stop'

export type SendButtonProps = {
  state: SendVisualState
  onClick: () => void
}

export function SendButton({ state, onClick }: SendButtonProps) {
  const isStop = state === 'stop'
  const isActive = state === 'active'

  return (
    <div className={styles.sendRotate}>
      <button
        type="button"
        className={`${styles.sendBtn} ${isStop ? styles.sendStop : isActive ? styles.sendActive : styles.sendInactive}`}
        onClick={onClick}
        disabled={state === 'inactive'}
        aria-label={isStop ? 'Stop generating' : 'Send message'}
      >
        {isStop ? (
          <span className={styles.sendStopInner} />
        ) : isActive ? (
          <ArrowRight className={styles.sendArrow} size={20} weight="bold" aria-hidden />
        ) : (
          <ArrowRight className={styles.sendArrow} size={20} weight="regular" aria-hidden />
        )}
      </button>
    </div>
  )
}
