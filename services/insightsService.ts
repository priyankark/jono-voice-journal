// Insights Service - AI-powered personal insights and reflection prompts
import { apple } from '@react-native-ai/apple';
import { generateText } from 'ai';
import * as Crypto from 'expo-crypto';
import {
  JournalEntry,
  PersonalInsight,
  InsightType,
  ReflectionPrompt,
  Conversation,
} from '../types';

// === Personal Insights Generation ===

const INSIGHT_ICONS: Record<InsightType, string> = {
  pattern: '🔄',
  growth: '🌱',
  reflection: '💭',
  suggestion: '💡',
};

const getEntryContent = (entry: JournalEntry): string => {
  return [
    entry.textNotes,
    entry.voiceRecording?.transcription,
    ...entry.keyMoments.map((km) => km.note),
  ]
    .filter(Boolean)
    .join(' ');
};

const getConversationContent = (conv: Conversation): string => {
  return conv.messages.map((m) => m.content).join(' ');
};

// Generate personal insights using Apple Intelligence
export const generatePersonalInsights = async (
  entries: JournalEntry[],
  conversations: Conversation[]
): Promise<PersonalInsight[]> => {
  // Combine recent content (last 14 days)
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const recentEntries = entries.filter(
    (e) => new Date(e.date) >= twoWeeksAgo
  );
  const recentConversations = conversations.filter(
    (c) => new Date(c.startedAt) >= twoWeeksAgo
  );

  if (recentEntries.length === 0 && recentConversations.length === 0) {
    return getDefaultInsights();
  }

  // Combine all content
  const entriesContent = recentEntries.map(getEntryContent).join('\n---\n');
  const convsContent = recentConversations.map(getConversationContent).join('\n---\n');
  const allContent = `${entriesContent}\n\n${convsContent}`.slice(0, 4000); // Limit context

  // Extract all tags for context
  const allTags = new Set<string>();
  recentEntries.forEach((e) => e.tags.forEach((t) => allTags.add(t)));
  recentConversations.forEach((c) => c.tags?.forEach((t) => allTags.add(t)));

  if (!apple.isAvailable()) {
    return generateInsightsFallback(recentEntries, Array.from(allTags));
  }

  try {
    const { text: insightsJson } = await generateText({
      model: apple() as any,
      prompt: `Analyze these journal entries and conversations to identify personal insights. Generate 3-5 insights that would help the person understand themselves better.

Types of insights to generate:
- pattern: A recurring theme, behavior, or thought pattern
- growth: Evidence of personal growth or positive change
- reflection: A deeper observation about emotions or motivations
- suggestion: A gentle suggestion for self-improvement or exploration

Return as JSON array with format:
[{"type": "pattern|growth|reflection|suggestion", "title": "Brief title (5-8 words)", "description": "2-3 sentence insight"}]

Journal content from the past 2 weeks:
${allContent}

Tags used: ${Array.from(allTags).join(', ') || 'none'}

Generate warm, supportive insights. Be specific to what was actually written.
Return ONLY the JSON array:`,
      temperature: 0.6,
      maxTokens: 800,
    });

    const parsed = JSON.parse(insightsJson);

    if (!Array.isArray(parsed)) {
      return generateInsightsFallback(recentEntries, Array.from(allTags));
    }

    return parsed.slice(0, 5).map((insight: any) => ({
      id: Crypto.randomUUID(),
      type: insight.type as InsightType || 'reflection',
      title: insight.title || 'Personal Insight',
      description: insight.description || '',
      relatedEntryIds: recentEntries.slice(0, 3).map((e) => e.id),
      createdAt: new Date(),
      icon: INSIGHT_ICONS[insight.type as InsightType] || '💭',
    }));
  } catch (error) {
    console.error('Failed to generate insights:', error);
    return generateInsightsFallback(recentEntries, Array.from(allTags));
  }
};

