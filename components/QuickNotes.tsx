import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, ScrollView } from 'react-native';
import { KeyMoment } from '../types';

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
        placeholder="Capture your raw thoughts and observations..."
        placeholderTextColor="#666"
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
            placeholderTextColor="#666"
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
    color: '#888',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  textInput: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    minHeight: 120,
    marginBottom: 20,
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
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#fff',
  },
  momentButton: {
    backgroundColor: '#4a4ae8',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  momentButtonText: {
    color: '#fff',
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
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  momentTimestamp: {
    color: '#4a4ae8',
    fontWeight: '600',
    fontSize: 14,
    width: 50,
    fontVariant: ['tabular-nums'],
  },
  momentText: {
    flex: 1,
    color: '#ccc',
    fontSize: 14,
  },
});
