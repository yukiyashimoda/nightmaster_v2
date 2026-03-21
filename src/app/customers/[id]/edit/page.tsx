import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getCustomer, getCasts, getCustomers, getBottlesByCustomer } from '@/lib/kv'
import { EditCustomerForm } from './edit-customer-form'

export const dynamic = 'force-dynamic'

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [customer, casts, allCustomers, bottles] = await Promise.all([
    getCustomer(id),
    getCasts(),
    getCustomers(),
    getBottlesByCustomer(id),
  ])

  if (!customer) notFound()

  const otherCustomers = allCustomers.filter((c) => c.id !== id)

  return (
    <div className="min-h-screen pb-10">
      <div className="sticky top-14 z-20 bg-white/95 backdrop-blur border-b border-stone-200 px-4 py-3 flex items-center gap-3">
        <Link href={`/customers/${id}`}>
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
