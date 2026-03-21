import { useState } from 'react'
import { FaStar, FaRegStar } from 'react-icons/fa'
import { useFetcher } from 'react-router'

interface FavoriteButtonProps {
  customerId: string
  isFavorite: boolean
}

export function FavoriteButton({ customerId, isFavorite }: FavoriteButtonProps) {
  const [fav, setFav] = useState(isFavorite)
  const [loading, setLoading] = useState(false)

  const fetcher = useFetcher()
  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (loading) return
    const next = !fav
    setFav(next)
    setLoading(true)
    fetcher.submit(
      { customerId, isFavorite: next },
      { method: 'post', action: '/api/favorite', encType: 'application/json' }
    )
    setLoading(false)
  }

  return (
    <button
      onClick={handleClick}
      className="p-1.5 transition-transform hover:scale-110 shrink-0"
      aria-label={fav ? 'お気に入り解除' : 'お気に入り登録'}
    >
      {fav
        ? <FaStar size={16} className="text-brand-gold" />
        : <FaRegStar size={16} className="text-brand-plum/30" />
      }
    </button>
  )
}
