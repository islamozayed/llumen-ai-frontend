import { forwardRef, type ReactNode } from 'react'
import { MeshGradient } from '@paper-design/shaders-react'
import styles from './compact-assistant.module.css'
import { MESH_COLORS_LUMEN_DARK, MESH_FRAME_PANEL } from './paperMeshConstants'

export type AssistantPanelProps = {
  expanded: boolean
  children: ReactNode
}

export const AssistantPanel = forwardRef<HTMLDivElement, AssistantPanelProps>(
  function AssistantPanel({ expanded, children }, ref) {
    return (
      <div
        ref={ref}
        className={`${styles.requestBox} ${expanded ? styles.panelExpanded : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Llumen assistant"
      >
        <div className={styles.panelBackdrop} aria-hidden>
          <MeshGradient
            speed={0.2}
            scale={1}
            distortion={0.09}
            swirl={0}
            frame={MESH_FRAME_PANEL}
            colors={[...MESH_COLORS_LUMEN_DARK]}
            className={styles.panelBackdropShader}
          />
        </div>
        <div className={styles.panelInner}>{children}</div>
      </div>
    )
  },
)

AssistantPanel.displayName = 'AssistantPanel'
