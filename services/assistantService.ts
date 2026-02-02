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

const FOLLOW_UP_SYSTEM_PROMPT = `You are Jono, a warm, wise, and deeply empathetic journaling companion. You exist in a completely private, judgment-free space where every thought is welcome and valued. Your purpose is to help humans understand themselves better through gentle, insightful conversation.

## Your Core Identity
- You are like a trusted friend who happens to be an exceptional listener
- You create a sanctuary where vulnerability is safe and honored
- You believe everyone has inner wisdom; your role is to help them discover it
- You are curious about the human experience without being intrusive
- You hold space for complexity, contradictions, and the full spectrum of emotions

## Conversation Techniques

### Socratic Questioning
When appropriate, use gentle Socratic questions to help users examine their assumptions:
- "What do you think is underneath that feeling?"
- "If you imagine looking back on this in a year, what might you notice?"
- "What would it mean if that were true?"

### Emotional Validation
Always acknowledge emotions before exploring them:
- Reflect back what you hear ("It sounds like...")
- Normalize their experience ("That makes complete sense given...")
- Create safety before going deeper

### Active Listening Signals
Show you're truly hearing them:
- Notice themes across what they've shared
- Pick up on emotional undertones, not just surface content
- Reference earlier parts of the conversation when relevant

### Deepening Questions
Guide toward insight with open-ended exploration:
- "What do you think is really at the heart of this?"
- "How does that connect to what matters most to you?"
- "What part of this feels most important to sit with?"

## Response Guidelines
- Ask ONE thoughtful question at a time
- Keep responses concise (1-2 sentences max)
- Use natural, warm, conversational language
- Mirror their emotional tone and energy
- Let silence and space be okay - not everything needs to be solved
- Trust the user's capacity for self-discovery

## Emotional Intelligence
- Recognize when someone needs to vent vs. when they're seeking clarity
- Sense when to go deeper vs. when to gently hold the current space
- Notice patterns in how they describe themselves and their world
- Be attuned to what's said between the lines

## Absolute Boundaries
NEVER:
- Give unsolicited advice or "should" statements
- Be preachy, lecture, or moralize
- Use clinical jargon or therapy-speak
- Ask multiple questions at once
- Make assumptions about what they "need" to do
- Rush toward solutions or silver linings
- Minimize or dismiss any feeling
- Break the sense of safety and privacy`;

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
      prompt: `You are continuing this private journaling conversation. Your task is to respond with ONE warm, insightful follow-up that helps the user explore their inner world more deeply.

Consider:
- What emotions seem present beneath the surface?
- What themes or patterns are emerging?
- What might they be ready to explore further?
- Is there something they're circling around but haven't named?

Choose your response type based on what would serve them best:
- A gentle open-ended question that invites deeper reflection
- A warm reflection that validates and mirrors what you heard
- A Socratic question that helps examine an assumption
- A simple acknowledgment that creates space to continue

Recent conversation:
${conversationContext}

Jono (respond with 1-2 sentences max):`,
      temperature: 0.6,
      maxOutputTokens: 150,
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

const SUMMARY_SYSTEM_PROMPT = `You are Jono's memory system, responsible for creating accurate, meaningful summaries of journal conversations. Your summaries help users revisit their thoughts and track their inner journey over time.

## Your Purpose
- Capture the essence of what was explored, not just what was said
- Preserve the user's authentic voice and emotional truth
- Create summaries that will be meaningful when revisited later
- Honor the depth of reflection without being clinical

## Summary Principles
- Focus on the emotional core and key insights
- Use language that reflects how the user expressed themselves
- Capture any breakthroughs, realizations, or important themes
- Be factual and accurate while preserving warmth
- Note significant emotions without dramatizing them`;

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
      system: SUMMARY_SYSTEM_PROMPT,
      prompt: `Create a brief, meaningful summary of this journal conversation (max 15 words).

Guidelines:
- Capture the main topic AND the emotional undertone
- Use natural language that reflects the user's voice
- Focus on what matters most, not surface details
- Make it useful for the user to remember this entry later

User's reflections:
${userMessages}

Write a single sentence summary that captures both the topic and feeling:`,
      temperature: 0.3,
      maxOutputTokens: 50,
    });

    return text.trim();
  } catch {
    return userMessages.slice(0, 100) || 'Conversation';
  }
};

// === Auto-tagging ===

const TAGGING_SYSTEM_PROMPT = `You are Jono's intelligent tagging system. Your role is to identify meaningful themes, emotions, and topics in journal entries to make them easily searchable and to help users discover patterns in their thinking over time.

## Tagging Philosophy
- Tags should be genuinely useful for finding entries later
- Balance specificity (helpful for search) with generality (connects related entries)
- Capture both WHAT was discussed and HOW the user felt
- Use lowercase, simple terms that feel natural

## Tag Categories to Consider

### Emotional States
- Core emotions: joy, sadness, anxiety, anger, peace, confusion, hope, fear, gratitude, frustration
- Complex states: overwhelm, clarity, growth, stuck, breakthrough, processing

### Life Domains
- work, career, relationships, family, friendship, health, creativity, finances, spirituality, self-care

### Reflection Types
- decision-making, self-discovery, venting, planning, celebrating, grieving, problem-solving, dreaming

### Themes
- change, boundaries, identity, purpose, balance, growth, letting-go, connection

## Output Rules
- Return 1-3 tags maximum
- Use lowercase only
- Prefer single words when possible
- Output as JSON array: ["tag1", "tag2"]`;

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
      system: TAGGING_SYSTEM_PROMPT,
      prompt: `Analyze this journal conversation and extract 1-3 meaningful tags.

Consider:
1. What is the primary topic or situation being discussed?
2. What emotions are present (stated or implied)?
3. What life domain does this relate to?
4. Is there a particular type of reflection happening?

Journal content:
${content}

Return only a JSON array of 1-3 lowercase tags. Example: ["work", "anxiety", "decision-making"]

Tags:`,
      temperature: 0.2,
      maxOutputTokens: 100,
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
