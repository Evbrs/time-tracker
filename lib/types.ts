export interface Employee {
  id: string
  name: string
  contractHours: number // 35, 39, or custom weekly hours
  createdAt: string
}

export interface WorkDay {
  id: string
  employeeId: string
  date: string // YYYY-MM-DD
  startTime: string // HH:MM
  endTime: string // HH:MM
  breakMinutes: number // lunch/break duration in minutes
  notes: string
  createdAt: string
}

export interface PeriodStats {
  totalWorkedHours: number
  totalContractHours: number
  diffHours: number // positive = overtime, negative = undertime
  avgDailyHours: number
  minDailyHours: number
  maxDailyHours: number
  totalDays: number
  totalWorkingDays: number // business days in period
  avgBreakMinutes: number
  entries: WorkDay[]
}
