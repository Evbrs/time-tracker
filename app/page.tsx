'use client'

import { useEffect, useState } from 'react'
import { Employee, TimeEntry } from '@/lib/types'
import { getDateString } from '@/lib/utils'
import { EmployeeForm } from '@/components/EmployeeForm'
import { TimeEntryCard } from '@/components/TimeEntryCard'
import { Clock } from 'lucide-react'

export default function Home() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [todayDate] = useState(() => getDateString())

  useEffect(() => {
    loadEmployees()
    loadEntries()
    const interval = setInterval(() => {
      loadEntries()
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  async function loadEmployees() {
    const res = await fetch('/api/employees')
    const data = await res.json()
    setEmployees(data)
  }

  async function loadEntries() {
    const res = await fetch(`/api/entries?date=${todayDate}`)
    const data = await res.json()
    setEntries(data)
  }

  async function handleAddEmployee(employee: Omit<Employee, 'id' | 'createdAt'>) {
    setLoading(true)
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employee),
      })
      if (!res.ok) throw new Error('Failed to add employee')
      await loadEmployees()
    } finally {
      setLoading(false)
    }
  }

  async function handleCheckIn(employeeId: string) {
    setLoading(true)
    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          checkIn: new Date().toISOString(),
          checkOut: null,
          breakTime: 0,
        }),
      })
      if (!res.ok) throw new Error('Failed to check in')
      await loadEntries()
    } finally {
      setLoading(false)
    }
  }

  async function handleCheckOut(entryId: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/entries/${entryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkOut: new Date().toISOString(),
        }),
      })
      if (!res.ok) throw new Error('Failed to check out')
      await loadEntries()
    } finally {
      setLoading(false)
    }
  }

  const getActiveEntry = (employeeId: string) => {
    return entries.find((e) => e.employeeId === employeeId && !e.checkOut) ?? null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Time Tracker</h1>
              <p className="text-sm text-gray-600">Track employee work hours</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div>
            <EmployeeForm onSubmit={handleAddEmployee} loading={loading} />
          </div>

          <div className="lg:col-span-2">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              {employees.length === 0 ? (
                <div className="col-span-full rounded-lg border border-gray-200 bg-white p-6 text-center">
                  <p className="text-gray-500">No employees added yet</p>
                </div>
              ) : (
                employees.map((employee) => (
                  <TimeEntryCard
                    key={employee.id}
                    employee={employee}
                    onCheckIn={() => handleCheckIn(employee.id)}
                    onCheckOut={handleCheckOut}
                    activeEntry={getActiveEntry(employee.id)}
                    loading={loading}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        <nav>
          <a
            href="/reports"
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            View Reports
          </a>
        </nav>
      </main>
    </div>
  )
}
