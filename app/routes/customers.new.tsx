import { Link } from 'react-router'
import type { Route } from '../+types/routes/customers.new'
import { ArrowLeft } from 'lucide-react'
import { Button } from '../../src/components/ui/button'
import { getDb } from '../lib/db.server'
import { getCasts, getCustomers, createCustomer, createBottle, createVisitRecord } from '../../src/lib/kv.server'
import { getSessionUser } from '../../src/lib/auth.server'
import { NewCustomerForm } from '../../src/app/customers/new/new-customer-form'

export async function loader({ request, context }: Route.LoaderArgs) {
  const db = getDb(context)
  const url = new URL(request.url)
  const name = url.searchParams.get('name') ?? ''
  const date = url.searchParams.get('date') ?? ''
  const [casts, customers] = await Promise.all([getCasts(db), getCustomers(db)])
  return { casts, customers, initialName: name, initialFirstVisitDate: date }
}

export async function action({ request, context }: Route.ActionArgs) {
  const db = getDb(context)
  const body = await request.json()
  const { data, bottles = [], inStoreCastIds = [] } = body
  try {
    const updatedBy = getSessionUser(request) ?? ''
    const customer = await createCustomer(db, { ...data, updatedBy })
    const createdBottles = await Promise.all(
      bottles.map((b: { name: string; remaining: string; openedDate: string }) =>
        createBottle(db, { customerId: customer.id, name: b.name, remaining: b.remaining, openedDate: b.openedDate })
      )
    )
    if (customer.lastVisitDate) {
      await createVisitRecord(db, {
        customerId: customer.id,
        visitDate: customer.lastVisitDate,
        designatedCastIds: customer.designatedCastIds,
        inStoreCastIds,
        bottlesOpened: createdBottles.map((b) => b.id),
        bottlesUsed: [],
        memo: '',
      })
    }
    return Response.json({ success: true, id: customer.id })
  } catch {
    return Response.json({ success: false, error: '登録に失敗しました' })
  }
}

export default function NewCustomerPage({ loaderData }: Route.ComponentProps) {
  const { casts, customers, initialName, initialFirstVisitDate } = loaderData

  return (
    <div className="min-h-screen pb-10">
      {/* Header */}
      <div className="sticky top-14 z-20 bg-white/95 backdrop-blur border-b border-stone-200 px-4 py-3 flex items-center gap-3">
        <Link to="/">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-brand-plum/60">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="font-bold text-gray-900">新規顧客登録</h1>
      </div>

      <div className="px-4 py-5">
        <NewCustomerForm
          casts={casts}
          customers={customers}
          initialName={initialName}
          initialFirstVisitDate={initialFirstVisitDate}
        />
      </div>
    </div>
  )
}
