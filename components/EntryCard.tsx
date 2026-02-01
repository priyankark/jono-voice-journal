import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { JournalEntry } from '../types';
import { formatTime, formatDuration } from '../utils/dateHelpers';

interface EntryCardProps {
  entry: JournalEntry;
  onPress: () => void;
  onDistill?: () => void;
}

export const EntryCard: React.FC<EntryCardProps> = ({ entry, onPress, onDistill }) => {
  const hasRecording = !!entry.voiceRecording;
  const hasNotes = !!entry.textNotes;
  const preview = entry.textNotes?.slice(0, 100) || entry.voiceRecording?.transcription?.slice(0, 100) || '';

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {entry.interviewee && (
            <Text style={styles.interviewee}>{entry.interviewee}</Text>
          )}
          <Text style={styles.time}>{formatTime(entry.createdAt)}</Text>
        </View>
        <View style={styles.badges}>
          {hasRecording && (
            <View style={styles.badge}>
              <Text style={styles.badgeIcon}>🎙</Text>
              <Text style={styles.badgeText}>
                {formatDuration(entry.voiceRecording!.duration)}
              </Text>
            </View>
          )}
          {hasNotes && (
            <View style={styles.badge}>
              <Text style={styles.badgeIcon}>📝</Text>
            </View>
          )}
        </View>
      </View>

      {preview && (
        <Text style={styles.preview} numberOfLines={2}>
          {preview}...
        </Text>
      )}

      {entry.tags.length > 0 && (
        <View style={styles.tags}>
          {entry.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {entry.keyMoments.length > 0 && (
        <Text style={styles.momentCount}>
          {entry.keyMoments.length} key moment{entry.keyMoments.length !== 1 ? 's' : ''}
        </Text>
      )}

      {onDistill && (
        <TouchableOpacity style={styles.distillButton} onPress={onDistill}>
          <Text style={styles.distillText}>Distill to Article</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  headerLeft: {
    flex: 1,
  },
  interviewee: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  time: {
    fontSize: 13,
    color: '#666',
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a4e',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  badgeIcon: {
    fontSize: 12,
  },
  badgeText: {
    fontSize: 12,
    color: '#888',
    fontVariant: ['tabular-nums'],
  },
  preview: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 20,
    marginBottom: 10,
  },
  tags: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  tag: {
    backgroundColor: '#4a4ae8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  momentCount: {
    fontSize: 12,
    color: '#666',
  },
  distillButton: {
    marginTop: 12,
    paddingVertical: 10,
    backgroundColor: '#4a4ae8',
    borderRadius: 8,
    alignItems: 'center',
  },
  distillText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
