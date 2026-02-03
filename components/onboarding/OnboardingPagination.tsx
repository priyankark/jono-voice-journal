import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { JonoTheme } from '../../constants/theme';

interface OnboardingPaginationProps {
  totalSteps: number;
  currentStep: number;
}

const Dot: React.FC<{ isActive: boolean; index: number }> = ({ isActive }) => {
  const animatedStyle = useAnimatedStyle(() => ({
    width: withTiming(isActive ? 24 : 8, { duration: 200 }),
    backgroundColor: withTiming(
      isActive ? JonoTheme.colors.accent.primary : JonoTheme.colors.border.medium,
      { duration: 200 }
    ),
  }));

  return <Animated.View style={[styles.dot, animatedStyle]} />;
};

export const OnboardingPagination: React.FC<OnboardingPaginationProps> = ({
  totalSteps,
  currentStep,
}) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <Dot key={index} isActive={index === currentStep} index={index} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: JonoTheme.spacing.md,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});

export default OnboardingPagination;
