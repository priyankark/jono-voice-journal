import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { JonoTheme } from '../../constants/theme';
import { useTeachingStore, TeachingTipId } from '../../stores/teachingStore';

interface FeatureHighlightProps {
  tipId: TeachingTipId;
  children: React.ReactNode;
  size?: number;
  color?: string;
}

export const FeatureHighlight: React.FC<FeatureHighlightProps> = ({
  tipId,
  children,
  size = 60,
  color = JonoTheme.colors.accent.primary,
}) => {
  const { hasSeen } = useTeachingStore();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  const alreadySeen = hasSeen(tipId);

  useEffect(() => {
    if (!alreadySeen) {
      // Pulse animation
      scale.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 1000, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.in(Easing.ease) })
        ),
        -1,
        false
      );
      opacity.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 1000 }),
          withTiming(0.6, { duration: 1000 })
        ),
        -1,
        false
      );
    }
  }, [alreadySeen]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (alreadySeen) {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.pulse,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
          pulseStyle,
        ]}
      />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    position: 'absolute',
  },
});

export default FeatureHighlight;
