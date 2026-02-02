import { JournalEntry, WeeklyTrend, ThemeCount, TopQuote } from '../types';
import * as Crypto from 'expo-crypto';
import { startOfWeek } from 'date-fns';
import { apple } from '@react-native-ai/apple';
import { generateText } from 'ai';
import { z } from 'zod';
import { analyzeSentiment, extractKeyQuotes } from './transcription';

// Get all content from an entry
const getEntryContent = (entry: JournalEntry): string => {
  let content = entry.textNotes || '';
  if (entry.voiceRecording?.transcription) {
    content += ' ' + entry.voiceRecording.transcription;
  }
  entry.keyMoments.forEach(km => {
    content += ' ' + km.note;
  });
  return content;
};

// System prompt for trend analysis - establishes the AI's role and approach
const TREND_ANALYST_SYSTEM_PROMPT = `You are a personal insights analyst with deep emotional intelligence, helping someone understand the patterns and themes in their private journal entries. Your role is to be a thoughtful companion on their self-discovery journey.

Core Principles:
- You observe trends, never judge. Every thought pattern is valid data about someone's inner world.
- You celebrate progress, however small. Growth happens in increments.
- You highlight opportunities for understanding, not problems to fix.
- You speak with warmth and encouragement while remaining analytically precise.
- You recognize that humans are complex - contradictions are normal and interesting, not concerning.

Analysis Approach:
- Look for what's emerging, not just what's frequent
- Notice week-over-week shifts and evolutions
- Connect dots across different life domains
- Identify both explicit themes and underlying currents
- Distinguish between passing concerns and deeper patterns

Your insights should feel like hearing from a wise friend who knows you well - personally relevant, gently honest, and always supportive of growth.`;

// Extract themes using Apple Intelligence
const extractThemesWithAI = async (
  entries: JournalEntry[]
): Promise<Record<string, { count: number; entryIds: string[] }>> => {
  if (!apple.isAvailable()) {
    return extractThemesFallback(entries);
  }

  const allContent = entries.map(e => ({
    id: e.id,
    content: getEntryContent(e),
    date: e.createdAt,
  }));

  const combinedText = allContent.map((e, i) => `[Entry ${i} - ${new Date(e.date).toLocaleDateString()}]\n${e.content}`).join('\n\n---\n\n');

  try {
    const { text: themeJson } = await generateText({
      model: apple() as any,
      system: TREND_ANALYST_SYSTEM_PROMPT,
      prompt: `Analyze these personal journal entries to identify meaningful themes that reveal what matters most to this person right now.

Look for themes across these life domains:
- **Work & Career**: Professional challenges, ambitions, achievements, workplace dynamics
- **Relationships**: Family, friendships, romantic connections, social energy
- **Health & Wellbeing**: Physical health, mental state, self-care, energy levels
- **Personal Growth**: Learning, habits, self-reflection, values exploration
- **Creativity & Play**: Hobbies, creative expression, joy, curiosity
- **Life Logistics**: Planning, responsibilities, daily friction, time management

For each theme identified:
1. Name it with human, relatable language (not clinical terms)
2. Note how prominently it appears across entries
3. Identify which entries contain this theme

Return as JSON: {"themes": [{"name": "Theme Name", "mentions": 5, "relevantEntryIndices": [0, 2], "domain": "work|relationships|health|growth|creativity|logistics"}]}

Journal Entries:
${combinedText}`,
      temperature: 0.5,
      maxTokens: 1500,
    } as any);

    const themeAnalysis = JSON.parse(themeJson);
    const themeMap: Record<string, { count: number; entryIds: string[] }> = {};

    themeAnalysis.themes.forEach((theme: { name: string; mentions: number; relevantEntryIndices: number[] }) => {
      const entryIds = theme.relevantEntryIndices
        .filter(i => i >= 0 && i < allContent.length)
        .map(i => allContent[i].id);

      themeMap[theme.name] = {
        count: theme.mentions,
        entryIds,
      };
    });

    return themeMap;
  } catch (error) {
    console.error('AI theme extraction failed, using fallback:', error);
    return extractThemesFallback(entries);
  }
};

