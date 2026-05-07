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
    console.log(`[readBlobJson] Reading ${name}`)
    const blob = await import('@vercel/blob')
    const key = `time-tracker/${name}.json`

    console.log(`[readBlobJson] Calling blob.head() for ${key}`)
    const head = await blob.head(key)
    console.log(`[readBlobJson] head() success, size: ${head.size}`)

    if (!head.size) {
      console.log(`[readBlobJson] Empty blob, returning []`)
      return []
    }

    // For private blobs, use downloadUrl which contains temp auth token
    console.log(`[readBlobJson] Fetching from downloadUrl`)
    const res = await fetch(head.downloadUrl)
    console.log(`[readBlobJson] Fetch status: ${res.status}`)

    if (!res.ok) {
      console.error(`[readBlobJson] Fetch failed with status ${res.status}`)
      const text = await res.text()
      console.error(`[readBlobJson] Response body: ${text.substring(0, 200)}`)
      return []
    }

    const data = await res.json()
    console.log(`[readBlobJson] Successfully read ${data.length} items`)
    return data
  } catch (err) {
    console.error(`[readBlobJson] Error:`, err instanceof Error ? err.message : String(err))
    console.error(`[readBlobJson] Stack:`, err instanceof Error ? err.stack : '')
    return []
  }
}

async function writeBlobJson<T>(name: string, data: T[]): Promise<void> {
  try {
    console.log(`[writeBlobJson] Writing ${data.length} items to ${name}`)
    const { put } = await import('@vercel/blob')
    const result = await put(`time-tracker/${name}.json`, JSON.stringify(data), {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
    })
    console.log(`[writeBlobJson] Successfully wrote to ${name}, URL: ${result.url}`)
  } catch (err) {
    console.error(`[writeBlobJson] Error:`, err instanceof Error ? err.message : String(err))
    throw err
  }
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
