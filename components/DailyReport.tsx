'use client'

import { DailyReport as Report } from '@/lib/types'
import { formatTime } from '@/lib/utils'

interface DailyReportProps {
  report: Report
}

export function DailyReport({ report }: DailyReportProps) {
  const { entries, totalHours, totalBreakTime } = report

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{report.employeeName}</h3>
        <p className="text-sm text-gray-600">{report.date}</p>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-gray-500">No entries for this date</p>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div key={entry.id} className="border-t border-gray-200 pt-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  Check in: <span className="font-medium text-gray-900">{formatTime(entry.checkIn)}</span>
                </span>
                {entry.checkOut && (
                  <span className="text-gray-600">
                    Check out: <span className="font-medium text-gray-900">{formatTime(entry.checkOut)}</span>
                  </span>
                )}
              </div>
              {entry.breakTime > 0 && (
                <div className="mt-1 text-xs text-gray-500">Break: {entry.breakTime} minutes</div>
              )}
            </div>
          ))}

          <div className="border-t border-gray-200 pt-3 space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span>Total hours:</span>
              <span className="text-gray-900">{totalHours.toFixed(2)}h</span>
            </div>
            <div className="flex justify-between text-sm font-medium">
              <span>Break time:</span>
              <span className="text-gray-900">{totalBreakTime} min</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
