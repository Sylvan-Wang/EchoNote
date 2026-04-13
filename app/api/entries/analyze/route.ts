import { NextRequest, NextResponse } from 'next/server'
import { transcribeAudio } from '@/lib/whisper'
import { cleanText, analyzeEmotion, generateResponse } from '@/lib/claude'
import { checkRiskLevel, SAFE_RESPONSE } from '@/lib/safety'
import { getUser, logEvent, uploadAudio } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File | null
    const mode = (formData.get('mode') as string) || 'accept'

    if (!audioFile) {
      return NextResponse.json({ success: false, error: '没有找到音频文件' }, { status: 400 })
    }

    const bytes = await audioFile.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload audio to Supabase Storage
    const filename = `${Date.now()}.webm`
    const audioUrl = await uploadAudio(buffer, filename)

    // Transcribe
    const raw_transcript = await transcribeAudio(buffer, filename)

    // Clean text
    const cleaned_text = await cleanText(raw_transcript)

    // Analyze emotion + keywords
    const { primary_emotion, secondary_emotion, emotion_confidence, keywords } =
      await analyzeEmotion(cleaned_text)

    // Risk check
    const risk_level = checkRiskLevel(cleaned_text)

    let ai_understanding: string
    let ai_evidence: string
    let ai_suggestion: string
    let suggestion_type: string

    if (risk_level === 'L3') {
      ai_understanding = SAFE_RESPONSE.understanding
      ai_evidence = SAFE_RESPONSE.evidence
      ai_suggestion = SAFE_RESPONSE.suggestion
      suggestion_type = SAFE_RESPONSE.suggestion_type
    } else {
      const user = await getUser()
      const response = await generateResponse({
        cleaned_text,
        primary_emotion,
        secondary_emotion,
        keywords,
        mode,
        memory_summary: user.memory_summary,
      })
      ai_understanding = response.understanding
      ai_evidence = response.evidence
      ai_suggestion = response.suggestion
      suggestion_type = response.suggestion_type
    }

    await logEvent('analyze_success', undefined, { mode, primary_emotion, risk_level })

    return NextResponse.json({
      success: true,
      data: {
        audio_url: audioUrl,
        raw_transcript,
        cleaned_text,
        primary_emotion,
        secondary_emotion,
        emotion_confidence,
        keywords,
        keywords_json: JSON.stringify(keywords),
        ai_understanding,
        ai_evidence,
        ai_suggestion,
        suggestion_type,
        mode_used: mode,
        risk_level,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : '分析失败，请重试'
    console.error('[analyze] error:', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
