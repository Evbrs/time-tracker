import { NextResponse } from 'next/server'
import { getAll, getById } from '@/lib/storage'
import { Employee, WorkDay } from '@/lib/types'
import { calculatePeriodStats } from '@/lib/utils'

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

    if (!employeeId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Parametres requis: employeeId, startDate, endDate' },
        { status: 400 }
      )
    }

    const employee = await getById<Employee>('employees', employeeId)
    if (!employee) {
      return NextResponse.json({ error: 'Employe introuvable' }, { status: 404 })
    }

    const allEntries = await getAll<WorkDay>('workdays')
    const entries = allEntries
      .filter((e) => e.employeeId === employeeId && e.date >= startDate && e.date <= endDate)
      .sort((a, b) => a.date.localeCompare(b.date))

    const stats = calculatePeriodStats(entries, employee.contractHours, startDate, endDate)

    return NextResponse.json(
      {
        employee: { id: employee.id, name: employee.name, contractHours: employee.contractHours },
        stats,
      },
      { headers: noCacheHeaders }
    )
  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
