import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useVoiceRecording } from '../hooks/useVoiceRecording';
import { formatDuration } from '../utils/dateHelpers';

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
    padding: 20,
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    marginVertical: 10,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  indicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#444',
    marginRight: 10,
  },
  indicatorActive: {
    backgroundColor: '#ff4444',
  },
  timer: {
    fontSize: 48,
    fontWeight: '300',
    color: '#fff',
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
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
  },
  stopButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopIcon: {
    width: 24,
    height: 24,
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlText: {
    fontSize: 24,
    color: '#fff',
  },
  statusText: {
    marginTop: 16,
    fontSize: 14,
    color: '#888',
  },
});
