import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getCasts, getCustomers } from '@/lib/kv'
import { NewCustomerForm } from './new-customer-form'

export const dynamic = 'force-dynamic'

export default async function NewCustomerPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string; date?: string }>
}) {
  const [casts, customers, params] = await Promise.all([getCasts(), getCustomers(), searchParams])

  return (
    <div className="min-h-screen pb-10">
      {/* Header */}
      <div className="sticky top-14 z-20 bg-white/95 backdrop-blur border-b border-stone-200 px-4 py-3 flex items-center gap-3">
        <Link href="/">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="font-bold text-gray-900">新規顧客登録</h1>
      </div>

      <div className="px-4 py-5">
        <NewCustomerForm
          casts={casts}
          customers={customers}
          initialName={params.name ?? ''}
          initialFirstVisitDate={params.date ?? ''}
        />
      </div>
    </div>
  )
}
