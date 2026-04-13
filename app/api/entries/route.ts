import { NextRequest, NextResponse } from 'next/server'
import { listEntries } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') ?? '20', 10)
    const offset = parseInt(searchParams.get('offset') ?? '0', 10)

    const entries = await listEntries(limit, offset)

    const data = entries.map((e) => ({
      id: e.id,
      created_at: e.created_at,
      primary_emotion: e.primary_emotion,
      secondary_emotion: e.secondary_emotion,
      cleaned_text: e.cleaned_text ? e.cleaned_text.slice(0, 100) : null,
      keywords_json: e.keywords_json,
      feedback_helpful: e.feedback_helpful,
    }))

    return NextResponse.json({ success: true, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取列表失败'
    console.error('[entries] error:', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
