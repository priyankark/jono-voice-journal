import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Article } from '../types';
import { formatDate } from '../utils/dateHelpers';

interface ArticlePreviewProps {
  article: Article;
  onPress: () => void;
  onImprove?: () => void;
}

export const ArticlePreview: React.FC<ArticlePreviewProps> = ({ article, onPress, onImprove }) => {
  const statusColors = {
    draft: '#ff9800',
    polished: '#4caf50',
    published: '#2196f3',
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
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
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
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'uppercase',
  },
  date: {
    fontSize: 13,
    color: '#666',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  summary: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 20,
    marginBottom: 12,
  },
  quotesSection: {
    marginBottom: 12,
  },
  quotesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  quoteCard: {
    backgroundColor: '#2a2a4e',
    padding: 12,
    borderRadius: 10,
    marginRight: 10,
    width: 200,
  },
  quoteText: {
    fontSize: 13,
    color: '#ccc',
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
    color: '#666',
  },
  improveButton: {
    backgroundColor: '#4a4ae8',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  improveText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
