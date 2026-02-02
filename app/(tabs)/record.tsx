import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { useJournalStore } from '../../stores/journalStore';
import { VoiceRecorder } from '../../components/VoiceRecorder';
import { QuickNotes } from '../../components/QuickNotes';
import { ContextTag } from '../../components/ContextTag';
import { JournalEntry, KeyMoment } from '../../types';
import { transcribeAudio } from '../../services/transcription';
import { JonoTheme } from '../../constants/theme';

export default function RecordScreen() {
  const router = useRouter();
  const { addEntry } = useJournalStore();

  const [context, setContext] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [textNotes, setTextNotes] = useState('');
  const [keyMoments, setKeyMoments] = useState<KeyMoment[]>([]);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState<string | null>(null);

  const handleRecordingComplete = async (uri: string, duration: number) => {
    setRecordingUri(uri);
    setRecordingDuration(duration);

    // Attempt transcription
    setIsTranscribing(true);
    try {
      const result = await transcribeAudio(uri);
      setTranscription(result.text);
    } catch (error) {
      console.error('Transcription failed:', error);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleAddKeyMoment = (moment: KeyMoment) => {
    setKeyMoments([...keyMoments, moment]);
  };

  const handleSave = () => {
    if (!textNotes.trim() && !recordingUri) {
      Alert.alert('Empty Entry', 'Please add some notes or a recording before saving.');
      return;
    }

    const entry: JournalEntry = {
      id: Crypto.randomUUID(),
      date: new Date(),
      context: context.trim() || undefined,
      interviewee: context.trim() || undefined, // Keep for backwards compatibility
      tags,
      voiceRecording: recordingUri
        ? {
            uri: recordingUri,
            duration: recordingDuration,
            transcription: transcription || undefined,
          }
        : undefined,
      textNotes: textNotes.trim(),
      keyMoments,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    addEntry(entry);

    // Reset form
    setContext('');
    setTags([]);
    setTextNotes('');
    setKeyMoments([]);
    setRecordingUri(null);
    setRecordingDuration(0);
    setTranscription(null);

    Alert.alert('Saved!', 'Your thought has been captured.', [
      { text: 'View Entry', onPress: () => router.push(`/entry/${entry.id}`) },
      { text: 'OK', onPress: () => router.push('/') },
    ]);
  };

  const canSave = textNotes.trim() || recordingUri;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Voice Recorder */}
        <VoiceRecorder onRecordingComplete={handleRecordingComplete} />

        {/* Transcription Status */}
        {isTranscribing && (
          <View style={styles.transcribingBanner}>
            <Text style={styles.transcribingText}>Transcribing your voice...</Text>
          </View>
        )}

        {transcription && (
          <View style={styles.transcriptionPreview}>
            <Text style={styles.transcriptionLabel}>Transcription</Text>
            <Text style={styles.transcriptionText} numberOfLines={3}>
              {transcription}
            </Text>
          </View>
        )}

        {/* Context & Tags */}
        <ContextTag
          value={context}
          onChangeValue={setContext}
          tags={tags}
          onChangeTags={setTags}
        />

        {/* Quick Notes */}
        <QuickNotes
          value={textNotes}
          onChangeText={setTextNotes}
          keyMoments={keyMoments}
          onAddKeyMoment={handleAddKeyMoment}
          recordingDuration={recordingDuration}
        />

        {/* Save Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!canSave}
          >
            <Text style={styles.saveButtonText}>Save Entry</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: JonoTheme.colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  transcribingBanner: {
    backgroundColor: JonoTheme.colors.accent.secondary,
    padding: 12,
    borderRadius: JonoTheme.borderRadius.md,
    marginVertical: 10,
    alignItems: 'center',
  },
  transcribingText: {
    color: JonoTheme.colors.text.inverse,
    fontWeight: '500',
  },
  transcriptionPreview: {
    backgroundColor: JonoTheme.colors.background.card,
    padding: 14,
    borderRadius: JonoTheme.borderRadius.md,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: JonoTheme.colors.border.light,
    ...JonoTheme.shadows.soft,
  },
  transcriptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: JonoTheme.colors.text.tertiary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  transcriptionText: {
    fontSize: 14,
    color: JonoTheme.colors.text.secondary,
    lineHeight: 20,
  },
  footer: {
    marginTop: 28,
    paddingHorizontal: 0,
  },
  saveButton: {
    backgroundColor: JonoTheme.colors.accent.primary,
    paddingVertical: 18,
    borderRadius: JonoTheme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    ...JonoTheme.shadows.medium,
  },
  saveButtonDisabled: {
    backgroundColor: JonoTheme.colors.border.medium,
    opacity: 0.5,
    ...JonoTheme.shadows.soft,
  },
  saveButtonText: {
    color: JonoTheme.colors.text.inverse,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
