import { useRef, useState, useCallback, useEffect } from "react"
import { AnimatePresence, motion } from "motion/react"
import { usePDF } from "@/hooks/usePDF"
import { Toolbar } from "@/components/Toolbar"
import { PDFViewer } from "@/components/PDFViewer"
import { LandingPage } from "@/components/LandingPage"
import { SignaturePad } from "@/components/SignaturePad"
import { TextEditor } from "@/components/TextEditor"
import { exportToPDF, exportToPNG, exportToJPG, type TextAnnotation } from "@/lib/pdf-engine"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { exportToDocx } from "@/lib/export-docx"
import { saveAs } from "file-saver"
import { Loader2 } from "lucide-react"

declare const __COMMIT_HASH__: string

export default function App() {
  const {
    pdf,
    currentPage,
    totalPages,
    scale,
    setScale,
    fileName,
    annotations,
    activeTool,
    setActiveTool,
    drawColor,
    setDrawColor,
    textColor,
    setTextColor,
    highlightColor,
    setHighlightColor,
    penSize,
    setPenSize,
    openFile,
    closePdf,
    goToPage,
    addAnnotation,
    removeAnnotation,
    updateAnnotation,
    undo,
    redo,
    canUndo,
    canRedo,
    fileData,
  } = usePDF()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showSignaturePad, setShowSignaturePad] = useState(false)
  const [pendingSignature, setPendingSignature] = useState<string | null>(null)
  const [viewerReady, setViewerReady] = useState(false)
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const [pendingAction, setPendingAction] = useState<"close" | "open" | null>(null)
  const [isDark, setIsDark] = useState(true)

  // Text editing state
  const [showTextEditor, setShowTextEditor] = useState(false)
  const [textPlacement, setTextPlacement] = useState<{ x: number; y: number } | null>(null)
  const [pendingText, setPendingText] = useState<({ type: "text" } & TextAnnotation) | null>(null)
  const [editingTextAnnotation, setEditingTextAnnotation] = useState<({ type: "text" } & TextAnnotation) | null>(null)

  // Apply theme class to document
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark)
    document.documentElement.classList.toggle("light", !isDark)
  }, [isDark])

  const handleToggleTheme = useCallback(() => {
    setIsDark((prev) => !prev)
  }, [])

  const handleClosePdf = useCallback(() => {
    if (annotations.length > 0) {
      setPendingAction("close")
      setShowCloseConfirm(true)
    } else {
      closePdf()
    }
  }, [annotations, closePdf])

  const handleOpenFileWithConfirm = useCallback(() => {
    if (pdf && annotations.length > 0) {
      setPendingAction("open")
      setShowCloseConfirm(true)
    } else {
      fileInputRef.current?.click()
    }
  }, [pdf, annotations])

  const handleConfirmAction = useCallback(() => {
    setShowCloseConfirm(false)
    if (pendingAction === "close") {
      closePdf()
    } else if (pendingAction === "open") {
      fileInputRef.current?.click()
    }
    setPendingAction(null)
  }, [pendingAction, closePdf])

  // When PDF loads, show spinner then reveal viewer after toolbar animates in
  useEffect(() => {
    if (pdf) {
      setViewerReady(false)
      const timer = setTimeout(() => setViewerReady(true), 600)
      return () => clearTimeout(timer)
    } else {
      setViewerReady(false)
    }
  }, [pdf])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key === "z" && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if (mod && e.key === "z" && e.shiftKey) {
        e.preventDefault()
        redo()
      } else if (mod && e.key === "y") {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [undo, redo])

  // Open signature pad automatically when sign tool is selected
  useEffect(() => {
    if (activeTool === "signature") {
      setShowSignaturePad(true)
    }
  }, [activeTool])

  const handleOpenFile = useCallback(() => {
    handleOpenFileWithConfirm()
  }, [handleOpenFileWithConfirm])

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) openFile(file)
      e.target.value = ""
    },
    [openFile]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file && file.type === "application/pdf") {
        openFile(file)
      }
    },
    [openFile]
  )

  const handleExportPDF = useCallback(async () => {
    if (!fileData.current) return
    try {
      const bytes = await exportToPDF(fileData.current, annotations)
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" })
      saveAs(blob, fileName.replace(".pdf", "") + "_edited.pdf")
    } catch (e) {
      console.error("PDF export failed:", e)
    }
  }, [fileData, annotations, fileName])

  const handleExportPNG = useCallback(async () => {
    if (!pdf) return
    try {
      const blob = await exportToPNG(pdf, currentPage, 2, annotations)
      saveAs(blob, `${fileName.replace(".pdf", "")}_page${currentPage}.png`)
    } catch (e) {
      console.error("PNG export failed:", e)
    }
  }, [pdf, currentPage, fileName, annotations])

  const handleExportJPG = useCallback(async () => {
    if (!pdf) return
    try {
      const blob = await exportToJPG(pdf, currentPage, 2, annotations)
      saveAs(blob, `${fileName.replace(".pdf", "")}_page${currentPage}.jpg`)
    } catch (e) {
      console.error("JPG export failed:", e)
    }
  }, [pdf, currentPage, fileName, annotations])

  const handleExportDOCX = useCallback(async () => {
    if (!pdf) return
    try {
      const blob = await exportToDocx(pdf)
      saveAs(blob, fileName.replace(".pdf", "") + ".docx")
    } catch (e) {
      console.error("DOCX export failed:", e)
    }
  }, [pdf, fileName])

  // New text: click on page -> TextEditor opens -> creates pending text for dragging
  const handleRequestTextEditor = useCallback((x: number, y: number) => {
    setTextPlacement({ x, y })
    setShowTextEditor(true)
    setEditingTextAnnotation(null)
  }, [])

  // Save from text editor (new text)
  const handleTextSave = useCallback(
    (_html: string, plainText: string, fontFamily: string, fontSize: number) => {
      if (editingTextAnnotation) {
        // Editing existing annotation
        updateAnnotation(editingTextAnnotation.id, {
          text: plainText,
          fontFamily,
          fontSize,
          color: textColor,
        })
        setEditingTextAnnotation(null)
        setActiveTool("select")
      } else if (textPlacement) {
        // New text annotation - create pending text for drag placement
        const newAnnotation: { type: "text" } & TextAnnotation = {
          type: "text",
          id: crypto.randomUUID(),
          pageIndex: currentPage - 1,
          x: textPlacement.x,
          y: textPlacement.y,
          width: 150,
          height: Math.max(fontSize * 1.5, 24),
          text: plainText,
          fontSize,
          fontFamily,
          color: textColor,
        }
        setPendingText(newAnnotation)
        setActiveTool("select")
      }
      setShowTextEditor(false)
      setTextPlacement(null)
    },
    [textPlacement, currentPage, textColor, editingTextAnnotation, updateAnnotation, setActiveTool]
  )

  // Edit existing text annotation
  const handleRequestEditText = useCallback((annotation: { type: "text" } & TextAnnotation) => {
    setEditingTextAnnotation(annotation)
    setTextPlacement(null)
    setShowTextEditor(true)
  }, [])

  return (
    <div
      className="h-screen flex flex-col"
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      <AnimatePresence>
        {pdf && (
          <Toolbar
            fileName={fileName}
            currentPage={currentPage}
            totalPages={totalPages}
            scale={scale}
            activeTool={activeTool}
            drawColor={drawColor}
            textColor={textColor}
            highlightColor={highlightColor}
            onOpenFile={handleOpenFile}
            onPageChange={goToPage}
            onScaleChange={setScale}
            onToolChange={setActiveTool}
            onDrawColorChange={setDrawColor}
            onTextColorChange={setTextColor}
            onHighlightColorChange={setHighlightColor}
            penSize={penSize}
            onPenSizeChange={setPenSize}
            onExportPDF={handleExportPDF}
            onExportPNG={handleExportPNG}
            onExportJPG={handleExportJPG}
            onExportDOCX={handleExportDOCX}
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
            hasPdf={!!pdf}
            onClosePdf={handleClosePdf}
            isDark={isDark}
            onToggleTheme={handleToggleTheme}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!pdf ? (
          <LandingPage key="empty" onOpenFile={handleOpenFile} isDragging={isDragging} isDark={isDark} onToggleTheme={handleToggleTheme} />
        ) : !viewerReady ? (
          <motion.div
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col items-center justify-center gap-3 bg-background"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            >
              <Loader2 className="h-8 w-8 text-muted-foreground" />
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-sm text-muted-foreground"
            >
              Loading document...
            </motion.p>
          </motion.div>
        ) : (
          <motion.div
            key="viewer"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex-1 flex flex-col min-h-0"
          >
            <PDFViewer
              pdf={pdf}
              currentPage={currentPage}
              scale={scale}
              annotations={annotations}
              activeTool={activeTool}
              drawColor={drawColor}
              highlightColor={highlightColor}
              penSize={penSize}
              onAddAnnotation={addAnnotation}
              onUpdateAnnotation={updateAnnotation}
              onRemoveAnnotation={removeAnnotation}
              onRequestSignature={() => setShowSignaturePad(true)}
              onRequestTextEditor={handleRequestTextEditor}
              onRequestEditText={handleRequestEditText}
              pendingSignature={pendingSignature}
              onSignaturePlaced={() => setPendingSignature(null)}
              pendingText={pendingText}
              onTextPlaced={() => setPendingText(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSignaturePad && (
          <SignaturePad
            onSave={(dataUrl) => {
              setPendingSignature(dataUrl)
              setShowSignaturePad(false)
              setActiveTool("select")
            }}
            onCancel={() => {
              setShowSignaturePad(false)
              setActiveTool("select")
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTextEditor && (
          <TextEditor
            onSave={handleTextSave}
            onCancel={() => {
              setShowTextEditor(false)
              setTextPlacement(null)
              setEditingTextAnnotation(null)
            }}
            initialColor={textColor}
            initialText={editingTextAnnotation?.text}
            initialFontFamily={editingTextAnnotation?.fontFamily}
            initialFontSize={editingTextAnnotation?.fontSize}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCloseConfirm && (
          <ConfirmDialog
            title="Unsaved changes"
            message="You have unsaved annotations. Are you sure you want to continue? All changes will be lost."
            confirmLabel="Discard changes"
            cancelLabel="Cancel"
            onConfirm={handleConfirmAction}
            onCancel={() => {
              setShowCloseConfirm(false)
              setPendingAction(null)
            }}
          />
        )}
      </AnimatePresence>

      {pdf && viewerReady && (
        <div className="fixed bottom-2 left-3 text-[10px] text-muted-foreground/50 font-mono select-text pointer-events-none z-10">
          {__COMMIT_HASH__}
        </div>
      )}
    </div>
  )
}
