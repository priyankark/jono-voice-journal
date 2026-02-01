// MessageBubble - Conversation bubbles for assistant mode
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ConversationMessage } from '../types';
import { JonoTheme } from '../constants/theme';
import { formatTime } from '../utils/dateHelpers';

interface MessageBubbleProps {
  message: ConversationMessage;
  showTimestamp?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  showTimestamp = false,
}) => {
  const isUser = message.role === 'user';

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}>
      <View
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.assistantBubble,
        ]}
      >
        <Text style={[styles.content, isUser ? styles.userContent : styles.assistantContent]}>
          {message.content}
        </Text>
      </View>
      {showTimestamp && (
        <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.assistantTimestamp]}>
          {formatTime(message.timestamp)}
        </Text>
      )}
    </View>
  );
};

// Live transcript bubble (shown while user is speaking)
interface LiveTranscriptBubbleProps {
  text: string;
}

export const LiveTranscriptBubble: React.FC<LiveTranscriptBubbleProps> = ({ text }) => {
  if (!text) return null;

  return (
    <View style={[styles.container, styles.userContainer]}>
      <View style={[styles.bubble, styles.liveBubble]}>
        <Text style={styles.liveContent}>{text}</Text>
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <View style={[styles.liveDot, styles.liveDotDelay1]} />
          <View style={[styles.liveDot, styles.liveDotDelay2]} />
        </View>
      </View>
    </View>
  );
};

// Thinking indicator bubble
export const ThinkingBubble: React.FC = () => {
  return (
    <View style={[styles.container, styles.assistantContainer]}>
      <View style={[styles.bubble, styles.thinkingBubble]}>
        <View style={styles.thinkingDots}>
          <View style={styles.thinkingDot} />
          <View style={[styles.thinkingDot, styles.thinkingDotDelay1]} />
          <View style={[styles.thinkingDot, styles.thinkingDotDelay2]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    maxWidth: '85%',
  },
  userContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  assistantContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: JonoTheme.borderRadius.lg,
    ...JonoTheme.shadows.soft,
  },
  userBubble: {
    backgroundColor: JonoTheme.colors.accent.primary,
    borderBottomRightRadius: JonoTheme.borderRadius.sm,
  },
  assistantBubble: {
    backgroundColor: JonoTheme.colors.background.card,
    borderBottomLeftRadius: JonoTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: JonoTheme.colors.border.light,
  },
  liveBubble: {
    backgroundColor: JonoTheme.colors.accent.muted,
    borderBottomRightRadius: JonoTheme.borderRadius.sm,
    borderWidth: 2,
    borderColor: JonoTheme.colors.accent.primary,
    borderStyle: 'dashed',
  },
  thinkingBubble: {
    backgroundColor: JonoTheme.colors.background.card,
    borderBottomLeftRadius: JonoTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: JonoTheme.colors.border.light,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  content: {
    fontSize: 16,
    lineHeight: 22,
  },
  userContent: {
    color: JonoTheme.colors.text.inverse,
  },
  assistantContent: {
    color: JonoTheme.colors.text.primary,
  },
  liveContent: {
    fontSize: 16,
    lineHeight: 22,
    color: JonoTheme.colors.text.primary,
    fontStyle: 'italic',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    marginHorizontal: 4,
  },
  userTimestamp: {
    color: JonoTheme.colors.text.tertiary,
  },
  assistantTimestamp: {
    color: JonoTheme.colors.text.tertiary,
  },
  liveIndicator: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: JonoTheme.colors.accent.primary,
    opacity: 0.6,
  },
  liveDotDelay1: {
    opacity: 0.4,
  },
  liveDotDelay2: {
    opacity: 0.2,
  },
  thinkingDots: {
    flexDirection: 'row',
    gap: 6,
  },
  thinkingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: JonoTheme.colors.accent.secondary,
  },
  thinkingDotDelay1: {
    opacity: 0.6,
  },
  thinkingDotDelay2: {
    opacity: 0.3,
  },
});

export default MessageBubble;
