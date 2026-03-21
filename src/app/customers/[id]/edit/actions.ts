'use server'

import { updateCustomer, createBottle, updateBottle, deleteBottle } from '@/lib/kv'
import { getSessionUser } from '@/lib/auth'
import type { Customer } from '@/types'

interface BottleUpdate {
  id: string
  name: string
  remaining: string
}

interface NewBottleInput {
  name: string
  remaining: string
  openedDate: string
}

export async function updateCustomerAction(
  id: string,
  data: Partial<Omit<Customer, 'id' | 'updatedAt' | 'updatedBy' | 'lastVisitDate'>>,
  bottleUpdates: BottleUpdate[] = [],
  newBottles: NewBottleInput[] = [],
  deletedBottleIds: string[] = []
): Promise<{ success: boolean; error?: string }> {
  try {
    const updatedBy = (await getSessionUser()) ?? ''
    const result = await updateCustomer(id, { ...data, updatedBy })
    if (!result) return { success: false, error: '顧客が見つかりません' }

    await Promise.all([
      ...bottleUpdates.map((b) =>
        updateBottle(b.id, { name: b.name, remaining: b.remaining })
      ),
      ...newBottles.map((b) =>
        createBottle({ customerId: id, name: b.name, remaining: b.remaining, openedDate: b.openedDate })
      ),
      ...deletedBottleIds.map((bid) => deleteBottle(bid)),
    ])

    return { success: true }
  } catch (e) {
    return { success: false, error: '更新に失敗しました' }
  }
}