// Common themes to detect (fallback) - organized by life domains
const THEME_KEYWORDS: Record<string, string[]> = {
  // Work & Career
  'Work Challenges': ['work', 'job', 'project', 'deadline', 'meeting', 'boss', 'colleague', 'career'],
  'Professional Growth': ['learning', 'skill', 'promotion', 'opportunity', 'goal', 'achievement'],

  // Relationships
  'Family Connections': ['family', 'parent', 'child', 'sibling', 'mom', 'dad', 'kids', 'home'],
  'Friendships': ['friend', 'social', 'hangout', 'catch up', 'community', 'support'],
  'Romantic Life': ['partner', 'relationship', 'love', 'date', 'together', 'connection'],

  // Health & Wellbeing
  'Physical Health': ['health', 'exercise', 'sleep', 'tired', 'energy', 'body', 'fitness', 'workout'],
  'Mental Wellbeing': ['stress', 'anxiety', 'calm', 'peace', 'overwhelm', 'relax', 'mindful'],
  'Self-Care': ['rest', 'break', 'recharge', 'boundaries', 'taking care', 'slow down'],

  // Personal Growth
  'Self-Reflection': ['realize', 'understand', 'notice', 'aware', 'insight', 'pattern', 'growth'],
  'Habits & Routines': ['routine', 'habit', 'morning', 'daily', 'practice', 'consistent'],
  'Values & Purpose': ['meaning', 'purpose', 'important', 'matters', 'value', 'fulfilling'],

  // Creativity & Joy
  'Creative Expression': ['create', 'art', 'music', 'write', 'design', 'build', 'imagine'],
  'Joy & Gratitude': ['happy', 'grateful', 'thankful', 'joy', 'appreciate', 'blessed', 'wonderful'],
  'Curiosity & Learning': ['curious', 'interesting', 'discover', 'explore', 'wonder', 'learn'],

  // Life Logistics
  'Planning Ahead': ['plan', 'organize', 'prepare', 'schedule', 'future', 'upcoming'],
  'Daily Friction': ['busy', 'overwhelmed', 'too much', 'juggling', 'balance', 'manage'],
};

// Fallback theme extraction using keyword matching
const extractThemesFallback = (entries: JournalEntry[]): Record<string, { count: number; entryIds: string[] }> => {
  const themeMap: Record<string, { count: number; entryIds: string[] }> = {};

  entries.forEach(entry => {
    const content = getEntryContent(entry);
    const lowerText = content.toLowerCase();

    Object.entries(THEME_KEYWORDS).forEach(([theme, keywords]) => {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        if (!themeMap[theme]) {
          themeMap[theme] = { count: 0, entryIds: [] };
        }
        themeMap[theme].count++;
        if (!themeMap[theme].entryIds.includes(entry.id)) {
          themeMap[theme].entryIds.push(entry.id);
        }
      }
    });
  });

  return themeMap;
};

// Analyze mood and energy with nuanced emotional vocabulary
const analyzeMoodWithAI = async (
  entries: JournalEntry[]
): Promise<{ positive: number; neutral: number; negative: number; energyLevel: string; dominantMood: string }> => {
  if (!apple.isAvailable() || entries.length === 0) {
    // Fallback to basic sentiment analysis
    const sentimentResults = await Promise.all(
      entries.map(async entry => {
        const content = getEntryContent(entry);
        return analyzeSentiment(content);
      })
    );

    let positive = 0, neutral = 0, negative = 0;
    sentimentResults.forEach(sentiment => {
      if (sentiment === 'positive') positive++;
      else if (sentiment === 'negative') negative++;
      else neutral++;
    });

    return { positive, neutral, negative, energyLevel: 'moderate', dominantMood: 'balanced' };
  }

  const allContent = entries.map(e => ({
    content: getEntryContent(e),
    date: e.createdAt,
  }));

  const combinedText = allContent.map((e, i) => `[Entry ${i + 1}]\n${e.content}`).join('\n\n');

  try {
    const { text: moodJson } = await generateText({
      model: apple() as any,
      system: TREND_ANALYST_SYSTEM_PROMPT,
      prompt: `Analyze the emotional landscape of these journal entries with nuance and care. Go beyond simple positive/negative to understand the texture of this person's inner experience.

Consider these dimensions:

**Emotional Valence** (overall tone):
- Positive: hopeful, content, excited, grateful, peaceful, joyful, proud, loving
- Neutral: reflective, matter-of-fact, processing, contemplative, observational
- Challenging: worried, frustrated, sad, overwhelmed, uncertain, grieving, anxious

**Energy Level**:
- High energy: driven, excited, restless, anxious, buzzing, motivated
- Moderate energy: steady, balanced, present, focused, engaged
- Low energy: tired, depleted, quiet, withdrawn, resting, recuperating

**Dominant Mood**: What's the prevailing emotional weather? Use evocative, human language.
Examples: "cautiously optimistic", "quietly content", "processing a lot", "in a growth phase", "seeking clarity", "energized but scattered"

Categorize each entry, then summarize:

Return as JSON:
{
  "entries": [{"index": 0, "valence": "positive|neutral|challenging", "energy": "high|moderate|low"}],
  "summary": {
    "positive": <count>,
    "neutral": <count>,
    "negative": <count>,
    "energyLevel": "high|moderate|low",
    "dominantMood": "<evocative 2-4 word description>"
  }
}

Journal Entries:
${combinedText}`,
      temperature: 0.3,
      maxTokens: 1000,
    } as any);

    const analysis = JSON.parse(moodJson);
    return {
      positive: analysis.summary.positive || 0,
      neutral: analysis.summary.neutral || 0,
      negative: analysis.summary.negative || 0,
      energyLevel: analysis.summary.energyLevel || 'moderate',
      dominantMood: analysis.summary.dominantMood || 'balanced',
    };
  } catch (error) {
    console.error('AI mood analysis failed, using fallback:', error);
    // Fallback
    const sentimentResults = await Promise.all(
      entries.map(async entry => analyzeSentiment(getEntryContent(entry)))
    );
    let positive = 0, neutral = 0, negative = 0;
    sentimentResults.forEach(s => {
      if (s === 'positive') positive++;
      else if (s === 'negative') negative++;
      else neutral++;
    });
    return { positive, neutral, negative, energyLevel: 'moderate', dominantMood: 'balanced' };
  }
};

