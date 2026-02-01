// Assistant Service - AI-powered voice conversation for Jono
import * as Speech from 'expo-speech';
import { apple } from '@react-native-ai/apple';
import { generateText } from 'ai';
import { Conversation, ConversationMessage, JournalEntry } from '../types';
import { getWarmGreeting, getTimeBasedGreeting } from '../constants/theme';
import * as Crypto from 'expo-crypto';

// === TTS (Text-to-Speech) Functions ===

let isSpeaking = false;

export const speak = async (text: string, onDone?: () => void): Promise<void> => {
  return new Promise((resolve, reject) => {
    isSpeaking = true;
    Speech.speak(text, {
      language: 'en-US',
      pitch: 1.0,
      rate: 0.9, // Slightly slower for a calm feel
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

// === Greeting Functions ===

export const getGreeting = (): string => {
  const timeGreeting = getTimeBasedGreeting();
  const warmPrompt = getWarmGreeting();
  return `${timeGreeting}. ${warmPrompt}`;
};

// === AI Follow-up Generation ===

const FOLLOW_UP_SYSTEM_PROMPT = `You are Jono, a warm and empathetic journaling companion. Your role is to help users explore their thoughts and feelings through gentle, thoughtful conversation.

Guidelines:
- Be warm, supportive, and non-judgmental
- Ask one follow-up question at a time
- Focus on helping users dig deeper into their thoughts
- Use natural, conversational language
- Keep responses concise (1-2 sentences max)
- Avoid giving advice unless directly asked
- Mirror the user's emotional tone
- Help users find clarity through reflection

Do NOT:
- Be preachy or lecture the user
- Give unsolicited advice
- Use clinical or therapy-speak
- Be overly formal or stiff
- Ask multiple questions at once`;

export const generateFollowUp = async (
  conversation: Conversation
): Promise<string> => {
  // If no messages yet, return initial greeting
  if (conversation.messages.length === 0) {
    return getGreeting();
  }

  // Build conversation context
  const recentMessages = conversation.messages.slice(-6); // Last 6 messages for context
  const conversationContext = recentMessages
    .map((m) => `${m.role === 'user' ? 'User' : 'Jono'}: ${m.content}`)
    .join('\n');

  // Check if Apple Intelligence is available
  if (!apple.isAvailable()) {
    return generateFollowUpFallback(conversation);
  }

  try {
    const { text } = await generateText({
      model: apple() as any,
      system: FOLLOW_UP_SYSTEM_PROMPT,
      prompt: `Continue this conversation naturally. Respond with a single, warm follow-up question or reflection that helps the user explore their thoughts deeper.

${conversationContext}

Jono:`,
      temperature: 0.7,
      maxTokens: 150,
    });

    return text.trim();
  } catch (error) {
    console.error('AI follow-up generation failed:', error);
    return generateFollowUpFallback(conversation);
  }
};

// Fallback follow-up questions when AI is unavailable
const FALLBACK_FOLLOW_UPS = [
  "Tell me more about that.",
  "How does that make you feel?",
  "What else comes to mind when you think about this?",
  "That sounds meaningful. What stands out most to you?",
  "I hear you. What do you think is at the heart of this?",
  "Is there more you'd like to explore there?",
  "What would you like to happen next?",
  "How long have you been thinking about this?",
];

const generateFollowUpFallback = (conversation: Conversation): string => {
  const messageCount = conversation.messages.length;
  const index = messageCount % FALLBACK_FOLLOW_UPS.length;
  return FALLBACK_FOLLOW_UPS[index];
};

// === Conversation Summary Generation ===

export const generateConversationSummary = async (
  conversation: Conversation
): Promise<string> => {
  if (conversation.messages.length === 0) {
    return 'Empty conversation';
  }

  const userMessages = conversation.messages
    .filter((m) => m.role === 'user')
    .map((m) => m.content)
    .join(' ');

  if (!apple.isAvailable()) {
    // Simple fallback: first 100 chars of first user message
    return userMessages.slice(0, 100) || 'Conversation';
  }

  try {
    const { text } = await generateText({
      model: apple() as any,
      prompt: `Summarize this journal conversation in 1 brief sentence (max 15 words). Focus on the main topic or emotion discussed.

User's thoughts:
${userMessages}

Summary:`,
      temperature: 0.3,
      maxTokens: 50,
    });

    return text.trim();
  } catch {
    return userMessages.slice(0, 100) || 'Conversation';
  }
};

// === Auto-tagging ===

export const generateTags = async (
  conversation: Conversation
): Promise<string[]> => {
  const content = conversation.messages
    .map((m) => m.content)
    .join(' ');

  if (!apple.isAvailable()) {
    return generateTagsFallback(content);
  }

  try {
    const { text } = await generateText({
      model: apple() as any,
      prompt: `Extract 1-3 relevant tags from this journal conversation. Tags should be single words or short phrases. Return as JSON array.

Conversation:
${content}

Tags (JSON array):`,
      temperature: 0.3,
      maxTokens: 100,
    });

    const tags = JSON.parse(text);
    return Array.isArray(tags) ? tags.slice(0, 3) : [];
  } catch {
    return generateTagsFallback(content);
  }
};

const COMMON_THEMES = [
  { keywords: ['work', 'job', 'career', 'boss', 'meeting'], tag: 'work' },
  { keywords: ['family', 'mom', 'dad', 'parent', 'kid', 'child'], tag: 'family' },
  { keywords: ['friend', 'friendship', 'social'], tag: 'relationships' },
  { keywords: ['stress', 'anxious', 'worry', 'overwhelm'], tag: 'stress' },
  { keywords: ['happy', 'joy', 'excited', 'grateful'], tag: 'gratitude' },
  { keywords: ['goal', 'dream', 'plan', 'future', 'aspire'], tag: 'goals' },
  { keywords: ['health', 'exercise', 'sleep', 'energy'], tag: 'health' },
  { keywords: ['creative', 'idea', 'project', 'create'], tag: 'creativity' },
];

const generateTagsFallback = (content: string): string[] => {
  const lowerContent = content.toLowerCase();
  const tags: string[] = [];

  COMMON_THEMES.forEach(({ keywords, tag }) => {
    if (keywords.some((kw) => lowerContent.includes(kw))) {
      tags.push(tag);
    }
  });

  return tags.slice(0, 3);
};

// === Conversation to Entry Synthesis ===

export const synthesizeToEntry = async (
  conversation: Conversation
): Promise<{
  textNotes: string;
  summary: string;
  tags: string[];
}> => {
  const tags = await generateTags(conversation);
  const summary = await generateConversationSummary(conversation);

  // Create a readable format of the conversation
  const textNotes = conversation.messages
    .map((m) => {
      const speaker = m.role === 'user' ? 'Me' : 'Jono';
      return `**${speaker}:** ${m.content}`;
    })
    .join('\n\n');

  return {
    textNotes,
    summary,
    tags,
  };
};

// === Reflection Prompts ===

const REFLECTION_PROMPTS = [
  "What are you grateful for today?",
  "What's been weighing on your mind lately?",
  "What small win can you celebrate today?",
  "How are you really feeling right now?",
  "What would make today feel complete?",
  "What's something you've been avoiding thinking about?",
  "Who made a difference in your day?",
  "What did you learn about yourself recently?",
  "What's giving you energy right now?",
  "What's draining your energy right now?",
];

export const getReflectionPrompt = (): string => {
  const index = Math.floor(Math.random() * REFLECTION_PROMPTS.length);
  return REFLECTION_PROMPTS[index];
};

// === Conversation Analysis ===

export const isConversationSubstantial = (conversation: Conversation): boolean => {
  // A conversation is "substantial" if it has at least 2 user messages
  // or total content exceeds 100 characters
  const userMessages = conversation.messages.filter((m) => m.role === 'user');
  const totalContent = conversation.messages
    .map((m) => m.content)
    .join('')
    .length;

  return userMessages.length >= 2 || totalContent > 100;
};
