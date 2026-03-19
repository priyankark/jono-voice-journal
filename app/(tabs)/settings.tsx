import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { apple } from '@react-native-ai/apple';
import { JonoTheme } from '../../constants/theme';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { useTeachingStore } from '../../stores/teachingStore';

export default function SettingsScreen() {
  const router = useRouter();
  const { resetOnboarding } = useOnboardingStore();
  const { resetTips } = useTeachingStore();
  const isAppleIntelligenceAvailable = apple.isAvailable();

  const handleReplayTutorial = () => {
    Alert.alert(
      'Replay Tutorial',
      'This will show the welcome tutorial again. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Replay',
          onPress: () => {
            resetOnboarding();
            resetTips();
            router.replace('/onboarding');
          },
        },
      ]
    );
  };

  const handlePrivacyPolicy = () => {
    router.push('/legal/privacy-policy');
  };

  const handleTermsOfService = () => {
    router.push('/legal/terms-of-service');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* App Section */}
        <Text style={styles.sectionTitle}>App</Text>
        <View style={styles.section}>
          <SettingsItem
            icon="📖"
            title="Replay Tutorial"
            subtitle="Watch the welcome guide again"
            onPress={handleReplayTutorial}
          />
        </View>

        {/* Legal Section */}
        <Text style={styles.sectionTitle}>Legal</Text>
        <View style={styles.section}>
          <SettingsItem
            icon="🔒"
            title="Privacy Policy"
            subtitle="How we protect your data"
            onPress={handlePrivacyPolicy}
          />
          <View style={styles.separator} />
          <SettingsItem
            icon="📄"
            title="Terms of Service"
            subtitle="Usage terms and conditions"
            onPress={handleTermsOfService}
          />
        </View>

        {/* About Section */}
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.section}>
          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>Version</Text>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>Apple Intelligence</Text>
            <Text style={[
              styles.aboutValue,
              isAppleIntelligenceAvailable ? styles.statusEnabled : styles.statusDisabled
            ]}>
              {isAppleIntelligenceAvailable ? 'Enabled' : 'Not Available'}
            </Text>
          </View>
          {!isAppleIntelligenceAvailable && (
            <Text style={styles.aiHint}>
              Jono works best with Apple Intelligence enabled for smarter conversations and insights.
            </Text>
          )}
          <View style={styles.separator} />
          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>Made with</Text>
            <Text style={styles.aboutValue}>love for journaling</Text>
          </View>
        </View>

        {/* Privacy Note */}
        <View style={styles.privacyNote}>
          <Text style={styles.privacyIcon}>🔒</Text>
          <Text style={styles.privacyText}>
            All your data stays on this device. We don't collect any personal information.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface SettingsItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
}

const SettingsItem: React.FC<SettingsItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
}) => (
  <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.7}>
    <Text style={styles.itemIcon}>{icon}</Text>
    <View style={styles.itemContent}>
      <Text style={styles.itemTitle}>{title}</Text>
      {subtitle && <Text style={styles.itemSubtitle}>{subtitle}</Text>}
    </View>
    <Text style={styles.itemArrow}>›</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: JonoTheme.colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: JonoTheme.spacing.lg,
    paddingBottom: JonoTheme.spacing.xxl,
  },
  sectionTitle: {
    ...JonoTheme.typography.footnote,
    color: JonoTheme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: JonoTheme.spacing.sm,
    marginTop: JonoTheme.spacing.lg,
    marginLeft: JonoTheme.spacing.sm,
  },
  section: {
    backgroundColor: JonoTheme.colors.background.card,
    borderRadius: JonoTheme.borderRadius.md,
    overflow: 'hidden',
    ...JonoTheme.shadows.soft,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: JonoTheme.spacing.md,
    minHeight: 60,
  },
  itemIcon: {
    fontSize: 20,
    marginRight: JonoTheme.spacing.md,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    ...JonoTheme.typography.body,
    color: JonoTheme.colors.text.primary,
  },
  itemSubtitle: {
    ...JonoTheme.typography.caption1,
    color: JonoTheme.colors.text.secondary,
    marginTop: 2,
  },
  itemArrow: {
    ...JonoTheme.typography.title2,
    color: JonoTheme.colors.text.tertiary,
  },
  separator: {
    height: 1,
    backgroundColor: JonoTheme.colors.border.light,
    marginLeft: 52,
  },
  aboutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: JonoTheme.spacing.md,
    minHeight: 48,
  },
  aboutLabel: {
    ...JonoTheme.typography.body,
    color: JonoTheme.colors.text.primary,
  },
  aboutValue: {
    ...JonoTheme.typography.body,
    color: JonoTheme.colors.text.secondary,
  },
  statusEnabled: {
    color: JonoTheme.colors.sentiment.positive,
  },
  statusDisabled: {
    color: JonoTheme.colors.text.tertiary,
  },
  aiHint: {
    ...JonoTheme.typography.caption1,
    color: JonoTheme.colors.text.tertiary,
    paddingHorizontal: JonoTheme.spacing.md,
    paddingBottom: JonoTheme.spacing.sm,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: JonoTheme.colors.accent.muted,
    padding: JonoTheme.spacing.md,
    borderRadius: JonoTheme.borderRadius.md,
    marginTop: JonoTheme.spacing.xl,
  },
  privacyIcon: {
    fontSize: 20,
    marginRight: JonoTheme.spacing.md,
  },
  privacyText: {
    ...JonoTheme.typography.footnote,
    color: JonoTheme.colors.text.secondary,
    flex: 1,
    lineHeight: 18,
  },
});
