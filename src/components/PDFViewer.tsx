import { useRef, useEffect, useState, useCallback } from "react"
import type { PDFDocumentProxy } from "pdfjs-dist"
import { renderPage, type Annotation, type TextAnnotation } from "@/lib/pdf-engine"
import { DraggableSignature } from "@/components/DraggableSignature"
import { DraggableText } from "@/components/DraggableText"
import type { Tool } from "@/hooks/usePDF"

const FONT_CSS: Record<string, string> = {
  "Inter": "Inter, Helvetica, Arial, sans-serif",
  "Helvetica": "Helvetica, Arial, sans-serif",
  "Times New Roman": "'Times New Roman', Times, serif",
  "Courier New": "'Courier New', Courier, monospace",
  "Georgia": "Georgia, 'Times New Roman', serif",
}

interface PDFViewerProps {
  pdf: PDFDocumentProxy
  currentPage: number
  scale: number
  annotations: Annotation[]
  activeTool: Tool
  drawColor: string
  highlightColor: string
  penSize: number
  onAddAnnotation: (annotation: Annotation) => void
  onUpdateAnnotation: (id: string, updates: Partial<Annotation>) => void
  onRemoveAnnotation: (id: string) => void
  onRequestSignature: () => void
  onRequestTextEditor: (x: number, y: number) => void
  onRequestEditText: (annotation: { type: "text" } & TextAnnotation) => void
  pendingSignature: string | null
  onSignaturePlaced: () => void
  pendingText: ({ type: "text" } & TextAnnotation) | null
  onTextPlaced: () => void
}

