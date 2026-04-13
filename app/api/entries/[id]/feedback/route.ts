import { NextRequest, NextResponse } from 'next/server'
import { updateFeedback, logEvent } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const entryId = parseInt(id, 10)

    if (isNaN(entryId)) {
      return NextResponse.json({ success: false, error: '无效的 ID' }, { status: 400 })
    }

    const body = await request.json() as { helpful?: string; adopted?: string }
    const { helpful = 'unknown', adopted = 'unknown' } = body

    await updateFeedback(entryId, helpful, adopted)
    await logEvent('feedback_update', entryId, { helpful, adopted })

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : '更新反馈失败'
    console.error('[feedback] error:', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
