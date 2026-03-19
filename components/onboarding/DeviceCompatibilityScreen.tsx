import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { apple } from '@react-native-ai/apple';
import { OnboardingScreen } from './OnboardingScreen';
import { JonoTheme } from '../../constants/theme';

interface DeviceCompatibilityScreenProps {
  onCompatibilityChecked: (isCompatible: boolean) => void;
  onContinue: () => void;
}

export const DeviceCompatibilityScreen: React.FC<DeviceCompatibilityScreenProps> = ({
  onCompatibilityChecked,
  onContinue,
}) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isCompatible, setIsCompatible] = useState(false);

  useEffect(() => {
    const checkCompatibility = async () => {
      setIsChecking(true);
      try {
        const available = apple.isAvailable();
        setIsCompatible(available);
        onCompatibilityChecked(available);
      } catch (error) {
        console.error('Error checking Apple Intelligence availability:', error);
        setIsCompatible(false);
        onCompatibilityChecked(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkCompatibility();
  }, [onCompatibilityChecked]);

  const openSupportPage = () => {
    Linking.openURL('https://support.apple.com/en-in/121115');
  };

  if (isChecking) {
    return (
      <OnboardingScreen
        title="Checking Device"
        subtitle="Verifying Apple Intelligence compatibility..."
        illustration={
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>...</Text>
          </View>
        }
      />
    );
  }

  if (isCompatible) {
    return (
      <OnboardingScreen
        title="You're All Set"
        subtitle="Your device supports Apple Intelligence and is ready for Jono"
        illustration={
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>✓</Text>
          </View>
        }
      >
        <View style={styles.compatibleContainer}>
          <InfoItem
            label="Apple Intelligence"
            value="Available"
            isPositive
          />
          <InfoItem
            label="On-Device Processing"
            value="Enabled"
            isPositive
          />
          <InfoItem
            label="Privacy"
            value="Your data stays on device"
            isPositive
          />
        </View>
      </OnboardingScreen>
    );
  }

  return (
    <OnboardingScreen
      title="Enhanced Experience Available"
      subtitle="Jono works best with Apple Intelligence enabled for on-device AI processing"
      illustration={
        <View style={styles.iconContainer}>
          <Text style={styles.iconInfo}>ℹ</Text>
        </View>
      }
    >
      <View style={styles.incompatibleContainer}>
        <Text style={styles.requirementsTitle}>For the best experience:</Text>
        <Text style={styles.requirementItem}>• iPhone 15 Pro, 15 Pro Max, or iPhone 16+</Text>
        <Text style={styles.requirementItem}>• iPad with M1 chip or later</Text>
        <Text style={styles.requirementItem}>• iOS 18.1 or later with Apple Intelligence enabled</Text>

        <Text style={styles.learnMoreText} onPress={openSupportPage}>
          Learn more about Apple Intelligence
        </Text>
      </View>

      <TouchableOpacity style={styles.continueButton} onPress={onContinue}>
        <Text style={styles.continueButtonText}>Continue</Text>
      </TouchableOpacity>
    </OnboardingScreen>
  );
};

interface InfoItemProps {
  label: string;
  value: string;
  isPositive?: boolean;
}

const InfoItem: React.FC<InfoItemProps> = ({ label, value, isPositive }) => (
  <View style={styles.infoItem}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={[styles.infoValue, isPositive && styles.infoValuePositive]}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: JonoTheme.colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...JonoTheme.shadows.soft,
  },
  icon: {
    fontSize: 48,
    color: JonoTheme.colors.accent.primary,
  },
  iconError: {
    fontSize: 48,
    color: JonoTheme.colors.sentiment.negative,
  },
  iconInfo: {
    fontSize: 48,
    color: JonoTheme.colors.accent.primary,
  },
  compatibleContainer: {
    width: '100%',
    paddingTop: JonoTheme.spacing.lg,
    gap: JonoTheme.spacing.md,
  },
  incompatibleContainer: {
    width: '100%',
    paddingTop: JonoTheme.spacing.lg,
    backgroundColor: JonoTheme.colors.background.card,
    padding: JonoTheme.spacing.lg,
    borderRadius: JonoTheme.borderRadius.md,
  },
  requirementsTitle: {
    ...JonoTheme.typography.headline,
    color: JonoTheme.colors.text.primary,
    marginBottom: JonoTheme.spacing.sm,
  },
  requirementItem: {
    ...JonoTheme.typography.body,
    color: JonoTheme.colors.text.secondary,
    marginBottom: JonoTheme.spacing.xs,
  },
  learnMoreText: {
    ...JonoTheme.typography.body,
    color: JonoTheme.colors.accent.primary,
    marginTop: JonoTheme.spacing.lg,
    textDecorationLine: 'underline',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: JonoTheme.colors.background.card,
    padding: JonoTheme.spacing.md,
    borderRadius: JonoTheme.borderRadius.md,
    ...JonoTheme.shadows.soft,
  },
  infoLabel: {
    ...JonoTheme.typography.body,
    color: JonoTheme.colors.text.secondary,
  },
  infoValue: {
    ...JonoTheme.typography.body,
    color: JonoTheme.colors.text.primary,
    fontWeight: '600',
  },
  infoValuePositive: {
    color: JonoTheme.colors.sentiment.positive,
  },
  continueButton: {
    backgroundColor: JonoTheme.colors.accent.primary,
    paddingVertical: JonoTheme.spacing.md,
    paddingHorizontal: JonoTheme.spacing.xl,
    borderRadius: JonoTheme.borderRadius.lg,
    marginTop: JonoTheme.spacing.xl,
    alignSelf: 'center',
    minWidth: 200,
    alignItems: 'center',
  },
  continueButtonText: {
    ...JonoTheme.typography.headline,
    color: JonoTheme.colors.text.inverse,
  },
});

export default DeviceCompatibilityScreen;
