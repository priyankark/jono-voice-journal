import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { useJournalStore } from '../../stores/journalStore';
import { TrendChart } from '../../components/TrendChart';
import { generateWeeklyTrend } from '../../services/trendAnalyzer';
import { getWeekRange, getWeekLabel } from '../../utils/dateHelpers';
import { WeeklyTrend } from '../../types';

export default function TrendsScreen() {
  const { entries, weeklyTrends, addWeeklyTrend } = useJournalStore();
  const [refreshing, setRefreshing] = useState(false);
  const [currentTrend, setCurrentTrend] = useState<WeeklyTrend | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Get entries from this week
  const thisWeek = getWeekRange(new Date());
  const thisWeekEntries = useMemo(() => {
    return entries.filter(e => {
      const entryDate = new Date(e.date);
      return entryDate >= thisWeek.start && entryDate <= thisWeek.end;
    });
  }, [entries, thisWeek.start, thisWeek.end]);

  // Generate current week trend when entries change
  useEffect(() => {
    const generateTrend = async () => {
      if (thisWeekEntries.length === 0) {
        setCurrentTrend(null);
        return;
      }
      try {
        const trend = await generateWeeklyTrend(thisWeekEntries);
        setCurrentTrend(trend);
      } catch (error) {
        console.error('Failed to generate trend:', error);
      }
    };
    generateTrend();
  }, [thisWeekEntries]);

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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4a4ae8" />}
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
          <ActivityIndicator color="#4a4ae8" />
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
    backgroundColor: '#0d0d1a',
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  summaryCard: {
    backgroundColor: '#4a4ae8',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  summaryPeriod: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
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
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  summaryStatLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  generateButton: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#4a4ae8',
  },
  generateButtonDisabled: {
    opacity: 0.7,
  },
  generateText: {
    color: '#4a4ae8',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  pastTrendCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
    color: '#fff',
  },
  pastTrendBadge: {
    fontSize: 12,
    color: '#4a4ae8',
    fontWeight: '500',
  },
  pastTrendTheme: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
  },
  pastTrendThemeName: {
    fontSize: 14,
    color: '#ccc',
  },
  pastTrendThemeCount: {
    fontSize: 14,
    color: '#888',
  },
  emptyState: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});
