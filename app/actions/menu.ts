'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getOrganisation } from '@/lib/organisation'

export async function createCategory(name: string) {
  const supabase = await createClient()
  const org = await getOrganisation()
  if (!org) return { error: 'No organisation assigned' }

  const { data: maxSort } = await supabase
    .from('menu_categories')
    .select('sort')
    .order('sort', { ascending: false })
    .limit(1)
    .single()

  const { data, error } = await supabase
    .from('menu_categories')
    .insert({ name: name.trim(), sort: (maxSort?.sort ?? -1) + 1, organisation_id: org.id })
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/menu')
  return { data }
}

export async function updateCategory(id: string, name: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('menu_categories')
    .update({ name: name.trim() })
    .eq('id', id)
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/menu')
  return { data }
}

export async function deleteCategory(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('menu_categories').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/menu')
  return { data: { id } }
}

export async function createMenuItem(data: {
  categoryId: string
  name: string
  description?: string
  price: number
}) {
  const supabase = await createClient()
  const org = await getOrganisation()
  if (!org) return { error: 'No organisation assigned' }

  const { data: maxSort } = await supabase
    .from('menu_items')
    .select('sort')
    .eq('category_id', data.categoryId)
    .order('sort', { ascending: false })
    .limit(1)
    .single()

  const { data: created, error } = await supabase.from('menu_items').insert({
    category_id: data.categoryId,
    name: data.name.trim(),
    description: data.description?.trim() || null,
    price: data.price,
    available: true,
    sort: (maxSort?.sort ?? -1) + 1,
    organisation_id: org.id,
  })
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/menu')
  return { data: created }
}

export async function updateMenuItem(id: string, data: {
  name?: string
  description?: string
  price?: number
  available?: boolean
}) {
  const supabase = await createClient()
  const { data: updated, error } = await supabase
    .from('menu_items')
    .update({
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.description !== undefined && { description: data.description?.trim() || null }),
      ...(data.price !== undefined && { price: data.price }),
      ...(data.available !== undefined && { available: data.available }),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/menu')
  return { data: updated }
}

export async function deleteMenuItem(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('menu_items').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/menu')
  return { data: { id } }
}

export async function toggleMenuItemAvailability(id: string, available: boolean) {
  return updateMenuItem(id, { available })
}
