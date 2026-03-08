import { useState, useCallback, useRef, useEffect } from "react"
import type { PDFDocumentProxy } from "pdfjs-dist"
import { loadPDF, type Annotation } from "@/lib/pdf-engine"
import { saveSession, loadSession, clearSession } from "@/lib/persistence"

export type Tool = "select" | "text" | "draw" | "highlight" | "signature"

interface HistoryState {
  annotations: Annotation[]
  undoStack: Annotation[][]
  redoStack: Annotation[][]
}

export function usePDF() {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [scale, setScale] = useState(1.2)
  const [fileName, setFileName] = useState("")
  const [history, setHistory] = useState<HistoryState>({
    annotations: [],
    undoStack: [],
    redoStack: [],
  })
  const [activeTool, setActiveTool] = useState<Tool>("select")
  const [drawColor, setDrawColor] = useState("#FFFFFF")
  const [textColor, setTextColor] = useState("#FFFFFF")
  const [highlightColor, setHighlightColor] = useState("#FFEB3B")
  const [penSize, setPenSize] = useState(2)
  const fileDataRef = useRef<ArrayBuffer | null>(null)

  const openFile = useCallback(async (file: File) => {
    const buffer = await file.arrayBuffer()
    fileDataRef.current = buffer.slice(0)
    const pdfDoc = await loadPDF(buffer)
    setPdf(pdfDoc)
    setTotalPages(pdfDoc.numPages)
    setCurrentPage(1)
    setFileName(file.name)
    setHistory({ annotations: [], undoStack: [], redoStack: [] })
    setActiveTool("select")
  }, [])

  const closePdf = useCallback(() => {
    setPdf(null)
    setTotalPages(0)
    setCurrentPage(1)
    setFileName("")
    setHistory({ annotations: [], undoStack: [], redoStack: [] })
    setActiveTool("select")
    fileDataRef.current = null
    clearSession()
  }, [])

  // Restore session on mount
  const restoredRef = useRef(false)
  useEffect(() => {
    if (restoredRef.current) return
    restoredRef.current = true

    loadSession().then(async (session) => {
      if (!session) return
      try {
        const buffer = session.fileData
        fileDataRef.current = buffer.slice(0)
        const pdfDoc = await loadPDF(buffer)
        setPdf(pdfDoc)
        setTotalPages(pdfDoc.numPages)
        setCurrentPage(session.currentPage)
        setScale(session.scale)
        setFileName(session.fileName)
        setHistory({
          annotations: session.annotations,
          undoStack: [],
          redoStack: [],
        })
      } catch (e) {
        console.warn("Failed to restore session:", e)
        clearSession()
      }
    })
  }, [])

  const goToPage = useCallback(
    (page: number) => {
      if (page >= 1 && page <= totalPages) {
        setCurrentPage(page)
      }
    },
    [totalPages]
  )

  const addAnnotation = useCallback((annotation: Annotation) => {
    setHistory((prev) => ({
      annotations: [...prev.annotations, annotation],
      undoStack: [...prev.undoStack, prev.annotations],
      redoStack: [],
    }))
  }, [])

  const removeAnnotation = useCallback((id: string) => {
    setHistory((prev) => ({
      annotations: prev.annotations.filter((a) => a.id !== id),
      undoStack: [...prev.undoStack, prev.annotations],
      redoStack: [],
    }))
  }, [])

  const updateAnnotation = useCallback((id: string, updates: Partial<Annotation>) => {
    setHistory((prev) => ({
      annotations: prev.annotations.map((a) =>
        a.id === id ? { ...a, ...updates } as Annotation : a
      ),
      undoStack: [...prev.undoStack, prev.annotations],
      redoStack: [],
    }))
  }, [])

  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.undoStack.length === 0) return prev
      const newUndoStack = [...prev.undoStack]
      const restored = newUndoStack.pop()!
      return {
        annotations: restored,
        undoStack: newUndoStack,
        redoStack: [...prev.redoStack, prev.annotations],
      }
    })
  }, [])

  const redo = useCallback(() => {
    setHistory((prev) => {
      if (prev.redoStack.length === 0) return prev
      const newRedoStack = [...prev.redoStack]
      const restored = newRedoStack.pop()!
      return {
        annotations: restored,
        undoStack: [...prev.undoStack, prev.annotations],
        redoStack: newRedoStack,
      }
    })
  }, [])

  // Auto-save to IndexedDB on changes (debounced)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!fileDataRef.current || !fileName) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      if (fileDataRef.current) {
        saveSession({
          fileData: fileDataRef.current,
          fileName,
          annotations: history.annotations,
          currentPage,
          scale,
        })
      }
    }, 500)
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [history.annotations, currentPage, scale, fileName])

  return {
    pdf,
    currentPage,
    totalPages,
    scale,
    setScale,
    fileName,
    annotations: history.annotations,
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
    canUndo: history.undoStack.length > 0,
    canRedo: history.redoStack.length > 0,
    fileData: fileDataRef,
  }
}
