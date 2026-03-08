import { useRef, useState, useEffect } from "react"
import * as Popover from "@radix-ui/react-popover"
import { motion } from "motion/react"
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
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const presets = variant === "highlight" ? HIGHLIGHT_PRESETS : PRESETS

  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    window.addEventListener("resize", close)
    return () => window.removeEventListener("resize", close)
  }, [open])

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-8 h-8 rounded-lg border border-border flex items-center justify-center cursor-pointer transition-shadow"
        >
          <motion.span
            key={value}
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            className="w-5 h-5 rounded-md"
            style={{ backgroundColor: value }}
          />
        </motion.button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          side="top"
          sideOffset={8}
          align="center"
          collisionPadding={12}
          className="z-50 bg-card border border-border rounded-xl shadow-xl p-3 w-44 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
        >
          <div className="grid grid-cols-5 gap-1.5 mb-3">
            {presets.map((color) => (
              <Popover.Close key={color} asChild>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onChange(color)}
                  className={cn(
                    "w-7 h-7 rounded-full cursor-pointer border-2",
                    value === color
                      ? "border-foreground scale-110"
                      : "border-transparent"
                  )}
                  style={{ backgroundColor: color }}
                />
              </Popover.Close>
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
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
