// Articles Screen - Warm styled article list
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useJournalStore } from '../../stores/journalStore';
import { ArticlePreview } from '../../components/ArticlePreview';
import { generateArticle, improveArticle } from '../../services/articleGenerator';
import { JonoTheme } from '../../constants/theme';

export default function ArticlesScreen() {
  const router = useRouter();
  const { articles, entries, updateArticle, addArticle } = useJournalStore();
  const [refreshing, setRefreshing] = useState(false);

  const handleImprove = async (articleId: string) => {
    const article = articles.find(a => a.id === articleId);
    if (!article) return;

    try {
      const improved = await improveArticle(article);
      updateArticle(articleId, improved);
      Alert.alert('Article Polished', 'Your article has been improved with AI.');
    } catch (error) {
      console.error('Failed to improve article:', error);
      Alert.alert('Error', 'Failed to polish article.');
    }
  };

  const handleGenerateFromAll = async () => {
    if (entries.length === 0) {
      Alert.alert('No Entries', 'Capture some thoughts first to generate an article.');
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

    try {
      const article = await generateArticle(recentEntries);
      addArticle(article);
      Alert.alert('Article Generated', `Created article from ${recentEntries.length} entries.`);
    } catch (error) {
      console.error('Failed to generate article:', error);
      Alert.alert('Error', 'Failed to generate article.');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  const draftCount = articles.filter(a => a.status === 'draft').length;
  const polishedCount = articles.filter(a => a.status === 'polished').length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={JonoTheme.colors.accent.primary}
        />
      }
    >
      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{articles.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: JonoTheme.colors.status.draft }]}>{draftCount}</Text>
          <Text style={styles.statLabel}>Drafts</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: JonoTheme.colors.status.polished }]}>{polishedCount}</Text>
          <Text style={styles.statLabel}>Polished</Text>
        </View>
      </View>

      {/* Generate Button */}
      <TouchableOpacity style={styles.generateButton} onPress={handleGenerateFromAll}>
        <Text style={styles.generateIcon}>✨</Text>
        <View style={styles.generateText}>
          <Text style={styles.generateTitle}>Generate Weekly Article</Text>
          <Text style={styles.generateSubtitle}>Combine recent entries into one article</Text>
        </View>
      </TouchableOpacity>

      {/* Articles List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Articles</Text>

        {articles.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📄</Text>
            <Text style={styles.emptyText}>No articles yet</Text>
            <Text style={styles.emptySubtext}>
              Capture your thoughts and tap "Transform to Article" to create polished content
            </Text>
          </View>
        ) : (
          articles.map((article) => (
            <ArticlePreview
              key={article.id}
              article={article}
              onPress={() => {
                Alert.alert(article.title, article.content.slice(0, 500) + '...');
              }}
              onImprove={article.status === 'draft' ? () => handleImprove(article.id) : undefined}
            />
          ))
        )}
      </View>
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
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: JonoTheme.colors.background.card,
    borderRadius: JonoTheme.borderRadius.md,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: JonoTheme.colors.border.light,
    ...JonoTheme.shadows.soft,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: JonoTheme.colors.accent.primary,
  },
  statLabel: {
    fontSize: 12,
    color: JonoTheme.colors.text.secondary,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: JonoTheme.colors.background.card,
    borderRadius: JonoTheme.borderRadius.lg,
    padding: 18,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: JonoTheme.colors.accent.primary,
    borderStyle: 'dashed',
  },
  generateIcon: {
    fontSize: 32,
    marginRight: 14,
  },
  generateText: {
    flex: 1,
  },
  generateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: JonoTheme.colors.text.primary,
  },
  generateSubtitle: {
    fontSize: 13,
    color: JonoTheme.colors.text.secondary,
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: JonoTheme.colors.text.primary,
    marginBottom: 16,
  },
  emptyState: {
    backgroundColor: JonoTheme.colors.background.card,
    borderRadius: JonoTheme.borderRadius.lg,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: JonoTheme.colors.border.light,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: JonoTheme.colors.text.primary,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: JonoTheme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
