'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

export interface AnalysisResult {
  audio_url: string
  raw_transcript: string
  cleaned_text: string
  primary_emotion: string
  secondary_emotion: string | null
  emotion_confidence: number
  keywords: string[]
  keywords_json: string
  ai_understanding: string
  ai_evidence: string
  ai_suggestion: string
  suggestion_type: string
  mode_used: string
  risk_level: string
}

type RecordingState =
  | 'idle'
  | 'recording'
  | 'uploading'
  | 'transcribing'
  | 'analyzing'
  | 'success'
  | 'error'

const LOADING_MESSAGES = [
  '正在上传...',
  '正在转写你的语音...',
  '正在整理你刚刚说的话...',
  '快好了，稍等一下...',
]

const STATE_TEXT: Record<RecordingState, string> = {
  idle: '点击开始录音',
  recording: '正在录音...',
  uploading: '正在上传...',
  transcribing: '正在转写你的语音...',
  analyzing: '正在整理你刚刚说的话...',
  success: '分析完成',
  error: '',
}

const MAX_DURATION = 300 // 5 minutes in seconds

interface AudioRecorderProps {
  onResult: (data: AnalysisResult) => void
  onError: (msg: string) => void
}

export default function AudioRecorder({ onResult, onError }: AudioRecorderProps) {
  const [state, setState] = useState<RecordingState>('idle')
  const [mode, setMode] = useState<'accept' | 'analyze'>('accept')
  const [elapsed, setElapsed] = useState(0)
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0])
  const [errorMsg, setErrorMsg] = useState('')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const loadingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (loadingTimerRef.current) {
      clearInterval(loadingTimerRef.current)
      loadingTimerRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      clearTimers()
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }
    }
  }, [clearTimers])

  function formatTime(secs: number): string {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : ''

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        handleRecordingStopped()
      }

      recorder.start(250)
      setState('recording')
      setElapsed(0)

      // Start timer
      timerRef.current = setInterval(() => {
        setElapsed((prev) => {
          const next = prev + 1
          if (next >= MAX_DURATION) {
            stopRecording()
            alert('已达到最长录音时间（5分钟），已自动停止。')
          }
          return next
        })
      }, 1000)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '无法访问麦克风，请检查权限设置'
      setErrorMsg(msg)
      setState('error')
      onError(msg)
    }
  }

  function stopRecording() {
    clearTimers()
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }

  async function handleRecordingStopped() {
    const duration = elapsed

    if (duration < 5) {
      // Show warning but proceed
      console.warn('内容太短，可能无法准确理解')
    }

    const blob = new Blob(chunksRef.current, {
      type: mediaRecorderRef.current?.mimeType || 'audio/webm',
    })

    // Start loading message cycling
    let msgIdx = 0
    setState('uploading')
    loadingTimerRef.current = setInterval(() => {
      msgIdx = (msgIdx + 1) % LOADING_MESSAGES.length
      setLoadingMsg(LOADING_MESSAGES[msgIdx])
      // Update state based on message index
      if (msgIdx === 0) setState('uploading')
      else if (msgIdx === 1) setState('transcribing')
      else setState('analyzing')
    }, 3000)

    try {
      const formData = new FormData()
      formData.append('audio', blob, 'recording.webm')
      formData.append('mode', mode)

      const res = await fetch('/api/entries/analyze', {
        method: 'POST',
        body: formData,
      })

      clearTimers()

      const json = await res.json() as { success: boolean; data?: AnalysisResult; error?: string }

      if (!json.success || !json.data) {
        throw new Error(json.error ?? '分析失败，请重试')
      }

      setState('success')
      onResult(json.data)
    } catch (err) {
      clearTimers()
      const msg = err instanceof Error ? err.message : '上传或分析失败，请重试'
      setErrorMsg(msg)
      setState('error')
      onError(msg)
    }
  }

  function handleMicPress() {
    if (state === 'idle' || state === 'error') {
      startRecording()
    } else if (state === 'recording') {
      stopRecording()
    }
  }

  function handleRetry() {
    setState('idle')
    setElapsed(0)
    setErrorMsg('')
  }

  const isProcessing = ['uploading', 'transcribing', 'analyzing'].includes(state)
  const statusText = state === 'error' ? errorMsg : (state === 'analyzing' || state === 'transcribing' || state === 'uploading') ? loadingMsg : STATE_TEXT[state]

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* Mode toggle */}
      <div className="flex bg-stone-800 rounded-full p-1 gap-1">
        <button
          onClick={() => setMode('accept')}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
            mode === 'accept'
              ? 'bg-amber-500 text-stone-900'
              : 'text-stone-400 hover:text-stone-200'
          }`}
          disabled={state === 'recording' || isProcessing}
        >
          接纳型
        </button>
        <button
          onClick={() => setMode('analyze')}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
            mode === 'analyze'
              ? 'bg-amber-500 text-stone-900'
              : 'text-stone-400 hover:text-stone-200'
          }`}
          disabled={state === 'recording' || isProcessing}
        >
          分析型
        </button>
      </div>

      {/* Mode hint */}
      <p className="text-stone-500 text-xs text-center px-4">
        {mode === 'accept' ? '温和陪伴，以接纳为主' : '温和分析，提供行动视角'}
      </p>

      {/* Recording timer */}
      {state === 'recording' && (
        <div className="text-2xl font-mono text-amber-400 tabular-nums">
          {formatTime(elapsed)}
        </div>
      )}

      {/* Short recording warning */}
      {state === 'recording' && elapsed > 0 && elapsed < 5 && (
        <p className="text-amber-500 text-xs text-center">内容太短，可能无法准确理解</p>
      )}

      {/* Big mic button */}
      <button
        onClick={handleMicPress}
        disabled={isProcessing || state === 'success'}
        className={`
          w-28 h-28 rounded-full flex items-center justify-center
          transition-all duration-200 active:scale-95
          min-h-[112px] min-w-[112px]
          ${state === 'recording'
            ? 'bg-red-500 shadow-[0_0_0_8px_rgba(239,68,68,0.2)] animate-pulse'
            : isProcessing || state === 'success'
            ? 'bg-stone-700 cursor-not-allowed'
            : state === 'error'
            ? 'bg-stone-700 hover:bg-stone-600'
            : 'bg-amber-500 hover:bg-amber-400 shadow-lg'
          }
        `}
        aria-label={state === 'recording' ? '停止录音' : '开始录音'}
      >
        {state === 'recording' ? (
          // Stop icon
          <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        ) : isProcessing ? (
          // Spinner
          <svg className="w-10 h-10 text-stone-400 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        ) : (
          // Mic icon
          <svg className="w-10 h-10 text-stone-900" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 1a4 4 0 014 4v6a4 4 0 01-8 0V5a4 4 0 014-4zm0 2a2 2 0 00-2 2v6a2 2 0 004 0V5a2 2 0 00-2-2zm-7 9a7 7 0 0014 0h2a9 9 0 01-8 8.94V23h-2v-2.06A9 9 0 013 12H5z" />
          </svg>
        )}
      </button>

      {/* Status text */}
      <p className={`text-sm text-center px-4 min-h-[20px] ${state === 'error' ? 'text-red-400' : 'text-stone-400'}`}>
        {statusText}
      </p>

      {/* Retry button */}
      {(state === 'error') && (
        <button
          onClick={handleRetry}
          className="text-amber-400 text-sm underline underline-offset-2"
        >
          重新录制
        </button>
      )}
    </div>
  )
}
