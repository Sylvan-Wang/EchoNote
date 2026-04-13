import OpenAI from 'openai'
import { Readable } from 'stream'
import { toFile } from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function transcribeAudio(audioBuffer: Buffer, filename: string): Promise<string> {
  const readable = Readable.from(audioBuffer)
  const file = await toFile(readable, filename, { type: 'audio/webm' })

  const transcription = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    language: 'zh',
  })

  return transcription.text
}
