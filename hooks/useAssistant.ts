// useAssistant Hook - Simple assistant state and voice interaction
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { useJournalStore } from '../stores/journalStore';
import {
  generateFollowUp,
  speak,
  stopSpeaking,
  isSpeakingNow,
  getGreeting,
  isConversationSubstantial,
  synthesizeToEntry,
} from '../services/assistantService';
import { AssistantState, Conversation, JournalEntry } from '../types';

interface UseAssistantReturn {
  state: AssistantState;
  conversation: Conversation | undefined;
  liveTranscript: string;
  error: string | null;
  isListening: boolean;
  canSaveAsEntry: boolean;

  // Actions
  startListening: () => Promise<void>;
  stopListening: () => void;
  cancelListening: () => void;
  startNewConversation: () => void;
  saveAsEntry: () => Promise<JournalEntry | undefined>;
  endConversation: () => void;
}

export const useAssistant = (): UseAssistantReturn => {
  const [state, setState] = useState<AssistantState>('idle');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const isProcessingRef = useRef(false);
  const lastFinalTextRef = useRef<string | null>(null);
  const lastFinalAtRef = useRef<number>(0);

  const {
    createConversation,
    addMessage,
    getActiveConversation,
    endConversation: endConv,
    convertConversationToEntry,
    activeConversationId,
  } = useJournalStore();

  const conversation = getActiveConversation();
  const canSaveAsEntry = conversation ? isConversationSubstantial(conversation) : false;

  // Speech recognition event handlers
  useSpeechRecognitionEvent('result', (event) => {
    if (event.results?.[0]) {
      setLiveTranscript(event.results[0].transcript);

      if (event.isFinal && !isProcessingRef.current) {
        const finalText = event.results[0].transcript;
        const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
        const now = Date.now();
        const normalized = normalize(finalText);

        // Skip duplicates
        if (lastFinalTextRef.current && normalize(lastFinalTextRef.current) === normalized) {
          return;
        }

        if (
          lastFinalTextRef.current &&
          normalize(lastFinalTextRef.current) === normalized &&
          now - lastFinalAtRef.current < 2000
        ) {
          return;
        }

        if (finalText.trim()) {
          lastFinalTextRef.current = finalText;
          lastFinalAtRef.current = now;
          processUserMessage(finalText.trim());
        }
      }
    }
  });

  useSpeechRecognitionEvent('end', () => {
    if (state === 'listening') {
      setState('idle');
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    console.error('Speech recognition error:', event.error);
    setError(event.error || 'Speech recognition failed');
    setState('idle');
    setLiveTranscript('');
  });

  // Process user message and generate response
  const processUserMessage = useCallback(async (text: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    try {
      setLiveTranscript('');
      setState('thinking');

      // Ensure we have an active conversation
      let convId = activeConversationId;
      if (!convId) {
        convId = createConversation();
      }

      // Add user message
      addMessage(convId, {
        role: 'user',
        content: text,
      });

      // Get updated conversation
      const updatedConv = useJournalStore.getState().getConversation(convId);
      if (!updatedConv) {
        throw new Error('Conversation not found');
      }

      // Generate AI response
      const response = await generateFollowUp(updatedConv);

      // Add assistant message
      addMessage(convId, {
        role: 'assistant',
        content: response,
      });

      // Speak the response
      setState('speaking');
      await speak(response, () => {
        setState('idle');
      });
    } catch (err) {
      console.error('Error processing message:', err);
      setError('Failed to process your message');
      setState('idle');
    } finally {
      isProcessingRef.current = false;
    }
  }, [activeConversationId, createConversation, addMessage]);

  // Start listening for voice input
  const startListening = useCallback(async () => {
    try {
      if (isSpeakingNow()) {
        stopSpeaking();
      }

      const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!granted) {
        setError('Microphone permission required');
        return;
      }

      if (!activeConversationId) {
        createConversation();
      }

      setError(null);
      setLiveTranscript('');
      setState('listening');

      await ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: true,
        requiresOnDeviceRecognition: true,
      });
    } catch (err) {
      console.error('Failed to start listening:', err);
      setError('Failed to start voice recognition');
      setState('idle');
    }
  }, [activeConversationId, createConversation]);

  const stopListening = useCallback(() => {
    ExpoSpeechRecognitionModule.stop();
  }, []);

  const cancelListening = useCallback(() => {
    ExpoSpeechRecognitionModule.stop();
    setLiveTranscript('');
    setState('idle');
  }, []);

  const startNewConversation = useCallback(async () => {
    if (activeConversationId) {
      endConv(activeConversationId);
    }

    const newConvId = createConversation();

    const greeting = getGreeting();
    addMessage(newConvId, {
      role: 'assistant',
      content: greeting,
    });

    setState('speaking');
    await speak(greeting, () => {
      setState('idle');
    });

    lastFinalTextRef.current = null;
    lastFinalAtRef.current = 0;
  }, [activeConversationId, createConversation, addMessage, endConv]);

  const saveAsEntry = useCallback(async () => {
    if (!activeConversationId || !canSaveAsEntry) return;

    try {
      const conv = useJournalStore.getState().getConversation(activeConversationId);
      if (!conv) return;

      const { tags } = await synthesizeToEntry(conv);
      const entry = convertConversationToEntry(activeConversationId, tags);

      if (entry) {
        return entry;
      }
    } catch (err) {
      console.error('Failed to save as entry:', err);
      setError('Failed to save conversation');
    }
  }, [activeConversationId, canSaveAsEntry, convertConversationToEntry]);

  const endConversation = useCallback(() => {
    if (activeConversationId) {
      endConv(activeConversationId);
    }
    setState('idle');
    setLiveTranscript('');
    stopSpeaking();
    lastFinalTextRef.current = null;
    lastFinalAtRef.current = 0;
  }, [activeConversationId, endConv]);

  useEffect(() => {
    return () => {
      stopSpeaking();
      ExpoSpeechRecognitionModule.stop();
    };
  }, []);

  return {
    state,
    conversation,
    liveTranscript,
    error,
    isListening: state === 'listening',
    canSaveAsEntry,
    startListening,
    stopListening,
    cancelListening,
    startNewConversation,
    saveAsEntry,
    endConversation,
  };
};
