import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { JonoTheme } from '../../constants/theme';

export default function PrivacyPolicyScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lastUpdated}>Last Updated: February 2026</Text>

        <Section title="Overview">
          <Text style={styles.paragraph}>
            Jono is a voice-first journaling application designed with privacy as a core principle. This Privacy Policy explains how Jono handles your information.
          </Text>
        </Section>

        <Section title="Our Privacy Commitment">
          <Text style={styles.highlight}>
            Your data stays on your device. Always.
          </Text>
          <Text style={styles.paragraph}>
            Jono is built from the ground up to be a completely local, privacy-first application. We do not collect, transmit, or store any of your personal data on external servers.
          </Text>
        </Section>

        <Section title="What We Do NOT Collect">
          <BulletPoint>No personal information - we do not collect your name, email, phone number, or any identifying information</BulletPoint>
          <BulletPoint>No account required - Jono works without sign-up or registration</BulletPoint>
          <BulletPoint>No voice data transmitted - your voice recordings are never uploaded to external servers</BulletPoint>
          <BulletPoint>No analytics or tracking - we do not track your usage patterns or behaviors</BulletPoint>
          <BulletPoint>No location data - we do not access or store your location</BulletPoint>
          <BulletPoint>No third-party data sharing - we don't share information because we don't collect any</BulletPoint>
        </Section>

        <Section title="What Stays on Your Device">
          <Text style={styles.paragraph}>
            All of the following data is stored locally on your device only:
          </Text>
          <BulletPoint>Voice recordings</BulletPoint>
          <BulletPoint>Transcribed text from your recordings</BulletPoint>
          <BulletPoint>Journal entries and conversations</BulletPoint>
          <BulletPoint>Generated content (poems, letters, essays, etc.)</BulletPoint>
          <BulletPoint>Personal insights and analysis</BulletPoint>
          <BulletPoint>Tags, categories, and app preferences</BulletPoint>
        </Section>

        <Section title="Voice Processing">
          <Text style={styles.subheading}>Speech Recognition</Text>
          <Text style={styles.paragraph}>
            Jono uses Apple's on-device speech recognition technology to transcribe your voice recordings. This processing:
          </Text>
          <BulletPoint>Happens entirely on your iPhone</BulletPoint>
          <BulletPoint>Does not send your voice data to any external servers</BulletPoint>
          <BulletPoint>Does not require an internet connection for basic transcription</BulletPoint>
          <BulletPoint>Is controlled by Apple's privacy standards</BulletPoint>
        </Section>

        <Section title="Data Storage">
          <Text style={styles.paragraph}>
            All your data is stored using your device's secure local storage:
          </Text>
          <BulletPoint>Data is protected by your device's security (Face ID, Touch ID, passcode)</BulletPoint>
          <BulletPoint>Data is encrypted by iOS at the device level</BulletPoint>
          <BulletPoint>Only you can access your journal entries</BulletPoint>
        </Section>

        <Section title="Data Deletion">
          <Text style={styles.paragraph}>
            You have complete control over your data:
          </Text>
          <BulletPoint>Delete individual entries at any time from within the app</BulletPoint>
          <BulletPoint>Delete all recordings and transcriptions</BulletPoint>
          <BulletPoint>Uninstalling Jono removes all associated data permanently</BulletPoint>
        </Section>

        <Section title="AI Features">
          <Text style={styles.paragraph}>
            Jono's AI features, including voice transcription, content transformation, and insight generation, all use on-device processing capabilities. Your data never leaves your device for AI processing.
          </Text>
        </Section>

        <Section title="Your Rights">
          <Text style={styles.paragraph}>
            You have the right to:
          </Text>
          <BulletPoint>Access all your data (it's already on your device)</BulletPoint>
          <BulletPoint>Delete any or all of your data</BulletPoint>
          <BulletPoint>Use the app without providing any personal information</BulletPoint>
        </Section>

        <Section title="Contact Us">
          <Text style={styles.paragraph}>
            If you have questions about this Privacy Policy, please contact us at:
          </Text>
          <Text style={styles.contact}>privacy@jono-app.com</Text>
        </Section>

        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Summary</Text>
          <BulletPoint>100% local storage - your data never leaves your device</BulletPoint>
          <BulletPoint>No account needed - start using immediately</BulletPoint>
          <BulletPoint>No tracking - we don't monitor your behavior</BulletPoint>
          <BulletPoint>On-device AI - processing happens locally</BulletPoint>
          <BulletPoint>You're in control - delete anything, anytime</BulletPoint>
        </View>

        <Text style={styles.footer}>
          Jono is committed to protecting your privacy. Your thoughts are yours alone.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const BulletPoint: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={styles.bulletContainer}>
    <Text style={styles.bullet}>•</Text>
    <Text style={styles.bulletText}>{children}</Text>
  </View>
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
  lastUpdated: {
    ...JonoTheme.typography.caption1,
    color: JonoTheme.colors.text.tertiary,
    marginBottom: JonoTheme.spacing.lg,
  },
  section: {
    marginBottom: JonoTheme.spacing.xl,
  },
  sectionTitle: {
    ...JonoTheme.typography.title3,
    color: JonoTheme.colors.text.primary,
    marginBottom: JonoTheme.spacing.sm,
  },
  subheading: {
    ...JonoTheme.typography.headline,
    color: JonoTheme.colors.text.primary,
    marginTop: JonoTheme.spacing.sm,
    marginBottom: JonoTheme.spacing.xs,
  },
  paragraph: {
    ...JonoTheme.typography.body,
    color: JonoTheme.colors.text.secondary,
    lineHeight: 24,
    marginBottom: JonoTheme.spacing.sm,
  },
  highlight: {
    ...JonoTheme.typography.headline,
    color: JonoTheme.colors.accent.primary,
    marginBottom: JonoTheme.spacing.sm,
  },
  bulletContainer: {
    flexDirection: 'row',
    marginBottom: JonoTheme.spacing.xs,
    paddingLeft: JonoTheme.spacing.sm,
  },
  bullet: {
    ...JonoTheme.typography.body,
    color: JonoTheme.colors.accent.primary,
    marginRight: JonoTheme.spacing.sm,
  },
  bulletText: {
    ...JonoTheme.typography.body,
    color: JonoTheme.colors.text.secondary,
    flex: 1,
    lineHeight: 22,
  },
  contact: {
    ...JonoTheme.typography.body,
    color: JonoTheme.colors.accent.primary,
    marginTop: JonoTheme.spacing.xs,
  },
  summary: {
    backgroundColor: JonoTheme.colors.background.card,
    padding: JonoTheme.spacing.lg,
    borderRadius: JonoTheme.borderRadius.md,
    marginBottom: JonoTheme.spacing.lg,
    ...JonoTheme.shadows.soft,
  },
  summaryTitle: {
    ...JonoTheme.typography.headline,
    color: JonoTheme.colors.text.primary,
    marginBottom: JonoTheme.spacing.md,
  },
  footer: {
    ...JonoTheme.typography.footnote,
    color: JonoTheme.colors.text.tertiary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
