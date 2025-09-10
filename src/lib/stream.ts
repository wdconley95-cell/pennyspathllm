/**
 * Server-Sent Events utilities for Next.js Edge runtime
 */

export function createSSEResponse(stream: ReadableStream<string>): Response {
  const encoder = new TextEncoder()
  
  const transformedStream = new ReadableStream({
    start(controller) {
      const reader = stream.getReader()
      
      async function pump() {
        try {
          while (true) {
            const { done, value } = await reader.read()
            
            if (done) {
              controller.close()
              break
            }
            
            // Format as SSE data
            const sseData = `data: ${JSON.stringify({ content: value })}\n\n`
            controller.enqueue(encoder.encode(sseData))
          }
        } catch (error) {
          console.error('SSE stream error:', error)
          const errorData = `data: ${JSON.stringify({ 
            error: 'Stream error occurred',
            type: 'error' 
          })}\n\n`
          controller.enqueue(encoder.encode(errorData))
          controller.close()
        }
      }
      
      pump()
    }
  })
  
  return new Response(transformedStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export function createErrorSSE(error: string, statusCode: number = 500): Response {
  const encoder = new TextEncoder()
  const errorData = `data: ${JSON.stringify({ 
    error,
    type: 'error',
    statusCode
  })}\n\n`
  
  return new Response(encoder.encode(errorData), {
    status: statusCode,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export function createStreamingResponse(
  generator: () => AsyncGenerator<string, void, unknown>
): Response {
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of generator()) {
          const sseData = `data: ${JSON.stringify({ content: chunk })}\n\n`
          controller.enqueue(encoder.encode(sseData))
        }
        
        // Send end event
        const endData = `data: ${JSON.stringify({ type: 'end' })}\n\n`
        controller.enqueue(encoder.encode(endData))
        controller.close()
      } catch (error) {
        console.error('Streaming generator error:', error)
        const errorData = `data: ${JSON.stringify({ 
          error: 'Generation error occurred',
          type: 'error' 
        })}\n\n`
        controller.enqueue(encoder.encode(errorData))
        controller.close()
      }
    }
  })
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

/**
 * Client-side SSE hook utilities
 */
export interface SSEMessage {
  content?: string
  error?: string
  type?: 'content' | 'error' | 'end' | 'finish'
  usage?: any
  reason?: string
}

export class SSEClient {
  private eventSource: EventSource | null = null
  private onMessage: (message: SSEMessage) => void
  private onError: (error: Event) => void
  private onComplete: () => void
  
  constructor(
    onMessage: (message: SSEMessage) => void,
    onError: (error: Event) => void = () => {},
    onComplete: () => void = () => {}
  ) {
    this.onMessage = onMessage
    this.onError = onError
    this.onComplete = onComplete
  }
  
  connect(url: string) {
    this.disconnect()
    
    this.eventSource = new EventSource(url)
    
    this.eventSource.onmessage = (event) => {
      try {
        const data: SSEMessage = JSON.parse(event.data)
        
        if (data.type === 'end' || data.type === 'finish') {
          this.onComplete()
          this.disconnect()
          return
        }
        
        if (data.type === 'error') {
          this.onError(new CustomEvent('error', { detail: data.error }))
          this.disconnect()
          return
        }
        
        this.onMessage(data)
      } catch (error) {
        console.error('Failed to parse SSE message:', error)
        this.onError(new CustomEvent('error', { detail: 'Failed to parse message' }))
      }
    }
    
    this.eventSource.onerror = (event) => {
      this.onError(event)
      this.disconnect()
    }
  }
  
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }
  }
  
  isConnected(): boolean {
    return this.eventSource !== null && this.eventSource.readyState === EventSource.OPEN
  }
}

/**
 * Custom fetch wrapper for streaming responses
 */
export async function streamingFetch(
  url: string,
  options: RequestInit,
  onChunk: (chunk: string) => void,
  onError: (error: string) => void = () => {},
  onComplete: () => void = () => {}
): Promise<void> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'text/event-stream',
        ...options.headers,
      },
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    if (!response.body) {
      throw new Error('Response body is null')
    }
    
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    
    while (true) {
      const { done, value } = await reader.read()
      
      if (done) {
        onComplete()
        break
      }
      
      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6))
            
            if (data.type === 'error') {
              onError(data.error || 'Unknown streaming error')
              return
            }
            
            if (data.type === 'end' || data.type === 'finish') {
              onComplete()
              return
            }
            
            if (data.content) {
              onChunk(data.content)
            }
          } catch (parseError) {
            // Ignore parsing errors for malformed lines
            console.warn('Failed to parse SSE line:', line)
          }
        }
      }
    }
  } catch (error) {
    console.error('Streaming fetch error:', error)
    onError(error instanceof Error ? error.message : 'Unknown fetch error')
  }
}
