import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@/lib/utils"

const PRESETS = [
  "#000000", "#FFFFFF",
  "#EF4444", "#F97316", "#EAB308", "#22C55E",
  "#3B82F6", "#8B5CF6", "#EC4899", "#6B7280",
]

const HIGHLIGHT_PRESETS = [
  "#FFEB3B", "#FFC107", "#FF9800", "#4CAF50",
  "#00BCD4", "#2196F3", "#E91E63", "#9C27B0",
]

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  variant?: "default" | "highlight"
}

export function ColorPicker({ value, onChange, variant = "default" }: ColorPickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const presets = variant === "highlight" ? HIGHLIGHT_PRESETS : PRESETS

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-lg border border-border flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-ring transition-shadow"
      >
        <motion.span
          key={value}
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          className="w-5 h-5 rounded-md"
          style={{ backgroundColor: value }}
        />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-2 z-50 bg-card border border-border rounded-xl shadow-xl p-3 w-44"
          >
            <div className="grid grid-cols-5 gap-1.5 mb-3">
              {presets.map((color, i) => (
                <motion.button
                  key={color}
                  type="button"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.02, type: "spring", stiffness: 400, damping: 20 }}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    onChange(color)
                    setOpen(false)
                  }}
                  className={cn(
                    "w-7 h-7 rounded-full cursor-pointer border-2",
                    value === color
                      ? "border-ring ring-2 ring-ring/30 scale-110"
                      : "border-transparent"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <span className="text-xs text-muted-foreground">Custom</span>
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="color"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div
                  className="h-7 w-full rounded-md border border-border cursor-pointer"
                  style={{ backgroundColor: value }}
                  onClick={() => inputRef.current?.click()}
                />
              </div>
              <span className="text-xs text-muted-foreground font-mono uppercase">{value}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
