// TransformModal - Universal transformation modal with presets and custom prompts
import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { JournalEntry, Article, PRESET_PROMPT_TEMPLATES, PromptTemplate } from '../types';
import { generateArticle } from '../services/articleGenerator';
import { JonoTheme } from '../constants/theme';

interface TransformModalProps {
  visible: boolean;
  onClose: () => void;
  entries: JournalEntry[];
  onSuccess: (article: Article) => void;
}

export const TransformModal: React.FC<TransformModalProps> = ({
  visible,
  onClose,
  entries,
  onSuccess,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<PromptTemplate | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSelectPreset = (preset: PromptTemplate) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedPreset?.id === preset.id) {
      // Deselect if already selected
      setSelectedPreset(null);
      setCustomPrompt('');
    } else {
      setSelectedPreset(preset);
      setCustomPrompt(preset.prompt);
    }
  };

  const handleGenerate = async (useCustomPrompt: boolean = false) => {
    if (entries.length === 0) return;

    setIsGenerating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const article = await generateArticle(entries, {
        customPrompt: useCustomPrompt ? customPrompt : selectedPreset?.prompt,
        presetId: !useCustomPrompt && selectedPreset ? selectedPreset.id : undefined,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess(article);
      handleClose();
    } catch (error) {
      console.error('Failed to generate content:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateStandardArticle = async () => {
    if (entries.length === 0) return;

    setIsGenerating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const article = await generateArticle(entries);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess(article);
      handleClose();
    } catch (error) {
      console.error('Failed to generate article:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    setSelectedPreset(null);
    setCustomPrompt('');
    onClose();
  };

  const hasCustomPromptOnly = customPrompt.trim() && !selectedPreset;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            disabled={isGenerating}
          >
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transform Your Thoughts</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Source Info */}
          <View style={styles.sourceInfo}>
            <Text style={styles.sourceIcon}>📝</Text>
            <Text style={styles.sourceText}>
              Transform {entries.length} {entries.length === 1 ? 'entry' : 'entries'} into something meaningful
            </Text>
          </View>

          {/* Presets Section */}
          <Text style={styles.sectionTitle}>PRESETS</Text>
          <View style={styles.presetGrid}>
            {PRESET_PROMPT_TEMPLATES.map((preset) => (
              <TouchableOpacity
                key={preset.id}
                style={[
                  styles.presetButton,
                  selectedPreset?.id === preset.id && styles.presetButtonSelected,
                ]}
                onPress={() => handleSelectPreset(preset)}
                disabled={isGenerating}
              >
                <Text style={styles.presetIcon}>{preset.icon}</Text>
                <Text
                  style={[
                    styles.presetLabel,
                    selectedPreset?.id === preset.id && styles.presetLabelSelected,
                  ]}
                >
                  {preset.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Selected Preset Description */}
          {selectedPreset && (
            <View style={styles.presetDescription}>
              <Text style={styles.presetDescriptionText}>
                {selectedPreset.description}
              </Text>
            </View>
          )}

          {/* Generate from Preset Button */}
          {selectedPreset && (
            <TouchableOpacity
              style={[
                styles.generateButton,
                isGenerating && styles.generateButtonDisabled,
              ]}
              onPress={() => handleGenerate(false)}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.generateButtonText}>
                  Generate {selectedPreset.label}
                </Text>
              )}
            </TouchableOpacity>
          )}

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or write your own</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Custom Prompt Input */}
          <TextInput
            style={styles.customPromptInput}
            value={customPrompt}
            onChangeText={(text) => {
              setCustomPrompt(text);
              if (selectedPreset && text !== selectedPreset.prompt) {
                setSelectedPreset(null);
              }
            }}
            placeholder="e.g., Turn this into a bedtime story, Write a motivational speech..."
            placeholderTextColor={JonoTheme.colors.text.tertiary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            editable={!isGenerating}
          />

          {/* Generate Custom Button */}
          {hasCustomPromptOnly && (
            <TouchableOpacity
              style={[
                styles.generateButton,
                styles.generateCustomButton,
                isGenerating && styles.generateButtonDisabled,
              ]}
              onPress={() => handleGenerate(true)}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.generateButtonText}>
                  Generate with Custom Prompt
                </Text>
              )}
            </TouchableOpacity>
          )}

          {/* Standard Article Option */}
          <View style={styles.standardSection}>
            <TouchableOpacity
              style={[
                styles.standardArticleButton,
                isGenerating && styles.standardArticleButtonDisabled,
              ]}
              onPress={handleGenerateStandardArticle}
              disabled={isGenerating}
            >
              <Text style={styles.standardArticleIcon}>📝</Text>
              <View style={styles.standardArticleText}>
                <Text style={styles.standardArticleTitle}>Standard Article</Text>
                <Text style={styles.standardArticleSubtitle}>
                  Weave thoughts into a narrative article
                </Text>
              </View>
              <Text style={styles.standardArticleArrow}>→</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: JonoTheme.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: JonoTheme.colors.border.light,
    backgroundColor: JonoTheme.colors.background.card,
    minHeight: 56,
  },
  closeButton: {
    minWidth: 70,
    minHeight: 44,
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 17,
    color: JonoTheme.colors.text.secondary,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: JonoTheme.colors.text.primary,
  },
  headerSpacer: {
    minWidth: 70,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  sourceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: JonoTheme.colors.accent.muted,
    borderRadius: JonoTheme.borderRadius.md,
    padding: 14,
    marginBottom: 24,
    gap: 12,
  },
  sourceIcon: {
    fontSize: 24,
  },
  sourceText: {
    flex: 1,
    fontSize: 15,
    color: JonoTheme.colors.text.primary,
    lineHeight: 21,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: JonoTheme.colors.text.tertiary,
    letterSpacing: 1,
    marginBottom: 12,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  presetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: JonoTheme.colors.background.card,
    borderRadius: JonoTheme.borderRadius.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: JonoTheme.colors.border.light,
    gap: 8,
    minWidth: '47%',
    ...JonoTheme.shadows.soft,
  },
  presetButtonSelected: {
    borderColor: JonoTheme.colors.accent.primary,
    backgroundColor: JonoTheme.colors.accent.muted,
    ...JonoTheme.shadows.medium,
  },
  presetIcon: {
    fontSize: 20,
  },
  presetLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: JonoTheme.colors.text.primary,
  },
  presetLabelSelected: {
    color: JonoTheme.colors.accent.primary,
    fontWeight: '600',
  },
  presetDescription: {
    backgroundColor: JonoTheme.colors.background.secondary,
    borderRadius: JonoTheme.borderRadius.md,
    padding: 14,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: JonoTheme.colors.accent.primary,
  },
  presetDescriptionText: {
    fontSize: 14,
    color: JonoTheme.colors.text.secondary,
    lineHeight: 20,
  },
  generateButton: {
    backgroundColor: JonoTheme.colors.accent.primary,
    borderRadius: JonoTheme.borderRadius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    minHeight: 52,
    ...JonoTheme.shadows.medium,
  },
  generateCustomButton: {
    backgroundColor: JonoTheme.colors.accent.secondary,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.3,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: JonoTheme.colors.border.light,
  },
  dividerText: {
    fontSize: 13,
    color: JonoTheme.colors.text.tertiary,
    paddingHorizontal: 16,
  },
  customPromptInput: {
    backgroundColor: JonoTheme.colors.background.card,
    borderRadius: JonoTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: JonoTheme.colors.border.light,
    padding: 14,
    fontSize: 15,
    color: JonoTheme.colors.text.primary,
    minHeight: 100,
    marginBottom: 16,
    lineHeight: 22,
  },
  standardSection: {
    marginTop: 8,
  },
  standardArticleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: JonoTheme.colors.background.card,
    borderRadius: JonoTheme.borderRadius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: JonoTheme.colors.border.light,
    minHeight: 76,
    ...JonoTheme.shadows.soft,
  },
  standardArticleButtonDisabled: {
    opacity: 0.5,
  },
  standardArticleIcon: {
    fontSize: 28,
    marginRight: 14,
  },
  standardArticleText: {
    flex: 1,
  },
  standardArticleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: JonoTheme.colors.text.primary,
  },
  standardArticleSubtitle: {
    fontSize: 14,
    color: JonoTheme.colors.text.secondary,
    marginTop: 4,
    lineHeight: 20,
  },
  standardArticleArrow: {
    fontSize: 20,
    color: JonoTheme.colors.text.tertiary,
  },
});
