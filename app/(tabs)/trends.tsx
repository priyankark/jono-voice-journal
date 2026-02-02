import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { useJournalStore } from '../../stores/journalStore';
import { TrendChart } from '../../components/TrendChart';
import { generateWeeklyTrend } from '../../services/trendAnalyzer';
import { getWeekRange, getWeekLabel } from '../../utils/dateHelpers';
import { WeeklyTrend } from '../../types';
import { JonoTheme } from '../../constants/theme';

export default function TrendsScreen() {
  const { entries, weeklyTrends, addWeeklyTrend } = useJournalStore();
  const [refreshing, setRefreshing] = useState(false);
  const [currentTrend, setCurrentTrend] = useState<WeeklyTrend | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Get entries from this week - memoize the week range to prevent infinite loops
  const thisWeek = useMemo(() => getWeekRange(new Date()), []);
  const thisWeekEntries = useMemo(() => {
    return entries.filter(e => {
      const entryDate = new Date(e.date);
      return entryDate >= thisWeek.start && entryDate <= thisWeek.end;
    });
  }, [entries, thisWeek]);

  // Generate current week trend when entries change
  useEffect(() => {
    let cancelled = false;
    const generateTrend = async () => {
      if (thisWeekEntries.length === 0) {
        setCurrentTrend(null);
        return;
      }
      try {
        const trend = await generateWeeklyTrend(thisWeekEntries);
        if (!cancelled) {
          setCurrentTrend(trend);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to generate trend:', error);
        }
      }
    };
    generateTrend();
    return () => { cancelled = true; };
  }, [thisWeekEntries.length]);

  const handleGenerateTrend = async () => {
    if (thisWeekEntries.length === 0) {
      Alert.alert('No Data', 'Record some interviews this week to generate trend insights.');
      return;
    }

    setIsGenerating(true);
    try {
      const trend = await generateWeeklyTrend(thisWeekEntries);
      addWeeklyTrend(trend);
      Alert.alert('Trend Generated', 'Weekly trend report has been saved.');
    } catch (error) {
      Alert.alert('Error', 'Failed to generate trend report. Please try again.');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (thisWeekEntries.length > 0) {
      try {
        const trend = await generateWeeklyTrend(thisWeekEntries);
        setCurrentTrend(trend);
      } catch (error) {
        console.error('Failed to refresh trend:', error);
      }
    }
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={JonoTheme.colors.accent.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Weekly Trends</Text>
        <Text style={styles.subtitle}>Insights from your interviews</Text>
      </View>

      {/* This Week Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>This Week</Text>
        <Text style={styles.summaryPeriod}>{getWeekLabel(new Date())}</Text>
        <View style={styles.summaryStats}>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryValue}>{thisWeekEntries.length}</Text>
            <Text style={styles.summaryStatLabel}>Interviews</Text>
          </View>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryValue}>
              {thisWeekEntries.reduce((sum, e) => sum + (e.voiceRecording?.duration || 0) / 60, 0).toFixed(0)}
            </Text>
            <Text style={styles.summaryStatLabel}>Minutes</Text>
          </View>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryValue}>
              {new Set(thisWeekEntries.flatMap(e => e.tags)).size}
            </Text>
            <Text style={styles.summaryStatLabel}>Topics</Text>
          </View>
        </View>
      </View>

      {/* Generate Button */}
      <TouchableOpacity
        style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
        onPress={handleGenerateTrend}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <ActivityIndicator color={JonoTheme.colors.accent.primary} />
        ) : (
          <Text style={styles.generateText}>Generate This Week's Report</Text>
        )}
      </TouchableOpacity>

      {/* Current Trend */}
      {currentTrend && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Live Insights</Text>
          <TrendChart trend={currentTrend} />
        </View>
      )}

      {/* Past Trends */}
      {weeklyTrends.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Past Reports</Text>
          {weeklyTrends.map((trend) => (
            <TouchableOpacity
              key={trend.id}
              style={styles.pastTrendCard}
              onPress={() => {
                // Could expand to show full trend
                Alert.alert(
                  getWeekLabel(new Date(trend.weekOf)),
                  `${trend.totalInterviews} interviews\n${trend.themes.length} themes identified\n${trend.topQuotes.length} quotes captured`
                );
              }}
            >
              <View style={styles.pastTrendHeader}>
                <Text style={styles.pastTrendDate}>{getWeekLabel(new Date(trend.weekOf))}</Text>
                <Text style={styles.pastTrendBadge}>{trend.totalInterviews} interviews</Text>
              </View>
              {trend.themes.slice(0, 3).map((theme, index) => (
                <View key={index} style={styles.pastTrendTheme}>
                  <Text style={styles.pastTrendThemeName}>{theme.theme}</Text>
                  <Text style={styles.pastTrendThemeCount}>{theme.count}×</Text>
                </View>
              ))}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Empty State */}
      {thisWeekEntries.length === 0 && weeklyTrends.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyText}>No trends yet</Text>
          <Text style={styles.emptySubtext}>
            Record interviews throughout the week to see patterns, themes, and sentiment trends across your conversations.
          </Text>
        </View>
      )}
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
  summaryCard: {
    backgroundColor: JonoTheme.colors.accent.primary,
    borderRadius: JonoTheme.borderRadius.lg,
    padding: 20,
    marginBottom: 24,
    ...JonoTheme.shadows.medium,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryPeriod: {
    fontSize: 20,
    fontWeight: '700',
    color: JonoTheme.colors.text.inverse,
    marginTop: 4,
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryStat: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: '700',
    color: JonoTheme.colors.text.inverse,
  },
  summaryStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  generateButton: {
    backgroundColor: JonoTheme.colors.background.card,
    borderRadius: JonoTheme.borderRadius.md,
    paddingVertical: 16,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    borderWidth: 1.5,
    borderColor: JonoTheme.colors.accent.primary,
    minHeight: 52,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateText: {
    color: JonoTheme.colors.accent.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: JonoTheme.colors.text.primary,
    marginBottom: 16,
  },
  pastTrendCard: {
    backgroundColor: JonoTheme.colors.background.card,
    borderRadius: JonoTheme.borderRadius.md,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: JonoTheme.colors.border.light,
    ...JonoTheme.shadows.soft,
  },
  pastTrendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pastTrendDate: {
    fontSize: 16,
    fontWeight: '600',
    color: JonoTheme.colors.text.primary,
  },
  pastTrendBadge: {
    fontSize: 12,
    color: JonoTheme.colors.accent.primary,
    fontWeight: '600',
  },
  pastTrendTheme: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: JonoTheme.colors.border.light,
  },
  pastTrendThemeName: {
    fontSize: 14,
    color: JonoTheme.colors.text.primary,
  },
  pastTrendThemeCount: {
    fontSize: 14,
    color: JonoTheme.colors.text.tertiary,
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: JonoTheme.colors.background.card,
    borderRadius: JonoTheme.borderRadius.lg,
    padding: 40,
    alignItems: 'center',
    marginTop: 20,
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
});
