import { getById, upsert, remove } from '@/lib/storage'
import { TimeEntry } from '@/lib/types'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()

  const entry = await getById<TimeEntry>('entries', id)
  if (!entry) {
    return new Response(JSON.stringify({ error: 'Entry not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const updated = { ...entry, ...body }

  await upsert('entries', updated as TimeEntry)
  return new Response(JSON.stringify(updated), {
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await remove('entries', id)
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
