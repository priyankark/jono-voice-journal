import React from 'react';
import { View, Text, StyleSheet, Linking, Platform } from 'react-native';
import { OnboardingScreen } from './OnboardingScreen';
import { OnboardingButton } from './OnboardingButton';
import { JonoTheme } from '../../constants/theme';
import { PermissionStatus } from '../../hooks/useOnboarding';

interface SpeechPermissionScreenProps {
  permissionStatus: PermissionStatus;
  onRequestPermission: () => Promise<boolean>;
}

export const SpeechPermissionScreen: React.FC<SpeechPermissionScreenProps> = ({
  permissionStatus,
  onRequestPermission,
}) => {
  const handleOpenSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    }
  };

  const getStatusContent = () => {
    switch (permissionStatus) {
      case 'granted':
        return {
          icon: '✅',
          title: "You're All Set",
          subtitle: 'Your voice will be transcribed into searchable text',
        };
      case 'denied':
        return {
          icon: '⚠️',
          title: 'Speech Recognition Denied',
          subtitle: 'You can enable it later in Settings for transcription',
        };
      default:
        return {
          icon: '🗣️',
          title: 'Speech Recognition',
          subtitle: 'Converts your voice into searchable text using Apple Intelligence',
        };
    }
  };

  const content = getStatusContent();

  return (
    <OnboardingScreen
      title={content.title}
      subtitle={content.subtitle}
      illustration={
        <View style={styles.iconContainer}>
          <View style={[
            styles.iconCircle,
            permissionStatus === 'granted' && styles.iconCircleGranted,
            permissionStatus === 'denied' && styles.iconCircleDenied,
          ]}>
            <Text style={styles.icon}>{content.icon}</Text>
          </View>
        </View>
      }
    >
      <View style={styles.content}>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Powered by Apple Intelligence</Text>
          <Text style={styles.infoText}>
            Speech recognition happens entirely on your iPhone using Apple's on-device technology. Your voice data is processed locally and never leaves your device.
          </Text>
        </View>

        <View style={styles.benefitsContainer}>
          <BenefitItem emoji="🔍" text="Search across all your entries" />
          <BenefitItem emoji="📝" text="Read transcripts of conversations" />
          <BenefitItem emoji="✨" text="Transform spoken words into content" />
        </View>

        {permissionStatus === 'undetermined' && (
          <View style={styles.buttonContainer}>
            <OnboardingButton
              title="Continue"
              onPress={onRequestPermission}
              variant="secondary"
            />
          </View>
        )}

        {permissionStatus === 'denied' && (
          <View style={styles.buttonContainer}>
            <OnboardingButton
              title="Open Settings"
              onPress={handleOpenSettings}
              variant="secondary"
            />
            <Text style={styles.skipNote}>
              Without this, your voice notes won't be transcribed into text.
            </Text>
          </View>
        )}

        {permissionStatus === 'granted' && (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>
              Your voice will be automatically transcribed into searchable text.
            </Text>
          </View>
        )}
      </View>
    </OnboardingScreen>
  );
};

interface BenefitItemProps {
  emoji: string;
  text: string;
}

const BenefitItem: React.FC<BenefitItemProps> = ({ emoji, text }) => (
  <View style={styles.benefitItem}>
    <Text style={styles.benefitEmoji}>{emoji}</Text>
    <Text style={styles.benefitText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 160,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: JonoTheme.colors.accent.muted,
    alignItems: 'center',
    justifyContent: 'center',
    ...JonoTheme.shadows.soft,
  },
  iconCircleGranted: {
    backgroundColor: '#E8F5E9',
  },
  iconCircleDenied: {
    backgroundColor: '#FFF3E0',
  },
  icon: {
    fontSize: 56,
  },
  content: {
    width: '100%',
    gap: JonoTheme.spacing.lg,
  },
  infoCard: {
    backgroundColor: JonoTheme.colors.background.card,
    padding: JonoTheme.spacing.lg,
    borderRadius: JonoTheme.borderRadius.md,
    ...JonoTheme.shadows.soft,
  },
  infoTitle: {
    ...JonoTheme.typography.headline,
    color: JonoTheme.colors.text.primary,
    marginBottom: JonoTheme.spacing.sm,
  },
  infoText: {
    ...JonoTheme.typography.body,
    color: JonoTheme.colors.text.secondary,
    lineHeight: 22,
  },
  benefitsContainer: {
    gap: JonoTheme.spacing.sm,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: JonoTheme.spacing.sm,
  },
  benefitEmoji: {
    fontSize: 20,
    marginRight: JonoTheme.spacing.md,
  },
  benefitText: {
    ...JonoTheme.typography.body,
    color: JonoTheme.colors.text.primary,
  },
  buttonContainer: {
    alignItems: 'center',
    gap: JonoTheme.spacing.md,
  },
  skipNote: {
    ...JonoTheme.typography.footnote,
    color: JonoTheme.colors.text.tertiary,
    textAlign: 'center',
  },
  successContainer: {
    alignItems: 'center',
  },
  successText: {
    ...JonoTheme.typography.body,
    color: JonoTheme.colors.accent.secondary,
    textAlign: 'center',
  },
});

export default SpeechPermissionScreen;
