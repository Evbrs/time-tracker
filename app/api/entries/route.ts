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
  const body = await request.json()

  const validation = timeEntrySchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({ error: validation.error.errors }, { status: 400 })
  }

  const entry = {
    id: generateId(),
    employeeId: validation.data.employeeId,
    checkIn: validation.data.checkIn,
    checkOut: validation.data.checkOut || null,
    breakTime: validation.data.breakTime,
    createdAt: new Date().toISOString(),
  }

  await upsert('entries', entry as TimeEntry)
  return NextResponse.json(entry, { status: 201 })
}
