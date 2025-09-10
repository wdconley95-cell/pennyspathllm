// For now, we'll implement basic markdown processing without external dependencies
// In production, you would use remark/remarkGfm/remarkHtml

/**
 * Safe markdown processing with GitHub Flavored Markdown support
 */
export async function processMarkdown(content: string): Promise<string> {
  try {
    // Simple markdown processing - in production you'd use remark
    let html = content
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      // Code
      .replace(/`(.*?)`/gim, '<code>$1</code>')
      // Line breaks
      .replace(/\n/g, '<br>')
    
    return html
  } catch (error) {
    console.error('Markdown processing error:', error)
    // Fallback to plain text with line breaks
    return content.replace(/\n/g, '<br>')
  }
}

/**
 * Extract and format code blocks from markdown
 */
export function extractCodeBlocks(content: string): Array<{
  language: string
  code: string
  startIndex: number
  endIndex: number
}> {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
  const blocks: Array<{
    language: string
    code: string
    startIndex: number
    endIndex: number
  }> = []
  
  let match
  while ((match = codeBlockRegex.exec(content)) !== null) {
    blocks.push({
      language: match[1] || 'text',
      code: match[2].trim(),
      startIndex: match.index,
      endIndex: match.index + match[0].length
    })
  }
  
  return blocks
}

/**
 * Format text for better readability in chat
 */
export function formatChatMessage(content: string): string {
  // Convert line breaks to proper paragraph breaks
  let formatted = content.replace(/\n\n+/g, '\n\n')
  
  // Ensure proper spacing around lists
  formatted = formatted.replace(/([^\n])\n([*-] )/g, '$1\n\n$2')
  formatted = formatted.replace(/([*-] [^\n]+)\n([^\n*-])/g, '$1\n\n$2')
  
  // Ensure proper spacing around numbered lists
  formatted = formatted.replace(/([^\n])\n(\d+\. )/g, '$1\n\n$2')
  formatted = formatted.replace(/(\d+\. [^\n]+)\n([^\n\d])/g, '$1\n\n$2')
  
  return formatted.trim()
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Convert plain text URLs to markdown links
 */
export function autoLinkUrls(text: string): string {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  return text.replace(urlRegex, '[$1]($1)')
}

/**
 * Truncate text while preserving markdown structure
 */
export function truncateMarkdown(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  
  // Find a good break point (preferably at a paragraph or sentence end)
  const truncated = text.slice(0, maxLength)
  const lastParagraph = truncated.lastIndexOf('\n\n')
  const lastSentence = truncated.lastIndexOf('. ')
  
  let cutPoint = maxLength
  if (lastParagraph > maxLength * 0.7) {
    cutPoint = lastParagraph
  } else if (lastSentence > maxLength * 0.7) {
    cutPoint = lastSentence + 1
  }
  
  return text.slice(0, cutPoint) + '...'
}

/**
 * Generate a summary of markdown content
 */
export function summarizeContent(content: string, maxWords: number = 50): string {
  // Remove markdown formatting
  const plainText = content
    .replace(/[#*`_~\[\]()]/g, '') // Remove markdown symbols
    .replace(/\n+/g, ' ') // Replace line breaks with spaces
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
  
  const words = plainText.split(' ')
  if (words.length <= maxWords) return plainText
  
  return words.slice(0, maxWords).join(' ') + '...'
}

/**
 * Extract mentions and tags from text
 */
export function extractMentions(text: string): {
  mentions: string[]
  hashtags: string[]
} {
  const mentions = Array.from(text.matchAll(/@(\w+)/g), m => m[1])
  const hashtags = Array.from(text.matchAll(/#(\w+)/g), m => m[1])
  
  return {
    mentions: [...new Set(mentions)], // Remove duplicates
    hashtags: [...new Set(hashtags)]
  }
}

/**
 * Convert markdown to plain text
 */
export function markdownToPlainText(markdown: string): string {
  return markdown
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    // Remove inline code
    .replace(/`[^`]+`/g, '')
    // Remove headers
    .replace(/#{1,6}\s+/g, '')
    // Remove emphasis
    .replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, '$1')
    // Remove links
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove images
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    // Remove blockquotes
    .replace(/^>\s+/gm, '')
    // Remove list markers
    .replace(/^[*+-]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    // Clean up whitespace
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Validate and clean markdown for safe rendering
 */
export function cleanMarkdown(content: string): string {
  // Remove potentially dangerous HTML
  let cleaned = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
  cleaned = cleaned.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
  cleaned = cleaned.replace(/<object[^>]*>[\s\S]*?<\/object>/gi, '')
  cleaned = cleaned.replace(/<embed[^>]*>/gi, '')
  cleaned = cleaned.replace(/<form[^>]*>[\s\S]*?<\/form>/gi, '')
  
  // Remove javascript: and data: URLs
  cleaned = cleaned.replace(/javascript:/gi, '')
  cleaned = cleaned.replace(/data:/gi, '')
  
  return cleaned
}

/**
 * Check if content contains code blocks
 */
export function hasCodeBlocks(content: string): boolean {
  return /```[\s\S]*?```/.test(content)
}

/**
 * Get estimated reading time
 */
export function getReadingTime(content: string): number {
  const plainText = markdownToPlainText(content)
  const words = plainText.split(/\s+/).length
  const wordsPerMinute = 200 // Average reading speed
  return Math.ceil(words / wordsPerMinute)
}
