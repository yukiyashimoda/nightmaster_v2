'use server'

import { updateCustomer } from '@/lib/kv'
import { revalidatePath } from 'next/cache'

export async function toggleFavoriteAction(customerId: string, isFavorite: boolean) {
  await updateCustomer(customerId, { isFavorite })
  revalidatePath('/')
  revalidatePath('/favorites')
}
