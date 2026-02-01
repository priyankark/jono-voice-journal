import { JournalEntry, Article } from '../types';
import * as Crypto from 'expo-crypto';
import { apple } from '@react-native-ai/apple';
import { generateText } from 'ai';
import { extractKeyQuotes } from './transcription';

export interface ArticleGenerationOptions {
  style: 'formal' | 'casual' | 'journalistic';
  includeQuotes: boolean;
  maxLength?: number;
}

const DEFAULT_OPTIONS: ArticleGenerationOptions = {
  style: 'journalistic',
  includeQuotes: true,
  maxLength: 1500,
};

// Combine entry content into readable text
const combineEntryContent = (entry: JournalEntry): string => {
  let content = '';

  if (entry.interviewee) {
    content += `Interview with ${entry.interviewee}\n\n`;
  }

  if (entry.textNotes) {
    content += entry.textNotes + '\n\n';
  }

  if (entry.voiceRecording?.transcription) {
    content += entry.voiceRecording.transcription + '\n\n';
  }

  if (entry.keyMoments.length > 0) {
    content += 'Key Moments:\n';
    entry.keyMoments.forEach(km => {
      content += `- ${km.note}\n`;
    });
  }

  return content;
};

// Generate article from entries using Apple Intelligence
export const generateArticle = async (
  entries: JournalEntry[],
  options: Partial<ArticleGenerationOptions> = {}
): Promise<Article> => {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Combine all entry content
  const rawContent = entries.map(combineEntryContent).join('\n---\n');

  // Extract interviewees
  const interviewees = entries
    .filter(e => e.interviewee)
    .map(e => e.interviewee!)
    .filter((v, i, a) => a.indexOf(v) === i);

  // Extract key quotes using AI (safely)
  let keyQuotes: string[] = [];
  try {
    keyQuotes = await extractKeyQuotes(rawContent);
  } catch (e) {
    console.warn('Key quote extraction failed, continuing without quotes:', e);
    keyQuotes = [];
  }

  // Check if Apple Intelligence is available
  if (!apple.isAvailable()) {
    console.log('[ArticleGen] Apple Intelligence not available, using fallback');
    return generateArticleFallback(entries, rawContent, interviewees, keyQuotes, opts);
  }

  try {
    // Generate title using AI
    console.log('[ArticleGen] Starting title generation...');
    const { text: title } = await generateText({
      model: apple() as any,
      prompt: `Create a compelling, concise article title for the following interview notes. The title should be engaging and capture the main theme. Only return the title, nothing else.

Interviewees: ${interviewees.length > 0 ? interviewees.join(', ') : 'Anonymous'}

Notes:
${rawContent.slice(0, 1000)}`,
      temperature: 0.7,
    });
    console.log('[ArticleGen] Title generated:', title.slice(0, 50));

    // Generate summary using AI
    console.log('[ArticleGen] Starting summary generation...');
    const { text: summary } = await generateText({
      model: apple() as any,
      prompt: `Write a 2-3 sentence executive summary of these interview notes. Focus on the key insights and takeaways.

Notes:
${rawContent.slice(0, 2000)}`,
      temperature: 0.5,
    });

    // Generate full article using AI
    console.log('[ArticleGen] Starting full article generation...');
    const styleGuide = {
      formal: 'Use formal, professional language appropriate for a business report.',
      casual: 'Use conversational, approachable language while maintaining clarity.',
      journalistic: 'Use engaging journalistic style with a strong narrative flow.',
    };

    const { text: content } = await generateText({
      model: apple() as any,
      prompt: `Transform these interview notes into a well-structured article. ${styleGuide[opts.style]}

${opts.includeQuotes ? 'Include direct quotes from interviewees where impactful.' : 'Paraphrase rather than using direct quotes.'}

Maximum length: approximately ${opts.maxLength} words.

Format the article with markdown headings (##) for sections.

Interview Notes:
${rawContent}`,
      temperature: 0.6,
      maxTokens: opts.maxLength ? opts.maxLength * 2 : 3000,
    });

    const article: Article = {
      id: Crypto.randomUUID(),
      entryIds: entries.map(e => e.id),
      title: title.trim(),
      content,
      keyQuotes,
      summary: summary.trim(),
      status: 'draft',
      createdAt: new Date(),
    };

    return article;
  } catch (error) {
    console.error('Article generation error:', error);
    return generateArticleFallback(entries, rawContent, interviewees, keyQuotes, opts);
  }
};

