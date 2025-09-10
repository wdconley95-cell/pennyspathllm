import { NextRequest } from 'next/server'
import { streamChatCompletion, handleOpenAIError } from '@/lib/openai'
import { createSSEResponse, createErrorSSE } from '@/lib/stream'
import { createRateLimitMiddleware, RATE_LIMIT_CONFIGS, createRateLimitHeaders } from '@/lib/rate-limit'
import { getPersonaById } from '@/lib/personas'

// Edge runtime for better performance and streaming
export const runtime = 'edge'

interface ChatRequest {
  messages: Array<{
    role: 'user' | 'assistant' | 'system'
    content: string
  }>
  personaId: string
  settings?: {
    model?: string
    temperature?: number
    maxTokens?: number
  }
  attachmentText?: string | null
}

const rateLimitMiddleware = createRateLimitMiddleware(RATE_LIMIT_CONFIGS.chat)

export async function POST(request: NextRequest) {
  try {
    // Check rate limiting
    const rateLimitResult = await rateLimitMiddleware(request)
    
    if (!rateLimitResult.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again later.',
          resetTime: rateLimitResult.resetTime 
        }),
        { 
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...createRateLimitHeaders(rateLimitResult)
          }
        }
      )
    }

    // Parse request body
    let body: ChatRequest
    try {
      body = await request.json()
    } catch (error) {
      return createErrorSSE('Invalid JSON in request body', 400)
    }

    // Validate required fields
    if (!body.messages || !Array.isArray(body.messages)) {
      return createErrorSSE('Messages array is required', 400)
    }

    if (!body.personaId) {
      return createErrorSSE('Persona ID is required', 400)
    }

    // Get persona configuration
    const persona = getPersonaById(body.personaId)
    if (!persona) {
      return createErrorSSE('Invalid persona ID', 400)
    }

    // Validate messages
    for (const message of body.messages) {
      if (!message.role || !message.content) {
        return createErrorSSE('Each message must have role and content', 400)
      }
      
      if (!['user', 'assistant', 'system'].includes(message.role)) {
        return createErrorSSE('Invalid message role', 400)
      }
    }

    // Prepare streaming request
    const streamRequest = {
      messages: body.messages,
      model: body.settings?.model || persona.model || 'gpt-4o-mini',
      temperature: body.settings?.temperature ?? persona.temperature,
      maxTokens: body.settings?.maxTokens ?? persona.maxTokens,
      systemPrompt: persona.systemPrompt,
      attachmentText: body.attachmentText
    }

    // Create streaming response
    const stream = await streamChatCompletion(streamRequest)
    const response = createSSEResponse(stream)
    
    // Add rate limit headers
    const rateLimitHeaders = createRateLimitHeaders(rateLimitResult)
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    
    return response

  } catch (error) {
    console.error('Chat API error:', error)
    
    // Handle OpenAI-specific errors
    if (error && typeof error === 'object' && 'status' in error) {
      const openaiError = handleOpenAIError(error)
      return createErrorSSE(openaiError.message, openaiError.statusCode || 500)
    }
    
    // Handle other errors
    return createErrorSSE(
      error instanceof Error ? error.message : 'Internal server error',
      500
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
