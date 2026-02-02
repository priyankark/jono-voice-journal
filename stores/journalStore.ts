import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import {
  JournalEntry,
  Article,
  WeeklyTrend,
  Conversation,
  ConversationMessage,
  ConversationCompact,
  PersonalInsight,
  SearchResult,
  SearchFilters,
  InterventionLibrary,
  Intervention,
  InterventionFeedback,
  InterventionPattern,
} from '../types';
import { extractPatterns, calculateEffectiveness } from '../services/interventionLibraryService';

interface JournalState {
  entries: JournalEntry[];
  articles: Article[];
  weeklyTrends: WeeklyTrend[];
  conversations: Conversation[];
  activeConversationId: string | null;
  insights: PersonalInsight[];
  interventionLibrary: InterventionLibrary;

  // Entry actions
  addEntry: (entry: JournalEntry) => void;
  updateEntry: (id: string, updates: Partial<JournalEntry>) => void;
  deleteEntry: (id: string) => void;
  getEntry: (id: string) => JournalEntry | undefined;
  getEntriesForDate: (date: Date) => JournalEntry[];
  getEntriesForWeek: (weekStart: Date) => JournalEntry[];

  // Article actions
  addArticle: (article: Article) => void;
  updateArticle: (id: string, updates: Partial<Article>) => void;
  deleteArticle: (id: string) => void;

  // Trend actions
  addWeeklyTrend: (trend: WeeklyTrend) => void;
  getLatestTrend: () => WeeklyTrend | undefined;

  // Conversation actions
  createConversation: () => string;
  addMessage: (conversationId: string, message: Omit<ConversationMessage, 'id' | 'timestamp'>) => void;
  endConversation: (conversationId: string, summary?: string) => void;
  getConversation: (id: string) => Conversation | undefined;
  getActiveConversation: () => Conversation | undefined;
  setActiveConversation: (id: string | null) => void;
  convertConversationToEntry: (conversationId: string, tags?: string[]) => JournalEntry | null;
  deleteConversation: (id: string) => void;
  updateConversationCompacted: (conversationId: string, compacted: ConversationCompact) => void;
  updateConversationThemes: (conversationId: string, themes: string[]) => void;

  // Insight actions
  addInsight: (insight: PersonalInsight) => void;
  setInsights: (insights: PersonalInsight[]) => void;
  clearInsights: () => void;

  // Intervention library actions
  trackIntervention: (intervention: Omit<Intervention, 'id'>) => void;
  addInterventionFeedback: (interventionId: string, feedback: Partial<InterventionFeedback>) => void;
  getInterventionPatterns: () => InterventionPattern[];
  updateInterventionPatterns: () => Promise<void>;
  getInterventionLibrary: () => InterventionLibrary;

  // Search actions
  searchEntries: (query: string, filters?: SearchFilters) => SearchResult[];
  getAllTags: () => string[];
}

