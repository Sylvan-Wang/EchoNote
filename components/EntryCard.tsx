'use client'

import { useRouter } from 'next/navigation'
import EmotionBadge from './EmotionBadge'

interface EntryCardProps {
  entry: {
    id: number
    created_at: string
    primary_emotion: string | null
    secondary_emotion: string | null
    cleaned_text: string | null
    keywords_json: string | null
    feedback_helpful: string
  }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const month = d.getMonth() + 1
  const day = d.getDate()
  const hours = d.getHours().toString().padStart(2, '0')
  const minutes = d.getMinutes().toString().padStart(2, '0')
  return `${month}月${day}日 ${hours}:${minutes}`
}

export default function EntryCard({ entry }: EntryCardProps) {
  const router = useRouter()

  let keywords: string[] = []
  try {
    if (entry.keywords_json) {
      keywords = JSON.parse(entry.keywords_json) as string[]
    }
  } catch {
    keywords = []
  }

  return (
    <button
      onClick={() => router.push(`/history/${entry.id}`)}
      className="w-full text-left bg-stone-800 rounded-2xl p-4 mb-3 active:scale-98 transition-transform hover:bg-stone-750 border border-stone-700"
    >
      {/* Header: date + emotion */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-stone-400 text-sm">{formatDate(entry.created_at)}</span>
        {entry.primary_emotion && (
          <EmotionBadge emotion={entry.primary_emotion} size="sm" />
        )}
      </div>

      {/* Cleaned text preview */}
      {entry.cleaned_text && (
        <p className="text-stone-200 text-sm leading-relaxed line-clamp-2 mb-3">
          {entry.cleaned_text}
        </p>
      )}

      {/* Keywords */}
      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {keywords.map((kw, i) => (
            <span
              key={i}
              className="text-xs bg-stone-700 text-stone-300 px-2 py-0.5 rounded-full"
            >
              {kw}
            </span>
          ))}
        </div>
      )}
    </button>
  )
}
