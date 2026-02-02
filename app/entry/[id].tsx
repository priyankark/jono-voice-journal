// Entry Detail Screen - Warm styled entry view
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useJournalStore } from '../../stores/journalStore';
import { formatDateTime, formatDuration } from '../../utils/dateHelpers';
import { JonoTheme } from '../../constants/theme';
import { TransformModal } from '../../components/TransformModal';
import { Article } from '../../types';

export default function EntryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { entries, updateEntry, deleteEntry, addArticle } = useJournalStore();

  const entry = entries.find(e => e.id === id);
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState(entry?.textNotes || '');
  const [showTransformModal, setShowTransformModal] = useState(false);

  if (!entry) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Entry not found</Text>
      </View>
    );
  }

  const displayTitle = entry.context || entry.interviewee;

  const handleSaveEdit = () => {
    updateEntry(entry.id, { textNotes: editedNotes });
    setIsEditing(false);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteEntry(entry.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleTransformSuccess = (article: Article) => {
    addArticle(article);
    Alert.alert('Content Created', 'Your entry has been transformed.', [
      { text: 'View', onPress: () => router.push('/articles') },
      { text: 'OK' },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        {displayTitle && (
          <Text style={styles.title}>{displayTitle}</Text>
        )}
        <Text style={styles.date}>{formatDateTime(entry.createdAt)}</Text>
      </View>

      {/* Tags */}
      {entry.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {entry.tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Recording */}
      {entry.voiceRecording && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recording</Text>
          <View style={styles.recordingCard}>
            <View style={styles.recordingInfo}>
              <Text style={styles.recordingIcon}>🎙</Text>
              <View>
                <Text style={styles.recordingDuration}>
                  {formatDuration(entry.voiceRecording.duration)}
                </Text>
                <Text style={styles.recordingLabel}>Audio captured</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.playButton}>
              <Text style={styles.playButtonText}>▶ Play</Text>
            </TouchableOpacity>
          </View>

          {entry.voiceRecording.transcription && (
            <View style={styles.transcriptionBox}>
              <Text style={styles.transcriptionLabel}>Transcription</Text>
              <Text style={styles.transcriptionText}>
                {entry.voiceRecording.transcription}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Notes */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
            <Text style={styles.editButton}>{isEditing ? 'Cancel' : 'Edit'}</Text>
          </TouchableOpacity>
        </View>

        {isEditing ? (
          <>
            <TextInput
              style={styles.editInput}
              value={editedNotes}
              onChangeText={setEditedNotes}
              multiline
              textAlignVertical="top"
            />
            <TouchableOpacity style={styles.saveEditButton} onPress={handleSaveEdit}>
              <Text style={styles.saveEditButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.notesText}>
            {entry.textNotes || 'No notes added'}
          </Text>
        )}
      </View>

      {/* Key Moments */}
      {entry.keyMoments.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Moments</Text>
          {entry.keyMoments.map((moment, index) => (
            <View key={index} style={styles.momentItem}>
              <Text style={styles.momentTimestamp}>
                {Math.floor(moment.timestamp / 60)}:{(moment.timestamp % 60).toString().padStart(2, '0')}
              </Text>
              <Text style={styles.momentNote}>{moment.note}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.distillButton} onPress={() => setShowTransformModal(true)}>
          <Text style={styles.distillButtonText}>✨ Transform</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Delete Entry</Text>
        </TouchableOpacity>
      </View>

      {/* Transform Modal */}
      <TransformModal
        visible={showTransformModal}
        onClose={() => setShowTransformModal(false)}
        entries={[entry]}
        onSuccess={handleTransformSuccess}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: JonoTheme.colors.background.primary,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  errorText: {
    color: JonoTheme.colors.sentiment.negative,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: JonoTheme.colors.text.primary,
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: JonoTheme.colors.text.secondary,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  tag: {
    backgroundColor: JonoTheme.colors.accent.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: JonoTheme.borderRadius.full,
  },
  tagText: {
    color: JonoTheme.colors.text.inverse,
    fontSize: 13,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: JonoTheme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  editButton: {
    color: JonoTheme.colors.accent.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  recordingCard: {
    backgroundColor: JonoTheme.colors.background.card,
    borderRadius: JonoTheme.borderRadius.md,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: JonoTheme.colors.border.light,
    ...JonoTheme.shadows.soft,
  },
  recordingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recordingIcon: {
    fontSize: 28,
  },
  recordingDuration: {
    fontSize: 20,
    fontWeight: '600',
    color: JonoTheme.colors.text.primary,
  },
  recordingLabel: {
    fontSize: 12,
    color: JonoTheme.colors.text.secondary,
  },
  playButton: {
    backgroundColor: JonoTheme.colors.accent.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: JonoTheme.borderRadius.md,
  },
  playButtonText: {
    color: JonoTheme.colors.text.inverse,
    fontWeight: '600',
  },
  transcriptionBox: {
    backgroundColor: JonoTheme.colors.background.card,
    borderRadius: JonoTheme.borderRadius.md,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: JonoTheme.colors.border.light,
    ...JonoTheme.shadows.soft,
  },
  transcriptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: JonoTheme.colors.text.tertiary,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  transcriptionText: {
    fontSize: 15,
    color: JonoTheme.colors.text.secondary,
    lineHeight: 22,
  },
  notesText: {
    fontSize: 16,
    color: JonoTheme.colors.text.secondary,
    lineHeight: 24,
    backgroundColor: JonoTheme.colors.background.card,
    borderRadius: JonoTheme.borderRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: JonoTheme.colors.border.light,
  },
  editInput: {
    backgroundColor: JonoTheme.colors.background.card,
    borderRadius: JonoTheme.borderRadius.md,
    padding: 16,
    fontSize: 16,
    color: JonoTheme.colors.text.primary,
    minHeight: 150,
    borderWidth: 2,
    borderColor: JonoTheme.colors.accent.primary,
    lineHeight: 24,
  },
  saveEditButton: {
    backgroundColor: JonoTheme.colors.accent.secondary,
    borderRadius: JonoTheme.borderRadius.md,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  saveEditButtonText: {
    color: JonoTheme.colors.text.inverse,
    fontWeight: '600',
  },
  momentItem: {
    flexDirection: 'row',
    backgroundColor: JonoTheme.colors.background.card,
    borderRadius: JonoTheme.borderRadius.md,
    padding: 12,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: JonoTheme.colors.border.light,
  },
  momentTimestamp: {
    color: JonoTheme.colors.accent.primary,
    fontWeight: '600',
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  momentNote: {
    flex: 1,
    color: JonoTheme.colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    marginTop: 20,
    gap: 12,
  },
  distillButton: {
    backgroundColor: JonoTheme.colors.accent.secondary,
    borderRadius: JonoTheme.borderRadius.md,
    padding: 16,
    alignItems: 'center',
    ...JonoTheme.shadows.soft,
  },
  distillButtonText: {
    color: JonoTheme.colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: 'transparent',
    borderRadius: JonoTheme.borderRadius.md,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: JonoTheme.colors.sentiment.negative,
  },
  deleteButtonText: {
    color: JonoTheme.colors.sentiment.negative,
    fontSize: 16,
    fontWeight: '600',
  },
});
