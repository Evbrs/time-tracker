'use client'

import { useEffect, useState, useCallback } from 'react'
import { Employee, PeriodStats, WorkDay } from '@/lib/types'
import { getDateString, formatHours, formatDiff, formatDateFr, calculateDayHours, getHolidayName } from '@/lib/utils'
import { ArrowLeft, Calendar, Download, TrendingUp, Clock, Minus, Plus, RefreshCw, CalendarOff, Palmtree } from 'lucide-react'
import Link from 'next/link'

type PresetPeriod = '1w' | '2w' | '1m' | '2m' | '3m' | '6m' | 'custom'

function getPresetDates(preset: PresetPeriod): { start: string; end: string } {
  const end = getDateString()
  const d = new Date()
  switch (preset) {
    case '1w':
      d.setDate(d.getDate() - 7)
      break
    case '2w':
      d.setDate(d.getDate() - 14)
      break
    case '1m':
      d.setMonth(d.getMonth() - 1)
      break
    case '2m':
      d.setMonth(d.getMonth() - 2)
      break
    case '3m':
      d.setMonth(d.getMonth() - 3)
      break
    case '6m':
      d.setMonth(d.getMonth() - 6)
      break
    default:
      d.setMonth(d.getMonth() - 1)
  }
  return { start: d.toISOString().split('T')[0], end }
}

const PRESET_LABELS: Record<PresetPeriod, string> = {
  '1w': '1 semaine',
  '2w': '2 semaines',
  '1m': '1 mois',
  '2m': '2 mois',
  '3m': '3 mois',
  '6m': '6 mois',
  custom: 'Personnalise',
}