// Fallback insights when AI is unavailable
const generateInsightsFallback = (
  entries: JournalEntry[],
  tags: string[]
): PersonalInsight[] => {
  const insights: PersonalInsight[] = [];

  // Insight based on journaling frequency
  if (entries.length >= 5) {
    insights.push({
      id: Crypto.randomUUID(),
      type: 'growth',
      title: 'Consistent reflection practice',
      description: `You've made ${entries.length} journal entries recently. This consistent practice of reflection is a powerful habit for self-understanding.`,
      relatedEntryIds: entries.slice(0, 3).map((e) => e.id),
      createdAt: new Date(),
      icon: '🌱',
    });
  }

  // Insight based on most common tag
  if (tags.length > 0) {
    const topTag = tags[0];
    insights.push({
      id: Crypto.randomUUID(),
      type: 'pattern',
      title: `"${topTag}" is on your mind`,
      description: `You've been thinking about ${topTag} frequently. This might be worth exploring more deeply to understand what's drawing your attention.`,
      relatedEntryIds: entries.filter((e) => e.tags.includes(topTag)).slice(0, 3).map((e) => e.id),
      createdAt: new Date(),
      icon: '🔄',
    });
  }

  // Generic reflection insight
  insights.push({
    id: Crypto.randomUUID(),
    type: 'reflection',
    title: 'Your thoughts matter',
    description: 'Every thought you capture is a step toward better self-understanding. Keep exploring what moves you.',
    relatedEntryIds: [],
    createdAt: new Date(),
    icon: '💭',
  });

  return insights;
};

// Default insights for new users
const getDefaultInsights = (): PersonalInsight[] => [
  {
    id: Crypto.randomUUID(),
    type: 'suggestion',
    title: 'Start your reflection journey',
    description: 'Capture your first thoughts to begin building self-awareness. Even small reflections add up to meaningful insights over time.',
    relatedEntryIds: [],
    createdAt: new Date(),
    icon: '💡',
  },
];

// === Reflection Prompts ===

const REFLECTION_PROMPTS_BY_CATEGORY = {
  emotional: [
    'What emotion has been most present for you today?',
    'When did you feel most like yourself recently?',
    'What small moment brought you unexpected joy?',
    'What are you holding onto that might be worth releasing?',
  ],
  growth: [
    'What have you learned about yourself recently?',
    'Where have you noticed yourself growing?',
    'What challenge helped you become stronger?',
    'What skill or quality would you like to develop?',
  ],
  gratitude: [
    'Who made a positive difference in your day?',
    'What simple pleasure are you grateful for?',
    'What challenge turned out to be a hidden gift?',
    'What about today would you want to remember?',
  ],
  goals: [
    'What step could you take toward something you care about?',
    'What dream keeps returning to your thoughts?',
    'What would make tomorrow feel meaningful?',
    'What are you working toward, even if slowly?',
  ],
  relationships: [
    'Who have you been thinking about recently?',
    'What conversation would you like to have?',
    'How have your relationships been nourishing you?',
    'Who might need your support right now?',
  ],
};

