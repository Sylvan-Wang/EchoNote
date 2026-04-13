import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// ---- Types ----

export interface User {
  id: number
  created_at: string
  updated_at: string
  nickname: string
  preferred_mode: string
  memory_summary: string
}

export interface Entry {
  id: number
  user_id: number
  created_at: string
  updated_at: string
  audio_url: string | null
  raw_transcript: string | null
  cleaned_text: string | null
  primary_emotion: string | null
  secondary_emotion: string | null
  emotion_confidence: number | null
  keywords_json: string | null
  ai_understanding: string | null
  ai_evidence: string | null
  ai_suggestion: string | null
  suggestion_type: string | null
  mode_used: string | null
  risk_level: string
  feedback_helpful: string
  suggestion_adopted: string
  saved: boolean
}

export interface SaveEntryData {
  user_id?: number
  audio_url?: string
  raw_transcript?: string
  cleaned_text?: string
  primary_emotion?: string
  secondary_emotion?: string
  emotion_confidence?: number
  keywords_json?: string
  ai_understanding?: string
  ai_evidence?: string
  ai_suggestion?: string
  suggestion_type?: string
  mode_used?: string
  risk_level?: string
  feedback_helpful?: string
  suggestion_adopted?: string
  saved?: boolean
}

// ---- User ----

export async function getUser(): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', 1)
    .single()

  if (error || !data) {
    // First run: create default user
    const { data: created, error: createError } = await supabase
      .from('users')
      .insert({ id: 1, nickname: '我', preferred_mode: 'accept', memory_summary: '' })
      .select()
      .single()
    if (createError) throw createError
    return created as User
  }

  return data as User
}

export async function updateMemory(summary: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ memory_summary: summary, updated_at: new Date().toISOString() })
    .eq('id', 1)
  if (error) throw error
}

export async function updateUser(fields: { preferred_mode?: string; nickname?: string }): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', 1)
    .select()
    .single()
  if (error) throw error
  return data as User
}

// ---- Entries ----

export async function saveEntry(data: SaveEntryData): Promise<number> {
  const { data: row, error } = await supabase
    .from('entries')
    .insert({
      user_id: data.user_id ?? 1,
      audio_url: data.audio_url ?? null,
      raw_transcript: data.raw_transcript ?? null,
      cleaned_text: data.cleaned_text ?? null,
      primary_emotion: data.primary_emotion ?? null,
      secondary_emotion: data.secondary_emotion ?? null,
      emotion_confidence: data.emotion_confidence ?? null,
      keywords_json: data.keywords_json ?? null,
      ai_understanding: data.ai_understanding ?? null,
      ai_evidence: data.ai_evidence ?? null,
      ai_suggestion: data.ai_suggestion ?? null,
      suggestion_type: data.suggestion_type ?? null,
      mode_used: data.mode_used ?? null,
      risk_level: data.risk_level ?? 'L1',
      feedback_helpful: data.feedback_helpful ?? 'unknown',
      suggestion_adopted: data.suggestion_adopted ?? 'unknown',
      saved: data.saved ?? true,
    })
    .select('id')
    .single()

  if (error) throw error
  return (row as { id: number }).id
}

export async function listEntries(limit = 20, offset = 0): Promise<Entry[]> {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('saved', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return (data ?? []) as Entry[]
}

export async function getEntry(id: number): Promise<Entry | null> {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data as Entry
}

export async function updateFeedback(id: number, helpful: string, adopted: string): Promise<void> {
  const { error } = await supabase
    .from('entries')
    .update({
      feedback_helpful: helpful,
      suggestion_adopted: adopted,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw error
}

// ---- Events ----

export async function logEvent(
  eventName: string,
  entryId?: number,
  payload?: Record<string, unknown>
): Promise<void> {
  await supabase.from('events').insert({
    user_id: 1,
    entry_id: entryId ?? null,
    event_name: eventName,
    event_payload: payload ? JSON.stringify(payload) : null,
  })
}

// ---- Audio Storage ----

export async function uploadAudio(buffer: Buffer, filename: string): Promise<string> {
  const { error } = await supabase.storage
    .from('audio')
    .upload(filename, buffer, { contentType: 'audio/webm', upsert: true })

  if (error) throw error

  const { data } = supabase.storage.from('audio').getPublicUrl(filename)
  return data.publicUrl
}
