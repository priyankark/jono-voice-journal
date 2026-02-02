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
  mood?: string;  // Optional mood/emotional state
}

export type ContentType = 'article' | 'poem' | 'letter' | 'gratitude' | 'lessons' | 'story' | 'affirmations' | 'mantra' | 'reflection' | 'custom';

export interface Article {
  id: string;
  entryIds: string[];
  title: string;
  content: string;
  keyQuotes: string[];
  summary: string;
  status: 'draft' | 'polished' | 'published';
  createdAt: Date;
  generationPrompt?: string;  // Custom prompt used to generate this article
  generationType?: 'standard' | 'custom';  // How this article was generated
  contentType?: ContentType;  // Type of content (maps to preset ID or 'article'/'custom')
}

// Preset prompt templates for quick content generation
export interface PromptTemplate {
  id: string;
  label: string;
  prompt: string;
  icon: string;
  description?: string;  // Longer description for UI hints
  temperature?: number;  // Optimal AI temperature for this preset
  style?: 'poetic' | 'conversational' | 'reflective' | 'narrative' | 'grounded';
}

export const PRESET_PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'poem',
    label: 'Poem',
    prompt: 'Transform these thoughts and feelings into a reflective poem that crystallizes the emotional essence of this moment in my life. Use vivid imagery, metaphor, and rhythm to give shape to what might be hard to say directly. Let the poem breathe with white space and create moments of resonance.',
    icon: '🎭',
    description: 'Create a poem that captures your emotions through imagery and rhythm',
    temperature: 0.8,
    style: 'poetic',
  },
  {
    id: 'letter-future',
    label: 'Letter to Future Self',
    prompt: 'Write a warm, honest letter to my future self that captures where I am right now - my hopes, struggles, lessons, and what I want to remember about this chapter of my life. Be specific about details that matter today. Include both the challenges I am facing and the strength I am finding. End with what I hope for the person I am becoming.',
    icon: '💌',
    description: 'A time capsule letter for your future self to discover',
    temperature: 0.6,
    style: 'conversational',
  },
  {
    id: 'gratitude',
    label: 'Gratitude List',
    prompt: 'Help me recognize and articulate the gratitude hidden in these thoughts - not just surface thankfulness, but deep appreciation for what enriches my life. Look beyond the obvious to find gratitude in small moments, in challenges that taught me something, in people who showed up, in my own resilience. Frame each item with WHY it matters.',
    icon: '🙏',
    description: 'Discover and celebrate what you have to be grateful for',
    temperature: 0.4,
    style: 'grounded',
  },
  {
    id: 'lessons',
    label: 'Life Lessons',
    prompt: 'Distill the wisdom from my experiences into clear, actionable life lessons that I can carry forward - insights that feel earned and true. Each lesson should be specific enough to apply and universal enough to remember. Include the context that made each lesson real for me. These should feel like hard-won truths, not generic advice.',
    icon: '📚',
    description: 'Extract meaningful wisdom from your experiences',
    temperature: 0.5,
    style: 'reflective',
  },
  {
    id: 'story',
    label: 'Short Story',
    prompt: 'Use the emotional truth of my experiences as raw material to craft a short story - transform the real into something fictional yet deeply true. Create a character navigating themes similar to mine. Build a scene with sensory details and tension. Let the story arrive at insight without stating it directly. Make it feel like a complete piece with a beginning, middle, and emotionally resonant end.',
    icon: '📖',
    description: 'Turn your experiences into creative fiction',
    temperature: 0.85,
    style: 'narrative',
  },
  {
    id: 'affirmations',
    label: 'Affirmations',
    prompt: 'Create personal affirmations rooted in my actual experiences and growth - statements I can believe because they reflect who I am becoming. Ground each affirmation in evidence from my own life. Make them present-tense declarations that acknowledge both where I am and where I am headed. They should feel true, not aspirational lies.',
    icon: '✨',
    description: 'Build confidence with affirmations based on your real strengths',
    temperature: 0.7,
    style: 'grounded',
  },
  {
    id: 'mantra',
    label: 'Personal Mantra',
    prompt: 'Distill the essence of these thoughts into a single, powerful personal mantra - a phrase I can return to when I need grounding. It should capture the core truth I am learning, be rhythmic and memorable, and resonate with my authentic voice. Give me 3 options with explanations of why each might serve me.',
    icon: '🕉️',
    description: 'Create a powerful phrase to return to in difficult moments',
    temperature: 0.65,
    style: 'poetic',
  },
  {
    id: 'reflection',
    label: 'Deep Reflection',
    prompt: 'Guide me through a deeper exploration of what these thoughts reveal about who I am and what I value. Ask the questions I might be avoiding. Connect the dots I have not seen. Honor the complexity without rushing to resolution. This should feel like a conversation with a wise friend who knows me well.',
    icon: '🔮',
    description: 'Explore the deeper meaning behind your thoughts',
    temperature: 0.55,
    style: 'reflective',
  },
];

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

// === Content Library Types ===

export type ContentSortOption = 'newest' | 'oldest' | 'title' | 'status';
export type ContentFilterStatus = 'all' | 'draft' | 'polished' | 'published';

export interface ContentLibraryFilters {
  status: ContentFilterStatus;
  sortBy: ContentSortOption;
  searchQuery: string;
}
