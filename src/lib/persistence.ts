import type { Annotation } from "./pdf-engine"

const DB_NAME = "stellarpdf"
const DB_VERSION = 1
const STORE_NAME = "session"

interface SessionData {
  fileData: ArrayBuffer
  fileName: string
  annotations: Annotation[]
  currentPage: number
  scale: number
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveSession(data: SessionData): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)
    store.put(data.fileData, "fileData")
    store.put(data.fileName, "fileName")
    store.put(JSON.stringify(data.annotations), "annotations")
    store.put(data.currentPage, "currentPage")
    store.put(data.scale, "scale")
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  } catch (e) {
    console.warn("Failed to save session:", e)
  }
}

export async function loadSession(): Promise<SessionData | null> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, "readonly")
    const store = tx.objectStore(STORE_NAME)

    const get = (key: string): Promise<unknown> =>
      new Promise((resolve, reject) => {
        const req = store.get(key)
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      })

    const [fileData, fileName, annotationsJson, currentPage, scale] = await Promise.all([
      get("fileData"),
      get("fileName"),
      get("annotations"),
      get("currentPage"),
      get("scale"),
    ])

    db.close()

    if (!fileData || !fileName) return null

    return {
      fileData: fileData as ArrayBuffer,
      fileName: fileName as string,
      annotations: annotationsJson ? JSON.parse(annotationsJson as string) : [],
      currentPage: (currentPage as number) || 1,
      scale: (scale as number) || 1.2,
    }
  } catch (e) {
    console.warn("Failed to load session:", e)
    return null
  }
}

export async function clearSession(): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, "readwrite")
    tx.objectStore(STORE_NAME).clear()
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  } catch (e) {
    console.warn("Failed to clear session:", e)
  }
}
