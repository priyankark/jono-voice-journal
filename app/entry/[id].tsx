import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useJournalStore } from '../../stores/journalStore';
import { formatDateTime, formatDuration } from '../../utils/dateHelpers';
import { generateArticle } from '../../services/articleGenerator';

export default function EntryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { entries, updateEntry, deleteEntry, addArticle } = useJournalStore();

  const entry = entries.find(e => e.id === id);
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState(entry?.textNotes || '');

  if (!entry) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Entry not found</Text>
      </View>
    );
  }

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

  const handleDistill = async () => {
    console.log('[Distill] Button pressed, starting...');
    Alert.alert('Starting', 'Beginning article generation...');
    try {
      console.log('[Distill] Calling generateArticle...');
      const article = await generateArticle([entry]);
      console.log('[Distill] Article generated successfully!');
      addArticle(article);
      Alert.alert('Article Created', 'Your entry has been distilled into an article.', [
        { text: 'View', onPress: () => router.push('/articles') },
        { text: 'OK' },
      ]);
    } catch (error) {
      console.error('[Distill] Failed to generate article:', error);
      Alert.alert('Error', `Failed to create article: ${error}`);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        {entry.interviewee && (
          <Text style={styles.interviewee}>{entry.interviewee}</Text>
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
                <Text style={styles.recordingLabel}>Audio recorded</Text>
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
        <TouchableOpacity style={styles.distillButton} onPress={handleDistill}>
          <Text style={styles.distillButtonText}>✨ Distill to Article</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Delete Entry</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d1a',
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  header: {
    marginBottom: 16,
  },
  interviewee: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  tag: {
    backgroundColor: '#4a4ae8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    color: '#fff',
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
    fontSize: 16,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  editButton: {
    color: '#4a4ae8',
    fontSize: 14,
    fontWeight: '600',
  },
  recordingCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    color: '#fff',
  },
  recordingLabel: {
    fontSize: 12,
    color: '#666',
  },
  playButton: {
    backgroundColor: '#4a4ae8',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  playButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  transcriptionBox: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  transcriptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  transcriptionText: {
    fontSize: 15,
    color: '#ccc',
    lineHeight: 22,
  },
  notesText: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 24,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
  },
  editInput: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    minHeight: 150,
    borderWidth: 1,
    borderColor: '#4a4ae8',
  },
  saveEditButton: {
    backgroundColor: '#4a4ae8',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  saveEditButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  momentItem: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  momentTimestamp: {
    color: '#4a4ae8',
    fontWeight: '600',
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  momentNote: {
    flex: 1,
    color: '#ccc',
    fontSize: 14,
  },
  actions: {
    marginTop: 20,
    gap: 12,
  },
  distillButton: {
    backgroundColor: '#4a4ae8',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  distillButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff4444',
  },
  deleteButtonText: {
    color: '#ff4444',
    fontSize: 16,
    fontWeight: '600',
  },
});
