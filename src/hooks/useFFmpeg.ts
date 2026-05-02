import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'
import { useCallback, useEffect, useState } from 'react'

export type FFmpegStatus = 'idle' | 'loading' | 'ready' | 'error'
export type FFmpegPhase = 'downloading' | 'compiling'

// Module-level singleton — shared across all converter components
let sharedFFmpeg: FFmpeg | null = null
let sharedLoadPromise: Promise<void> | null = null
let sharedStatus: FFmpegStatus = 'idle'
let sharedPhase: FFmpegPhase = 'downloading'
let sharedProgress = 0                          // 0–100 during download phase
const subscribers = new Set<() => void>()

function notify() {
  subscribers.forEach((fn) => fn())
}

export function useFFmpeg() {
  // Re-render this component whenever module-level state changes
  const [, tick] = useState(0)
  useEffect(() => {
    const rerender = () => tick((n) => n + 1)
    subscribers.add(rerender)
    return () => { subscribers.delete(rerender) }
  }, [])

  const ensureLoaded = useCallback(async (): Promise<FFmpeg> => {
    if (sharedFFmpeg) return sharedFFmpeg

    if (!sharedLoadPromise) {
      const ff = new FFmpeg()
      sharedStatus = 'loading'
      sharedProgress = 0
      notify()

      sharedLoadPromise = (async () => {
        // ffmpeg-core.js is ~110 KB  → counts as the first 2 %
        // ffmpeg-core.wasm is ~30 MB → counts as the remaining 98 %
        sharedPhase = 'downloading'
        const coreURL = await toBlobURL(
          '/ffmpeg/ffmpeg-core.js',
          'text/javascript',
          true,
          ({ received, total }) => {
            sharedProgress = total > 0 ? Math.round((received / total) * 2) : 1
            notify()
          },
        )
        const wasmURL = await toBlobURL(
          '/ffmpeg/ffmpeg-core.wasm',
          'application/wasm',
          true,
          ({ received, total }) => {
            sharedProgress = 2 + (total > 0 ? Math.round((received / total) * 98) : 0)
            notify()
          },
        )
        // Downloads done — now compiling/instantiating the WASM module
        sharedPhase = 'compiling'
        notify()
        await ff.load({ coreURL, wasmURL })
        sharedFFmpeg = ff
        sharedStatus = 'ready'
        notify()
      })().catch((err) => {
        sharedLoadPromise = null
        sharedStatus = 'error'
        notify()
        throw err
      })
    }

    await sharedLoadPromise
    return sharedFFmpeg!
  }, [])

  return {
    status: sharedStatus,
    loadPhase: sharedPhase,
    loadProgress: sharedProgress,
    ensureLoaded,
    fetchFile,
  }
}
