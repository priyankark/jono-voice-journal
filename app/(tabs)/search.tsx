// Search Screen - Search your thoughts
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useJournalStore } from '../../stores/journalStore';
import { search, highlightMatches } from '../../services/searchService';
import { JonoTheme } from '../../constants/theme';
import { SearchResult, SearchResultType } from '../../types';
import { formatDate } from '../../utils/dateHelpers';

const TYPE_LABELS: Record<SearchResultType, { label: string; icon: string }> = {
  entry: { label: 'Entry', icon: '📝' },
  conversation: { label: 'Chat', icon: '💬' },
  article: { label: 'Article', icon: '📄' },
};

export default function SearchScreen() {
  const router = useRouter();
  const { entries, conversations, articles, getAllTags } = useJournalStore();

  const [query, setQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<SearchResultType[]>([]);

  const allTags = useMemo(() => getAllTags(), [entries, conversations]);

  // Perform search
  const results = useMemo(() => {
    if (!query.trim()) return [];
    return search(
      entries,
      conversations,
      articles,
      query,
      activeFilters.length > 0 ? { types: activeFilters } : undefined
    );
  }, [query, entries, conversations, articles, activeFilters]);

  const toggleFilter = (type: SearchResultType) => {
    setActiveFilters((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  const handleResultPress = (result: SearchResult) => {
    switch (result.type) {
      case 'entry':
        router.push(`/entry/${result.id}`);
        break;
      case 'conversation':
        // For now, just show alert. Could navigate to conversation detail
        break;
      case 'article':
        router.push('/articles');
        break;
    }
  };

  const renderHighlightedText = (text: string) => {
    const parts = highlightMatches(text, query);
    return (
      <Text style={styles.matchedText}>
        {parts.map((part, index) => (
          <Text
            key={index}
            style={part.highlight ? styles.highlight : undefined}
          >
            {part.text}
          </Text>
        ))}
      </Text>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
        <Text style={styles.subtitle}>Find anything in your journal</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search your thoughts..."
            placeholderTextColor={JonoTheme.colors.text.tertiary}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Text style={styles.clearButton}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {(Object.keys(TYPE_LABELS) as SearchResultType[]).map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.filterChip,
              activeFilters.includes(type) && styles.filterChipActive,
            ]}
            onPress={() => toggleFilter(type)}
          >
            <Text style={styles.filterIcon}>{TYPE_LABELS[type].icon}</Text>
            <Text
              style={[
                styles.filterLabel,
                activeFilters.includes(type) && styles.filterLabelActive,
              ]}
            >
              {TYPE_LABELS[type].label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results */}
      <ScrollView
        style={styles.resultsContainer}
        contentContainerStyle={styles.resultsContent}
        showsVerticalScrollIndicator={false}
      >
        {query.trim() === '' ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✨</Text>
            <Text style={styles.emptyTitle}>Search your thoughts</Text>
            <Text style={styles.emptySubtitle}>
              Find journal entries, conversations, and articles by searching for keywords, topics, or feelings
            </Text>

            {/* Popular tags */}
            {allTags.length > 0 && (
              <View style={styles.suggestionsSection}>
                <Text style={styles.suggestionsTitle}>Popular Tags</Text>
                <View style={styles.suggestionsContainer}>
                  {allTags.slice(0, 6).map((tag) => (
                    <TouchableOpacity
                      key={tag}
                      style={styles.suggestionChip}
                      onPress={() => setQuery(tag)}
                    >
                      <Text style={styles.suggestionText}>{tag}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        ) : results.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>No results found</Text>
            <Text style={styles.emptySubtitle}>
              Try different keywords or remove some filters
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.resultsCount}>
              {results.length} result{results.length !== 1 ? 's' : ''}
            </Text>
            {results.map((result) => (
              <TouchableOpacity
                key={`${result.type}-${result.id}`}
                style={styles.resultCard}
                onPress={() => handleResultPress(result)}
                activeOpacity={0.7}
              >
                <View style={styles.resultHeader}>
                  <View style={styles.resultTypeContainer}>
                    <Text style={styles.resultTypeIcon}>
                      {TYPE_LABELS[result.type].icon}
                    </Text>
                    <Text style={styles.resultType}>
                      {TYPE_LABELS[result.type].label}
                    </Text>
                  </View>
                  <Text style={styles.resultDate}>
                    {formatDate(result.date)}
                  </Text>
                </View>

                <Text style={styles.resultTitle} numberOfLines={1}>
                  {result.title}
                </Text>

                {renderHighlightedText(result.matchedText)}

                {result.tags && result.tags.length > 0 && (
                  <View style={styles.resultTags}>
                    {result.tags.slice(0, 3).map((tag) => (
                      <View key={tag} style={styles.resultTag}>
                        <Text style={styles.resultTagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: JonoTheme.colors.background.primary,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
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
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: JonoTheme.colors.background.card,
    borderRadius: JonoTheme.borderRadius.md,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: JonoTheme.colors.border.light,
    ...JonoTheme.shadows.soft,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: JonoTheme.colors.text.primary,
  },
  clearButton: {
    fontSize: 16,
    color: JonoTheme.colors.text.tertiary,
    padding: 4,
  },
  filtersContainer: {
    maxHeight: 50,
    marginBottom: 8,
  },
  filtersContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: JonoTheme.colors.background.card,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: JonoTheme.borderRadius.full,
    borderWidth: 1,
    borderColor: JonoTheme.colors.border.light,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: JonoTheme.colors.accent.primary,
    borderColor: JonoTheme.colors.accent.primary,
  },
  filterIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: JonoTheme.colors.text.secondary,
  },
  filterLabelActive: {
    color: JonoTheme.colors.text.inverse,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  resultsCount: {
    fontSize: 13,
    color: JonoTheme.colors.text.tertiary,
    marginBottom: 16,
  },
  resultCard: {
    backgroundColor: JonoTheme.colors.background.card,
    borderRadius: JonoTheme.borderRadius.md,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: JonoTheme.colors.border.light,
    ...JonoTheme.shadows.soft,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultTypeIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  resultType: {
    fontSize: 12,
    fontWeight: '500',
    color: JonoTheme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultDate: {
    fontSize: 12,
    color: JonoTheme.colors.text.tertiary,
  },
  resultTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: JonoTheme.colors.text.primary,
    marginBottom: 8,
  },
  matchedText: {
    fontSize: 14,
    color: JonoTheme.colors.text.secondary,
    lineHeight: 20,
  },
  highlight: {
    backgroundColor: JonoTheme.colors.accent.tertiary,
    fontWeight: '600',
    color: JonoTheme.colors.text.primary,
  },
  resultTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  resultTag: {
    backgroundColor: JonoTheme.colors.accent.muted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: JonoTheme.borderRadius.full,
  },
  resultTagText: {
    fontSize: 12,
    color: JonoTheme.colors.accent.primary,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: JonoTheme.colors.text.primary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: JonoTheme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  suggestionsSection: {
    marginTop: 32,
    alignItems: 'center',
  },
  suggestionsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: JonoTheme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: JonoTheme.colors.background.card,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: JonoTheme.borderRadius.full,
    borderWidth: 1,
    borderColor: JonoTheme.colors.border.light,
  },
  suggestionText: {
    fontSize: 14,
    color: JonoTheme.colors.text.primary,
  },
});
