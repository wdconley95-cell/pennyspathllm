'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'
import { PennyMark } from './icons/PennyMark'
import { useChatStore, createUserMessage, createStreamingMessage, formatMessagesForAPI } from '@/lib/store'
import { formatTimestamp, copyToClipboard, validateFileType, formatFileSize } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { 
  Send, 
  Paperclip, 
  Copy, 
  RotateCcw, 
  Trash2, 
  FileText,
  X,
  Loader2,
  User,
  Bot
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function Chat() {
  const {
    messages,
    currentPersona,
    personaSettings,
    isLoading,
    error,
    attachedFile,
    attachmentText,
    addMessage,
    updateMessage,
    deleteMessage,
    setLoading,
    setError,
    setAttachedFile,
    setAttachmentText
  } = useChatStore()

  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [input])

  const handleSubmit = async (messageText?: string) => {
    const text = messageText || input.trim()
    if (!text || isLoading || isStreaming) return

    try {
      setLoading(true)
      setError(null)
      setInput('')

      // Add user message
      const userMessage = createUserMessage(text, attachmentText)
      addMessage(userMessage)

      // Clear attachment after sending
      if (attachedFile) {
        setAttachedFile(null)
        setAttachmentText(null)
      }

      // Create streaming assistant message
      const streamingMessage = createStreamingMessage(currentPersona.id)
      addMessage(streamingMessage)
      setIsStreaming(true)

      // Prepare API request - use updated messages from store
      const currentMessages = useChatStore.getState().messages
      const apiMessages = formatMessagesForAPI(currentMessages.slice(0, -1)) // Exclude the streaming message
      const requestBody = {
        messages: apiMessages,
        personaId: currentPersona.id,
        settings: personaSettings,
        attachmentText
      }

      // Stream response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      const decoder = new TextDecoder()
      let assistantContent = ''
      let streamingMessageId = ''

      // Find the streaming message ID
      const currentMessages = useChatStore.getState().messages
      const lastMessage = currentMessages[currentMessages.length - 1]
      if (lastMessage?.isStreaming) {
        streamingMessageId = lastMessage.id
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              if (data.error) {
                throw new Error(data.error)
              }
              
              if (data.content) {
                assistantContent += data.content
                if (streamingMessageId) {
                  updateMessage(streamingMessageId, { 
                    content: assistantContent,
                    isStreaming: true 
                  })
                }
              }
              
              if (data.type === 'finish' || data.type === 'end') {
                if (streamingMessageId) {
                  updateMessage(streamingMessageId, { 
                    content: assistantContent,
                    isStreaming: false,
                    personaId: currentPersona.id
                  })
                }
                return
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', line)
            }
          }
        }
      }

    } catch (err) {
      console.error('Chat error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      
      // Remove the streaming message if there was an error
      const currentMessages = useChatStore.getState().messages
      const lastMessage = currentMessages[currentMessages.length - 1]
      if (lastMessage?.isStreaming) {
        deleteMessage(lastMessage.id)
      }
    } finally {
      setLoading(false)
      setIsStreaming(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['.txt', '.md', '.pdf', 'text/plain', 'text/markdown', 'application/pdf']
    if (!validateFileType(file, allowedTypes)) {
      setError('Please upload a text file, markdown file, or PDF')
      return
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size must be less than 10MB')
      return
    }

    setAttachedFile(file)
    
    // Extract text content
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      setAttachmentText(text)
    }
    reader.readAsText(file)
  }

  const removeAttachment = () => {
    setAttachedFile(null)
    setAttachmentText(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onCopy={() => copyToClipboard(message.content)}
              onDelete={() => deleteMessage(message.id)}
              onRegenerate={() => {
                // Find the last user message before this one
                const messageIndex = messages.findIndex(m => m.id === message.id)
                const previousMessages = messages.slice(0, messageIndex)
                const lastUserMessage = [...previousMessages].reverse().find(m => m.role === 'user')
                
                if (lastUserMessage) {
                  // Delete this message and regenerate
                  deleteMessage(message.id)
                  handleSubmit(lastUserMessage.content)
                }
              }}
            />
          ))}
        </AnimatePresence>
        
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm"
          >
            {error}
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <div className="border-t border-stone-200 p-4 bg-sand-50">
        {/* Attachment Preview */}
        {attachedFile && (
          <div className="mb-3">
            <div className="flex items-center gap-2 p-3 bg-stone-100 rounded-xl border">
              <FileText className="h-4 w-4 text-ink-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink-900 truncate">
                  {attachedFile.name}
                </p>
                <p className="text-xs text-ink-600">
                  {formatFileSize(attachedFile.size)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={removeAttachment}
                className="h-6 w-6"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask ${currentPersona.name} anything about your career...`}
              className="min-h-[60px] max-h-[200px] resize-none pr-12"
              disabled={isLoading || isStreaming}
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.pdf,text/plain,text/markdown,application/pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isStreaming}
              className="h-10 w-10"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            
            <Button
              variant="penny"
              size="icon"
              onClick={() => handleSubmit()}
              disabled={!input.trim() || isLoading || isStreaming}
              className="h-10 w-10"
            >
              {isLoading || isStreaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-2 text-xs text-ink-500">
          <div>
            Press Enter to send, Shift+Enter for new line
          </div>
          <div>
            {input.length}/4000
          </div>
        </div>
      </div>
    </div>
  )
}

interface MessageBubbleProps {
  message: any
  onCopy: () => void
  onDelete: () => void
  onRegenerate: () => void
}

function MessageBubble({ message, onCopy, onDelete, onRegenerate }: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false)
  const isUser = message.role === 'user'
  const isStreaming = message.isStreaming

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        'flex gap-3 group',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      <div className={cn(
        'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
        isUser 
          ? 'bg-brand text-sand-50' 
          : 'bg-stone-100 text-ink-600'
      )}>
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <PennyMark size="sm" />
        )}
      </div>

      {/* Message Content */}
      <div className={cn(
        'flex-1 max-w-2xl',
        isUser ? 'text-right' : 'text-left'
      )}>
        <div className={cn(
          'inline-block p-4 rounded-2xl',
          isUser
            ? 'bg-brand text-sand-50 rounded-br-md'
            : 'bg-white border border-stone-200 rounded-bl-md'
        )}>
          <div className="prose prose-sm max-w-none">
            {isStreaming ? (
              <div className="flex items-center gap-2">
                <span>{message.content}</span>
                <div className="typing-indicator w-1 h-4 bg-current rounded opacity-50" />
              </div>
            ) : (
              <div className="whitespace-pre-wrap">
                {message.content}
              </div>
            )}
          </div>
        </div>

        {/* Timestamp and Actions */}
        <div className={cn(
          'flex items-center gap-2 mt-1 text-xs text-ink-500',
          isUser ? 'justify-end' : 'justify-start'
        )}>
          <span>{formatTimestamp(message.timestamp)}</span>
          
          <AnimatePresence>
            {showActions && !isStreaming && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onCopy}
                  className="h-6 w-6"
                >
                  <Copy className="h-3 w-3" />
                </Button>
                
                {!isUser && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onRegenerate}
                    className="h-6 w-6"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onDelete}
                  className="h-6 w-6 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

export default Chat
