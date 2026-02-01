// Jono Design System - Warm & Soft Theme
// A calming, warm color palette for a voice-first journaling experience

export const JonoTheme = {
  colors: {
    background: {
      primary: '#FDF8F3',      // Warm cream - main background
      secondary: '#F5EDE4',    // Soft beige - secondary surfaces
      card: '#FFFFFF',         // White - cards and elevated surfaces
      elevated: '#FFFBF7',     // Slightly warm white - modals, sheets
    },
    accent: {
      primary: '#E07A5F',      // Warm terracotta - primary actions, orb
      secondary: '#81B29A',    // Sage green - success, positive
      tertiary: '#F2CC8F',     // Soft gold - highlights, badges
      muted: '#F4E6D6',        // Muted peach - subtle accents
    },
    text: {
      primary: '#3D405B',      // Deep warm gray - primary text
      secondary: '#6B6E82',    // Muted gray - secondary text
      tertiary: '#9A9CB0',     // Light gray - placeholders, hints
      inverse: '#FFFFFF',      // White - text on dark/accent backgrounds
    },
    sentiment: {
      positive: '#81B29A',     // Sage green
      neutral: '#C4C4C4',      // Soft gray
      negative: '#E07A5F',     // Terracotta (softer red)
    },
    status: {
      draft: '#F2CC8F',        // Soft gold
      polished: '#81B29A',     // Sage green
      published: '#7B9ACC',    // Soft blue
    },
    recording: {
      active: '#E07A5F',       // Terracotta
      indicator: '#E07A5F',    // Recording dot
    },
    border: {
      light: '#F0E6DC',        // Very light warm gray
      medium: '#E5D9CD',       // Medium warm gray
    },
  },
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    full: 9999,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  shadows: {
    soft: {
      shadowColor: '#3D405B',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    medium: {
      shadowColor: '#3D405B',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    strong: {
      shadowColor: '#3D405B',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 6,
    },
  },
  typography: {
    largeTitle: {
      fontSize: 34,
      fontWeight: '700' as const,
      lineHeight: 41,
    },
    title1: {
      fontSize: 28,
      fontWeight: '700' as const,
      lineHeight: 34,
    },
    title2: {
      fontSize: 22,
      fontWeight: '600' as const,
      lineHeight: 28,
    },
    title3: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 25,
    },
    headline: {
      fontSize: 17,
      fontWeight: '600' as const,
      lineHeight: 22,
    },
    body: {
      fontSize: 17,
      fontWeight: '400' as const,
      lineHeight: 22,
    },
    callout: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 21,
    },
    subhead: {
      fontSize: 15,
      fontWeight: '400' as const,
      lineHeight: 20,
    },
    footnote: {
      fontSize: 13,
      fontWeight: '400' as const,
      lineHeight: 18,
    },
    caption1: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 16,
    },
    caption2: {
      fontSize: 11,
      fontWeight: '400' as const,
      lineHeight: 13,
    },
  },
  animation: {
    duration: {
      fast: 150,
      normal: 300,
      slow: 500,
    },
    easing: {
      standard: 'ease-in-out',
    },
  },
};

// Warm greetings for the assistant
export const WARM_GREETINGS = [
  "What's on your mind today?",
  "I'm here to listen. What would you like to share?",
  "Take a moment. What thoughts are you holding?",
  "Ready when you are. What's been on your mind?",
  "Let's capture those thoughts. What's stirring in you?",
  "I'm all ears. What would you like to explore?",
  "What's floating through your mind right now?",
  "Share whatever feels right. I'm listening.",
];

// Get a random warm greeting
export const getWarmGreeting = (): string => {
  return WARM_GREETINGS[Math.floor(Math.random() * WARM_GREETINGS.length)];
};

// Time-based greetings
export const getTimeBasedGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Late night thoughts?';
};

export default JonoTheme;
