import OpenAI from 'openai'
import { ChatCompletionCreateParamsStreaming } from 'openai/resources/chat/completions'

// Server-side OpenAI client
export function createOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required')
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: Date
  id?: string
}

export interface StreamingChatRequest {
  messages: ChatMessage[]
  model?: string
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
  attachmentText?: string | null
}

export async function streamChatCompletion(
  request: StreamingChatRequest
): Promise<ReadableStream<string>> {
  const openai = createOpenAIClient()
  
  // Prepare messages with system prompt and attachment context
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = []
  
  // Add system prompt
  if (request.systemPrompt) {
    messages.push({
      role: 'system',
      content: request.systemPrompt
    })
  }
  
  // Add attachment context if present
  if (request.attachmentText) {
    messages.push({
      role: 'system',
      content: `Context from attached file:\n\n${request.attachmentText}\n\nPlease reference this context when relevant to the user's questions.`
    })
  }
  
  // Add conversation messages
  messages.push(...request.messages.map(msg => ({
    role: msg.role,
    content: msg.content
  })))

  const params: ChatCompletionCreateParamsStreaming = {
    model: request.model || 'gpt-4o-mini',
    messages,
    temperature: request.temperature ?? 0.7,
    max_tokens: request.maxTokens ?? 800,
    stream: true,
  }

  const stream = await openai.chat.completions.create(params)
  
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content
          if (content) {
            controller.enqueue(content)
          }
          
          // Check if stream is done
          if (chunk.choices[0]?.finish_reason) {
            // Send final metadata
            const finishData = JSON.stringify({
              type: 'finish',
              reason: chunk.choices[0].finish_reason,
              usage: chunk.usage
            })
            controller.enqueue(`\n\ndata: ${finishData}\n\n`)
            controller.close()
            return
          }
        }
      } catch (error) {
        console.error('Streaming error:', error)
        controller.error(error)
      }
    }
  })
}

export async function generateSpeech(
  text: string,
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'nova'
): Promise<Buffer> {
  const openai = createOpenAIClient()
  
  const response = await openai.audio.speech.create({
    model: 'tts-1',
    voice,
    input: text,
    response_format: 'mp3'
  })
  
  const buffer = Buffer.from(await response.arrayBuffer())
  return buffer
}

export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  const openai = createOpenAIClient()
  
  // Create a File-like object from the buffer
  const audioFile = new File([audioBuffer], 'audio.wav', { type: 'audio/wav' })
  
  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-1',
  })
  
  return transcription.text
}

export async function createRealtimeToken(): Promise<string> {
  const openai = createOpenAIClient()
  
  try {
    // Create ephemeral token for Realtime API
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_REALTIMES_MODEL || 'gpt-4o-realtime-preview',
        voice: 'nova'
      }),
    })
    
    if (!response.ok) {
      throw new Error(`Failed to create realtime session: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.client_secret?.value || data.token
  } catch (error) {
    console.error('Error creating realtime token:', error)
    throw new Error('Failed to create realtime session token')
  }
}

// Utility function to extract text content from various file types
export async function extractTextFromFile(file: File): Promise<string> {
  const fileType = file.type.toLowerCase()
  
  if (fileType === 'text/plain' || fileType === 'text/markdown' || file.name.endsWith('.md')) {
    return await file.text()
  }
  
  if (fileType === 'application/pdf') {
    // For now, we'll return a placeholder. In a production app, you'd use a PDF parsing library
    return `[PDF content from file: ${file.name}]\n\nNote: PDF parsing is not yet implemented. Please copy and paste the relevant text content.`
  }
  
  // Try to read as text for other file types
  try {
    return await file.text()
  } catch {
    return `[Unable to extract text from file: ${file.name}]`
  }
}

// Rate limiting types and utilities
export interface TokenBucket {
  tokens: number
  lastRefill: number
  capacity: number
  refillRate: number
}

export function createTokenBucket(capacity: number, refillRate: number): TokenBucket {
  return {
    tokens: capacity,
    lastRefill: Date.now(),
    capacity,
    refillRate
  }
}

export function consumeToken(bucket: TokenBucket): boolean {
  const now = Date.now()
  const timePassed = (now - bucket.lastRefill) / 1000
  
  // Refill tokens based on time passed
  bucket.tokens = Math.min(
    bucket.capacity,
    bucket.tokens + timePassed * bucket.refillRate
  )
  bucket.lastRefill = now
  
  if (bucket.tokens >= 1) {
    bucket.tokens -= 1
    return true
  }
  
  return false
}

// Error handling utilities
export class OpenAIError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message)
    this.name = 'OpenAIError'
  }
}

export function handleOpenAIError(error: any): OpenAIError {
  if (error.status === 429) {
    return new OpenAIError('Rate limit exceeded. Please try again later.', 429)
  }
  
  if (error.status === 401) {
    return new OpenAIError('Invalid API key configuration.', 401)
  }
  
  if (error.status >= 500) {
    return new OpenAIError('OpenAI service is temporarily unavailable.', error.status)
  }
  
  return new OpenAIError(error.message || 'An unexpected error occurred.', error.status)
}
