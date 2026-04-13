'use client'

interface EmotionBadgeProps {
  emotion: string
  size?: 'sm' | 'md'
}

const emotionColorMap: Record<string, string> = {
  平静: 'bg-blue-100 text-blue-700',
  开心: 'bg-yellow-100 text-yellow-700',
  焦虑: 'bg-orange-100 text-orange-700',
  难过: 'bg-purple-100 text-purple-700',
  委屈: 'bg-pink-100 text-pink-700',
  愤怒: 'bg-red-100 text-red-700',
  疲惫: 'bg-gray-100 text-gray-700',
  混乱: 'bg-indigo-100 text-indigo-700',
}

export default function EmotionBadge({ emotion, size = 'md' }: EmotionBadgeProps) {
  const colorClass = emotionColorMap[emotion] ?? 'bg-gray-100 text-gray-600'
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${colorClass} ${sizeClass}`}>
      {emotion}
    </span>
  )
}
