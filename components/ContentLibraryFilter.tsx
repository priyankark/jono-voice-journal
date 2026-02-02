// ContentLibraryFilter - Filter and sort controls for the content library
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { ContentFilterStatus, ContentSortOption } from '../types';
import { JonoTheme } from '../constants/theme';

interface ContentLibraryFilterProps {
  statusFilter: ContentFilterStatus;
  sortBy: ContentSortOption;
  searchQuery: string;
  onStatusChange: (status: ContentFilterStatus) => void;
  onSortChange: (sort: ContentSortOption) => void;
  onSearchChange: (query: string) => void;
  totalCount: number;
  filteredCount: number;
}

export const ContentLibraryFilter: React.FC<ContentLibraryFilterProps> = ({
  statusFilter,
  sortBy,
  searchQuery,
  onStatusChange,
  onSortChange,
  onSearchChange,
  totalCount,
  filteredCount,
}) => {
  const [showSortMenu, setShowSortMenu] = useState(false);

  const statusOptions: { value: ContentFilterStatus; label: string; icon: string }[] = [
    { value: 'all', label: 'All', icon: '📚' },
    { value: 'draft', label: 'Drafts', icon: '📝' },
    { value: 'polished', label: 'Polished', icon: '✨' },
    { value: 'published', label: 'Published', icon: '🚀' },
  ];

  const sortOptions: { value: ContentSortOption; label: string }[] = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'title', label: 'Title A-Z' },
    { value: 'status', label: 'By Status' },
  ];

  const handleStatusChange = (status: ContentFilterStatus) => {
    Haptics.selectionAsync();
    onStatusChange(status);
  };

  const handleSortChange = (sort: ContentSortOption) => {
    Haptics.selectionAsync();
    onSortChange(sort);
    setShowSortMenu(false);
  };

  const currentSort = sortOptions.find(s => s.value === sortBy);

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search your content..."
          placeholderTextColor={JonoTheme.colors.text.tertiary}
          value={searchQuery}
          onChangeText={onSearchChange}
          returnKeyType="search"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => onSearchChange('')}
            style={styles.clearButton}
          >
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Status Filter Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterScrollContent}
      >
        {statusOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.filterPill,
              statusFilter === option.value && styles.filterPillActive,
            ]}
            onPress={() => handleStatusChange(option.value)}
          >
            <Text style={styles.filterIcon}>{option.icon}</Text>
            <Text
              style={[
                styles.filterText,
                statusFilter === option.value && styles.filterTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sort and Count Row */}
      <View style={styles.sortRow}>
        <Text style={styles.countText}>
          {filteredCount === totalCount
            ? `${totalCount} items`
            : `${filteredCount} of ${totalCount} items`}
        </Text>

        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowSortMenu(!showSortMenu)}
        >
          <Text style={styles.sortIcon}>↕️</Text>
          <Text style={styles.sortText}>{currentSort?.label}</Text>
          <Text style={styles.sortChevron}>{showSortMenu ? '▲' : '▼'}</Text>
        </TouchableOpacity>
      </View>

      {/* Sort Dropdown Menu */}
      {showSortMenu && (
        <View style={styles.sortMenu}>
          {sortOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.sortMenuItem,
                sortBy === option.value && styles.sortMenuItemActive,
              ]}
              onPress={() => handleSortChange(option.value)}
            >
              <Text
                style={[
                  styles.sortMenuText,
                  sortBy === option.value && styles.sortMenuTextActive,
                ]}
              >
                {option.label}
              </Text>
              {sortBy === option.value && (
                <Text style={styles.sortMenuCheck}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: JonoTheme.colors.background.card,
    borderRadius: JonoTheme.borderRadius.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: JonoTheme.colors.border.light,
    minHeight: 48,
    ...JonoTheme.shadows.soft,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: JonoTheme.colors.text.primary,
    padding: 0,
  },
  clearButton: {
    padding: 10,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -8,
  },
  clearIcon: {
    fontSize: 16,
    color: JonoTheme.colors.text.secondary,
    fontWeight: '500',
  },
  filterScroll: {
    marginBottom: 12,
  },
  filterScrollContent: {
    gap: 8,
    paddingRight: 16,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: JonoTheme.borderRadius.full,
    backgroundColor: JonoTheme.colors.background.card,
    borderWidth: 1,
    borderColor: JonoTheme.colors.border.light,
    minHeight: 44,
  },
  filterPillActive: {
    backgroundColor: JonoTheme.colors.accent.primary,
    borderColor: JonoTheme.colors.accent.primary,
  },
  filterIcon: {
    fontSize: 14,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: JonoTheme.colors.text.secondary,
  },
  filterTextActive: {
    color: JonoTheme.colors.text.inverse,
  },
  sortRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  countText: {
    fontSize: 13,
    color: JonoTheme.colors.text.tertiary,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: JonoTheme.colors.background.card,
    borderRadius: JonoTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: JonoTheme.colors.border.light,
    minHeight: 44,
  },
  sortIcon: {
    fontSize: 12,
  },
  sortText: {
    fontSize: 13,
    color: JonoTheme.colors.text.primary,
    fontWeight: '500',
  },
  sortChevron: {
    fontSize: 8,
    color: JonoTheme.colors.text.tertiary,
  },
  sortMenu: {
    backgroundColor: JonoTheme.colors.background.card,
    borderRadius: JonoTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: JonoTheme.colors.border.light,
    marginTop: 4,
    ...JonoTheme.shadows.medium,
    overflow: 'hidden',
  },
  sortMenuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: JonoTheme.colors.border.light,
    minHeight: 48,
  },
  sortMenuItemActive: {
    backgroundColor: JonoTheme.colors.accent.muted,
  },
  sortMenuText: {
    fontSize: 14,
    color: JonoTheme.colors.text.primary,
  },
  sortMenuTextActive: {
    color: JonoTheme.colors.accent.primary,
    fontWeight: '600',
  },
  sortMenuCheck: {
    fontSize: 14,
    color: JonoTheme.colors.accent.primary,
    fontWeight: '700',
  },
});
