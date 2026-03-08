import { useRef, useState, useCallback, useEffect } from "react"
import { motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { Check, X, Move, Pencil, Trash2 } from "lucide-react"
import type { TextAnnotation } from "@/lib/pdf-engine"

const FONT_CSS: Record<string, string> = {
  "Inter": "Inter, Helvetica, Arial, sans-serif",
  "Helvetica": "Helvetica, Arial, sans-serif",
  "Times New Roman": "'Times New Roman', Times, serif",
  "Courier New": "'Courier New', Courier, monospace",
  "Georgia": "Georgia, 'Times New Roman', serif",
}

interface DraggableTextProps {
  annotation: { type: "text" } & TextAnnotation
  containerWidth: number
  containerHeight: number
  scale: number
  isNew?: boolean
  onConfirm: (x: number, y: number, width: number, height: number) => void
  onEdit: () => void
  onDelete: () => void
  onCancel: () => void
}

export function DraggableText({
  annotation,
  containerWidth,
  containerHeight,
  scale,
  isNew = false,
  onConfirm,
  onEdit,
  onDelete,
  onCancel,
}: DraggableTextProps) {
  const scaledX = annotation.x * scale
  const scaledY = annotation.y * scale
  const scaledW = (annotation.width || 150) * scale
  const scaledH = (annotation.height || 30) * scale

  const [position, setPosition] = useState({ x: scaledX, y: scaledY })
  const [size, setSize] = useState({ width: Math.max(scaledW, 80), height: Math.max(scaledH, 24) })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, w: 0, h: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation()
    e.preventDefault()
    ;(e.target as Element).setPointerCapture(e.pointerId)
    setIsDragging(true)
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    })
  }, [position])

  const handleResizePointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation()
    e.preventDefault()
    ;(e.target as Element).setPointerCapture(e.pointerId)
    setIsResizing(true)
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      w: size.width,
      h: size.height,
    })
  }, [size])

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (isDragging) {
        const newX = Math.max(0, Math.min(containerWidth - size.width, e.clientX - dragOffset.x))
        const newY = Math.max(0, Math.min(containerHeight - size.height, e.clientY - dragOffset.y))
        setPosition({ x: newX, y: newY })
      }
      if (isResizing) {
        const dx = e.clientX - resizeStart.x
        const dy = e.clientY - resizeStart.y
        const newW = Math.max(60, resizeStart.w + dx)
        const newH = Math.max(20, resizeStart.h + dy)
        setSize({ width: newW, height: newH })
      }
    }

    const handlePointerUp = () => {
      setIsDragging(false)
      setIsResizing(false)
    }

    if (isDragging || isResizing) {
      window.addEventListener("pointermove", handlePointerMove)
      window.addEventListener("pointerup", handlePointerUp)
      return () => {
        window.removeEventListener("pointermove", handlePointerMove)
        window.removeEventListener("pointerup", handlePointerUp)
      }
    }
  }, [isDragging, isResizing, dragOffset, resizeStart, containerWidth, containerHeight, size.width, size.height])

  const handleConfirm = useCallback(() => {
    onConfirm(
      position.x / scale,
      position.y / scale,
      size.width / scale,
      size.height / scale
    )
  }, [position, size, scale, onConfirm])

  const fontFamily = FONT_CSS[annotation.fontFamily] || FONT_CSS["Inter"]

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-10 touch-none"
      style={{ pointerEvents: "auto" }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/10"
        onClick={onCancel}
      />

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="absolute border-2 border-ring bg-card/30 select-none group touch-none"
        style={{
          left: position.x,
          top: position.y,
          width: size.width,
          height: size.height,
          cursor: isDragging ? "grabbing" : "grab",
        }}
        onPointerDown={handlePointerDown}
        onDoubleClick={(e) => {
          e.stopPropagation()
          onEdit()
        }}
      >
        <div
          className="w-full h-full flex items-start p-1 pointer-events-none overflow-hidden absolute inset-0"
          style={{
            fontSize: `${annotation.fontSize * scale}px`,
            fontFamily,
            color: annotation.color,
            lineHeight: 1.3,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {annotation.text}
        </div>

        {/* Move indicator */}
        <motion.div
          initial={{ y: 5, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded flex items-center gap-1 whitespace-nowrap"
        >
          <Move className="h-3 w-3" />
          {isNew ? "Drag to position" : "Move / resize"}
        </motion.div>

        {/* Resize handle */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
          className="absolute -bottom-1.5 -right-1.5 w-5 h-5 bg-primary rounded-full cursor-se-resize border-2 border-background shadow touch-none"
          onPointerDown={handleResizePointerDown}
        />

        {/* Action buttons */}
        <motion.div
          initial={{ y: -5, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex gap-1"
        >
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs"
            onClick={(e) => {
              e.stopPropagation()
              onCancel()
            }}
          >
            <X className="h-3 w-3 mr-1" />
            Cancel
          </Button>
          {!isNew && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit()
                }}
              >
                <Pencil className="h-3 w-3 mr-1" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="h-7 px-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            </>
          )}
          <Button
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={(e) => {
              e.stopPropagation()
              handleConfirm()
            }}
          >
            <Check className="h-3 w-3 mr-1" />
            Place
          </Button>
        </motion.div>
      </motion.div>
    </div>
  )
}
