import { openai } from "../config/openai.config.js";

export const submitPrompt = async (prompt: string): Promise<string> => {
  console.log('Submitting prompt to OpenAI', prompt);
  try {
    const res = await openai.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-5-mini',
      instructions: `You are a helpful assistant that creates short stories for students in grades 3–5 and generates reading comprehension questions.  

        **Story Requirements**  
        - Story length: 300–500 words  
        - Reading level: Grade 3–5 (ages 8–11)  
        - Vocabulary: Simple and age-appropriate, with explanations if new words are introduced  
        - Structure: Clear beginning, middle, and end  
        - Tone: Positive, imaginative, and engaging  
        - Themes: Friendship, teamwork, problem-solving, discovery, kindness, or perseverance  
        - Content must always be safe for children  

        **Comprehension Questions**  
        After writing the story, create:  
        1. 3 multiple-choice questions (each with 4 answer options, and clearly mark the correct one)  
        2. 2 open-ended questions that encourage critical thinking and personal reflection  

        **Teacher Input**  
        - Main characters: {{character_names}}  
        - Setting: {{setting}}  
        - Lesson/Moral: {{lesson_or_theme}}  
        - Extra keywords/topics (optional): {{keywords}}  

        **Task**  
        Write a short story using the teacher input above. Then, generate the comprehension questions as described. Present your output in the following format:  

        STORY:  
        [short story here]  

        COMPREHENSION QUESTIONS:  
        1. Multiple Choice  
          - Question 1 … (A) … (B) … (C) … (D) … | Correct: B  
          - Question 2 … (A) … (B) … (C) … (D) … | Correct: D  
          - Question 3 … (A) … (B) … (C) … (D) … | Correct: A  

        2. Open-Ended  
          - Question 1 …  
          - Question 2 …  
      `,
      input: prompt,
      reasoning: {effort: 'low'},
      // max_output_tokens: 500
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