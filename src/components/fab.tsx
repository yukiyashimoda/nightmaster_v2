import { Link } from 'react-router'
import { Plus } from 'lucide-react'

interface FabProps {
  href: string
  label?: string
}

export function Fab({ href, label }: FabProps) {
  return (
    <Link
      to={href}
      className="fixed bottom-20 sm:bottom-6 right-6 z-50 flex items-center gap-2 bg-brand-plum hover:bg-brand-plum/90 text-white font-semibold px-4 py-3 rounded-full shadow-lg shadow-brand-plum/20 transition-all hover:scale-105 active:scale-95"
    >
      <Plus className="h-5 w-5" />
      {label && <span className="text-sm">{label}</span>}
    </Link>
  )
}
