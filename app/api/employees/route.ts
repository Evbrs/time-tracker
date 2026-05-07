import { NextResponse } from 'next/server'
import { getAll, upsert } from '@/lib/storage'
import { Employee } from '@/lib/types'
import { employeeSchema } from '@/lib/validation'
import { generateId } from '@/lib/utils'

export async function GET() {
  try {
    const employees = await getAll<Employee>('employees')
    return NextResponse.json(employees)
  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validation = employeeSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors }, { status: 400 })
    }

    const employee: Employee = {
      id: generateId(),
      name: validation.data.name,
      contractHours: validation.data.contractHours,
      createdAt: new Date().toISOString(),
    }

    await upsert('employees', employee)
    return NextResponse.json(employee, { status: 201 })
  } catch (err) {
    console.error('[POST /api/employees]', err instanceof Error ? err.stack : String(err))
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur serveur' },
      { status: 500 }
    )
  }
}
