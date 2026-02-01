import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { WeeklyTrend } from '../types';
import { getWeekLabel } from '../utils/dateHelpers';
import { getTrendInsights } from '../services/trendAnalyzer';

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
          <Text style={styles.statLabel}>Interviews</Text>
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
          <ActivityIndicator color="#4a4ae8" style={styles.insightsLoader} />
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
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
  },
  weekLabel: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingVertical: 16,
    backgroundColor: '#2a2a4e',
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#4a4ae8',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
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
    color: '#888',
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
    backgroundColor: '#4caf50',
  },
  neutral: {
    backgroundColor: '#9e9e9e',
  },
  negative: {
    backgroundColor: '#f44336',
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
    color: '#888',
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  themeName: {
    flex: 1,
    fontSize: 14,
    color: '#ccc',
  },
  themeBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#2a2a4e',
    borderRadius: 4,
    marginHorizontal: 10,
  },
  themeBar: {
    height: '100%',
    backgroundColor: '#4a4ae8',
    borderRadius: 4,
  },
  themeCount: {
    fontSize: 14,
    color: '#888',
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
    color: '#4a4ae8',
    fontSize: 16,
    marginRight: 8,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  quoteCard: {
    backgroundColor: '#2a2a4e',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  quoteText: {
    fontSize: 14,
    color: '#ccc',
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: 8,
  },
  quoteAuthor: {
    fontSize: 12,
    color: '#888',
    textAlign: 'right',
  },
});
