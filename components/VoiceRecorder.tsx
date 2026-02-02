// VoiceRecorder - Warm styled voice recording component
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useVoiceRecording } from '../hooks/useVoiceRecording';
import { formatDuration } from '../utils/dateHelpers';
import { JonoTheme } from '../constants/theme';

interface VoiceRecorderProps {
  onRecordingComplete: (uri: string, duration: number) => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onRecordingComplete }) => {
  const {
    status,
    duration,
    uri,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    playRecording,
    deleteRecording,
  } = useVoiceRecording();

  const handleStop = async () => {
    const recordingUri = await stopRecording();
    if (recordingUri) {
      onRecordingComplete(recordingUri, duration);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.timerContainer}>
        <View style={[styles.indicator, status === 'recording' && styles.indicatorActive]} />
        <Text style={styles.timer}>{formatDuration(duration)}</Text>
      </View>

      <View style={styles.controls}>
        {status === 'idle' && (
          <TouchableOpacity style={styles.recordButton} onPress={startRecording}>
            <View style={styles.recordIcon} />
          </TouchableOpacity>
        )}

        {status === 'recording' && (
          <>
            <TouchableOpacity style={styles.controlButton} onPress={pauseRecording}>
              <Text style={styles.controlText}>⏸</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.stopButton} onPress={handleStop}>
              <View style={styles.stopIcon} />
            </TouchableOpacity>
          </>
        )}

        {status === 'paused' && (
          <>
            <TouchableOpacity style={styles.controlButton} onPress={resumeRecording}>
              <Text style={styles.controlText}>▶</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.stopButton} onPress={handleStop}>
              <View style={styles.stopIcon} />
            </TouchableOpacity>
          </>
        )}

        {status === 'stopped' && uri && (
          <>
            <TouchableOpacity style={styles.controlButton} onPress={playRecording}>
              <Text style={styles.controlText}>▶</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton} onPress={deleteRecording}>
              <Text style={styles.controlText}>🗑</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.recordButton} onPress={startRecording}>
              <View style={styles.recordIcon} />
            </TouchableOpacity>
          </>
        )}
      </View>

      <Text style={styles.statusText}>
        {status === 'idle' && 'Tap to start recording'}
        {status === 'recording' && 'Recording...'}
        {status === 'paused' && 'Paused'}
        {status === 'stopped' && 'Recording saved'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 28,
    backgroundColor: JonoTheme.colors.background.card,
    borderRadius: JonoTheme.borderRadius.xl,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: JonoTheme.colors.border.light,
    ...JonoTheme.shadows.medium,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  indicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: JonoTheme.colors.border.medium,
    marginRight: 14,
  },
  indicatorActive: {
    backgroundColor: JonoTheme.colors.recording.active,
    ...JonoTheme.shadows.soft,
  },
  timer: {
    fontSize: 52,
    fontWeight: '200',
    color: JonoTheme.colors.text.primary,
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: JonoTheme.colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: JonoTheme.colors.accent.muted,
    ...JonoTheme.shadows.strong,
  },
  recordIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: JonoTheme.colors.text.inverse,
  },
  stopButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: JonoTheme.colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: JonoTheme.colors.accent.muted,
    ...JonoTheme.shadows.strong,
  },
  stopIcon: {
    width: 28,
    height: 28,
    backgroundColor: JonoTheme.colors.text.inverse,
    borderRadius: 6,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: JonoTheme.colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: JonoTheme.colors.border.medium,
    ...JonoTheme.shadows.soft,
  },
  controlText: {
    fontSize: 26,
    color: JonoTheme.colors.text.primary,
  },
  statusText: {
    marginTop: 24,
    fontSize: 15,
    color: JonoTheme.colors.text.secondary,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});
