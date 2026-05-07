import { z } from 'zod'

export const employeeSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100),
  contractHours: z.number().min(1).max(60).default(35),
})

export const workDaySchema = z.object({
  employeeId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format invalide (HH:MM)'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format invalide (HH:MM)'),
  breakMinutes: z.number().min(0).max(480).default(60),
  notes: z.string().max(500).default(''),
})

export type EmployeeInput = z.infer<typeof employeeSchema>
export type WorkDayInput = z.infer<typeof workDaySchema>
