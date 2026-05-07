import { readFile, writeFile, mkdir } from 'fs/promises'
import path from 'path'

const DB_DIR = path.join(process.cwd(), 'db')

async function ensureDbDir() {
  await mkdir(DB_DIR, { recursive: true })
}

async function readLocalJson<T>(name: string): Promise<T[]> {
  await ensureDbDir()
  try {
    const data = await readFile(path.join(DB_DIR, `${name}.json`), 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

async function writeLocalJson<T>(name: string, data: T[]): Promise<void> {
  await ensureDbDir()
  await writeFile(path.join(DB_DIR, `${name}.json`), JSON.stringify(data, null, 2), 'utf-8')
}

async function readBlobJson<T>(name: string): Promise<T[]> {
  try {
    const { list } = await import('@vercel/blob')
    const blobKey = `time-tracker/${name}.json`
    const { blobs } = await list({ prefix: blobKey, limit: 1 })

    if (blobs.length === 0) {
      return []
    }

    const blob = blobs[0]
    const res = await fetch(blob.downloadUrl)

    if (!res.ok) {
      console.error(`[readBlobJson] Fetch failed for ${name}: ${res.status}`)
      return []
    }

    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch (err) {
    console.error(`[readBlobJson] Error reading ${name}:`, err instanceof Error ? err.message : String(err))
    return []
  }
}

async function writeBlobJson<T>(name: string, data: T[]): Promise<void> {
  const { put } = await import('@vercel/blob')
  await put(`time-tracker/${name}.json`, JSON.stringify(data), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
  })
}

function useBlob(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN
}

export async function getAll<T>(collection: string): Promise<T[]> {
  if (useBlob()) return readBlobJson<T>(collection)
  return readLocalJson<T>(collection)
}

export async function saveAll<T>(collection: string, data: T[]): Promise<void> {
  if (useBlob()) await writeBlobJson(collection, data)
  else await writeLocalJson(collection, data)
}

export async function upsert<T extends { id: string }>(collection: string, item: T): Promise<T> {
  const all = await getAll<T>(collection)
  const idx = all.findIndex((i) => (i as { id: string }).id === item.id)
  if (idx >= 0) all[idx] = item
  else all.push(item)
  await saveAll(collection, all)
  return item
}

export async function removeItem(collection: string, id: string): Promise<void> {
  const all = await getAll<{ id: string }>(collection)
  const filtered = all.filter((i) => i.id !== id)
  await saveAll(collection, filtered)
}

export async function getById<T extends { id: string }>(collection: string, id: string): Promise<T | null> {
  const all = await getAll<T>(collection)
  return all.find((i) => i.id === id) ?? null
}
