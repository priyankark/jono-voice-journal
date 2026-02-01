// QuickNotes - Warm styled notes and key moments input
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, ScrollView } from 'react-native';
import { KeyMoment } from '../types';
import { JonoTheme } from '../constants/theme';

interface QuickNotesProps {
  value: string;
  onChangeText: (text: string) => void;
  keyMoments: KeyMoment[];
  onAddKeyMoment: (moment: KeyMoment) => void;
  recordingDuration?: number;
}

export const QuickNotes: React.FC<QuickNotesProps> = ({
  value,
  onChangeText,
  keyMoments,
  onAddKeyMoment,
  recordingDuration = 0,
}) => {
  const [momentNote, setMomentNote] = useState('');

  const handleAddMoment = () => {
    if (momentNote.trim()) {
      onAddKeyMoment({
        timestamp: recordingDuration,
        note: momentNote.trim(),
      });
      setMomentNote('');
    }
  };

  const formatTimestamp = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Raw Thoughts</Text>
      <TextInput
        style={styles.textInput}
        value={value}
        onChangeText={onChangeText}
        placeholder="What's on your mind? Write freely..."
        placeholderTextColor={JonoTheme.colors.text.tertiary}
        multiline
        textAlignVertical="top"
      />

      <View style={styles.momentSection}>
        <Text style={styles.label}>Key Moments</Text>
        <View style={styles.momentInputRow}>
          <TextInput
            style={styles.momentInput}
            value={momentNote}
            onChangeText={setMomentNote}
            placeholder="Mark a key moment..."
            placeholderTextColor={JonoTheme.colors.text.tertiary}
          />
          <TouchableOpacity style={styles.momentButton} onPress={handleAddMoment}>
            <Text style={styles.momentButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {keyMoments.length > 0 && (
          <ScrollView style={styles.momentsList} showsVerticalScrollIndicator={false}>
            {keyMoments.map((moment, index) => (
              <View key={index} style={styles.momentItem}>
                <Text style={styles.momentTimestamp}>{formatTimestamp(moment.timestamp)}</Text>
                <Text style={styles.momentText}>{moment.note}</Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: JonoTheme.colors.text.tertiary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  textInput: {
    backgroundColor: JonoTheme.colors.background.card,
    borderRadius: JonoTheme.borderRadius.md,
    padding: 16,
    fontSize: 16,
    color: JonoTheme.colors.text.primary,
    minHeight: 120,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: JonoTheme.colors.border.light,
    lineHeight: 24,
  },
  momentSection: {
    marginTop: 8,
  },
  momentInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  momentInput: {
    flex: 1,
    backgroundColor: JonoTheme.colors.background.card,
    borderRadius: JonoTheme.borderRadius.md,
    padding: 14,
    fontSize: 16,
    color: JonoTheme.colors.text.primary,
    borderWidth: 1,
    borderColor: JonoTheme.colors.border.light,
  },
  momentButton: {
    backgroundColor: JonoTheme.colors.accent.tertiary,
    borderRadius: JonoTheme.borderRadius.md,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  momentButtonText: {
    color: JonoTheme.colors.text.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  momentsList: {
    marginTop: 12,
    maxHeight: 150,
  },
  momentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: JonoTheme.colors.border.light,
  },
  momentTimestamp: {
    color: JonoTheme.colors.accent.primary,
    fontWeight: '600',
    fontSize: 14,
    width: 50,
    fontVariant: ['tabular-nums'],
  },
  momentText: {
    flex: 1,
    color: JonoTheme.colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
  },
});
