import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, ScrollView } from 'react-native';

interface IntervieweeTagProps {
  value: string;
  onChangeValue: (value: string) => void;
  tags: string[];
  onChangeTags: (tags: string[]) => void;
  suggestedTags?: string[];
}

export const IntervieweeTag: React.FC<IntervieweeTagProps> = ({
  value,
  onChangeValue,
  tags,
  onChangeTags,
  suggestedTags = ['Product', 'UX', 'Customer', 'Sales', 'Engineering'],
}) => {
  const [tagInput, setTagInput] = useState('');

  const addTag = (tag: string) => {
    const normalizedTag = tag.trim();
    if (normalizedTag && !tags.includes(normalizedTag)) {
      onChangeTags([...tags, normalizedTag]);
    }
    setTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    onChangeTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmitTag = () => {
    if (tagInput.trim()) {
      addTag(tagInput);
    }
  };

  return (
    <View style={styles.container}>
      {/* Interviewee Name */}
      <View style={styles.section}>
        <Text style={styles.label}>Interviewee</Text>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeValue}
          placeholder="Who are you interviewing?"
          placeholderTextColor="#666"
        />
      </View>

      {/* Tags */}
      <View style={styles.section}>
        <Text style={styles.label}>Tags</Text>

        {/* Current Tags */}
        {tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {tags.map((tag, index) => (
              <TouchableOpacity
                key={index}
                style={styles.tag}
                onPress={() => removeTag(tag)}
              >
                <Text style={styles.tagText}>{tag}</Text>
                <Text style={styles.tagRemove}>×</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Tag Input */}
        <View style={styles.tagInputRow}>
          <TextInput
            style={styles.tagInput}
            value={tagInput}
            onChangeText={setTagInput}
            onSubmitEditing={handleSubmitTag}
            placeholder="Add a tag..."
            placeholderTextColor="#666"
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.addButton} onPress={handleSubmitTag}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Suggested Tags */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestedContainer}>
          {suggestedTags.filter(t => !tags.includes(t)).map((tag, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestedTag}
              onPress={() => addTag(tag)}
            >
              <Text style={styles.suggestedTagText}>+ {tag}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#fff',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4a4ae8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  tagText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  tagRemove: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 18,
    fontWeight: '600',
  },
  tagInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  tagInput: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#333',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  suggestedContainer: {
    marginTop: 12,
  },
  suggestedTag: {
    backgroundColor: '#2a2a4e',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  suggestedTagText: {
    color: '#888',
    fontSize: 13,
  },
});
