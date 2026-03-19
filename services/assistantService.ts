// Assistant Service - Pure AI conversation
import * as Speech from 'expo-speech';
import { apple } from '@react-native-ai/apple';
import { generateText } from 'ai';
import { Conversation } from '../types';
import { getWarmGreeting, getTimeBasedGreeting } from '../constants/theme';
import { safeParseJSON } from './jsonUtils';

// === TTS ===

let isSpeaking = false;

export const speak = async (text: string, onDone?: () => void): Promise<void> => {
  return new Promise((resolve, reject) => {
    isSpeaking = true;
    Speech.speak(text, {
      language: 'en-US',
      pitch: 1.0,
      rate: 0.9,
      onDone: () => {
        isSpeaking = false;
        onDone?.();
        resolve();
      },
      onError: (error) => {
        isSpeaking = false;
        reject(error);
      },
      onStopped: () => {
        isSpeaking = false;
        resolve();
      },
    });
  });
};

export const stopSpeaking = (): void => {
  if (isSpeaking) {
    Speech.stop();
    isSpeaking = false;
  }
};

export const isSpeakingNow = (): boolean => isSpeaking;

// === Greeting ===

export const getGreeting = (): string => {
  const timeGreeting = getTimeBasedGreeting();
  const warmPrompt = getWarmGreeting();
  return `${timeGreeting}. ${warmPrompt}`;
};

// === AI Response ===

const SYSTEM_PROMPT = `You are Jono, a warm and curious companion helping someone reflect on their thoughts and feelings.

Your role:
- Listen deeply and ask thoughtful questions that help them explore further
- Notice patterns, contradictions, or things left unsaid
- Be genuine and conversational, not clinical
- Keep responses to 1-2 sentences
- Move the conversation forward - don't repeat the same point`;

export const generateFollowUp = async (conversation: Conversation): Promise<string> => {
  if (conversation.messages.length === 0) {
    return getGreeting();
  }

  if (!apple.isAvailable()) {
    // Graceful fallback with helpful messaging
    return generateFollowUpFallback(conversation);
  }

  const messages = conversation.messages
    .map((m) => ({ role: m.role, content: m.content }));

  try {
    const { text } = await generateText({
      model: apple() as any,
      system: SYSTEM_PROMPT,
      messages,
      temperature: 0.7,
      maxOutputTokens: 150,
    });

    if (!text?.trim()) {
      return generateFollowUpFallback(conversation);
    }
    return text.trim();
  } catch (error: any) {
    console.error('AI generation failed:', error);
    return generateFollowUpFallback(conversation);
  }
};

// Fallback responses when Apple Intelligence is not available
const generateFollowUpFallback = (conversation: Conversation): string => {
  const userMessages = conversation.messages.filter((m) => m.role === 'user');
  const messageCount = userMessages.length;

  // Early conversation - opening prompts
  if (messageCount <= 1) {
    const earlyPrompts = [
      "Tell me more about that.",
      "What else comes to mind?",
      "Go on...",
    ];
    return earlyPrompts[messageCount % earlyPrompts.length];
  }

  // Mid conversation - deeper prompts
  if (messageCount <= 3) {
    const midPrompts = [
      "How does that make you feel?",
      "What do you think led to that?",
      "Is there more to this?",
    ];
    return midPrompts[messageCount % midPrompts.length];
  }

  // Longer conversation - reflective prompts
  const latePrompts = [
    "What stands out most from everything you've shared?",
    "If you had to sum this up, what would you say?",
    "What's the heart of this for you?",
  ];
  return latePrompts[messageCount % latePrompts.length];
};

// === Summary & Tags ===

export const generateConversationSummary = async (conversation: Conversation): Promise<string> => {
  if (conversation.messages.length === 0) return 'Empty conversation';

  const content = conversation.messages
    .filter((m) => m.role === 'user')
    .map((m) => m.content)
    .join(' ');

  if (!apple.isAvailable()) return content.slice(0, 100) || 'Conversation';

  try {
    const { text } = await generateText({
      model: apple() as any,
      system: 'Summarize in one short sentence (max 15 words).',
      prompt: content,
      temperature: 0.3,
      maxOutputTokens: 50,
    });
    return text.trim() || content.slice(0, 100);
  } catch {
    return content.slice(0, 100) || 'Conversation';
  }
};

export const generateTags = async (conversation: Conversation): Promise<string[]> => {
  const content = conversation.messages.map((m) => m.content).join(' ');

  if (!apple.isAvailable()) return [];

  try {
    const { text } = await generateText({
      model: apple() as any,
      system: 'Extract 1-3 topic tags. Output only JSON array like ["tag1", "tag2"].',
      prompt: content,
      temperature: 0.2,
      maxOutputTokens: 50,
    });
    const tags = safeParseJSON<string[]>(text, []);
    return Array.isArray(tags) ? tags.slice(0, 3) : [];
  } catch {
    return [];
  }
};

// === Helpers ===

export const synthesizeToEntry = async (conversation: Conversation) => {
  const tags = await generateTags(conversation);
  const summary = await generateConversationSummary(conversation);
  const textNotes = conversation.messages
    .map((m) => `**${m.role === 'user' ? 'Me' : 'Jono'}:** ${m.content}`)
    .join('\n\n');

  return { textNotes, summary, tags };
};

export const isConversationSubstantial = (conversation: Conversation): boolean => {
  const userMessages = conversation.messages.filter((m) => m.role === 'user');
  return userMessages.length >= 2;
};

export const getReflectionPrompt = (): string => {
  const prompts = [
    "What are you grateful for today?",
    "What's been on your mind lately?",
    "How are you really feeling right now?",
  ];
  return prompts[Math.floor(Math.random() * prompts.length)];
};
