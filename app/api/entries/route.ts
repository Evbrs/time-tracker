import { NextResponse } from 'next/server'
import { getAll, upsert } from '@/lib/storage'
import { TimeEntry } from '@/lib/types'
import { timeEntrySchema } from '@/lib/validation'
import { generateId, getDateString } from '@/lib/utils'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const employeeId = searchParams.get('employeeId')
  const date = searchParams.get('date')

  const entries = await getAll<TimeEntry>('entries')

  let filtered = entries
  if (employeeId) {
    filtered = filtered.filter((e) => e.employeeId === employeeId)
  }
  if (date) {
    filtered = filtered.filter((e) => getDateString(new Date(e.checkIn)) === date)
  }

  return NextResponse.json(filtered)
}

export async function POST(request: Request) {
  try {
    console.log('[POST /api/entries] Received request')
    const body = await request.json()
    console.log('[POST /api/entries] Body:', body)

    const validation = timeEntrySchema.safeParse(body)
    console.log('[POST /api/entries] Validation success:', validation.success)
    if (!validation.success) {
      console.log('[POST /api/entries] Validation errors:', validation.error.errors)
      return NextResponse.json({ error: validation.error.errors }, { status: 400 })
    }

    const entry: TimeEntry = {
      id: generateId(),
      employeeId: validation.data.employeeId,
      checkIn: validation.data.checkIn,
      checkOut: validation.data.checkOut || null,
      breakTime: validation.data.breakTime,
      createdAt: new Date().toISOString(),
    }
    console.log('[POST /api/entries] Created entry:', entry.id)

    await upsert('entries', entry)
    console.log('[POST /api/entries] Upsert complete')
    return NextResponse.json(entry, { status: 201 })
  } catch (err) {
    console.error('[POST /api/entries] Error:', err instanceof Error ? err.message : String(err))
    console.error('[POST /api/entries] Stack:', err instanceof Error ? err.stack : '')
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
