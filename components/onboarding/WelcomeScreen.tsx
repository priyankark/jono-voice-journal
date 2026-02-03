import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AnimatedOrb } from '../AnimatedOrb';
import { OnboardingScreen } from './OnboardingScreen';
import { JonoTheme } from '../../constants/theme';

export const WelcomeScreen: React.FC = () => {
  return (
    <OnboardingScreen
      title="Welcome to Jono"
      subtitle="Your voice-first journaling companion that turns thoughts into insights"
      illustration={
        <View style={styles.orbContainer}>
          <AnimatedOrb state="idle" size={140} />
        </View>
      }
    >
      <View style={styles.featuresContainer}>
        <FeatureItem
          emoji="🎙️"
          text="Speak your thoughts freely"
        />
        <FeatureItem
          emoji="💭"
          text="Have reflective conversations"
        />
        <FeatureItem
          emoji="✨"
          text="Transform ideas into insights"
        />
      </View>
    </OnboardingScreen>
  );
};

interface FeatureItemProps {
  emoji: string;
  text: string;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ emoji, text }) => (
  <View style={styles.featureItem}>
    <Text style={styles.emoji}>{emoji}</Text>
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  orbContainer: {
    paddingVertical: JonoTheme.spacing.xl,
  },
  featuresContainer: {
    width: '100%',
    paddingTop: JonoTheme.spacing.lg,
    gap: JonoTheme.spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: JonoTheme.colors.background.card,
    padding: JonoTheme.spacing.md,
    borderRadius: JonoTheme.borderRadius.md,
    ...JonoTheme.shadows.soft,
  },
  emoji: {
    fontSize: 24,
    marginRight: JonoTheme.spacing.md,
  },
  featureText: {
    ...JonoTheme.typography.body,
    color: JonoTheme.colors.text.primary,
    flex: 1,
  },
});

export default WelcomeScreen;
