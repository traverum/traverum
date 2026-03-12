import OpenAI from 'openai'

let _openai: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return _openai
}

export interface TranslatedContent {
  title: string
  description: string
  meetingPoint: string | null
}

export async function translateExperienceContent(
  title: string,
  description: string,
  meetingPoint: string | null,
  targetLanguage: string,
): Promise<TranslatedContent> {
  const fields: Record<string, string> = { title, description }
  if (meetingPoint) fields.meetingPoint = meetingPoint

  const response = await getOpenAIClient().chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.3,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are a professional translator for a travel and experiences platform. Translate the provided JSON values into ${targetLanguage}. Keep proper nouns, place names, brand names, and formatting (markdown, line breaks) unchanged. Return a JSON object with the same keys and translated values.`,
      },
      {
        role: 'user',
        content: JSON.stringify(fields),
      },
    ],
  })

  const text = response.choices[0]?.message?.content
  if (!text) throw new Error('Empty response from translation API')

  const parsed = JSON.parse(text)
  return {
    title: parsed.title ?? title,
    description: parsed.description ?? description,
    meetingPoint: meetingPoint ? (parsed.meetingPoint ?? meetingPoint) : null,
  }
}
