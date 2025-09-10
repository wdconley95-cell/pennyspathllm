import { NextRequest, NextResponse } from 'next/server'
import { generateSpeech, handleOpenAIError } from '@/lib/openai'
import { createRateLimitMiddleware, RATE_LIMIT_CONFIGS, createRateLimitHeaders } from '@/lib/rate-limit'

// Node runtime for OpenAI audio generation
export const runtime = 'nodejs'

const rateLimitMiddleware = createRateLimitMiddleware(RATE_LIMIT_CONFIGS.voice)

interface SpeechRequest {
  text: string
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
}

export async function POST(request: NextRequest) {
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

    // Parse request body
    let body: SpeechRequest
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!body.text || typeof body.text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required and must be a string' },
        { status: 400 }
      )
    }

    // Limit text length to prevent abuse
    if (body.text.length > 4000) {
      return NextResponse.json(
        { error: 'Text is too long (max 4000 characters)' },
        { status: 400 }
      )
    }

    // Verify OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Generate speech
    const audioBuffer = await generateSpeech(body.text, body.voice || 'nova')
    
    // Convert Buffer to Uint8Array for NextResponse compatibility
    const audioArray = new Uint8Array(audioBuffer)
    
    const response = new NextResponse(audioArray, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        ...createRateLimitHeaders(rateLimitResult)
      }
    })
    
    return response

  } catch (error) {
    console.error('Speech API error:', error)
    
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  })
}
