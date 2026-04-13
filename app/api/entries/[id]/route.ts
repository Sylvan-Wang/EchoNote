import { NextRequest, NextResponse } from 'next/server'
import { getEntry } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const entryId = parseInt(id, 10)

    if (isNaN(entryId)) {
      return NextResponse.json({ success: false, error: '无效的 ID' }, { status: 400 })
    }

    const entry = getEntry(entryId)

    if (!entry) {
      return NextResponse.json({ success: false, error: '日记不存在' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: entry })
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取日记失败'
    console.error('[entry detail] error:', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
