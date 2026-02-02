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
import { safeParseJSON } from './jsonUtils';

// === Personal Insights Generation ===

const INSIGHT_ICONS: Record<InsightType, string> = {
  pattern: '🔄',
  growth: '🌱',
  reflection: '💭',
  suggestion: '💡',
};

// === System Prompts for AI Analysis ===

const INSIGHTS_SYSTEM_PROMPT = `You are a thoughtful personal analyst and compassionate guide for self-discovery. Your role is to help people understand themselves more deeply through their journal entries.

Core Principles:
- Approach each person's thoughts with genuine curiosity and warmth
- Recognize that every person's inner world is rich and meaningful
- Observe patterns without judgment—there are no "good" or "bad" thoughts
- Focus on growth potential and self-understanding, not criticism
- Honor vulnerability by treating personal reflections with care

Your Analytical Lens:
- Emotional patterns: Notice recurring feelings, emotional triggers, and how emotions evolve over time
- Thought patterns: Identify recurring themes, cognitive habits, and belief systems
- Behavioral insights: Connect thoughts to actions and notice cause-effect relationships
- Growth indicators: Celebrate progress, resilience, and moments of self-awareness
- Connection themes: Notice how relationships and social dynamics appear in their reflections
- Values and meaning: Identify what truly matters to this person based on what they write about

Tone Guidelines:
- Write like a wise, supportive friend—warm but insightful
- Be specific and personal, not generic or clinical
- Acknowledge complexity—people contain multitudes
- Offer observations as invitations to explore, not diagnoses
- Balance affirmation with gentle invitations to go deeper`;

const PATTERN_ANALYSIS_SYSTEM_PROMPT = `You are an expert at recognizing psychological patterns and themes across personal reflections. Your goal is accurate, meaningful pattern detection that helps people see connections they might have missed.

Pattern Recognition Focus:
- Temporal patterns: How thoughts and feelings change across time of day, week, or in response to events
- Emotional cycles: Recurring emotional states and what tends to precede or follow them
- Theme clusters: Related topics that appear together, suggesting deeper connections
- Language patterns: Words, phrases, or ways of expressing that reveal underlying perspectives
- Growth trajectories: Evidence of learning, adaptation, or evolving perspectives
- Tension points: Areas of internal conflict or competing desires that appear repeatedly

Accuracy Guidelines:
- Only identify patterns you can support with specific examples from the content
- Distinguish between genuine patterns (3+ occurrences) and one-time observations
- Note the strength of patterns—some are strong trends, others are emerging themes
- Acknowledge uncertainty when patterns are suggestive but not conclusive`;

