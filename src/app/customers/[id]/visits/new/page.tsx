import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getCustomer, getCasts, getBottlesByCustomer, getCustomers } from '@/lib/kv'
import { NewVisitForm } from './new-visit-form'

export const dynamic = 'force-dynamic'

export default async function NewVisitPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [customer, casts, bottles, allCustomers] = await Promise.all([
    getCustomer(id),
    getCasts(),
    getBottlesByCustomer(id),
    getCustomers(),
  ])

  if (!customer) notFound()

  return (
    <div className="min-h-screen pb-10">
      <div className="sticky top-14 z-20 bg-white/95 backdrop-blur border-b border-stone-200 px-4 py-3 flex items-center gap-3">
        <Link href={`/customers/${id}`}>
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
          allCustomers={allCustomers.filter((c) => c.id !== id)}
          defaultLinkedCustomerIds={customer.linkedCustomerIds}
        />
      </div>
    </div>
  )
}
