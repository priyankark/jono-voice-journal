import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AnimatedOrb } from '../AnimatedOrb';
import { OnboardingScreen } from './OnboardingScreen';
import { JonoTheme } from '../../constants/theme';
import { AssistantState } from '../../types';

export const MeetJonoScreen: React.FC = () => {
  const [orbState, setOrbState] = useState<AssistantState>('idle');
  const [stateLabel, setStateLabel] = useState('Tap to explore');

  const cycleStates = () => {
    const states: { state: AssistantState; label: string }[] = [
      { state: 'listening', label: 'Listening to you...' },
      { state: 'thinking', label: 'Thinking...' },
      { state: 'speaking', label: 'Responding...' },
      { state: 'idle', label: 'Ready and waiting' },
    ];

    const currentIndex = states.findIndex(s => s.state === orbState);
    const nextIndex = (currentIndex + 1) % states.length;
    const next = states[nextIndex];

    setOrbState(next.state);
    setStateLabel(next.label);
  };

  return (
    <OnboardingScreen
      title="Meet Jono"
      subtitle="Your AI companion adapts to the conversation"
      illustration={
        <TouchableOpacity onPress={cycleStates} activeOpacity={0.9}>
          <View style={styles.orbContainer}>
            <AnimatedOrb state={orbState} size={140} />
          </View>
        </TouchableOpacity>
      }
    >
      <View style={styles.stateContainer}>
        <Text style={styles.stateLabel}>{stateLabel}</Text>
        <Text style={styles.tapHint}>Tap the orb to see different states</Text>
      </View>

      <View style={styles.statesGrid}>
        <StateExplainer
          color={JonoTheme.colors.accent.primary}
          title="Listening"
          description="Active pulse while hearing you"
        />
        <StateExplainer
          color={JonoTheme.colors.accent.tertiary}
          title="Thinking"
          description="Processing your words"
        />
        <StateExplainer
          color={JonoTheme.colors.accent.secondary}
          title="Speaking"
          description="Sharing a response"
        />
      </View>
    </OnboardingScreen>
  );
};

interface StateExplainerProps {
  color: string;
  title: string;
  description: string;
}

const StateExplainer: React.FC<StateExplainerProps> = ({ color, title, description }) => (
  <View style={styles.stateItem}>
    <View style={[styles.stateDot, { backgroundColor: color }]} />
    <View style={styles.stateText}>
      <Text style={styles.stateTitle}>{title}</Text>
      <Text style={styles.stateDescription}>{description}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  orbContainer: {
    paddingVertical: JonoTheme.spacing.lg,
  },
  stateContainer: {
    alignItems: 'center',
    marginBottom: JonoTheme.spacing.xl,
  },
  stateLabel: {
    ...JonoTheme.typography.headline,
    color: JonoTheme.colors.text.primary,
    marginBottom: JonoTheme.spacing.xs,
  },
  tapHint: {
    ...JonoTheme.typography.footnote,
    color: JonoTheme.colors.text.tertiary,
  },
  statesGrid: {
    width: '100%',
    gap: JonoTheme.spacing.sm,
  },
  stateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: JonoTheme.colors.background.card,
    padding: JonoTheme.spacing.md,
    borderRadius: JonoTheme.borderRadius.sm,
  },
  stateDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: JonoTheme.spacing.md,
  },
  stateText: {
    flex: 1,
  },
  stateTitle: {
    ...JonoTheme.typography.subhead,
    color: JonoTheme.colors.text.primary,
    fontWeight: '600',
  },
  stateDescription: {
    ...JonoTheme.typography.caption1,
    color: JonoTheme.colors.text.secondary,
  },
});

export default MeetJonoScreen;
