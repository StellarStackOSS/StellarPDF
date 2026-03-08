import { useState, useRef } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tooltip } from "@/components/ui/tooltip"
import { ColorPicker } from "@/components/ui/color-picker"
import type { Tool } from "@/hooks/usePDF"
import {
  FileUp,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  MousePointer2,
  Type,
  Pencil,
  Highlighter,
  PenTool,
  Download,
  FileText,
  Image,
  FileDown,
  Undo2,
  Redo2,
  X,
  Sun,
  Moon,
} from "lucide-react"

interface ToolbarProps {
  fileName: string
  currentPage: number
  totalPages: number
  scale: number
  activeTool: Tool
  drawColor: string
  textColor: string
  highlightColor: string
  onOpenFile: () => void
  onPageChange: (page: number) => void
  onScaleChange: (scale: number) => void
  onToolChange: (tool: Tool) => void
  onDrawColorChange: (color: string) => void
  onTextColorChange: (color: string) => void
  onHighlightColorChange: (color: string) => void
  penSize: number
  onPenSizeChange: (size: number) => void
  onExportPDF: () => void
  onExportPNG: () => void
  onExportJPG: () => void
  onExportDOCX: () => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  hasPdf: boolean
  onClosePdf: () => void
  isDark: boolean
  onToggleTheme: () => void
}

export function Toolbar({
  fileName,
  currentPage,
  totalPages,
  scale,
  activeTool,
  drawColor,
  textColor,
  highlightColor,
  onOpenFile,
  onPageChange,
  onScaleChange,
  onToolChange,
  onDrawColorChange,
  onTextColorChange,
  onHighlightColorChange,
  penSize,
  onPenSizeChange,
  onExportPDF,
  onExportPNG,
  onExportJPG,
  onExportDOCX,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  hasPdf,
  onClosePdf,
  isDark,
  onToggleTheme,
}: ToolbarProps) {
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  const tools: { id: Tool; icon: React.ReactNode; label: string }[] = [
    { id: "select", icon: <MousePointer2 className="h-4 w-4" />, label: "Select" },
    { id: "text", icon: <Type className="h-4 w-4" />, label: "Add Text" },
    { id: "draw", icon: <Pencil className="h-4 w-4" />, label: "Draw" },
    { id: "highlight", icon: <Highlighter className="h-4 w-4" />, label: "Highlight" },
    { id: "signature", icon: <PenTool className="h-4 w-4" />, label: "Sign" },
  ]

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="mx-4 mt-3 flex items-center gap-1 px-4 py-2 bg-card border border-border rounded-xl shadow-lg"
    >
      {/* File */}
      <Tooltip content="Open PDF">
        <Button variant="ghost" size="icon" onClick={onOpenFile}>
          <FileUp className="h-4 w-4" />
        </Button>
      </Tooltip>

      <AnimatePresence>
        {fileName && (
          <motion.span
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "auto", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-sm text-muted-foreground px-2 max-w-48 truncate overflow-hidden"
          >
            {fileName}
          </motion.span>
        )}
      </AnimatePresence>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Tools */}
      {tools.map((tool, i) => (
        <motion.div
          key={tool.id}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: i * 0.03, type: "spring", stiffness: 400, damping: 25 }}
        >
          <Tooltip content={tool.label}>
            <Button
              variant={activeTool === tool.id ? "secondary" : "ghost"}
              size="icon"
              onClick={() => onToolChange(tool.id)}
              disabled={!hasPdf}
              className={activeTool === tool.id ? "bg-accent ring-1 ring-ring" : ""}
            >
              {tool.icon}
            </Button>
          </Tooltip>
        </motion.div>
      ))}

      {/* Undo / Redo */}
      {hasPdf && (
        <>
          <Separator orientation="vertical" className="h-6 mx-1" />
          <Tooltip content="Undo (Ctrl+Z)">
            <Button variant="ghost" size="icon" onClick={onUndo} disabled={!canUndo}>
              <Undo2 className="h-4 w-4" />
            </Button>
          </Tooltip>
          <Tooltip content="Redo (Ctrl+Shift+Z)">
            <Button variant="ghost" size="icon" onClick={onRedo} disabled={!canRedo}>
              <Redo2 className="h-4 w-4" />
            </Button>
          </Tooltip>
        </>
      )}

      {/* Color pickers */}
      <AnimatePresence mode="wait">
        {hasPdf && activeTool === "draw" && (
          <motion.div
            key="draw-color"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <ColorPicker value={drawColor} onChange={onDrawColorChange} />
          </motion.div>
        )}
        {hasPdf && activeTool === "text" && (
          <motion.div
            key="text-color"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <ColorPicker value={textColor} onChange={onTextColorChange} />
          </motion.div>
        )}
        {hasPdf && activeTool === "highlight" && (
          <motion.div
            key="highlight-color"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <ColorPicker value={highlightColor} onChange={onHighlightColorChange} variant="highlight" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pen thickness */}
      <AnimatePresence>
        {hasPdf && (activeTool === "draw" || activeTool === "highlight") && (
          <motion.div
            key="pen-size"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="flex items-center gap-1 ml-1"
          >
            {[1, 2, 4, 8].map((size) => (
              <Tooltip key={size} content={`${size}px`}>
                <button
                  type="button"
                  onClick={() => onPenSizeChange(size)}
                  className={`h-8 w-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
                    penSize === size
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
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1" />

      {/* Navigation */}
      {hasPdf && (
        <>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <motion.span
              key={currentPage}
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="text-sm tabular-nums min-w-16 text-center"
            >
              {currentPage} / {totalPages}
            </motion.span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Zoom */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onScaleChange(Math.round(Math.max(0.25, scale - 0.25) * 100) / 100)}
              disabled={scale <= 0.25}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground w-10 text-center tabular-nums">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onScaleChange(Math.round(Math.min(3, scale + 0.25) * 100) / 100)}
              disabled={scale >= 3}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Export */}
          <div ref={exportRef} className="relative">
            <Tooltip content="Export">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setExportOpen(!exportOpen)}
              >
                <Download className="h-4 w-4" />
              </Button>
            </Tooltip>
            <AnimatePresence>
              {exportOpen && (
                <>
                  <motion.div
                    className="fixed inset-0 z-40"
                    onClick={() => setExportOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 z-50 bg-card border border-border rounded-xl shadow-xl py-1.5 w-44 overflow-hidden"
                  >
                    {[
                      { icon: <FileDown className="h-4 w-4" />, label: "Export as PDF", action: onExportPDF },
                      { icon: <Image className="h-4 w-4" />, label: "Export as PNG", action: onExportPNG },
                      { icon: <Image className="h-4 w-4" />, label: "Export as JPG", action: onExportJPG },
                      { icon: <FileText className="h-4 w-4" />, label: "Export as DOCX", action: onExportDOCX },
                    ].map((item, i) => (
                      <motion.button
                        key={item.label}
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent text-left cursor-pointer"
                        onClick={() => {
                          item.action()
                          setExportOpen(false)
                        }}
                      >
                        {item.icon}
                        {item.label}
                      </motion.button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Theme toggle */}
          <Tooltip content={isDark ? "Light mode" : "Dark mode"}>
            <Button variant="ghost" size="icon" onClick={onToggleTheme}>
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </Tooltip>

          {/* Close PDF */}
          <Tooltip content="Close PDF">
            <Button variant="ghost" size="icon" onClick={onClosePdf}>
              <X className="h-4 w-4" />
            </Button>
          </Tooltip>
        </>
      )}

    </motion.div>
  )
}
