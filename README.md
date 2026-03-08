# StellarPDF

A fully client-side PDF reader, editor, and signer. No backend, no uploads — everything runs in your browser.

## Features

- **PDF Viewing** — High-DPI rendering powered by pdfjs-dist with zoom and page navigation
- **Freehand Drawing** — Draw on any page with configurable pen color and thickness
- **Text Annotations** — Place text anywhere on a PDF with a rich text editor
- **Highlighter** — Semi-transparent highlight strokes with adjustable color and size
- **Signatures** — Draw and place signatures with a dedicated signature pad (color and size picker included)
- **Image Support** — Open JPG, PNG, and WEBP files (auto-converted to PDF)
- **Export** — Save as PDF (with annotations baked in), PNG, JPG, or DOCX
- **Undo / Redo** — Full history stack with keyboard shortcuts (`Ctrl+Z` / `Ctrl+Shift+Z`)
- **Session Persistence** — Work survives page refreshes via IndexedDB (no server needed)
- **Offline Ready** — Installable PWA with service worker caching
- **Dark / Light Mode** — Toggle between themes

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Build | Vite 7 |
| Styling | Tailwind CSS v4 |
| PDF Rendering | pdfjs-dist 4.9 |
| PDF Manipulation | pdf-lib |
| Rich Text | Tiptap |
| Animations | Motion (Framer Motion) |
| Icons | Lucide React |
| PWA | vite-plugin-pwa + Workbox |

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Install & Run

```bash
git clone https://github.com/StellarStackOSS/StellarPDF.git
cd StellarPDF
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

The production build outputs to `dist/` and includes the PWA service worker.

## Project Structure

```
src/
├── components/
│   ├── ui/              # Base UI primitives (Button, Tooltip, ColorPicker, etc.)
│   ├── ConfirmDialog.tsx # Unsaved changes confirmation
│   ├── DraggableSignature.tsx
│   ├── LandingPage.tsx  # Marketing landing page
│   ├── PDFViewer.tsx    # Canvas-based PDF viewer with annotation overlay
│   ├── SignaturePad.tsx # Signature drawing modal
│   ├── TextEditor.tsx   # Tiptap rich text editor modal
│   └── Toolbar.tsx      # Floating toolbar with tools, navigation, export
├── hooks/
│   └── usePDF.ts        # Central PDF state management
├── lib/
│   ├── export-docx.ts   # PDF-to-DOCX conversion
│   ├── pdf-engine.ts    # PDF loading, rendering, and export (PDF/PNG/JPG)
│   ├── persistence.ts   # IndexedDB session storage
│   └── utils.ts         # Utility functions (cn, etc.)
└── App.tsx              # Root component
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` | Redo |
| `Ctrl/Cmd + Y` | Redo |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT
