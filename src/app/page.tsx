'use client'

import React from 'react'
import { PersonaPicker } from '@/components/PersonaPicker'
import { Chat } from '@/components/Chat'
import { VoiceControls } from '@/components/VoiceControls'
import { SettingsSheet } from '@/components/SettingsSheet'
import { PennyMark } from '@/components/icons/PennyMark'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useUIStore, useChatStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Menu, Settings, Mic, MicOff, Sparkles } from 'lucide-react'

export default function HomePage() {
  const { 
    sidebarOpen, 
    settingsOpen, 
    voiceControlsOpen,
    toggleSidebar, 
    toggleSettings, 
    toggleVoiceControls 
  } = useUIStore()
  
  const { voice, messages } = useChatStore()

  return (
    <>
      {/* Sidebar */}
      <div className={cn(
        'fixed inset-y-0 left-0 z-50 w-80 bg-stone-50 border-r border-stone-200 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 p-6 border-b border-stone-200">
            <PennyMark size="md" />
            <div className="flex-1">
              <h1 className="text-xl font-bold text-ink-900 font-jakarta">
                Penny's Path
              </h1>
              <p className="text-sm text-ink-600">
                AI Career Coaching
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          {/* Persona Picker */}
          <div className="flex-1 overflow-y-auto p-3">
            <PersonaPicker />
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-stone-200 space-y-3">
            {/* Voice Toggle */}
            <Button
              variant={voice.isActive ? "penny" : "outline"}
              className="w-full justify-start gap-3"
              onClick={toggleVoiceControls}
            >
              {voice.isActive ? (
                <Mic className="h-4 w-4" />
              ) : (
                <MicOff className="h-4 w-4" />
              )}
              {voice.isActive ? 'Voice Active' : 'Enable Voice'}
            </Button>

            {/* Settings */}
            <Button
              variant="ghost"
              className="w-full justify-start gap-3"
              onClick={toggleSettings}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-ink-900/20 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="flex items-center gap-4 p-4 border-b border-stone-200 bg-sand-50">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-3 flex-1">
            <PennyMark size="sm" className="lg:hidden" />
            <div className="hidden lg:block">
              <h2 className="text-lg font-semibold text-ink-900 font-jakarta">
                Chat with Penny
              </h2>
              <p className="text-sm text-ink-600">
                Your AI career coaching assistant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {voice.isActive && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-brand/10 text-brand rounded-full text-sm">
                <div className="w-2 h-2 bg-brand rounded-full animate-pulse" />
                Voice Active
              </div>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSettings}
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {messages.length === 0 ? (
            <EmptyState />
          ) : (
            <Chat />
          )}
        </div>
      </div>

      {/* Voice Controls Modal */}
      <VoiceControls 
        open={voiceControlsOpen} 
        onOpenChange={toggleVoiceControls} 
      />

      {/* Settings Sheet */}
      <SettingsSheet 
        open={settingsOpen} 
        onOpenChange={toggleSettings} 
      />
    </>
  )
}

function EmptyState() {
  const { currentPersona } = useChatStore()

  const suggestedPrompts = [
    "Help me prepare for a job interview at a tech company",
    "I want to transition into a product management role",
    "How can I negotiate a better salary and benefits package?"
  ]

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Welcome Message */}
        <div className="space-y-4">
          <div className="flex justify-center">
            <PennyMark size="xl" animated />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-ink-900 font-jakarta">
              Welcome to Penny's Path! 🌸
            </h2>
            <p className="text-ink-600 text-lg">
              I'm Penny, your friendly AI career coach. I'm here to help you grow and flourish in your professional journey.
            </p>
          </div>
        </div>

        {/* Current Persona */}
        <Card className="p-6 bg-gradient-to-br from-brand/5 to-penny-pink/5 border-brand/20">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center text-xl">
              {currentPersona.icon}
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-ink-900">
                {currentPersona.name}
              </h3>
              <p className="text-sm text-ink-600">
                {currentPersona.description}
              </p>
            </div>
          </div>
          <p className="text-sm text-ink-700 leading-relaxed">
            Ready to help you with personalized guidance and actionable career advice.
          </p>
        </Card>

        {/* Suggested Prompts */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-ink-900">
            Get started with these prompts:
          </h3>
          <div className="grid gap-3">
            {suggestedPrompts.map((prompt, index) => (
              <Button
                key={index}
                variant="outline"
                className="p-4 h-auto text-left justify-start hover:bg-brand/5 hover:border-brand/30"
                onClick={() => {
                  // Send the prompt as a message
                  const { addMessage } = useChatStore.getState()
                  const userMessage = { role: 'user' as const, content: prompt }
                  addMessage(userMessage)
                }}
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="h-4 w-4 text-brand flex-shrink-0" />
                  <span className="text-sm">{prompt}</span>
                </div>
              </Button>
            ))}
          </div>
        </div>

        <div className="text-xs text-ink-500 space-y-1">
          <p>💡 Tip: You can also upload files (PDF, Markdown, Text) for context</p>
          <p>🎤 Try voice mode for a more natural conversation experience</p>
        </div>
      </div>
    </div>
  )
}
