export interface Employee {
  id: string
  name: string
  contractHours: number // 35, 39, or custom weekly hours
  createdAt: string
}

export interface TimeRange {
  start: string // HH:MM
  end: string // HH:MM
}

export interface WorkDay {
  id: string
  employeeId: string
  date: string // YYYY-MM-DD
  startTime: string // HH:MM - used in simple mode
  endTime: string // HH:MM - used in simple mode
  breakMinutes: number // break duration in minutes - used in simple mode
  ranges?: TimeRange[] // optional: multiple time slots per day
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
