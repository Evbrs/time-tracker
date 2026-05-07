import { getAll, upsert } from '@/lib/storage'
import { Employee } from '@/lib/types'
import { employeeSchema } from '@/lib/validation'
import { generateId } from '@/lib/utils'

export async function GET() {
  const employees = await getAll<Employee>('employees')
  return new Response(JSON.stringify(employees), {
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function POST(request: Request) {
  const body = await request.json()

  const validation = employeeSchema.safeParse(body)
  if (!validation.success) {
    return new Response(JSON.stringify({ error: validation.error.errors }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const employee = {
    id: generateId(),
    name: validation.data.name,
    email: validation.data.email,
    createdAt: new Date().toISOString(),
  }

  await upsert('employees', employee as Employee)
  return new Response(JSON.stringify(employee), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  })
}
