import { ArrowsOut } from '@phosphor-icons/react'
import type { CreatedComponent } from './assistantReplyTypes'
import { KpiWidget } from './KpiWidgets'
import styles from './InlineVisualCard.module.css'

export type InlineVisualCardProps = {
  component: CreatedComponent
  caption?: string
  active?: boolean
  onExpand?: () => void
}

function isMapThumbnail(component: CreatedComponent) {
  return component.preview?.kind === 'image' && component.preview.detailView === 'map'
}

export function InlineVisualCard({ component, caption, active = false, onExpand }: InlineVisualCardProps) {
  const isSquare = component.inlineSize === 'square'
  const isMap = isMapThumbnail(component)
  const preview = component.preview
  const showCaption = caption ?? component.caption

  return (
    <div className={styles.wrap}>
      <div
        className={[
          styles.card,
          isMap ? styles.cardMap : isSquare ? styles.cardSquare : styles.cardFull,
          !isMap && active ? styles.cardActive : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className={styles.cardTop}>
          {isMap && preview?.kind === 'image' ? (
            <button
              type="button"
              className={styles.mapThumbBtn}
              onClick={onExpand}
              aria-label={`Open ${component.title} map`}
            >
              <div className={styles.mapThumbImage}>
                <img src={preview.src} alt={preview.alt ?? component.title} />
              </div>
              <p className={styles.mapThumbTitle}>{component.title}</p>
            </button>
          ) : preview?.kind === 'widget' ? (
            <KpiWidget component={component} compact={isSquare} />
          ) : preview?.kind === 'image' ? (
            <div className={styles.imageStage}>
              <img
                className={preview.fit === 'cover' ? styles.imageCover : styles.imageContain}
                src={preview.src}
                alt={preview.alt ?? component.title}
              />
              <p className={styles.imageTitle}>{component.title}</p>
            </div>
          ) : (
            <div className={styles.fallback}>
              <p className={styles.imageTitle}>{component.title}</p>
            </div>
          )}
          {onExpand && !isMap ? (
            <button
              type="button"
              className={styles.expandBtn}
              onClick={onExpand}
              aria-label={`Expand ${component.title}`}
            >
              <ArrowsOut size={16} weight="regular" aria-hidden />
            </button>
          ) : null}
        </div>
      </div>
      {showCaption ? <p className={styles.caption}>{showCaption}</p> : null}
    </div>
  )
}
