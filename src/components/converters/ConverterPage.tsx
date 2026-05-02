import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  ArrowLeft, Upload, X, Download, RotateCcw, ChevronDown,
  CheckCircle, AlertCircle, Loader2, Sun, Moon,
  FileImage, FileVideo, FileAudio,
} from 'lucide-react'
import { useFFmpeg } from '@/hooks/useFFmpeg'
import { FORMATS, getMimeType, buildFFmpegArgs, type ConverterType } from '@/lib/conversion-formats'

interface QueueItem {
  id: string
  file: File
  inputExt: string
  outputFormat: string
  status: 'pending' | 'converting' | 'done' | 'error'
  progress: number
  outputBlob?: Blob
  outputName: string
  error?: string
}

interface ConverterPageProps {
  type: ConverterType
  isDark: boolean
  onBack: () => void
  onToggleTheme: () => void
}

const TITLES: Record<ConverterType, string> = {
  image: 'Image Converter',
  video: 'Video Converter',
  audio: 'Audio Converter',
}

const ICONS: Record<ConverterType, React.ElementType> = {
  image: FileImage,
  video: FileVideo,
  audio: FileAudio,
}

const ACCEPT: Record<ConverterType, string> = {
  image: 'image/*,.tiff,.tif,.avif,.tga,.ppm,.pbm,.pgm,.bmp',
  video: 'video/*,.mkv,.avi,.flv,.wmv,.3gp,.ogv',
  audio: 'audio/*,.flac,.ogg,.opus,.aiff,.aif,.wma,.ac3',
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

export function ConverterPage({ type, isDark, onBack, onToggleTheme }: ConverterPageProps) {
  const { ensureLoaded, status: ffmpegStatus, loadPhase, loadProgress, fetchFile } = useFFmpeg()
  const [items, setItems] = useState<QueueItem[]>([])
  const [globalFormat, setGlobalFormat] = useState(FORMATS[type].output[0].formats[0])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const stopRef = useRef(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Warm up the engine as soon as the converter page opens, not on first convert
  useEffect(() => { ensureLoaded().catch(() => {}) }, [ensureLoaded])

  const updateItem = useCallback((id: string, updates: Partial<QueueItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)))
  }, [])

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const valid = Array.from(files).filter((f) => {
        const ext = f.name.split('.').pop()?.toLowerCase() ?? ''
        return FORMATS[type].input.includes(ext)
      })
      if (!valid.length) return
      setItems((prev) => [
        ...prev,
        ...valid.map((f) => {
          const inputExt = f.name.split('.').pop()?.toLowerCase() ?? ''
          return {
            id: crypto.randomUUID(),
            file: f,
            inputExt,
            outputFormat: globalFormat,
            status: 'pending' as const,
            progress: 0,
            outputName: f.name.replace(/\.[^.]+$/, '') + '.' + globalFormat,
          }
        }),
      ])
    },
    [globalFormat, type],
  )

  const convertItem = useCallback(
    async (item: QueueItem) => {
      const ff = await ensureLoaded()
      const inputName = `in_${item.id}.${item.inputExt}`
      const outputName = `out_${item.id}.${item.outputFormat}`

      updateItem(item.id, { status: 'converting', progress: 0 })

      const onProgress = ({ progress }: { progress: number }) => {
        updateItem(item.id, { progress: Math.round(Math.max(0, Math.min(99, progress * 100))) })
      }
      ff.on('progress', onProgress)

      try {
        await ff.writeFile(inputName, await fetchFile(item.file))
        const args = buildFFmpegArgs(inputName, outputName, type, item.outputFormat)
        const code = await ff.exec(args)
        if (code !== 0) throw new Error(`FFmpeg exited with code ${code}`)
        const data = await ff.readFile(outputName)
        // Copy into a plain ArrayBuffer to satisfy Blob constructor type constraints
        const raw = typeof data === 'string' ? new TextEncoder().encode(data) : (data as Uint8Array)
        const copy = new Uint8Array(raw.length)
        copy.set(raw)
        const blob = new Blob([copy.buffer], { type: getMimeType(item.outputFormat) })
        updateItem(item.id, { status: 'done', progress: 100, outputBlob: blob })
      } catch (err) {
        updateItem(item.id, {
          status: 'error',
          error: err instanceof Error ? err.message : 'Conversion failed',
        })
      } finally {
        ff.off('progress', onProgress)
        try { await ff.deleteFile(inputName) } catch { /* ignore */ }
        try { await ff.deleteFile(outputName) } catch { /* ignore */ }
      }
    },
    [ensureLoaded, fetchFile, type, updateItem],
  )

  const convertAll = useCallback(async () => {
    stopRef.current = false
    setIsProcessing(true)
    try {
      // snapshot pending items at click time
      const pending = items.filter((i) => i.status === 'pending')
      for (const item of pending) {
        if (stopRef.current) break
        await convertItem(item)
      }
    } finally {
      setIsProcessing(false)
    }
  }, [items, convertItem])

  const downloadItem = useCallback((item: QueueItem) => {
    if (!item.outputBlob) return
    const url = URL.createObjectURL(item.outputBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = item.outputName
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const downloadAll = useCallback(() => {
    items.filter((i) => i.status === 'done').forEach(downloadItem)
  }, [items, downloadItem])

  const pendingCount = items.filter((i) => i.status === 'pending').length
  const doneCount = items.filter((i) => i.status === 'done').length

  const bg = isDark ? '#0a0a0a' : '#fafafa'
  const navBg = isDark ? 'rgba(10,10,10,0.85)' : 'rgba(250,250,250,0.85)'
  const border = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'
  const textPrimary = isDark ? '#fff' : '#111'
  const textSecondary = isDark ? '#a3a3a3' : '#737373'
  const textTertiary = isDark ? '#525252' : '#a3a3a3'
  const surfaceBg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'
  const chipBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'

  const TitleIcon = ICONS[type]

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bg, color: textPrimary }}>
      {/* Nav */}
      <nav
        className="sticky top-0 z-50 backdrop-blur-xl flex items-center justify-between px-6 h-16 flex-shrink-0"
        style={{ borderBottom: `1px solid ${border}`, backgroundColor: navBg }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm transition-colors cursor-pointer"
            style={{ color: textSecondary }}
            onMouseEnter={(e) => (e.currentTarget.style.color = textPrimary)}
            onMouseLeave={(e) => (e.currentTarget.style.color = textSecondary)}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div style={{ width: 1, height: 20, backgroundColor: border }} />
          <div className="flex items-center gap-2">
            <TitleIcon className="h-4 w-4" style={{ color: textSecondary }} />
            <span className="text-sm font-medium">{TITLES[type]}</span>
          </div>
        </div>
        <button onClick={onToggleTheme} className="cursor-pointer transition-colors" style={{ color: textSecondary }}>
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </nav>

      <main className="flex-1 mx-auto w-full max-w-3xl px-6 py-10 flex flex-col gap-5">
        {/* Drop zone */}
        <div
          className="rounded-2xl border-2 border-dashed p-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-colors select-none"
          style={{
            borderColor: isDragging ? (isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.25)') : border,
            backgroundColor: isDragging ? surfaceBg : 'transparent',
          }}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files) }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPT[type]}
            className="hidden"
            onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = '' }}
          />
          {ffmpegStatus === 'loading'
            ? <Loader2 className="h-8 w-8 animate-spin" style={{ color: textTertiary }} />
            : <Upload className="h-8 w-8" style={{ color: textTertiary }} />
          }
          <div className="text-center w-full max-w-xs">
            <p className="text-sm font-medium" style={{ color: textPrimary }}>
              {ffmpegStatus === 'loading'
                ? loadPhase === 'compiling' ? 'Compiling engine…' : 'Downloading FFmpeg engine…'
                : 'Drop files here or click to browse'}
            </p>
            <p className="mt-1 text-xs" style={{ color: textTertiary }}>
              {ffmpegStatus === 'loading'
                ? loadPhase === 'compiling'
                  ? 'Instantiating WebAssembly — usually a few seconds'
                  : 'One-time download (~30 MB), cached after first use'
                : `Supports: ${FORMATS[type].input.map((f) => f.toUpperCase()).join(' · ')}`
              }
            </p>
            {ffmpegStatus === 'loading' && (
              <div className="mt-4 flex flex-col items-center gap-1.5">
                {loadPhase === 'downloading' ? (
                  <>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: isDark ? '#fff' : '#111' }}
                        animate={{ width: `${loadProgress}%` }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                      />
                    </div>
                    <span className="text-xs tabular-nums" style={{ color: textTertiary }}>{loadProgress}%</span>
                  </>
                ) : (
                  // Indeterminate bar during WASM compilation
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: isDark ? '#fff' : '#111', width: '40%' }}
                      animate={{ x: ['0%', '150%', '0%'] }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Controls bar */}
        {items.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: textSecondary }}>Default output:</span>
              <div className="relative">
                <select
                  value={globalFormat}
                  onChange={(e) => setGlobalFormat(e.target.value)}
                  className="appearance-none rounded-lg pl-3 pr-7 py-1.5 text-xs font-medium cursor-pointer"
                  style={{ backgroundColor: chipBg, border: `1px solid ${border}`, color: textPrimary, outline: 'none' }}
                >
                  {FORMATS[type].output.map((group) => (
                    <optgroup key={group.label} label={group.label}>
                      {group.formats.map((f) => (
                        <option key={f} value={f}>{f.toUpperCase()}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <ChevronDown className="h-3 w-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: textTertiary }} />
              </div>
            </div>

            <div className="flex-1" />

            {doneCount > 0 && (
              <button
                onClick={downloadAll}
                className="flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium cursor-pointer transition-colors"
                style={{ backgroundColor: chipBg, border: `1px solid ${border}`, color: textPrimary }}
              >
                <Download className="h-3.5 w-3.5" />
                Download All ({doneCount})
              </button>
            )}

            {pendingCount > 0 && !isProcessing && (
              <button
                onClick={convertAll}
                className="flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold cursor-pointer transition-colors"
                style={{ backgroundColor: isDark ? '#fff' : '#111', color: isDark ? '#111' : '#fff' }}
              >
                Convert All ({pendingCount})
              </button>
            )}

            {isProcessing && (
              <button
                onClick={() => { stopRef.current = true }}
                className="flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium cursor-pointer"
                style={{ backgroundColor: isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.08)', color: '#ef4444' }}
              >
                <X className="h-3.5 w-3.5" />
                Stop
              </button>
            )}

            <button
              onClick={() => setItems([])}
              className="text-xs cursor-pointer"
              style={{ color: textTertiary }}
            >
              Clear all
            </button>
          </div>
        )}

        {ffmpegStatus === 'error' && (
          <p className="text-center text-sm" style={{ color: '#ef4444' }}>
            Failed to load FFmpeg. Please refresh the page.
          </p>
        )}

        {/* Queue */}
        <div className="flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.18 }}
                className="rounded-2xl p-4 flex flex-col gap-3"
                style={{ backgroundColor: surfaceBg, border: `1px solid ${border}` }}
              >
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Status icon */}
                  <div
                    className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full"
                    style={{ backgroundColor: chipBg }}
                  >
                    {item.status === 'pending' && <TitleIcon className="h-4 w-4" style={{ color: textTertiary }} />}
                    {item.status === 'converting' && <Loader2 className="h-4 w-4 animate-spin" style={{ color: textSecondary }} />}
                    {item.status === 'done' && <CheckCircle className="h-4 w-4" style={{ color: '#22c55e' }} />}
                    {item.status === 'error' && <AlertCircle className="h-4 w-4" style={{ color: '#ef4444' }} />}
                  </div>

                  {/* File info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: textPrimary }}>{item.file.name}</p>
                    <p className="text-xs" style={{ color: textTertiary }}>{fmtSize(item.file.size)}</p>
                  </div>

                  {/* Format badge → selector */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className="text-xs font-mono px-2 py-0.5 rounded"
                      style={{ backgroundColor: chipBg, color: textTertiary }}
                    >
                      {item.inputExt.toUpperCase()}
                    </span>
                    <span className="text-xs" style={{ color: textTertiary }}>→</span>
                    <div className="relative">
                      <select
                        value={item.outputFormat}
                        disabled={item.status === 'converting' || item.status === 'done'}
                        onChange={(e) =>
                          updateItem(item.id, {
                            outputFormat: e.target.value,
                            outputName: item.file.name.replace(/\.[^.]+$/, '') + '.' + e.target.value,
                            ...(item.status === 'error' ? { status: 'pending', progress: 0, error: undefined } : {}),
                          })
                        }
                        className="appearance-none rounded-lg pl-3 pr-7 py-1 text-xs font-medium"
                        style={{
                          backgroundColor: chipBg,
                          border: `1px solid ${border}`,
                          color: textPrimary,
                          outline: 'none',
                          cursor: item.status === 'converting' || item.status === 'done' ? 'default' : 'pointer',
                        }}
                      >
                        {FORMATS[type].output.map((group) => (
                          <optgroup key={group.label} label={group.label}>
                            {group.formats.map((f) => (
                              <option key={f} value={f}>{f.toUpperCase()}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                      <ChevronDown className="h-3 w-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: textTertiary }} />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {item.status === 'done' && (
                      <button
                        onClick={() => downloadItem(item)}
                        className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium cursor-pointer"
                        style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: '#22c55e' }}
                      >
                        <Download className="h-3 w-3" />
                        Download
                      </button>
                    )}
                    {item.status === 'error' && (
                      <button
                        onClick={() => updateItem(item.id, { status: 'pending', progress: 0, error: undefined })}
                        className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium cursor-pointer"
                        style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
                      >
                        <RotateCcw className="h-3 w-3" />
                        Retry
                      </button>
                    )}
                    {item.status !== 'converting' && (
                      <button
                        onClick={() => setItems((prev) => prev.filter((i) => i.id !== item.id))}
                        className="h-7 w-7 flex items-center justify-center rounded-full cursor-pointer"
                        style={{ color: textTertiary }}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                {item.status === 'converting' && (
                  <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: isDark ? '#fff' : '#111' }}
                      animate={{ width: `${item.progress}%` }}
                      transition={{ duration: 0.25 }}
                    />
                  </div>
                )}

                {/* Error */}
                {item.status === 'error' && item.error && (
                  <p className="text-xs" style={{ color: '#ef4444' }}>{item.error}</p>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
