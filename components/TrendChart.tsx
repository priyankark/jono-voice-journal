// TrendChart - Warm styled trend visualization
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { WeeklyTrend } from '../types';
import { getWeekLabel } from '../utils/dateHelpers';
import { getTrendInsights } from '../services/trendAnalyzer';
import { JonoTheme } from '../constants/theme';

interface TrendChartProps {
  trend: WeeklyTrend;
}

export const TrendChart: React.FC<TrendChartProps> = ({ trend }) => {
  const [insights, setInsights] = useState<string[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(true);

  const totalSentiment = trend.sentimentOverview.positive + trend.sentimentOverview.neutral + trend.sentimentOverview.negative;

  const sentimentPercentages = totalSentiment > 0 ? {
    positive: (trend.sentimentOverview.positive / totalSentiment) * 100,
    neutral: (trend.sentimentOverview.neutral / totalSentiment) * 100,
    negative: (trend.sentimentOverview.negative / totalSentiment) * 100,
  } : { positive: 0, neutral: 0, negative: 0 };

  useEffect(() => {
    const loadInsights = async () => {
      setLoadingInsights(true);
      try {
        const result = await getTrendInsights(trend);
        setInsights(result);
      } catch (error) {
        console.error('Failed to load insights:', error);
        setInsights([]);
      } finally {
        setLoadingInsights(false);
      }
    };
    loadInsights();
  }, [trend]);

  return (
    <View style={styles.container}>
      <Text style={styles.weekLabel}>{getWeekLabel(trend.weekOf)}</Text>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{trend.totalInterviews}</Text>
          <Text style={styles.statLabel}>Entries</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{trend.totalMinutesRecorded}</Text>
          <Text style={styles.statLabel}>Minutes</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{trend.themes.length}</Text>
          <Text style={styles.statLabel}>Themes</Text>
        </View>
      </View>

      {/* Sentiment Bar */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sentiment Overview</Text>
        <View style={styles.sentimentBar}>
          <View style={[styles.sentimentSegment, styles.positive, { flex: sentimentPercentages.positive || 0.01 }]} />
          <View style={[styles.sentimentSegment, styles.neutral, { flex: sentimentPercentages.neutral || 0.01 }]} />
          <View style={[styles.sentimentSegment, styles.negative, { flex: sentimentPercentages.negative || 0.01 }]} />
        </View>
        <View style={styles.sentimentLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.positive]} />
            <Text style={styles.legendText}>Positive ({Math.round(sentimentPercentages.positive)}%)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.neutral]} />
            <Text style={styles.legendText}>Neutral ({Math.round(sentimentPercentages.neutral)}%)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.negative]} />
            <Text style={styles.legendText}>Negative ({Math.round(sentimentPercentages.negative)}%)</Text>
          </View>
        </View>
      </View>

      {/* Top Themes */}
      {trend.themes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Themes</Text>
          {trend.themes.slice(0, 5).map((theme, index) => (
            <View key={index} style={styles.themeRow}>
              <Text style={styles.themeName}>{theme.theme}</Text>
              <View style={styles.themeBarContainer}>
                <View
                  style={[
                    styles.themeBar,
                    { width: `${(theme.count / trend.themes[0].count) * 100}%` }
                  ]}
                />
              </View>
              <Text style={styles.themeCount}>{theme.count}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Insights */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Insights</Text>
        {loadingInsights ? (
          <ActivityIndicator color={JonoTheme.colors.accent.primary} style={styles.insightsLoader} />
        ) : (
          insights.map((insight, index) => (
            <View key={index} style={styles.insightRow}>
              <Text style={styles.insightBullet}>•</Text>
              <Text style={styles.insightText}>{insight}</Text>
            </View>
          ))
        )}
      </View>

      {/* Top Quotes */}
      {trend.topQuotes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notable Quotes</Text>
          {trend.topQuotes.slice(0, 3).map((quote, index) => (
            <View key={index} style={styles.quoteCard}>
              <Text style={styles.quoteText}>"{quote.quote}"</Text>
              <Text style={styles.quoteAuthor}>— {quote.interviewee}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: JonoTheme.colors.background.card,
    borderRadius: JonoTheme.borderRadius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: JonoTheme.colors.border.light,
    ...JonoTheme.shadows.soft,
  },
  weekLabel: {
    fontSize: 24,
    fontWeight: '700',
    color: JonoTheme.colors.text.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingVertical: 16,
    backgroundColor: JonoTheme.colors.accent.muted,
    borderRadius: JonoTheme.borderRadius.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: JonoTheme.colors.accent.primary,
  },
  statLabel: {
    fontSize: 12,
    color: JonoTheme.colors.text.secondary,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: JonoTheme.colors.text.tertiary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sentimentBar: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
  },
  sentimentSegment: {
    height: '100%',
  },
  positive: {
    backgroundColor: JonoTheme.colors.sentiment.positive,
  },
  neutral: {
    backgroundColor: JonoTheme.colors.sentiment.neutral,
  },
  negative: {
    backgroundColor: JonoTheme.colors.sentiment.negative,
  },
  sentimentLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: JonoTheme.colors.text.secondary,
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  themeName: {
    flex: 1,
    fontSize: 14,
    color: JonoTheme.colors.text.primary,
  },
  themeBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: JonoTheme.colors.accent.muted,
    borderRadius: 4,
    marginHorizontal: 10,
  },
  themeBar: {
    height: '100%',
    backgroundColor: JonoTheme.colors.accent.primary,
    borderRadius: 4,
  },
  themeCount: {
    fontSize: 14,
    color: JonoTheme.colors.text.secondary,
    width: 30,
    textAlign: 'right',
  },
  insightsLoader: {
    marginVertical: 12,
  },
  insightRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  insightBullet: {
    color: JonoTheme.colors.accent.primary,
    fontSize: 16,
    marginRight: 8,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: JonoTheme.colors.text.secondary,
    lineHeight: 20,
  },
  quoteCard: {
    backgroundColor: JonoTheme.colors.accent.muted,
    padding: 14,
    borderRadius: JonoTheme.borderRadius.md,
    marginBottom: 10,
  },
  quoteText: {
    fontSize: 14,
    color: JonoTheme.colors.text.primary,
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: 8,
  },
  quoteAuthor: {
    fontSize: 12,
    color: JonoTheme.colors.text.secondary,
    textAlign: 'right',
  },
});
