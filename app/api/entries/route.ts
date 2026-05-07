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

  return Response.json(filtered)
}

export async function POST(request: Request) {
  const body = await request.json()

  const validation = timeEntrySchema.safeParse(body)
  if (!validation.success) {
    return Response.json({ error: validation.error.errors }, { status: 400 })
  }

  const entry: TimeEntry = {
    id: generateId(),
    ...validation.data,
    createdAt: new Date().toISOString(),
  }

  await upsert('entries', entry)
  return Response.json(entry, { status: 201 })
}
