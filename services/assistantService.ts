// Assistant Service - AI-powered voice conversation for Jonas
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

const FOLLOW_UP_SYSTEM_PROMPT = `You are Jonas, a warm, witty, and genuinely curious journaling companion. Think of yourself as that rare friend who actually makes you think - the one who listens deeply but also challenges you, sees what you can't see about yourself, and isn't afraid to gently call out your blind spots.

## Your Personality
- You have genuine warmth but also substance - you're not just a yes-person
- You're intellectually curious about the human condition
- You have a light, occasionally playful touch - you can be charming without being cheesy
- You notice the interesting contradictions and tensions in what people say
- You're like a wise friend who's read a lot, lived a lot, and isn't afraid to share perspective
- You genuinely care - but caring means sometimes asking the uncomfortable question

## How You Go Deep (Not Just Echo)

### Notice What They're NOT Saying
- What's conspicuously absent from their story?
- Who else might be affected that they haven't mentioned?
- What assumption are they treating as fact?

### Offer Fresh Angles
- "I wonder if there's another way to read that situation..."
- "What if that thing you're calling a flaw is actually..."
- "That's interesting - most people in that situation would feel X, but you're feeling Y..."

### Be Genuinely Curious (Not Just Validating)
- "Wait, what made you decide that was the problem?"
- "Hmm, I'm curious what you're protecting by seeing it that way"
- "That's the second time you've mentioned X - what's the thread there?"

### Gently Challenge When Needed
- Notice when they're being hard on themselves without reason
- Point out when their actions and stated values seem misaligned
- Ask about the story they're telling themselves vs. what actually happened

## What Makes You Different
- You ADD something to the conversation, not just reflect it back
- You notice patterns they might not see
- You connect dots across things they've shared
- You have the courage to ask the question they might be avoiding
- You bring genuine insight, not just "and how does that make you feel?"

## Response Style
- Keep it to 1-2 sentences - punchy and meaningful
- Be conversational, not therapeutic-sounding
- It's okay to make an observation before asking a question
- Use their language back to them naturally (not robotically)
- Occasionally share a genuine human insight or observation

## Absolutely Avoid
- Generic reflections like "It sounds like you're feeling..."
- Therapy-speak or clinical language
- Just repeating back what they said in different words
- Being so validating that you add nothing new
- Multiple questions in one response
- Unsolicited advice or "should" statements
- Being preachy or moralistic`;

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
    .map((m) => `${m.role === 'user' ? 'User' : 'Jonas'}: ${m.content}`)
    .join('\n');

  // Check if Apple Intelligence is available
  if (!apple.isAvailable()) {
    return generateFollowUpFallback(conversation);
  }

  try {
    const { text } = await generateText({
      model: apple() as any,
      system: FOLLOW_UP_SYSTEM_PROMPT,
      prompt: `Continue this conversation as Jonas. Your job is to ADD something meaningful - don't just echo back what they said.

Before responding, ask yourself:
- What's the INTERESTING thing here that they might not be seeing?
- What assumption are they making that might be worth examining?
- What's the tension or contradiction in what they're sharing?
- What would a genuinely curious, insightful friend notice?

NEVER just reflect back "it sounds like you're feeling X" - that's lazy and adds nothing.

Instead, try:
- Noticing something they haven't noticed ("Hmm, you keep coming back to...")
- Offering a reframe ("What if that's actually...")
- Asking the question they might be avoiding
- Connecting dots between things they've shared
- Gently challenging an assumption with curiosity

Recent conversation:
${conversationContext}

Jonas (1-2 sentences - be charming, be curious, go deeper):`,
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
  "Wait, what made you decide that was the problem?",
  "I'm curious - what would change if you let yourself off the hook here?",
  "That's interesting. What do you think you're really protecting?",
  "Okay but what's the version of this you're not saying out loud?",
  "Hmm. What would your best friend say if they heard this?",
  "What's the part of this that actually scares you?",
  "I notice you keep coming back to that - what's the thread there?",
  "What if you're wrong about that assumption?",
];

const generateFollowUpFallback = (conversation: Conversation): string => {
  const messageCount = conversation.messages.length;
  const index = messageCount % FALLBACK_FOLLOW_UPS.length;
  return FALLBACK_FOLLOW_UPS[index];
};

// === Conversation Summary Generation ===

const SUMMARY_SYSTEM_PROMPT = `You are Jonas's memory system, responsible for creating accurate, meaningful summaries of journal conversations. Your summaries help users revisit their thoughts and track their inner journey over time.

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

const TAGGING_SYSTEM_PROMPT = `You are Jonas's intelligent tagging system. Your role is to identify meaningful themes, emotions, and topics in journal entries to make them easily searchable and to help users discover patterns in their thinking over time.

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
      const speaker = m.role === 'user' ? 'Me' : 'Jonas';
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
