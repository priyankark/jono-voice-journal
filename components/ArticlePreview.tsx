// ArticlePreview - Warm styled article preview card
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Article } from '../types';
import { formatDate } from '../utils/dateHelpers';
import { JonoTheme } from '../constants/theme';

interface ArticlePreviewProps {
  article: Article;
  onPress: () => void;
  onImprove?: () => void;
}

export const ArticlePreview: React.FC<ArticlePreviewProps> = ({ article, onPress, onImprove }) => {
  const statusColors = {
    draft: JonoTheme.colors.status.draft,
    polished: JonoTheme.colors.status.polished,
    published: JonoTheme.colors.status.published,
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={[styles.statusBadge, { backgroundColor: statusColors[article.status] }]}>
          <Text style={styles.statusText}>{article.status}</Text>
        </View>
        <Text style={styles.date}>{formatDate(article.createdAt)}</Text>
      </View>

      <Text style={styles.title}>{article.title}</Text>
      <Text style={styles.summary} numberOfLines={3}>{article.summary}</Text>

      {article.keyQuotes.length > 0 && (
        <View style={styles.quotesSection}>
          <Text style={styles.quotesLabel}>Key Quotes</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {article.keyQuotes.slice(0, 3).map((quote, index) => (
              <View key={index} style={styles.quoteCard}>
                <Text style={styles.quoteText} numberOfLines={2}>"{quote}"</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.sourceCount}>
          From {article.entryIds.length} entr{article.entryIds.length !== 1 ? 'ies' : 'y'}
        </Text>
        {article.status === 'draft' && onImprove && (
          <TouchableOpacity style={styles.improveButton} onPress={onImprove}>
            <Text style={styles.improveText}>Polish with AI</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: JonoTheme.colors.background.card,
    borderRadius: JonoTheme.borderRadius.lg,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: JonoTheme.colors.border.light,
    ...JonoTheme.shadows.soft,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: JonoTheme.borderRadius.full,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: JonoTheme.colors.text.primary,
    textTransform: 'uppercase',
  },
  date: {
    fontSize: 13,
    color: JonoTheme.colors.text.tertiary,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: JonoTheme.colors.text.primary,
    marginBottom: 8,
  },
  summary: {
    fontSize: 14,
    color: JonoTheme.colors.text.secondary,
    lineHeight: 21,
    marginBottom: 12,
  },
  quotesSection: {
    marginBottom: 12,
  },
  quotesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: JonoTheme.colors.text.tertiary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  quoteCard: {
    backgroundColor: JonoTheme.colors.accent.muted,
    padding: 12,
    borderRadius: JonoTheme.borderRadius.md,
    marginRight: 10,
    width: 200,
  },
  quoteText: {
    fontSize: 13,
    color: JonoTheme.colors.text.primary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sourceCount: {
    fontSize: 12,
    color: JonoTheme.colors.text.tertiary,
  },
  improveButton: {
    backgroundColor: JonoTheme.colors.accent.secondary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: JonoTheme.borderRadius.md,
  },
  improveText: {
    color: JonoTheme.colors.text.inverse,
    fontSize: 13,
    fontWeight: '600',
  },
});
