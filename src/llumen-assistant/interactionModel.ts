/** Parallel chat entry models — switch from the header to compare. */

export type ChatInteractionModel = 'classic' | 'hub'

export type ChatInteractionModelOption = {
  id: ChatInteractionModel
  label: string
  description: string
}

export const CHAT_INTERACTION_MODELS: ChatInteractionModelOption[] = [
  {
    id: 'classic',
    label: 'Current',
    description: 'FAB + center chatbox',
  },
  {
    id: 'hub',
    label: 'Hub',
    description: 'Orb in chatbox',
  },
]

const STORAGE_KEY = 'llumen.chatInteractionModel'

export function readChatInteractionModel(previewLocked = false): ChatInteractionModel {
  if (typeof window === 'undefined') return 'classic'
  const params = new URLSearchParams(window.location.search)
  const fromUrl = params.get('ux')
  if (fromUrl === 'hub' || fromUrl === 'classic') return fromUrl
  if (previewLocked) return 'classic'
  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY)
    if (stored === 'hub' || stored === 'classic') return stored
  } catch {
    /* private mode */
  }
  return 'classic'
}

export function persistChatInteractionModel(model: ChatInteractionModel) {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(STORAGE_KEY, model)
  } catch {
    /* private mode */
  }
  const url = new URL(window.location.href)
  if (model === 'classic') url.searchParams.delete('ux')
  else url.searchParams.set('ux', model)
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
}
