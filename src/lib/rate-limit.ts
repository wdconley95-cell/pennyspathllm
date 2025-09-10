import { createTokenBucket, consumeToken, type TokenBucket } from './openai'

// In-memory rate limiting for development
const buckets = new Map<string, TokenBucket>()

interface RateLimitConfig {
  capacity: number // Maximum tokens
  refillRate: number // Tokens per second
  windowMs?: number // Window size in milliseconds (for time-based limits)
}

const DEFAULT_CONFIG: RateLimitConfig = {
  capacity: 10, // 10 requests
  refillRate: 1/60, // 1 request per minute
  windowMs: 60 * 1000 // 1 minute window
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
  error?: string
}

/**
 * Simple in-memory rate limiting using token bucket algorithm
 */
export function checkRateLimit(
  identifier: string,
  config: Partial<RateLimitConfig> = {}
): RateLimitResult {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  
  // Get or create bucket for this identifier
  let bucket = buckets.get(identifier)
  if (!bucket) {
    bucket = createTokenBucket(finalConfig.capacity, finalConfig.refillRate)
    buckets.set(identifier, bucket)
  }
  
  const success = consumeToken(bucket)
  const resetTime = Date.now() + (finalConfig.windowMs || 60000)
  
  return {
    success,
    limit: finalConfig.capacity,
    remaining: Math.floor(bucket.tokens),
    resetTime,
    error: success ? undefined : 'Rate limit exceeded'
  }
}

/**
 * Redis-based rate limiting (for production when available)
 */
export async function checkUpstashRateLimit(
  identifier: string,
  config: Partial<RateLimitConfig> = {}
): Promise<RateLimitResult> {
  // For now, always fall back to in-memory rate limiting
  // In production, you would install @upstash/ratelimit and @upstash/redis
  console.log('Using in-memory rate limiting (install @upstash/ratelimit for production)')
  return checkRateLimit(identifier, config)
}

/**
 * Get client identifier from request
 */
export function getClientIdentifier(request: Request): string {
  // Try to get IP from various headers (for Vercel, CloudFlare, etc.)
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const clientIp = request.headers.get('x-client-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIp) {
    return realIp
  }
  
  if (clientIp) {
    return clientIp
  }
  
  // Fallback to a default identifier
  return 'unknown-client'
}

/**
 * Rate limit middleware factory
 */
export function createRateLimitMiddleware(config?: Partial<RateLimitConfig>) {
  return async (request: Request): Promise<RateLimitResult> => {
    const identifier = getClientIdentifier(request)
    
    // Use Upstash in production, in-memory for development
    if (process.env.NODE_ENV === 'production' && process.env.UPSTASH_REDIS_REST_URL) {
      return await checkUpstashRateLimit(identifier, config)
    } else {
      return checkRateLimit(identifier, config)
    }
  }
}

/**
 * Different rate limit profiles for different endpoints
 */
export const RATE_LIMIT_CONFIGS = {
  chat: {
    capacity: 20, // 20 messages
    refillRate: 1/30, // 1 message per 30 seconds
    windowMs: 10 * 60 * 1000 // 10 minute window
  },
  
  voice: {
    capacity: 10, // 10 voice sessions
    refillRate: 1/60, // 1 session per minute
    windowMs: 5 * 60 * 1000 // 5 minute window
  },
  
  files: {
    capacity: 5, // 5 file uploads
    refillRate: 1/300, // 1 upload per 5 minutes
    windowMs: 30 * 60 * 1000 // 30 minute window
  },
  
  general: {
    capacity: 50, // 50 requests
    refillRate: 1/60, // 1 request per minute
    windowMs: 60 * 60 * 1000 // 1 hour window
  }
} as const

/**
 * Create rate limit headers for response
 */
export function createRateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetTime.toString(),
    ...(result.error && { 'X-RateLimit-Error': result.error })
  }
}

/**
 * Clean up old buckets periodically (for memory management)
 */
export function cleanupOldBuckets() {
  const now = Date.now()
  const maxAge = 24 * 60 * 60 * 1000 // 24 hours
  
  Array.from(buckets.entries()).forEach(([key, bucket]) => {
    if (now - bucket.lastRefill > maxAge) {
      buckets.delete(key)
    }
  })
}

// Clean up old buckets every hour
if (typeof globalThis !== 'undefined' && typeof globalThis.setInterval === 'function') {
  globalThis.setInterval(cleanupOldBuckets, 60 * 60 * 1000)
}
