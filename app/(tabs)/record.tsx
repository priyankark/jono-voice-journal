import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { useJournalStore } from '../../stores/journalStore';
import { VoiceRecorder } from '../../components/VoiceRecorder';
import { QuickNotes } from '../../components/QuickNotes';
import { IntervieweeTag } from '../../components/IntervieweeTag';
import { JournalEntry, KeyMoment } from '../../types';
import { transcribeAudio } from '../../services/transcription';

export default function RecordScreen() {
  const router = useRouter();
  const { addEntry } = useJournalStore();

  const [interviewee, setInterviewee] = useState('');
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
      interviewee: interviewee.trim() || undefined,
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
    setInterviewee('');
    setTags([]);
    setTextNotes('');
    setKeyMoments([]);
    setRecordingUri(null);
    setRecordingDuration(0);
    setTranscription(null);

    Alert.alert('Saved!', 'Your entry has been saved.', [
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
            <Text style={styles.transcribingText}>Transcribing audio...</Text>
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

        {/* Interviewee & Tags */}
        <IntervieweeTag
          value={interviewee}
          onChangeValue={setInterviewee}
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
    backgroundColor: '#0d0d1a',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  transcribingBanner: {
    backgroundColor: '#4a4ae8',
    padding: 12,
    borderRadius: 10,
    marginVertical: 10,
    alignItems: 'center',
  },
  transcribingText: {
    color: '#fff',
    fontWeight: '500',
  },
  transcriptionPreview: {
    backgroundColor: '#1a1a2e',
    padding: 14,
    borderRadius: 10,
    marginVertical: 10,
  },
  transcriptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  transcriptionText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  footer: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  saveButton: {
    backgroundColor: '#4a4ae8',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#333',
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
