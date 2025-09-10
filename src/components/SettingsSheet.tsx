'use client'

import React, { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { useChatStore } from '@/lib/store'
import { AVAILABLE_MODELS, DEFAULT_SETTINGS } from '@/lib/personas'
import { cn } from '@/lib/utils'
import { 
  X, 
  Settings, 
  Sliders, 
  Brain, 
  RotateCcw,
  Save,
  Trash2,
  Download,
  Upload
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface SettingsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsSheet({ open, onOpenChange }: SettingsSheetProps) {
  const { 
    currentPersona, 
    personaSettings, 
    messages,
    updatePersonaSettings,
    clearMessages
  } = useChatStore()

  const [localSettings, setLocalSettings] = useState(personaSettings)
  const [customPrompt, setCustomPrompt] = useState('')
  const [hasChanges, setHasChanges] = useState(false)

  React.useEffect(() => {
    setLocalSettings(personaSettings)
    setCustomPrompt(personaSettings.customSystemPrompt || '')
  }, [personaSettings, open])

  const handleSettingChange = (key: keyof typeof localSettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleSave = () => {
    updatePersonaSettings({
      ...localSettings,
      customSystemPrompt: customPrompt || undefined
    })
    setHasChanges(false)
  }

  const handleReset = () => {
    const resetSettings = {
      ...DEFAULT_SETTINGS,
      temperature: currentPersona.temperature,
      maxTokens: currentPersona.maxTokens
    }
    setLocalSettings(resetSettings)
    setCustomPrompt('')
    updatePersonaSettings(resetSettings)
    setHasChanges(false)
  }

  const exportChat = () => {
    const chatData = {
      persona: currentPersona,
      settings: personaSettings,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
      })),
      exportedAt: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(chatData, null, 2)], { 
      type: 'application/json' 
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pennys-path-chat-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const exportMarkdown = () => {
    const markdown = [
      `# Penny's Path Chat Export`,
      `**Date:** ${new Date().toLocaleDateString()}`,
      `**Persona:** ${currentPersona.name}`,
      `**Model:** ${personaSettings.model}`,
      '',
      '---',
      '',
      ...messages.map(msg => {
        const role = msg.role === 'user' ? '👤 **You**' : '🐷 **Penny**'
        const timestamp = new Date(msg.timestamp).toLocaleTimeString()
        return [
          `## ${role} (${timestamp})`,
          '',
          msg.content,
          ''
        ].join('\n')
      })
    ].join('\n')

    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pennys-path-chat-${new Date().toISOString().split('T')[0]}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-ink-900/20 flex items-center justify-end">
      <motion.div
        initial={{ opacity: 0, x: 400 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 400 }}
        className="h-full w-full max-w-md bg-white border-l border-stone-200 overflow-y-auto"
      >
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-ink-600" />
              <h2 className="text-lg font-semibold text-ink-900">
                Settings
              </h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Current Persona Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="text-lg">{currentPersona.icon}</span>
                {currentPersona.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-ink-600 mb-3">
                {currentPersona.description}
              </p>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-xs">
                  Temp: {currentPersona.temperature}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Tokens: {currentPersona.maxTokens}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Model Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Model Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Model Selection */}
              <div>
                <label className="text-sm font-medium text-ink-700 mb-2 block">
                  AI Model
                </label>
                <select
                  value={localSettings.model}
                  onChange={(e) => handleSettingChange('model', e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded-lg text-sm"
                >
                  {AVAILABLE_MODELS.map(model => (
                    <option key={model.id} value={model.id}>
                      {model.name} - {model.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Temperature */}
              <div>
                <label className="text-sm font-medium text-ink-700 mb-2 block">
                  Temperature: {localSettings.temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={localSettings.temperature}
                  onChange={(e) => handleSettingChange('temperature', parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-ink-500 mt-1">
                  <span>Focused</span>
                  <span>Balanced</span>
                  <span>Creative</span>
                </div>
              </div>

              {/* Max Tokens */}
              <div>
                <label className="text-sm font-medium text-ink-700 mb-2 block">
                  Max Response Length
                </label>
                <Input
                  type="number"
                  min="100"
                  max="4000"
                  step="100"
                  value={localSettings.maxTokens}
                  onChange={(e) => handleSettingChange('maxTokens', parseInt(e.target.value))}
                  className="text-sm"
                />
                <p className="text-xs text-ink-500 mt-1">
                  Higher values allow longer responses (100-4000 tokens)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Custom System Prompt */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sliders className="h-4 w-4" />
                Custom Instructions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <label className="text-sm font-medium text-ink-700 block">
                  Additional Instructions (Optional)
                </label>
                <Textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Add custom instructions to modify this persona's behavior for this session..."
                  className="min-h-[100px] text-sm"
                />
                <p className="text-xs text-ink-500">
                  These instructions will be added to the persona's system prompt for this conversation.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Chat Management */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Chat Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportChat}
                  disabled={messages.length === 0}
                  className="text-xs"
                >
                  <Download className="h-3 w-3 mr-1" />
                  JSON
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportMarkdown}
                  disabled={messages.length === 0}
                  className="text-xs"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Markdown
                </Button>
              </div>
              
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (confirm('Are you sure you want to clear all messages? This action cannot be undone.')) {
                    clearMessages()
                  }
                }}
                disabled={messages.length === 0}
                className="w-full text-xs"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear Chat History
              </Button>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-stone-200">
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex-1"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button
              variant="penny"
              onClick={handleSave}
              disabled={!hasChanges}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>

          {/* Info */}
          <div className="text-xs text-ink-500 space-y-1 pt-4 border-t border-stone-200">
            <p>💡 Settings are saved per session</p>
            <p>🎭 Switch personas to reset to defaults</p>
            <p>📁 Export chats to save your conversations</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default SettingsSheet
