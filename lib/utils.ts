import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { TimeEntry } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(date: string): string {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function calculateHours(entries: TimeEntry[]): number {
  return entries.reduce((acc, entry) => {
    if (!entry.checkOut) return acc
    const checkIn = new Date(entry.checkIn).getTime()
    const checkOut = new Date(entry.checkOut).getTime()
    const ms = checkOut - checkIn - entry.breakTime * 60000
    return acc + ms / (1000 * 60 * 60)
  }, 0)
}

export function getDateString(date: Date = new Date()): string {
  return date.toISOString().split('T')[0]
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}
