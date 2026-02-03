import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { OnboardingScreen } from './OnboardingScreen';
import { JonoTheme } from '../../constants/theme';

export const TransformScreen: React.FC = () => {
  return (
    <OnboardingScreen
      title="Transform Your Thoughts"
      subtitle="Turn voice notes and conversations into meaningful content"
      illustration={
        <View style={styles.illustrationContainer}>
          <View style={styles.transformFlow}>
            <View style={styles.inputBubble}>
              <Text style={styles.inputText}>"I've been feeling grateful for the small moments lately..."</Text>
            </View>
            <Text style={styles.arrow}>✨</Text>
            <View style={styles.outputCard}>
              <Text style={styles.outputLabel}>Gratitude Poem</Text>
              <Text style={styles.outputText}>In quiet mornings,{'\n'}coffee steam rises,{'\n'}carrying whispered thanks...</Text>
            </View>
          </View>
        </View>
      }
    >
      <View style={styles.transformTypes}>
        <TransformType emoji="📝" title="Poems" />
        <TransformType emoji="💌" title="Letters" />
        <TransformType emoji="📖" title="Essays" />
        <TransformType emoji="🙏" title="Gratitude" />
        <TransformType emoji="💡" title="Lessons" />
        <TransformType emoji="🧘" title="Mantras" />
      </View>
    </OnboardingScreen>
  );
};

interface TransformTypeProps {
  emoji: string;
  title: string;
}

const TransformType: React.FC<TransformTypeProps> = ({ emoji, title }) => (
  <View style={styles.transformItem}>
    <Text style={styles.transformEmoji}>{emoji}</Text>
    <Text style={styles.transformTitle}>{title}</Text>
  </View>
);

const styles = StyleSheet.create({
  illustrationContainer: {
    width: '100%',
    alignItems: 'center',
  },
  transformFlow: {
    alignItems: 'center',
    gap: JonoTheme.spacing.sm,
  },
  inputBubble: {
    backgroundColor: JonoTheme.colors.accent.muted,
    padding: JonoTheme.spacing.md,
    borderRadius: JonoTheme.borderRadius.md,
    maxWidth: '90%',
  },
  inputText: {
    ...JonoTheme.typography.body,
    color: JonoTheme.colors.text.primary,
    fontStyle: 'italic',
  },
  arrow: {
    fontSize: 32,
  },
  outputCard: {
    backgroundColor: JonoTheme.colors.background.card,
    padding: JonoTheme.spacing.md,
    borderRadius: JonoTheme.borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: JonoTheme.colors.accent.secondary,
    ...JonoTheme.shadows.soft,
    maxWidth: '90%',
  },
  outputLabel: {
    ...JonoTheme.typography.caption1,
    color: JonoTheme.colors.accent.secondary,
    fontWeight: '600',
    marginBottom: JonoTheme.spacing.xs,
  },
  outputText: {
    ...JonoTheme.typography.body,
    color: JonoTheme.colors.text.primary,
    lineHeight: 22,
  },
  transformTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: JonoTheme.spacing.sm,
    paddingTop: JonoTheme.spacing.md,
  },
  transformItem: {
    backgroundColor: JonoTheme.colors.background.card,
    paddingVertical: JonoTheme.spacing.sm,
    paddingHorizontal: JonoTheme.spacing.md,
    borderRadius: JonoTheme.borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: JonoTheme.spacing.xs,
    ...JonoTheme.shadows.soft,
  },
  transformEmoji: {
    fontSize: 16,
  },
  transformTitle: {
    ...JonoTheme.typography.subhead,
    color: JonoTheme.colors.text.primary,
  },
});

export default TransformScreen;
