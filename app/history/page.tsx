'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import EntryCard from '@/components/EntryCard'

interface EntryListItem {
  id: number
  created_at: string
  primary_emotion: string | null
  secondary_emotion: string | null
  cleaned_text: string | null
  keywords_json: string | null
  feedback_helpful: string
}

const PAGE_SIZE = 20

export default function HistoryPage() {
  const [entries, setEntries] = useState<EntryListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const fetchEntries = useCallback(async (currentOffset: number, append: boolean) => {
    try {
      if (append) setLoadingMore(true)
      else setLoading(true)

      const res = await fetch(`/api/entries?limit=${PAGE_SIZE}&offset=${currentOffset}`)
      const json = await res.json() as { success: boolean; data?: EntryListItem[]; error?: string }

      if (!json.success) throw new Error(json.error ?? '加载失败')

      const newEntries = json.data ?? []
      if (append) {
        setEntries((prev) => [...prev, ...newEntries])
      } else {
        setEntries(newEntries)
      }
      setHasMore(newEntries.length === PAGE_SIZE)
      setOffset(currentOffset + newEntries.length)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    fetchEntries(0, false)
  }, [fetchEntries])

  function loadMore() {
    fetchEntries(offset, true)
  }

  return (
    <main className="min-h-screen max-w-md mx-auto w-full flex flex-col">
      {/* Header */}
      <div className="flex items-center px-5 pt-14 pb-4 sticky top-0 bg-[#1a1612] z-10 border-b border-stone-800">
        <Link
          href="/"
          className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-stone-800 -ml-2"
          aria-label="返回"
        >
          <svg className="w-6 h-6 text-stone-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-lg font-semibold text-stone-100 ml-2">我的日记</h1>
        {entries.length > 0 && (
          <span className="ml-auto text-stone-500 text-sm">{entries.length} 条</span>
        )}
      </div>

      <div className="flex-1 px-5 pt-4 pb-8">
        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="text-center py-16">
            <p className="text-stone-500 text-sm mb-4">{error}</p>
            <button
              onClick={() => fetchEntries(0, false)}
              className="text-amber-400 text-sm underline"
            >
              重试
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && entries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-stone-800 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-stone-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <p className="text-stone-400 text-base mb-2">还没有记录</p>
            <p className="text-stone-600 text-sm mb-6">去说说今天的心情？</p>
            <Link
              href="/record"
              className="bg-amber-500 text-stone-900 font-medium px-6 py-3 rounded-xl text-sm hover:bg-amber-400"
            >
              开始记录
            </Link>
          </div>
        )}

        {/* Entry list */}
        {!loading && entries.length > 0 && (
          <>
            {entries.map((entry) => (
              <EntryCard key={entry.id} entry={entry} />
            ))}

            {hasMore && (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="w-full py-3 text-stone-400 text-sm hover:text-stone-200 disabled:opacity-50"
              >
                {loadingMore ? '加载中...' : '加载更多'}
              </button>
            )}

            {!hasMore && entries.length >= PAGE_SIZE && (
              <p className="text-center text-stone-600 text-xs py-4">已显示全部记录</p>
            )}
          </>
        )}
      </div>
    </main>
  )
}