// Generate weekly trend report using Apple Intelligence
export const generateWeeklyTrend = async (entries: JournalEntry[]): Promise<WeeklyTrend> => {
  const weekOf = startOfWeek(new Date(), { weekStartsOn: 1 });

  // Analyze themes across all entries
  const appleAvailable = apple.isAvailable();

  const themeMap = appleAvailable
    ? await extractThemesWithAI(entries)
    : extractThemesFallback(entries);

  // Convert to sorted array
  const themes: ThemeCount[] = Object.entries(themeMap)
    .map(([theme, data]) => ({
      theme,
      count: data.count,
      entryIds: data.entryIds,
    }))
    .sort((a, b) => b.count - a.count);

  // Analyze mood and sentiment with nuanced AI analysis
  const moodAnalysis = await analyzeMoodWithAI(entries);

  const { positive, neutral, negative } = moodAnalysis;

  // Extract top quotes using AI
  const allQuotes: TopQuote[] = [];

  for (const entry of entries) {
    const content = getEntryContent(entry);
    const quotes = await extractKeyQuotes(content);
    quotes.forEach(quote => {
      allQuotes.push({
        quote,
        entryId: entry.id,
        interviewee: entry.interviewee || 'Unknown',
      });
    });
  }

  // Take top 10 quotes
  const topQuotes = allQuotes.slice(0, 10);

  // Calculate total recording time
  const totalMinutesRecorded = entries.reduce((total, entry) => {
    if (entry.voiceRecording?.duration) {
      return total + Math.round(entry.voiceRecording.duration / 60);
    }
    return total;
  }, 0);

  return {
    id: Crypto.randomUUID(),
    weekOf,
    themes,
    sentimentOverview: { positive, neutral, negative },
    topQuotes,
    totalInterviews: entries.length,
    totalMinutesRecorded,
  };
};