const REFLECTION_PROMPTS_SYSTEM_PROMPT = `You are a skilled facilitator of self-reflection. Your questions should open doors to deeper self-understanding while feeling safe and inviting.

Question Design Principles:
- Open-ended: Avoid yes/no questions; invite exploration
- Personally relevant: Base questions on what they've actually written about
- Gently challenging: Invite deeper thinking without feeling confrontational
- Emotionally safe: Create space for vulnerability without pressure
- Growth-oriented: Point toward possibility and self-understanding

Question Categories:
- Exploring emotions: Help them understand and process feelings
- Uncovering meaning: What matters most and why
- Connecting patterns: How different parts of life relate
- Imagining possibilities: What could be different or better
- Appreciating growth: Recognizing progress and resilience`;

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
      system: INSIGHTS_SYSTEM_PROMPT,
      prompt: `Analyze these personal journal entries and conversations to generate meaningful insights.

=== JOURNAL CONTENT (Past 2 Weeks) ===
${allContent}

=== THEMES & TAGS USED ===
${Array.from(allTags).join(', ') || 'No tags yet'}

=== YOUR TASK ===
Generate 3-5 personal insights that will help this person understand themselves better. Each insight should feel like a meaningful discovery, not a generic observation.

Insight Types to Generate:
• PATTERN: A recurring theme, behavior, thought pattern, or emotional tendency you notice across multiple entries. Be specific about what you observe repeating.
• GROWTH: Evidence of personal development, resilience, learning, or positive change. Celebrate progress, even small wins.
• REFLECTION: A deeper observation about their emotions, motivations, values, or inner world that they might not have consciously recognized.
• SUGGESTION: A gentle, actionable invitation to explore something further—framed as a possibility, not a prescription.

Quality Guidelines:
- Reference specific content from their entries (e.g., "Your reflections on [specific topic] suggest...")
- Connect dots they might not have seen (e.g., "I notice that when you write about X, you often also mention Y...")
- Make it personal and specific to THEIR experience, not generic advice
- Balance affirmation with gentle invitations to explore deeper
- Use warm, supportive language that honors their vulnerability

=== RESPONSE FORMAT ===
Return ONLY a JSON array with this exact structure:
[
  {
    "type": "pattern|growth|reflection|suggestion",
    "title": "Compelling 5-8 word title that captures the insight",
    "description": "2-3 sentences that explain the insight with specific references to their content. Make it feel personally meaningful."
  }
]`,
      temperature: 0.55,
      maxOutputTokens: 1000,
    });

    const parsed = safeParseJSON<any[]>(insightsJson, []);

    if (!Array.isArray(parsed) || parsed.length === 0) {
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

// === Deep Pattern Analysis ===

export interface PatternAnalysis {
  id: string;
  patternType: 'emotional' | 'behavioral' | 'temporal' | 'thematic' | 'relational';
  title: string;
  observation: string;
  evidence: string[];
  strength: 'emerging' | 'moderate' | 'strong';
  suggestion?: string;
  createdAt: Date;
}

// Analyze patterns across entries with high accuracy (lower temperature)
export const analyzePatterns = async (
  entries: JournalEntry[],
  conversations: Conversation[]
): Promise<PatternAnalysis[]> => {
  const oneMonthAgo = new Date();
  oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

  const relevantEntries = entries.filter(
    (e) => new Date(e.date) >= oneMonthAgo
  );
  const relevantConversations = conversations.filter(
    (c) => new Date(c.startedAt) >= oneMonthAgo
  );

  if (relevantEntries.length < 3) {
    return []; // Need minimum entries for pattern detection
  }

  // Prepare structured content for analysis
  const structuredEntries = relevantEntries.map((e) => ({
    date: e.date,
    dayOfWeek: new Date(e.date).toLocaleDateString('en-US', { weekday: 'long' }),
    mood: e.mood,
    tags: e.tags,
    content: getEntryContent(e).slice(0, 500),
  }));

  if (!apple.isAvailable()) {
    return generatePatternsFallback(relevantEntries);
  }

  try {
    const { text: patternsJson } = await generateText({
      model: apple() as any,
      system: PATTERN_ANALYSIS_SYSTEM_PROMPT,
      prompt: `Analyze these journal entries to identify meaningful patterns across time.

=== STRUCTURED JOURNAL DATA (Past 30 Days) ===
${JSON.stringify(structuredEntries, null, 2)}

=== ANALYSIS TASK ===
Identify 2-4 genuine patterns that emerge from this data. Only report patterns you can support with specific evidence.

Pattern Types to Look For:
• EMOTIONAL: Recurring emotional states, triggers, or cycles (e.g., "anxiety tends to peak on Sunday evenings")
• BEHAVIORAL: Consistent actions or habits that appear in entries (e.g., "creative energy correlates with morning entries")
• TEMPORAL: Time-based patterns in mood, themes, or journaling behavior (e.g., "deeper reflections happen on weekends")
• THEMATIC: Topics or concerns that appear across multiple entries (e.g., "career decisions appear alongside mentions of family")
• RELATIONAL: Patterns involving relationships or social dynamics (e.g., "energy levels seem tied to social interaction frequency")

Evidence Requirements:
- Each pattern must have at least 2-3 specific examples from the entries
- Note the strength: "emerging" (2-3 occurrences), "moderate" (4-6 occurrences), "strong" (7+ occurrences)
- Be precise—avoid overgeneralizing

=== RESPONSE FORMAT ===
Return ONLY a JSON array:
[
  {
    "patternType": "emotional|behavioral|temporal|thematic|relational",
    "title": "Clear, specific 5-10 word description of the pattern",
    "observation": "2-3 sentences explaining what you observe and why it might be meaningful",
    "evidence": ["Specific example 1 from entries", "Specific example 2", "Specific example 3"],
    "strength": "emerging|moderate|strong",
    "suggestion": "Optional: A gentle question or invitation to explore this pattern further"
  }
]`,
      temperature: 0.35,
      maxOutputTokens: 1200,
    });

    const parsed = safeParseJSON<any[]>(patternsJson, []);

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return generatePatternsFallback(relevantEntries);
    }

    return parsed.slice(0, 4).map((pattern: any) => ({
      id: Crypto.randomUUID(),
      patternType: pattern.patternType || 'thematic',
      title: pattern.title || 'Pattern Detected',
      observation: pattern.observation || '',
      evidence: Array.isArray(pattern.evidence) ? pattern.evidence : [],
      strength: pattern.strength || 'emerging',
      suggestion: pattern.suggestion,
      createdAt: new Date(),
    }));
  } catch (error) {
    console.error('Failed to analyze patterns:', error);
    return generatePatternsFallback(relevantEntries);
  }
};