export const useJournalStore = create<JournalState>()(
  persist(
    (set, get) => ({
      entries: [],
      articles: [],
      weeklyTrends: [],
      conversations: [],
      activeConversationId: null,
      insights: [],
      interventionLibrary: {
        interventions: [],
        patterns: [],
        userPreferences: {
          preferredApproaches: [],
          avoidedApproaches: [],
        },
      },

      // === Entry Actions ===
      addEntry: (entry) => set((state) => ({
        entries: [entry, ...state.entries]
      })),

      updateEntry: (id, updates) => set((state) => ({
        entries: state.entries.map((e) =>
          e.id === id ? { ...e, ...updates, updatedAt: new Date() } : e
        )
      })),

      deleteEntry: (id) => set((state) => ({
        entries: state.entries.filter((e) => e.id !== id)
      })),

      getEntry: (id) => get().entries.find((e) => e.id === id),

      getEntriesForDate: (date) => {
        const dateStr = date.toDateString();
        return get().entries.filter(
          (e) => new Date(e.date).toDateString() === dateStr
        );
      },

      getEntriesForWeek: (weekStart) => {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        return get().entries.filter((e) => {
          const entryDate = new Date(e.date);
          return entryDate >= weekStart && entryDate < weekEnd;
        });
      },

      // === Article Actions ===
      addArticle: (article) => set((state) => ({
        articles: [article, ...state.articles]
      })),

      updateArticle: (id, updates) => set((state) => ({
        articles: state.articles.map((a) =>
          a.id === id ? { ...a, ...updates } : a
        )
      })),

      deleteArticle: (id) => set((state) => ({
        articles: state.articles.filter((a) => a.id !== id)
      })),

      // === Trend Actions ===
      addWeeklyTrend: (trend) => set((state) => ({
        weeklyTrends: [trend, ...state.weeklyTrends]
      })),

      getLatestTrend: () => get().weeklyTrends[0],

      // === Conversation Actions ===
      createConversation: () => {
        const id = Crypto.randomUUID();
        const conversation: Conversation = {
          id,
          messages: [],
          startedAt: new Date(),
        };
        set((state) => ({
          conversations: [conversation, ...state.conversations],
          activeConversationId: id,
        }));
        return id;
      },

      addMessage: (conversationId, message) => {
        const fullMessage: ConversationMessage = {
          ...message,
          id: Crypto.randomUUID(),
          timestamp: new Date(),
        };
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? { ...c, messages: [...c.messages, fullMessage] }
              : c
          ),
        }));
      },

      endConversation: (conversationId, summary) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? { ...c, endedAt: new Date(), summary }
              : c
          ),
          activeConversationId:
            state.activeConversationId === conversationId
              ? null
              : state.activeConversationId,
        }));
      },

      getConversation: (id) => get().conversations.find((c) => c.id === id),

      getActiveConversation: () => {
        const { activeConversationId, conversations } = get();
        if (!activeConversationId) return undefined;
        return conversations.find((c) => c.id === activeConversationId);
      },

      setActiveConversation: (id) => set({ activeConversationId: id }),

      convertConversationToEntry: (conversationId, tags = []) => {
        const conversation = get().conversations.find((c) => c.id === conversationId);
        if (!conversation || conversation.messages.length === 0) return null;

        // Combine all messages into text notes
        const textNotes = conversation.messages
          .map((m) => {
            const prefix = m.role === 'user' ? 'Me' : 'Assistant';
            return `${prefix}: ${m.content}`;
          })
          .join('\n\n');

        // Create entry from conversation
        const entry: JournalEntry = {
          id: Crypto.randomUUID(),
          date: new Date(),
          tags: tags.length > 0 ? tags : conversation.tags || [],
          textNotes,
          keyMoments: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          fromConversationId: conversationId,
        };

        // Add entry and update conversation
        set((state) => ({
          entries: [entry, ...state.entries],
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? { ...c, convertedToEntryId: entry.id, endedAt: new Date() }
              : c
          ),
          activeConversationId: null,
        }));

        return entry;
      },

      deleteConversation: (id) => set((state) => ({
        conversations: state.conversations.filter((c) => c.id !== id),
        activeConversationId:
          state.activeConversationId === id ? null : state.activeConversationId,
      })),

      updateConversationCompacted: (conversationId, compacted) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId ? { ...c, compacted } : c
          ),
        }));
      },

      updateConversationThemes: (conversationId, themes) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId ? { ...c, discussedThemes: themes } : c
          ),
        }));
      },

      // === Insight Actions ===
      addInsight: (insight) => set((state) => ({
        insights: [insight, ...state.insights],
      })),

      setInsights: (insights) => set({ insights }),

      clearInsights: () => set({ insights: [] }),

      // === Intervention Library Actions ===
      trackIntervention: (intervention) => {
        const fullIntervention: Intervention = {
          ...intervention,
          id: Crypto.randomUUID(),
        };

        set((state) => ({
          interventionLibrary: {
            ...state.interventionLibrary,
            interventions: [fullIntervention, ...state.interventionLibrary.interventions].slice(0, 500), // Keep last 500
          },
        }));
      },

      addInterventionFeedback: (interventionId, feedback) => {
        set((state) => {
          const updatedInterventions = state.interventionLibrary.interventions.map((intervention) => {
            if (intervention.id === interventionId) {
              const completeFeedback: InterventionFeedback = {
                timestamp: feedback.timestamp || new Date(),
                type: feedback.type || 'immediate',
                userEngagement: feedback.userEngagement || 'low',
                emotionalShift: feedback.emotionalShift || 'neutral',
                insightReported: feedback.insightReported || false,
                actionTaken: feedback.actionTaken || false,
                userRating: feedback.userRating,
              };

              // Calculate effectiveness score
              const effectiveness = calculateEffectiveness(completeFeedback);

              return {
                ...intervention,
                feedback: completeFeedback,
                effectiveness,
              };
            }
            return intervention;
          });

          return {
            interventionLibrary: {
              ...state.interventionLibrary,
              interventions: updatedInterventions,
            },
          };
        });
      },

      getInterventionPatterns: () => {
        return get().interventionLibrary.patterns;
      },

      updateInterventionPatterns: async () => {
        const library = get().interventionLibrary;
        const newPatterns = extractPatterns(library.interventions);

        set((state) => ({
          interventionLibrary: {
            ...state.interventionLibrary,
            patterns: newPatterns,
          },
        }));
      },

      getInterventionLibrary: () => {
        return get().interventionLibrary;
      },

      // === Search Actions ===
      searchEntries: (query, filters) => {
        const results: SearchResult[] = [];
        const lowerQuery = query.toLowerCase().trim();

        if (!lowerQuery) return results;

        const { entries, conversations, articles } = get();

        // Search entries
        if (!filters?.types || filters.types.includes('entry')) {
          entries.forEach((entry) => {
            // Check date filter
            if (filters?.dateRange) {
              const entryDate = new Date(entry.date);
              if (entryDate < filters.dateRange.start || entryDate > filters.dateRange.end) {
                return;
              }
            }

            // Check tag filter
            if (filters?.tags && filters.tags.length > 0) {
              if (!filters.tags.some((tag) => entry.tags.includes(tag))) {
                return;
              }
            }

            // Search content
            const searchableContent = [
              entry.textNotes,
              entry.voiceRecording?.transcription,
              entry.interviewee,
              entry.context,
              ...entry.keyMoments.map((km) => km.note),
            ]
              .filter(Boolean)
              .join(' ')
              .toLowerCase();

            if (searchableContent.includes(lowerQuery)) {
              const matchIndex = searchableContent.indexOf(lowerQuery);
              const matchStart = Math.max(0, matchIndex - 30);
              const matchEnd = Math.min(searchableContent.length, matchIndex + lowerQuery.length + 30);
              const matchedText = searchableContent.slice(matchStart, matchEnd);

              results.push({
                type: 'entry',
                id: entry.id,
                title: entry.context || entry.interviewee || 'Journal Entry',
                preview: entry.textNotes?.slice(0, 100) || entry.voiceRecording?.transcription?.slice(0, 100) || '',
                matchedText: `...${matchedText}...`,
                score: 1,
                date: new Date(entry.date),
                tags: entry.tags,
              });
            }
          });
        }

        // Search conversations
        if (!filters?.types || filters.types.includes('conversation')) {
          conversations.forEach((conv) => {
            const content = conv.messages.map((m) => m.content).join(' ').toLowerCase();
            if (content.includes(lowerQuery)) {
              const matchIndex = content.indexOf(lowerQuery);
              const matchStart = Math.max(0, matchIndex - 30);
              const matchEnd = Math.min(content.length, matchIndex + lowerQuery.length + 30);

              results.push({
                type: 'conversation',
                id: conv.id,
                title: conv.summary || 'Conversation',
                preview: conv.messages[0]?.content.slice(0, 100) || '',
                matchedText: `...${content.slice(matchStart, matchEnd)}...`,
                score: 0.8,
                date: new Date(conv.startedAt),
                tags: conv.tags,
              });
            }
          });
        }

        // Search articles
        if (!filters?.types || filters.types.includes('article')) {
          articles.forEach((article) => {
            const content = `${article.title} ${article.content} ${article.summary}`.toLowerCase();
            if (content.includes(lowerQuery)) {
              const matchIndex = content.indexOf(lowerQuery);
              const matchStart = Math.max(0, matchIndex - 30);
              const matchEnd = Math.min(content.length, matchIndex + lowerQuery.length + 30);

              results.push({
                type: 'article',
                id: article.id,
                title: article.title,
                preview: article.summary.slice(0, 100),
                matchedText: `...${content.slice(matchStart, matchEnd)}...`,
                score: 0.9,
                date: new Date(article.createdAt),
              });
            }
          });
        }

        // Sort by score descending
        return results.sort((a, b) => b.score - a.score);
      },

      getAllTags: () => {
        const { entries, conversations } = get();
        const tagSet = new Set<string>();

        entries.forEach((e) => e.tags.forEach((t) => tagSet.add(t)));
        conversations.forEach((c) => c.tags?.forEach((t) => tagSet.add(t)));

        return Array.from(tagSet).sort();
      },
    }),
    {
      name: 'journal-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
