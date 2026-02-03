import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { OnboardingScreen } from './OnboardingScreen';
import { JonoTheme } from '../../constants/theme';

export const TwoWaysScreen: React.FC = () => {
  return (
    <OnboardingScreen
      title="Two Ways to Capture"
      subtitle="Choose how you want to journal based on your mood and moment"
    >
      <View style={styles.cardsContainer}>
        <CaptureCard
          emoji="🎙️"
          title="Voice Recording"
          description="Quick capture for when you want to get thoughts out fast. Record, review, and save."
          color={JonoTheme.colors.accent.primary}
        />
        <CaptureCard
          emoji="✨"
          title="Jono Conversations"
          description="Deeper exploration with follow-up questions. Jono helps you think through your thoughts."
          color={JonoTheme.colors.accent.secondary}
        />
      </View>
    </OnboardingScreen>
  );
};

interface CaptureCardProps {
  emoji: string;
  title: string;
  description: string;
  color: string;
}

const CaptureCard: React.FC<CaptureCardProps> = ({ emoji, title, description, color }) => (
  <View style={[styles.card, { borderLeftColor: color }]}>
    <View style={styles.cardHeader}>
      <Text style={styles.cardEmoji}>{emoji}</Text>
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
    <Text style={styles.cardDescription}>{description}</Text>
  </View>
);

const styles = StyleSheet.create({
  cardsContainer: {
    width: '100%',
    paddingTop: JonoTheme.spacing.md,
    gap: JonoTheme.spacing.lg,
  },
  card: {
    backgroundColor: JonoTheme.colors.background.card,
    padding: JonoTheme.spacing.lg,
    borderRadius: JonoTheme.borderRadius.md,
    borderLeftWidth: 4,
    ...JonoTheme.shadows.soft,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: JonoTheme.spacing.sm,
  },
  cardEmoji: {
    fontSize: 28,
    marginRight: JonoTheme.spacing.sm,
  },
  cardTitle: {
    ...JonoTheme.typography.title3,
    color: JonoTheme.colors.text.primary,
  },
  cardDescription: {
    ...JonoTheme.typography.body,
    color: JonoTheme.colors.text.secondary,
    lineHeight: 22,
  },
});

export default TwoWaysScreen;
