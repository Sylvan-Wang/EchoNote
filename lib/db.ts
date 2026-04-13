import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'

// Ensure data directories exist
fs.mkdirSync('./data/audio', { recursive: true })

const DB_PATH = './data/echonote.db'

const db = new Database(DB_PATH)

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    nickname TEXT NOT NULL DEFAULT '我',
    preferred_mode TEXT NOT NULL DEFAULT 'accept',
    memory_summary TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    audio_url TEXT,
    raw_transcript TEXT,
    cleaned_text TEXT,
    primary_emotion TEXT,
    secondary_emotion TEXT,
    emotion_confidence REAL,
    keywords_json TEXT,
    ai_understanding TEXT,
    ai_evidence TEXT,
    ai_suggestion TEXT,
    suggestion_type TEXT,
    mode_used TEXT,
    risk_level TEXT NOT NULL DEFAULT 'L1',
    feedback_helpful TEXT NOT NULL DEFAULT 'unknown',
    suggestion_adopted TEXT NOT NULL DEFAULT 'unknown',
    saved INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL DEFAULT 1,
    entry_id INTEGER,
    event_name TEXT NOT NULL,
    event_payload TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`)

// Insert default user if not exists
const existingUser = db.prepare('SELECT id FROM users WHERE id = 1').get()
if (!existingUser) {
  db.prepare(`
    INSERT INTO users (id, created_at, updated_at, nickname, preferred_mode, memory_summary)
    VALUES (1, datetime('now'), datetime('now'), '我', 'accept', '')
  `).run()
}

// ---- Helper types ----

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
  saved: number
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
  saved?: number
}

// ---- Helper functions ----

export function getUser(): User {
  return db.prepare('SELECT * FROM users WHERE id = 1').get() as User
}

export function updateMemory(summary: string): void {
  db.prepare(`
    UPDATE users SET memory_summary = ?, updated_at = datetime('now') WHERE id = 1
  `).run(summary)
}

export function saveEntry(data: SaveEntryData): number {
  const result = db.prepare(`
    INSERT INTO entries (
      user_id, audio_url, raw_transcript, cleaned_text,
      primary_emotion, secondary_emotion, emotion_confidence, keywords_json,
      ai_understanding, ai_evidence, ai_suggestion, suggestion_type,
      mode_used, risk_level, feedback_helpful, suggestion_adopted, saved,
      created_at, updated_at
    ) VALUES (
      @user_id, @audio_url, @raw_transcript, @cleaned_text,
      @primary_emotion, @secondary_emotion, @emotion_confidence, @keywords_json,
      @ai_understanding, @ai_evidence, @ai_suggestion, @suggestion_type,
      @mode_used, @risk_level, @feedback_helpful, @suggestion_adopted, @saved,
      datetime('now'), datetime('now')
    )
  `).run({
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
    saved: data.saved ?? 0,
  })
  return result.lastInsertRowid as number
}

export function listEntries(limit = 20, offset = 0): Entry[] {
  return db.prepare(`
    SELECT * FROM entries WHERE saved = 1
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset) as Entry[]
}

export function getEntry(id: number): Entry | undefined {
  return db.prepare('SELECT * FROM entries WHERE id = ?').get(id) as Entry | undefined
}

export function updateFeedback(id: number, helpful: string, adopted: string): void {
  db.prepare(`
    UPDATE entries SET feedback_helpful = ?, suggestion_adopted = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(helpful, adopted, id)
}

export function logEvent(eventName: string, entryId?: number, payload?: Record<string, unknown>): void {
  db.prepare(`
    INSERT INTO events (user_id, entry_id, event_name, event_payload, created_at)
    VALUES (1, ?, ?, ?, datetime('now'))
  `).run(
    entryId ?? null,
    eventName,
    payload ? JSON.stringify(payload) : null
  )
}

export { db }
