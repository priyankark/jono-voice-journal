import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import {
  OnboardingContainer,
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

  // Determine button text based on permission state
  const getNextButtonTitle = () => {
    if (currentStep === 5) {
      // Microphone permission screen
      if (microphonePermission === 'undetermined') {
        return 'Continue';
      }
    }
    if (currentStep === 6) {
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
        showSkip={currentStep < totalSteps - 1}
        showBack={currentStep > 0}
      >
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
