import { useCallback, useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import {
  ExpoSpeechRecognitionModule,
} from 'expo-speech-recognition';
import { useOnboardingStore } from '../stores/onboardingStore';

export type PermissionStatus = 'undetermined' | 'granted' | 'denied';

interface UseOnboardingReturn {
  // State
  currentStep: number;
  totalSteps: number;
  isLastStep: boolean;
  isFirstStep: boolean;

  // Permission states
  microphonePermission: PermissionStatus;
  speechPermission: PermissionStatus;

  // Navigation
  goToStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  skipOnboarding: () => void;
  completeOnboarding: () => void;

  // Permissions
  requestMicrophonePermission: () => Promise<boolean>;
  requestSpeechPermission: () => Promise<boolean>;
  checkPermissions: () => Promise<void>;
}

const TOTAL_STEPS = 8;

export const useOnboarding = (): UseOnboardingReturn => {
  const router = useRouter();
  const {
    currentStep,
    setStep,
    nextStep: storeNextStep,
    previousStep: storePreviousStep,
    completeOnboarding: storeCompleteOnboarding,
  } = useOnboardingStore();

  const [microphonePermission, setMicrophonePermission] = useState<PermissionStatus>('undetermined');
  const [speechPermission, setSpeechPermission] = useState<PermissionStatus>('undetermined');

  const isLastStep = currentStep === TOTAL_STEPS - 1;
  const isFirstStep = currentStep === 0;

  // Check current permission status
  const checkPermissions = useCallback(async () => {
    try {
      // Check microphone permission
      const audioStatus = await Audio.getPermissionsAsync();
      if (audioStatus.granted) {
        setMicrophonePermission('granted');
      } else if (audioStatus.canAskAgain === false) {
        setMicrophonePermission('denied');
      } else {
        setMicrophonePermission('undetermined');
      }

      // Check speech recognition permission
      const speechStatus = await ExpoSpeechRecognitionModule.getPermissionsAsync();
      if (speechStatus.granted) {
        setSpeechPermission('granted');
      } else if (speechStatus.canAskAgain === false) {
        setSpeechPermission('denied');
      } else {
        setSpeechPermission('undetermined');
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  }, []);

  // Check permissions on mount
  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < TOTAL_STEPS) {
      setStep(step);
    }
  }, [setStep]);

  const nextStep = useCallback(() => {
    if (currentStep < TOTAL_STEPS - 1) {
      storeNextStep();
    }
  }, [currentStep, storeNextStep]);

  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      storePreviousStep();
    }
  }, [currentStep, storePreviousStep]);

  const skipOnboarding = useCallback(() => {
    storeCompleteOnboarding();
    router.replace('/(tabs)');
  }, [storeCompleteOnboarding, router]);

  const completeOnboarding = useCallback(() => {
    storeCompleteOnboarding();
    router.replace('/(tabs)');
  }, [storeCompleteOnboarding, router]);

  const requestMicrophonePermission = useCallback(async (): Promise<boolean> => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      setMicrophonePermission(granted ? 'granted' : 'denied');
      return granted;
    } catch (error) {
      console.error('Error requesting microphone permission:', error);
      setMicrophonePermission('denied');
      return false;
    }
  }, []);

  const requestSpeechPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      setSpeechPermission(granted ? 'granted' : 'denied');
      return granted;
    } catch (error) {
      console.error('Error requesting speech permission:', error);
      setSpeechPermission('denied');
      return false;
    }
  }, []);

  return {
    currentStep,
    totalSteps: TOTAL_STEPS,
    isLastStep,
    isFirstStep,

    microphonePermission,
    speechPermission,

    goToStep,
    nextStep,
    previousStep,
    skipOnboarding,
    completeOnboarding,

    requestMicrophonePermission,
    requestSpeechPermission,
    checkPermissions,
  };
};
