import { useRef, useState, useEffect, useCallback } from "react"
import { motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { ColorPicker } from "@/components/ui/color-picker"
import { Tooltip } from "@/components/ui/tooltip"
import { Eraser } from "lucide-react"

interface SignaturePadProps {
  onSave: (dataUrl: string) => void
  onCancel: () => void
}

export function SignaturePad({ onSave, onCancel }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasContent, setHasContent] = useState(false)
  const [strokeColor, setStrokeColor] = useState("#FFFFFF")
  const [strokeSize, setStrokeSize] = useState(2)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
  }, [])

  const applyStrokeStyle = useCallback(() => {
    const ctx = canvasRef.current?.getContext("2d")
    if (!ctx) return
    ctx.strokeStyle = strokeColor
    ctx.lineWidth = strokeSize
  }, [strokeColor, strokeSize])

  useEffect(() => {
    applyStrokeStyle()
  }, [applyStrokeStyle])

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

  const save = () => {
    if (!hasContent) return
    const dataUrl = canvasRef.current!.toDataURL("image/png")
    onSave(dataUrl)
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
        <h3 className="text-lg font-semibold mb-4">Draw Your Signature</h3>
        <div
          className="border-2 border-dashed border-border rounded-lg overflow-hidden mb-4"
          style={{
            backgroundImage:
              "linear-gradient(45deg, #2a2a2a 25%, transparent 25%), linear-gradient(-45deg, #2a2a2a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #2a2a2a 75%), linear-gradient(-45deg, transparent 75%, #2a2a2a 75%)",
            backgroundSize: "16px 16px",
            backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
            backgroundColor: "#1e1e1e",
          }}
        >
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
            <Button onClick={save} disabled={!hasContent}>
              Place Signature
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
