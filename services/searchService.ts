// Search Service - Full-text search across journal content
import { JournalEntry, Article, Conversation, SearchResult, SearchFilters, SearchResultType } from '../types';

interface SearchableContent {
  type: SearchResultType;
  id: string;
  title: string;
  content: string;
  date: Date;
  tags?: string[];
  previewSource: string;
}

// Prepare searchable content from different sources
const prepareEntryForSearch = (entry: JournalEntry): SearchableContent => {
  const content = [
    entry.textNotes,
    entry.voiceRecording?.transcription,
    entry.context,
    entry.interviewee,
    ...entry.keyMoments.map((km) => km.note),
    ...entry.tags,
  ]
    .filter(Boolean)
    .join(' ');

  return {
    type: 'entry',
    id: entry.id,
    title: entry.context || entry.interviewee || 'Journal Entry',
    content,
    date: new Date(entry.date),
    tags: entry.tags,
    previewSource: entry.textNotes || entry.voiceRecording?.transcription || '',
  };
};

const prepareConversationForSearch = (conv: Conversation): SearchableContent => {
  const content = conv.messages.map((m) => m.content).join(' ');
  const firstUserMessage = conv.messages.find((m) => m.role === 'user')?.content || '';

  return {
    type: 'conversation',
    id: conv.id,
    title: conv.summary || 'Conversation',
    content,
    date: new Date(conv.startedAt),
    tags: conv.tags,
    previewSource: firstUserMessage,
  };
};

const prepareArticleForSearch = (article: Article): SearchableContent => {
  const content = `${article.title} ${article.content} ${article.summary} ${article.keyQuotes.join(' ')}`;

  return {
    type: 'article',
    id: article.id,
    title: article.title,
    content,
    date: new Date(article.createdAt),
    previewSource: article.summary,
  };
};

// Calculate relevance score based on match characteristics
const calculateScore = (content: string, query: string): number => {
  const lowerContent = content.toLowerCase();
  const lowerQuery = query.toLowerCase();

  let score = 0;

  // Exact match bonus
  if (lowerContent.includes(lowerQuery)) {
    score += 1;
  }

  // Title match bonus (higher weight)
  // This would require passing title separately, handled in search function

  // Multiple occurrence bonus
  const occurrences = (lowerContent.match(new RegExp(lowerQuery, 'g')) || []).length;
  score += Math.min(occurrences * 0.1, 0.5);

  // Word boundary match bonus
  const wordBoundaryRegex = new RegExp(`\\b${escapeRegex(lowerQuery)}\\b`, 'i');
  if (wordBoundaryRegex.test(lowerContent)) {
    score += 0.3;
  }

  return score;
};

// Escape special regex characters
const escapeRegex = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Extract match context for preview
const extractMatchContext = (content: string, query: string, contextLength: number = 60): string => {
  const lowerContent = content.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const matchIndex = lowerContent.indexOf(lowerQuery);

  if (matchIndex === -1) {
    return content.slice(0, contextLength * 2);
  }

  const start = Math.max(0, matchIndex - contextLength);
  const end = Math.min(content.length, matchIndex + query.length + contextLength);

  let result = content.slice(start, end);

  // Add ellipsis if truncated
  if (start > 0) result = '...' + result;
  if (end < content.length) result = result + '...';

  return result;
};

// Main search function
export const search = (
  entries: JournalEntry[],
  conversations: Conversation[],
  articles: Article[],
  query: string,
  filters?: SearchFilters
): SearchResult[] => {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return [];

  const results: SearchResult[] = [];
  const searchables: SearchableContent[] = [];

  // Prepare searchable content based on type filters
  const includeType = (type: SearchResultType): boolean => {
    return !filters?.types || filters.types.includes(type);
  };

  if (includeType('entry')) {
    entries.forEach((entry) => {
      // Apply date filter
      if (filters?.dateRange) {
        const entryDate = new Date(entry.date);
        if (entryDate < filters.dateRange.start || entryDate > filters.dateRange.end) {
          return;
        }
      }

      // Apply tag filter
      if (filters?.tags && filters.tags.length > 0) {
        if (!filters.tags.some((tag) => entry.tags.includes(tag))) {
          return;
        }
      }

      searchables.push(prepareEntryForSearch(entry));
    });
  }

  if (includeType('conversation')) {
    conversations.forEach((conv) => {
      if (filters?.dateRange) {
        const convDate = new Date(conv.startedAt);
        if (convDate < filters.dateRange.start || convDate > filters.dateRange.end) {
          return;
        }
      }

      if (filters?.tags && filters.tags.length > 0) {
        if (!conv.tags || !filters.tags.some((tag) => conv.tags?.includes(tag))) {
          return;
        }
      }

      searchables.push(prepareConversationForSearch(conv));
    });
  }

  if (includeType('article')) {
    articles.forEach((article) => {
      if (filters?.dateRange) {
        const articleDate = new Date(article.createdAt);
        if (articleDate < filters.dateRange.start || articleDate > filters.dateRange.end) {
          return;
        }
      }

      searchables.push(prepareArticleForSearch(article));
    });
  }

  // Search and score
  searchables.forEach((item) => {
    const lowerContent = item.content.toLowerCase();
    const lowerQuery = trimmedQuery.toLowerCase();

    if (lowerContent.includes(lowerQuery)) {
      let score = calculateScore(item.content, trimmedQuery);

      // Title match bonus
      if (item.title.toLowerCase().includes(lowerQuery)) {
        score += 0.5;
      }

      const matchedText = extractMatchContext(item.content, trimmedQuery);

      results.push({
        type: item.type,
        id: item.id,
        title: item.title,
        preview: item.previewSource.slice(0, 120),
        matchedText,
        score,
        date: item.date,
        tags: item.tags,
      });
    }
  });

  // Sort by score (descending), then by date (most recent first)
  return results.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return b.date.getTime() - a.date.getTime();
  });
};

// Highlight matching text in a string
export const highlightMatches = (text: string, query: string): { text: string; highlight: boolean }[] => {
  if (!query.trim()) {
    return [{ text, highlight: false }];
  }

  const parts: { text: string; highlight: boolean }[] = [];
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  let lastIndex = 0;

  let index = lowerText.indexOf(lowerQuery);
  while (index !== -1) {
    // Add non-matching part before the match
    if (index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, index), highlight: false });
    }

    // Add matching part
    parts.push({ text: text.slice(index, index + query.length), highlight: true });

    lastIndex = index + query.length;
    index = lowerText.indexOf(lowerQuery, lastIndex);
  }

  // Add remaining non-matching part
  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), highlight: false });
  }

  return parts.length > 0 ? parts : [{ text, highlight: false }];
};

// Get search suggestions based on recent searches and popular tags
export const getSearchSuggestions = (
  recentSearches: string[],
  allTags: string[],
  query: string
): string[] => {
  const suggestions: string[] = [];
  const lowerQuery = query.toLowerCase();

  // Filter recent searches that start with query
  recentSearches.forEach((search) => {
    if (search.toLowerCase().startsWith(lowerQuery) && !suggestions.includes(search)) {
      suggestions.push(search);
    }
  });

  // Filter tags that contain query
  allTags.forEach((tag) => {
    if (tag.toLowerCase().includes(lowerQuery) && !suggestions.includes(tag)) {
      suggestions.push(tag);
    }
  });

  return suggestions.slice(0, 5);
};