export function PDFViewer({
  pdf,
  currentPage,
  scale,
  annotations,
  activeTool,
  drawColor,
  highlightColor,
  penSize,
  onAddAnnotation,
  onUpdateAnnotation,
  onRemoveAnnotation,
  onRequestSignature,
  onRequestTextEditor,
  onRequestEditText,
  pendingSignature,
  onSignaturePlaced,
  pendingText,
  onTextPlaced,
}: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([])
  const [currentHighlightPath, setCurrentHighlightPath] = useState<{ x: number; y: number }[]>([])
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null)


  // Render PDF page
  useEffect(() => {
    if (!pdf || !canvasRef.current) return
    renderPage(pdf, currentPage, scale, canvasRef.current).then((size) => {
      setCanvasSize(size)
    })
  }, [pdf, currentPage, scale])

  // Draw annotations overlay (non-text annotations + signature images)
  useEffect(() => {
    const overlay = overlayRef.current
    if (!overlay) return
    const dpr = window.devicePixelRatio || 1
    overlay.width = canvasSize.width * dpr
    overlay.height = canvasSize.height * dpr
    overlay.style.width = `${canvasSize.width}px`
    overlay.style.height = `${canvasSize.height}px`
    const ctx = overlay.getContext("2d")!
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height)

    const pageAnnotations = annotations.filter(
      (a) => a.pageIndex === currentPage - 1
    )

    for (const a of pageAnnotations) {
      // Text annotations are rendered as HTML overlays, skip them on canvas
      if (a.type === "text") continue

      if (a.type === "highlight") {
        ctx.strokeStyle = a.color
        ctx.globalAlpha = 0.3
        ctx.lineWidth = a.lineWidth * scale
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        const pts = a.paths
        if (pts.length >= 2) {
          ctx.beginPath()
          ctx.moveTo(pts[0].x * scale, pts[0].y * scale)
          for (let i = 1; i < pts.length; i++) {
            ctx.lineTo(pts[i].x * scale, pts[i].y * scale)
          }
          ctx.stroke()
        }
        ctx.globalAlpha = 1
      } else if (a.type === "draw") {
        ctx.strokeStyle = a.color
        ctx.lineWidth = a.lineWidth * scale
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        for (const path of a.paths) {
          if (path.length < 2) continue
          ctx.beginPath()
          ctx.moveTo(path[0].x * scale, path[0].y * scale)
          for (let i = 1; i < path.length; i++) {
            ctx.lineTo(path[i].x * scale, path[i].y * scale)
          }
          ctx.stroke()
        }
      } else if (a.type === "signature") {
        const img = new window.Image()
        img.src = a.dataUrl
        img.onload = () => {
          ctx.drawImage(img, a.x * scale, a.y * scale, a.width * scale, a.height * scale)
        }
      }
    }

    // Draw current path
    if (currentPath.length > 1) {
      ctx.strokeStyle = drawColor
      ctx.lineWidth = penSize * scale
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.beginPath()
      ctx.moveTo(currentPath[0].x * scale, currentPath[0].y * scale)
      for (let i = 1; i < currentPath.length; i++) {
        ctx.lineTo(currentPath[i].x * scale, currentPath[i].y * scale)
      }
      ctx.stroke()
    }

    // Draw current highlight path
    if (currentHighlightPath.length > 1) {
      ctx.strokeStyle = highlightColor
      ctx.globalAlpha = 0.3
      ctx.lineWidth = penSize * 4 * scale
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.beginPath()
      ctx.moveTo(currentHighlightPath[0].x * scale, currentHighlightPath[0].y * scale)
      for (let i = 1; i < currentHighlightPath.length; i++) {
        ctx.lineTo(currentHighlightPath[i].x * scale, currentHighlightPath[i].y * scale)
      }
      ctx.stroke()
      ctx.globalAlpha = 1
    }
  }, [annotations, currentPage, canvasSize, scale, currentPath, drawColor, currentHighlightPath, highlightColor, penSize])

  const getCoords = useCallback(
    (clientX: number, clientY: number) => {
      const rect = overlayRef.current!.getBoundingClientRect()
      return {
        x: (clientX - rect.left) / scale,
        y: (clientY - rect.top) / scale,
      }
    },
    [scale]
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (pendingSignature || pendingText || selectedTextId) return

      const coords = getCoords(e.clientX, e.clientY)

      if (activeTool === "draw") {
        setIsDrawing(true)
        setCurrentPath([coords])
        ;(e.target as Element).setPointerCapture(e.pointerId)
      } else if (activeTool === "highlight") {
        setIsDrawing(true)
        setCurrentHighlightPath([coords])
        ;(e.target as Element).setPointerCapture(e.pointerId)
      } else if (activeTool === "text") {
        onRequestTextEditor(coords.x, coords.y)
      } else if (activeTool === "signature") {
        onRequestSignature()
      }
    },
    [activeTool, pendingSignature, pendingText, selectedTextId, getCoords, onRequestSignature, onRequestTextEditor]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDrawing) return
      const coords = getCoords(e.clientX, e.clientY)

      if (activeTool === "draw") {
        setCurrentPath((prev) => [...prev, coords])
      } else if (activeTool === "highlight") {
        setCurrentHighlightPath((prev) => [...prev, coords])
      }
    },
    [isDrawing, activeTool, getCoords]
  )

  const handlePointerUp = useCallback(
    () => {
      if (!isDrawing) return
      setIsDrawing(false)

      if (activeTool === "draw" && currentPath.length > 1) {
        onAddAnnotation({
          type: "draw",
          id: crypto.randomUUID(),
          pageIndex: currentPage - 1,
          paths: [currentPath],
          color: drawColor,
          lineWidth: penSize,
        })
        setCurrentPath([])
      } else if (activeTool === "highlight" && currentHighlightPath.length > 1) {
        onAddAnnotation({
          type: "highlight",
          id: crypto.randomUUID(),
          pageIndex: currentPage - 1,
          paths: currentHighlightPath,
          lineWidth: penSize * 4,
          color: highlightColor,
        })
        setCurrentHighlightPath([])
      }
    },
    [isDrawing, activeTool, currentPage, currentPath, drawColor, currentHighlightPath, highlightColor, penSize, onAddAnnotation]
  )

  const handleSignatureConfirm = useCallback(
    (x: number, y: number, width: number, height: number) => {
      if (!pendingSignature) return
      onAddAnnotation({
        type: "signature",
        id: crypto.randomUUID(),
        pageIndex: currentPage - 1,
        x,
        y,
        width,
        height,
        dataUrl: pendingSignature,
      })
      onSignaturePlaced()
    },
    [pendingSignature, currentPage, onAddAnnotation, onSignaturePlaced]
  )

  const handleTextConfirm = useCallback(
    (annotationId: string, x: number, y: number, width: number, height: number) => {
      onUpdateAnnotation(annotationId, { x, y, width, height })
      setSelectedTextId(null)
    },
    [onUpdateAnnotation]
  )

  const handleNewTextConfirm = useCallback(
    (x: number, y: number, width: number, height: number) => {
      if (!pendingText) return
      onAddAnnotation({
        ...pendingText,
        x,
        y,
        width,
        height,
      })
      onTextPlaced()
    },
    [pendingText, onAddAnnotation, onTextPlaced]
  )

  // Get text annotations for current page
  const pageTextAnnotations = annotations.filter(
    (a) => a.type === "text" && a.pageIndex === currentPage - 1
  ) as ({ type: "text" } & TextAnnotation)[]

  const cursorClass =
    pendingSignature || pendingText
      ? "cursor-default"
      : activeTool === "draw"
        ? "cursor-crosshair"
        : activeTool === "text"
          ? "cursor-text"
          : activeTool === "highlight"
            ? "cursor-crosshair"
            : activeTool === "signature"
              ? "cursor-pointer"
              : "cursor-default"

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-auto bg-background flex items-start justify-center p-2 pb-28 sm:p-8 md:pb-8"
    >
      <div className="relative shadow-lg" style={{ width: canvasSize.width, height: canvasSize.height }}>
        <canvas ref={canvasRef} className="absolute top-0 left-0" />
        <canvas
          ref={overlayRef}
          className={`absolute top-0 left-0 touch-none ${cursorClass}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={() => {
            if (isDrawing && activeTool === "draw") {
              setIsDrawing(false)
              if (currentPath.length > 1) {
                onAddAnnotation({
                  type: "draw",
                  id: crypto.randomUUID(),
                  pageIndex: currentPage - 1,
                  paths: [currentPath],
                  color: drawColor,
                  lineWidth: penSize,
                })
              }
              setCurrentPath([])
            }
          }}
        />

        {/* Rendered text annotations as HTML overlays (clickable to select) */}
        {pageTextAnnotations.map((a) =>
          selectedTextId === a.id ? null : (
            <div
              key={a.id}
              className={`absolute overflow-hidden ${activeTool === "select" ? "cursor-pointer hover:outline hover:outline-2 hover:outline-ring/50 hover:rounded-sm" : "pointer-events-none"}`}
              style={{
                left: a.x * scale,
                top: a.y * scale,
                width: a.width ? a.width * scale : undefined,
                height: a.height ? a.height * scale : undefined,
                fontSize: `${a.fontSize * scale}px`,
                fontFamily: FONT_CSS[a.fontFamily] || FONT_CSS["Inter"],
                color: a.color,
                lineHeight: 1.3,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                padding: `${1 * scale}px`,
              }}
              onClick={(e) => {
                if (activeTool !== "select") return
                e.stopPropagation()
                setSelectedTextId(a.id)
              }}
            >
              {a.text}
            </div>
          )
        )}

        {/* Draggable text overlay for selected existing text */}
        {selectedTextId && (() => {
          const ann = pageTextAnnotations.find((a) => a.id === selectedTextId)
          if (!ann) return null
          return (
            <DraggableText
              annotation={ann}
              containerWidth={canvasSize.width}
              containerHeight={canvasSize.height}
              scale={scale}
              onConfirm={(x, y, w, h) => handleTextConfirm(ann.id, x, y, w, h)}
              onEdit={() => {
                setSelectedTextId(null)
                onRequestEditText(ann)
              }}
              onDelete={() => {
                onRemoveAnnotation(ann.id)
                setSelectedTextId(null)
              }}
              onCancel={() => setSelectedTextId(null)}
            />
          )
        })()}

        {/* Draggable text overlay for new pending text */}
        {pendingText && (
          <DraggableText
            annotation={pendingText}
            containerWidth={canvasSize.width}
            containerHeight={canvasSize.height}
            scale={scale}
            isNew
            onConfirm={handleNewTextConfirm}
            onEdit={() => {}}
            onDelete={() => onTextPlaced()}
            onCancel={onTextPlaced}
          />
        )}

        {/* Draggable signature overlay */}
        {pendingSignature && (
          <DraggableSignature
            dataUrl={pendingSignature}
            containerWidth={canvasSize.width}
            containerHeight={canvasSize.height}
            scale={scale}
            onConfirm={handleSignatureConfirm}
            onCancel={onSignaturePlaced}
          />
        )}
      </div>
    </div>
  )
}
