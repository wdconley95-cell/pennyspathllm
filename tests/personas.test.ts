import { PERSONAS, getPersonaById, getPersonaColor, DEFAULT_PERSONA } from '../src/lib/personas'

describe('Personas', () => {
  test('should have 4 default personas', () => {
    expect(PERSONAS).toHaveLength(4)
  })

  test('should have all required persona properties', () => {
    PERSONAS.forEach(persona => {
      expect(persona).toHaveProperty('id')
      expect(persona).toHaveProperty('name')
      expect(persona).toHaveProperty('description')
      expect(persona).toHaveProperty('systemPrompt')
      expect(persona).toHaveProperty('temperature')
      expect(persona).toHaveProperty('maxTokens')
      expect(persona).toHaveProperty('color')
      expect(persona).toHaveProperty('icon')
      
      // Validate types
      expect(typeof persona.id).toBe('string')
      expect(typeof persona.name).toBe('string')
      expect(typeof persona.description).toBe('string')
      expect(typeof persona.systemPrompt).toBe('string')
      expect(typeof persona.temperature).toBe('number')
      expect(typeof persona.maxTokens).toBe('number')
      expect(typeof persona.color).toBe('string')
      expect(typeof persona.icon).toBe('string')
      
      // Validate ranges
      expect(persona.temperature).toBeGreaterThanOrEqual(0)
      expect(persona.temperature).toBeLessThanOrEqual(2)
      expect(persona.maxTokens).toBeGreaterThan(0)
      expect(persona.systemPrompt.length).toBeGreaterThan(100) // Substantial prompts
    })
  })

  test('should find persona by ID', () => {
    const persona = getPersonaById('supportive-coach')
    expect(persona).toBeDefined()
    expect(persona?.name).toBe('Supportive Coach')
  })

  test('should return undefined for invalid persona ID', () => {
    const persona = getPersonaById('invalid-id')
    expect(persona).toBeUndefined()
  })

  test('should return persona color', () => {
    const color = getPersonaColor('supportive-coach')
    expect(color).toBeTruthy()
    expect(typeof color).toBe('string')
  })

  test('should have valid default persona', () => {
    expect(DEFAULT_PERSONA).toBeDefined()
    expect(DEFAULT_PERSONA.id).toBe('supportive-coach')
  })

  test('should have unique persona IDs', () => {
    const ids = PERSONAS.map(p => p.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  test('should have Penny-themed system prompts', () => {
    PERSONAS.forEach(persona => {
      expect(persona.systemPrompt.toLowerCase()).toContain('penny')
    })
  })
})
