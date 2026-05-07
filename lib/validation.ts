import { z } from 'zod'

export const employeeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
})

export const timeEntrySchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  checkIn: z.string().datetime('Invalid date format'),
  checkOut: z.string().datetime('Invalid date format').nullable().default(null),
  breakTime: z.number().min(0, 'Break time cannot be negative').default(0),
})

export type EmployeeInput = z.infer<typeof employeeSchema>
export type TimeEntryInput = z.infer<typeof timeEntrySchema>
