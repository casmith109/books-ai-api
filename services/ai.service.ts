import { openai } from "../config/openai.config.js";

export const submitPrompt = async (prompt: string): Promise<string> => {
  console.log('Submitting prompt to OpenAI', prompt);
  try {
    const res = await openai.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-5-mini',
      input: prompt,
      reasoning: {effort: 'low '},
      output_length: 500
    });
    console.log('Response from OpenAI', res);
    // The Responses API returns a unified shape; text lives here:
    const text = res.output_text ?? '';
    if (!text) {
      throw new Error('[AI] No output_text returned from model');
    }
    return text;
  } catch (err: unknown) {
    // Surface HTTP-ish errors similarly to your current code
    const message =
      err && typeof err === 'object' && 'message' in err
        ? String((err as { message?: unknown }).message)
        : 'Unknown error';
    throw new Error(`[AI] OpenAI request failed: ${message}`);
  }


}