// Fallback article generation without AI
const generateArticleFallback = (
  entries: JournalEntry[],
  rawContent: string,
  interviewees: string[],
  keyQuotes: string[],
  opts: ArticleGenerationOptions
): Article => {
  const title = interviewees.length > 0
    ? `Insights from ${interviewees.join(', ')}`
    : `Interview Notes - ${new Date().toLocaleDateString()}`;

  const summary = `This article synthesizes insights from ${entries.length} interview${entries.length > 1 ? 's' : ''} ` +
    `${interviewees.length > 0 ? `with ${interviewees.join(', ')}` : ''}. ` +
    `Key themes and quotes have been extracted for easy reference.`;

  const content = formatAsArticle(rawContent);

  return {
    id: Crypto.randomUUID(),
    entryIds: entries.map(e => e.id),
    title,
    content,
    keyQuotes,
    summary,
    status: 'draft',
    createdAt: new Date(),
  };
};

// Format raw notes as article (basic formatting)
const formatAsArticle = (raw: string): string => {
  const paragraphs = raw.split('\n\n').filter(p => p.trim());
  let formatted = '';

  paragraphs.forEach((p, i) => {
    if (i === 0) {
      formatted += `## Overview\n\n${p}\n\n`;
    } else if (p.startsWith('Key Moments:')) {
      formatted += `## ${p}\n\n`;
    } else if (p.startsWith('-')) {
      formatted += p + '\n\n';
    } else {
      formatted += p + '\n\n';
    }
  });

  return formatted;
};

// Improve article with Apple Intelligence Writing Tools
export const improveArticle = async (
  article: Article,
  action: 'proofread' | 'rewrite' | 'shorten' | 'elaborate' = 'proofread'
): Promise<Article> => {
  if (!apple.isAvailable()) {
    return { ...article, status: 'polished' };
  }

  const actionPrompts = {
    proofread: 'Proofread and fix any grammar, spelling, or punctuation errors in the following article. Maintain the original meaning and style.',
    rewrite: 'Rewrite the following article for improved clarity and flow while preserving the key information and quotes.',
    shorten: 'Condense the following article to be more concise while preserving the most important information and key quotes.',
    elaborate: 'Expand the following article with more detail and context while maintaining the original structure.',
  };

  try {
    const { text: improvedContent } = await generateText({
      model: apple() as any,
      prompt: `${actionPrompts[action]}

Article:
${article.content}`,
      temperature: action === 'proofread' ? 0.2 : 0.5,
    });

    return {
      ...article,
      content: improvedContent,
      status: 'polished',
    };
  } catch (error) {
    console.error('Article improvement error:', error);
    return { ...article, status: 'polished' };
  }
};

// Stream article generation for real-time display
export const streamArticleGeneration = async (
  entries: JournalEntry[],
  onChunk: (text: string) => void,
  options: Partial<ArticleGenerationOptions> = {}
): Promise<void> => {
  if (!apple.isAvailable()) {
    throw new Error('Apple Intelligence is not available on this device.');
  }

  const opts = { ...DEFAULT_OPTIONS, ...options };
  const rawContent = entries.map(combineEntryContent).join('\n---\n');

  const styleGuide = {
    formal: 'Use formal, professional language appropriate for a business report.',
    casual: 'Use conversational, approachable language while maintaining clarity.',
    journalistic: 'Use engaging journalistic style with a strong narrative flow.',
  };

  const { streamText } = await import('ai');
  const result = streamText({
    model: apple(),
    prompt: `Transform these interview notes into a well-structured article. ${styleGuide[opts.style]}

${opts.includeQuotes ? 'Include direct quotes from interviewees where impactful.' : 'Paraphrase rather than using direct quotes.'}

Format the article with markdown headings (##) for sections.

Interview Notes:
${rawContent}`,
    temperature: 0.6,
  });

  for await (const chunk of (await result).textStream) {
    onChunk(chunk);
  }
};
