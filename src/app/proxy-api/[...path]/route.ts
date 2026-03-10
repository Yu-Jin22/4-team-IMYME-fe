import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import { ACCESS_TOKEN_COOKIE } from '@/features/auth/server'

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''
const EMPTY_BODY_SIZE = 0
const FORWARDED_HEADER_KEYS = ['content-type', 'accept'] as const
const NO_BODY_STATUS_CODES = new Set([204, 205, 304])
const CACHE_CONTROL_HEADER = 'cache-control'
const PRIVATE_REVALIDATE_CACHE_CONTROL = 'private, max-age=0, must-revalidate'
const SSE_CONTENT_TYPE = 'text/event-stream'
const SSE_CACHE_CONTROL = 'no-cache, no-transform'
const SSE_BUFFERING_HEADER_KEY = 'x-accel-buffering'
const SSE_BUFFERING_DISABLED = 'no'

// 업스트림이 SSE 응답인지 판별해 버퍼링 없는 패스스루 분기를 탄다.
const shouldTreatAsSse = (contentType: string | null) =>
  contentType?.toLowerCase().includes(SSE_CONTENT_TYPE) ?? false

const buildBackendUrl = (pathSegments: string[], searchParams: URLSearchParams) => {
  const normalizedBaseUrl = BACKEND_BASE_URL.replace(/\/$/, '')
  const normalizedPath = pathSegments.join('/')
  const search = searchParams.toString()
  return search
    ? `${normalizedBaseUrl}/${normalizedPath}?${search}`
    : `${normalizedBaseUrl}/${normalizedPath}`
}

const createProxyResponse = async (request: NextRequest, pathSegments: string[]) => {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value ?? ''

  if (!accessToken) {
    return NextResponse.json(
      { error: 'missing_access_token' },
      {
        status: 401,
        headers: {
          [CACHE_CONTROL_HEADER]: PRIVATE_REVALIDATE_CACHE_CONTROL,
        },
      },
    )
  }

  const upstreamHeaders = new Headers()
  upstreamHeaders.set('Authorization', `Bearer ${accessToken}`)

  FORWARDED_HEADER_KEYS.forEach((headerKey) => {
    const headerValue = request.headers.get(headerKey)
    if (headerValue) {
      upstreamHeaders.set(headerKey, headerValue)
    }
  })

  // GET/HEAD는 body를 사용하지 않으므로 불필요한 body read를 피한다.
  const allowsBody = request.method !== 'GET' && request.method !== 'HEAD'
  const requestBody = allowsBody ? await request.arrayBuffer() : null
  const hasRequestBody = requestBody ? requestBody.byteLength > EMPTY_BODY_SIZE : false
  const upstreamResponse = await fetch(
    buildBackendUrl(pathSegments, request.nextUrl.searchParams),
    {
      method: request.method,
      headers: upstreamHeaders,
      body: hasRequestBody ? requestBody : undefined,
    },
  )

  const responseHeaders = new Headers()
  const contentType = upstreamResponse.headers.get('content-type')
  const isSseResponse = shouldTreatAsSse(contentType)

  if (isSseResponse) {
    // SSE는 중간 버퍼링이 있으면 실시간성이 깨져서 no-transform/no-buffering이 필요하다.
    responseHeaders.set(CACHE_CONTROL_HEADER, SSE_CACHE_CONTROL)
    responseHeaders.set(SSE_BUFFERING_HEADER_KEY, SSE_BUFFERING_DISABLED)
  } else {
    responseHeaders.set(CACHE_CONTROL_HEADER, PRIVATE_REVALIDATE_CACHE_CONTROL)
  }

  if (contentType) {
    responseHeaders.set('content-type', contentType)
  }

  if (NO_BODY_STATUS_CODES.has(upstreamResponse.status)) {
    return new NextResponse(null, {
      status: upstreamResponse.status,
      headers: responseHeaders,
    })
  }

  if (isSseResponse) {
    // SSE는 전체 응답을 미리 읽지 않고 ReadableStream 그대로 전달해야 한다.
    return new NextResponse(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: responseHeaders,
    })
  }

  const responseBody = await upstreamResponse.arrayBuffer()
  return new NextResponse(responseBody, {
    status: upstreamResponse.status,
    headers: responseHeaders,
  })
}

const createMethodHandler =
  () =>
  async (
    request: NextRequest,
    context: {
      params: Promise<{ path: string[] }>
    },
  ) => {
    const { path } = await context.params
    // 브라우저는 /proxy-api/*만 호출하고, 실제 backend 경로/인증 헤더 주입은 여기서 끝낸다.
    return createProxyResponse(request, path)
  }

export const GET = createMethodHandler()
export const POST = createMethodHandler()
export const PUT = createMethodHandler()
export const PATCH = createMethodHandler()
export const DELETE = createMethodHandler()
