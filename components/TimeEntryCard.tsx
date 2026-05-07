'use client'

import { Employee, TimeEntry } from '@/lib/types'
import { formatTime, formatDate } from '@/lib/utils'
import { Clock, LogOut } from 'lucide-react'

interface TimeEntryCardProps {
  employee: Employee
  onCheckIn: () => Promise<void>
  onCheckOut: (entryId: string) => Promise<void>
  activeEntry: TimeEntry | null
  loading?: boolean
}

export function TimeEntryCard({ employee, onCheckIn, onCheckOut, activeEntry, loading = false }: TimeEntryCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{employee.name}</h3>
        <p className="text-sm text-gray-600">{employee.email}</p>
      </div>

      {activeEntry ? (
        <div className="mb-4 rounded-md bg-blue-50 p-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>Checked in at {formatTime(activeEntry.checkIn)}</span>
          </div>
        </div>
      ) : null}

      <div className="flex gap-2">
        <button
          onClick={onCheckIn}
          disabled={loading || activeEntry !== null}
          className="flex-1 rounded-md bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          aria-label={`Check in ${employee.name}`}
        >
          Check In
        </button>
        <button
          onClick={() => activeEntry && onCheckOut(activeEntry.id)}
          disabled={loading || !activeEntry}
          className="flex-1 rounded-md bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          aria-label={`Check out ${employee.name}`}
        >
          <LogOut className="h-4 w-4" />
          Check Out
        </button>
      </div>
    </div>
  )
}
