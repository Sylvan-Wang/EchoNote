import { NextRequest, NextResponse } from 'next/server'
import { getUser, updateUser } from '@/lib/db'

export async function GET() {
  try {
    const user = await getUser()
    return NextResponse.json({ success: true, data: user })
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取用户失败'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json() as { preferred_mode?: string; nickname?: string }
    const updated = await updateUser(body)
    return NextResponse.json({ success: true, data: updated })
  } catch (err) {
    const message = err instanceof Error ? err.message : '更新用户失败'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
