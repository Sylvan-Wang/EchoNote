'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AudioRecorder, { type AnalysisResult } from '@/components/AudioRecorder'

export default function RecordPage() {
  const router = useRouter()
  const [toast, setToast] = useState<string | null>(null)

  function handleResult(data: AnalysisResult) {
    try {
      sessionStorage.setItem('echonote_result', JSON.stringify(data))
      router.push('/result')
    } catch {
      setToast('保存结果失败，请重试')
    }
  }

  function handleError(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }

  return (
    <main className="min-h-screen flex flex-col max-w-md mx-auto w-full">
      {/* Header */}
      <div className="flex items-center px-5 pt-14 pb-4">
        <Link
          href="/"
          className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-stone-800 transition-colors -ml-2"
          aria-label="返回"
        >
          <svg className="w-6 h-6 text-stone-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-lg font-semibold text-stone-100 ml-2">记录此刻</h1>
      </div>

      {/* Guidance text */}
      <div className="px-5 mb-6">
        <p className="text-stone-400 text-sm leading-relaxed">
          找一个安静的地方，说说你现在的感受、今天发生的事、或者任何想倾诉的内容。
        </p>
      </div>

      {/* Recorder */}
      <div className="flex-1 flex flex-col justify-center px-5">
        <AudioRecorder onResult={handleResult} onError={handleError} />
      </div>

      {/* Tips */}
      <div className="px-5 pb-12">
        <p className="text-stone-600 text-xs text-center">
          最长录音 5 分钟 · 内容仅保存在本设备
        </p>
      </div>

      {/* Error toast */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-red-900/90 text-red-200 text-sm px-4 py-3 rounded-xl shadow-lg max-w-xs text-center z-50">
          {toast}
        </div>
      )}
    </main>
  )
}
