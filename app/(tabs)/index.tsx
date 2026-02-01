import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useJournalStore } from '../../stores/journalStore';
import { EntryCard } from '../../components/EntryCard';
import { formatDate, getRelativeDate } from '../../utils/dateHelpers';
import { generateArticle } from '../../services/articleGenerator';

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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4a4ae8" />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Interview Journal</Text>
        <Text style={styles.date}>{formatDate(today)}</Text>
      </View>

      {/* Quick Actions */}
      <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/record')}>
        <Text style={styles.quickActionIcon}>🎙</Text>
        <View style={styles.quickActionText}>
          <Text style={styles.quickActionTitle}>Start Recording</Text>
          <Text style={styles.quickActionSubtitle}>Capture a new interview</Text>
        </View>
        <Text style={styles.quickActionArrow}>→</Text>
      </TouchableOpacity>

      {/* Today's Entries */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today</Text>
        {todayEntries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyText}>No entries yet today</Text>
            <Text style={styles.emptySubtext}>Start recording to capture your first interview</Text>
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
          <Text style={styles.welcomeTitle}>Welcome to Interview Journal</Text>
          <Text style={styles.welcomeText}>
            Capture your interviews with voice + notes, and let AI distill them into polished articles.
            Get weekly trend reports to spot patterns across your conversations.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d1a',
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
    color: '#fff',
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    color: '#666',
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4a4ae8',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  quickActionIcon: {
    fontSize: 32,
    marginRight: 14,
  },
  quickActionText: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  quickActionSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  quickActionArrow: {
    fontSize: 24,
    color: '#fff',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
    marginTop: 8,
  },
  emptyState: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  welcomeCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 24,
    marginTop: 16,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 15,
    color: '#aaa',
    lineHeight: 22,
  },
});
