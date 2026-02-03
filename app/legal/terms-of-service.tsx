import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { JonoTheme } from '../../constants/theme';

export default function TermsOfServiceScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lastUpdated}>Last Updated: February 2026</Text>

        <Section title="Agreement to Terms">
          <Text style={styles.paragraph}>
            By downloading, installing, or using Jono, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the app.
          </Text>
        </Section>

        <Section title="Description of Service">
          <Text style={styles.paragraph}>
            Jono is a voice-first journaling application that helps you capture thoughts through voice recordings and AI-assisted conversations. Features include:
          </Text>
          <BulletPoint>Voice note recording and transcription</BulletPoint>
          <BulletPoint>AI conversation companion</BulletPoint>
          <BulletPoint>Content transformation (poems, letters, essays, etc.)</BulletPoint>
          <BulletPoint>Personal insight generation</BulletPoint>
          <BulletPoint>Local storage of journal entries</BulletPoint>
        </Section>

        <Section title="User Responsibilities">
          <Text style={styles.paragraph}>
            You agree to use Jono only for lawful purposes. You agree not to:
          </Text>
          <BulletPoint>Use the app for any illegal purpose</BulletPoint>
          <BulletPoint>Attempt to gain unauthorized access to the app's systems</BulletPoint>
          <BulletPoint>Reverse engineer, decompile, or disassemble the app</BulletPoint>
          <BulletPoint>Remove or modify any proprietary notices from the app</BulletPoint>
        </Section>

        <Section title="Content Ownership">
          <Text style={styles.paragraph}>
            You retain full ownership of all content you create using Jono:
          </Text>
          <BulletPoint>Your voice recordings belong entirely to you</BulletPoint>
          <BulletPoint>Journal entries and generated content are yours</BulletPoint>
          <BulletPoint>We do not claim any rights to your personal content</BulletPoint>
        </Section>

        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>Important Disclaimer</Text>
          <Text style={styles.warningText}>
            Jono is NOT a replacement for professional mental health services.
          </Text>
          <Text style={styles.paragraph}>
            The app is designed for personal reflection and journaling only. AI responses and suggestions are not medical, psychological, or therapeutic advice.
          </Text>
          <Text style={styles.paragraph}>
            If you are experiencing mental health concerns, please consult a qualified healthcare professional. In case of emergency, contact emergency services or a crisis helpline.
          </Text>
        </View>

        <Section title="AI Limitations">
          <Text style={styles.paragraph}>
            The AI features in Jono:
          </Text>
          <BulletPoint>Provide suggestions based on general patterns</BulletPoint>
          <BulletPoint>Should not be relied upon for critical decisions</BulletPoint>
          <BulletPoint>May occasionally produce unexpected results</BulletPoint>
          <BulletPoint>Are intended to facilitate reflection, not provide professional guidance</BulletPoint>
        </Section>

        <Section title="Privacy">
          <Text style={styles.paragraph}>
            Your privacy is fundamental to Jono's design. Key points:
          </Text>
          <BulletPoint>All data is stored locally on your device</BulletPoint>
          <BulletPoint>No personal information is collected or transmitted</BulletPoint>
          <BulletPoint>No account or registration is required</BulletPoint>
          <Text style={styles.link}>
            See our Privacy Policy for full details.
          </Text>
        </Section>

        <Section title="Intellectual Property">
          <Text style={styles.paragraph}>
            Jono, including its design, features, code, and branding, is protected by intellectual property laws. You may not copy, reproduce, or create derivative works based on the app.
          </Text>
          <Text style={styles.paragraph}>
            You retain all rights to your voice recordings, journal entries, and content you create using the app.
          </Text>
        </Section>

        <Section title="Warranty Disclaimer">
          <Text style={styles.paragraph}>
            JONO IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. We do not warrant that the app will meet your specific requirements, be uninterrupted, or error-free.
          </Text>
        </Section>

        <Section title="Limitation of Liability">
          <Text style={styles.paragraph}>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, JONO AND ITS CREATORS SHALL NOT BE LIABLE FOR:
          </Text>
          <BulletPoint>Any indirect, incidental, or consequential damages</BulletPoint>
          <BulletPoint>Any loss of profits, data, or goodwill</BulletPoint>
          <BulletPoint>Any damages resulting from AI-generated content</BulletPoint>
        </Section>

        <Section title="Changes to Terms">
          <Text style={styles.paragraph}>
            We reserve the right to modify these Terms at any time. Changes will be effective when posted within the app. Your continued use constitutes acceptance of modified Terms.
          </Text>
        </Section>

        <Section title="Termination">
          <Text style={styles.paragraph}>
            You may stop using Jono at any time by uninstalling the app. Uninstalling removes all locally stored data. We reserve the right to discontinue the app or features at any time.
          </Text>
        </Section>

        <Section title="Contact Information">
          <Text style={styles.paragraph}>
            For questions about these Terms of Service:
          </Text>
          <Text style={styles.contact}>support@jono-app.com</Text>
        </Section>

        <Text style={styles.footer}>
          By using Jono, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
        </Text>

        <Text style={styles.thankYou}>
          Thank you for using Jono. We hope it helps you on your journaling journey.
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
  paragraph: {
    ...JonoTheme.typography.body,
    color: JonoTheme.colors.text.secondary,
    lineHeight: 24,
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
  warningBox: {
    backgroundColor: '#FFF3E0',
    padding: JonoTheme.spacing.lg,
    borderRadius: JonoTheme.borderRadius.md,
    marginBottom: JonoTheme.spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: JonoTheme.colors.accent.primary,
  },
  warningTitle: {
    ...JonoTheme.typography.headline,
    color: JonoTheme.colors.accent.primary,
    marginBottom: JonoTheme.spacing.sm,
  },
  warningText: {
    ...JonoTheme.typography.body,
    color: JonoTheme.colors.text.primary,
    fontWeight: '600',
    marginBottom: JonoTheme.spacing.sm,
  },
  link: {
    ...JonoTheme.typography.body,
    color: JonoTheme.colors.accent.primary,
    marginTop: JonoTheme.spacing.xs,
  },
  contact: {
    ...JonoTheme.typography.body,
    color: JonoTheme.colors.accent.primary,
    marginTop: JonoTheme.spacing.xs,
  },
  footer: {
    ...JonoTheme.typography.footnote,
    color: JonoTheme.colors.text.secondary,
    textAlign: 'center',
    marginTop: JonoTheme.spacing.lg,
    marginBottom: JonoTheme.spacing.md,
  },
  thankYou: {
    ...JonoTheme.typography.footnote,
    color: JonoTheme.colors.text.tertiary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
