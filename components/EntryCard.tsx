// EntryCard - Warm styled journal entry card
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { JournalEntry } from '../types';
import { formatTime, formatDuration } from '../utils/dateHelpers';
import { JonoTheme } from '../constants/theme';

interface EntryCardProps {
  entry: JournalEntry;
  onPress: () => void;
  onDistill?: () => void;
}

export const EntryCard: React.FC<EntryCardProps> = ({ entry, onPress, onDistill }) => {
  const hasRecording = !!entry.voiceRecording;
  const hasNotes = !!entry.textNotes;
  const preview = entry.textNotes?.slice(0, 100) || entry.voiceRecording?.transcription?.slice(0, 100) || '';
  const displayTitle = entry.context || entry.interviewee;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {displayTitle && (
            <Text style={styles.title}>{displayTitle}</Text>
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
              <Text style={styles.tagText} numberOfLines={1}>{tag}</Text>
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
          <Text style={styles.distillText}>Transform to Article</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: JonoTheme.colors.background.card,
    borderRadius: JonoTheme.borderRadius.lg,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: JonoTheme.colors.border.light,
    ...JonoTheme.shadows.soft,
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
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: JonoTheme.colors.text.primary,
    marginBottom: 4,
  },
  time: {
    fontSize: 13,
    color: JonoTheme.colors.text.tertiary,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: JonoTheme.colors.accent.muted,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: JonoTheme.borderRadius.md,
    gap: 4,
  },
  badgeIcon: {
    fontSize: 12,
  },
  badgeText: {
    fontSize: 12,
    color: JonoTheme.colors.text.secondary,
    fontVariant: ['tabular-nums'],
  },
  preview: {
    fontSize: 14,
    color: JonoTheme.colors.text.secondary,
    lineHeight: 21,
    marginBottom: 10,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  tag: {
    backgroundColor: JonoTheme.colors.accent.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: JonoTheme.borderRadius.full,
    maxWidth: 120,
  },
  tagText: {
    fontSize: 12,
    color: JonoTheme.colors.text.inverse,
    fontWeight: '500',
  },
  momentCount: {
    fontSize: 12,
    color: JonoTheme.colors.text.tertiary,
  },
  distillButton: {
    marginTop: 14,
    paddingVertical: 14,
    backgroundColor: JonoTheme.colors.accent.secondary,
    borderRadius: JonoTheme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    ...JonoTheme.shadows.soft,
  },
  distillText: {
    color: JonoTheme.colors.text.inverse,
    fontWeight: '600',
    fontSize: 15,
  },
});
