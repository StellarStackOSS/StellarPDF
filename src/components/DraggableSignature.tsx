import { useRef, useState, useCallback, useEffect } from "react"
import { motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { Check, X, Move } from "lucide-react"

interface DraggableSignatureProps {
  dataUrl: string
  containerWidth: number
  containerHeight: number
  scale: number
  onConfirm: (x: number, y: number, width: number, height: number) => void
  onCancel: () => void
}

export function DraggableSignature({
  dataUrl,
  containerWidth,
  containerHeight,
  scale,
  onConfirm,
  onCancel,
}: DraggableSignatureProps) {
  const [position, setPosition] = useState({ x: containerWidth / 2 - 100, y: containerHeight / 2 - 40 })
  const [size, setSize] = useState({ width: 200, height: 80 })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, w: 0, h: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setIsDragging(true)
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    })
  }, [position])

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setIsResizing(true)
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      w: size.width,
      h: size.height,
    })
  }, [size])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = Math.max(0, Math.min(containerWidth - size.width, e.clientX - dragOffset.x))
        const newY = Math.max(0, Math.min(containerHeight - size.height, e.clientY - dragOffset.y))
        setPosition({ x: newX, y: newY })
      }
      if (isResizing) {
        const dx = e.clientX - resizeStart.x
        const dy = e.clientY - resizeStart.y
        const newW = Math.max(80, resizeStart.w + dx)
        const newH = Math.max(30, resizeStart.h + dy)
        setSize({ width: newW, height: newH })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizing(false)
    }

    if (isDragging || isResizing) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
      return () => {
        window.removeEventListener("mousemove", handleMouseMove)
        window.removeEventListener("mouseup", handleMouseUp)
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

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-10"
      style={{ pointerEvents: "auto" }}
    >
      {/* Dimmed backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/10"
        onClick={onCancel}
      />

      {/* Signature element */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="absolute border-2 border-blue-500 bg-card/50 select-none group"
        style={{
          left: position.x,
          top: position.y,
          width: size.width,
          height: size.height,
          cursor: isDragging ? "grabbing" : "grab",
        }}
        onMouseDown={handleMouseDown}
      >
        <img
          src={dataUrl}
          alt="Your signature"
          className="w-full h-full object-contain pointer-events-none"
          draggable={false}
        />

        {/* Move indicator */}
        <motion.div
          initial={{ y: 5, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="absolute -top-8 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1 whitespace-nowrap"
        >
          <Move className="h-3 w-3" />
          Drag to position
        </motion.div>

        {/* Resize handle */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
          className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-blue-500 rounded-full cursor-se-resize border-2 border-white shadow"
          onMouseDown={handleResizeMouseDown}
        />

        {/* Confirm / Cancel buttons */}
        <motion.div
          initial={{ y: -5, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex gap-1"
        >
          <Button
            size="sm"
            variant="destructive"
            className="h-7 px-2 text-xs"
            onClick={(e) => {
              e.stopPropagation()
              onCancel()
            }}
          >
            <X className="h-3 w-3 mr-1" />
            Cancel
          </Button>
          <Button
            size="sm"
            className="h-7 px-2 text-xs bg-blue-500 hover:bg-blue-600"
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
