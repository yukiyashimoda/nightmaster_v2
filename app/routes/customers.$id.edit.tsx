import type { Route } from '../+types/routes/customers.$id.edit'
import { Link } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { Button } from '../../src/components/ui/button'
import { getCustomer, getCasts, getCustomers, getBottlesByCustomer } from '../../src/lib/kv.server'
import { EditCustomerForm } from '../../src/app/customers/[id]/edit/edit-customer-form'

export async function loader({ params }: Route.LoaderArgs) {
  const { id } = params
  const [customer, casts, allCustomers, bottles] = await Promise.all([
    getCustomer(id),
    getCasts(),
    getCustomers(),
    getBottlesByCustomer(id),
  ])

  if (!customer) {
    throw new Response(null, { status: 404 })
  }

  const otherCustomers = allCustomers.filter((c) => c.id !== id)

  return { id, customer, casts, otherCustomers, bottles }
}

export async function action({ request, params }: Route.ActionArgs) {
  const { id } = params
  const body = await request.json()
  const { data, bottleUpdates = [], newBottles = [], deletedBottleIds = [] } = body
  try {
    const { getSessionUser } = await import('../../src/lib/auth.server')
    const { updateCustomer, updateBottle, createBottle, deleteBottle } = await import('../../src/lib/kv.server')
    const updatedBy = getSessionUser(request) ?? ''
    const result = await updateCustomer(id, { ...data, updatedBy })
    if (!result) return Response.json({ success: false, error: '顧客が見つかりません' })
    await Promise.all([
      ...bottleUpdates.map((b: { id: string; name: string; remaining: string }) =>
        updateBottle(b.id, { name: b.name, remaining: b.remaining })
      ),
      ...newBottles.map((b: { name: string; remaining: string; openedDate: string }) =>
        createBottle({ customerId: id, name: b.name, remaining: b.remaining, openedDate: b.openedDate })
      ),
      ...deletedBottleIds.map((bid: string) => deleteBottle(bid)),
    ])
    return Response.json({ success: true })
  } catch {
    return Response.json({ success: false, error: '更新に失敗しました' })
  }
}

export default function EditCustomerPage({ loaderData }: Route.ComponentProps) {
  const { id, customer, casts, otherCustomers, bottles } = loaderData

  return (
    <div className="min-h-screen pb-10">
      <div className="sticky top-14 z-20 bg-white/95 backdrop-blur border-b border-stone-200 px-4 py-3 flex items-center gap-3">
        <Link to={`/customers/${id}`}>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="font-bold text-gray-900">顧客編集</h1>
      </div>

      <div className="px-4 py-5">
        <EditCustomerForm
          customer={customer}
          casts={casts}
          otherCustomers={otherCustomers}
          existingBottles={bottles}
        />
      </div>
    </div>
  )
}
