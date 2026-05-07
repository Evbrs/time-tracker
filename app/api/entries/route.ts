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

  return new Response(JSON.stringify(filtered), {
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function POST(request: Request) {
  const body = await request.json()

  const validation = timeEntrySchema.safeParse(body)
  if (!validation.success) {
    return new Response(JSON.stringify({ error: validation.error.errors }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
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
  return new Response(JSON.stringify(entry), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  })
}
