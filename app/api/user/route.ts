import { NextRequest, NextResponse } from 'next/server'
import { getUser, db } from '@/lib/db'

export async function GET() {
  try {
    const user = getUser()
    return NextResponse.json({ success: true, data: user })
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取用户失败'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json() as { preferred_mode?: string; nickname?: string }
    const { preferred_mode, nickname } = body

    if (preferred_mode !== undefined) {
      db.prepare(`UPDATE users SET preferred_mode = ?, updated_at = datetime('now') WHERE id = 1`)
        .run(preferred_mode)
    }

    if (nickname !== undefined) {
      db.prepare(`UPDATE users SET nickname = ?, updated_at = datetime('now') WHERE id = 1`)
        .run(nickname)
    }

    const updated = getUser()
    return NextResponse.json({ success: true, data: updated })
  } catch (err) {
    const message = err instanceof Error ? err.message : '更新用户失败'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
