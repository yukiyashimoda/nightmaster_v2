import type { Route } from '../+types/routes/customers.$id.visits.new'
import { Link } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { Button } from '../../src/components/ui/button'
import { getSupabase } from '../lib/db.server'
import { getCustomer, getCasts, getBottlesByCustomer, getCustomers } from '../../src/lib/kv.server'
import { NewVisitForm } from '../../src/app/customers/[id]/visits/new/new-visit-form'

export async function loader({ params, context }: Route.LoaderArgs) {
  const db = getSupabase(context)
  const { id } = params
  const [customer, casts, bottles, allCustomers] = await Promise.all([
    getCustomer(db, id),
    getCasts(db),
    getBottlesByCustomer(db, id),
    getCustomers(db),
  ])

  if (!customer) {
    throw new Response(null, { status: 404 })
  }

  return {
    id,
    customer,
    casts,
    bottles,
    otherCustomers: allCustomers.filter((c) => c.id !== id),
  }
}

export async function action({ request, params, context }: Route.ActionArgs) {
  const body = await request.json()
  const { createBottle, updateBottle, createVisitRecord, getCustomer, updateCustomer } = await import('../../src/lib/kv.server')
  const { getSupabase: getSupabaseInAction } = await import('../lib/db.server')
  const db = getSupabaseInAction(context)
  try {
    const updatedBottles = await Promise.all(
      (body.bottleUpdates ?? []).map((b: { id: string; remaining: string }) => updateBottle(db, b.id, { remaining: b.remaining }))
    )
    const openedBottleIds: string[] = []
    const newBottleSnapshots: any[] = []
    for (const nb of (body.newBottles ?? [])) {
      if (nb.name.trim()) {
        const bottle = await createBottle(db, { customerId: body.customerId, name: nb.name.trim(), remaining: nb.remaining, openedDate: nb.openedDate })
        openedBottleIds.push(bottle.id)
        newBottleSnapshots.push(bottle)
      }
    }
    const snapshotMap = new Map()
    for (const b of updatedBottles) { if (b) snapshotMap.set(b.id, b) }
    for (const b of newBottleSnapshots) { snapshotMap.set(b.id, b) }
    const bottleSnapshots = Array.from(snapshotMap.values())
    await createVisitRecord(db, {
      customerId: body.customerId,
      visitDate: body.visitDate,
      designatedCastIds: body.designatedCastIds,
      inStoreCastIds: body.inStoreCastIds,
      bottlesOpened: openedBottleIds,
      bottlesUsed: (body.bottleUpdates ?? []).map((b: { id: string }) => b.id),
      memo: body.memo,
      isAlert: body.isAlert ?? false,
      alertReason: body.isAlert ? (body.alertReason ?? '') : '',
      bottleSnapshots,
    })
    if (body.designatedCastIds?.length > 0) {
      const c = await getCustomer(db, body.customerId)
      if (c) {
        const merged = Array.from(new Set([...c.designatedCastIds, ...body.designatedCastIds]))
        await updateCustomer(db, body.customerId, { designatedCastIds: merged })
      }
    }
    if (body.linkedCustomerIds?.length > 0) {
      const mainCustomer = await getCustomer(db, body.customerId)
      if (mainCustomer) {
        const merged = Array.from(new Set([...mainCustomer.linkedCustomerIds, ...body.linkedCustomerIds]))
        await updateCustomer(db, body.customerId, { linkedCustomerIds: merged })
      }
      for (const linkedId of body.linkedCustomerIds) {
        const linked = await getCustomer(db, linkedId)
        if (linked) {
          const mergedLinked = Array.from(new Set([...linked.linkedCustomerIds, body.customerId]))
          await updateCustomer(db, linkedId, { linkedCustomerIds: mergedLinked })
        }
      }
    }
    return Response.json({ success: true })
  } catch {
    return Response.json({ success: false, error: '記録に失敗しました' })
  }
}

export default function NewVisitPage({ loaderData }: Route.ComponentProps) {
  const { id, customer, casts, bottles, otherCustomers } = loaderData

  return (
    <div className="min-h-screen pb-10">
      <div className="sticky top-14 z-20 bg-white/95 backdrop-blur border-b border-stone-200 px-4 py-3 flex items-center gap-3">
        <Link to={`/customers/${id}`}>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="font-bold text-gray-900 text-sm">来店記録</h1>
          <p className="text-xs text-gray-400">{customer.name}</p>
        </div>
      </div>

      <div className="px-4 py-5">
        <NewVisitForm
          customerId={id}
          casts={casts}
          existingBottles={bottles}
          defaultDesignatedCastIds={customer.designatedCastIds}
          allCustomers={otherCustomers}
          defaultLinkedCustomerIds={customer.linkedCustomerIds}
        />
      </div>
    </div>
  )
}
