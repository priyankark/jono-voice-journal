// Audio Overview Service - Generates audio-optimized scripts from insights and orchestrates TTS playback
import { apple } from '@react-native-ai/apple';
import { generateText } from 'ai';
import { speak, stopSpeaking, isSpeakingNow } from './assistantService';
import { PersonalInsight } from '../types';

let isCurrentlyPlaying = false;

const AUDIO_SCRIPT_SYSTEM_PROMPT = `You are a warm, friendly voice creating a brief audio summary of personal insights for someone's journaling app.

## Your Role
Create a conversational narrative that sounds natural when spoken aloud. The listener just generated insights from their journal entries and wants to hear a summary.

## Guidelines
- Use short, simple sentences (10-15 words max per sentence)
- Add natural transitions: "First...", "Also...", "What's interesting is..."
- Speak directly to the listener using "you" and "your"
- Keep the tone warm but not overly enthusiastic
- Total length: 3-5 sentences per insight, plus brief intro and close
- Avoid complex vocabulary or jargon
- No bullet points or lists - this must flow as natural speech

## Structure
1. Brief opening (1 sentence acknowledging they've been journaling)
2. 2-4 insight summaries (prioritize most meaningful)
3. Encouraging close (1 sentence, not cheesy)`;

export const generateAudioScript = async (
  insights: PersonalInsight[]
): Promise<string> => {
  if (insights.length === 0) {
    return "You haven't generated any insights yet. Once you have some, I'll be happy to summarize them for you.";
  }

  // Format insights for the prompt
  const insightsText = insights
    .slice(0, 4) // Limit to 4 insights for audio
    .map((insight, i) => `Insight ${i + 1} (${insight.type}): ${insight.title}\n${insight.description}`)
    .join('\n\n');

  // Check if Apple Intelligence is available
  if (!apple.isAvailable()) {
    return generateFallbackScript(insights);
  }

  try {
    const { text } = await generateText({
      model: apple() as any,
      system: AUDIO_SCRIPT_SYSTEM_PROMPT,
      prompt: `Create a spoken summary of these personal insights. Make it sound natural and conversational, as if a friend is gently sharing what they noticed.

INSIGHTS:
${insightsText}

Remember:
- Short sentences only
- Warm but not cheesy
- Natural spoken flow
- 30-60 seconds when read aloud`,
      temperature: 0.5,
      maxOutputTokens: 400,
    });

    return text.trim();
  } catch (error) {
    console.error('Failed to generate audio script:', error);
    return generateFallbackScript(insights);
  }
};

const generateFallbackScript = (insights: PersonalInsight[]): string => {
  const count = insights.length;
  const firstInsight = insights[0];

  let script = `I found ${count} insight${count > 1 ? 's' : ''} from your recent journaling. `;

  if (firstInsight) {
    script += `Here's one that stood out: ${firstInsight.title}. ${firstInsight.description.split('.')[0]}. `;
  }

  if (count > 1) {
    script += `There's more to explore when you're ready. `;
  }

  script += `Keep reflecting. You're doing meaningful work.`;

  return script;
};

export const playAudioOverview = async (
  insights: PersonalInsight[],
  onStart?: () => void,
  onComplete?: () => void,
  onError?: (error: string) => void
): Promise<void> => {
  if (isCurrentlyPlaying) {
    return;
  }

  try {
    isCurrentlyPlaying = true;
    onStart?.();

    const script = await generateAudioScript(insights);

    await speak(script, () => {
      isCurrentlyPlaying = false;
      onComplete?.();
    });
  } catch (error) {
    isCurrentlyPlaying = false;
    const errorMessage = error instanceof Error ? error.message : 'Failed to play audio overview';
    console.error('Audio overview playback failed:', error);
    onError?.(errorMessage);
  }
};

export const stopAudioOverview = (): void => {
  if (isCurrentlyPlaying) {
    stopSpeaking();
    isCurrentlyPlaying = false;
  }
};

export const isPlaying = (): boolean => isCurrentlyPlaying;
