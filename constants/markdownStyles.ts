// Markdown styles for react-native-markdown-display
// Uses warm theme colors for consistent styling across the app

import { StyleSheet, Platform } from 'react-native';
import { JonoTheme } from './theme';

// Warm theme markdown colors
const MARKDOWN_COLORS = {
  headers: '#3D405B',      // Deep warm gray
  links: '#E07A5F',        // Terracotta
  codeBackground: '#F0E6DC', // Light warm gray
  blockquoteBorder: '#81B29A', // Sage green
  blockquoteBackground: '#F5EDE4', // Soft beige
  text: JonoTheme.colors.text.primary,
  secondaryText: JonoTheme.colors.text.secondary,
};

// Base markdown styles for article content
export const getMarkdownStyles = (fontSize: number = 16) => {
  return StyleSheet.create({
    // Root container
    body: {
      color: MARKDOWN_COLORS.text,
      fontSize: fontSize,
      lineHeight: fontSize * 1.65,
    },

    // Headers
    heading1: {
      fontSize: fontSize * 1.75,
      fontWeight: '700',
      color: MARKDOWN_COLORS.headers,
      marginTop: 24,
      marginBottom: 12,
      lineHeight: fontSize * 2.2,
    },
    heading2: {
      fontSize: fontSize * 1.5,
      fontWeight: '700',
      color: MARKDOWN_COLORS.headers,
      marginTop: 20,
      marginBottom: 10,
      lineHeight: fontSize * 1.9,
    },
    heading3: {
      fontSize: fontSize * 1.25,
      fontWeight: '600',
      color: MARKDOWN_COLORS.headers,
      marginTop: 16,
      marginBottom: 8,
      lineHeight: fontSize * 1.6,
    },
    heading4: {
      fontSize: fontSize * 1.1,
      fontWeight: '600',
      color: MARKDOWN_COLORS.headers,
      marginTop: 14,
      marginBottom: 6,
      lineHeight: fontSize * 1.4,
    },
    heading5: {
      fontSize: fontSize,
      fontWeight: '600',
      color: MARKDOWN_COLORS.headers,
      marginTop: 12,
      marginBottom: 4,
    },
    heading6: {
      fontSize: fontSize * 0.9,
      fontWeight: '600',
      color: MARKDOWN_COLORS.headers,
      marginTop: 10,
      marginBottom: 4,
    },

    // Paragraph
    paragraph: {
      marginTop: 0,
      marginBottom: 12,
    },

    // Text styling
    strong: {
      fontWeight: '700',
    },
    em: {
      fontStyle: 'italic',
    },
    s: {
      textDecorationLine: 'line-through',
    },

    // Links
    link: {
      color: MARKDOWN_COLORS.links,
      textDecorationLine: 'underline',
    },

    // Lists
    bullet_list: {
      marginBottom: 12,
    },
    ordered_list: {
      marginBottom: 12,
    },
    list_item: {
      marginBottom: 6,
      flexDirection: 'row',
    },
    bullet_list_icon: {
      color: MARKDOWN_COLORS.links,
      fontSize: fontSize,
      marginRight: 8,
      marginTop: Platform.OS === 'ios' ? 0 : 2,
    },
    bullet_list_content: {
      flex: 1,
    },
    ordered_list_icon: {
      color: MARKDOWN_COLORS.links,
      fontSize: fontSize,
      fontWeight: '600',
      marginRight: 8,
      minWidth: 20,
    },
    ordered_list_content: {
      flex: 1,
    },

    // Blockquotes
    blockquote: {
      backgroundColor: MARKDOWN_COLORS.blockquoteBackground,
      borderLeftWidth: 4,
      borderLeftColor: MARKDOWN_COLORS.blockquoteBorder,
      paddingLeft: 16,
      paddingRight: 12,
      paddingVertical: 10,
      marginVertical: 12,
      borderRadius: 4,
    },

    // Code
    code_inline: {
      backgroundColor: MARKDOWN_COLORS.codeBackground,
      color: MARKDOWN_COLORS.headers,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      fontSize: fontSize * 0.9,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    code_block: {
      backgroundColor: MARKDOWN_COLORS.codeBackground,
      padding: 14,
      borderRadius: 8,
      marginVertical: 12,
      overflow: 'hidden',
    },
    fence: {
      backgroundColor: MARKDOWN_COLORS.codeBackground,
      padding: 14,
      borderRadius: 8,
      marginVertical: 12,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      fontSize: fontSize * 0.85,
      color: MARKDOWN_COLORS.headers,
      lineHeight: fontSize * 1.4,
    },

    // Horizontal rule
    hr: {
      backgroundColor: JonoTheme.colors.border.medium,
      height: 1,
      marginVertical: 20,
    },

    // Tables
    table: {
      borderWidth: 1,
      borderColor: JonoTheme.colors.border.light,
      borderRadius: 8,
      marginVertical: 12,
    },
    thead: {
      backgroundColor: MARKDOWN_COLORS.codeBackground,
    },
    th: {
      padding: 10,
      fontWeight: '600',
      color: MARKDOWN_COLORS.headers,
    },
    tr: {
      borderBottomWidth: 1,
      borderBottomColor: JonoTheme.colors.border.light,
    },
    td: {
      padding: 10,
    },

    // Images
    image: {
      borderRadius: 8,
      marginVertical: 12,
    },
  });
};

// Compact markdown styles for preview cards (smaller text, less spacing)
export const getCompactMarkdownStyles = (fontSize: number = 14) => {
  return StyleSheet.create({
    body: {
      color: MARKDOWN_COLORS.text,
      fontSize: fontSize,
      lineHeight: fontSize * 1.5,
    },
    heading1: {
      fontSize: fontSize * 1.4,
      fontWeight: '700',
      color: MARKDOWN_COLORS.headers,
      marginTop: 12,
      marginBottom: 6,
    },
    heading2: {
      fontSize: fontSize * 1.25,
      fontWeight: '700',
      color: MARKDOWN_COLORS.headers,
      marginTop: 10,
      marginBottom: 5,
    },
    heading3: {
      fontSize: fontSize * 1.1,
      fontWeight: '600',
      color: MARKDOWN_COLORS.headers,
      marginTop: 8,
      marginBottom: 4,
    },
    heading4: {
      fontSize: fontSize,
      fontWeight: '600',
      color: MARKDOWN_COLORS.headers,
      marginTop: 6,
      marginBottom: 3,
    },
    heading5: {
      fontSize: fontSize * 0.95,
      fontWeight: '600',
      color: MARKDOWN_COLORS.headers,
      marginTop: 4,
      marginBottom: 2,
    },
    heading6: {
      fontSize: fontSize * 0.9,
      fontWeight: '600',
      color: MARKDOWN_COLORS.headers,
      marginTop: 4,
      marginBottom: 2,
    },
    paragraph: {
      marginTop: 0,
      marginBottom: 8,
    },
    strong: {
      fontWeight: '700',
    },
    em: {
      fontStyle: 'italic',
    },
    s: {
      textDecorationLine: 'line-through',
    },
    link: {
      color: MARKDOWN_COLORS.links,
      textDecorationLine: 'underline',
    },
    bullet_list: {
      marginBottom: 8,
    },
    ordered_list: {
      marginBottom: 8,
    },
    list_item: {
      marginBottom: 4,
      flexDirection: 'row',
    },
    bullet_list_icon: {
      color: MARKDOWN_COLORS.links,
      fontSize: fontSize,
      marginRight: 6,
      marginTop: Platform.OS === 'ios' ? 0 : 1,
    },
    bullet_list_content: {
      flex: 1,
    },
    ordered_list_icon: {
      color: MARKDOWN_COLORS.links,
      fontSize: fontSize,
      fontWeight: '600',
      marginRight: 6,
      minWidth: 16,
    },
    ordered_list_content: {
      flex: 1,
    },
    blockquote: {
      backgroundColor: MARKDOWN_COLORS.blockquoteBackground,
      borderLeftWidth: 3,
      borderLeftColor: MARKDOWN_COLORS.blockquoteBorder,
      paddingLeft: 12,
      paddingRight: 10,
      paddingVertical: 8,
      marginVertical: 8,
      borderRadius: 4,
    },
    code_inline: {
      backgroundColor: MARKDOWN_COLORS.codeBackground,
      color: MARKDOWN_COLORS.headers,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      fontSize: fontSize * 0.85,
      paddingHorizontal: 4,
      paddingVertical: 1,
      borderRadius: 3,
    },
    code_block: {
      backgroundColor: MARKDOWN_COLORS.codeBackground,
      padding: 10,
      borderRadius: 6,
      marginVertical: 8,
    },
    fence: {
      backgroundColor: MARKDOWN_COLORS.codeBackground,
      padding: 10,
      borderRadius: 6,
      marginVertical: 8,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      fontSize: fontSize * 0.8,
      color: MARKDOWN_COLORS.headers,
      lineHeight: fontSize * 1.3,
    },
    hr: {
      backgroundColor: JonoTheme.colors.border.medium,
      height: 1,
      marginVertical: 12,
    },
  });
};

export default getMarkdownStyles;
