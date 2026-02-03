import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
} from 'react-native-reanimated';
import { JonoTheme } from '../../constants/theme';

const { width } = Dimensions.get('window');

interface OnboardingScreenProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  illustration?: React.ReactNode;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  title,
  subtitle,
  children,
  illustration,
}) => {
  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {illustration && (
          <View style={styles.illustrationContainer}>
            {illustration}
          </View>
        )}

        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>

        {children && (
          <View style={styles.content}>
            {children}
          </View>
        )}
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width,
    backgroundColor: JonoTheme.colors.background.primary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: JonoTheme.spacing.lg,
    paddingTop: JonoTheme.spacing.xl,
    paddingBottom: JonoTheme.spacing.xxl,
  },
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: JonoTheme.spacing.xl,
    minHeight: 200,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: JonoTheme.spacing.lg,
  },
  title: {
    ...JonoTheme.typography.title1,
    color: JonoTheme.colors.text.primary,
    textAlign: 'center',
    marginBottom: JonoTheme.spacing.sm,
  },
  subtitle: {
    ...JonoTheme.typography.body,
    color: JonoTheme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: JonoTheme.spacing.md,
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
});

export default OnboardingScreen;
