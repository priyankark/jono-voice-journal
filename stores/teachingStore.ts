import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type TeachingTipId =
  | 'today_entry_tap'
  | 'capture_hold_record'
  | 'jono_tap_orb'
  | 'insights_generate'
  | 'library_search';

interface TeachingState {
  // Track which tips have been seen
  seenTips: Record<TeachingTipId, boolean>;

  // Actions
  markTipAsSeen: (tipId: TeachingTipId) => void;
  hasSeen: (tipId: TeachingTipId) => boolean;
  resetTips: () => void;
}

export const useTeachingStore = create<TeachingState>()(
  persist(
    (set, get) => ({
      seenTips: {
        today_entry_tap: false,
        capture_hold_record: false,
        jono_tap_orb: false,
        insights_generate: false,
        library_search: false,
      },

      markTipAsSeen: (tipId) => set((state) => ({
        seenTips: {
          ...state.seenTips,
          [tipId]: true,
        },
      })),

      hasSeen: (tipId) => get().seenTips[tipId] ?? false,

      resetTips: () => set({
        seenTips: {
          today_entry_tap: false,
          capture_hold_record: false,
          jono_tap_orb: false,
          insights_generate: false,
          library_search: false,
        },
      }),
    }),
    {
      name: 'teaching-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Teaching tip content configuration
export const TEACHING_TIPS: Record<TeachingTipId, { title: string; message: string }> = {
  today_entry_tap: {
    title: 'View Details',
    message: 'Tap any entry to view details and transform it',
  },
  capture_hold_record: {
    title: 'Voice Recording',
    message: 'Hold to record, release to stop',
  },
  jono_tap_orb: {
    title: 'Talk to Jono',
    message: 'Tap the orb to start a conversation',
  },
  insights_generate: {
    title: 'AI Insights',
    message: 'Generate AI insights after a few entries',
  },
  library_search: {
    title: 'Search',
    message: 'Search across all your thoughts',
  },
};