export default function StatsPage() {
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [stats, setStats] = useState<PeriodStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [preset, setPreset] = useState<PresetPeriod>('1m')
  const [startDate, setStartDate] = useState(() => getPresetDates('1m').start)
  const [endDate, setEndDate] = useState(() => getPresetDates('1m').end)
  const [employeeId, setEmployeeId] = useState<string | null>(null)

  useEffect(() => {
    const savedId = localStorage.getItem('currentEmployeeId')
    if (savedId) {
      setEmployeeId(savedId)
    }
  }, [])

  const loadStats = useCallback(async () => {
    if (!employeeId) return
    setLoading(true)
    try {
      const res = await fetch(
        `/api/stats?employeeId=${employeeId}&startDate=${startDate}&endDate=${endDate}&_t=${Date.now()}`,
        { cache: 'no-store' }
      )
      if (res.ok) {
        const data = await res.json()
        setEmployee(data.employee)
        setStats(data.stats)
      }
    } finally {
      setLoading(false)
    }
  }, [employeeId, startDate, endDate])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  function handlePresetChange(p: PresetPeriod) {
    setPreset(p)
    if (p !== 'custom') {
      const dates = getPresetDates(p)
      setStartDate(dates.start)
      setEndDate(dates.end)
    }
  }

  function handleExportCSV() {
    if (!stats || !employee) return

    const headers = ['Date', 'Type', 'Debut', 'Fin', 'Pause (min)', 'Heures travaillees', 'Notes']
    const rows = stats.entries.map((e) => {
      const hours = calculateDayHours(e)
      const type = e.dayType === 'leave' ? 'Conge' : e.dayType === 'holiday_worked' ? 'Ferie travaille' : 'Travail'
      return [e.date, type, e.startTime, e.endTime, e.breakMinutes, hours.toFixed(2), `"${e.notes}"`].join(';')
    })

    const summary = [
      '',
      `Total heures travaillees;${stats.totalWorkedHours.toFixed(2)}`,
      `Total heures contrat;${stats.totalContractHours.toFixed(2)}`,
      `Difference;${stats.diffHours.toFixed(2)}`,
      `Moyenne/jour;${stats.avgDailyHours.toFixed(2)}`,
      `Min/jour;${stats.minDailyHours.toFixed(2)}`,
      `Max/jour;${stats.maxDailyHours.toFixed(2)}`,
      `Jours saisis;${stats.totalDays}`,
      `Jours ouvres;${stats.totalWorkingDays}`,
      `Jours feries (sem.);${stats.totalHolidays}`,
      `Feries travailles;${stats.totalHolidaysWorked}`,
      `Jours de conge;${stats.totalLeaveDays}`,
    ]

    const csv = [headers.join(';'), ...rows, ...summary].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mes-heures_${startDate}_${endDate}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (!employeeId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-gray-500">Veuillez d&apos;abord selectionner votre profil.</p>
          <Link href="/" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Link>
        </div>
      </div>
    )
  }

  const diff = stats ? formatDiff(stats.diffHours) : null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="text-indigo-600 hover:text-indigo-700">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Mes statistiques</h1>
                {employee && (
                  <p className="text-sm text-gray-500">
                    {employee.name} - Contrat {employee.contractHours}h/sem
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                disabled={!stats || stats.totalDays === 0}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <Download className="h-4 w-4" />
                CSV
              </button>
              <button
                onClick={loadStats}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                title="Rafraichir"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        {/* Period selector */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(PRESET_LABELS) as PresetPeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => handlePresetChange(p)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  preset === p
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {PRESET_LABELS[p]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <label htmlFor="stat-start" className="text-sm text-gray-600">Du</label>
              <input
                id="stat-start"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  setPreset('custom')
                }}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <span className="text-gray-400">-</span>
            <div className="flex items-center gap-2">
              <label htmlFor="stat-end" className="text-sm text-gray-600">Au</label>
              <input
                id="stat-end"
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value)
                  setPreset('custom')
                }}
                max={getDateString()}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Chargement des statistiques...</p>
          </div>
        ) : stats ? (
          <>
            {/* Stats cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <Clock className="h-4 w-4" />
                  Heures travaillees
                </div>
                <div className="text-2xl font-bold text-gray-900">{formatHours(stats.totalWorkedHours)}</div>
                <div className="text-xs text-gray-400 mt-1">
                  sur {stats.totalDays} jour{stats.totalDays > 1 ? 's' : ''} saisi{stats.totalDays > 1 ? 's' : ''}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <Calendar className="h-4 w-4" />
                  Heures contrat
                </div>
                <div className="text-2xl font-bold text-gray-900">{formatHours(stats.totalContractHours)}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {stats.totalWorkingDays} jours ouvres
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <TrendingUp className="h-4 w-4" />
                  Difference
                </div>
                <div className={`text-2xl font-bold ${diff?.className}`}>{diff?.text}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {stats.diffHours > 0 ? 'heures supplementaires' : stats.diffHours < 0 ? 'heures manquantes' : 'pile dans le contrat'}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <TrendingUp className="h-4 w-4" />
                  Moyenne / jour
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {stats.totalDays > 0 ? formatHours(stats.avgDailyHours) : '-'}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {stats.totalDays > 0 ? `pause moy. ${Math.round(stats.avgBreakMinutes)}min` : 'aucune donnee'}
                </div>
              </div>
            </div>

            {/* Holidays & Leave cards */}
            {(stats.totalHolidays > 0 || stats.totalLeaveDays > 0 || stats.totalHolidaysWorked > 0) && (
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-center gap-2 text-sm text-amber-700 mb-1">
                    <CalendarOff className="h-4 w-4" />
                    Jours feries (sem.)
                  </div>
                  <div className="text-2xl font-bold text-amber-800">{stats.totalHolidays}</div>
                  {stats.totalHolidaysWorked > 0 && (
                    <div className="text-xs text-amber-600 mt-1">
                      dont {stats.totalHolidaysWorked} travaille{stats.totalHolidaysWorked > 1 ? 's' : ''}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-center gap-2 text-sm text-emerald-700 mb-1">
                    <Palmtree className="h-4 w-4" />
                    Jours de conge
                  </div>
                  <div className="text-2xl font-bold text-emerald-800">{stats.totalLeaveDays}</div>
                  <div className="text-xs text-emerald-600 mt-1">
                    poses sur la periode
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <Calendar className="h-4 w-4" />
                    Jours effectifs
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.totalWorkingDays - stats.totalLeaveDays}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    ouvres - conges
                  </div>
                </div>
              </div>
            )}

            {/* Min/Max bar */}
            {stats.totalDays > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Amplitude journaliere</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Minus className="h-4 w-4 text-orange-500" />
                    <span className="text-sm text-gray-600">Min:</span>
                    <span className="font-semibold text-orange-600">{formatHours(stats.minDailyHours)}</span>
                  </div>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    {(() => {
                      const contractDaily = (employee?.contractHours ?? 35) / 5
                      const range = stats.maxDailyHours - stats.minDailyHours || 1
                      const contractPos = Math.min(100, Math.max(0, ((contractDaily - stats.minDailyHours) / range) * 100))
                      return (
                        <div className="relative h-full">
                          <div className="absolute inset-0 bg-gradient-to-r from-orange-300 via-green-400 to-red-400 rounded-full" />
                          <div
                            className="absolute top-0 h-full w-0.5 bg-gray-800"
                            style={{ left: `${contractPos}%` }}
                            title={`Contrat: ${formatHours(contractDaily)}/jour`}
                          />
                        </div>
                      )
                    })()}
                  </div>
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-gray-600">Max:</span>
                    <span className="font-semibold text-red-600">{formatHours(stats.maxDailyHours)}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  La barre noire indique le contrat ({formatHours((employee?.contractHours ?? 35) / 5)}/jour)
                </p>
              </div>
            )}

            {/* Entries table */}
            {stats.entries.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-sm font-medium text-gray-700">
                    Detail des journees ({stats.entries.length} saisie{stats.entries.length > 1 ? 's' : ''})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="px-4 py-2 text-left font-medium text-gray-600">Date</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-600">Type</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-600">Horaires</th>
                        <th className="px-4 py-2 text-center font-medium text-gray-600">Pause</th>
                        <th className="px-4 py-2 text-right font-medium text-gray-600">Heures</th>
                        <th className="px-4 py-2 text-right font-medium text-gray-600">Diff</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-600">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.entries.map((entry: WorkDay) => {
                        const hours = calculateDayHours(entry)
                        const contractDaily = (employee?.contractHours ?? 35) / 5
                        const entryDiff = hours - contractDaily
                        const diffFormatted = formatDiff(entryDiff)
                        const dayType = entry.dayType || 'work'
                        const isLeave = dayType === 'leave'
                        const holiday = getHolidayName(entry.date)
                        return (
                          <tr
                            key={entry.id}
                            className={`border-b border-gray-100 hover:bg-gray-50 ${
                              isLeave ? 'bg-emerald-50/50' : dayType === 'holiday_worked' ? 'bg-amber-50/50' : ''
                            }`}
                          >
                            <td className="px-4 py-2 text-gray-900 whitespace-nowrap">{formatDateFr(entry.date)}</td>
                            <td className="px-4 py-2">
                              {isLeave ? (
                                <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-medium">
                                  <Palmtree className="h-3 w-3" />
                                  Conge
                                </span>
                              ) : dayType === 'holiday_worked' ? (
                                <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                                  <CalendarOff className="h-3 w-3" />
                                  Ferie
                                </span>
                              ) : holiday ? (
                                <span className="text-xs text-amber-600">{holiday}</span>
                              ) : (
                                <span className="text-xs text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-gray-600">
                              {isLeave ? (
                                <span className="text-xs text-gray-400">-</span>
                              ) : entry.ranges && entry.ranges.length > 0 ? (
                                entry.ranges.map((r, i) => (
                                  <span key={i}>
                                    {i > 0 && <span className="text-gray-300 mx-1">|</span>}
                                    {r.start}-{r.end}
                                  </span>
                                ))
                              ) : (
                                <span className="whitespace-nowrap">{entry.startTime} - {entry.endTime}</span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-center text-gray-500">
                              {isLeave ? (
                                '-'
                              ) : entry.ranges && entry.ranges.length > 0 ? (
                                <span className="text-xs text-indigo-500">{entry.ranges.length} plages</span>
                              ) : (
                                `${entry.breakMinutes}min`
                              )}
                            </td>
                            <td className="px-4 py-2 text-right font-medium text-gray-900">
                              {isLeave ? '-' : formatHours(hours)}
                            </td>
                            <td className={`px-4 py-2 text-right font-medium ${isLeave ? 'text-gray-400' : diffFormatted.className}`}>
                              {isLeave ? '-' : diffFormatted.text}
                            </td>
                            <td className="px-4 py-2 text-gray-400 max-w-[200px] truncate">{entry.notes || '-'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 font-medium">
                        <td className="px-4 py-3 text-gray-900" colSpan={4}>Total</td>
                        <td className="px-4 py-3 text-right text-gray-900">{formatHours(stats.totalWorkedHours)}</td>
                        <td className={`px-4 py-3 text-right ${diff?.className}`}>{diff?.text}</td>
                        <td className="px-4 py-3"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {stats.totalDays === 0 && stats.totalLeaveDays === 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
                <p className="text-gray-500">Aucune saisie sur cette periode.</p>
                <Link href="/" className="text-indigo-600 hover:text-indigo-700 text-sm mt-2 inline-block">
                  Saisir mes heures
                </Link>
              </div>
            )}
          </>
        ) : null}
      </main>
    </div>
  )
}
