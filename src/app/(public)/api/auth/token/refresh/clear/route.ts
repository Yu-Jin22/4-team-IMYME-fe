import { NextResponse } from 'next/server'

import { clearAuthCookies } from '@/features/auth/server'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  clearAuthCookies(res)
  return res
}
