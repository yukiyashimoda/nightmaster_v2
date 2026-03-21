'use server'

import { createCustomer, createBottle, createVisitRecord } from '@/lib/kv'
import { getSessionUser } from '@/lib/auth'
import type { Customer } from '@/types'

interface NewBottleInput {
  name: string
  remaining: string
  openedDate: string
}

export async function createCustomerAction(
  data: Omit<Customer, 'id' | 'updatedAt' | 'updatedBy'>,
  bottles: NewBottleInput[] = [],
  inStoreCastIds: string[] = []
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const updatedBy = (await getSessionUser()) ?? ''
    const customer = await createCustomer({ ...data, updatedBy })

    const createdBottles = await Promise.all(
      bottles.map((b) =>
        createBottle({
          customerId: customer.id,
          name: b.name,
          remaining: b.remaining,
          openedDate: b.openedDate,
        })
      )
    )

    // 最初の来店日があれば来店記録を自動作成
    if (customer.lastVisitDate) {
      await createVisitRecord({
        customerId: customer.id,
        visitDate: customer.lastVisitDate,
        designatedCastIds: customer.designatedCastIds,
        inStoreCastIds,
        bottlesOpened: createdBottles.map((b) => b.id),
        bottlesUsed: [],
        memo: '',
      })
    }

    return { success: true, id: customer.id }
  } catch (e) {
    return { success: false, error: '登録に失敗しました' }
  }
}
