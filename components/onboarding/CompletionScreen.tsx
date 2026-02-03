import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AnimatedOrb } from '../AnimatedOrb';
import { OnboardingScreen } from './OnboardingScreen';
import { JonoTheme } from '../../constants/theme';

export const CompletionScreen: React.FC = () => {
  return (
    <OnboardingScreen
      title="You're Ready!"
      subtitle="Start capturing your thoughts and discovering insights"
      illustration={
        <View style={styles.orbContainer}>
          <AnimatedOrb state="speaking" size={120} />
        </View>
      }
    >
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>Quick Tips</Text>

        <TipItem
          number="1"
          title="Capture Tab"
          description="Hold to record a quick voice note"
        />
        <TipItem
          number="2"
          title="Jono Tab"
          description="Tap the orb to start a conversation"
        />
        <TipItem
          number="3"
          title="Transform"
          description="Turn entries into poems, letters, and more"
        />
        <TipItem
          number="4"
          title="Insights"
          description="Check back after a few entries for AI insights"
        />
      </View>

      <View style={styles.readyMessage}>
        <Text style={styles.readyEmoji}>🎉</Text>
        <Text style={styles.readyText}>Your journaling journey begins now</Text>
      </View>
    </OnboardingScreen>
  );
};

interface TipItemProps {
  number: string;
  title: string;
  description: string;
}

const TipItem: React.FC<TipItemProps> = ({ number, title, description }) => (
  <View style={styles.tipItem}>
    <View style={styles.tipNumber}>
      <Text style={styles.tipNumberText}>{number}</Text>
    </View>
    <View style={styles.tipContent}>
      <Text style={styles.tipTitle}>{title}</Text>
      <Text style={styles.tipDescription}>{description}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  orbContainer: {
    paddingVertical: JonoTheme.spacing.lg,
  },
  tipsContainer: {
    width: '100%',
    marginBottom: JonoTheme.spacing.lg,
  },
  tipsTitle: {
    ...JonoTheme.typography.headline,
    color: JonoTheme.colors.text.primary,
    marginBottom: JonoTheme.spacing.md,
    textAlign: 'center',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: JonoTheme.colors.background.card,
    padding: JonoTheme.spacing.md,
    borderRadius: JonoTheme.borderRadius.md,
    marginBottom: JonoTheme.spacing.sm,
    ...JonoTheme.shadows.soft,
  },
  tipNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: JonoTheme.colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: JonoTheme.spacing.md,
  },
  tipNumberText: {
    ...JonoTheme.typography.subhead,
    color: '#fff',
    fontWeight: '700',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    ...JonoTheme.typography.subhead,
    color: JonoTheme.colors.text.primary,
    fontWeight: '600',
  },
  tipDescription: {
    ...JonoTheme.typography.caption1,
    color: JonoTheme.colors.text.secondary,
  },
  readyMessage: {
    alignItems: 'center',
    paddingTop: JonoTheme.spacing.md,
  },
  readyEmoji: {
    fontSize: 32,
    marginBottom: JonoTheme.spacing.sm,
  },
  readyText: {
    ...JonoTheme.typography.body,
    color: JonoTheme.colors.text.secondary,
    textAlign: 'center',
  },
});

export default CompletionScreen;
