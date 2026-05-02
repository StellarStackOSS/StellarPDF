import { copyFileSync, mkdirSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
// ESM dist has `export default createFFmpegCore` which is required for dynamic
// import() inside the module Worker. The UMD dist has no default export and
// causes ERROR_IMPORT_FAILURE when the worker does `(await import(url)).default`.
const src = resolve(__dirname, '../node_modules/@ffmpeg/core/dist/esm')
const dest = resolve(__dirname, '../public/ffmpeg')

if (!existsSync(dest)) mkdirSync(dest, { recursive: true })

for (const file of ['ffmpeg-core.js', 'ffmpeg-core.wasm']) {
  copyFileSync(resolve(src, file), resolve(dest, file))
  console.log(`Copied ${file}`)
}
