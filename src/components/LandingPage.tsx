import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  FileUp,
  FileText,
  PenTool,
  Download,
  Shield,
  Pencil,
  Highlighter,
  Github,
  X,
  Sun,
  Moon,
  Type,
  ChevronDown,
} from "lucide-react"

interface LandingPageProps {
  onOpenFile: () => void
  isDragging: boolean
  isDark: boolean
  onToggleTheme: () => void
}

function FAQItem({ question, answer, index }: { question: string; answer: string; index: number }) {
  const [open, setOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ margin: "-40px", once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="rounded-2xl border border-white/5 bg-white/[0.02]"
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full cursor-pointer items-center justify-between px-6 py-5 text-left"
      >
        <span className="text-sm font-medium text-white">{question}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 text-neutral-500"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0, scale: 0.97 }}
            animate={{ height: "auto", opacity: 1, scale: 1 }}
            exit={{ height: 0, opacity: 0, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 24 }}
            className="overflow-hidden origin-top"
          >
            <p className="px-6 pb-5 text-sm leading-relaxed text-neutral-500">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

const features = [
  {
    icon: FileText,
    title: "Read PDFs",
    description: "Fast, high-quality PDF rendering with smooth page navigation and zoom controls. Retina-ready.",
  },
  {
    icon: Pencil,
    title: "Draw & Annotate",
    description: "Freehand drawing with customizable colors and pen thickness directly on your documents.",
  },
  {
    icon: Highlighter,
    title: "Highlight Text",
    description: "Highlight important sections with a natural pen-like highlighter tool. Multiple colors supported.",
  },
  {
    icon: PenTool,
    title: "Sign Documents",
    description: "Draw your signature with transparent background and place it anywhere. Drag and resize to fit.",
  },
  {
    icon: Type,
    title: "Add Text",
    description: "Place rich text anywhere on your PDF with customizable fonts, sizes, and colors.",
  },
  {
    icon: Download,
    title: "Export Anywhere",
    description: "Export as PDF with annotations baked in, or convert to PNG and DOCX formats.",
  },
]

const featureSections = [
  {
    title: "Document Tools",
    subtitle: "Everything you need to work with PDFs, right in your browser.",
    features: features.slice(0, 3),
  },
  {
    title: "Annotation & Signing",
    subtitle: "Mark up, sign, and personalize your documents with ease.",
    features: features.slice(3, 6),
  },
]

export function LandingPage({ onOpenFile, isDragging, isDark, onToggleTheme }: LandingPageProps) {
  const [showModal, setShowModal] = useState<"tos" | "privacy" | null>(null)

  return (
    <div className="isolate relative min-h-screen text-white overflow-auto" style={{ backgroundColor: isDark ? "#0a0a0a" : "#fafafa" }}>
      {/* Grid Lines */}
      <div className="pointer-events-none fixed inset-0 z-[-1] mx-auto flex max-w-7xl justify-between px-6 [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_60%,transparent)]">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-full w-px" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.04)" }} />
        ))}
      </div>

      {/* Navbar */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="sticky top-0 z-50 backdrop-blur-xl"
        style={{
          borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)"}`,
          backgroundColor: isDark ? "rgba(10,10,10,0.8)" : "rgba(250,250,250,0.8)",
        }}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-10">
            <a href="/" className="font-serif text-xl tracking-tight" style={{ color: isDark ? "#fff" : "#111" }}>
              StellarPDF
            </a>
            <div className="hidden items-center gap-1 md:flex">
              {[
                { label: "Features", href: "#features" },
                { label: "FAQ", href: "#faq" },
              ].map((link, i) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}
                  className="rounded-md px-3 py-1.5 text-sm transition-colors"
                  style={{ color: isDark ? "#a3a3a3" : "#737373" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = isDark ? "#fff" : "#111")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = isDark ? "#a3a3a3" : "#737373")}
                >
                  {link.label}
                </motion.a>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onToggleTheme}
              className="transition-colors cursor-pointer"
              style={{ color: isDark ? "#a3a3a3" : "#737373" }}
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <a
              href="https://github.com/StellarStackOSS/StellarPDF"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors"
              style={{ color: isDark ? "#a3a3a3" : "#737373" }}
            >
              <Github className="h-5 w-5" />
            </a>
            <button
              onClick={onOpenFile}
              className="flex items-center gap-2 rounded-full px-5 py-1.5 text-sm font-semibold cursor-pointer transition-colors"
              style={{
                backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
                color: isDark ? "#d4d4d4" : "#333",
              }}
            >
              <FileUp className="h-4 w-4" />
              Open PDF
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Hero */}
      <main className="relative mx-auto max-w-7xl px-6">
        <section className="flex flex-col items-center pt-16 pb-12 text-center md:pt-20">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mb-6"
          >
            <span
              className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium backdrop-blur-xl"
              style={{
                borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)",
                backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                color: isDark ? "#d4d4d4" : "#555",
                boxShadow: isDark ? "inset 0 1px 0 0 rgba(255,255,255,0.1)" : "inset 0 1px 0 0 rgba(255,255,255,0.5)",
              }}
            >
              <Shield className="h-3 w-3" />
              100% client-side &mdash; your files never leave your browser
            </span>
          </motion.div>

          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="max-w-4xl font-serif text-5xl font-light leading-[1.1] tracking-tight md:text-7xl md:leading-[1.08] gradient-text"
          >
            Read, edit & sign
            <br className="hidden md:block" />{" "}
            your PDFs — beautifully,
            <br className="hidden md:block" />{" "}
            privately, for free
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="mt-7 max-w-2xl text-lg leading-relaxed md:text-xl"
            style={{ color: isDark ? "#a3a3a3" : "#737373" }}
          >
            A powerful PDF tool that runs entirely in your browser. No sign-ups,
            no uploads, no subscriptions. Open source and free — always.
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <button
              onClick={onOpenFile}
              className="flex items-center gap-2 rounded-full px-7 py-2.5 text-sm font-semibold cursor-pointer transition-colors"
              style={{
                backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
                color: isDark ? "#d4d4d4" : "#333",
              }}
            >
              <FileUp className="h-4 w-4" />
              Open a PDF
            </button>
            <a
              href="https://github.com/StellarStackOSS/StellarPDF"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full border px-7 py-2.5 text-sm font-semibold transition-colors"
              style={{
                borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)",
                color: isDark ? "#fff" : "#333",
              }}
            >
              <Github className="h-4 w-4" />
              Star on GitHub
            </a>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-5 text-xs"
            style={{ color: isDark ? "#525252" : "#a3a3a3" }}
          >
            Works in any modern browser &mdash; no installation required
          </motion.p>
        </section>

        {/* Features */}
        <section id="features" className="space-y-20 pb-24">
          {featureSections.map((section, si) => (
            <div key={section.title}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ margin: "-100px", once: true }}
                transition={{ duration: 0.6 }}
                className="mb-10 text-center"
              >
                <h2
                  className="font-serif text-3xl font-light tracking-tight md:text-4xl gradient-text"
                  style={{
                    background: isDark
                      ? "linear-gradient(to right, #fff, #d4d4d4, #737373)"
                      : "linear-gradient(to right, #111, #555, #999)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {section.title}
                </h2>
                <p className="mt-3 text-sm" style={{ color: isDark ? "#525252" : "#a3a3a3" }}>
                  {section.subtitle}
                </p>
              </motion.div>

              <div className="grid gap-4 md:grid-cols-3">
                {section.features.map((f, i) => (
                  <motion.div
                    key={f.title}
                    className="h-full"
                    initial={{ opacity: 0, y: 25 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ margin: "-80px", once: true }}
                    transition={{ duration: 0.5, delay: si * 0.1 + i * 0.08 }}
                  >
                    <div
                      className="h-full rounded-2xl p-px"
                      style={{
                        background: isDark
                          ? "linear-gradient(to bottom right, rgba(255,255,255,0.1), rgba(255,255,255,0.05), transparent)"
                          : "linear-gradient(to bottom right, rgba(0,0,0,0.08), rgba(0,0,0,0.03), transparent)",
                      }}
                    >
                      <div
                        className="flex h-full flex-col overflow-hidden rounded-[calc(1rem-1px)] backdrop-blur-xl"
                        style={{
                          backgroundColor: isDark ? "rgba(10,10,10,0.8)" : "rgba(255,255,255,0.9)",
                          boxShadow: isDark
                            ? "inset 0 1px 0 0 rgba(255,255,255,0.06)"
                            : "inset 0 1px 0 0 rgba(255,255,255,0.5)",
                        }}
                      >
                        <div className="flex flex-1 flex-col p-6">
                          <div
                            className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl"
                            style={{
                              backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                              color: isDark ? "#d4d4d4" : "#555",
                            }}
                          >
                            <f.icon className="h-5 w-5" />
                          </div>
                          <h3 className="text-base font-medium" style={{ color: isDark ? "#fff" : "#111" }}>
                            {f.title}
                          </h3>
                          <p className="mt-2 text-sm leading-relaxed" style={{ color: isDark ? "#525252" : "#a3a3a3" }}>
                            {f.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* FAQ */}
        <section id="faq" className="relative z-[1] pb-32">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ margin: "-100px", once: true }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <h2
                className="font-serif text-3xl font-light tracking-tight md:text-4xl"
                style={{
                  background: isDark
                    ? "linear-gradient(to right, #fff, #d4d4d4, #737373)"
                    : "linear-gradient(to right, #111, #555, #999)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Frequently Asked Questions
              </h2>
              <p className="mt-3 text-sm" style={{ color: isDark ? "#525252" : "#a3a3a3" }}>
                Everything you need to know about StellarPDF.
              </p>
            </motion.div>

            <div className="space-y-2">
              {[
                {
                  q: "Is StellarPDF really free?",
                  a: "Yes. StellarPDF is fully open-source under the MIT license. No paywalls, no feature gating — you get the complete app for free.",
                },
                {
                  q: "Do my files get uploaded anywhere?",
                  a: "Never. All PDF processing happens entirely in your browser using client-side JavaScript and WebAssembly. Your files never leave your device.",
                },
                {
                  q: "What export formats are supported?",
                  a: "You can export your annotated documents as PDF (with all annotations baked in), PNG (single page), or DOCX (text extraction).",
                },
                {
                  q: "Can I sign documents?",
                  a: "Absolutely. Draw your signature on a transparent canvas, then drag and resize it anywhere on the PDF. The signature is embedded when you export.",
                },
                {
                  q: "Does it work on mobile?",
                  a: "Yes! StellarPDF supports touch interactions for drawing, highlighting, signing, and navigating documents on mobile devices and tablets.",
                },
                {
                  q: "How do I contribute?",
                  a: "Head over to our GitHub repository, fork the project, and open a pull request. We welcome contributions of all kinds.",
                },
              ].map((item, i) => (
                <FAQItem key={i} question={item.q} answer={item.a} index={i} />
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)"}`,
          backgroundColor: isDark ? "#0a0a0a" : "#fafafa",
        }}
      >
        <div className="mx-auto max-w-7xl px-6 pt-16 pb-12">
          <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <h3 className="text-sm font-semibold tracking-[0.2em] uppercase" style={{ color: isDark ? "#fff" : "#111" }}>
                StellarPDF
              </h3>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: isDark ? "#525252" : "#a3a3a3" }}>
                Free, open-source PDF tools
                <br />
                for the modern web.
              </p>
              <div className="mt-5 flex items-center gap-4">
                <a href="https://github.com/StellarStackOSS/StellarPDF" target="_blank" rel="noopener noreferrer" className="transition-colors" style={{ color: isDark ? "#525252" : "#a3a3a3" }}>
                  <Github className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-xs font-semibold tracking-[0.15em] uppercase" style={{ color: isDark ? "#a3a3a3" : "#737373" }}>
                Product
              </h4>
              <ul className="mt-4 space-y-3">
                <li><a href="#features" className="text-sm transition-colors" style={{ color: isDark ? "#525252" : "#a3a3a3" }}>Features</a></li>
                <li><a href="#faq" className="text-sm transition-colors" style={{ color: isDark ? "#525252" : "#a3a3a3" }}>FAQ</a></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-xs font-semibold tracking-[0.15em] uppercase" style={{ color: isDark ? "#a3a3a3" : "#737373" }}>
                Resources
              </h4>
              <ul className="mt-4 space-y-3">
                <li><a href="https://github.com/StellarStackOSS/StellarPDF" target="_blank" rel="noopener noreferrer" className="text-sm transition-colors" style={{ color: isDark ? "#525252" : "#a3a3a3" }}>GitHub</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-xs font-semibold tracking-[0.15em] uppercase" style={{ color: isDark ? "#a3a3a3" : "#737373" }}>
                Legal
              </h4>
              <ul className="mt-4 space-y-3">
                <li>
                  <button onClick={() => setShowModal("tos")} className="text-sm transition-colors cursor-pointer" style={{ color: isDark ? "#525252" : "#a3a3a3" }}>
                    Terms of Service
                  </button>
                </li>
                <li>
                  <button onClick={() => setShowModal("privacy")} className="text-sm transition-colors cursor-pointer" style={{ color: isDark ? "#525252" : "#a3a3a3" }}>
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <a href="https://github.com/StellarStackOSS/StellarPDF" target="_blank" rel="noopener noreferrer" className="text-sm transition-colors" style={{ color: isDark ? "#525252" : "#a3a3a3" }}>
                    MIT License
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-14" style={{ borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)"}` }} />

          <div className="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-xs" style={{ color: isDark ? "#404040" : "#a3a3a3" }}>
              &copy; {new Date().getFullYear()} StellarStack. Open source under MIT License.
            </p>
            <div className="flex gap-6">
              <button onClick={() => setShowModal("privacy")} className="text-xs transition-colors cursor-pointer" style={{ color: isDark ? "#404040" : "#a3a3a3" }}>
                Privacy
              </button>
              <button onClick={() => setShowModal("tos")} className="text-xs transition-colors cursor-pointer" style={{ color: isDark ? "#404040" : "#a3a3a3" }}>
                Terms
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Drop zone overlay */}
      {isDragging && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: isDark ? "rgba(10,10,10,0.85)" : "rgba(250,250,250,0.85)", backdropFilter: "blur(8px)" }}
        >
          <div
            className="flex flex-col items-center gap-4 p-12 rounded-2xl border-2 border-dashed"
            style={{
              borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)",
              backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
            }}
          >
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 1 }}>
              <FileUp className="h-12 w-12" style={{ color: isDark ? "#fff" : "#111" }} />
            </motion.div>
            <p className="text-lg font-medium" style={{ color: isDark ? "#fff" : "#111" }}>
              Drop your PDF here
            </p>
          </div>
        </motion.div>
      )}

      {/* Legal modals */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            onClick={() => setShowModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="max-w-lg w-full mx-4 max-h-[80vh] overflow-auto rounded-2xl"
              style={{
                backgroundColor: isDark ? "#141414" : "#fff",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)"}`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="flex items-center justify-between px-6 py-4 sticky top-0 rounded-t-2xl"
                style={{
                  borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)"}`,
                  backgroundColor: isDark ? "#141414" : "#fff",
                }}
              >
                <h2 className="text-lg font-semibold" style={{ color: isDark ? "#fff" : "#111" }}>
                  {showModal === "tos" ? "Terms of Service" : "Privacy Policy"}
                </h2>
                <button
                  onClick={() => setShowModal(null)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg cursor-pointer transition-colors"
                  style={{
                    color: isDark ? "#a3a3a3" : "#737373",
                    backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                  }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="px-6 py-5 text-sm leading-relaxed space-y-4" style={{ color: isDark ? "#a3a3a3" : "#737373" }}>
                {showModal === "tos" ? (
                  <>
                    <p><strong style={{ color: isDark ? "#fff" : "#111" }}>1. Acceptance of Terms</strong><br />
                    By using StellarPDF, you agree to these terms. StellarPDF is provided "as is" without warranties of any kind.</p>
                    <p><strong style={{ color: isDark ? "#fff" : "#111" }}>2. Use of Service</strong><br />
                    StellarPDF is a free, open-source tool for viewing, editing, and signing PDF documents. All processing occurs locally in your browser.</p>
                    <p><strong style={{ color: isDark ? "#fff" : "#111" }}>3. No Data Collection</strong><br />
                    We do not collect, store, or transmit any of your files or personal data. Your documents never leave your device.</p>
                    <p><strong style={{ color: isDark ? "#fff" : "#111" }}>4. Limitation of Liability</strong><br />
                    StellarPDF is provided free of charge. We are not liable for any damages arising from the use of this software.</p>
                    <p><strong style={{ color: isDark ? "#fff" : "#111" }}>5. Open Source License</strong><br />
                    StellarPDF is released under the MIT License. You are free to use, modify, and distribute it.</p>
                    <p><strong style={{ color: isDark ? "#fff" : "#111" }}>6. Changes to Terms</strong><br />
                    We may update these terms from time to time. Continued use of the service constitutes acceptance of any changes.</p>
                  </>
                ) : (
                  <>
                    <p><strong style={{ color: isDark ? "#fff" : "#111" }}>Your Privacy Matters</strong><br />
                    StellarPDF is designed with privacy as a core principle. Here's the simple version: we don't collect your data.</p>
                    <p><strong style={{ color: isDark ? "#fff" : "#111" }}>No File Uploads</strong><br />
                    All PDF processing happens entirely in your browser using client-side JavaScript. Your files are never uploaded to any server.</p>
                    <p><strong style={{ color: isDark ? "#fff" : "#111" }}>No Analytics or Tracking</strong><br />
                    We do not use cookies, analytics, tracking pixels, or any form of user monitoring.</p>
                    <p><strong style={{ color: isDark ? "#fff" : "#111" }}>No Account Required</strong><br />
                    There is no sign-up, login, or account system. You can use StellarPDF completely anonymously.</p>
                    <p><strong style={{ color: isDark ? "#fff" : "#111" }}>No Third-Party Services</strong><br />
                    StellarPDF does not send data to any third-party service. Everything runs locally on your machine.</p>
                    <p><strong style={{ color: isDark ? "#fff" : "#111" }}>Open Source Transparency</strong><br />
                    Our source code is publicly available. You can verify our privacy practices yourself by reviewing the code.</p>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