// Fallback pattern detection when AI is unavailable
const generatePatternsFallback = (entries: JournalEntry[]): PatternAnalysis[] => {
  const patterns: PatternAnalysis[] = [];

  // Detect mood patterns
  const moodCounts: Record<string, number> = {};
  entries.forEach((e) => {
    if (e.mood) {
      moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
    }
  });

  const dominantMood = Object.entries(moodCounts)
    .sort(([, a], [, b]) => b - a)[0];

  if (dominantMood && dominantMood[1] >= 3) {
    patterns.push({
      id: Crypto.randomUUID(),
      patternType: 'emotional',
      title: `${dominantMood[0]} appears frequently in your entries`,
      observation: `Over the past month, "${dominantMood[0]}" has been your most common emotional state, appearing in ${dominantMood[1]} entries. This consistency might be worth exploring.`,
      evidence: entries
        .filter((e) => e.mood === dominantMood[0])
        .slice(0, 3)
        .map((e) => `Entry on ${new Date(e.date).toLocaleDateString()}`),
      strength: dominantMood[1] >= 7 ? 'strong' : dominantMood[1] >= 4 ? 'moderate' : 'emerging',
      suggestion: 'What do you think contributes to this emotional pattern?',
      createdAt: new Date(),
    });
  }

  // Detect day-of-week patterns
  const dayOfWeekCounts: Record<string, number> = {};
  entries.forEach((e) => {
    const day = new Date(e.date).toLocaleDateString('en-US', { weekday: 'long' });
    dayOfWeekCounts[day] = (dayOfWeekCounts[day] || 0) + 1;
  });

  const mostActiveDay = Object.entries(dayOfWeekCounts)
    .sort(([, a], [, b]) => b - a)[0];

  if (mostActiveDay && mostActiveDay[1] >= 3) {
    patterns.push({
      id: Crypto.randomUUID(),
      patternType: 'temporal',
      title: `${mostActiveDay[0]}s are your most reflective day`,
      observation: `You tend to journal most frequently on ${mostActiveDay[0]}s. This might indicate when you naturally feel most inclined toward self-reflection.`,
      evidence: [`${mostActiveDay[1]} entries on ${mostActiveDay[0]}s in the past month`],
      strength: 'emerging',
      createdAt: new Date(),
    });
  }

  return patterns;
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
    'What emotion has been sitting with you today, and what might it be trying to tell you?',
    'When did you feel most like yourself recently—what were you doing and who were you with?',
    'What small, unexpected moment brought you joy that you almost missed?',
    'What are you carrying that might feel lighter if you set it down, even briefly?',
    'If your current mood had a message for you, what would it say?',
    'What feeling have you been avoiding, and what would happen if you let yourself feel it fully?',
  ],
  growth: [
    'What have you learned about yourself recently that surprised you?',
    'Where have you noticed yourself responding differently than you would have a year ago?',
    'What challenge are you facing right now that might actually be helping you grow?',
    'What quality in yourself are you learning to appreciate more?',
    'What old belief about yourself are you starting to question?',
    'What would your past self be proud of about who you are becoming?',
  ],
  gratitude: [
    'Who quietly made your life a little better today—and do they know?',
    'What simple pleasure grounded you today that you often take for granted?',
    'What difficulty from your past are you now grateful for, even in small ways?',
    'What about this exact moment in your life would you want to remember decades from now?',
    'What part of your daily life would you miss if it suddenly disappeared?',
    'Who has believed in you when you struggled to believe in yourself?',
  ],
  goals: [
    'What step—however small—could you take today toward something that matters to you?',
    'What dream keeps returning to your thoughts, and what might that persistence mean?',
    'What would need to be true for tomorrow to feel like a day well-lived?',
    'What are you building slowly, even when progress feels invisible?',
    'If fear weren\'t a factor, what would you be working toward right now?',
    'What goal have you been postponing, and what\'s one thing you could do about it this week?',
  ],
  relationships: [
    'Who has been on your mind lately, and what might that tell you?',
    'What conversation have you been putting off that might actually bring you closer to someone?',
    'How are your closest relationships nourishing you—and how are they challenging you to grow?',
    'Who in your life might need to hear from you today?',
    'What quality do you admire in someone close to you that you\'d like to develop in yourself?',
    'When did you last feel truly seen and understood by someone?',
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

      // Extract emotional tone indicators
      const emotionalContext = entries.slice(0, 5).map(e => ({
        mood: e.mood,
        tags: e.tags.slice(0, 3)
      }));

      const { text: promptsJson } = await generateText({
        model: apple() as any,
        system: REFLECTION_PROMPTS_SYSTEM_PROMPT,
        prompt: `Generate ${count} personalized reflection prompts based on this person's recent journal entries.

=== RECENT JOURNAL ENTRIES ===
${recentContent}

=== EMOTIONAL CONTEXT ===
Recent moods and themes: ${JSON.stringify(emotionalContext)}

=== YOUR TASK ===
Create ${count} thoughtful questions that will help this person explore their inner world more deeply. Each question should feel personally relevant to what they've been writing about.

Question Design:
• Build on specific themes, emotions, or situations from their entries
• Open doors to self-discovery without feeling intrusive
• Invite exploration of feelings, patterns, or possibilities
• Feel like a warm invitation, not an interrogation
• Be specific enough to feel personal, open enough to allow freedom

Categories to Choose From:
• emotional: Exploring and understanding feelings
• growth: Reflecting on learning and personal development
• gratitude: Appreciating positive aspects of life
• goals: Exploring desires and future directions
• relationships: Understanding connections with others

=== RESPONSE FORMAT ===
Return ONLY a JSON array:
[
  {
    "prompt": "A thoughtful, open-ended question that feels personally relevant?",
    "category": "emotional|growth|gratitude|goals|relationships",
    "relatedToTheme": "specific theme from their entries this connects to"
  }
]`,
        temperature: 0.65,
        maxOutputTokens: 500,
      });

      const parsed = safeParseJSON<any[]>(promptsJson, []);
      if (Array.isArray(parsed) && parsed.length > 0) {
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
