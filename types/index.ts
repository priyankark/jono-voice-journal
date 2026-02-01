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
  interviewee?: string;
  tags: string[];
  voiceRecording?: VoiceRecording;
  textNotes: string;
  keyMoments: KeyMoment[];
  createdAt: Date;
  updatedAt: Date;
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
