import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  TouchableOpacity,
  Text,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { JonoTheme } from '../../constants/theme';
import { OnboardingPagination } from './OnboardingPagination';
import { OnboardingButton } from './OnboardingButton';

const { width } = Dimensions.get('window');

interface OnboardingContainerProps {
  children: React.ReactNode[];
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onComplete: () => void;
  nextButtonTitle?: string;
  showSkip?: boolean;
  showBack?: boolean;
  showFooter?: boolean;
  isNextDisabled?: boolean;
  isNextLoading?: boolean;
}

export const OnboardingContainer: React.FC<OnboardingContainerProps> = ({
  children,
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onSkip,
  onComplete,
  nextButtonTitle,
  showSkip = true,
  showBack = true,
  showFooter = true,
  isNextDisabled = false,
  isNextLoading = false,
}) => {
  const translateX = useSharedValue(0);
  const isLastStep = currentStep === totalSteps - 1;

  // Update position when currentStep changes
  useEffect(() => {
    translateX.value = withTiming(-currentStep * width, { duration: 300 });
  }, [currentStep]);

  const panGesture = Gesture.Pan()
    .onEnd((event) => {
      const swipeThreshold = width * 0.2;

      if (event.translationX < -swipeThreshold && currentStep < totalSteps - 1) {
        runOnJS(onNext)();
      } else if (event.translationX > swipeThreshold && currentStep > 0) {
        runOnJS(onPrevious)();
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handleButtonPress = () => {
    if (isLastStep) {
      onComplete();
    } else {
      onNext();
    }
  };

  const buttonTitle = nextButtonTitle || (isLastStep ? "Get Started" : "Continue");

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Skip */}
      <View style={styles.header}>
        {showBack && currentStep > 0 ? (
          <TouchableOpacity onPress={onPrevious} style={styles.backButton}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}

        <OnboardingPagination totalSteps={totalSteps} currentStep={currentStep} />

        {showSkip && !isLastStep ? (
          <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>

      {/* Content */}
      <GestureDetector gesture={panGesture}>
        <View style={styles.contentWrapper}>
          <Animated.View style={[styles.content, animatedStyle]}>
            {React.Children.map(children, (child, index) => (
              <View key={index} style={styles.screen}>
                {child}
              </View>
            ))}
          </Animated.View>
        </View>
      </GestureDetector>

      {/* Footer with Button - hidden on permission screens until user has responded */}
      {showFooter && (
        <View style={styles.footer}>
          <OnboardingButton
            title={buttonTitle}
            onPress={handleButtonPress}
            disabled={isNextDisabled}
            loading={isNextLoading}
            style={styles.button}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: JonoTheme.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: JonoTheme.spacing.md,
    paddingVertical: JonoTheme.spacing.sm,
  },
  backButton: {
    padding: JonoTheme.spacing.sm,
    minWidth: 60,
  },
  backText: {
    ...JonoTheme.typography.body,
    color: JonoTheme.colors.text.secondary,
  },
  skipButton: {
    padding: JonoTheme.spacing.sm,
    minWidth: 60,
    alignItems: 'flex-end',
  },
  skipText: {
    ...JonoTheme.typography.body,
    color: JonoTheme.colors.text.secondary,
  },
  placeholder: {
    minWidth: 60,
  },
  contentWrapper: {
    flex: 1,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  screen: {
    width,
    height: '100%',
  },
  footer: {
    paddingHorizontal: JonoTheme.spacing.lg,
    paddingBottom: JonoTheme.spacing.lg,
    paddingTop: JonoTheme.spacing.md,
  },
  button: {
    width: '100%',
  },
});

export default OnboardingContainer;
