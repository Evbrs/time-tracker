import { NextResponse } from 'next/server'
import { getAll, upsert } from '@/lib/storage'
import { WorkDay } from '@/lib/types'
import { workDaySchema } from '@/lib/validation'
import { generateId } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  Pragma: 'no-cache',
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const date = searchParams.get('date')

    let entries = await getAll<WorkDay>('workdays')

    if (employeeId) {
      entries = entries.filter((e) => e.employeeId === employeeId)
    }
    if (date) {
      entries = entries.filter((e) => e.date === date)
    }
    if (startDate) {
      entries = entries.filter((e) => e.date >= startDate)
    }
    if (endDate) {
      entries = entries.filter((e) => e.date <= endDate)
    }

    // Sort by date descending
    entries.sort((a, b) => b.date.localeCompare(a.date))

    return NextResponse.json(entries, { headers: noCacheHeaders })
  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validation = workDaySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors }, { status: 400 })
    }

    // Check for duplicate date for same employee
    const existing = await getAll<WorkDay>('workdays')
    const duplicate = existing.find(
      (e) => e.employeeId === validation.data.employeeId && e.date === validation.data.date
    )
    if (duplicate) {
      return NextResponse.json(
        { error: 'Une saisie existe deja pour cette date. Modifiez-la ou supprimez-la.' },
        { status: 409 }
      )
    }

    const entry: WorkDay = {
      id: generateId(),
      employeeId: validation.data.employeeId,
      date: validation.data.date,
      startTime: validation.data.startTime,
      endTime: validation.data.endTime,
      breakMinutes: validation.data.breakMinutes,
      ranges: validation.data.ranges,
      dayType: validation.data.dayType,
      notes: validation.data.notes,
      createdAt: new Date().toISOString(),
    }

    await upsert('workdays', entry)
    return NextResponse.json(entry, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
