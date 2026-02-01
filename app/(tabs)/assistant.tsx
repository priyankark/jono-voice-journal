// Assistant Screen - Jono voice-first journaling companion
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAssistant } from '../../hooks/useAssistant';
import { AnimatedOrb } from '../../components/AnimatedOrb';
import {
  MessageBubble,
  LiveTranscriptBubble,
  ThinkingBubble,
} from '../../components/MessageBubble';
import { JonoTheme, getTimeBasedGreeting } from '../../constants/theme';

export default function AssistantScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);

  const {
    state,
    conversation,
    liveTranscript,
    error,
    canSaveAsEntry,
    startListening,
    stopListening,
    startNewConversation,
    saveAsEntry,
    endConversation,
  } = useAssistant();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (conversation?.messages.length) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [conversation?.messages.length, liveTranscript]);

  // Show error alert
  useEffect(() => {
    if (error) {
      Alert.alert('Oops', error);
    }
  }, [error]);

  const handleOrbPress = () => {
    if (state === 'idle') {
      startListening();
    } else if (state === 'listening') {
      stopListening();
    }
  };

  const handleOrbLongPress = () => {
    startListening();
  };

  const handleOrbPressOut = () => {
    if (state === 'listening') {
      stopListening();
    }
  };

  const handleSaveAsEntry = async () => {
    const entry = await saveAsEntry();
    if (entry) {
      Alert.alert(
        'Saved',
        'Your conversation has been saved to your journal.',
        [
          { text: 'View Entry', onPress: () => router.push(`/entry/${entry.id}`) },
          { text: 'OK' },
        ]
      );
    }
  };

  const handleNewConversation = () => {
    if (canSaveAsEntry) {
      Alert.alert(
        'Start Fresh?',
        'Would you like to save this conversation before starting a new one?',
        [
          { text: 'Save & Start New', onPress: async () => {
            await saveAsEntry();
            startNewConversation();
          }},
          { text: 'Discard', onPress: () => {
            endConversation();
            startNewConversation();
          }, style: 'destructive' },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } else {
      startNewConversation();
    }
  };

  const getStateHint = () => {
    switch (state) {
      case 'listening':
        return 'Listening...';
      case 'thinking':
        return 'Thinking...';
      case 'speaking':
        return 'Speaking...';
      default:
        return 'Tap to speak';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getTimeBasedGreeting()}</Text>
          <Text style={styles.subtitle}>
            {conversation?.messages.length
              ? "Let's continue..."
              : "What's on your mind?"}
          </Text>
        </View>
        <TouchableOpacity onPress={handleNewConversation} style={styles.newButton}>
          <Text style={styles.newButtonText}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Conversation Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {conversation?.messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {/* Live transcript while listening */}
        {state === 'listening' && liveTranscript && (
          <LiveTranscriptBubble text={liveTranscript} />
        )}

        {/* Thinking indicator */}
        {state === 'thinking' && <ThinkingBubble />}
      </ScrollView>

      {/* Central Orb Area */}
      <View style={styles.orbContainer}>
        <AnimatedOrb
          state={state}
          onPress={handleOrbPress}
          onLongPress={handleOrbLongPress}
          onPressOut={handleOrbPressOut}
          size={100}
        />
        <Text style={styles.stateHint}>{getStateHint()}</Text>
      </View>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        {canSaveAsEntry && (
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveAsEntry}>
            <Text style={styles.saveButtonText}>Save as Journal Entry</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: JonoTheme.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: JonoTheme.colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: JonoTheme.colors.text.secondary,
  },
  newButton: {
    backgroundColor: JonoTheme.colors.background.card,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: JonoTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: JonoTheme.colors.border.light,
    ...JonoTheme.shadows.soft,
  },
  newButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: JonoTheme.colors.text.primary,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  orbContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  stateHint: {
    marginTop: 16,
    fontSize: 14,
    color: JonoTheme.colors.text.tertiary,
    fontWeight: '500',
  },
  bottomActions: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    minHeight: 60,
  },
  saveButton: {
    backgroundColor: JonoTheme.colors.accent.secondary,
    paddingVertical: 16,
    borderRadius: JonoTheme.borderRadius.md,
    alignItems: 'center',
    ...JonoTheme.shadows.soft,
  },
  saveButtonText: {
    color: JonoTheme.colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
});
