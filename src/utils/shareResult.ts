import { Capacitor } from '@capacitor/core'
import { Share } from '@capacitor/share'

export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'failed'

type ShareAdapters = {
  isNative: () => boolean
  nativeShare: (text: string, dialogTitle: string) => Promise<void>
  webShare: (text: string) => Promise<boolean>
  copy: (text: string) => Promise<void>
}

const nativeOptions = (text: string, dialogTitle: string) => ({
  title: 'SIGNAL // BREACH',
  text,
  dialogTitle,
})

const defaultAdapters: ShareAdapters = {
  isNative: () => Capacitor.isNativePlatform(),
  nativeShare: async (text, dialogTitle) => {
    // WebView's navigator.share is not consistently available on Android.
    // Capacitor Share opens the actual Android ACTION_SEND chooser.
    await Share.share(nativeOptions(text, dialogTitle))
  },
  webShare: async (text) => {
    if (typeof navigator === 'undefined' || !navigator.share) return false
    await navigator.share({ title: 'SIGNAL // BREACH', text })
    return true
  },
  copy: async (text) => {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      throw new Error('Clipboard API unavailable')
    }
    await navigator.clipboard.writeText(text)
  },
}

function wasCancelled(error: unknown): boolean {
  if (typeof error !== 'object' || !error) return false
  const value = error as { name?: unknown; message?: unknown }
  if (value.name === 'AbortError' || value.name === 'ShareCanceled') return true
  return typeof value.message === 'string' && /cancel(l)?ed|user cancelled|share canceled/i.test(value.message)
}

export function formatResultShareText(missionLabel: string, rank: string, score: number, time: string) {
  return `SIGNAL//BREACH — ${missionLabel} — ${rank} / ${score} / ${time}`
}

/** Called directly from the user's click (never after a timer or delayed effect). */
export async function shareResultText(
  text: string,
  dialogTitle: string,
  adapters: ShareAdapters = defaultAdapters,
): Promise<ShareOutcome> {
  try {
    if (adapters.isNative()) {
      await adapters.nativeShare(text, dialogTitle)
      return 'shared'
    }
    if (await adapters.webShare(text)) return 'shared'
  } catch (error) {
    if (wasCancelled(error)) return 'cancelled'
    // Fall back to copying the message, and tell the player what happened.
  }
  try {
    await adapters.copy(text)
    return 'copied'
  } catch {
    return 'failed'
  }
}
