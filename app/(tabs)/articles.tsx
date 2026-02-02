// Content Library - Comprehensive view of all generated content
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Markdown from 'react-native-markdown-display';
import { useJournalStore } from '../../stores/journalStore';
import { ContentLibraryCard } from '../../components/ContentLibraryCard';
import { ContentLibraryFilter } from '../../components/ContentLibraryFilter';
import { generateArticle, improveArticle } from '../../services/articleGenerator';
import { JonoTheme } from '../../constants/theme';
import { getMarkdownStyles } from '../../constants/markdownStyles';
import {
  Article,
  ContentFilterStatus,
  ContentSortOption,
  ContentType,
  JournalEntry,
  PRESET_PROMPT_TEMPLATES,
  PromptTemplate,
} from '../../types';

export default function ContentLibraryScreen() {
  const router = useRouter();
  const { articles, entries, updateArticle, addArticle, deleteArticle } = useJournalStore();

  // View state
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ContentFilterStatus>('all');
  const [contentTypeFilter, setContentTypeFilter] = useState<ContentType | 'all'>('all');
  const [sortBy, setSortBy] = useState<ContentSortOption>('newest');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);

  // Edit state
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  // Generate state
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<PromptTemplate | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Get source entries for an article
  const getSourceEntries = useCallback((article: Article): JournalEntry[] => {
    return article.entryIds
      .map(id => entries.find(e => e.id === id))
      .filter((e): e is JournalEntry => e !== undefined);
  }, [entries]);

  // Filter and sort articles
  const filteredArticles = useMemo(() => {
    let result = [...articles];

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(a => a.status === statusFilter);
    }

    // Apply content type filter
    if (contentTypeFilter !== 'all') {
      result = result.filter(a => a.contentType === contentTypeFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        a =>
          a.title.toLowerCase().includes(query) ||
          a.summary.toLowerCase().includes(query) ||
          a.content.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'title':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'status':
        const statusOrder = { draft: 0, polished: 1, published: 2 };
        result.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
        break;
    }

    return result;
  }, [articles, statusFilter, contentTypeFilter, sortBy, searchQuery]);

  // Content type filter options
  const contentTypeOptions: { value: ContentType | 'all'; label: string; icon: string }[] = [
    { value: 'all', label: 'All', icon: '📄' },
    { value: 'article', label: 'Articles', icon: '📝' },
    { value: 'poem', label: 'Poems', icon: '🎭' },
    { value: 'letter', label: 'Letters', icon: '💌' },
    { value: 'gratitude', label: 'Gratitude', icon: '🙏' },
    { value: 'lessons', label: 'Lessons', icon: '📚' },
    { value: 'story', label: 'Stories', icon: '📖' },
    { value: 'affirmations', label: 'Affirmations', icon: '✨' },
    { value: 'mantra', label: 'Mantras', icon: '🕉️' },
    { value: 'reflection', label: 'Reflections', icon: '🔮' },
    { value: 'custom', label: 'Custom', icon: '🎨' },
  ];

  // Stats
  const stats = useMemo(() => ({
    total: articles.length,
    drafts: articles.filter(a => a.status === 'draft').length,
    polished: articles.filter(a => a.status === 'polished').length,
    published: articles.filter(a => a.status === 'published').length,
    totalWords: articles.reduce((sum, a) => sum + a.content.split(/\s+/).length, 0),
  }), [articles]);

  // === Handlers ===

  const handleImprove = async (articleId: string) => {
    const article = articles.find(a => a.id === articleId);
    if (!article) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const improved = await improveArticle(article);
      updateArticle(articleId, improved);
      Alert.alert('Article Polished', 'Your article has been improved with AI.');
    } catch (error) {
      console.error('Failed to improve article:', error);
      Alert.alert('Error', 'Failed to polish article.');
    }
  };

  const handlePublish = async (articleId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateArticle(articleId, { status: 'published' });
    Alert.alert('Published', 'Your article has been marked as published.');
  };

  const handleDelete = (articleId: string) => {
    deleteArticle(articleId);
  };

  const handleEdit = (article: Article) => {
    setSelectedArticle(article);
    setEditTitle(article.title);
    setEditContent(article.content);
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (selectedArticle) {
      updateArticle(selectedArticle.id, {
        title: editTitle,
        content: editContent,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowEditModal(false);
      setSelectedArticle(null);
    }
  };

  const handleOpenPromptModal = () => {
    if (entries.length === 0) {
      Alert.alert('No Entries', 'Capture some thoughts first to generate content.');
      return;
    }

    // Get entries from last 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentEntries = entries.filter(e => new Date(e.date) >= weekAgo);

    if (recentEntries.length === 0) {
      Alert.alert('No Recent Entries', 'No entries from the last 7 days.');
      return;
    }

    setShowPromptModal(true);
  };

  const handleSelectPreset = (preset: PromptTemplate) => {
    setSelectedPreset(preset);
    setCustomPrompt(preset.prompt);
  };

  const handleGenerateWithPrompt = async (prompt?: string, usePreset?: boolean) => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentEntries = entries.filter(e => new Date(e.date) >= weekAgo);

    if (recentEntries.length === 0) {
      Alert.alert('No Recent Entries', 'No entries from the last 7 days.');
      return;
    }

    setIsGenerating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const article = await generateArticle(recentEntries, {
        customPrompt: prompt || undefined,
        presetId: usePreset && selectedPreset ? selectedPreset.id : undefined,
      });

      // Save generation metadata (already handled in generateArticle now)
      if (prompt && !usePreset) {
        article.generationPrompt = prompt;
        article.generationType = 'custom';
      } else if (!prompt) {
        article.generationType = 'standard';
      }

      addArticle(article);
      setShowPromptModal(false);
      setCustomPrompt('');
      setSelectedPreset(null);
      Alert.alert(
        'Content Generated',
        `Created ${prompt ? 'custom content' : 'article'} from ${recentEntries.length} entries.`
      );
    } catch (error) {
      console.error('Failed to generate content:', error);
      Alert.alert('Error', 'Failed to generate content.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleViewArticle = (article: Article) => {
    setSelectedArticle(article);
    setShowDetailModal(true);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={JonoTheme.colors.accent.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Creations</Text>
          <Text style={styles.headerSubtitle}>
            Transformed thoughts into meaningful content
          </Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: JonoTheme.colors.status.draft }]}>
              {stats.drafts}
            </Text>
            <Text style={styles.statLabel}>Drafts</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: JonoTheme.colors.status.polished }]}>
              {stats.polished}
            </Text>
            <Text style={styles.statLabel}>Polished</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: JonoTheme.colors.status.published }]}>
              {stats.published}
            </Text>
            <Text style={styles.statLabel}>Published</Text>
          </View>
        </View>

        {/* Total Words Card */}
        {stats.totalWords > 0 && (
          <View style={styles.wordsCard}>
            <Text style={styles.wordsIcon}>📖</Text>
            <View style={styles.wordsText}>
              <Text style={styles.wordsValue}>{stats.totalWords.toLocaleString()}</Text>
              <Text style={styles.wordsLabel}>words written</Text>
            </View>
          </View>
        )}

        {/* Generate Button */}
        <TouchableOpacity style={styles.generateButton} onPress={handleOpenPromptModal}>
          <Text style={styles.generateIcon}>✨</Text>
          <View style={styles.generateText}>
            <Text style={styles.generateTitle}>Create New Content</Text>
            <Text style={styles.generateSubtitle}>
              Transform your thoughts into articles, poems, and more
            </Text>
          </View>
          <Text style={styles.generateChevron}>→</Text>
        </TouchableOpacity>

        {/* Content Type Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.typeFilterScroll}
          contentContainerStyle={styles.typeFilterContent}
        >
          {contentTypeOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.typeFilterButton,
                contentTypeFilter === option.value && styles.typeFilterButtonActive,
              ]}
              onPress={() => setContentTypeFilter(option.value)}
            >
              <Text style={styles.typeFilterIcon}>{option.icon}</Text>
              <Text
                style={[
                  styles.typeFilterLabel,
                  contentTypeFilter === option.value && styles.typeFilterLabelActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Filter Bar */}
        <ContentLibraryFilter
          statusFilter={statusFilter}
          sortBy={sortBy}
          searchQuery={searchQuery}
          onStatusChange={setStatusFilter}
          onSortChange={setSortBy}
          onSearchChange={setSearchQuery}
          totalCount={articles.length}
          filteredCount={filteredArticles.length}
        />

        {/* Content List */}
        <View style={styles.contentList}>
          {filteredArticles.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>
                {searchQuery ? '🔍' : '📄'}
              </Text>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No matches found' : 'No content yet'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? `No articles match "${searchQuery}"`
                  : 'Transform your journal entries into articles, essays, poems, and more'}
              </Text>
              {!searchQuery && (
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={handleOpenPromptModal}
                >
                  <Text style={styles.emptyButtonText}>Create Your First Content</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredArticles.map((article) => (
              <ContentLibraryCard
                key={article.id}
                article={article}
                sourceEntries={getSourceEntries(article)}
                onPress={() => handleViewArticle(article)}
                onEdit={() => handleEdit(article)}
                onDelete={() => handleDelete(article.id)}
                onImprove={
                  article.status === 'draft'
                    ? () => handleImprove(article.id)
                    : undefined
                }
                onPublish={
                  article.status === 'polished'
                    ? () => handlePublish(article.id)
                    : undefined
                }
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Article Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowDetailModal(false)}
            >
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Article</Text>
            <View style={styles.modalHeaderSpacer} />
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedArticle && (
              <>
                <View style={styles.detailHeader}>
                  <View
                    style={[
                      styles.detailStatus,
                      {
                        backgroundColor:
                          JonoTheme.colors.status[selectedArticle.status],
                      },
                    ]}
                  >
                    <Text style={styles.detailStatusText}>
                      {selectedArticle.status.toUpperCase()}
                    </Text>
                  </View>
                  {selectedArticle.generationType && (
                    <View style={styles.detailTypeBadge}>
                      <Text style={styles.detailTypeText}>
                        {selectedArticle.generationType === 'custom' ? 'Custom' : 'Article'}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.detailTitle}>{selectedArticle.title}</Text>
                <Text style={styles.detailSummary}>{selectedArticle.summary}</Text>

                {/* Source Entries */}
                {selectedArticle.entryIds.length > 0 && (
                  <View style={styles.detailSourceSection}>
                    <Text style={styles.detailSourceLabel}>
                      Generated from {selectedArticle.entryIds.length} journal{' '}
                      {selectedArticle.entryIds.length === 1 ? 'entry' : 'entries'}
                    </Text>
                  </View>
                )}

                <View style={styles.detailDivider} />
                <Markdown style={getMarkdownStyles(17)}>
                  {selectedArticle.content}
                </Markdown>

                {selectedArticle.keyQuotes.length > 0 && (
                  <>
                    <View style={styles.detailDivider} />
                    <Text style={styles.detailSectionTitle}>Key Quotes</Text>
                    {selectedArticle.keyQuotes.map((quote, index) => (
                      <View key={index} style={styles.detailQuote}>
                        <Text style={styles.detailQuoteText}>"{quote}"</Text>
                      </View>
                    ))}
                  </>
                )}

                {/* Generation Prompt */}
                {selectedArticle.generationPrompt && (
                  <>
                    <View style={styles.detailDivider} />
                    <Text style={styles.detailSectionTitle}>Generation Prompt</Text>
                    <View style={styles.detailPromptCard}>
                      <Text style={styles.detailPromptText}>
                        {selectedArticle.generationPrompt}
                      </Text>
                    </View>
                  </>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowEditModal(false)}
            >
              <Text style={styles.modalCloseCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Article</Text>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={handleSaveEdit}
            >
              <Text style={styles.modalCloseSave}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.editContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.editLabel}>Title</Text>
            <TextInput
              style={styles.editTitleInput}
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Article title"
              placeholderTextColor={JonoTheme.colors.text.tertiary}
            />

            <Text style={styles.editLabel}>Content</Text>
            <TextInput
              style={styles.editContentInput}
              value={editContent}
              onChangeText={setEditContent}
              placeholder="Article content"
              placeholderTextColor={JonoTheme.colors.text.tertiary}
              multiline
              textAlignVertical="top"
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Generate Content Modal */}
      <Modal
        visible={showPromptModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPromptModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowPromptModal(false)}
            >
              <Text style={styles.modalCloseCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Generate Content</Text>
            <View style={styles.modalHeaderSpacer} />
          </View>

          <ScrollView style={styles.promptModalContent} keyboardShouldPersistTaps="handled">
            {/* Quick Presets */}
            <Text style={styles.presetSectionTitle}>Quick Presets</Text>
            <View style={styles.presetGrid}>
              {PRESET_PROMPT_TEMPLATES.map((preset) => (
                <TouchableOpacity
                  key={preset.id}
                  style={[
                    styles.presetButton,
                    selectedPreset?.id === preset.id && styles.presetButtonSelected,
                  ]}
                  onPress={() => handleSelectPreset(preset)}
                >
                  <Text style={styles.presetIcon}>{preset.icon}</Text>
                  <Text style={[
                    styles.presetLabel,
                    selectedPreset?.id === preset.id && styles.presetLabelSelected,
                  ]}>{preset.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Prompt Input */}
            <Text style={styles.customPromptTitle}>Or write your own prompt</Text>
            <TextInput
              style={styles.customPromptInput}
              value={customPrompt}
              onChangeText={(text) => {
                setCustomPrompt(text);
                setSelectedPreset(null);
              }}
              placeholder="e.g., Turn this into a poem, Write a letter to my future self..."
              placeholderTextColor={JonoTheme.colors.text.tertiary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            {/* Generate with Preset Button (when preset is selected) */}
            {selectedPreset && (
              <TouchableOpacity
                style={[
                  styles.generateCustomButton,
                  isGenerating && styles.generateCustomButtonDisabled,
                ]}
                onPress={() => handleGenerateWithPrompt(selectedPreset.prompt, true)}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.generateCustomButtonText}>
                    Generate {selectedPreset.label}
                  </Text>
                )}
              </TouchableOpacity>
            )}

            {/* Generate Custom Button (when custom prompt is typed) */}
            {customPrompt.trim() && !selectedPreset && (
              <TouchableOpacity
                style={[
                  styles.generateCustomButton,
                  isGenerating && styles.generateCustomButtonDisabled,
                ]}
                onPress={() => handleGenerateWithPrompt(customPrompt, false)}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.generateCustomButtonText}>
                    Generate with Custom Prompt
                  </Text>
                )}
              </TouchableOpacity>
            )}

            {/* Standard Article Option */}
            <TouchableOpacity
              style={[
                styles.standardArticleButton,
                isGenerating && styles.standardArticleButtonDisabled,
              ]}
              onPress={() => handleGenerateWithPrompt()}
              disabled={isGenerating}
            >
              <Text style={styles.standardArticleIcon}>📝</Text>
              <View style={styles.standardArticleText}>
                <Text style={styles.standardArticleTitle}>Standard Article</Text>
                <Text style={styles.standardArticleSubtitle}>Generate a journalistic article</Text>
              </View>
            </TouchableOpacity>

            {/* Hint */}
            <Text style={styles.promptHint}>
              The prompt you use will be saved with the generated content so you can remember how it was created.
            </Text>
          </ScrollView>
        </View>
      </Modal>
    </View>
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
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: JonoTheme.colors.text.primary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: JonoTheme.colors.text.secondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: JonoTheme.colors.background.card,
    borderRadius: JonoTheme.borderRadius.md,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: JonoTheme.colors.border.light,
    ...JonoTheme.shadows.soft,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: JonoTheme.colors.accent.primary,
  },
  statLabel: {
    fontSize: 11,
    color: JonoTheme.colors.text.secondary,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  wordsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: JonoTheme.colors.accent.muted,
    borderRadius: JonoTheme.borderRadius.lg,
    padding: 16,
    marginBottom: 20,
    gap: 14,
  },
  wordsIcon: {
    fontSize: 28,
  },
  wordsText: {
    flex: 1,
  },
  wordsValue: {
    fontSize: 22,
    fontWeight: '700',
    color: JonoTheme.colors.text.primary,
  },
  wordsLabel: {
    fontSize: 14,
    color: JonoTheme.colors.text.secondary,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: JonoTheme.colors.accent.muted,
    borderRadius: JonoTheme.borderRadius.lg,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: JonoTheme.colors.accent.primary,
    borderStyle: 'dashed',
    minHeight: 88,
    ...JonoTheme.shadows.soft,
  },
  generateIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  generateText: {
    flex: 1,
  },
  generateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: JonoTheme.colors.text.primary,
  },
  generateSubtitle: {
    fontSize: 14,
    color: JonoTheme.colors.text.secondary,
    marginTop: 4,
    lineHeight: 20,
  },
  generateChevron: {
    fontSize: 24,
    color: JonoTheme.colors.accent.primary,
    fontWeight: '700',
  },
  typeFilterScroll: {
    marginBottom: 16,
    marginHorizontal: -16,
  },
  typeFilterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  typeFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: JonoTheme.colors.background.card,
    borderRadius: JonoTheme.borderRadius.full,
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: JonoTheme.colors.border.light,
  },
  typeFilterButtonActive: {
    backgroundColor: JonoTheme.colors.accent.muted,
    borderColor: JonoTheme.colors.accent.primary,
  },
  typeFilterIcon: {
    fontSize: 14,
  },
  typeFilterLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: JonoTheme.colors.text.secondary,
  },
  typeFilterLabelActive: {
    color: JonoTheme.colors.accent.primary,
    fontWeight: '600',
  },
  contentList: {
    marginTop: 8,
  },
  emptyState: {
    backgroundColor: JonoTheme.colors.background.card,
    borderRadius: JonoTheme.borderRadius.xl,
    padding: 48,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: JonoTheme.colors.border.light,
    ...JonoTheme.shadows.soft,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: JonoTheme.colors.text.primary,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: JonoTheme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 28,
    paddingHorizontal: 16,
  },
  emptyButton: {
    backgroundColor: JonoTheme.colors.accent.primary,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: JonoTheme.borderRadius.full,
    minHeight: 52,
    minWidth: 200,
    alignItems: 'center',
    justifyContent: 'center',
    ...JonoTheme.shadows.medium,
  },
  emptyButtonText: {
    color: JonoTheme.colors.text.inverse,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: JonoTheme.colors.background.primary,
  },
  modalHeader: {
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
  modalClose: {
    minWidth: 70,
    minHeight: 44,
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 17,
    color: JonoTheme.colors.accent.primary,
    fontWeight: '600',
  },
  modalCloseCancel: {
    fontSize: 17,
    color: JonoTheme.colors.text.secondary,
  },
  modalCloseSave: {
    fontSize: 17,
    color: JonoTheme.colors.accent.primary,
    fontWeight: '600',
    textAlign: 'right',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: JonoTheme.colors.text.primary,
  },
  modalHeaderSpacer: {
    minWidth: 60,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },

  // Detail Modal
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  detailStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: JonoTheme.borderRadius.full,
  },
  detailStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: JonoTheme.colors.text.primary,
  },
  detailTypeBadge: {
    backgroundColor: JonoTheme.colors.accent.muted,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: JonoTheme.borderRadius.sm,
  },
  detailTypeText: {
    fontSize: 11,
    color: JonoTheme.colors.text.secondary,
    fontWeight: '500',
  },
  detailTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: JonoTheme.colors.text.primary,
    marginBottom: 12,
    lineHeight: 36,
  },
  detailSummary: {
    fontSize: 17,
    color: JonoTheme.colors.text.secondary,
    lineHeight: 26,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  detailSourceSection: {
    backgroundColor: JonoTheme.colors.accent.muted,
    padding: 12,
    borderRadius: JonoTheme.borderRadius.md,
  },
  detailSourceLabel: {
    fontSize: 13,
    color: JonoTheme.colors.text.secondary,
    fontWeight: '500',
  },
  detailDivider: {
    height: 1,
    backgroundColor: JonoTheme.colors.border.light,
    marginVertical: 20,
  },
  detailContent: {
    fontSize: 17,
    color: JonoTheme.colors.text.primary,
    lineHeight: 28,
  },
  detailSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: JonoTheme.colors.text.primary,
    marginBottom: 12,
  },
  detailQuote: {
    backgroundColor: JonoTheme.colors.accent.muted,
    padding: 16,
    borderRadius: JonoTheme.borderRadius.md,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: JonoTheme.colors.accent.primary,
  },
  detailQuoteText: {
    fontSize: 15,
    color: JonoTheme.colors.text.primary,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  detailPromptCard: {
    backgroundColor: JonoTheme.colors.background.secondary,
    padding: 14,
    borderRadius: JonoTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: JonoTheme.colors.border.light,
  },
  detailPromptText: {
    fontSize: 14,
    color: JonoTheme.colors.text.secondary,
    lineHeight: 20,
  },

  // Edit Modal
  editContent: {
    flex: 1,
    padding: 20,
  },
  editLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: JonoTheme.colors.text.secondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  editTitleInput: {
    fontSize: 20,
    fontWeight: '600',
    color: JonoTheme.colors.text.primary,
    backgroundColor: JonoTheme.colors.background.card,
    borderRadius: JonoTheme.borderRadius.md,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: JonoTheme.colors.border.light,
  },
  editContentInput: {
    fontSize: 16,
    color: JonoTheme.colors.text.primary,
    backgroundColor: JonoTheme.colors.background.card,
    borderRadius: JonoTheme.borderRadius.md,
    padding: 14,
    minHeight: 300,
    borderWidth: 1,
    borderColor: JonoTheme.colors.border.light,
    lineHeight: 24,
  },

  // Prompt Modal
  promptModalContent: {
    flex: 1,
    padding: 16,
  },
  presetSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: JonoTheme.colors.text.primary,
    marginBottom: 12,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  presetButton: {
    backgroundColor: JonoTheme.colors.background.card,
    borderRadius: JonoTheme.borderRadius.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: JonoTheme.colors.border.light,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
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
    fontSize: 15,
    color: JonoTheme.colors.text.primary,
    fontWeight: '500',
  },
  presetLabelSelected: {
    color: JonoTheme.colors.accent.primary,
  },
  customPromptTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: JonoTheme.colors.text.primary,
    marginBottom: 12,
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
    marginBottom: 20,
  },
  standardArticleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: JonoTheme.colors.background.card,
    borderRadius: JonoTheme.borderRadius.lg,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: JonoTheme.colors.border.light,
    minHeight: 72,
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
  generateCustomButton: {
    backgroundColor: JonoTheme.colors.accent.primary,
    borderRadius: JonoTheme.borderRadius.lg,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    minHeight: 56,
    ...JonoTheme.shadows.medium,
  },
  generateCustomButtonDisabled: {
    opacity: 0.4,
    ...JonoTheme.shadows.soft,
  },
  generateCustomButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.3,
  },
  promptHint: {
    fontSize: 13,
    color: JonoTheme.colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
});
