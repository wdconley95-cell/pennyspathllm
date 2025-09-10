import { NextRequest, NextResponse } from 'next/server'
import { createRealtimeToken, handleOpenAIError } from '@/lib/openai'
import { createRateLimitMiddleware, RATE_LIMIT_CONFIGS, createRateLimitHeaders } from '@/lib/rate-limit'

// Node runtime required for OpenAI realtime token generation
export const runtime = 'nodejs'

const rateLimitMiddleware = createRateLimitMiddleware(RATE_LIMIT_CONFIGS.voice)

export async function GET(request: NextRequest) {
  try {
    // Check rate limiting
    const rateLimitResult = await rateLimitMiddleware(request)
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please try again later.',
          resetTime: rateLimitResult.resetTime 
        },
        { 
          status: 429,
          headers: createRateLimitHeaders(rateLimitResult)
        }
      )
    }

    // Verify OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Generate ephemeral token for realtime API
    const token = await createRealtimeToken()
    
    const response = NextResponse.json({ 
      token,
      model: process.env.OPENAI_REALTIMES_MODEL || 'gpt-4o-realtime-preview',
      expiresAt: Date.now() + (15 * 60 * 1000) // 15 minutes
    })
    
    // Add rate limit headers
    const rateLimitHeaders = createRateLimitHeaders(rateLimitResult)
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    
    return response

  } catch (error) {
    console.error('Realtime token API error:', error)
    
    // Handle OpenAI-specific errors
    if (error && typeof error === 'object' && 'status' in error) {
      const openaiError = handleOpenAIError(error)
      return NextResponse.json(
        { error: openaiError.message },
        { status: openaiError.statusCode || 500 }
      )
    }
    
    // Handle other errors
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  // Handle CORS preflight
  const origin = request.headers.get('origin') || '*'
  
  // In production, you might want to restrict origins
  const allowedOrigin = process.env.ALLOWED_ORIGIN 
    ? (origin === process.env.ALLOWED_ORIGIN ? origin : 'null')
    : origin

  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  })
}
