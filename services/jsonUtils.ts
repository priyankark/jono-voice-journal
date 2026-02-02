// JSON Utilities - Safe parsing for AI-generated JSON responses
// Handles common LLM output formats like markdown code blocks and extra text

/**
 * Safely extracts and parses JSON from AI response text that might have:
 * - Markdown code blocks (```json ... ```)
 * - Extra explanatory text before/after JSON
 * - Partial or malformed responses
 *
 * @param text - The raw text from AI response
 * @param fallback - Default value to return if parsing fails
 * @returns Parsed JSON or fallback value
 */
export const safeParseJSON = <T>(text: string, fallback: T): T => {
  try {
    // First try direct parse
    return JSON.parse(text);
  } catch {
    // Try to extract JSON from the text (handles markdown code blocks, extra text, etc.)
    const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        console.error('Failed to parse extracted JSON:', jsonMatch[0].slice(0, 100));
      }
    }
    console.error('No valid JSON found in response:', text.slice(0, 200));
    return fallback;
  }
};
