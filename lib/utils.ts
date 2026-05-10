import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { WorkDay, PeriodStats, TimeRange } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36)
}

export function getDateString(date: Date = new Date()): string {
  return date.toISOString().split('T')[0]
}

/** Calculate minutes from a HH:MM string */
function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

/** Calculate worked hours for a single TimeRange */
export function calculateRangeHours(range: TimeRange): number {
  let start = timeToMinutes(range.start)
  let end = timeToMinutes(range.end)
  // Handle overnight (e.g. 21:00 - 00:00)
  if (end <= start) end += 24 * 60
  return Math.max(0, (end - start) / 60)
}

/** Calculate worked hours for a single WorkDay entry */
export function calculateDayHours(entry: WorkDay): number {
  if (entry.dayType === 'leave') return 0
  if (entry.ranges && entry.ranges.length > 0) {
    return entry.ranges.reduce((sum, r) => sum + calculateRangeHours(r), 0)
  }
  const startMinutes = timeToMinutes(entry.startTime)
  const endMinutes = timeToMinutes(entry.endTime)
  const workedMinutes = endMinutes - startMinutes - entry.breakMinutes
  return Math.max(0, workedMinutes / 60)
}

// --- French public holidays ---

/** Compute Easter Sunday for a given year (anonymous Gregorian algorithm) */
function easterSunday(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

/** Get all French public holidays for a given year as YYYY-MM-DD strings */
export function getFrenchHolidays(year: number): Map<string, string> {
  const holidays = new Map<string, string>()

  const pad = (n: number) => String(n).padStart(2, '0')
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  const addDays = (d: Date, n: number) => {
    const r = new Date(d)
    r.setDate(r.getDate() + n)
    return r
  }

  // Fixed holidays
  holidays.set(`${year}-01-01`, 'Nouvel An')
  holidays.set(`${year}-05-01`, 'Fete du Travail')
  holidays.set(`${year}-05-08`, 'Victoire 1945')
  holidays.set(`${year}-07-14`, 'Fete nationale')
  holidays.set(`${year}-08-15`, 'Assomption')
  holidays.set(`${year}-11-01`, 'Toussaint')
  holidays.set(`${year}-11-11`, 'Armistice')
  holidays.set(`${year}-12-25`, 'Noel')

  // Easter-based holidays
  const easter = easterSunday(year)
  holidays.set(fmt(addDays(easter, 1)), 'Lundi de Paques')
  holidays.set(fmt(addDays(easter, 39)), 'Ascension')
  holidays.set(fmt(addDays(easter, 50)), 'Lundi de Pentecote')

  return holidays
}

/** Check if a date string is a French public holiday */
export function isFrenchHoliday(dateStr: string): boolean {
  const year = parseInt(dateStr.substring(0, 4))
  const holidays = getFrenchHolidays(year)
  return holidays.has(dateStr)
}

/** Get the holiday name for a date, or null if not a holiday */
export function getHolidayName(dateStr: string): string | null {
  const year = parseInt(dateStr.substring(0, 4))
  const holidays = getFrenchHolidays(year)
  return holidays.get(dateStr) ?? null
}

/** Get all holidays (on weekdays) in a date range */
export function getHolidaysInRange(startDate: string, endDate: string): string[] {
  const startYear = parseInt(startDate.substring(0, 4))
  const endYear = parseInt(endDate.substring(0, 4))
  const result: string[] = []

  for (let year = startYear; year <= endYear; year++) {
    const holidays = getFrenchHolidays(year)
    for (const [date] of holidays) {
      if (date >= startDate && date <= endDate) {
        const d = new Date(date + 'T12:00:00')
        const day = d.getDay()
        if (day !== 0 && day !== 6) {
          result.push(date)
        }
      }
    }
  }

  return result
}

/** Count business days (Mon-Fri) between two dates inclusive, excluding holidays */
export function countBusinessDays(startDate: string, endDate: string): number {
  const start = new Date(startDate + 'T12:00:00')
  const end = new Date(endDate + 'T12:00:00')
  const holidays = getHolidaysInRange(startDate, endDate)
  const holidaySet = new Set(holidays)
  let count = 0
  const current = new Date(start)
  while (current <= end) {
    const day = current.getDay()
    const dateStr = getDateString(current)
    if (day !== 0 && day !== 6 && !holidaySet.has(dateStr)) count++
    current.setDate(current.getDate() + 1)
  }
  return count
}

/** Count raw weekdays (Mon-Fri) without holiday exclusion */
function countRawWeekdays(startDate: string, endDate: string): number {
  const start = new Date(startDate + 'T12:00:00')
  const end = new Date(endDate + 'T12:00:00')
  let count = 0
  const current = new Date(start)
  while (current <= end) {
    const day = current.getDay()
    if (day !== 0 && day !== 6) count++
    current.setDate(current.getDate() + 1)
  }
  return count
}

/** Calculate comprehensive stats for a period */
export function calculatePeriodStats(
  entries: WorkDay[],
  contractHoursPerWeek: number,
  startDate: string,
  endDate: string
): PeriodStats {
  const holidaysInPeriod = getHolidaysInRange(startDate, endDate)
  const totalHolidays = holidaysInPeriod.length
  const workingDays = countBusinessDays(startDate, endDate) // already excludes holidays

  // Separate entries by type
  const workEntries = entries.filter((e) => !e.dayType || e.dayType === 'work')
  const holidayWorkedEntries = entries.filter((e) => e.dayType === 'holiday_worked')
  const leaveEntries = entries.filter((e) => e.dayType === 'leave')

  const totalLeaveDays = leaveEntries.length
  const totalHolidaysWorked = holidayWorkedEntries.length

  // Working days the employee should work = business days - leave days
  const expectedWorkDays = Math.max(0, workingDays - totalLeaveDays)
  const weeks = expectedWorkDays / 5
  const totalContractHours = contractHoursPerWeek * weeks

  // Hours worked (include holiday_worked entries)
  const workedEntries = [...workEntries, ...holidayWorkedEntries]

  if (workedEntries.length === 0) {
    return {
      totalWorkedHours: 0,
      totalContractHours,
      diffHours: -totalContractHours,
      avgDailyHours: 0,
      minDailyHours: 0,
      maxDailyHours: 0,
      totalDays: 0,
      totalWorkingDays: workingDays,
      totalHolidays,
      totalLeaveDays,
      totalHolidaysWorked,
      avgBreakMinutes: 0,
      entries,
    }
  }

  const dailyHours = workedEntries.map(calculateDayHours)
  const totalWorkedHours = dailyHours.reduce((a, b) => a + b, 0)
  const totalBreakMinutes = workedEntries.reduce((a, e) => a + e.breakMinutes, 0)

  return {
    totalWorkedHours,
    totalContractHours,
    diffHours: totalWorkedHours - totalContractHours,
    avgDailyHours: totalWorkedHours / workedEntries.length,
    minDailyHours: Math.min(...dailyHours),
    maxDailyHours: Math.max(...dailyHours),
    totalDays: workedEntries.length,
    totalWorkingDays: workingDays,
    totalHolidays,
    totalLeaveDays,
    totalHolidaysWorked,
    avgBreakMinutes: totalBreakMinutes / workedEntries.length,
    entries,
  }
}

/** Format hours as Xh YYmin */
export function formatHours(hours: number): string {
  const h = Math.floor(Math.abs(hours))
  const m = Math.round((Math.abs(hours) - h) * 60)
  const sign = hours < 0 ? '-' : ''
  return m > 0 ? `${sign}${h}h${m.toString().padStart(2, '0')}` : `${sign}${h}h`
}

/** Format a diff with sign and color class */
export function formatDiff(hours: number): { text: string; className: string } {
  const prefix = hours > 0 ? '+' : ''
  return {
    text: `${prefix}${formatHours(hours)}`,
    className: hours > 0 ? 'text-red-600' : hours < 0 ? 'text-orange-600' : 'text-green-600',
  }
}

/** Get French day name */
export function getFrenchDay(dateStr: string): string {
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  return days[new Date(dateStr + 'T12:00:00').getDay()]
}

/** Format date as "Lun. 7 mai 2026" */
export function formatDateFr(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00')
  return date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
