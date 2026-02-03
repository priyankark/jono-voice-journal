import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingState {
  hasCompletedOnboarding: boolean;
  currentStep: number;

  // Actions
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  setStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      hasCompletedOnboarding: false,
      currentStep: 0,

      completeOnboarding: () => set({
        hasCompletedOnboarding: true,
        currentStep: 0,
      }),

      resetOnboarding: () => set({
        hasCompletedOnboarding: false,
        currentStep: 0,
      }),

      setStep: (step) => set({ currentStep: step }),

      nextStep: () => set((state) => ({
        currentStep: state.currentStep + 1,
      })),

      previousStep: () => set((state) => ({
        currentStep: Math.max(0, state.currentStep - 1),
      })),
    }),
    {
      name: 'onboarding-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
