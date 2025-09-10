'use client'

import React from 'react'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { cn } from '@/lib/utils'
import { PERSONAS, type Persona } from '@/lib/personas'
import { useChatStore } from '@/lib/store'

interface PersonaPickerProps {
  className?: string
}

export function PersonaPicker({ className }: PersonaPickerProps) {
  const { currentPersona, setCurrentPersona } = useChatStore()

  const handlePersonaSelect = (persona: Persona) => {
    setCurrentPersona(persona)
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="px-3">
        <h3 className="text-sm font-medium text-ink-700 mb-2">
          Choose Your Coach
        </h3>
        <p className="text-xs text-ink-500">
          Select a coaching style that matches your needs
        </p>
      </div>
      
      <div className="space-y-2">
        {PERSONAS.map((persona) => (
          <Card
            key={persona.id}
            className={cn(
              'cursor-pointer transition-all duration-200 hover:shadow-md border-2',
              currentPersona.id === persona.id
                ? 'border-brand bg-brand/5 shadow-sm'
                : 'border-stone-200 hover:border-stone-300',
              'group'
            )}
            onClick={() => handlePersonaSelect(persona)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-colors',
                    currentPersona.id === persona.id
                      ? 'bg-brand text-sand-50'
                      : 'bg-stone-100 text-ink-600 group-hover:bg-stone-200'
                  )}>
                    {persona.icon}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-ink-900 text-sm truncate">
                      {persona.name}
                    </h4>
                    {currentPersona.id === persona.id && (
                      <Badge variant="penny" className="text-xs">
                        Active
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-xs text-ink-600 leading-relaxed line-clamp-2">
                    {persona.description}
                  </p>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1 text-xs text-ink-500">
                      <span>🌡️</span>
                      <span>{persona.temperature}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-ink-500">
                      <span>📏</span>
                      <span>{persona.maxTokens}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="px-3 pt-2">
        <div className="text-xs text-ink-500 space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-penny-coral"></span>
            <span>Direct & decisive</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-penny-teal"></span>
            <span>Data-driven insights</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-penny-pink"></span>
            <span>Supportive & empathetic</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-stone-500"></span>
            <span>Compliance-focused</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PersonaPicker
