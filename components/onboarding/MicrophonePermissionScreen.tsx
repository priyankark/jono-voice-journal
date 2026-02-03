import React from 'react';
import { View, Text, StyleSheet, Linking, Platform } from 'react-native';
import { OnboardingScreen } from './OnboardingScreen';
import { OnboardingButton } from './OnboardingButton';
import { JonoTheme } from '../../constants/theme';
import { PermissionStatus } from '../../hooks/useOnboarding';

interface MicrophonePermissionScreenProps {
  permissionStatus: PermissionStatus;
  onRequestPermission: () => Promise<boolean>;
}

export const MicrophonePermissionScreen: React.FC<MicrophonePermissionScreenProps> = ({
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
          title: 'Microphone Access Enabled',
          subtitle: 'You\'re all set to record voice notes',
        };
      case 'denied':
        return {
          icon: '⚠️',
          title: 'Microphone Access Denied',
          subtitle: 'You can enable it later in Settings to use voice features',
        };
      default:
        return {
          icon: '🎙️',
          title: 'Enable Microphone Access',
          subtitle: 'Required to record voice notes and have conversations with Jono',
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
          <Text style={styles.infoTitle}>Why we need this</Text>
          <Text style={styles.infoText}>
            Jono captures your voice to create journal entries. All recording happens locally on your device - your voice is never uploaded to external servers.
          </Text>
        </View>

        {permissionStatus === 'undetermined' && (
          <View style={styles.buttonContainer}>
            <OnboardingButton
              title="Enable Microphone"
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
              You can continue without this permission, but voice features won't work.
            </Text>
          </View>
        )}

        {permissionStatus === 'granted' && (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>
              Perfect! You can now record voice notes and talk with Jono.
            </Text>
          </View>
        )}
      </View>
    </OnboardingScreen>
  );
};

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

export default MicrophonePermissionScreen;
