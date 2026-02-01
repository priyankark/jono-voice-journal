import { useState, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { RecordingStatus } from '../types';

interface UseVoiceRecordingReturn {
  status: RecordingStatus;
  duration: number;
  uri: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  pauseRecording: () => Promise<void>;
  resumeRecording: () => Promise<void>;
  playRecording: () => Promise<void>;
  deleteRecording: () => Promise<void>;
}

export const useVoiceRecording = (): UseVoiceRecordingReturn => {
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [duration, setDuration] = useState(0);
  const [uri, setUri] = useState<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync();
      }
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        throw new Error('Microphone permission not granted');
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setStatus('recording');
      setDuration(0);

      intervalRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  };

  const stopRecording = async (): Promise<string | null> => {
    try {
      if (!recordingRef.current) return null;

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      await recordingRef.current.stopAndUnloadAsync();
      const recordingUri = recordingRef.current.getURI();
      recordingRef.current = null;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      if (recordingUri) {
        setUri(recordingUri);
      }
      setStatus('stopped');

      return recordingUri;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      throw error;
    }
  };

  const pauseRecording = async () => {
    try {
      if (recordingRef.current && status === 'recording') {
        await recordingRef.current.pauseAsync();
        setStatus('paused');
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    } catch (error) {
      console.error('Failed to pause recording:', error);
      throw error;
    }
  };

  const resumeRecording = async () => {
    try {
      if (recordingRef.current && status === 'paused') {
        await recordingRef.current.startAsync();
        setStatus('recording');
        intervalRef.current = setInterval(() => {
          setDuration((d) => d + 1);
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to resume recording:', error);
      throw error;
    }
  };

  const playRecording = async () => {
    try {
      if (!uri) return;

      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync({ uri });
      soundRef.current = sound;
      await sound.playAsync();
    } catch (error) {
      console.error('Failed to play recording:', error);
      throw error;
    }
  };

  const deleteRecording = async () => {
    try {
      if (uri) {
        await FileSystem.deleteAsync(uri, { idempotent: true });
      }
      setUri(null);
      setDuration(0);
      setStatus('idle');
    } catch (error) {
      console.error('Failed to delete recording:', error);
      throw error;
    }
  };

  return {
    status,
    duration,
    uri,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    playRecording,
    deleteRecording,
  };
};
