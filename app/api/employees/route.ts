import { NextResponse } from 'next/server'
import { getAll, upsert } from '@/lib/storage'
import { Employee } from '@/lib/types'
import { employeeSchema } from '@/lib/validation'
import { generateId } from '@/lib/utils'

export async function GET() {
  const employees = await getAll<Employee>('employees')
  return NextResponse.json(employees)
}

export async function POST(request: Request) {
  const body = await request.json()

  const validation = employeeSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({ error: validation.error.errors }, { status: 400 })
  }

  const employee: Employee = {
    id: generateId(),
    name: validation.data.name,
    email: validation.data.email,
    createdAt: new Date().toISOString(),
  }

  await upsert('employees', employee)
  return NextResponse.json(employee, { status: 201 })
}
