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

const tools: { id: Tool; icon: React.ReactNode; label: string }[] = [
  { id: "select", icon: <MousePointer2 className="h-4 w-4" />, label: "Select" },
  { id: "text", icon: <Type className="h-4 w-4" />, label: "Text" },
  { id: "draw", icon: <Pencil className="h-4 w-4" />, label: "Draw" },
  { id: "highlight", icon: <Highlighter className="h-4 w-4" />, label: "Highlight" },
  { id: "signature", icon: <PenTool className="h-4 w-4" />, label: "Sign" },
]

function ExportMenu({
  onExportPDF,
  onExportPNG,
  onExportJPG,
  onExportDOCX,
  dropUp,
}: {
  onExportPDF: () => void
  onExportPNG: () => void
  onExportJPG: () => void
  onExportDOCX: () => void
  dropUp?: boolean
}) {
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  return (
    <div ref={exportRef} className="relative">
      <Tooltip content="Export" side={dropUp ? "top" : "bottom"}>
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
              initial={{ opacity: 0, y: dropUp ? 4 : -4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: dropUp ? 4 : -4, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={`absolute right-0 z-50 bg-card border border-border rounded-xl shadow-xl py-1.5 w-44 overflow-hidden ${
                dropUp ? "bottom-full mb-2" : "top-full mt-2"
              }`}
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
  )
}

export function Toolbar(props: ToolbarProps) {
  const {
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
  } = props

  const showContextual = hasPdf && (activeTool === "draw" || activeTool === "highlight" || activeTool === "text")

  return (
    <>
      {/* ===== DESKTOP: single top bar (hidden on mobile) ===== */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="hidden md:flex mx-4 mt-3 items-center gap-1 px-4 py-2 bg-card border border-border rounded-xl shadow-lg"
      >
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
                className={activeTool === tool.id ? "bg-secondary text-secondary-foreground" : ""}
              >
                {tool.icon}
              </Button>
            </Tooltip>
          </motion.div>
        ))}

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

        <AnimatePresence mode="wait">
          {hasPdf && activeTool === "draw" && (
            <motion.div key="draw-color" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
              <ColorPicker value={drawColor} onChange={onDrawColorChange} />
            </motion.div>
          )}
          {hasPdf && activeTool === "text" && (
            <motion.div key="text-color" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
              <ColorPicker value={textColor} onChange={onTextColorChange} />
            </motion.div>
          )}
          {hasPdf && activeTool === "highlight" && (
            <motion.div key="highlight-color" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
              <ColorPicker value={highlightColor} onChange={onHighlightColorChange} variant="highlight" />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {hasPdf && (activeTool === "draw" || activeTool === "highlight") && (
            <motion.div key="pen-size" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} className="flex items-center gap-1 ml-1">
              {[1, 2, 4, 8].map((size) => (
                <Tooltip key={size} content={`${size}px`}>
                  <button
                    type="button"
                    onClick={() => onPenSizeChange(size)}
                    className={`h-8 w-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${penSize === size ? "bg-secondary text-secondary-foreground" : "hover:bg-accent/50"}`}
                  >
                    <span className="rounded-full bg-foreground" style={{ width: size + 4, height: size + 4 }} />
                  </button>
                </Tooltip>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1" />

        {hasPdf && (
          <>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <motion.span key={currentPage} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 25 }} className="text-sm tabular-nums min-w-16 text-center">
                {currentPage} / {totalPages}
              </motion.span>
              <Button variant="ghost" size="icon" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6 mx-1" />

            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => onScaleChange(Math.round(Math.max(0.25, scale - 0.25) * 100) / 100)} disabled={scale <= 0.25}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground w-10 text-center tabular-nums">
                {Math.round(scale * 100)}%
              </span>
              <Button variant="ghost" size="icon" onClick={() => onScaleChange(Math.round(Math.min(3, scale + 0.25) * 100) / 100)} disabled={scale >= 3}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6 mx-1" />

            <ExportMenu onExportPDF={onExportPDF} onExportPNG={onExportPNG} onExportJPG={onExportJPG} onExportDOCX={onExportDOCX} />

            <Separator orientation="vertical" className="h-6 mx-1" />

            <Tooltip content={isDark ? "Light mode" : "Dark mode"}>
              <Button variant="ghost" size="icon" onClick={onToggleTheme}>
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </Tooltip>

            <Tooltip content="Close PDF">
              <Button variant="ghost" size="icon" onClick={onClosePdf}>
                <X className="h-4 w-4" />
              </Button>
            </Tooltip>
          </>
        )}
      </motion.div>

      {/* ===== MOBILE: top bar (nav + actions) ===== */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="flex md:hidden mx-2 mt-2 items-center gap-1 px-2 py-1.5 bg-card border border-border rounded-xl shadow-lg"
      >
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onOpenFile}>
          <FileUp className="h-4 w-4" />
        </Button>

        {fileName && (
          <span className="text-xs text-muted-foreground px-1 truncate max-w-24">
            {fileName}
          </span>
        )}

        <div className="flex-1" />

        {hasPdf && (
          <>
            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1}>
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs tabular-nums min-w-10 text-center">
                {currentPage}/{totalPages}
              </span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages}>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onScaleChange(Math.round(Math.max(0.25, scale - 0.25) * 100) / 100)} disabled={scale <= 0.25}>
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <span className="text-[10px] text-muted-foreground w-8 text-center tabular-nums">
                {Math.round(scale * 100)}%
              </span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onScaleChange(Math.round(Math.min(3, scale + 0.25) * 100) / 100)} disabled={scale >= 3}>
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
            </div>

            <ExportMenu onExportPDF={onExportPDF} onExportPNG={onExportPNG} onExportJPG={onExportJPG} onExportDOCX={onExportDOCX} />

            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggleTheme}>
              {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </Button>

            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClosePdf}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
      </motion.div>

      {/* ===== MOBILE: bottom bar (tools + contextual) ===== */}
      {hasPdf && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="md:hidden fixed bottom-0 inset-x-0 z-30 pb-[env(safe-area-inset-bottom)]"
        >
          {/* Contextual row (color picker, pen size) — slides up when active */}
          <AnimatePresence>
            {showContextual && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="overflow-hidden"
              >
                <div className="flex items-center justify-center gap-2 px-3 py-2 mx-2 mb-1 bg-card border border-border rounded-xl shadow-lg">
                  {activeTool === "draw" && <ColorPicker value={drawColor} onChange={onDrawColorChange} />}
                  {activeTool === "text" && <ColorPicker value={textColor} onChange={onTextColorChange} />}
                  {activeTool === "highlight" && <ColorPicker value={highlightColor} onChange={onHighlightColorChange} variant="highlight" />}

                  {(activeTool === "draw" || activeTool === "highlight") && (
                    <>
                      <div className="w-px h-5 bg-border" />
                      <div className="flex items-center gap-1">
                        {[1, 2, 4, 8].map((size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => onPenSizeChange(size)}
                            className={`h-8 w-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${penSize === size ? "bg-secondary text-secondary-foreground" : "hover:bg-accent/50"}`}
                          >
                            <span className="rounded-full bg-foreground" style={{ width: size + 4, height: size + 4 }} />
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main tool row */}
          <div className="flex items-center justify-between gap-1 px-2 py-2 mx-2 mb-2 bg-card border border-border rounded-xl shadow-lg">
            {tools.map((tool) => (
              <button
                key={tool.id}
                type="button"
                onClick={() => onToolChange(tool.id)}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeTool === tool.id
                    ? "bg-secondary text-secondary-foreground"
                    : "hover:bg-accent/50"
                }`}
              >
                {tool.icon}
                <span className="text-[10px] text-muted-foreground leading-none">{tool.label}</span>
              </button>
            ))}

            <div className="w-px h-8 bg-border mx-0.5" />

            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={onUndo} disabled={!canUndo}>
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={onRedo} disabled={!canRedo}>
              <Redo2 className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </>
  )
}
