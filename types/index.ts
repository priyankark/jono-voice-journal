export interface VoiceRecording {
  uri: string;
  duration: number;
  transcription?: string;
}

export interface KeyMoment {
  timestamp: number;
  note: string;
}

export interface JournalEntry {
  id: string;
  date: Date;
  interviewee?: string;  // Legacy field - now called "context"
  context?: string;      // New field name for context/subject
  tags: string[];
  voiceRecording?: VoiceRecording;
  textNotes: string;
  keyMoments: KeyMoment[];
  createdAt: Date;
  updatedAt: Date;
  fromConversationId?: string;  // If created from assistant conversation
}

export interface Article {
  id: string;
  entryIds: string[];
  title: string;
  content: string;
  keyQuotes: string[];
  summary: string;
  status: 'draft' | 'polished' | 'published';
  createdAt: Date;
}

export interface ThemeCount {
  theme: string;
  count: number;
  entryIds: string[];
}

export interface TopQuote {
  quote: string;
  entryId: string;
  interviewee: string;
}

export interface WeeklyTrend {
  id: string;
  weekOf: Date;
  themes: ThemeCount[];
  sentimentOverview: {
    positive: number;
    neutral: number;
    negative: number;
  };
  topQuotes: TopQuote[];
  totalInterviews: number;
  totalMinutesRecorded: number;
}

export type RecordingStatus = 'idle' | 'recording' | 'paused' | 'stopped';

// === Assistant Mode Types ===

export type AssistantState = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audioUri?: string;  // For user messages with voice input
}

export interface Conversation {
  id: string;
  messages: ConversationMessage[];
  startedAt: Date;
  endedAt?: Date;
  summary?: string;           // AI-generated summary
  convertedToEntryId?: string; // If conversation was saved as entry
  tags?: string[];            // Auto-generated tags
}

// === Search Types ===

export type SearchResultType = 'entry' | 'conversation' | 'article';

export interface SearchResult {
  type: SearchResultType;
  id: string;
  title: string;
  preview: string;
  matchedText: string;
  score: number;
  date: Date;
  tags?: string[];
}

export interface SearchFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  tags?: string[];
  types?: SearchResultType[];
}

// === Insights Types ===

export type InsightType = 'pattern' | 'growth' | 'reflection' | 'suggestion';

export interface PersonalInsight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  relatedEntryIds: string[];
  createdAt: Date;
  icon?: string;  // Emoji icon for the insight
}

export interface ReflectionPrompt {
  id: string;
  prompt: string;
  category: 'emotional' | 'growth' | 'gratitude' | 'goals' | 'relationships';
  relatedToTheme?: string;
}

// === App State Types ===

export interface AppSettings {
  voiceEnabled: boolean;
  hapticFeedback: boolean;
  autoTranscribe: boolean;
  preferredVoice?: string;  // TTS voice preference
}
