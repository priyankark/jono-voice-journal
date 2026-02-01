// ContextTag - Context and tags input for journal entries
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, ScrollView } from 'react-native';
import { JonoTheme } from '../constants/theme';

interface ContextTagProps {
  value: string;
  onChangeValue: (value: string) => void;
  tags: string[];
  onChangeTags: (tags: string[]) => void;
  suggestedTags?: string[];
}

export const ContextTag: React.FC<ContextTagProps> = ({
  value,
  onChangeValue,
  tags,
  onChangeTags,
  suggestedTags = ['Personal', 'Work', 'Gratitude', 'Goals', 'Reflection', 'Ideas'],
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
      {/* Context (Optional) */}
      <View style={styles.section}>
        <Text style={styles.label}>Context (optional)</Text>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeValue}
          placeholder="What's this about?"
          placeholderTextColor={JonoTheme.colors.text.tertiary}
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
            placeholderTextColor={JonoTheme.colors.text.tertiary}
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

// Keep legacy export for backwards compatibility
export const IntervieweeTag = ContextTag;

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
    color: JonoTheme.colors.text.tertiary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: JonoTheme.colors.background.card,
    borderRadius: JonoTheme.borderRadius.md,
    padding: 14,
    fontSize: 16,
    color: JonoTheme.colors.text.primary,
    borderWidth: 1,
    borderColor: JonoTheme.colors.border.light,
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
    backgroundColor: JonoTheme.colors.accent.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: JonoTheme.borderRadius.full,
    gap: 6,
  },
  tagText: {
    color: JonoTheme.colors.text.inverse,
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
    backgroundColor: JonoTheme.colors.background.card,
    borderRadius: JonoTheme.borderRadius.md,
    padding: 14,
    fontSize: 16,
    color: JonoTheme.colors.text.primary,
    borderWidth: 1,
    borderColor: JonoTheme.colors.border.light,
  },
  addButton: {
    backgroundColor: JonoTheme.colors.accent.secondary,
    borderRadius: JonoTheme.borderRadius.md,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  addButtonText: {
    color: JonoTheme.colors.text.inverse,
    fontWeight: '600',
    fontSize: 14,
  },
  suggestedContainer: {
    marginTop: 12,
  },
  suggestedTag: {
    backgroundColor: JonoTheme.colors.accent.muted,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: JonoTheme.borderRadius.full,
    marginRight: 8,
  },
  suggestedTagText: {
    color: JonoTheme.colors.accent.primary,
    fontSize: 13,
    fontWeight: '500',
  },
});
