import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { JonoTheme } from '../constants/theme';
import { useOnboardingStore } from '../stores/onboardingStore';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { hasCompletedOnboarding } = useOnboardingStore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Small delay to ensure store is hydrated
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const inOnboarding = segments[0] === 'onboarding';
    const inLegal = segments[0] === 'legal';

    // Skip routing for legal screens
    if (inLegal) return;

    if (!hasCompletedOnboarding && !inOnboarding) {
      // Redirect to onboarding if not completed
      router.replace('/onboarding');
    } else if (hasCompletedOnboarding && inOnboarding) {
      // Redirect to main app if onboarding is completed
      router.replace('/(tabs)');
    }
  }, [hasCompletedOnboarding, segments, isReady]);

  // Show loading while checking onboarding status
  if (!isReady) {
    return (
      <View style={[styles.container, styles.loading]}>
        <ActivityIndicator size="large" color={JonoTheme.colors.accent.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: JonoTheme.colors.background.primary,
          },
          headerTintColor: JonoTheme.colors.text.primary,
          headerTitleStyle: {
            fontWeight: '600',
          },
          contentStyle: {
            backgroundColor: JonoTheme.colors.background.primary,
          },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen
          name="entry/[id]"
          options={{
            title: 'Entry Details',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="legal/privacy-policy"
          options={{
            title: 'Privacy Policy',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="legal/terms-of-service"
          options={{
            title: 'Terms of Service',
            presentation: 'modal',
          }}
        />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: JonoTheme.colors.background.primary,
  },
  loading: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
