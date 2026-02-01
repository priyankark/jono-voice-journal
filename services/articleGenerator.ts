import { JournalEntry, Article } from '../types';
import * as Crypto from 'expo-crypto';
import { apple, foundationModels } from '@react-native-ai/apple';
import { generateText, streamText } from 'ai';
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

  // Extract key quotes using AI
  const keyQuotes = await extractKeyQuotes(rawContent);

  if (!foundationModels.isAvailable()) {
    // Fallback without AI
    return generateArticleFallback(entries, rawContent, interviewees, keyQuotes, opts);
  }

  try {
    // Generate title using AI
    const { text: title } = await generateText({
      model: apple(),
      prompt: `Create a compelling, concise article title for the following interview notes. The title should be engaging and capture the main theme. Only return the title, nothing else.

Interviewees: ${interviewees.length > 0 ? interviewees.join(', ') : 'Anonymous'}

Notes:
${rawContent.slice(0, 1000)}`,
      temperature: 0.7,
    });

    // Generate summary using AI
    const { text: summary } = await generateText({
      model: apple(),
      prompt: `Write a 2-3 sentence executive summary of these interview notes. Focus on the key insights and takeaways.

Notes:
${rawContent.slice(0, 2000)}`,
      temperature: 0.5,
    });

    // Generate full article using AI
    const styleGuide = {
      formal: 'Use formal, professional language appropriate for a business report.',
      casual: 'Use conversational, approachable language while maintaining clarity.',
      journalistic: 'Use engaging journalistic style with a strong narrative flow.',
    };

    const { text: content } = await generateText({
      model: apple(),
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
  if (!foundationModels.isAvailable()) {
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
      model: apple(),
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
  if (!foundationModels.isAvailable()) {
    throw new Error('Apple Intelligence is not available on this device.');
  }

  const opts = { ...DEFAULT_OPTIONS, ...options };
  const rawContent = entries.map(combineEntryContent).join('\n---\n');

  const styleGuide = {
    formal: 'Use formal, professional language appropriate for a business report.',
    casual: 'Use conversational, approachable language while maintaining clarity.',
    journalistic: 'Use engaging journalistic style with a strong narrative flow.',
  };

  const result = streamText({
    model: apple(),
    prompt: `Transform these interview notes into a well-structured article. ${styleGuide[opts.style]}

${opts.includeQuotes ? 'Include direct quotes from interviewees where impactful.' : 'Paraphrase rather than using direct quotes.'}

Format the article with markdown headings (##) for sections.

Interview Notes:
${rawContent}`,
    temperature: 0.6,
  });

  for await (const chunk of result.textStream) {
    onChunk(chunk);
  }
};
