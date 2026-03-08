import * as pdfjsLib from "pdfjs-dist"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString()

export interface PDFPageInfo {
  pageNumber: number
  width: number
  height: number
}

export interface TextAnnotation {
  id: string
  pageIndex: number
  x: number
  y: number
  width: number
  height: number
  text: string
  fontSize: number
  fontFamily: string
  color: string
}

export interface DrawAnnotation {
  id: string
  pageIndex: number
  paths: { x: number; y: number }[][]
  color: string
  lineWidth: number
}

export interface HighlightAnnotation {
  id: string
  pageIndex: number
  paths: { x: number; y: number }[]
  lineWidth: number
  color: string
}

export interface SignatureAnnotation {
  id: string
  pageIndex: number
  x: number
  y: number
  width: number
  height: number
  dataUrl: string
}

export type Annotation =
  | ({ type: "text" } & TextAnnotation)
  | ({ type: "draw" } & DrawAnnotation)
  | ({ type: "highlight" } & HighlightAnnotation)
  | ({ type: "signature" } & SignatureAnnotation)

export async function loadPDF(data: ArrayBuffer) {
  const pdf = await pdfjsLib.getDocument({ data }).promise
  return pdf
}

const IMAGE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"])

export function isImageFile(file: File): boolean {
  return IMAGE_TYPES.has(file.type)
}

export async function imageToPdfBuffer(file: File): Promise<ArrayBuffer> {
  // Convert image to PNG via canvas (needed for WEBP support in pdf-lib)
  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement("canvas")
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext("2d")!
  ctx.drawImage(bitmap, 0, 0)
  bitmap.close()

  const pngDataUrl = canvas.toDataURL("image/png")
  const pngBase64 = pngDataUrl.split(",")[1]
  const pngBytes = Uint8Array.from(atob(pngBase64), (c) => c.charCodeAt(0))

  const pdfDoc = await PDFDocument.create()
  const image = await pdfDoc.embedPng(pngBytes)
  const page = pdfDoc.addPage([image.width, image.height])
  page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height })

  const pdfBytes = await pdfDoc.save()
  return pdfBytes.buffer as ArrayBuffer
}

export async function renderPage(
  pdf: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  scale: number,
  canvas: HTMLCanvasElement
) {
  const page = await pdf.getPage(pageNumber)
  const dpr = window.devicePixelRatio || 1
  const viewport = page.getViewport({ scale: scale * dpr })

  canvas.width = viewport.width
  canvas.height = viewport.height
  canvas.style.width = `${viewport.width / dpr}px`
  canvas.style.height = `${viewport.height / dpr}px`

  const ctx = canvas.getContext("2d")!
  await page.render({ canvasContext: ctx, viewport }).promise

  return { width: viewport.width / dpr, height: viewport.height / dpr }
}

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  return rgb(r, g, b)
}

const FONT_CSS: Record<string, string> = {
  "Inter": "Inter, Helvetica, Arial, sans-serif",
  "Helvetica": "Helvetica, Arial, sans-serif",
  "Times New Roman": "'Times New Roman', Times, serif",
  "Courier New": "'Courier New', Courier, monospace",
  "Georgia": "Georgia, 'Times New Roman', serif",
}

const FONT_MAP: Record<string, typeof StandardFonts[keyof typeof StandardFonts]> = {
  "Inter": StandardFonts.Helvetica,
  "Helvetica": StandardFonts.Helvetica,
  "Times New Roman": StandardFonts.TimesRoman,
  "Courier New": StandardFonts.Courier,
  "Georgia": StandardFonts.TimesRoman,
}