export const generateReflectionPrompts = async (
  entries: JournalEntry[],
  count: number = 3
): Promise<ReflectionPrompt[]> => {
  const prompts: ReflectionPrompt[] = [];
  const categories = Object.keys(REFLECTION_PROMPTS_BY_CATEGORY) as Array<
    keyof typeof REFLECTION_PROMPTS_BY_CATEGORY
  >;

  // Get recent themes from entries
  const recentTags = new Set<string>();
  entries.slice(0, 10).forEach((e) => e.tags.forEach((t) => recentTags.add(t)));

  // Try to generate contextual prompts with AI
  if (apple.isAvailable() && entries.length > 0) {
    try {
      const recentContent = entries
        .slice(0, 5)
        .map(getEntryContent)
        .join('\n---\n')
        .slice(0, 1500);

      const { text: promptsJson } = await generateText({
        model: apple() as any,
        prompt: `Based on these journal entries, generate ${count} thoughtful reflection prompts. The prompts should help the person explore their thoughts more deeply, based on what they've written.

Recent journal entries:
${recentContent}

Return as JSON array: [{"prompt": "Question text?", "category": "emotional|growth|gratitude|goals|relationships", "relatedToTheme": "optional theme keyword"}]

Generate warm, open-ended questions that invite deeper reflection. Return ONLY the JSON array:`,
        temperature: 0.7,
        maxTokens: 400,
      });

      const parsed = JSON.parse(promptsJson);
      if (Array.isArray(parsed)) {
        return parsed.slice(0, count).map((p: any) => ({
          id: Crypto.randomUUID(),
          prompt: p.prompt,
          category: p.category || 'reflection',
          relatedToTheme: p.relatedToTheme,
        }));
      }
    } catch (error) {
      console.error('Failed to generate contextual prompts:', error);
    }
  }

  // Fallback: Select random prompts from different categories
  const selectedCategories = categories.sort(() => Math.random() - 0.5).slice(0, count);

  selectedCategories.forEach((category) => {
    const categoryPrompts = REFLECTION_PROMPTS_BY_CATEGORY[category];
    const randomPrompt = categoryPrompts[Math.floor(Math.random() * categoryPrompts.length)];

    prompts.push({
      id: Crypto.randomUUID(),
      prompt: randomPrompt,
      category,
    });
  });

  return prompts;
};

// === Quick Stats ===

export interface JournalStats {
  totalEntries: number;
  totalConversations: number;
  entriesThisWeek: number;
  longestStreak: number;
  currentStreak: number;
  topTags: { tag: string; count: number }[];
  totalMinutesRecorded: number;
}

export const calculateJournalStats = (
  entries: JournalEntry[],
  conversations: Conversation[]
): JournalStats => {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  // Entries this week
  const entriesThisWeek = entries.filter((e) => new Date(e.date) >= weekAgo).length;

  // Calculate streaks
  const { longestStreak, currentStreak } = calculateStreaks(entries);

  // Top tags
  const tagCounts: Record<string, number> = {};
  entries.forEach((e) => {
    e.tags.forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  const topTags = Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Total recording time
  const totalMinutesRecorded = entries.reduce((total, e) => {
    if (e.voiceRecording?.duration) {
      return total + Math.round(e.voiceRecording.duration / 60);
    }
    return total;
  }, 0);

  return {
    totalEntries: entries.length,
    totalConversations: conversations.length,
    entriesThisWeek,
    longestStreak,
    currentStreak,
    topTags,
    totalMinutesRecorded,
  };
};

const calculateStreaks = (entries: JournalEntry[]): { longestStreak: number; currentStreak: number } => {
  if (entries.length === 0) {
    return { longestStreak: 0, currentStreak: 0 };
  }

  // Sort entries by date
  const sortedDates = entries
    .map((e) => new Date(e.date).toDateString())
    .filter((v, i, a) => a.indexOf(v) === i) // Unique dates
    .map((d) => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime());

  let longestStreak = 1;
  let currentStreak = 1;
  let tempStreak = 1;

  // Check if there's an entry today or yesterday for current streak
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const hasRecentEntry =
    sortedDates[0]?.toDateString() === today ||
    sortedDates[0]?.toDateString() === yesterday;

  for (let i = 1; i < sortedDates.length; i++) {
    const diff = (sortedDates[i - 1].getTime() - sortedDates[i].getTime()) / (1000 * 60 * 60 * 24);

    if (Math.abs(diff - 1) < 0.1) {
      // Consecutive day
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);

      if (hasRecentEntry && i < 30) {
        // Still counting current streak
        currentStreak = tempStreak;
      }
    } else {
      tempStreak = 1;
    }
  }

  return {
    longestStreak,
    currentStreak: hasRecentEntry ? currentStreak : 0,
  };
};
