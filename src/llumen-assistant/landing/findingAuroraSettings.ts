/** Tuned ocean ramp for the finding aurora. */
export const OCEAN_AURORA_STOPS = ['#3c78ff', '#2a4098', '#6beeff'] as const

export type FindingAuroraSettings = {
  /** Left, middle, and right stops of the React Bits aurora ramp. */
  colorStop1: string
  colorStop2: string
  colorStop3: string
  amplitude: number
  blend: number
  speed: number
  /** Vertical curtain strength. */
  streaks: number
  /** Bright cores inside the curtains. */
  highlights: number
  showCopy: boolean
  copyDelayMs: number
  wordStaggerMs: number
  /** Backdrop blur radius, in pixels, through the solid region. */
  blurStrength: number
  /** How far the blur fades out above the domain label, in pixels. */
  blurFade: number
  /** Extra solid blur above the domain label before the fade begins. */
  blurLift: number
}

export const DEFAULT_FINDING_AURORA: FindingAuroraSettings = {
  colorStop1: OCEAN_AURORA_STOPS[0],
  colorStop2: OCEAN_AURORA_STOPS[1],
  colorStop3: OCEAN_AURORA_STOPS[2],
  amplitude: 1.44,
  blend: 0.5,
  speed: 0.32,
  streaks: 0.24,
  highlights: 0.04,
  showCopy: true,
  copyDelayMs: 280,
  wordStaggerMs: 42,
  blurStrength: 63,
  blurFade: 178,
  blurLift: 12,
}

export const FINDING_DISMISS_MS = 10_000
export const FINDING_EXIT_MS = 480
/** Shortcut mask length. Matches `auroraRevealStaged` (2.4s). */
export const STAGED_AURORA_REVEAL_MS = 2400
/**
 * Phase 1 is the small opening plus a 1s hold (58% keyframe).
 * Findings appear here, while the mask is still opening to full.
 */
export const STAGED_AURORA_PHASE1_MS = Math.round(STAGED_AURORA_REVEAL_MS * 0.58)
