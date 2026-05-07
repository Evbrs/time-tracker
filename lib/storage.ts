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
  const { list } = await import('@vercel/blob')
  const { blobs } = await list({ prefix: `time-tracker/${name}.json`, limit: 1 })
  if (blobs.length === 0) return []
  const res = await fetch(blobs[0].downloadUrl)
  if (!res.ok) return []
  return res.json()
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

export async function upsert<T extends { id: string }>(collection: string, item: T): Promise<T> {
  const all = await getAll<T>(collection)
  const idx = all.findIndex((i) => (i as { id: string }).id === item.id)
  if (idx >= 0) all[idx] = item
  else all.push(item)
  if (useBlob()) await writeBlobJson(collection, all)
  else await writeLocalJson(collection, all)
  return item
}

export async function remove(collection: string, id: string): Promise<void> {
  const all = await getAll<{ id: string }>(collection)
  const filtered = all.filter((i) => i.id !== id)
  if (useBlob()) await writeBlobJson(collection, filtered)
  else await writeLocalJson(collection, filtered)
}

export async function getById<T extends { id: string }>(collection: string, id: string): Promise<T | null> {
  const all = await getAll<T>(collection)
  return all.find((i) => i.id === id) ?? null
}
