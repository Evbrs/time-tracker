import { NextResponse } from 'next/server'
import { getAll, upsert } from '@/lib/storage'
import { Employee } from '@/lib/types'
import { employeeSchema } from '@/lib/validation'
import { generateId } from '@/lib/utils'

export async function GET() {
  try {
    console.log('[GET /api/employees] Fetching all employees')
    const employees = await getAll<Employee>('employees')
    console.log('[GET /api/employees] Found', employees.length, 'employees')
    return NextResponse.json(employees)
  } catch (err) {
    console.error('[GET /api/employees] Error:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    console.log('[POST /api/employees] Received request')
    const body = await request.json()
    console.log('[POST /api/employees] Body:', body)

    const validation = employeeSchema.safeParse(body)
    console.log('[POST /api/employees] Validation success:', validation.success)
    if (!validation.success) {
      console.log('[POST /api/employees] Validation errors:', validation.error.errors)
      return NextResponse.json({ error: validation.error.errors }, { status: 400 })
    }

    const employee: Employee = {
      id: generateId(),
      name: validation.data.name,
      email: validation.data.email,
      createdAt: new Date().toISOString(),
    }
    console.log('[POST /api/employees] Created employee:', employee.id)

    await upsert('employees', employee)
    console.log('[POST /api/employees] Upsert complete')
    return NextResponse.json(employee, { status: 201 })
  } catch (err) {
    console.error('[POST /api/employees] Error:', err instanceof Error ? err.message : String(err))
    console.error('[POST /api/employees] Stack:', err instanceof Error ? err.stack : '')
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
