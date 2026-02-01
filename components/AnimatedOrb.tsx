// AnimatedOrb - The heart of Jono's assistant interface
import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  withSequence,
  interpolate,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { AssistantState } from '../types';
import { JonoTheme } from '../constants/theme';

interface AnimatedOrbProps {
  state: AssistantState;
  onPress?: () => void;
  onLongPress?: () => void;
  onPressOut?: () => void;
  size?: number;
}

export const AnimatedOrb: React.FC<AnimatedOrbProps> = ({
  state,
  onPress,
  onLongPress,
  onPressOut,
  size = 120,
}) => {
  // Animation values
  const scale = useSharedValue(1);
  const innerScale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const pulseOpacity = useSharedValue(0.3);
  const waveScale = useSharedValue(1);

  // Reset animations
  const resetAnimations = () => {
    cancelAnimation(scale);
    cancelAnimation(innerScale);
    cancelAnimation(rotation);
    cancelAnimation(pulseOpacity);
    cancelAnimation(waveScale);
  };

  // State-based animations
  useEffect(() => {
    resetAnimations();

    switch (state) {
      case 'idle':
        // Gentle breathing pulse
        scale.value = withRepeat(
          withSequence(
            withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
            withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          false
        );
        pulseOpacity.value = withRepeat(
          withSequence(
            withTiming(0.5, { duration: 2000 }),
            withTiming(0.3, { duration: 2000 })
          ),
          -1,
          false
        );
        break;

      case 'listening':
        // Active pulse with more pronounced scale
        scale.value = withRepeat(
          withSequence(
            withTiming(1.15, { duration: 600, easing: Easing.out(Easing.ease) }),
            withTiming(1, { duration: 600, easing: Easing.in(Easing.ease) })
          ),
          -1,
          false
        );
        innerScale.value = withRepeat(
          withSequence(
            withTiming(0.9, { duration: 300 }),
            withTiming(1, { duration: 300 })
          ),
          -1,
          false
        );
        pulseOpacity.value = withRepeat(
          withSequence(
            withTiming(0.8, { duration: 300 }),
            withTiming(0.4, { duration: 300 })
          ),
          -1,
          false
        );
        break;

      case 'thinking':
        // Rotating/processing animation
        rotation.value = withRepeat(
          withTiming(360, { duration: 2000, easing: Easing.linear }),
          -1,
          false
        );
        scale.value = withRepeat(
          withSequence(
            withTiming(0.95, { duration: 500 }),
            withTiming(1.05, { duration: 500 })
          ),
          -1,
          false
        );
        innerScale.value = withRepeat(
          withSequence(
            withTiming(0.85, { duration: 400 }),
            withTiming(1, { duration: 400 })
          ),
          -1,
          false
        );
        break;

      case 'speaking':
        // Wave/ripple animation
        scale.value = 1;
        waveScale.value = 1;
        waveScale.value = withRepeat(
          withSequence(
            withTiming(1.3, { duration: 800, easing: Easing.out(Easing.ease) }),
            withTiming(1, { duration: 0 })
          ),
          -1,
          false
        );
        innerScale.value = withRepeat(
          withSequence(
            withTiming(1.1, { duration: 400 }),
            withTiming(0.95, { duration: 400 })
          ),
          -1,
          false
        );
        pulseOpacity.value = withRepeat(
          withSequence(
            withTiming(0.6, { duration: 400 }),
            withTiming(0.2, { duration: 400 })
          ),
          -1,
          false
        );
        break;
    }

    return () => resetAnimations();
  }, [state]);

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const innerOrbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: innerScale.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
    transform: [{ scale: interpolate(pulseOpacity.value, [0.2, 0.8], [1.2, 1.4]) }],
  }));

  const waveStyle = useAnimatedStyle(() => ({
    opacity: interpolate(waveScale.value, [1, 1.3], [0.4, 0]),
    transform: [{ scale: waveScale.value }],
  }));

  // Get colors based on state
  const getOrbColors = () => {
    switch (state) {
      case 'listening':
        return {
          outer: JonoTheme.colors.accent.primary,
          inner: '#F5A896', // Lighter terracotta
          pulse: JonoTheme.colors.accent.primary,
        };
      case 'thinking':
        return {
          outer: JonoTheme.colors.accent.tertiary,
          inner: '#F7DDB0', // Lighter gold
          pulse: JonoTheme.colors.accent.tertiary,
        };
      case 'speaking':
        return {
          outer: JonoTheme.colors.accent.secondary,
          inner: '#A8D4BE', // Lighter sage
          pulse: JonoTheme.colors.accent.secondary,
        };
      default:
        return {
          outer: JonoTheme.colors.accent.primary,
          inner: '#F5A896',
          pulse: JonoTheme.colors.accent.muted,
        };
    }
  };

  const colors = getOrbColors();

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressOut={onPressOut}
      style={styles.pressable}
    >
      <View style={[styles.container, { width: size * 1.6, height: size * 1.6 }]}>
        {/* Pulse ring */}
        <Animated.View
          style={[
            styles.pulse,
            pulseStyle,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: colors.pulse,
            },
          ]}
        />

        {/* Speaking wave */}
        {state === 'speaking' && (
          <Animated.View
            style={[
              styles.wave,
              waveStyle,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                borderColor: colors.outer,
              },
            ]}
          />
        )}

        {/* Main orb container */}
        <Animated.View style={[styles.orbContainer, containerStyle]}>
          {/* Outer orb */}
          <View
            style={[
              styles.outerOrb,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: colors.outer,
              },
            ]}
          >
            {/* Inner orb */}
            <Animated.View
              style={[
                styles.innerOrb,
                innerOrbStyle,
                {
                  width: size * 0.6,
                  height: size * 0.6,
                  borderRadius: (size * 0.6) / 2,
                  backgroundColor: colors.inner,
                },
              ]}
            />
          </View>
        </Animated.View>

        {/* State indicator icon */}
        <View style={styles.iconContainer}>
          {state === 'listening' && (
            <View style={[styles.micIndicator, { backgroundColor: '#fff' }]}>
              <View style={styles.micDot} />
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    position: 'absolute',
  },
  wave: {
    position: 'absolute',
    borderWidth: 3,
    backgroundColor: 'transparent',
  },
  orbContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerOrb: {
    alignItems: 'center',
    justifyContent: 'center',
    ...JonoTheme.shadows.medium,
  },
  innerOrb: {
    ...JonoTheme.shadows.soft,
  },
  iconContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: JonoTheme.colors.accent.primary,
  },
});

export default AnimatedOrb;
