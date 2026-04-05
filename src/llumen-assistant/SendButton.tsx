import { llumenAssets } from './assets'
import styles from './compact-assistant.module.css'

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
          <img
            className={`${styles.sendIcon} ${styles.sendIconActive}`}
            src={llumenAssets.arrowRightActive}
            alt=""
            width={20}
            height={20}
          />
        ) : (
          <img
            className={styles.sendIcon}
            src={llumenAssets.arrowRight}
            alt=""
            width={20}
            height={20}
          />
        )}
      </button>
    </div>
  )
}
