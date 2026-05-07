import { NextResponse } from 'next/server'
import { getById, upsert, removeItem } from '@/lib/storage'
import { WorkDay } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const entry = await getById<WorkDay>('workdays', id)
    if (!entry) {
      return NextResponse.json({ error: 'Saisie introuvable' }, { status: 404 })
    }

    const updated: WorkDay = { ...entry, ...body, id: entry.id, employeeId: entry.employeeId }
    await upsert('workdays', updated)
    return NextResponse.json(updated)
  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await removeItem('workdays', id)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
