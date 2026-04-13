'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import EmotionBadge from '@/components/EmotionBadge'
import type { AnalysisResult } from '@/components/AudioRecorder'

type FeedbackValue = 'helpful' | 'neutral' | 'unhelpful' | null

export default function ResultPage() {
  const router = useRouter()
  const [data, setData] = useState<AnalysisResult | null>(null)
  const [feedback, setFeedback] = useState<FeedbackValue>(null)
  const [adopted, setAdopted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savedId, setSavedId] = useState<number | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('echonote_result')
      if (!raw) {
        router.replace('/')
        return
      }
      setData(JSON.parse(raw) as AnalysisResult)
    } catch {
      router.replace('/')
    }
  }, [router])

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-stone-500">加载中...</p>
      </div>
    )
  }

  let keywords: string[] = []
  try {
    keywords = data.keywords_json ? (JSON.parse(data.keywords_json) as string[]) : data.keywords
  } catch {
    keywords = data.keywords
  }

  const confidencePct = Math.round((data.emotion_confidence ?? 0.5) * 100)

  async function handleSave() {
    if (!data || saving || saved) return
    setSaving(true)
    setSaveError(null)

    try {
      const feedbackMap: Record<string, string> = {
        helpful: 'yes',
        neutral: 'neutral',
        unhelpful: 'no',
      }

      const res = await fetch('/api/entries/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis_result: data,
          feedback_helpful: feedback ? feedbackMap[feedback] : 'unknown',
          suggestion_adopted: adopted ? 'yes' : 'unknown',
        }),
      })

      const json = await res.json() as { success: boolean; data?: { id: number }; error?: string }

      if (!json.success) throw new Error(json.error ?? '保存失败')

      setSaved(true)
      setSavedId(json.data?.id ?? null)
      sessionStorage.removeItem('echonote_result')
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : '保存失败，请重试')
    } finally {
      setSaving(false)
    }
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

  return (
    <main className="min-h-screen max-w-md mx-auto w-full flex flex-col">
      {/* Header */}
      <div className="flex items-center px-5 pt-14 pb-4 sticky top-0 bg-[#1a1612] z-10">
        <Link
          href="/record"
          className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-stone-800 -ml-2"
          aria-label="返回"
        >
          <svg className="w-6 h-6 text-stone-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-lg font-semibold text-stone-100 ml-2">分析结果</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-8 space-y-4">
        {/* Safety Banner (L3) */}
        {data.risk_level === 'L3' && (
          <div className="bg-red-950/60 border border-red-800 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">🆘</span>
              <div>
                <p className="text-red-300 font-semibold text-sm mb-1">我们注意到一些重要信号</p>
                <p className="text-red-400 text-sm leading-relaxed">
                  如果你现在感到很难熬，请考虑联系心理危机热线：
                  <strong className="text-red-300"> 北京 010-82951332 · 全国 400-161-9995</strong>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 整理后的日记 */}
        <section className="bg-stone-800/60 rounded-2xl p-5">
          <p className="text-xs text-stone-500 uppercase tracking-wider mb-3">整理后的日记</p>
          <p className="text-stone-200 text-base leading-relaxed">{data.cleaned_text}</p>
        </section>

        {/* 情绪 */}
        <section className="bg-stone-800/60 rounded-2xl p-5">
          <p className="text-xs text-stone-500 uppercase tracking-wider mb-3">情绪</p>
          <div className="flex items-center flex-wrap gap-2 mb-4">
            {data.primary_emotion && <EmotionBadge emotion={data.primary_emotion} />}
            {data.secondary_emotion && (
              <EmotionBadge emotion={data.secondary_emotion} size="sm" />
            )}
          </div>
          <div>
            <div className="flex justify-between text-xs text-stone-500 mb-1">
              <span>情绪置信度</span>
              <span>{confidencePct}%</span>
            </div>
            <div className="h-1.5 bg-stone-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all"
                style={{ width: `${confidencePct}%` }}
              />
            </div>
          </div>
        </section>

        {/* 关键词 */}
        {keywords.length > 0 && (
          <section className="bg-stone-800/60 rounded-2xl p-5">
            <p className="text-xs text-stone-500 uppercase tracking-wider mb-3">关键词</p>
            <div className="flex flex-wrap gap-2">
              {keywords.map((kw, i) => (
                <span
                  key={i}
                  className="bg-stone-700 text-stone-200 text-sm px-3 py-1 rounded-full"
                >
                  {kw}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* 一刻回复 */}
        <section className="bg-stone-800/60 rounded-2xl p-5 space-y-4">
          <p className="text-xs text-stone-500 uppercase tracking-wider">一刻回复</p>

          <div className="border-l-2 border-amber-500/60 pl-4">
            <p className="text-xs text-stone-500 mb-1">我听到了</p>
            <p className="text-stone-200 text-sm leading-relaxed">{data.ai_understanding}</p>
          </div>

          <div className="border-l-2 border-amber-500/40 pl-4">
            <p className="text-xs text-stone-500 mb-1">我感受到</p>
            <p className="text-stone-200 text-sm leading-relaxed">{data.ai_evidence}</p>
          </div>

          <div className="border-l-2 border-amber-500/20 pl-4">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs text-stone-500">建议</p>
              {data.suggestion_type && (
                <span className="text-xs bg-stone-700 text-stone-400 px-2 py-0.5 rounded-full">
                  {suggestionTypeLabel[data.suggestion_type] ?? data.suggestion_type}
                </span>
              )}
            </div>
            <p className="text-stone-200 text-sm leading-relaxed">{data.ai_suggestion}</p>
          </div>
        </section>

        {/* 反馈区 */}
        {!saved && (
          <section className="bg-stone-800/60 rounded-2xl p-5">
            <p className="text-xs text-stone-500 uppercase tracking-wider mb-3">这次回复对你有帮助吗？</p>

            <div className="flex gap-2 mb-4">
              {(
                [
                  { value: 'helpful' as FeedbackValue, label: '✓ 有帮助' },
                  { value: 'neutral' as FeedbackValue, label: '一般' },
                  { value: 'unhelpful' as FeedbackValue, label: '不喜欢' },
                ] as const
              ).map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setFeedback(value)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors min-h-[44px] ${
                    feedback === value
                      ? 'bg-amber-500 text-stone-900'
                      : 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setAdopted(!adopted)}
              className={`w-full py-2.5 rounded-xl text-sm font-medium mb-4 transition-colors min-h-[44px] ${
                adopted ? 'bg-stone-600 text-amber-400' : 'bg-stone-700 text-stone-400 hover:bg-stone-600'
              }`}
            >
              {adopted ? '✓ 我会试试看' : '我试试看'}
            </button>

            {saveError && (
              <p className="text-red-400 text-sm text-center mb-3">{saveError}</p>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-amber-500 text-stone-900 font-semibold py-4 rounded-2xl text-base
                active:scale-98 transition-transform hover:bg-amber-400 disabled:opacity-60 min-h-[56px]"
            >
              {saving ? '保存中...' : '保存日记'}
            </button>
          </section>
        )}

        {/* Saved state */}
        {saved && (
          <section className="bg-stone-800/60 rounded-2xl p-5 text-center">
            <p className="text-amber-400 font-semibold text-base mb-1">✓ 已保存</p>
            <p className="text-stone-400 text-sm mb-4">这一刻已经记录下来了。</p>
            <div className="flex gap-3">
              <Link
                href="/history"
                className="flex-1 border border-stone-600 text-stone-300 py-3 rounded-xl text-sm text-center hover:border-stone-400"
              >
                查看日记
              </Link>
              <Link
                href="/"
                className="flex-1 bg-amber-500 text-stone-900 font-medium py-3 rounded-xl text-sm text-center hover:bg-amber-400"
              >
                回到首页
              </Link>
            </div>
            {savedId && (
              <Link
                href={`/history/${savedId}`}
                className="block mt-3 text-stone-500 text-xs underline underline-offset-2"
              >
                查看完整记录
              </Link>
            )}
          </section>
        )}
      </div>
    </main>
  )
}
