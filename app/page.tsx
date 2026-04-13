'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

function getTodayPrompt(): string {
  const hour = new Date().getHours()
  if (hour < 6) return '深夜了，还有什么放不下的？'
  if (hour < 10) return '早上好，今天想从哪里开始？'
  if (hour < 14) return '午间，今天的状态怎么样？'
  if (hour < 18) return '下午好，今天怎么样？'
  if (hour < 22) return '晚上好，今天有什么想说的？'
  return '夜深了，今天过得如何？'
}

function formatToday(): string {
  const d = new Date()
  const month = d.getMonth() + 1
  const day = d.getDate()
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  const weekday = weekdays[d.getDay()]
  return `${month}月${day}日 · 周${weekday}`
}

export default function HomePage() {
  const [entryCount, setEntryCount] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/entries?limit=1&offset=0')
      .then((r) => r.json())
      .then((j: { success: boolean; data: unknown[] }) => {
        if (j.success) {
          // Just check if there are entries at all; fetch total separately
          fetch('/api/entries?limit=200&offset=0')
            .then((r2) => r2.json())
            .then((j2: { success: boolean; data: unknown[] }) => {
              if (j2.success) setEntryCount(j2.data.length)
            })
            .catch(() => {})
        }
      })
      .catch(() => {})
  }, [])

  return (
    <main className="min-h-screen flex flex-col items-center justify-between px-5 py-12 max-w-md mx-auto w-full">
      {/* Top section */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 w-full">
        {/* Logo / Title */}
        <div className="text-center">
          <h1 className="text-6xl font-bold text-amber-400 tracking-tight mb-1">一刻</h1>
          <p className="text-stone-500 text-sm tracking-widest uppercase">EchoNote</p>
        </div>

        {/* Tagline */}
        <p className="text-stone-300 text-lg text-center leading-relaxed">
          说出来，帮你理清一点。
        </p>

        {/* Main CTA */}
        <Link
          href="/record"
          className="w-full bg-amber-500 text-stone-900 font-semibold text-lg rounded-2xl py-4 text-center
            active:scale-98 transition-transform hover:bg-amber-400 min-h-[56px] flex items-center justify-center"
        >
          开始记录
        </Link>

        {/* History button */}
        <Link
          href="/history"
          className="w-full border border-stone-700 text-stone-300 rounded-2xl py-4 text-center text-base
            hover:border-stone-500 hover:text-stone-100 transition-colors min-h-[56px] flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
          我的日记
          {entryCount !== null && entryCount > 0 && (
            <span className="bg-stone-700 text-stone-300 text-xs px-2 py-0.5 rounded-full">
              {entryCount}
            </span>
          )}
        </Link>
      </div>

      {/* Bottom tip */}
      <div className="text-center pb-4">
        <p className="text-stone-600 text-xs">{formatToday()}</p>
        <p className="text-stone-500 text-sm mt-1">{getTodayPrompt()}</p>
      </div>
    </main>
  )
}
