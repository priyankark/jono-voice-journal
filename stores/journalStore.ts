import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { JournalEntry, Article, WeeklyTrend } from '../types';

interface JournalState {
  entries: JournalEntry[];
  articles: Article[];
  weeklyTrends: WeeklyTrend[];

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
}

export const useJournalStore = create<JournalState>()(
  persist(
    (set, get) => ({
      entries: [],
      articles: [],
      weeklyTrends: [],

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

      addWeeklyTrend: (trend) => set((state) => ({
        weeklyTrends: [trend, ...state.weeklyTrends]
      })),

      getLatestTrend: () => get().weeklyTrends[0],
    }),
    {
      name: 'journal-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
