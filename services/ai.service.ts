import { openai } from "../config/openai.config";

const model = process.env.OPENAI_MODEL || 'gpt-5-mini';

export const submitPrompt = async (prompt: string): Promise<string> => {
    // Mirrors your previous “single JSON response” flow
  let res: any
  try {
    res = await openai.responses.create({
      model,
      input: prompt,
      // temperature works the same idea; tune per need
      temperature: 0.7,
    });
  } catch (err: unknown) {
    // Surface HTTP-ish errors similarly to your current code
    const message =
      err && typeof err === 'object' && 'message' in err
        ? String((err as { message?: unknown }).message)
        : 'Unknown error';
    throw new Error(`[AI] OpenAI request failed: ${message}`);
  }

  // The Responses API returns a unified shape; text lives here:
  const text = res.output_text ?? '';
  if (!text) {
    throw new Error('[AI] No output_text returned from model');
  }
  return text;
}