export async function exportToPDF(
  originalBytes: ArrayBuffer,
  annotations: Annotation[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(originalBytes)
  const fontCache = new Map<string, Awaited<ReturnType<typeof pdfDoc.embedFont>>>()

  async function getFont(family: string) {
    const std = FONT_MAP[family] || StandardFonts.Helvetica
    if (!fontCache.has(std)) {
      fontCache.set(std, await pdfDoc.embedFont(std))
    }
    return fontCache.get(std)!
  }

  const pages = pdfDoc.getPages()

  for (const annotation of annotations) {
    const page = pages[annotation.pageIndex]
    if (!page) continue
    const { height: pageHeight } = page.getSize()

    if (annotation.type === "text") {
      const font = await getFont(annotation.fontFamily || "Inter")
      page.drawText(annotation.text, {
        x: annotation.x,
        y: pageHeight - annotation.y - annotation.fontSize,
        size: annotation.fontSize,
        font,
        color: hexToRgb(annotation.color),
      })
    } else if (annotation.type === "highlight") {
      const pts = annotation.paths
      for (let i = 1; i < pts.length; i++) {
        page.drawLine({
          start: { x: pts[i - 1].x, y: pageHeight - pts[i - 1].y },
          end: { x: pts[i].x, y: pageHeight - pts[i].y },
          thickness: annotation.lineWidth,
          color: hexToRgb(annotation.color),
          opacity: 0.3,
        })
      }
    } else if (annotation.type === "draw") {
      for (const path of annotation.paths) {
        for (let i = 1; i < path.length; i++) {
          const from = path[i - 1]
          const to = path[i]
          page.drawLine({
            start: { x: from.x, y: pageHeight - from.y },
            end: { x: to.x, y: pageHeight - to.y },
            thickness: annotation.lineWidth,
            color: hexToRgb(annotation.color),
          })
        }
      }
    } else if (annotation.type === "signature") {
      const pngData = annotation.dataUrl
      const imageBytes = Uint8Array.from(atob(pngData.split(",")[1]), (c) =>
        c.charCodeAt(0)
      )
      const image = await pdfDoc.embedPng(imageBytes)
      page.drawImage(image, {
        x: annotation.x,
        y: pageHeight - annotation.y - annotation.height,
        width: annotation.width,
        height: annotation.height,
      })
    }
  }

  const bytes = await pdfDoc.save()
  return bytes
}

export async function exportToPNG(
  pdf: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  scale: number = 2,
  annotations: Annotation[] = []
): Promise<Blob> {
  const page = await pdf.getPage(pageNumber)
  const viewport = page.getViewport({ scale })

  const canvas = document.createElement("canvas")
  canvas.width = viewport.width
  canvas.height = viewport.height

  const ctx = canvas.getContext("2d")!
  await page.render({ canvasContext: ctx, viewport }).promise

  // Draw annotations
  const pageAnnotations = annotations.filter((a) => a.pageIndex === pageNumber - 1)

  for (const a of pageAnnotations) {
    if (a.type === "text") {
      const cssFont = FONT_CSS[a.fontFamily] || FONT_CSS["Inter"]
      ctx.font = `${a.fontSize * scale}px ${cssFont}`
      ctx.fillStyle = a.color
      ctx.fillText(a.text, a.x * scale, a.y * scale + a.fontSize * scale)
    } else if (a.type === "highlight") {
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
      await new Promise<void>((resolve) => {
        const img = new Image()
        img.onload = () => {
          ctx.drawImage(img, a.x * scale, a.y * scale, a.width * scale, a.height * scale)
          resolve()
        }
        img.onerror = () => resolve()
        img.src = a.dataUrl
      })
    }
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), "image/png")
  })
}

export async function exportToJPG(
  pdf: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  scale: number = 2,
  annotations: Annotation[] = []
): Promise<Blob> {
  // Reuse PNG export logic to render onto canvas, then export as JPEG
  const page = await pdf.getPage(pageNumber)
  const viewport = page.getViewport({ scale })

  const canvas = document.createElement("canvas")
  canvas.width = viewport.width
  canvas.height = viewport.height

  const ctx = canvas.getContext("2d")!
  // Fill white background for JPG (no transparency)
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  await page.render({ canvasContext: ctx, viewport }).promise

  const pageAnnotations = annotations.filter((a) => a.pageIndex === pageNumber - 1)

  for (const a of pageAnnotations) {
    if (a.type === "text") {
      const cssFont = FONT_CSS[a.fontFamily] || FONT_CSS["Inter"]
      ctx.font = `${a.fontSize * scale}px ${cssFont}`
      ctx.fillStyle = a.color
      ctx.fillText(a.text, a.x * scale, a.y * scale + a.fontSize * scale)
    } else if (a.type === "highlight") {
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
      await new Promise<void>((resolve) => {
        const img = new Image()
        img.onload = () => {
          ctx.drawImage(img, a.x * scale, a.y * scale, a.width * scale, a.height * scale)
          resolve()
        }
        img.onerror = () => resolve()
        img.src = a.dataUrl
      })
    }
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.92)
  })
}
