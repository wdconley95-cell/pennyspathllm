'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { useChatStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Phone, 
  PhoneOff,
  Loader2,
  AlertCircle,
  Settings,
  X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface VoiceControlsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VoiceControls({ open, onOpenChange }: VoiceControlsProps) {
  const { voice, setVoiceState, resetVoiceState } = useChatStore()
  const [isSupported, setIsSupported] = useState(true)
  const [audioLevel, setAudioLevel] = useState(0)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const realtimeConnectionRef = useRef<WebSocket | null>(null)

  // Check browser support
  useEffect(() => {
    const checkSupport = () => {
      const hasWebRTC = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
      const hasWebAudio = !!(window.AudioContext || (window as any).webkitAudioContext)
      const hasWebSocket = !!window.WebSocket
      
      setIsSupported(hasWebRTC && hasWebAudio && hasWebSocket)
      
      if (!hasWebRTC) {
        setVoiceState({ error: 'WebRTC not supported in this browser' })
      } else if (!hasWebAudio) {
        setVoiceState({ error: 'Web Audio API not supported' })
      } else if (!hasWebSocket) {
        setVoiceState({ error: 'WebSocket not supported' })
      }
    }

    checkSupport()
  }, [setVoiceState])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [])

  const cleanup = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    
    if (realtimeConnectionRef.current) {
      realtimeConnectionRef.current.close()
      realtimeConnectionRef.current = null
    }
    
    analyserRef.current = null
  }

  const startVoiceSession = async () => {
    if (!isSupported) return

    try {
      setVoiceState({ error: null })
      
      // Try WebRTC Realtime API first
      if (await tryWebRTCRealtime()) {
        return
      }
      
      // Fallback to Web Speech API
      await tryWebSpeechAPI()
      
    } catch (error) {
      console.error('Voice session error:', error)
      setVoiceState({ 
        error: error instanceof Error ? error.message : 'Failed to start voice session',
        isActive: false,
        isRecording: false,
        isConnected: false
      })
    }
  }

  const tryWebRTCRealtime = async (): Promise<boolean> => {
    try {
      // Get ephemeral token from our API
      const tokenResponse = await fetch('/api/realtime-token')
      if (!tokenResponse.ok) {
        throw new Error('Failed to get realtime token')
      }
      
      const { token } = await tokenResponse.json()
      
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true 
        } 
      })
      
      mediaStreamRef.current = stream
      
      // Set up audio visualization
      setupAudioVisualization(stream)
      
      // Connect to OpenAI Realtime API
      const ws = new WebSocket('wss://api.openai.com/v1/realtime', [
        'realtime', 
        `Bearer.${token}`
      ])
      
      realtimeConnectionRef.current = ws
      
      ws.onopen = () => {
        setVoiceState({ 
          isActive: true, 
          isConnected: true,
          isRecording: true,
          error: null 
        })
      }
      
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          handleRealtimeMessage(message)
        } catch (error) {
          console.error('Failed to parse realtime message:', error)
        }
      }
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setVoiceState({ error: 'Connection error' })
      }
      
      ws.onclose = () => {
        setVoiceState({ 
          isActive: false, 
          isConnected: false,
          isRecording: false 
        })
        cleanup()
      }
      
      return true
      
    } catch (error) {
      console.error('WebRTC Realtime failed:', error)
      return false
    }
  }

  const tryWebSpeechAPI = async () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      throw new Error('Speech recognition not supported')
    }
    
    // Get microphone access for visualization
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaStreamRef.current = stream
    setupAudioVisualization(stream)
    
    // Set up speech recognition
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    const recognition = new SpeechRecognition()
    
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    
    recognition.onstart = () => {
      setVoiceState({ 
        isActive: true, 
        isRecording: true,
        isConnected: true,
        error: null 
      })
    }
    
    recognition.onresult = (event: any) => {
      let finalTranscript = ''
      let interimTranscript = ''
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalTranscript += result[0].transcript
        } else {
          interimTranscript += result[0].transcript
        }
      }
      
      setVoiceState({ 
        transcript: finalTranscript + interimTranscript 
      })
      
      if (finalTranscript) {
        handleSpeechResult(finalTranscript)
      }
    }
    
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      setVoiceState({ error: `Speech recognition error: ${event.error}` })
    }
    
    recognition.onend = () => {
      setVoiceState({ 
        isActive: false, 
        isRecording: false,
        isConnected: false 
      })
    }
    
    recognition.start()
  }

  const setupAudioVisualization = (stream: MediaStream) => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext
    audioContextRef.current = new AudioContext()
    
    const analyser = audioContextRef.current.createAnalyser()
    analyser.fftSize = 256
    analyserRef.current = analyser
    
    const source = audioContextRef.current.createMediaStreamSource(stream)
    source.connect(analyser)
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    
    const updateAudioLevel = () => {
      if (!analyserRef.current) return
      
      analyser.getByteFrequencyData(dataArray)
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length
      setAudioLevel(average / 255)
      
      if (voice.isRecording) {
        requestAnimationFrame(updateAudioLevel)
      }
    }
    
    updateAudioLevel()
  }

  const handleRealtimeMessage = (message: any) => {
    // Handle different message types from OpenAI Realtime API
    switch (message.type) {
      case 'conversation.item.input_audio_transcription.completed':
        setVoiceState({ transcript: message.transcript })
        break
      case 'response.audio.delta':
        // Handle audio playback
        playAudioChunk(message.delta)
        break
      case 'error':
        setVoiceState({ error: message.error.message })
        break
    }
  }

  const handleSpeechResult = async (transcript: string) => {
    // Send the transcript to the chat
    // This would integrate with the Chat component
    console.log('Speech result:', transcript)
  }

  const playAudioChunk = (audioData: string) => {
    // Implement audio playback for realtime responses
    // This would convert base64 audio data to playable audio
    console.log('Playing audio chunk:', audioData.length)
  }

  const stopVoiceSession = () => {
    cleanup()
    resetVoiceState()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-ink-900/20 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">
                Voice Mode
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Status */}
            <div className="text-center">
              {voice.error ? (
                <div className="space-y-2">
                  <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-8 w-8 text-red-500" />
                  </div>
                  <p className="text-sm text-red-600">{voice.error}</p>
                </div>
              ) : voice.isActive ? (
                <div className="space-y-2">
                  <div className="w-16 h-16 mx-auto bg-brand/10 rounded-full flex items-center justify-center">
                    <Mic className="h-8 w-8 text-brand animate-pulse" />
                  </div>
                  <Badge variant="penny">
                    {voice.isRecording ? 'Listening...' : 'Connected'}
                  </Badge>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-16 h-16 mx-auto bg-stone-100 rounded-full flex items-center justify-center">
                    <MicOff className="h-8 w-8 text-stone-500" />
                  </div>
                  <p className="text-sm text-stone-600">Ready to start</p>
                </div>
              )}
            </div>

            {/* Audio Level Visualization */}
            {voice.isRecording && (
              <div className="space-y-2">
                <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-brand rounded-full"
                    style={{ width: `${audioLevel * 100}%` }}
                    animate={{ width: `${audioLevel * 100}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
                <p className="text-xs text-center text-stone-600">
                  Audio Level: {Math.round(audioLevel * 100)}%
                </p>
              </div>
            )}

            {/* Transcript */}
            {voice.transcript && (
              <div className="p-3 bg-stone-50 rounded-xl">
                <p className="text-sm text-stone-700">
                  {voice.transcript}
                </p>
              </div>
            )}

            {/* Controls */}
            <div className="flex gap-3">
              {voice.isActive ? (
                <Button
                  variant="destructive"
                  onClick={stopVoiceSession}
                  className="flex-1"
                >
                  <PhoneOff className="h-4 w-4 mr-2" />
                  Stop Session
                </Button>
              ) : (
                <Button
                  variant="penny"
                  onClick={startVoiceSession}
                  disabled={!isSupported}
                  className="flex-1"
                >
                  {voice.error ? (
                    <AlertCircle className="h-4 w-4 mr-2" />
                  ) : (
                    <Phone className="h-4 w-4 mr-2" />
                  )}
                  Start Voice Chat
                </Button>
              )}
            </div>

            {/* Support Info */}
            {!isSupported && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                <p className="text-xs text-yellow-700">
                  Voice mode requires a modern browser with microphone access.
                </p>
              </div>
            )}

            <div className="text-xs text-stone-500 space-y-1">
              <p>💡 Tip: Speak clearly and pause for responses</p>
              <p>🎤 Uses your microphone for real-time conversation</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default VoiceControls
