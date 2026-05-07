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
  if (entry.ranges && entry.ranges.length > 0) {
    return entry.ranges.reduce((sum, r) => sum + calculateRangeHours(r), 0)
  }
  const startMinutes = timeToMinutes(entry.startTime)
  const endMinutes = timeToMinutes(entry.endTime)
  const workedMinutes = endMinutes - startMinutes - entry.breakMinutes
  return Math.max(0, workedMinutes / 60)
}

/** Count business days (Mon-Fri) between two dates inclusive */
export function countBusinessDays(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
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
  if (entries.length === 0) {
    const workingDays = countBusinessDays(startDate, endDate)
    const weeks = workingDays / 5
    return {
      totalWorkedHours: 0,
      totalContractHours: contractHoursPerWeek * weeks,
      diffHours: -(contractHoursPerWeek * weeks),
      avgDailyHours: 0,
      minDailyHours: 0,
      maxDailyHours: 0,
      totalDays: 0,
      totalWorkingDays: workingDays,
      avgBreakMinutes: 0,
      entries: [],
    }
  }

  const dailyHours = entries.map(calculateDayHours)
  const totalWorkedHours = dailyHours.reduce((a, b) => a + b, 0)
  const totalBreakMinutes = entries.reduce((a, e) => a + e.breakMinutes, 0)
  const workingDays = countBusinessDays(startDate, endDate)
  const weeks = workingDays / 5
  const totalContractHours = contractHoursPerWeek * weeks

  return {
    totalWorkedHours,
    totalContractHours,
    diffHours: totalWorkedHours - totalContractHours,
    avgDailyHours: totalWorkedHours / entries.length,
    minDailyHours: Math.min(...dailyHours),
    maxDailyHours: Math.max(...dailyHours),
    totalDays: entries.length,
    totalWorkingDays: workingDays,
    avgBreakMinutes: totalBreakMinutes / entries.length,
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
