import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string | null): string {
  if (!dateString) return '未来店'
  const date = new Date(dateString)
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export function formatCurrency(amount: number): string {
  return amount.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' })
}

export function formatEditedBy(updatedBy: string, updatedAt: string): string {
  const d = new Date(updatedAt)
  const month = d.getMonth() + 1
  const day = d.getDate()
  return `${updatedBy}さんが${month}月${day}日に編集`
}

export function isOldVisit(lastVisitDate: string | null): boolean {
  if (!lastVisitDate) return true
  const date = new Date(lastVisitDate)
  const now = new Date()
  const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays >= 365
}

export function getHiraganaGroup(ruby: string): string {
  if (!ruby) return 'その他'
  const first = ruby.charAt(0)

  const groups: Record<string, string[]> = {
    'あ行': ['あ', 'い', 'う', 'え', 'お'],
    'か行': ['か', 'き', 'く', 'け', 'こ', 'が', 'ぎ', 'ぐ', 'げ', 'ご'],
    'さ行': ['さ', 'し', 'す', 'せ', 'そ', 'ざ', 'じ', 'ず', 'ぜ', 'ぞ'],
    'た行': ['た', 'ち', 'つ', 'て', 'と', 'だ', 'ぢ', 'づ', 'で', 'ど'],
    'な行': ['な', 'に', 'ぬ', 'ね', 'の'],
    'は行': ['は', 'ひ', 'ふ', 'へ', 'ほ', 'ば', 'び', 'ぶ', 'べ', 'ぼ', 'ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ'],
    'ま行': ['ま', 'み', 'む', 'め', 'も'],
    'や行': ['や', 'ゆ', 'よ'],
    'ら行': ['ら', 'り', 'る', 'れ', 'ろ'],
    'わ行': ['わ', 'ゐ', 'ゑ', 'を', 'ん'],
  }

  for (const [group, chars] of Object.entries(groups)) {
    if (chars.includes(first)) return group
  }
  return 'その他'
}

export const hiraganaGroups = [
  'あ行',
  'か行',
  'さ行',
  'た行',
  'な行',
  'は行',
  'ま行',
  'や行',
  'ら行',
  'わ行',
  'その他',
]

export const groupLabels: Record<string, string> = {
  'あ行': 'あ',
  'か行': 'か',
  'さ行': 'さ',
  'た行': 'た',
  'な行': 'な',
  'は行': 'は',
  'ま行': 'ま',
  'や行': 'や',
  'ら行': 'ら',
  'わ行': 'わ',
  'その他': '他',
}
