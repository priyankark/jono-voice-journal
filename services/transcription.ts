// Transcription service using expo-speech-recognition and Apple Intelligence
import { apple, foundationModels } from '@react-native-ai/apple';
import { generateText } from 'ai';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { Platform } from 'react-native';

export interface TranscriptionResult {
  text: string;
  confidence: number;
  segments?: {
    text: string;
    timestamp: number;
  }[];
}

// Check if Apple Intelligence LLM is available on this device
export const isAppleIntelligenceAvailable = (): boolean => {
  return foundationModels.isAvailable();
};

// Check if speech recognition is available
export const isSpeechRecognitionAvailable = (): boolean => {
  return ExpoSpeechRecognitionModule.isRecognitionAvailable();
};

// Transcribe audio file using expo-speech-recognition
export const transcribeAudio = async (audioUri: string): Promise<TranscriptionResult> => {
  if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
    throw new Error('Speech recognition is not available on this device.');
  }

  return new Promise((resolve, reject) => {
    let finalTranscript = '';
    let isComplete = false;

    const resultListener = ExpoSpeechRecognitionModule.addListener('result', (event) => {
      if (event.isFinal && event.results?.[0]) {
        finalTranscript = event.results[0].transcript;
      }
    });

    const endListener = ExpoSpeechRecognitionModule.addListener('end', () => {
      isComplete = true;
      cleanup();
      resolve({
        text: finalTranscript || '[No speech detected]',
        confidence: 0.95,
        segments: [],
      });
    });

    const errorListener = ExpoSpeechRecognitionModule.addListener('error', (event) => {
      cleanup();
      reject(new Error(event.error || 'Speech recognition failed'));
    });

    const cleanup = () => {
      resultListener.remove();
      endListener.remove();
      errorListener.remove();
    };

    // Start transcription from audio file
    ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      interimResults: false,
      requiresOnDeviceRecognition: Platform.OS === 'ios',
      audioSource: {
        uri: audioUri,
      },
    });

    // Timeout after 60 seconds
    setTimeout(() => {
      if (!isComplete) {
        ExpoSpeechRecognitionModule.stop();
        cleanup();
        reject(new Error('Transcription timed out'));
      }
    }, 60000);
  });
};

// Helper to extract key quotes from transcription using Apple Intelligence
export const extractKeyQuotes = async (text: string): Promise<string[]> => {
  if (!text.trim()) {
    return [];
  }

  if (!foundationModels.isAvailable()) {
    // Fallback to simple extraction if AI unavailable
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return sentences.slice(0, 5).map(s => s.trim());
  }

  try {
    const { text: quotesJson } = await generateText({
      model: apple(),
      prompt: `Extract the 5 most impactful and quotable statements from the following interview transcript. Return them as a JSON array of strings. Only return the JSON array, nothing else.

Transcript:
${text}`,
      temperature: 0.3,
    });

    const quotes = JSON.parse(quotesJson);
    return Array.isArray(quotes) ? quotes.slice(0, 5) : [];
  } catch {
    // Fallback to simple extraction
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return sentences.slice(0, 5).map(s => s.trim());
  }
};

// Analyze sentiment of text using Apple Intelligence
export const analyzeSentiment = async (text: string): Promise<'positive' | 'neutral' | 'negative'> => {
  if (!text.trim()) {
    return 'neutral';
  }

  if (!foundationModels.isAvailable()) {
    return analyzeSentimentFallback(text);
  }

  try {
    const { text: sentiment } = await generateText({
      model: apple(),
      prompt: `Analyze the overall sentiment of the following text. Respond with exactly one word: "positive", "neutral", or "negative".

Text:
${text}`,
      temperature: 0,
    });

    const result = sentiment.toLowerCase().trim();
    if (result === 'positive' || result === 'neutral' || result === 'negative') {
      return result;
    }
    return 'neutral';
  } catch {
    return analyzeSentimentFallback(text);
  }
};

// Fallback sentiment analysis using keyword matching
const analyzeSentimentFallback = (text: string): 'positive' | 'neutral' | 'negative' => {
  const positiveWords = ['great', 'excellent', 'amazing', 'love', 'happy', 'excited', 'wonderful'];
  const negativeWords = ['bad', 'terrible', 'hate', 'sad', 'angry', 'frustrated', 'disappointed'];

  const lowerText = text.toLowerCase();
  const positiveCount = positiveWords.filter(w => lowerText.includes(w)).length;
  const negativeCount = negativeWords.filter(w => lowerText.includes(w)).length;

  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
};

// React hook for live speech recognition
export { useSpeechRecognitionEvent };
