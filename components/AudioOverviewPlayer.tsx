// AudioOverviewPlayer - Compact audio player card for insights screen
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { JonoTheme } from '../constants/theme';
import { PersonalInsight } from '../types';

interface AudioOverviewPlayerProps {
  insights: PersonalInsight[];
  isPlaying: boolean;
  isGenerating: boolean;
  onPlay: () => void;
  onStop: () => void;
  error?: string | null;
}

export const AudioOverviewPlayer: React.FC<AudioOverviewPlayerProps> = ({
  insights,
  isPlaying,
  isGenerating,
  onPlay,
  onStop,
  error,
}) => {
  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isPlaying) {
      onStop();
    } else if (!isGenerating) {
      onPlay();
    }
  };

  const getStatusText = (): string => {
    if (isGenerating) return 'Preparing...';
    if (isPlaying) return 'Listening...';
    if (error) return 'Tap to retry';
    return 'Hear a summary';
  };

  const getIcon = (): string => {
    if (isGenerating) return '';
    if (isPlaying) return '⏹';
    return '▶';
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isPlaying && styles.containerPlaying,
        error && styles.containerError,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={isGenerating}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          {isGenerating ? (
            <ActivityIndicator size="small" color={JonoTheme.colors.accent.primary} />
          ) : (
            <Text style={[styles.icon, isPlaying && styles.iconPlaying]}>
              {getIcon()}
            </Text>
          )}
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Audio Overview</Text>
          <Text style={[styles.status, error && styles.statusError]}>
            {getStatusText()}
          </Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{insights.length} insights</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: JonoTheme.colors.background.card,
    borderRadius: JonoTheme.borderRadius.lg,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: JonoTheme.colors.border.light,
    minHeight: 80,
    justifyContent: 'center',
    ...JonoTheme.shadows.soft,
  },
  containerPlaying: {
    borderColor: JonoTheme.colors.accent.primary,
    backgroundColor: JonoTheme.colors.accent.muted,
  },
  containerError: {
    borderColor: JonoTheme.colors.sentiment.negative,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: JonoTheme.colors.accent.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  icon: {
    fontSize: 18,
    color: JonoTheme.colors.accent.primary,
  },
  iconPlaying: {
    fontSize: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: JonoTheme.colors.text.primary,
    marginBottom: 3,
  },
  status: {
    fontSize: 14,
    color: JonoTheme.colors.text.secondary,
  },
  statusError: {
    color: JonoTheme.colors.sentiment.negative,
  },
  badge: {
    backgroundColor: JonoTheme.colors.accent.muted,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: JonoTheme.borderRadius.full,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: JonoTheme.colors.accent.primary,
  },
});
