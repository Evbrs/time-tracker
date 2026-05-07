'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { DailyReport as Report } from '@/lib/types'
import { getDateString } from '@/lib/utils'
import { DailyReport } from '@/components/DailyReport'
import { ArrowLeft, Download } from 'lucide-react'

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [date, setDate] = useState(() => getDateString())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadReports()
  }, [date])

  async function loadReports() {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports?date=${date}`)
      const data = await res.json()
      setReports(data)
    } finally {
      setLoading(false)
    }
  }

  function handleExportCSV() {
    if (reports.length === 0) return

    const headers = ['Employee', 'Date', 'Check In', 'Check Out', 'Break (min)', 'Total Hours']
    const rows: string[] = []

    reports.forEach((report) => {
      report.entries.forEach((entry) => {
        const checkIn = new Date(entry.checkIn).toLocaleTimeString()
        const checkOut = entry.checkOut ? new Date(entry.checkOut).toLocaleTimeString() : '-'
        rows.push([report.employeeName, report.date, checkIn, checkOut, entry.breakTime.toString(), '-'].join(','))
      })
      if (report.entries.length === 0) {
        rows.push([report.employeeName, report.date, '-', '-', '-', '0'].join(','))
      } else {
        rows.push(
          [report.employeeName, `${report.date} (TOTAL)`, '', '', report.totalBreakTime.toString(), report.totalHours.toFixed(2)].join(
            ','
          )
        )
      }
    })

    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `time-report-${date}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const prevDate = new Date(new Date(date).getTime() - 86400000).toISOString().split('T')[0]
  const nextDate = new Date(new Date(date).getTime() + 86400000).toISOString().split('T')[0]
  const maxDate = getDateString()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="text-blue-600 hover:text-blue-700">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
            </div>
            <button
              onClick={handleExportCSV}
              disabled={reports.length === 0}
              className="flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
              aria-label="Export report to CSV"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-4">
            <label htmlFor="date-filter" className="font-medium text-gray-700">
              Select date:
            </label>
            <input
              id="date-filter"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={maxDate}
              className="rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              aria-label="Select date for report"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setDate(prevDate)}
              className="rounded-md border border-gray-300 px-3 py-2 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Previous day"
            >
              ← Prev
            </button>
            <button
              onClick={() => setDate(nextDate)}
              disabled={nextDate > maxDate}
              className="rounded-md border border-gray-300 px-3 py-2 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
              aria-label="Next day"
            >
              Next →
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center">
            <p className="text-gray-600">Loading reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-center">
            <p className="text-gray-500">No data available for this date</p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            {reports.map((report) => (
              <DailyReport key={report.employeeId} report={report} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