// Get AI-generated trend insights with longitudinal perspective
export const getTrendInsights = async (
  trend: WeeklyTrend,
  previousTrend?: WeeklyTrend
): Promise<string[]> => {
  if (!apple.isAvailable()) {
    return getTrendInsightsFallback(trend);
  }

  // Build context about week-over-week changes
  let weekOverWeekContext = '';
  if (previousTrend) {
    const prevTopThemes = previousTrend.themes.slice(0, 3).map(t => t.theme);
    const currTopThemes = trend.themes.slice(0, 3).map(t => t.theme);
    const newThemes = currTopThemes.filter(t => !prevTopThemes.includes(t));
    const fadingThemes = prevTopThemes.filter(t => !currTopThemes.includes(t));

    const prevPositiveRatio = previousTrend.sentimentOverview.positive /
      Math.max(1, previousTrend.sentimentOverview.positive + previousTrend.sentimentOverview.neutral + previousTrend.sentimentOverview.negative);
    const currPositiveRatio = trend.sentimentOverview.positive /
      Math.max(1, trend.sentimentOverview.positive + trend.sentimentOverview.neutral + trend.sentimentOverview.negative);
    const sentimentShift = currPositiveRatio - prevPositiveRatio;

    weekOverWeekContext = `
Week-over-week changes:
- ${newThemes.length > 0 ? `Emerging themes: ${newThemes.join(', ')}` : 'Theme consistency - similar patterns as last week'}
- ${fadingThemes.length > 0 ? `Fading themes: ${fadingThemes.join(', ')}` : 'No major themes resolved'}
- Sentiment shift: ${sentimentShift > 0.1 ? 'notably more positive' : sentimentShift < -0.1 ? 'more challenging' : 'relatively stable'}
- Activity change: ${trend.totalInterviews > previousTrend.totalInterviews ? 'more reflective time' : trend.totalInterviews < previousTrend.totalInterviews ? 'less journaling' : 'consistent practice'}`;
  }

  try {
    const { text: insightsJson } = await generateText({
      model: apple() as any,
      system: TREND_ANALYST_SYSTEM_PROMPT,
      prompt: `Generate 4-5 personally meaningful insights based on this person's week of journaling. These insights should feel like they come from someone who truly knows them and cares about their growth.

**This Week's Data:**
- Journal entries: ${trend.totalInterviews} entries
- Time spent reflecting: ${trend.totalMinutesRecorded} minutes of voice notes
- What's on their mind: ${trend.themes.slice(0, 5).map(t => `${t.theme} (mentioned ${t.count}x)`).join(', ')}
- Emotional tone: ${trend.sentimentOverview.positive} uplifting, ${trend.sentimentOverview.neutral} reflective, ${trend.sentimentOverview.negative} challenging entries
- Notable thoughts: ${trend.topQuotes.slice(0, 3).map(q => `"${q.quote}"`).join(' | ')}
${weekOverWeekContext}

**Guidelines for insights:**
1. **Lead with celebration** - Acknowledge something they're doing well or growth you see
2. **Notice patterns** - What themes connect? What might be underlying multiple surface concerns?
3. **Highlight progress** - Even in challenges, where is there forward movement?
4. **Suggest gently** - If there's an opportunity for deeper exploration, frame it as curiosity, not advice
5. **Be specific** - Reference their actual themes and words, not generic wisdom

**Tone:**
- Warm and encouraging, like a thoughtful friend
- Insightful without being preachy
- Specific to their life, not generic self-help
- Acknowledge complexity - life isn't simple

Return as a JSON array of 4-5 insight strings. Each insight should be 1-2 sentences and feel personally relevant.`,
      temperature: 0.4,
      maxTokens: 800,
    } as any);

    const insights = JSON.parse(insightsJson);
    return Array.isArray(insights) ? insights : getTrendInsightsFallback(trend);
  } catch {
    return getTrendInsightsFallback(trend);
  }
};

// Fallback trend insights - still aim for warm, encouraging tone
const getTrendInsightsFallback = (trend: WeeklyTrend): string[] => {
  const insights: string[] = [];

  // Celebrate the practice of journaling
  if (trend.totalInterviews > 0) {
    if (trend.totalInterviews >= 5) {
      insights.push(`You showed up for yourself ${trend.totalInterviews} times this week - that's a beautiful commitment to self-reflection.`);
    } else if (trend.totalInterviews >= 3) {
      insights.push(`${trend.totalInterviews} journal entries this week - you're building a meaningful reflection practice.`);
    } else {
      insights.push(`Every moment of reflection counts. You created ${trend.totalInterviews} ${trend.totalInterviews === 1 ? 'entry' : 'entries'} this week.`);
    }
  }

  // Theme insight
  if (trend.themes.length > 0) {
    const topTheme = trend.themes[0];
    if (topTheme.count >= 3) {
      insights.push(`"${topTheme.theme}" has been on your mind a lot lately (${topTheme.count} mentions) - this might be worth exploring deeper.`);
    } else {
      insights.push(`Your thoughts touched on "${topTheme.theme}" this week - an interesting thread in your inner landscape.`);
    }
  }

  // Sentiment insight with warmer framing
  const total = trend.sentimentOverview.positive + trend.sentimentOverview.neutral + trend.sentimentOverview.negative;
  if (total > 0) {
    const positivePercent = Math.round((trend.sentimentOverview.positive / total) * 100);
    const challengingPercent = Math.round((trend.sentimentOverview.negative / total) * 100);

    if (positivePercent >= 60) {
      insights.push(`There's a lot of light in your entries this week - ${positivePercent}% had an uplifting tone.`);
    } else if (challengingPercent >= 40) {
      insights.push(`You've been processing some challenging feelings this week. Acknowledging difficulty is itself a form of strength.`);
    } else {
      insights.push(`Your emotional landscape this week has been varied - a natural mix of highs, lows, and everything in between.`);
    }
  }

  // Recording time insight
  if (trend.totalMinutesRecorded > 0) {
    if (trend.totalMinutesRecorded >= 30) {
      insights.push(`${trend.totalMinutesRecorded} minutes of voice reflection - you're giving yourself valuable space to think out loud.`);
    } else {
      insights.push(`${trend.totalMinutesRecorded} minutes captured in voice notes. Even brief reflections add up to meaningful self-knowledge.`);
    }
  }

  return insights;
};
