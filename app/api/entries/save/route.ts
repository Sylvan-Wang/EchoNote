import { NextRequest, NextResponse } from 'next/server'
import { saveEntry, getUser, updateMemory as dbUpdateMemory, logEvent } from '@/lib/db'
import { updateMemory } from '@/lib/claude'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      analysis_result: {
        audio_url?: string
        raw_transcript?: string
        cleaned_text?: string
        primary_emotion?: string
        secondary_emotion?: string
        emotion_confidence?: number
        keywords_json?: string
        keywords?: string[]
        ai_understanding?: string
        ai_evidence?: string
        ai_suggestion?: string
        suggestion_type?: string
        mode_used?: string
        risk_level?: string
      }
      feedback_helpful?: string
      suggestion_adopted?: string
    }

    const { analysis_result, feedback_helpful = 'unknown', suggestion_adopted = 'unknown' } = body

    if (!analysis_result) {
      return NextResponse.json({ success: false, error: '缺少分析结果' }, { status: 400 })
    }

    // Save entry to DB
    const entryId = saveEntry({
      audio_url: analysis_result.audio_url,
      raw_transcript: analysis_result.raw_transcript,
      cleaned_text: analysis_result.cleaned_text,
      primary_emotion: analysis_result.primary_emotion,
      secondary_emotion: analysis_result.secondary_emotion,
      emotion_confidence: analysis_result.emotion_confidence,
      keywords_json: analysis_result.keywords_json,
      ai_understanding: analysis_result.ai_understanding,
      ai_evidence: analysis_result.ai_evidence,
      ai_suggestion: analysis_result.ai_suggestion,
      suggestion_type: analysis_result.suggestion_type,
      mode_used: analysis_result.mode_used,
      risk_level: analysis_result.risk_level ?? 'L1',
      feedback_helpful,
      suggestion_adopted,
      saved: 1,
    })

    // Update memory
    const user = getUser()
    const keywords = analysis_result.keywords_json
      ? (JSON.parse(analysis_result.keywords_json) as string[])
      : (analysis_result.keywords ?? [])

    const newSummary = await updateMemory({
      old_summary: user.memory_summary,
      primary_emotion: analysis_result.primary_emotion ?? '混乱',
      keywords,
      cleaned_text: analysis_result.cleaned_text ?? '',
      feedback: feedback_helpful,
      mode: analysis_result.mode_used ?? 'accept',
    })

    dbUpdateMemory(newSummary)

    logEvent('save_entry_success', entryId, { feedback_helpful, suggestion_adopted })

    return NextResponse.json({ success: true, data: { id: entryId } })
  } catch (err) {
    const message = err instanceof Error ? err.message : '保存失败，请重试'
    console.error('[save] error:', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
