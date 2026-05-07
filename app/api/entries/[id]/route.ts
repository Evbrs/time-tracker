import { NextResponse } from 'next/server'
import { getById, upsert, remove } from '@/lib/storage'
import { TimeEntry } from '@/lib/types'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()

  const entry = await getById<TimeEntry>('entries', id)
  if (!entry) {
    return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
  }

  const updated: TimeEntry = { ...entry, ...body }

  await upsert('entries', updated)
  return NextResponse.json(updated)
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await remove('entries', id)
  return NextResponse.json({ success: true })
}
