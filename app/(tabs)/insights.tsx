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
import { AudioOverviewPlayer } from '../../components/AudioOverviewPlayer';
import { useAudioOverview } from '../../hooks/useAudioOverview';

export default function InsightsScreen() {
  const router = useRouter();
  const { entries, conversations, insights, setInsights, getInterventionPatterns } = useJournalStore();

  const [refreshing, setRefreshing] = useState(false);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [reflectionPrompts, setReflectionPrompts] = useState<ReflectionPrompt[]>([]);

  // Audio overview hook
  const {
    isGenerating: audioGenerating,
    isPlaying: audioPlaying,
    error: audioError,
    play: playAudio,
    stop: stopAudio,
  } = useAudioOverview();

  // Calculate stats
  const stats = useMemo(
    () => calculateJournalStats(entries, conversations),
    [entries, conversations]
  );

  // Get top intervention patterns
  const topPatterns = useMemo(() => {
    const patterns = getInterventionPatterns();
    return patterns
      .filter(p => p.useCount >= 3) // Only show patterns with at least 3 uses
      .sort((a, b) => b.averageEffectiveness - a.averageEffectiveness)
      .slice(0, 3);
  }, [getInterventionPatterns]);

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

  const formatApproachName = (approach: string): string => {
    const names: Record<string, string> = {
      cbt: 'CBT',
      act: 'ACT',
      motivationalInterviewing: 'Motivational',
      rogerian: 'Person-Centered',
      socratic: 'Socratic',
      grow: 'GROW',
      solutionFocused: 'Solution-Focused',
      performance: 'Performance',
      habitFormation: 'Habit Formation',
      valuesBasedLife: 'Values-Based',
    };
    return names[approach] || approach;
  };

  const formatCategoryName = (category: string): string => {
    const names: Record<string, string> = {
      reframe: 'Reframing',
      question: 'Questions',
      exercise: 'Exercises',
      strategy: 'Strategies',
      resource: 'Resources',
      reminder: 'Reminders',
      challenge: 'Challenges',
      validation: 'Validation',
      metaphor: 'Metaphors',
    };
    return names[category] || category;
  };

  const formatRelativeDate = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
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

      {/* Audio Overview Player */}
      {insights.length > 0 && (
        <AudioOverviewPlayer
          insights={insights}
          isPlaying={audioPlaying}
          isGenerating={audioGenerating}
          onPlay={() => playAudio(insights)}
          onStop={stopAudio}
          error={audioError}
        />
      )}

      {/* Personal Strategies Section */}
      {topPatterns.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 What Works For You</Text>
          <Text style={styles.sectionSubtitle}>
            Strategies that have been most effective in your conversations
          </Text>

          {topPatterns.map((pattern) => (
            <View key={pattern.id} style={styles.patternCard}>
              <View style={styles.patternHeader}>
                <Text style={styles.patternName}>
                  {formatApproachName(pattern.approach)} - {formatCategoryName(pattern.category)}
                </Text>
                <View style={styles.successBadge}>
                  <Text style={styles.successRate}>
                    {Math.round((pattern.successCount / pattern.useCount) * 100)}% effective
                  </Text>
                </View>
              </View>

              {pattern.worksBestWhen.length > 0 && (
                <View style={styles.conditionsSection}>
                  <Text style={styles.conditionsLabel}>Works best when:</Text>
                  <Text style={styles.conditionsText}>
                    {pattern.worksBestWhen.slice(0, 2).join(', ')}
                  </Text>
                </View>
              )}

              <View style={styles.patternFooter}>
                <Text style={styles.useCount}>
                  Used {pattern.useCount} times
                </Text>
                <Text style={styles.lastUsed}>
                  Last: {formatRelativeDate(pattern.lastUsed)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

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
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: JonoTheme.borderRadius.md,
    borderWidth: 1.5,
    borderColor: JonoTheme.colors.accent.primary,
    minHeight: 44,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: JonoTheme.colors.accent.primary,
  },
  promptCard: {
    backgroundColor: JonoTheme.colors.background.card,
    borderRadius: JonoTheme.borderRadius.lg,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: JonoTheme.colors.border.light,
    minHeight: 100,
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
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: JonoTheme.colors.border.light,
    ...JonoTheme.shadows.soft,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: JonoTheme.colors.text.primary,
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 15,
    color: JonoTheme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
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
    paddingVertical: 16,
    marginTop: 12,
    minHeight: 52,
    backgroundColor: JonoTheme.colors.background.card,
    borderRadius: JonoTheme.borderRadius.lg,
    borderWidth: 1,
    borderColor: JonoTheme.colors.border.light,
  },
  trendsLinkText: {
    fontSize: 16,
    color: JonoTheme.colors.accent.primary,
    marginRight: 10,
    fontWeight: '500',
  },
  trendsLinkArrow: {
    fontSize: 18,
    color: JonoTheme.colors.accent.primary,
    fontWeight: '600',
  },
  // Pattern card styles
  patternCard: {
    backgroundColor: JonoTheme.colors.background.card,
    borderRadius: JonoTheme.borderRadius.lg,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: JonoTheme.colors.border.light,
    ...JonoTheme.shadows.soft,
  },
  patternHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  patternName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: JonoTheme.colors.text.primary,
    lineHeight: 20,
  },
  successBadge: {
    backgroundColor: JonoTheme.colors.accent.muted,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: JonoTheme.borderRadius.full,
  },
  successRate: {
    fontSize: 12,
    fontWeight: '700',
    color: JonoTheme.colors.accent.primary,
  },
  conditionsSection: {
    backgroundColor: JonoTheme.colors.background.primary,
    borderRadius: JonoTheme.borderRadius.md,
    padding: 12,
    marginBottom: 12,
  },
  conditionsLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: JonoTheme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  conditionsText: {
    fontSize: 13,
    color: JonoTheme.colors.text.secondary,
    lineHeight: 19,
  },
  patternFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: JonoTheme.colors.border.light,
  },
  useCount: {
    fontSize: 12,
    color: JonoTheme.colors.text.tertiary,
    fontWeight: '500',
  },
  lastUsed: {
    fontSize: 12,
    color: JonoTheme.colors.text.tertiary,
  },
});
