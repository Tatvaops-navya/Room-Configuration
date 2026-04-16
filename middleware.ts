import { NextRequest, NextResponse } from 'next/server'

const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:5173']

function getAllowedOrigins(): string[] {
  const configured = (process.env.CORS_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)

  return Array.from(new Set([...DEFAULT_ALLOWED_ORIGINS, ...configured]))
}

function resolveCorsOrigin(request: NextRequest): string | null {
  const origin = request.headers.get('origin')
  if (!origin) return null
  return getAllowedOrigins().includes(origin) ? origin : null
}

function applyCorsHeaders(response: NextResponse, origin: string | null): NextResponse {
  if (!origin) return response
  response.headers.set('Access-Control-Allow-Origin', origin)
  response.headers.set('Vary', 'Origin')
  response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  const allowedOrigin = resolveCorsOrigin(request)
  if (request.method === 'OPTIONS') {
    return applyCorsHeaders(new NextResponse(null, { status: 204 }), allowedOrigin)
  }

  return applyCorsHeaders(NextResponse.next(), allowedOrigin)
}

export const config = {
  matcher: ['/api/:path*'],
}
