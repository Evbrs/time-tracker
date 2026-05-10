'use client'

import { useEffect, useState, useCallback } from 'react'
import { Employee, WorkDay, TimeRange, DayType } from '@/lib/types'
import { getDateString, calculateDayHours, calculateRangeHours, formatHours, formatDateFr, isFrenchHoliday, getHolidayName } from '@/lib/utils'
import { Clock, BarChart3, Plus, Trash2, Edit2, ChevronLeft, ChevronRight, LogOut, X, CalendarOff, Palmtree, Briefcase } from 'lucide-react'
import Link from 'next/link'

type EntryMode = 'simple' | 'ranges'

const DAY_TYPE_LABELS: Record<DayType, string> = {
  work: 'Jour travaille',
  holiday_worked: 'Ferie travaille',
  leave: 'Conge',
}

const DAY_TYPE_BADGES: Record<DayType, { bg: string; text: string; label: string }> = {
  work: { bg: 'bg-gray-100', text: 'text-gray-600', label: '' },
  holiday_worked: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Ferie' },
  leave: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Conge' },
}

export default function Home() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null)
  const [recentEntries, setRecentEntries] = useState<WorkDay[]>([])
  const [loading, setLoading] = useState(false)
  const [showProfileForm, setShowProfileForm] = useState(false)

  // Profile form
  const [formName, setFormName] = useState('')
  const [formContractHours, setFormContractHours] = useState(35)

  // Entry form
  const [entryMode, setEntryMode] = useState<EntryMode>('simple')
  const [entryDate, setEntryDate] = useState(() => getDateString())
  const [entryDayType, setEntryDayType] = useState<DayType>('work')
  // Simple mode
  const [entryStart, setEntryStart] = useState('09:00')
  const [entryEnd, setEntryEnd] = useState('17:30')
  const [entryBreak, setEntryBreak] = useState(60)
  // Ranges mode
  const [entryRanges, setEntryRanges] = useState<TimeRange[]>([
    { start: '09:00', end: '12:00' },
    { start: '13:00', end: '17:00' },
  ])
  // Common
  const [entryNotes, setEntryNotes] = useState('')
  const [entryError, setEntryError] = useState('')
  const [entrySuccess, setEntrySuccess] = useState('')

  // Edit mode
  const [editingId, setEditingId] = useState<string | null>(null)

  const currentEmployee = employees.find((e) => e.id === currentEmployeeId) ?? null

  // Detect if selected date is a holiday
  const holidayName = getHolidayName(entryDate)
  const isHoliday = !!holidayName

  // Auto-set dayType when navigating to a holiday
  useEffect(() => {
    if (editingId) return // don't auto-switch in edit mode
    if (isHoliday && entryDayType === 'work') {
      // Don't auto-switch, just let the user see the indicator
    }
  }, [entryDate, isHoliday, entryDayType, editingId])

  useEffect(() => {
    const savedId = localStorage.getItem('currentEmployeeId')
    if (savedId) setCurrentEmployeeId(savedId)
    loadEmployees()
  }, [])

  const loadEntries = useCallback(async () => {
    if (!currentEmployeeId) return
    const res = await fetch(`/api/workdays?employeeId=${currentEmployeeId}&_t=${Date.now()}`, {
      cache: 'no-store',
    })
    if (res.ok) {
      const data = await res.json()
      setRecentEntries(data.slice(0, 14))
    }
  }, [currentEmployeeId])

  useEffect(() => {
    if (currentEmployeeId) {
      localStorage.setItem('currentEmployeeId', currentEmployeeId)
      loadEntries()
    }
  }, [currentEmployeeId, loadEntries])

  async function loadEmployees() {
    const res = await fetch(`/api/employees?_t=${Date.now()}`, { cache: 'no-store' })
    if (res.ok) {
      const data = await res.json()
      setEmployees(data)
    }
  }

  async function handleCreateProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!formName.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName.trim(), contractHours: formContractHours }),
      })
      if (res.ok) {
        const employee = await res.json()
        setEmployees((prev) => [...prev, employee])
        setCurrentEmployeeId(employee.id)
        setShowProfileForm(false)
        setFormName('')
        setFormContractHours(35)
      }
    } finally {
      setLoading(false)
    }
  }

  // Compute preview hours for current form state
  function getPreviewHours(): number {
    if (entryDayType === 'leave') return 0
    if (entryMode === 'ranges') {
      return entryRanges.reduce((sum, r) => sum + calculateRangeHours(r), 0)
    }
    const [sh, sm] = entryStart.split(':').map(Number)
    const [eh, em] = entryEnd.split(':').map(Number)
    const mins = eh * 60 + em - (sh * 60 + sm) - entryBreak
    return Math.max(0, mins / 60)
  }

  async function handleSubmitEntry(e: React.FormEvent) {
    e.preventDefault()
    if (!currentEmployeeId) return
    setEntryError('')
    setEntrySuccess('')

    // For leave days, skip time validation
    if (entryDayType !== 'leave') {
      if (entryMode === 'simple') {
        if (entryStart >= entryEnd) {
          setEntryError("L'heure de fin doit etre apres l'heure de debut.")
          return
        }
      } else {
        if (entryRanges.length === 0) {
          setEntryError('Ajoutez au moins une plage horaire.')
          return
        }
        for (let i = 0; i < entryRanges.length; i++) {
          const r = entryRanges[i]
          const s = r.start.replace(':', '')
          const e2 = r.end.replace(':', '')
          if (s === e2) {
            setEntryError(`Plage ${i + 1}: debut et fin identiques.`)
            return
          }
        }
      }
    }

    setLoading(true)
    try {
      const body: Record<string, unknown> = {
        employeeId: currentEmployeeId,
        date: entryDate,
        dayType: entryDayType,
        notes: entryNotes,
      }

      if (entryDayType === 'leave') {
        // Leave: no hours needed
        body.startTime = '00:00'
        body.endTime = '00:00'
        body.breakMinutes = 0
      } else if (entryMode === 'ranges') {
        body.ranges = entryRanges
        body.startTime = entryRanges[0].start
        body.endTime = entryRanges[entryRanges.length - 1].end
        body.breakMinutes = 0
      } else {
        body.startTime = entryStart
        body.endTime = entryEnd
        body.breakMinutes = entryBreak
      }

      if (editingId) {
        const res = await fetch(`/api/workdays/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (res.ok) {
          const updated = await res.json()
          setRecentEntries((prev) =>
            prev.map((e) => (e.id === updated.id ? updated : e))
          )
          setEntrySuccess('Saisie mise a jour.')
          setEditingId(null)
          resetEntryForm()
          setTimeout(loadEntries, 1500)
        }
      } else {
        const res = await fetch('/api/workdays', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (res.ok) {
          const newEntry = await res.json()
          setRecentEntries((prev) => {
            const filtered = prev.filter((e) => e.date !== newEntry.date)
            return [newEntry, ...filtered].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14)
          })
          setEntrySuccess(
            entryDayType === 'leave'
              ? 'Conge enregistre !'
              : entryDayType === 'holiday_worked'
                ? 'Ferie travaille enregistre !'
                : 'Journee enregistree !'
          )
          resetEntryForm()
          setTimeout(loadEntries, 1500)
        } else {
          const data = await res.json()
          setEntryError(typeof data.error === 'string' ? data.error : 'Erreur lors de la saisie.')
        }
      }
    } finally {
      setLoading(false)
      setTimeout(() => setEntrySuccess(''), 4000)
    }
  }

  function resetEntryForm() {
    setEntryDate(getDateString())
    setEntryDayType('work')
    setEntryStart('09:00')
    setEntryEnd('17:30')
    setEntryBreak(60)
    setEntryRanges([
      { start: '09:00', end: '12:00' },
      { start: '13:00', end: '17:00' },
    ])
    setEntryNotes('')
    setEditingId(null)
  }

  function startEdit(entry: WorkDay) {
    setEditingId(entry.id)
    setEntryDate(entry.date)
    setEntryDayType(entry.dayType || 'work')
    setEntryNotes(entry.notes)
    setEntryError('')
    setEntrySuccess('')
    if (entry.dayType === 'leave') {
      setEntryMode('simple')
    } else if (entry.ranges && entry.ranges.length > 0) {
      setEntryMode('ranges')
      setEntryRanges(entry.ranges.map((r) => ({ ...r })))
    } else {
      setEntryMode('simple')
      setEntryStart(entry.startTime)
      setEntryEnd(entry.endTime)
      setEntryBreak(entry.breakMinutes)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette saisie ?')) return
    setRecentEntries((prev) => prev.filter((e) => e.id !== id))
    await fetch(`/api/workdays/${id}`, { method: 'DELETE' })
    setTimeout(loadEntries, 1500)
  }

  function switchProfile() {
    setCurrentEmployeeId(null)
    localStorage.removeItem('currentEmployeeId')
    setRecentEntries([])
  }

  function adjustDate(days: number) {
    const d = new Date(entryDate + 'T12:00:00')
    d.setDate(d.getDate() + days)
    setEntryDate(d.toISOString().split('T')[0])
  }

  // Range helpers
  function addRange() {
    const last = entryRanges[entryRanges.length - 1]
    const newStart = last ? last.end : '09:00'
    const [h, m] = newStart.split(':').map(Number)
    const endMins = Math.min(h * 60 + m + 120, 24 * 60)
    const endH = Math.floor(endMins / 60) % 24
    const endM = endMins % 60
    const newEnd = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
    setEntryRanges([...entryRanges, { start: newStart, end: newEnd }])
  }

  function removeRange(idx: number) {
    setEntryRanges(entryRanges.filter((_, i) => i !== idx))
  }

  function updateRange(idx: number, field: 'start' | 'end', value: string) {
    setEntryRanges(entryRanges.map((r, i) => (i === idx ? { ...r, [field]: value } : r)))
  }

  /** Format ranges display for entry list */
  function formatEntryTime(entry: WorkDay): string {
    if (entry.dayType === 'leave') return '-'
    if (entry.ranges && entry.ranges.length > 0) {
      return entry.ranges.map((r) => `${r.start}-${r.end}`).join(' | ')
    }
    return `${entry.startTime} - ${entry.endTime}`
  }

  // If no employee selected, show selection/creation screen
  if (!currentEmployeeId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-2xl px-4 py-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-indigo-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mes Heures</h1>
                <p className="text-sm text-gray-500">Suivi du temps de travail</p>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-2xl px-4 py-8 space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Qui etes-vous ?</h2>
            <p className="text-sm text-gray-500">
              Selectionnez votre profil ou creez-en un nouveau pour commencer a suivre vos heures.
            </p>

            {employees.length > 0 && (
              <div className="space-y-2">
                {employees.map((emp) => (
                  <button
                    key={emp.id}
                    onClick={() => setCurrentEmployeeId(emp.id)}
                    className="w-full flex items-center justify-between rounded-lg border border-gray-200 p-4 text-left hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
                  >
                    <div>
                      <div className="font-medium text-gray-900">{emp.name}</div>
                      <div className="text-sm text-gray-500">Contrat {emp.contractHours}h/semaine</div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </button>
                ))}
              </div>
            )}

            {!showProfileForm ? (
              <button
                onClick={() => setShowProfileForm(true)}
                className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-4 text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
              >
                <Plus className="h-5 w-5" />
                Creer mon profil
              </button>
            ) : (
              <form onSubmit={handleCreateProfile} className="space-y-4 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                <div>
                  <label htmlFor="profile-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Votre nom / pseudo
                  </label>
                  <input
                    id="profile-name"
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Marie D."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    autoFocus
                  />
                </div>
                <div>
                  <label htmlFor="contract-hours" className="block text-sm font-medium text-gray-700 mb-1">
                    Heures contrat / semaine
                  </label>
                  <div className="flex gap-2">
                    {[35, 39].map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setFormContractHours(h)}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                          formContractHours === h
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {h}h
                      </button>
                    ))}
                    <input
                      id="contract-hours"
                      type="number"
                      min={1}
                      max={60}
                      value={formContractHours}
                      onChange={(e) => setFormContractHours(Number(e.target.value))}
                      className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 text-center focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                    <span className="self-center text-sm text-gray-500">h/sem</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={loading || !formName.trim()}
                    className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Creation...' : 'Creer'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowProfileForm(false)}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            )}
          </div>
        </main>
      </div>
    )
  }

  // Main dashboard for logged-in employee
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-7 w-7 text-indigo-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Mes Heures</h1>
                {currentEmployee && (
                  <p className="text-sm text-gray-500">
                    {currentEmployee.name} - Contrat {currentEmployee.contractHours}h/sem
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/stats"
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
              >
                <BarChart3 className="h-4 w-4" />
                Mes stats
              </Link>
              <button
                onClick={switchProfile}
                className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                title="Changer de profil"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        {/* Entry Form */}
        <form onSubmit={handleSubmitEntry} className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingId ? 'Modifier la saisie' : 'Saisir mes heures'}
            </h2>
            {entryDayType !== 'leave' && (
              <div className="flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
                <button
                  type="button"
                  onClick={() => setEntryMode('simple')}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    entryMode === 'simple'
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Horaires
                </button>
                <button
                  type="button"
                  onClick={() => setEntryMode('ranges')}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    entryMode === 'ranges'
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Plages
                </button>
              </div>
            )}
          </div>

          {entryError && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{entryError}</div>
          )}
          {entrySuccess && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">{entrySuccess}</div>
          )}

          {/* Date picker */}
          <div>
            <label htmlFor="entry-date" className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => adjustDate(-1)}
                className="rounded-lg border border-gray-300 p-2 hover:bg-gray-50"
                aria-label="Jour precedent"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <input
                id="entry-date"
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => adjustDate(1)}
                className="rounded-lg border border-gray-300 p-2 hover:bg-gray-50"
                aria-label="Jour suivant"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-gray-400">{formatDateFr(entryDate)}</p>
              {isHoliday && (
                <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                  <CalendarOff className="h-3 w-3" />
                  {holidayName}
                </span>
              )}
            </div>
          </div>

          {/* Day type selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type de journee</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setEntryDayType('work')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  entryDayType === 'work'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Briefcase className="h-4 w-4" />
                Jour travaille
              </button>
              <button
                type="button"
                onClick={() => setEntryDayType('holiday_worked')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  entryDayType === 'holiday_worked'
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <CalendarOff className="h-4 w-4" />
                Ferie travaille
              </button>
              <button
                type="button"
                onClick={() => setEntryDayType('leave')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  entryDayType === 'leave'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Palmtree className="h-4 w-4" />
                Conge
              </button>
            </div>
            {entryDayType === 'holiday_worked' && !isHoliday && (
              <p className="text-xs text-amber-600 mt-1">
                Note : cette date n&apos;est pas un jour ferie officiel.
              </p>
            )}
          </div>

          {/* Hours form - hidden for leave */}
          {entryDayType !== 'leave' ? (
            <>
              {entryMode === 'simple' ? (
                /* Simple mode: start, end, break */
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="entry-start" className="block text-sm font-medium text-gray-700 mb-1">
                      Debut
                    </label>
                    <input
                      id="entry-start"
                      type="time"
                      value={entryStart}
                      onChange={(e) => setEntryStart(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="entry-end" className="block text-sm font-medium text-gray-700 mb-1">
                      Fin
                    </label>
                    <input
                      id="entry-end"
                      type="time"
                      value={entryEnd}
                      onChange={(e) => setEntryEnd(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="entry-break" className="block text-sm font-medium text-gray-700 mb-1">
                      Pause (minutes)
                    </label>
                    <input
                      id="entry-break"
                      type="number"
                      min={0}
                      max={480}
                      value={entryBreak}
                      onChange={(e) => setEntryBreak(Number(e.target.value))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Heures travaillees</label>
                    <div className="rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-2 text-lg font-semibold text-indigo-700">
                      {formatHours(getPreviewHours())}
                    </div>
                  </div>
                </div>
              ) : (
                /* Ranges mode: multiple time slots */
                <div className="space-y-3">
                  <div className="space-y-2">
                    {entryRanges.map((range, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-400 w-4 text-right">{idx + 1}</span>
                        <input
                          type="time"
                          value={range.start}
                          onChange={(e) => updateRange(idx, 'start', e.target.value)}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                        <span className="text-gray-400">-</span>
                        <input
                          type="time"
                          value={range.end}
                          onChange={(e) => updateRange(idx, 'end', e.target.value)}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                        <span className="text-xs text-gray-400 w-14 text-right">
                          {formatHours(calculateRangeHours(range))}
                        </span>
                        {entryRanges.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRange(idx)}
                            className="rounded p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Supprimer cette plage"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={addRange}
                    className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter une plage
                  </button>

                  <div className="flex items-center justify-between rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-2">
                    <span className="text-sm font-medium text-indigo-700">Total</span>
                    <span className="text-lg font-semibold text-indigo-700">
                      {formatHours(getPreviewHours())}
                    </span>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Leave mode: just a message */
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-700">
              <div className="flex items-center gap-2">
                <Palmtree className="h-5 w-5" />
                <span>Jour de conge - pas d&apos;heures a saisir</span>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label htmlFor="entry-notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optionnel)
            </label>
            <input
              id="entry-notes"
              type="text"
              value={entryNotes}
              onChange={(e) => setEntryNotes(e.target.value)}
              placeholder={
                entryDayType === 'leave'
                  ? 'Ex: RTT, vacances, conge maladie...'
                  : 'Ex: reunion client, deplacement...'
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 rounded-lg px-4 py-2.5 font-medium text-white disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors ${
                entryDayType === 'leave'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : entryDayType === 'holiday_worked'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {loading
                ? 'Enregistrement...'
                : editingId
                  ? 'Mettre a jour'
                  : entryDayType === 'leave'
                    ? 'Poser le conge'
                    : 'Enregistrer'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetEntryForm}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
            )}
          </div>
        </form>

        {/* Recent entries */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Mes dernieres saisies</h2>

          {recentEntries.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              Aucune saisie pour le moment. Commencez par enregistrer votre journee ci-dessus.
            </p>
          ) : (
            <div className="space-y-2">
              {recentEntries.map((entry) => {
                const hours = calculateDayHours(entry)
                const contractDaily = (currentEmployee?.contractHours ?? 35) / 5
                const diff = hours - contractDaily
                const hasRanges = entry.ranges && entry.ranges.length > 0
                const dayType = entry.dayType || 'work'
                const badge = DAY_TYPE_BADGES[dayType]
                const isLeave = dayType === 'leave'

                return (
                  <div
                    key={entry.id}
                    className={`flex items-center justify-between rounded-lg border px-4 py-3 hover:bg-gray-100 transition-colors ${
                      isLeave
                        ? 'border-emerald-200 bg-emerald-50'
                        : dayType === 'holiday_worked'
                          ? 'border-amber-200 bg-amber-50'
                          : 'border-gray-100 bg-gray-50'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm font-medium text-gray-900">{formatDateFr(entry.date)}</span>
                        {badge.label && (
                          <span className={`text-xs ${badge.bg} ${badge.text} px-1.5 py-0.5 rounded font-medium`}>
                            {badge.label}
                          </span>
                        )}
                        {!isLeave && (
                          <>
                            <span className="text-sm text-gray-500">{formatEntryTime(entry)}</span>
                            {!hasRanges && entry.breakMinutes > 0 && (
                              <span className="text-xs text-gray-400">({entry.breakMinutes}min pause)</span>
                            )}
                            {hasRanges && (
                              <span className="text-xs bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded">
                                {entry.ranges!.length} plages
                              </span>
                            )}
                          </>
                        )}
                      </div>
                      {entry.notes && <p className="text-xs text-gray-400 mt-0.5 truncate">{entry.notes}</p>}
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      {!isLeave && (
                        <div className="text-right">
                          <div className="text-sm font-semibold text-gray-900">{formatHours(hours)}</div>
                          <div className={`text-xs ${diff > 0 ? 'text-red-500' : diff < 0 ? 'text-orange-500' : 'text-green-500'}`}>
                            {diff > 0 ? '+' : ''}{formatHours(diff)}
                          </div>
                        </div>
                      )}
                      <div className="flex gap-1">
                        <button
                          onClick={() => startEdit(entry)}
                          className="rounded p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="rounded p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
