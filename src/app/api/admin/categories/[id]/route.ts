import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'

// PATCH /api/admin/categories/[id] — update category
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const body = await req.json()
  const { name, icon, description, sortOrder, fields, isActive, isApproved } = body

  const updateData: any = {}
  if (name !== undefined) updateData.name = name
  if (icon !== undefined) updateData.icon = icon
  if (description !== undefined) updateData.description = description
  if (sortOrder !== undefined) updateData.sortOrder = sortOrder
  if (fields !== undefined) updateData.fields = fields
  if (isActive !== undefined) updateData.isActive = Boolean(isActive)
  if (isApproved !== undefined) updateData.isApproved = Boolean(isApproved)

  const category = await prisma.category.update({
    where: { id },
    data: updateData,
  })

  return NextResponse.json({ category })
}

// DELETE /api/admin/categories/[id] — delete category
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params

  // Check if any items are using this category
  const itemCount = await prisma.item.count({ where: { categoryId: id } })
  if (itemCount > 0) {
    return NextResponse.json(
      { message: `Cannot delete — ${itemCount} item(s) are using this category` },
      { status: 400 }
    )
  }

  await prisma.category.delete({ where: { id } })
  return NextResponse.json({ message: 'Category deleted' })
}
