import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useJournalStore } from '../../stores/journalStore';
import { EntryCard } from '../../components/EntryCard';
import { formatDate, getRelativeDate } from '../../utils/dateHelpers';
import { generateArticle } from '../../services/articleGenerator';
import { JonoTheme, getTimeBasedGreeting } from '../../constants/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { entries, addArticle } = useJournalStore();
  const [refreshing, setRefreshing] = React.useState(false);

  // Get today's entries
  const today = new Date();
  const todayEntries = entries.filter(
    (e) => new Date(e.date).toDateString() === today.toDateString()
  );

  // Get recent entries (last 7 days, excluding today)
  const recentEntries = entries.filter((e) => {
    const entryDate = new Date(e.date);
    const daysDiff = Math.floor((today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff > 0 && daysDiff <= 7;
  });

  // Group by date
  const groupedRecent = recentEntries.reduce((acc, entry) => {
    const dateKey = new Date(entry.date).toDateString();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(entry);
    return acc;
  }, {} as Record<string, typeof entries>);

  const handleDistill = async (entry: typeof entries[0]) => {
    try {
      const article = await generateArticle([entry]);
      addArticle(article);
      router.push('/articles');
    } catch (error) {
      console.error('Failed to generate article:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={JonoTheme.colors.accent.primary}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>{getTimeBasedGreeting()}</Text>
        <Text style={styles.date}>{formatDate(today)}</Text>
      </View>

      {/* Quick Actions */}
      <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/record')}>
        <Text style={styles.quickActionIcon}>✏️</Text>
        <View style={styles.quickActionText}>
          <Text style={styles.quickActionTitle}>Capture a thought</Text>
          <Text style={styles.quickActionSubtitle}>Voice or text, whatever feels right</Text>
        </View>
        <Text style={styles.quickActionArrow}>→</Text>
      </TouchableOpacity>

      {/* Talk to Jono prompt */}
      <TouchableOpacity style={styles.jonoPrompt} onPress={() => router.push('/assistant')}>
        <View style={styles.jonoOrbMini}>
          <Text style={styles.jonoOrbIcon}>✨</Text>
        </View>
        <View style={styles.jonoPromptText}>
          <Text style={styles.jonoPromptTitle}>Talk with Jono</Text>
          <Text style={styles.jonoPromptSubtitle}>Have a reflective conversation</Text>
        </View>
      </TouchableOpacity>

      {/* Today's Entries */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today</Text>
        {todayEntries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🌱</Text>
            <Text style={styles.emptyText}>No thoughts captured yet</Text>
            <Text style={styles.emptySubtext}>Start with a voice note or quick text</Text>
          </View>
        ) : (
          todayEntries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              onPress={() => router.push(`/entry/${entry.id}`)}
              onDistill={() => handleDistill(entry)}
            />
          ))
        )}
      </View>

      {/* Recent Entries */}
      {Object.keys(groupedRecent).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent</Text>
          {Object.entries(groupedRecent).map(([dateKey, dateEntries]) => (
            <View key={dateKey}>
              <Text style={styles.dateLabel}>{getRelativeDate(new Date(dateKey))}</Text>
              {dateEntries.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  onPress={() => router.push(`/entry/${entry.id}`)}
                  onDistill={() => handleDistill(entry)}
                />
              ))}
            </View>
          ))}
        </View>
      )}

      {entries.length === 0 && (
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>Welcome to Jono</Text>
          <Text style={styles.welcomeText}>
            Your voice-first journaling companion. Capture thoughts with voice or text,
            have reflective conversations, and discover insights about yourself over time.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: JonoTheme.colors.background.primary,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '700',
    color: JonoTheme.colors.text.primary,
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    color: JonoTheme.colors.text.secondary,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: JonoTheme.colors.accent.primary,
    borderRadius: JonoTheme.borderRadius.lg,
    padding: 18,
    marginBottom: 12,
    ...JonoTheme.shadows.medium,
  },
  quickActionIcon: {
    fontSize: 28,
    marginRight: 14,
  },
  quickActionText: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: JonoTheme.colors.text.inverse,
  },
  quickActionSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  quickActionArrow: {
    fontSize: 24,
    color: JonoTheme.colors.text.inverse,
  },
  jonoPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: JonoTheme.colors.background.card,
    borderRadius: JonoTheme.borderRadius.lg,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: JonoTheme.colors.border.light,
    ...JonoTheme.shadows.soft,
  },
  jonoOrbMini: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: JonoTheme.colors.accent.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  jonoOrbIcon: {
    fontSize: 22,
  },
  jonoPromptText: {
    flex: 1,
  },
  jonoPromptTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: JonoTheme.colors.text.primary,
  },
  jonoPromptSubtitle: {
    fontSize: 13,
    color: JonoTheme.colors.text.secondary,
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: JonoTheme.colors.text.primary,
    marginBottom: 16,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: JonoTheme.colors.text.secondary,
    marginBottom: 10,
    marginTop: 8,
  },
  emptyState: {
    backgroundColor: JonoTheme.colors.background.card,
    borderRadius: JonoTheme.borderRadius.lg,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: JonoTheme.colors.border.light,
    ...JonoTheme.shadows.soft,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: JonoTheme.colors.text.primary,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: JonoTheme.colors.text.secondary,
    textAlign: 'center',
  },
  welcomeCard: {
    backgroundColor: JonoTheme.colors.background.card,
    borderRadius: JonoTheme.borderRadius.lg,
    padding: 24,
    marginTop: 16,
    borderWidth: 1,
    borderColor: JonoTheme.colors.border.light,
    ...JonoTheme.shadows.soft,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: JonoTheme.colors.text.primary,
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 15,
    color: JonoTheme.colors.text.secondary,
    lineHeight: 22,
  },
});
