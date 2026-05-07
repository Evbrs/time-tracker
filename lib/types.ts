export interface Employee {
  id: string
  name: string
  email: string
  createdAt: string
}

export interface TimeEntry {
  id: string
  employeeId: string
  checkIn: string
  checkOut: string | null
  breakTime: number
  createdAt: string
}

export interface DailyReport {
  employeeId: string
  employeeName: string
  date: string
  entries: TimeEntry[]
  totalHours: number
  totalBreakTime: number
}
