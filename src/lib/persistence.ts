import type { Annotation } from "./pdf-engine"

const DB_NAME = "stellarpdf"
const DB_VERSION = 2
const SESSION_STORE = "session"
const SIGNATURES_STORE = "signatures"

interface SessionData {
  fileData: ArrayBuffer
  fileName: string
  annotations: Annotation[]
  currentPage: number
  scale: number
}

export interface SavedSignature {
  id: string
  dataUrl: string
  createdAt: number
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(SESSION_STORE)) {
        db.createObjectStore(SESSION_STORE)
      }
      if (!db.objectStoreNames.contains(SIGNATURES_STORE)) {
        db.createObjectStore(SIGNATURES_STORE, { keyPath: "id" })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveSession(data: SessionData): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction(SESSION_STORE, "readwrite")
    const store = tx.objectStore(SESSION_STORE)
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
    const tx = db.transaction(SESSION_STORE, "readonly")
    const store = tx.objectStore(SESSION_STORE)

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
    const tx = db.transaction(SESSION_STORE, "readwrite")
    tx.objectStore(SESSION_STORE).clear()
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  } catch (e) {
    console.warn("Failed to clear session:", e)
  }
}

export async function saveSignature(dataUrl: string): Promise<SavedSignature> {
  const sig: SavedSignature = {
    id: crypto.randomUUID(),
    dataUrl,
    createdAt: Date.now(),
  }
  try {
    const db = await openDB()
    const tx = db.transaction(SIGNATURES_STORE, "readwrite")
    tx.objectStore(SIGNATURES_STORE).put(sig)
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  } catch (e) {
    console.warn("Failed to save signature:", e)
  }
  return sig
}

export async function loadSignatures(): Promise<SavedSignature[]> {
  try {
    const db = await openDB()
    const tx = db.transaction(SIGNATURES_STORE, "readonly")
    const store = tx.objectStore(SIGNATURES_STORE)
    return new Promise((resolve, reject) => {
      const req = store.getAll()
      req.onsuccess = () => {
        db.close()
        const sigs = (req.result as SavedSignature[]).sort((a, b) => b.createdAt - a.createdAt)
        resolve(sigs)
      }
      req.onerror = () => {
        db.close()
        reject(req.error)
      }
    })
  } catch (e) {
    console.warn("Failed to load signatures:", e)
    return []
  }
}

export async function deleteSignature(id: string): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction(SIGNATURES_STORE, "readwrite")
    tx.objectStore(SIGNATURES_STORE).delete(id)
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  } catch (e) {
    console.warn("Failed to delete signature:", e)
  }
}
