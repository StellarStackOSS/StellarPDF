# Contributing to StellarPDF

Thanks for your interest in contributing! This guide covers everything you need to get started.

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/<your-username>/StellarPDF.git
   cd StellarPDF
   ```
3. **Install dependencies:**
   ```bash
   npm install
   ```
4. **Start the dev server:**
   ```bash
   npm run dev
   ```

## Development Workflow

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes
3. Ensure the project builds without errors:
   ```bash
   npm run build
   ```
4. Run the linter:
   ```bash
   npm run lint
   ```
5. Commit your changes (see [Commit Messages](#commit-messages))
6. Push to your fork and open a pull request

## Commit Messages

Use clear, concise commit messages that describe what changed and why:

- `fix: resolve annotation offset on zoomed pages`
- `feat: add eraser tool`
- `refactor: simplify undo/redo history logic`
- `docs: update README with export instructions`

Follow the [Conventional Commits](https://www.conventionalcommits.org/) format when possible.

## Code Style

- **TypeScript** — All code must be fully typed. Avoid `any`.
- **React** — Use functional components and hooks. No class components.
- **Formatting** — Follow the existing code style. Use 2-space indentation.
- **Imports** — Use the `@/` path alias for `src/` imports.
- **CSS** — Use Tailwind CSS utility classes. Avoid writing custom CSS unless absolutely necessary.
- **Components** — Keep components focused. If a component grows beyond ~200 lines, consider splitting it.

## Project Architecture

| Directory | Purpose |
|-----------|---------|
| `src/components/` | React components (UI, pages, modals) |
| `src/components/ui/` | Reusable UI primitives (Button, Tooltip, etc.) |
| `src/hooks/` | Custom React hooks |
| `src/lib/` | Non-React utilities (PDF engine, persistence, exports) |

Key architectural decisions:

- **Zero backend** — Everything runs client-side. No server calls, no data leaves the browser.
- **Canvas-based rendering** — PDF pages render to a canvas via pdfjs-dist. A second overlay canvas handles annotations.
- **pdf-lib for export** — Annotations are baked into the PDF on export using pdf-lib, independent of the rendering layer.
- **IndexedDB for persistence** — Session data (PDF bytes, annotations, page state) is stored in IndexedDB to survive page refreshes.

## Pull Request Guidelines

- Keep PRs focused — one feature or fix per PR
- Include a clear description of what changed and why
- Make sure the build passes (`npm run build`)
- Add screenshots for UI changes
- Link any related issues

## Reporting Bugs

Open an issue at [github.com/StellarStackOSS/StellarPDF/issues](https://github.com/StellarStackOSS/StellarPDF/issues) with:

- Steps to reproduce
- Expected behavior
- Actual behavior
- Browser and OS info
- Screenshots if applicable

## Feature Requests

Feature requests are welcome! Open an issue with the `enhancement` label describing your idea and the use case it solves.

## Areas for Contribution

Here are some areas where contributions are especially welcome:

- **Accessibility** — Keyboard navigation, screen reader support, ARIA labels
- **Annotation tools** — Shapes, stamps, strikethrough, underline
- **Performance** — Virtualized page rendering for large PDFs
- **Testing** — Unit and integration tests
- **i18n** — Internationalization support
- **Mobile** — Touch-friendly interactions and responsive layout improvements
