'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import EmotionBadge from '@/components/EmotionBadge'

interface Entry {
  id: number
  user_id: number
  created_at: string
  updated_at: string
  audio_url: string | null
  raw_transcript: string | null
  cleaned_text: string | null
  primary_emotion: string | null
  secondary_emotion: string | null
  emotion_confidence: number | null
  keywords_json: string | null
  ai_understanding: string | null
  ai_evidence: string | null
  ai_suggestion: string | null
  suggestion_type: string | null
  mode_used: string | null
  risk_level: string
  feedback_helpful: string
  suggestion_adopted: string
  saved: number
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const year = d.getFullYear()
  const month = d.getMonth() + 1
  const day = d.getDate()
  const hours = d.getHours().toString().padStart(2, '0')
  const minutes = d.getMinutes().toString().padStart(2, '0')
  return `${year}年${month}月${day}日 ${hours}:${minutes}`
}

const feedbackLabels: Record<string, string> = {
  yes: '✓ 有帮助',
  neutral: '一般',
  no: '没帮助',
  unknown: '未评价',
}

const suggestionTypeLabel: Record<string, string> = {
  rest: '休息',
  express: '表达',
  reframe: '换个角度',
  connect: '连接',
  action: '行动',
  reflect: '思考',
  safety: '安全提示',
}

export default function EntryDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [entry, setEntry] = useState<Entry | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showRaw, setShowRaw] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/entries/${id}`)
      .then((r) => r.json())
      .then((j: { success: boolean; data?: Entry; error?: string }) => {
        if (!j.success) throw new Error(j.error ?? '加载失败')
        setEntry(j.data ?? null)
      })
      .catch((err) => setError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !entry) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-stone-400">{error ?? '日记不存在'}</p>
        <Link href="/history" className="text-amber-400 underline text-sm">返回列表</Link>
      </div>
    )
  }

  let keywords: string[] = []
  try {
    if (entry.keywords_json) keywords = JSON.parse(entry.keywords_json) as string[]
  } catch { keywords = [] }

  const confidencePct = Math.round((entry.emotion_confidence ?? 0.5) * 100)

  return (
    <main className="min-h-screen max-w-md mx-auto w-full flex flex-col">
      {/* Header */}
      <div className="flex items-center px-5 pt-14 pb-4 sticky top-0 bg-[#1a1612] z-10 border-b border-stone-800">
        <Link
          href="/history"
          className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-stone-800 -ml-2"
        >
          <svg className="w-6 h-6 text-stone-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="ml-2">
          <h1 className="text-base font-semibold text-stone-100 leading-tight">日记详情</h1>
          <p className="text-xs text-stone-500">{formatDate(entry.created_at)}</p>
        </div>
      </div>

      <div className="flex-1 px-5 pt-4 pb-10 space-y-4 overflow-y-auto">
        {/* Safety banner */}
        {entry.risk_level === 'L3' && (
          <div className="bg-red-950/60 border border-red-800 rounded-2xl p-4">
            <p className="text-red-300 font-semibold text-sm mb-1">危机支持提示</p>
            <p className="text-red-400 text-sm">全国危机热线：400-161-9995</p>
          </div>
        )}

        {/* Emotion */}
        <section className="bg-stone-800/60 rounded-2xl p-5">
          <p className="text-xs text-stone-500 mb-3">情绪</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {entry.primary_emotion && <EmotionBadge emotion={entry.primary_emotion} />}
            {entry.secondary_emotion && <EmotionBadge emotion={entry.secondary_emotion} size="sm" />}
          </div>
          <div className="h-1.5 bg-stone-700 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${confidencePct}%` }} />
          </div>
          <p className="text-xs text-stone-600 mt-1 text-right">{confidencePct}% 置信度</p>
        </section>

        {/* 整理后日记 */}
        {entry.cleaned_text && (
          <section className="bg-stone-800/60 rounded-2xl p-5">
            <p className="text-xs text-stone-500 mb-3">整理后的日记</p>
            <p className="text-stone-200 text-sm leading-relaxed">{entry.cleaned_text}</p>
          </section>
        )}

        {/* Keywords */}
        {keywords.length > 0 && (
          <section className="bg-stone-800/60 rounded-2xl p-5">
            <p className="text-xs text-stone-500 mb-3">关键词</p>
            <div className="flex flex-wrap gap-2">
              {keywords.map((kw, i) => (
                <span key={i} className="bg-stone-700 text-stone-200 text-sm px-3 py-1 rounded-full">
                  {kw}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* 原始转写 (collapsible) */}
        {entry.raw_transcript && (
          <section className="bg-stone-800/60 rounded-2xl p-5">
            <button
              onClick={() => setShowRaw(!showRaw)}
              className="w-full flex items-center justify-between text-xs text-stone-500"
            >
              <span>原始转写</span>
              <svg
                className={`w-4 h-4 transition-transform ${showRaw ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showRaw && (
              <p className="text-stone-400 text-sm leading-relaxed mt-3">{entry.raw_transcript}</p>
            )}
          </section>
        )}

        {/* AI 回复 */}
        {(entry.ai_understanding || entry.ai_evidence || entry.ai_suggestion) && (
          <section className="bg-stone-800/60 rounded-2xl p-5 space-y-4">
            <p className="text-xs text-stone-500">一刻回复</p>

            {entry.ai_understanding && (
              <div className="border-l-2 border-amber-500/60 pl-4">
                <p className="text-xs text-stone-500 mb-1">我听到了</p>
                <p className="text-stone-200 text-sm leading-relaxed">{entry.ai_understanding}</p>
              </div>
            )}

            {entry.ai_evidence && (
              <div className="border-l-2 border-amber-500/40 pl-4">
                <p className="text-xs text-stone-500 mb-1">我感受到</p>
                <p className="text-stone-200 text-sm leading-relaxed">{entry.ai_evidence}</p>
              </div>
            )}

            {entry.ai_suggestion && (
              <div className="border-l-2 border-amber-500/20 pl-4">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs text-stone-500">建议</p>
                  {entry.suggestion_type && (
                    <span className="text-xs bg-stone-700 text-stone-400 px-2 py-0.5 rounded-full">
                      {suggestionTypeLabel[entry.suggestion_type] ?? entry.suggestion_type}
                    </span>
                  )}
                </div>
                <p className="text-stone-200 text-sm leading-relaxed">{entry.ai_suggestion}</p>
              </div>
            )}
          </section>
        )}

        {/* 反馈状态 */}
        <section className="bg-stone-800/60 rounded-2xl p-5">
          <p className="text-xs text-stone-500 mb-3">反馈记录</p>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs text-stone-600 mb-1">是否有帮助</p>
              <span className="text-stone-300 text-sm">
                {feedbackLabels[entry.feedback_helpful] ?? entry.feedback_helpful}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-xs text-stone-600 mb-1">是否尝试建议</p>
              <span className="text-stone-300 text-sm">
                {entry.suggestion_adopted === 'yes' ? '✓ 试了' : entry.suggestion_adopted === 'unknown' ? '未记录' : '未尝试'}
              </span>
            </div>
          </div>
          {entry.mode_used && (
            <p className="text-xs text-stone-600 mt-3">
              使用模式：{entry.mode_used === 'analyze' ? '分析型' : '接纳型'}
            </p>
          )}
        </section>
      </div>
    </main>
  )
}
