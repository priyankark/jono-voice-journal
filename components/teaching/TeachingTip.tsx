import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { JonoTheme } from '../../constants/theme';
import { useTeachingStore, TeachingTipId, TEACHING_TIPS } from '../../stores/teachingStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TeachingTipProps {
  tipId: TeachingTipId;
  position?: 'top' | 'bottom';
  offset?: { x?: number; y?: number };
  delay?: number;
  children: React.ReactNode;
}

export const TeachingTip: React.FC<TeachingTipProps> = ({
  tipId,
  position = 'bottom',
  offset = {},
  delay = 500,
  children,
}) => {
  const { hasSeen, markTipAsSeen } = useTeachingStore();
  const [showTip, setShowTip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const opacity = useSharedValue(0);

  const tip = TEACHING_TIPS[tipId];
  const alreadySeen = hasSeen(tipId);

  useEffect(() => {
    if (!alreadySeen) {
      const timer = setTimeout(() => {
        setShowTip(true);
        opacity.value = withTiming(1, { duration: 300 });
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [alreadySeen, delay]);

  const handleDismiss = () => {
    opacity.value = withTiming(0, { duration: 200 });
    setTimeout(() => {
      setShowTip(false);
      markTipAsSeen(tipId);
    }, 200);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (alreadySeen || !showTip) {
    return <>{children}</>;
  }

  return (
    <View>
      {children}
      <Modal
        transparent
        visible={showTip}
        animationType="none"
        onRequestClose={handleDismiss}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={handleDismiss}
        >
          <Animated.View
            style={[
              styles.tooltip,
              position === 'top' ? styles.tooltipTop : styles.tooltipBottom,
              { marginLeft: offset.x ?? 0, marginTop: offset.y ?? 0 },
              animatedStyle,
            ]}
          >
            <View style={styles.tooltipContent}>
              <Text style={styles.tooltipTitle}>{tip.title}</Text>
              <Text style={styles.tooltipMessage}>{tip.message}</Text>
            </View>
            <View style={[
              styles.arrow,
              position === 'top' ? styles.arrowBottom : styles.arrowTop,
            ]} />
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tooltip: {
    position: 'absolute',
    maxWidth: SCREEN_WIDTH - 48,
    backgroundColor: JonoTheme.colors.text.primary,
    borderRadius: JonoTheme.borderRadius.md,
    ...JonoTheme.shadows.strong,
  },
  tooltipTop: {
    top: '40%',
  },
  tooltipBottom: {
    top: '50%',
  },
  tooltipContent: {
    padding: JonoTheme.spacing.md,
  },
  tooltipTitle: {
    ...JonoTheme.typography.headline,
    color: '#fff',
    marginBottom: JonoTheme.spacing.xs,
  },
  tooltipMessage: {
    ...JonoTheme.typography.body,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  arrow: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    alignSelf: 'center',
  },
  arrowTop: {
    top: -8,
    borderBottomWidth: 8,
    borderBottomColor: JonoTheme.colors.text.primary,
  },
  arrowBottom: {
    bottom: -8,
    borderTopWidth: 8,
    borderTopColor: JonoTheme.colors.text.primary,
  },
});

export default TeachingTip;
