// ContentLibraryCard - Enhanced article card for the content library with quick actions
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Share,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import Markdown from 'react-native-markdown-display';
import { Article, JournalEntry, ContentType } from '../types';
import { formatDate, getRelativeDate } from '../utils/dateHelpers';
import { JonoTheme } from '../constants/theme';
import { getCompactMarkdownStyles } from '../constants/markdownStyles';

interface ContentLibraryCardProps {
  article: Article;
  sourceEntries: JournalEntry[];
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onImprove?: () => void;
  onPublish?: () => void;
}

export const ContentLibraryCard: React.FC<ContentLibraryCardProps> = ({
  article,
  sourceEntries,
  onPress,
  onEdit,
  onDelete,
  onImprove,
  onPublish,
}) => {
  const [showActions, setShowActions] = useState(false);
  const [actionAnimation] = useState(new Animated.Value(0));

  const statusConfig = {
    draft: {
      color: JonoTheme.colors.status.draft,
      label: 'Draft',
      icon: '📝',
    },
    polished: {
      color: JonoTheme.colors.status.polished,
      label: 'Polished',
      icon: '✨',
    },
    published: {
      color: JonoTheme.colors.status.published,
      label: 'Published',
      icon: '🚀',
    },
  };

  const status = statusConfig[article.status];

  // Content type configuration
  const contentTypeConfig: Record<ContentType, { label: string; icon: string }> = {
    article: { label: 'Article', icon: '📝' },
    poem: { label: 'Poem', icon: '🎭' },
    letter: { label: 'Letter', icon: '💌' },
    gratitude: { label: 'Gratitude', icon: '🙏' },
    lessons: { label: 'Lessons', icon: '📚' },
    story: { label: 'Story', icon: '📖' },
    affirmations: { label: 'Affirmations', icon: '✨' },
    mantra: { label: 'Mantra', icon: '🕉️' },
    reflection: { label: 'Reflection', icon: '🔮' },
    custom: { label: 'Custom', icon: '🎨' },
  };

  const contentType = article.contentType ? contentTypeConfig[article.contentType] : null;

  const toggleActions = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const toValue = showActions ? 0 : 1;
    setShowActions(!showActions);
    Animated.spring(actionAnimation, {
      toValue,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(article.content);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Copied', 'Article content copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy content');
    }
    toggleActions();
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: article.title,
        message: `${article.title}\n\n${article.content}`,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Share error:', error);
    }
    toggleActions();
  };

  const handleEdit = () => {
    toggleActions();
    onEdit();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Article',
      'Are you sure you want to delete this article? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            onDelete();
          },
        },
      ]
    );
    toggleActions();
  };

  const actionsTranslateY = actionAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 0],
  });

  const actionsOpacity = actionAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  // Get content type display info
  const getContentTypeDisplay = () => {
    if (contentType) {
      return contentType;
    }
    // Fallback for articles without contentType field
    if (article.generationType === 'custom' && article.generationPrompt) {
      return { label: 'Custom', icon: '🎨' };
    }
    return { label: 'Article', icon: '📝' };
  };

  const typeDisplay = getContentTypeDisplay();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      onLongPress={toggleActions}
      activeOpacity={0.8}
    >
      {/* Status & Date Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
            <Text style={styles.statusIcon}>{status.icon}</Text>
            <Text style={styles.statusText}>{status.label}</Text>
          </View>
          <View style={styles.typeBadge}>
            <Text style={styles.typeIcon}>{typeDisplay.icon}</Text>
            <Text style={styles.typeText}>{typeDisplay.label}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.date}>{getRelativeDate(article.createdAt)}</Text>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={toggleActions}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.menuIcon}>...</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Actions Menu */}
      {showActions && (
        <Animated.View
          style={[
            styles.actionsContainer,
            {
              opacity: actionsOpacity,
              transform: [{ translateY: actionsTranslateY }],
            },
          ]}
        >
          <TouchableOpacity style={styles.actionButton} onPress={handleCopy}>
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionText}>Copy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.shareAction]} onPress={handleShare}>
            <Text style={styles.actionIcon}>📤</Text>
            <Text style={[styles.actionText, styles.shareText]}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
            <Text style={styles.actionIcon}>✏️</Text>
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
          {article.status === 'draft' && onImprove && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                toggleActions();
                onImprove();
              }}
            >
              <Text style={styles.actionIcon}>✨</Text>
              <Text style={styles.actionText}>Polish</Text>
            </TouchableOpacity>
          )}
          {article.status === 'polished' && onPublish && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                toggleActions();
                onPublish();
              }}
            >
              <Text style={styles.actionIcon}>🚀</Text>
              <Text style={styles.actionText}>Publish</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteAction]}
            onPress={handleDelete}
          >
            <Text style={styles.actionIcon}>🗑️</Text>
            <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Title */}
      <Text style={styles.title} numberOfLines={2}>
        {article.title}
      </Text>

      {/* Summary */}
      <View style={styles.summaryContainer}>
        <Markdown style={getCompactMarkdownStyles(14)}>
          {article.summary}
        </Markdown>
      </View>

      {/* Source Entries Section */}
      <View style={styles.sourceSection}>
        <Text style={styles.sourceLabel}>Source Entries</Text>
        <View style={styles.sourceEntries}>
          {sourceEntries.length > 0 ? (
            sourceEntries.slice(0, 3).map((entry, index) => (
              <View key={entry.id} style={styles.sourceEntry}>
                <View style={styles.sourceDot} />
                <Text style={styles.sourceEntryText} numberOfLines={1}>
                  {entry.context || entry.interviewee || formatDate(entry.date)}
                </Text>
                <Text style={styles.sourceEntryDate}>
                  {getRelativeDate(entry.date)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.noSourcesText}>
              {article.entryIds.length} entr{article.entryIds.length !== 1 ? 'ies' : 'y'}
            </Text>
          )}
          {sourceEntries.length > 3 && (
            <Text style={styles.moreEntries}>
              +{sourceEntries.length - 3} more
            </Text>
          )}
        </View>
      </View>

      {/* Key Quotes Preview */}
      {article.keyQuotes.length > 0 && (
        <View style={styles.quotesSection}>
          <View style={styles.quoteCard}>
            <Text style={styles.quoteIcon}>"</Text>
            <Text style={styles.quoteText} numberOfLines={2}>
              {article.keyQuotes[0]}
            </Text>
          </View>
          {article.keyQuotes.length > 1 && (
            <Text style={styles.moreQuotes}>
              +{article.keyQuotes.length - 1} more quotes
            </Text>
          )}
        </View>
      )}

      {/* Word Count & Read Time */}
      <View style={styles.footer}>
        <Text style={styles.footerStat}>
          {article.content.split(/\s+/).length} words
        </Text>
        <Text style={styles.footerDot}>·</Text>
        <Text style={styles.footerStat}>
          {Math.ceil(article.content.split(/\s+/).length / 200)} min read
        </Text>
        <Text style={styles.footerDot}>·</Text>
        <Text style={styles.footerStat}>
          {formatDate(article.createdAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: JonoTheme.colors.background.card,
    borderRadius: JonoTheme.borderRadius.lg,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: JonoTheme.colors.border.light,
    ...JonoTheme.shadows.medium,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: JonoTheme.borderRadius.full,
    gap: 4,
  },
  statusIcon: {
    fontSize: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: JonoTheme.colors.text.primary,
    textTransform: 'uppercase',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: JonoTheme.colors.accent.muted,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: JonoTheme.borderRadius.full,
    gap: 4,
  },
  typeIcon: {
    fontSize: 12,
  },
  typeText: {
    fontSize: 11,
    color: JonoTheme.colors.text.secondary,
    fontWeight: '500',
  },
  date: {
    fontSize: 12,
    color: JonoTheme.colors.text.tertiary,
  },
  menuButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: {
    fontSize: 20,
    color: JonoTheme.colors.text.secondary,
    fontWeight: '700',
    letterSpacing: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
    padding: 14,
    backgroundColor: JonoTheme.colors.background.secondary,
    borderRadius: JonoTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: JonoTheme.colors.border.light,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: JonoTheme.colors.background.card,
    borderRadius: JonoTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: JonoTheme.colors.border.light,
    minHeight: 44,
  },
  actionIcon: {
    fontSize: 16,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: JonoTheme.colors.text.primary,
  },
  shareAction: {
    backgroundColor: JonoTheme.colors.accent.primary,
    borderColor: JonoTheme.colors.accent.primary,
  },
  shareText: {
    color: JonoTheme.colors.text.inverse,
  },
  deleteAction: {
    borderColor: JonoTheme.colors.accent.primary,
  },
  deleteText: {
    color: JonoTheme.colors.accent.primary,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: JonoTheme.colors.text.primary,
    marginBottom: 8,
    lineHeight: 26,
  },
  summaryContainer: {
    maxHeight: 70, // Approximately 3 lines of text
    overflow: 'hidden',
    marginBottom: 16,
  },
  sourceSection: {
    marginBottom: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: JonoTheme.colors.border.light,
  },
  sourceLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: JonoTheme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  sourceEntries: {
    gap: 6,
  },
  sourceEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sourceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: JonoTheme.colors.accent.secondary,
  },
  sourceEntryText: {
    flex: 1,
    fontSize: 13,
    color: JonoTheme.colors.text.primary,
  },
  sourceEntryDate: {
    fontSize: 11,
    color: JonoTheme.colors.text.tertiary,
  },
  noSourcesText: {
    fontSize: 13,
    color: JonoTheme.colors.text.secondary,
  },
  moreEntries: {
    fontSize: 12,
    color: JonoTheme.colors.accent.primary,
    fontWeight: '500',
    marginTop: 4,
  },
  quotesSection: {
    marginBottom: 14,
  },
  quoteCard: {
    flexDirection: 'row',
    backgroundColor: JonoTheme.colors.accent.muted,
    padding: 14,
    borderRadius: JonoTheme.borderRadius.md,
    gap: 6,
    borderWidth: 1,
    borderColor: JonoTheme.colors.border.light,
  },
  quoteIcon: {
    fontSize: 24,
    color: JonoTheme.colors.accent.primary,
    fontWeight: '700',
    lineHeight: 24,
    marginTop: -4,
  },
  quoteText: {
    flex: 1,
    fontSize: 13,
    color: JonoTheme.colors.text.primary,
    fontStyle: 'italic',
    lineHeight: 19,
  },
  moreQuotes: {
    fontSize: 11,
    color: JonoTheme.colors.text.tertiary,
    marginTop: 6,
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: JonoTheme.colors.border.light,
  },
  footerStat: {
    fontSize: 12,
    color: JonoTheme.colors.text.tertiary,
  },
  footerDot: {
    fontSize: 12,
    color: JonoTheme.colors.text.tertiary,
    marginHorizontal: 6,
  },
});
