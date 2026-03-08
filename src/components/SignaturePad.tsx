import { useRef, useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Button } from "@/components/ui/button"
import { ColorPicker } from "@/components/ui/color-picker"
import { Tooltip } from "@/components/ui/tooltip"
import { Eraser, Plus, Trash2 } from "lucide-react"
import {
  loadSignatures,
  saveSignature,
  deleteSignature,
  type SavedSignature,
} from "@/lib/persistence"

interface SignaturePadProps {
  onSave: (dataUrl: string) => void
  onCancel: () => void
}

export function SignaturePad({ onSave, onCancel }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasContent, setHasContent] = useState(false)
  const isDark = document.documentElement.classList.contains("dark")
  const [strokeColor, setStrokeColor] = useState(isDark ? "#FFFFFF" : "#000000")
  const [strokeSize, setStrokeSize] = useState(2)
  const [savedSignatures, setSavedSignatures] = useState<SavedSignature[]>([])
  const [mode, setMode] = useState<"pick" | "draw">("pick")

  // Load saved signatures on mount
  useEffect(() => {
    loadSignatures().then((sigs) => {
      setSavedSignatures(sigs)
      if (sigs.length === 0) setMode("draw")
    })
  }, [])

  useEffect(() => {
    if (mode !== "draw") return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
  }, [mode])

  const applyStrokeStyle = useCallback(() => {
    const ctx = canvasRef.current?.getContext("2d")
    if (!ctx) return
    ctx.strokeStyle = strokeColor
    ctx.lineWidth = strokeSize
  }, [strokeColor, strokeSize])

  useEffect(() => {
    if (mode === "draw") applyStrokeStyle()
  }, [applyStrokeStyle, mode])

  const getPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    const scaleX = canvasRef.current!.width / rect.width
    const scaleY = canvasRef.current!.height / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current!.getContext("2d")!
    ctx.strokeStyle = strokeColor
    ctx.lineWidth = strokeSize
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    setIsDrawing(true)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const ctx = canvasRef.current!.getContext("2d")!
    const pos = getPos(e)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    setHasContent(true)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clear = () => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext("2d")!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasContent(false)
  }

  const handleSaveNew = async () => {
    if (!hasContent) return
    const dataUrl = canvasRef.current!.toDataURL("image/png")
    await saveSignature(dataUrl)
    onSave(dataUrl)
  }

  const handlePickSaved = (dataUrl: string) => {
    onSave(dataUrl)
  }

  const handleDelete = async (id: string) => {
    await deleteSignature(id)
    setSavedSignatures((prev) => prev.filter((s) => s.id !== id))
    if (savedSignatures.length <= 1) setMode("draw")
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="bg-card text-card-foreground rounded-xl shadow-2xl p-6 max-w-lg w-full mx-4"
      >
        {/* Tabs */}
        <div className="flex items-center gap-2 mb-4">
          {savedSignatures.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setMode("pick")}
                className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  mode === "pick"
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Saved ({savedSignatures.length})
              </button>
              <button
                type="button"
                onClick={() => setMode("draw")}
                className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  mode === "draw"
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Draw New
              </button>
            </>
          )}
          {savedSignatures.length === 0 && (
            <h3 className="text-lg font-semibold">Draw Your Signature</h3>
          )}
        </div>

        <AnimatePresence mode="wait">
          {mode === "pick" ? (
            <motion.div
              key="pick"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
            >
              {/* Saved signatures grid */}
              <div className="grid grid-cols-2 gap-3 mb-4 max-h-64 overflow-y-auto pr-1">
                {savedSignatures.map((sig, i) => (
                  <motion.div
                    key={sig.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="relative group"
                  >
                    <button
                      type="button"
                      onClick={() => handlePickSaved(sig.dataUrl)}
                      className="w-full aspect-[2.5/1] rounded-lg border-2 border-border hover:border-ring checkerboard-bg overflow-hidden transition-colors cursor-pointer relative"
                    >
                      <img
                        src={sig.dataUrl}
                        alt="Saved signature"
                        className="w-full h-full object-contain p-2"
                        draggable={false}
                      />
                    </button>
                    <Tooltip content="Delete signature">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(sig.id)
                        }}
                        className="absolute bottom-1 right-1 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md z-10"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Tooltip>
                  </motion.div>
                ))}
                {/* Draw new card */}
                <motion.button
                  type="button"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: savedSignatures.length * 0.04 }}
                  onClick={() => setMode("draw")}
                  className="w-full aspect-[2.5/1] rounded-lg border-2 border-dashed border-border hover:border-ring flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <Plus className="h-5 w-5" />
                  <span className="text-xs">Draw new</span>
                </motion.button>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="draw"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
            >
              <div className="border-2 border-dashed border-border rounded-lg overflow-hidden mb-4 checkerboard-bg">
                <canvas
                  ref={canvasRef}
                  width={920}
                  height={400}
                  className="cursor-crosshair w-full"
                  style={{ height: "200px" }}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                />
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Color</span>
                  <ColorPicker value={strokeColor} onChange={setStrokeColor} />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground mr-1">Size</span>
                  {[1, 2, 4, 8].map((size) => (
                    <Tooltip key={size} content={`${size}px`}>
                      <button
                        type="button"
                        onClick={() => setStrokeSize(size)}
                        className={`h-8 w-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
                          strokeSize === size
                            ? "bg-accent ring-1 ring-ring"
                            : "hover:bg-accent/50"
                        }`}
                      >
                        <span
                          className="rounded-full bg-foreground"
                          style={{ width: size + 4, height: size + 4 }}
                        />
                      </button>
                    </Tooltip>
                  ))}
                </div>
                <span className="text-xs text-muted-foreground ml-auto">Transparent background</span>
              </div>
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={clear}>
                  <Eraser className="mr-1 h-4 w-4" />
                  Clear
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveNew} disabled={!hasContent}>
                    Save & Place
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}
