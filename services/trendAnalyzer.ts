import { JournalEntry, WeeklyTrend, ThemeCount, TopQuote } from '../types';
import * as Crypto from 'expo-crypto';
import { startOfWeek } from 'date-fns';
import { apple, foundationModels } from '@react-native-ai/apple';
import { generateObject, generateText } from 'ai';
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

// Extract themes using Apple Intelligence
const extractThemesWithAI = async (
  entries: JournalEntry[]
): Promise<Record<string, { count: number; entryIds: string[] }>> => {
  const allContent = entries.map(e => ({
    id: e.id,
    content: getEntryContent(e),
  }));

  const combinedText = allContent.map(e => e.content).join('\n\n---\n\n');

  try {
    const { object: themeAnalysis } = await generateObject({
      model: apple(),
      schema: z.object({
        themes: z.array(z.object({
          name: z.string().describe('Theme name'),
          mentions: z.number().describe('Number of times this theme appears'),
          relevantEntryIndices: z.array(z.number()).describe('Indices of entries containing this theme'),
        })),
      }),
      prompt: `Analyze the following interview transcripts and identify the main recurring themes. For each theme, count how many times it's mentioned and note which entries (by index, starting at 0) contain that theme.

Focus on themes like: product feedback, user experience, pain points, feature requests, workflow issues, pricing concerns, positive feedback, onboarding challenges, etc.

Transcripts:
${combinedText}`,
      temperature: 0.3,
    });

    const themeMap: Record<string, { count: number; entryIds: string[] }> = {};

    themeAnalysis.themes.forEach(theme => {
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

// Common themes to detect (fallback)
const THEME_KEYWORDS: Record<string, string[]> = {
  'Product Feedback': ['product', 'feature', 'improvement', 'bug', 'issue', 'usability'],
  'User Experience': ['experience', 'interface', 'design', 'navigation', 'confusing', 'intuitive'],
  'Pain Points': ['frustrating', 'difficult', 'problem', 'challenge', 'struggle', 'hard'],
  'Positive Feedback': ['love', 'great', 'amazing', 'helpful', 'easy', 'enjoy'],
  'Feature Requests': ['wish', 'would be nice', 'want', 'need', 'should have', 'missing'],
  'Workflow': ['workflow', 'process', 'routine', 'daily', 'task', 'productivity'],
  'Onboarding': ['started', 'first time', 'learning', 'tutorial', 'getting started'],
  'Pricing': ['price', 'cost', 'expensive', 'affordable', 'value', 'worth'],
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

// Generate weekly trend report using Apple Intelligence
export const generateWeeklyTrend = async (entries: JournalEntry[]): Promise<WeeklyTrend> => {
  const weekOf = startOfWeek(new Date(), { weekStartsOn: 1 });

  // Analyze themes across all entries
  const themeMap = foundationModels.isAvailable()
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

  // Analyze sentiment for each entry
  const sentimentResults = await Promise.all(
    entries.map(async entry => {
      const content = getEntryContent(entry);
      return analyzeSentiment(content);
    })
  );

  let positive = 0;
  let neutral = 0;
  let negative = 0;

  sentimentResults.forEach(sentiment => {
    if (sentiment === 'positive') positive++;
    else if (sentiment === 'negative') negative++;
    else neutral++;
  });

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

// Get AI-generated trend insights
export const getTrendInsights = async (trend: WeeklyTrend): Promise<string[]> => {
  if (!foundationModels.isAvailable()) {
    return getTrendInsightsFallback(trend);
  }

  try {
    const { text: insightsJson } = await generateText({
      model: apple(),
      prompt: `Based on the following weekly interview analysis data, generate 4-5 actionable insights. Return them as a JSON array of strings.

Data:
- Total interviews: ${trend.totalInterviews}
- Recording time: ${trend.totalMinutesRecorded} minutes
- Top themes: ${trend.themes.slice(0, 5).map(t => `${t.theme} (${t.count} mentions)`).join(', ')}
- Sentiment: ${trend.sentimentOverview.positive} positive, ${trend.sentimentOverview.neutral} neutral, ${trend.sentimentOverview.negative} negative
- Top quotes: ${trend.topQuotes.slice(0, 3).map(q => `"${q.quote}" - ${q.interviewee}`).join('; ')}

Return only the JSON array, nothing else.`,
      temperature: 0.5,
    });

    const insights = JSON.parse(insightsJson);
    return Array.isArray(insights) ? insights : getTrendInsightsFallback(trend);
  } catch {
    return getTrendInsightsFallback(trend);
  }
};

// Fallback trend insights
const getTrendInsightsFallback = (trend: WeeklyTrend): string[] => {
  const insights: string[] = [];

  if (trend.themes.length > 0) {
    const topTheme = trend.themes[0];
    insights.push(`"${topTheme.theme}" was the most discussed topic this week (${topTheme.count} mentions)`);
  }

  const total = trend.sentimentOverview.positive + trend.sentimentOverview.neutral + trend.sentimentOverview.negative;
  if (total > 0) {
    const positivePercent = Math.round((trend.sentimentOverview.positive / total) * 100);
    insights.push(`${positivePercent}% of interviews had positive sentiment`);
  }

  insights.push(`${trend.totalInterviews} interviews conducted this week`);

  if (trend.totalMinutesRecorded > 0) {
    insights.push(`${trend.totalMinutesRecorded} minutes of audio recorded`);
  }

  return insights;
};
