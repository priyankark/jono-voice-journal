// ArticlePreview - Warm styled article preview card
import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated, Share, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import Markdown from 'react-native-markdown-display';
import { Article } from '../types';
import { formatDate } from '../utils/dateHelpers';
import { JonoTheme } from '../constants/theme';
import { getCompactMarkdownStyles } from '../constants/markdownStyles';

interface ArticlePreviewProps {
  article: Article;
  onPress: () => void;
  onImprove?: () => void;
}

// Toast feedback component
const CopyToast: React.FC<{ visible: boolean; message: string }> = ({ visible, message }) => {
  const [fadeAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(1500),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.toast, { opacity: fadeAnim }]}>
      <Text style={styles.toastIcon}>✓</Text>
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
};

export const ArticlePreview: React.FC<ArticlePreviewProps> = ({ article, onPress, onImprove }) => {
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const statusColors = {
    draft: JonoTheme.colors.status.draft,
    polished: JonoTheme.colors.status.polished,
    published: JonoTheme.colors.status.published,
  };

  const showCopyToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2000);
  }, []);

  const copyToClipboard = useCallback(async (text: string, feedbackMessage: string) => {
    try {
      await Clipboard.setStringAsync(text);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showCopyToast(feedbackMessage);
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error('Failed to copy:', error);
    }
  }, [showCopyToast]);

  const handleCopyFullArticle = useCallback((e: any) => {
    e.stopPropagation();
    const fullContent = `${article.title}\n\n${article.content}\n\n${article.keyQuotes.length > 0 ? 'Key Quotes:\n' + article.keyQuotes.map(q => `"${q}"`).join('\n') : ''}`;
    copyToClipboard(fullContent, 'Article copied!');
  }, [article, copyToClipboard]);

  const handleShareArticle = useCallback(async (e: any) => {
    e.stopPropagation();
    try {
      const shareContent = `${article.title}\n\n${article.content}${article.keyQuotes.length > 0 ? '\n\nKey Quotes:\n' + article.keyQuotes.map(q => `"${q}"`).join('\n') : ''}`;
      await Share.share({
        title: article.title,
        message: shareContent,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      if (error?.message !== 'User did not share') {
        console.error('Share error:', error);
      }
    }
  }, [article]);

  const handleCopyQuote = useCallback((quote: string, e: any) => {
    e.stopPropagation();
    copyToClipboard(`"${quote}"`, 'Quote copied!');
  }, [copyToClipboard]);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      {/* Toast notification */}
      <CopyToast visible={toastVisible} message={toastMessage} />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.statusBadge, { backgroundColor: statusColors[article.status] }]}>
            <Text style={styles.statusText}>{article.status}</Text>
          </View>
          <Text style={styles.date}>{formatDate(article.createdAt)}</Text>
        </View>
        {/* Action buttons */}
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.copyButton}
            onPress={handleCopyFullArticle}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.copyButtonText}>Copy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShareArticle}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.shareButtonText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.title}>{article.title}</Text>
      <View style={styles.summaryContainer}>
        <Markdown style={getCompactMarkdownStyles(14)}>
          {article.summary}
        </Markdown>
      </View>

      {article.keyQuotes.length > 0 && (
        <View style={styles.quotesSection}>
          <Text style={styles.quotesLabel}>Key Quotes (tap to copy)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {article.keyQuotes.slice(0, 3).map((quote, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quoteCard}
                onPress={(e) => handleCopyQuote(quote, e)}
                activeOpacity={0.7}
              >
                <Text style={styles.quoteText} numberOfLines={2}>"{quote}"</Text>
                <View style={styles.quoteCopyHint}>
                  <Text style={styles.quoteCopyHintText}>Tap to copy</Text>
                </View>
              </TouchableOpacity>
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
    position: 'relative',
  },
  // Toast styles
  toast: {
    position: 'absolute',
    top: 10,
    left: '50%',
    marginLeft: -60,
    width: 120,
    backgroundColor: JonoTheme.colors.accent.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: JonoTheme.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    ...JonoTheme.shadows.medium,
  },
  toastIcon: {
    color: JonoTheme.colors.text.inverse,
    fontSize: 14,
    fontWeight: '700',
    marginRight: 6,
  },
  toastText: {
    color: JonoTheme.colors.text.inverse,
    fontSize: 13,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  // Action buttons container
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  // Copy button styles - minimum 44px touch target
  copyButton: {
    backgroundColor: JonoTheme.colors.accent.muted,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: JonoTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: JonoTheme.colors.border.medium,
    minHeight: 36,
    minWidth: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: JonoTheme.colors.text.secondary,
  },
  // Share button styles - terracotta accent, minimum touch target
  shareButton: {
    backgroundColor: JonoTheme.colors.accent.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: JonoTheme.borderRadius.md,
    minHeight: 36,
    minWidth: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: JonoTheme.colors.text.inverse,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: JonoTheme.colors.text.primary,
    marginBottom: 8,
  },
  summaryContainer: {
    maxHeight: 70, // Approximately 3 lines of text
    overflow: 'hidden',
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
    padding: 14,
    borderRadius: JonoTheme.borderRadius.md,
    marginRight: 12,
    width: 210,
    minHeight: 80,
    borderWidth: 1,
    borderColor: JonoTheme.colors.border.light,
  },
  quoteText: {
    fontSize: 13,
    color: JonoTheme.colors.text.primary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  quoteCopyHint: {
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: JonoTheme.colors.border.light,
  },
  quoteCopyHintText: {
    fontSize: 10,
    color: JonoTheme.colors.accent.primary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: JonoTheme.borderRadius.md,
    minHeight: 44,
    justifyContent: 'center',
    ...JonoTheme.shadows.soft,
  },
  improveText: {
    color: JonoTheme.colors.text.inverse,
    fontSize: 14,
    fontWeight: '600',
  },
});
