import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { OnboardingScreen } from './OnboardingScreen';
import { JonoTheme } from '../../constants/theme';

export const PrivacyScreen: React.FC = () => {
  return (
    <OnboardingScreen
      title="Privacy by Design"
      subtitle="Your thoughts stay on your device. Always."
      illustration={
        <View style={styles.shieldContainer}>
          <View style={styles.shield}>
            <Text style={styles.shieldEmoji}>🔒</Text>
          </View>
          <View style={styles.deviceCircle}>
            <Text style={styles.deviceEmoji}>📱</Text>
          </View>
        </View>
      }
    >
      <View style={styles.privacyPoints}>
        <PrivacyPoint
          emoji="💾"
          title="100% Local Storage"
          description="All your journal entries and conversations are stored only on your device"
        />
        <PrivacyPoint
          emoji="🧠"
          title="On-Device Processing"
          description="Voice transcription uses Apple Intelligence - your voice never leaves your phone"
        />
        <PrivacyPoint
          emoji="👤"
          title="No Account Required"
          description="Start journaling immediately - no sign-up, no email, no tracking"
        />
        <PrivacyPoint
          emoji="🗑️"
          title="You Control Deletion"
          description="Delete any entry permanently. Uninstall removes everything."
        />
      </View>
    </OnboardingScreen>
  );
};

interface PrivacyPointProps {
  emoji: string;
  title: string;
  description: string;
}

const PrivacyPoint: React.FC<PrivacyPointProps> = ({ emoji, title, description }) => (
  <View style={styles.privacyPoint}>
    <Text style={styles.pointEmoji}>{emoji}</Text>
    <View style={styles.pointText}>
      <Text style={styles.pointTitle}>{title}</Text>
      <Text style={styles.pointDescription}>{description}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  shieldContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 160,
  },
  shield: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: JonoTheme.colors.accent.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    ...JonoTheme.shadows.medium,
  },
  shieldEmoji: {
    fontSize: 48,
  },
  deviceCircle: {
    position: 'absolute',
    bottom: 0,
    right: '30%',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: JonoTheme.colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...JonoTheme.shadows.soft,
  },
  deviceEmoji: {
    fontSize: 24,
  },
  privacyPoints: {
    width: '100%',
    gap: JonoTheme.spacing.md,
  },
  privacyPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: JonoTheme.colors.background.card,
    padding: JonoTheme.spacing.md,
    borderRadius: JonoTheme.borderRadius.md,
  },
  pointEmoji: {
    fontSize: 20,
    marginRight: JonoTheme.spacing.md,
    marginTop: 2,
  },
  pointText: {
    flex: 1,
  },
  pointTitle: {
    ...JonoTheme.typography.subhead,
    color: JonoTheme.colors.text.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  pointDescription: {
    ...JonoTheme.typography.footnote,
    color: JonoTheme.colors.text.secondary,
    lineHeight: 18,
  },
});

export default PrivacyScreen;
