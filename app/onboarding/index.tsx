import React, { useState, useCallback } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import {
  OnboardingContainer,
  DeviceCompatibilityScreen,
  WelcomeScreen,
  TwoWaysScreen,
  MeetJonoScreen,
  TransformScreen,
  PrivacyScreen,
  MicrophonePermissionScreen,
  SpeechPermissionScreen,
  CompletionScreen,
} from '../../components/onboarding';
import { useOnboarding } from '../../hooks/useOnboarding';
import { JonoTheme } from '../../constants/theme';

export default function OnboardingScreen() {
  const {
    currentStep,
    totalSteps,
    nextStep,
    previousStep,
    skipOnboarding,
    completeOnboarding,
    microphonePermission,
    speechPermission,
    requestMicrophonePermission,
    requestSpeechPermission,
  } = useOnboarding();

  const [isDeviceCompatible, setIsDeviceCompatible] = useState<boolean | null>(null);

  const handleCompatibilityChecked = useCallback((compatible: boolean) => {
    setIsDeviceCompatible(compatible);
  }, []);

  // Determine button text based on current step and state
  const getNextButtonTitle = () => {
    if (currentStep === 0) {
      // Device compatibility screen - show checking while checking, then let component handle button
      if (isDeviceCompatible === null) {
        return 'Checking...';
      }
      // If compatible, show Continue (handled by container)
      // If not compatible, the screen shows its own button
      return 'Continue';
    }
    if (currentStep === 6) {
      // Microphone permission screen
      if (microphonePermission === 'undetermined') {
        return 'Continue';
      }
    }
    if (currentStep === 7) {
      // Speech permission screen
      if (speechPermission === 'undetermined') {
        return 'Continue';
      }
    }
    if (currentStep === totalSteps - 1) {
      return 'Get Started';
    }
    return 'Continue';
  };

  // Only disable while checking compatibility
  const isNextDisabled = currentStep === 0 && isDeviceCompatible === null;

  // Hide footer on permission screens when permission not yet requested - only the in-screen "Continue" (which triggers the system dialog) should show
  const isPermissionScreenPending =
    (currentStep === 6 && microphonePermission === 'undetermined') ||
    (currentStep === 7 && speechPermission === 'undetermined');
  const showFooter = !isPermissionScreenPending;

  return (
    <GestureHandlerRootView style={styles.container}>
      <OnboardingContainer
        currentStep={currentStep}
        totalSteps={totalSteps}
        onNext={nextStep}
        onPrevious={previousStep}
        onSkip={skipOnboarding}
        onComplete={completeOnboarding}
        nextButtonTitle={getNextButtonTitle()}
        showSkip={currentStep > 0 && currentStep < totalSteps - 1}
        showBack={currentStep > 0}
        showFooter={showFooter}
        isNextDisabled={isNextDisabled}
      >
        <DeviceCompatibilityScreen
          onCompatibilityChecked={handleCompatibilityChecked}
          onContinue={nextStep}
        />
        <WelcomeScreen />
        <TwoWaysScreen />
        <MeetJonoScreen />
        <TransformScreen />
        <PrivacyScreen />
        <MicrophonePermissionScreen
          permissionStatus={microphonePermission}
          onRequestPermission={requestMicrophonePermission}
        />
        <SpeechPermissionScreen
          permissionStatus={speechPermission}
          onRequestPermission={requestSpeechPermission}
        />
        <CompletionScreen />
      </OnboardingContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: JonoTheme.colors.background.primary,
  },
});
