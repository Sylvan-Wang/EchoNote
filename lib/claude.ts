import Anthropic from '@anthropic-ai/sdk'
import {
  cleanPrompt,
  emotionPrompt,
  responsePrompt,
  memoryUpdatePrompt,
  type ResponsePromptParams,
  type MemoryUpdatePromptParams,
} from './prompts'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL = 'claude-haiku-4-5-20251001'

export async function cleanText(raw: string): Promise<string> {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: cleanPrompt(raw),
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude cleanText')
  }
  return content.text.trim()
}

export interface EmotionResult {
  primary_emotion: string
  secondary_emotion: string | null
  emotion_confidence: number
  keywords: string[]
}

export async function analyzeEmotion(cleaned: string): Promise<EmotionResult> {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: emotionPrompt(cleaned),
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude analyzeEmotion')
  }

  try {
    // Extract JSON from response (handle potential markdown code blocks)
    const text = content.text.trim()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found in emotion response')

    const parsed = JSON.parse(jsonMatch[0]) as EmotionResult
    return {
      primary_emotion: parsed.primary_emotion || '混乱',
      secondary_emotion: parsed.secondary_emotion || null,
      emotion_confidence: typeof parsed.emotion_confidence === 'number' ? parsed.emotion_confidence : 0.5,
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
    }
  } catch {
    return {
      primary_emotion: '混乱',
      secondary_emotion: null,
      emotion_confidence: 0.5,
      keywords: [],
    }
  }
}

export interface ResponseResult {
  understanding: string
  evidence: string
  suggestion: string
  suggestion_type: string
}

async function callGenerateResponse(params: ResponsePromptParams): Promise<ResponseResult | null> {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: responsePrompt(params),
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') return null

  try {
    const text = content.text.trim()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const parsed = JSON.parse(jsonMatch[0]) as ResponseResult
    if (!parsed.understanding || !parsed.evidence || !parsed.suggestion) return null

    return {
      understanding: parsed.understanding,
      evidence: parsed.evidence,
      suggestion: parsed.suggestion,
      suggestion_type: parsed.suggestion_type || 'reflect',
    }
  } catch {
    return null
  }
}

export async function generateResponse(params: ResponsePromptParams): Promise<ResponseResult> {
  const result = await callGenerateResponse(params)
  if (result) return result

  // Retry once if format was invalid
  const retry = await callGenerateResponse(params)
  if (retry) return retry

  // Fallback
  return {
    understanding: '我听到你说的了。',
    evidence: '你分享的这些，让我感受到你现在的状态。',
    suggestion: '可以先停下来，给自己几分钟休息。',
    suggestion_type: 'rest',
  }
}

export async function updateMemory(params: MemoryUpdatePromptParams): Promise<string> {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: memoryUpdatePrompt(params),
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') return params.old_summary

  return content.text.trim()
}
