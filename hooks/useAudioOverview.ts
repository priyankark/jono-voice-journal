// useAudioOverview Hook - Manages audio overview state and playback
import { useState, useCallback, useEffect, useRef } from 'react';
import {
  playAudioOverview,
  stopAudioOverview,
  isPlaying as checkIsPlaying,
} from '../services/audioOverviewService';
import { PersonalInsight, AudioOverviewState } from '../types';

interface UseAudioOverviewReturn {
  isGenerating: boolean;
  isPlaying: boolean;
  error: string | null;
  currentScript: string | null;
  play: (insights: PersonalInsight[]) => Promise<void>;
  stop: () => void;
}

export const useAudioOverview = (): UseAudioOverviewReturn => {
  const [state, setState] = useState<AudioOverviewState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [currentScript, setCurrentScript] = useState<string | null>(null);
  const isMounted = useRef(true);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const play = useCallback(async (insights: PersonalInsight[]) => {
    // Debounce rapid taps
    if (debounceRef.current) {
      return;
    }
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
    }, 300);

    // Prevent starting if already playing or generating
    if (state === 'generating' || state === 'playing') {
      return;
    }

    setError(null);
    setState('generating');

    await playAudioOverview(
      insights,
      // onStart
      () => {
        if (isMounted.current) {
          setState('playing');
        }
      },
      // onComplete
      () => {
        if (isMounted.current) {
          setState('idle');
          setCurrentScript(null);
        }
      },
      // onError
      (errorMsg) => {
        if (isMounted.current) {
          setError(errorMsg);
          setState('error');
        }
      }
    );
  }, [state]);

  const stop = useCallback(() => {
    stopAudioOverview();
    setState('idle');
    setCurrentScript(null);
  }, []);

  // Cleanup on unmount - stop playback
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (checkIsPlaying()) {
        stopAudioOverview();
      }
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    isGenerating: state === 'generating',
    isPlaying: state === 'playing',
    error,
    currentScript,
    play,
    stop,
  };
};
