import { z } from 'zod'

export const employeeSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100),
  contractHours: z.number().min(1).max(60).default(35),
})

const timeRangeSchema = z.object({
  start: z.string().regex(/^\d{2}:\d{2}$/, 'Format invalide (HH:MM)'),
  end: z.string().regex(/^\d{2}:\d{2}$/, 'Format invalide (HH:MM)'),
})

export const workDaySchema = z.object({
  employeeId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format invalide (HH:MM)').default('00:00'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format invalide (HH:MM)').default('00:00'),
  breakMinutes: z.number().min(0).max(480).default(0),
  ranges: z.array(timeRangeSchema).optional(),
  dayType: z.enum(['work', 'holiday_worked', 'leave']).default('work'),
  notes: z.string().max(500).default(''),
})

export type EmployeeInput = z.infer<typeof employeeSchema>
export type WorkDayInput = z.infer<typeof workDaySchema>
