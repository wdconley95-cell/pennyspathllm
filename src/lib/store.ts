import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { generateId } from './utils'
import { DEFAULT_PERSONA, type Persona, type PersonaSettings, DEFAULT_SETTINGS } from './personas'

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  isStreaming?: boolean
  personaId?: string
  attachmentText?: string | null
}

export interface VoiceState {
  isActive: boolean
  isRecording: boolean
  isPlaying: boolean
  transcript: string
  audioLevel: number
  isConnected: boolean
  error: string | null
}

export interface ChatState {
  messages: Message[]
  currentPersona: Persona
  personaSettings: PersonaSettings
  isLoading: boolean
  error: string | null
  voice: VoiceState
  attachedFile: File | null
  attachmentText: string | null
  
  // Actions
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void
  updateMessage: (id: string, updates: Partial<Message>) => void
  deleteMessage: (id: string) => void
  clearMessages: () => void
  setCurrentPersona: (persona: Persona) => void
  updatePersonaSettings: (settings: Partial<PersonaSettings>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setVoiceState: (state: Partial<VoiceState>) => void
  setAttachedFile: (file: File | null) => void
  setAttachmentText: (text: string | null) => void
  resetVoiceState: () => void
}

const initialVoiceState: VoiceState = {
  isActive: false,
  isRecording: false,
  isPlaying: false,
  transcript: '',
  audioLevel: 0,
  isConnected: false,
  error: null
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      currentPersona: DEFAULT_PERSONA,
      personaSettings: DEFAULT_SETTINGS,
      isLoading: false,
      error: null,
      voice: initialVoiceState,
      attachedFile: null,
      attachmentText: null,

      addMessage: (message) => {
        const newMessage: Message = {
          ...message,
          id: generateId(),
          timestamp: new Date()
        }
        
        set((state) => ({
          messages: [...state.messages, newMessage]
        }))
      },

      updateMessage: (id, updates) => {
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === id ? { ...msg, ...updates } : msg
          )
        }))
      },

      deleteMessage: (id) => {
        set((state) => ({
          messages: state.messages.filter((msg) => msg.id !== id)
        }))
      },

      clearMessages: () => {
        set({ messages: [] })
      },

      setCurrentPersona: (persona) => {
        set({ 
          currentPersona: persona,
          personaSettings: {
            ...get().personaSettings,
            temperature: persona.temperature,
            maxTokens: persona.maxTokens
          }
        })
      },

      updatePersonaSettings: (settings) => {
        set((state) => ({
          personaSettings: { ...state.personaSettings, ...settings }
        }))
      },

      setLoading: (loading) => {
        set({ isLoading: loading })
      },

      setError: (error) => {
        set({ error })
      },

      setVoiceState: (voiceUpdates) => {
        set((state) => ({
          voice: { ...state.voice, ...voiceUpdates }
        }))
      },

      setAttachedFile: (file) => {
        set({ attachedFile: file })
      },

      setAttachmentText: (text) => {
        set({ attachmentText: text })
      },

      resetVoiceState: () => {
        set({ voice: initialVoiceState })
      }
    }),
    {
      name: 'pennys-path-chat',
      // Only persist certain parts of the state
      partialize: (state) => ({
        currentPersona: state.currentPersona,
        personaSettings: state.personaSettings,
        messages: state.messages.slice(-50) // Keep only last 50 messages
      }),
      // Don't persist voice state, loading states, or errors
      skipHydration: false,
    }
  )
)

// UI state store (not persisted)
interface UIState {
  sidebarOpen: boolean
  settingsOpen: boolean
  voiceControlsOpen: boolean
  theme: 'light' | 'dark' | 'system'
  
  setSidebarOpen: (open: boolean) => void
  setSettingsOpen: (open: boolean) => void
  setVoiceControlsOpen: (open: boolean) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  toggleSidebar: () => void
  toggleSettings: () => void
  toggleVoiceControls: () => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  settingsOpen: false,
  voiceControlsOpen: false,
  theme: 'system',

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  setVoiceControlsOpen: (open) => set({ voiceControlsOpen: open }),
  setTheme: (theme) => set({ theme }),
  
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleSettings: () => set((state) => ({ settingsOpen: !state.settingsOpen })),
  toggleVoiceControls: () => set((state) => ({ voiceControlsOpen: !state.voiceControlsOpen })),
}))

// Chat utilities
export function getLastUserMessage(messages: Message[]): Message | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') {
      return messages[i]
    }
  }
  return null
}

export function getLastAssistantMessage(messages: Message[]): Message | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'assistant') {
      return messages[i]
    }
  }
  return null
}

export function isStreamingActive(messages: Message[]): boolean {
  return messages.some(msg => msg.isStreaming)
}

export function formatMessagesForAPI(messages: Message[]): Array<{
  role: 'user' | 'assistant' | 'system'
  content: string
}> {
  return messages
    .filter(msg => msg.role !== 'system' && !msg.isStreaming)
    .map(msg => ({
      role: msg.role,
      content: msg.content
    }))
}

// Voice utilities
export function canStartVoiceSession(voice: VoiceState): boolean {
  return !voice.isActive && !voice.isRecording && !voice.isPlaying
}

export function isVoiceSessionActive(voice: VoiceState): boolean {
  return voice.isActive || voice.isRecording || voice.isPlaying
}

// Message utilities
export function createUserMessage(content: string, attachmentText?: string | null): Omit<Message, 'id' | 'timestamp'> {
  return {
    role: 'user',
    content,
    attachmentText
  }
}

export function createAssistantMessage(content: string, personaId?: string): Omit<Message, 'id' | 'timestamp'> {
  return {
    role: 'assistant',
    content,
    personaId,
    isStreaming: false
  }
}

export function createStreamingMessage(personaId?: string): Omit<Message, 'id' | 'timestamp'> {
  return {
    role: 'assistant',
    content: '',
    personaId,
    isStreaming: true
  }
}
