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
    padding: 24,
    backgroundColor: JonoTheme.colors.background.card,
    borderRadius: JonoTheme.borderRadius.lg,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: JonoTheme.colors.border.light,
    ...JonoTheme.shadows.soft,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  indicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: JonoTheme.colors.border.medium,
    marginRight: 12,
  },
  indicatorActive: {
    backgroundColor: JonoTheme.colors.recording.active,
  },
  timer: {
    fontSize: 48,
    fontWeight: '300',
    color: JonoTheme.colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  recordButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: JonoTheme.colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...JonoTheme.shadows.medium,
  },
  recordIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: JonoTheme.colors.text.inverse,
  },
  stopButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: JonoTheme.colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...JonoTheme.shadows.medium,
  },
  stopIcon: {
    width: 24,
    height: 24,
    backgroundColor: JonoTheme.colors.text.inverse,
    borderRadius: 4,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: JonoTheme.colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: JonoTheme.colors.border.light,
  },
  controlText: {
    fontSize: 24,
    color: JonoTheme.colors.text.primary,
  },
  statusText: {
    marginTop: 20,
    fontSize: 14,
    color: JonoTheme.colors.text.secondary,
    fontWeight: '500',
  },
});
