import { NextResponse } from 'next/server'
import { getAll, saveAll } from '@/lib/storage'
import { WorkDay } from '@/lib/types'
import { generateId } from '@/lib/utils'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  Pragma: 'no-cache',
}

const batchSchema = z.object({
  employeeId: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  breakMinutes: z.number().min(0).max(480).default(60),
  notes: z.string().max(500).default(''),
})

function getWeekdaysBetween(start: string, end: string): string[] {
  const dates: string[] = []
  const current = new Date(start + 'T12:00:00')
  const last = new Date(end + 'T12:00:00')
  while (current <= last) {
    const day = current.getDay()
    if (day !== 0 && day !== 6) {
      dates.push(current.toISOString().split('T')[0])
    }
    current.setDate(current.getDate() + 1)
  }
  return dates
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validation = batchSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors }, { status: 400 })
    }

    const { employeeId, startDate, endDate, startTime, endTime, breakMinutes, notes } = validation.data

    if (startDate > endDate) {
      return NextResponse.json(
        { error: 'La date de debut doit etre avant la date de fin.' },
        { status: 400 }
      )
    }

    if (startTime >= endTime) {
      return NextResponse.json(
        { error: "L'heure de fin doit etre apres l'heure de debut." },
        { status: 400 }
      )
    }

    const dates = getWeekdaysBetween(startDate, endDate)
    if (dates.length === 0) {
      return NextResponse.json(
        { error: 'Aucun jour ouvre dans cette periode.' },
        { status: 400 }
      )
    }
    if (dates.length > 60) {
      return NextResponse.json(
        { error: 'La periode ne peut pas depasser 60 jours ouvres.' },
        { status: 400 }
      )
    }

    const existing = await getAll<WorkDay>('workdays')
    const existingDates = new Set(
      existing.filter((e) => e.employeeId === employeeId).map((e) => e.date)
    )

    const now = new Date().toISOString()
    const created: WorkDay[] = []
    const skipped: string[] = []

    for (const date of dates) {
      if (existingDates.has(date)) {
        skipped.push(date)
        continue
      }
      created.push({
        id: generateId(),
        employeeId,
        date,
        startTime,
        endTime,
        breakMinutes,
        notes,
        createdAt: now,
      })
    }

    if (created.length > 0) {
      await saveAll('workdays', [...existing, ...created])
    }

    return NextResponse.json(
      { created, skipped, totalCreated: created.length, totalSkipped: skipped.length },
      { status: 201, headers: noCacheHeaders }
    )
  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
