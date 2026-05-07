import { getAll } from '@/lib/storage'
import { Employee, TimeEntry, DailyReport } from '@/lib/types'
import { calculateHours, getDateString } from '@/lib/utils'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const employeeId = searchParams.get('employeeId')
  const date = searchParams.get('date')

  const employees = await getAll<Employee>('employees')
  const entries = await getAll<TimeEntry>('entries')

  let reports: DailyReport[] = []

  if (employeeId && date) {
    const employee = employees.find((e) => e.id === employeeId)
    if (!employee) {
      return new Response(JSON.stringify({ error: 'Employee not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const dayEntries = entries.filter((e) => e.employeeId === employeeId && getDateString(new Date(e.checkIn)) === date)
    const totalBreak = dayEntries.reduce((acc, e) => acc + e.breakTime, 0)

    reports.push({
      employeeId,
      employeeName: employee.name,
      date,
      entries: dayEntries,
      totalHours: calculateHours(dayEntries),
      totalBreakTime: totalBreak,
    })
  } else if (date) {
    for (const employee of employees) {
      const dayEntries = entries.filter((e) => e.employeeId === employee.id && getDateString(new Date(e.checkIn)) === date)
      const totalBreak = dayEntries.reduce((acc, e) => acc + e.breakTime, 0)

      reports.push({
        employeeId: employee.id,
        employeeName: employee.name,
        date,
        entries: dayEntries,
        totalHours: calculateHours(dayEntries),
        totalBreakTime: totalBreak,
      })
    }
  }

  return new Response(JSON.stringify(reports), {
    headers: { 'Content-Type': 'application/json' },
  })
}
