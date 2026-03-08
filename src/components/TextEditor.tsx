import { useCallback, useState } from "react"
import { motion } from "motion/react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import { TextStyle } from "@tiptap/extension-text-style"
import Color from "@tiptap/extension-color"
import Highlight from "@tiptap/extension-highlight"
import { Button } from "@/components/ui/button"
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Highlighter,
  List,
  ListOrdered,
  X,
  Check,
  ChevronDown,
} from "lucide-react"

const FONTS = [
  { label: "Inter", value: "Inter" },
  { label: "Helvetica", value: "Helvetica" },
  { label: "Times New Roman", value: "Times New Roman" },
  { label: "Courier New", value: "Courier New" },
  { label: "Georgia", value: "Georgia" },
]

interface TextEditorProps {
  onSave: (html: string, plainText: string, fontFamily: string, fontSize: number) => void
  onCancel: () => void
  initialColor?: string
  initialText?: string
  initialFontFamily?: string
  initialFontSize?: number
}

export function TextEditor({
  onSave,
  onCancel,
  initialColor = "#000000",
  initialText = "",
  initialFontFamily = "Inter",
  initialFontSize = 14,
}: TextEditorProps) {
  const [fontFamily, setFontFamily] = useState(initialFontFamily)
  const [fontSize, setFontSize] = useState(initialFontSize)
  const [showFontMenu, setShowFontMenu] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
    ],
    content: initialText ? `<p>${initialText.replace(/\n/g, "</p><p>")}</p>` : "<p></p>",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[120px] p-3",
      },
    },
  })

  const handleSave = useCallback(() => {
    if (!editor) return
    const html = editor.getHTML()
    const plainText = editor.getText()
    if (plainText.trim()) {
      onSave(html, plainText, fontFamily, fontSize)
    }
  }, [editor, onSave, fontFamily, fontSize])

  if (!editor) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="bg-card text-card-foreground rounded-xl shadow-2xl w-full max-w-lg mx-4"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-sm font-semibold">{initialText ? "Edit Text" : "Add Text"}</h3>
          <Button variant="ghost" size="icon" onClick={onCancel} className="h-7 w-7">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-0.5 px-3 py-2 border-b flex-wrap">
          {/* Font selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFontMenu(!showFontMenu)}
              className="flex items-center gap-1 h-7 px-2 rounded text-xs hover:bg-accent transition-colors cursor-pointer border border-border"
              style={{ fontFamily }}
            >
              {fontFamily}
              <ChevronDown className="h-3 w-3" />
            </button>
            {showFontMenu && (
              <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-50 py-1 min-w-[160px]">
                {FONTS.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => {
                      setFontFamily(f.value)
                      setShowFontMenu(false)
                    }}
                    className={`w-full text-left px-3 py-1.5 text-sm hover:bg-accent transition-colors cursor-pointer ${
                      fontFamily === f.value ? "bg-secondary text-secondary-foreground" : ""
                    }`}
                    style={{ fontFamily: f.value }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Font size */}
          <div className="flex items-center border border-border rounded h-7 overflow-hidden">
            <button
              type="button"
              onClick={() => setFontSize((s) => Math.max(8, s - 2))}
              className="px-1.5 h-full hover:bg-accent transition-colors cursor-pointer text-xs"
            >
              -
            </button>
            <span className="text-xs px-1.5 min-w-[28px] text-center">{fontSize}</span>
            <button
              type="button"
              onClick={() => setFontSize((s) => Math.min(72, s + 2))}
              className="px-1.5 h-full hover:bg-accent transition-colors cursor-pointer text-xs"
            >
              +
            </button>
          </div>

          <div className="w-px h-5 bg-border mx-1" />

          <Button
            variant={editor.isActive("bold") ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7"
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={editor.isActive("italic") ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7"
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={editor.isActive("underline") ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={editor.isActive("strike") ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7"
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <Strikethrough className="h-3.5 w-3.5" />
          </Button>

          <div className="w-px h-5 bg-border mx-1" />

          <input
            type="color"
            value={initialColor}
            onChange={(e) =>
              editor.chain().focus().setColor(e.target.value).run()
            }
            className="w-6 h-6 rounded cursor-pointer border border-input"
            title="Text color"
          />
          <Button
            variant={editor.isActive("highlight") ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7"
            onClick={() =>
              editor.chain().focus().toggleHighlight({ color: "#FFEB3B" }).run()
            }
          >
            <Highlighter className="h-3.5 w-3.5" />
          </Button>

          <div className="w-px h-5 bg-border mx-1" />

          <Button
            variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={editor.isActive("orderedList") ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Editor */}
        <div className="border-b">
          <EditorContent editor={editor} />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 px-4 py-3">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            <Check className="h-3.5 w-3.5 mr-1" />
            {initialText ? "Update Text" : "Place Text"}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
