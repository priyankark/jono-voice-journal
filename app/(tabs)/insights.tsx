// Insights Screen - Personal insights and reflection prompts
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useJournalStore } from '../../stores/journalStore';
import {
  generatePersonalInsights,
  generateReflectionPrompts,
  calculateJournalStats,
} from '../../services/insightsService';
import { JonoTheme } from '../../constants/theme';
import { PersonalInsight, ReflectionPrompt } from '../../types';

export default function InsightsScreen() {
  const router = useRouter();
  const { entries, conversations, insights, setInsights } = useJournalStore();

  const [refreshing, setRefreshing] = useState(false);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [reflectionPrompts, setReflectionPrompts] = useState<ReflectionPrompt[]>([]);

  // Calculate stats
  const stats = useMemo(
    () => calculateJournalStats(entries, conversations),
    [entries, conversations]
  );

  // Load reflection prompts on mount
  useEffect(() => {
    loadReflectionPrompts();
  }, []);

  const loadReflectionPrompts = async () => {
    const prompts = await generateReflectionPrompts(entries, 3);
    setReflectionPrompts(prompts);
  };

  const handleGenerateInsights = async () => {
    setLoadingInsights(true);
    try {
      const newInsights = await generatePersonalInsights(entries, conversations);
      setInsights(newInsights);
    } catch (error) {
      console.error('Failed to generate insights:', error);
    } finally {
      setLoadingInsights(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReflectionPrompts();
    setRefreshing(false);
  };

  const handlePromptPress = (prompt: ReflectionPrompt) => {
    // Navigate to assistant with this prompt
    router.push('/assistant');
  };

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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Insights</Text>
        <Text style={styles.subtitle}>Discover patterns in your thoughts</Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalEntries}</Text>
            <Text style={styles.statLabel}>Entries</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.entriesThisWeek}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.currentStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
        </View>
        {stats.totalMinutesRecorded > 0 && (
          <View style={styles.recordingStats}>
            <Text style={styles.recordingStatsText}>
              {stats.totalMinutesRecorded} minutes of voice captured
            </Text>
          </View>
        )}
      </View>

      {/* Reflection Prompts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reflect</Text>
        <Text style={styles.sectionSubtitle}>
          Tap a prompt to explore it with Jono
        </Text>
        {reflectionPrompts.map((prompt) => (
          <TouchableOpacity
            key={prompt.id}
            style={styles.promptCard}
            onPress={() => handlePromptPress(prompt)}
            activeOpacity={0.7}
          >
            <Text style={styles.promptText}>{prompt.prompt}</Text>
            <View style={styles.promptCategory}>
              <Text style={styles.promptCategoryText}>{prompt.category}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Personal Insights */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Your Insights</Text>
            <Text style={styles.sectionSubtitle}>AI-generated observations</Text>
          </View>
          <TouchableOpacity
            style={[styles.generateButton, loadingInsights && styles.generateButtonDisabled]}
            onPress={handleGenerateInsights}
            disabled={loadingInsights}
          >
            {loadingInsights ? (
              <ActivityIndicator size="small" color={JonoTheme.colors.accent.primary} />
            ) : (
              <Text style={styles.generateButtonText}>Generate</Text>
            )}
          </TouchableOpacity>
        </View>

        {insights.length === 0 ? (
          <View style={styles.emptyInsights}>
            <Text style={styles.emptyIcon}>💭</Text>
            <Text style={styles.emptyText}>No insights yet</Text>
            <Text style={styles.emptySubtext}>
              Keep journaling and tap "Generate" to discover patterns in your thoughts
            </Text>
          </View>
        ) : (
          insights.map((insight) => (
            <View key={insight.id} style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <Text style={styles.insightIcon}>{insight.icon}</Text>
                <View style={styles.insightTypeBadge}>
                  <Text style={styles.insightTypeText}>{insight.type}</Text>
                </View>
              </View>
              <Text style={styles.insightTitle}>{insight.title}</Text>
              <Text style={styles.insightDescription}>{insight.description}</Text>
            </View>
          ))
        )}
      </View>

      {/* Top Tags */}
      {stats.topTags.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Themes</Text>
          <View style={styles.tagsContainer}>
            {stats.topTags.map(({ tag, count }) => (
              <View key={tag} style={styles.tagBadge}>
                <Text style={styles.tagText}>{tag}</Text>
                <Text style={styles.tagCount}>{count}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Legacy: Link to Trends */}
      <TouchableOpacity
        style={styles.trendsLink}
        onPress={() => router.push('/trends')}
      >
        <Text style={styles.trendsLinkText}>View Weekly Trends</Text>
        <Text style={styles.trendsLinkArrow}>→</Text>
      </TouchableOpacity>
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
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: JonoTheme.colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: JonoTheme.colors.text.secondary,
  },
  statsCard: {
    backgroundColor: JonoTheme.colors.accent.primary,
    borderRadius: JonoTheme.borderRadius.lg,
    padding: 20,
    marginBottom: 24,
    ...JonoTheme.shadows.medium,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: JonoTheme.colors.text.inverse,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recordingStats: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
  },
  recordingStatsText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: JonoTheme.colors.text.primary,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: JonoTheme.colors.text.secondary,
    marginTop: 2,
    marginBottom: 12,
  },
  generateButton: {
    backgroundColor: JonoTheme.colors.background.card,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: JonoTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: JonoTheme.colors.accent.primary,
  },
  generateButtonDisabled: {
    opacity: 0.7,
  },
  generateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: JonoTheme.colors.accent.primary,
  },
  promptCard: {
    backgroundColor: JonoTheme.colors.background.card,
    borderRadius: JonoTheme.borderRadius.md,
    padding: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: JonoTheme.colors.border.light,
    ...JonoTheme.shadows.soft,
  },
  promptText: {
    fontSize: 16,
    color: JonoTheme.colors.text.primary,
    lineHeight: 24,
    marginBottom: 10,
  },
  promptCategory: {
    alignSelf: 'flex-start',
    backgroundColor: JonoTheme.colors.accent.muted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: JonoTheme.borderRadius.full,
  },
  promptCategoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: JonoTheme.colors.accent.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyInsights: {
    backgroundColor: JonoTheme.colors.background.card,
    borderRadius: JonoTheme.borderRadius.lg,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: JonoTheme.colors.border.light,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 17,
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
  insightCard: {
    backgroundColor: JonoTheme.colors.background.card,
    borderRadius: JonoTheme.borderRadius.md,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: JonoTheme.colors.border.light,
    ...JonoTheme.shadows.soft,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  insightIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  insightTypeBadge: {
    backgroundColor: JonoTheme.colors.accent.muted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: JonoTheme.borderRadius.full,
  },
  insightTypeText: {
    fontSize: 10,
    fontWeight: '600',
    color: JonoTheme.colors.accent.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  insightTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: JonoTheme.colors.text.primary,
    marginBottom: 6,
  },
  insightDescription: {
    fontSize: 14,
    color: JonoTheme.colors.text.secondary,
    lineHeight: 21,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: JonoTheme.colors.background.card,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: JonoTheme.borderRadius.full,
    borderWidth: 1,
    borderColor: JonoTheme.colors.border.light,
    gap: 8,
  },
  tagText: {
    fontSize: 14,
    color: JonoTheme.colors.text.primary,
    fontWeight: '500',
  },
  tagCount: {
    fontSize: 12,
    color: JonoTheme.colors.text.tertiary,
    fontWeight: '600',
  },
  trendsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 8,
  },
  trendsLinkText: {
    fontSize: 15,
    color: JonoTheme.colors.text.secondary,
    marginRight: 8,
  },
  trendsLinkArrow: {
    fontSize: 16,
    color: JonoTheme.colors.text.secondary,
  },
});
