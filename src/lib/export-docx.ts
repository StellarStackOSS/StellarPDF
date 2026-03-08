import * as pdfjsLib from "pdfjs-dist"
import {
  Document,
  Paragraph,
  TextRun,
  Packer,
} from "docx"

export async function exportToDocx(
  pdf: pdfjsLib.PDFDocumentProxy
): Promise<Blob> {
  const paragraphs: Paragraph[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()

    if (i > 1) {
      paragraphs.push(new Paragraph({ children: [] }))
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `--- Page ${i} ---`,
              bold: true,
              size: 24,
            }),
          ],
        })
      )
      paragraphs.push(new Paragraph({ children: [] }))
    }

    let currentY: number | null = null
    let currentRuns: TextRun[] = []

    for (const item of textContent.items) {
      if (!("str" in item)) continue
      const textItem = item as { str: string; transform: number[] }
      const y = Math.round(textItem.transform[5])

      if (currentY !== null && Math.abs(y - currentY) > 5) {
        if (currentRuns.length > 0) {
          paragraphs.push(new Paragraph({ children: currentRuns }))
          currentRuns = []
        }
      }

      currentY = y
      if (textItem.str.trim()) {
        currentRuns.push(new TextRun({ text: textItem.str }))
      }
    }

    if (currentRuns.length > 0) {
      paragraphs.push(new Paragraph({ children: currentRuns }))
    }
  }

  const doc = new Document({
    sections: [{ children: paragraphs }],
  })

  return Packer.toBlob(doc)
}
