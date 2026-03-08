import { motion } from "motion/react"
import { FileUp } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  onOpenFile: () => void
  isDragging: boolean
}

export function EmptyState({ onOpenFile, isDragging }: EmptyStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center bg-background">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className={`flex flex-col items-center gap-6 p-12 rounded-2xl border-2 border-dashed transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border"
        }`}
      >
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center"
        >
          <motion.div
            animate={isDragging ? { y: [0, -6, 0] } : {}}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            <FileUp className="h-8 w-8 text-muted-foreground" />
          </motion.div>
        </motion.div>
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <h2 className="text-xl font-semibold mb-1">Open a PDF</h2>
          <p className="text-sm text-muted-foreground">
            Drag & drop a file here, or click to browse
          </p>
        </motion.div>
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Button onClick={onOpenFile} size="lg">
            Choose File
          </Button>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-xs text-muted-foreground"
        >
          Everything runs locally in your browser. No uploads, no servers.
        </motion.p>
      </motion.div>
    </div>
  )
}
