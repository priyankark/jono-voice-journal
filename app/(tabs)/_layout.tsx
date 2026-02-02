import { Tabs } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';
import { JonoTheme } from '../../constants/theme';

interface TabIconProps {
  icon: string;
  focused: boolean;
  label: string;
  isCenter?: boolean;
}

const TabIcon = ({ icon, focused, label, isCenter }: TabIconProps) => (
  <View style={[styles.tabContainer, isCenter && styles.tabContainerCenter]}>
    {isCenter ? (
      <View style={[styles.centerOrb, focused && styles.centerOrbFocused]}>
        <Text style={styles.centerOrbIcon}>{icon}</Text>
      </View>
    ) : (
      <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>{icon}</Text>
    )}
    <Text
      style={[styles.tabLabel, focused && styles.tabLabelFocused]}
      numberOfLines={1}
      ellipsizeMode="tail"
    >
      {label}
    </Text>
  </View>
);

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: JonoTheme.colors.background.card,
          borderTopColor: JonoTheme.colors.border.light,
          height: 88,
          paddingTop: 8,
          ...JonoTheme.shadows.soft,
        },
        tabBarActiveTintColor: JonoTheme.colors.accent.primary,
        tabBarInactiveTintColor: JonoTheme.colors.text.tertiary,
        headerStyle: {
          backgroundColor: JonoTheme.colors.background.primary,
          ...JonoTheme.shadows.soft,
        },
        headerTintColor: JonoTheme.colors.text.primary,
        headerTitleStyle: {
          fontWeight: '600',
          color: JonoTheme.colors.text.primary,
        },
        headerShadowVisible: false,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="📖" focused={focused} label="Today" />
          ),
        }}
      />
      <Tabs.Screen
        name="record"
        options={{
          title: 'Capture',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="✏️" focused={focused} label="Capture" />
          ),
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: 'Jono',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="✨" focused={focused} label="Jono" isCenter />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="💡" focused={focused} label="Insights" />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🔍" focused={focused} label="Search" />
          ),
        }}
      />
      {/* Hidden screens */}
      <Tabs.Screen
        name="articles"
        options={{
          href: null, // Hide from tab bar but keep accessible
          title: 'Articles',
        }}
      />
      <Tabs.Screen
        name="trends"
        options={{
          href: null, // Hide from tab bar
          title: 'Trends',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    width: 64,
    maxWidth: 64,
  },
  tabContainerCenter: {
    marginTop: -20,
    width: 72,
    maxWidth: 72,
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: 4,
    opacity: 0.7,
  },
  tabIconFocused: {
    transform: [{ scale: 1.15 }],
    opacity: 1,
  },
  tabLabel: {
    fontSize: 10,
    color: JonoTheme.colors.text.tertiary,
    fontWeight: '500',
    textAlign: 'center',
    width: '100%',
    maxWidth: 60,
  },
  tabLabelFocused: {
    color: JonoTheme.colors.accent.primary,
    fontWeight: '600',
  },
  centerOrb: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: JonoTheme.colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderWidth: 3,
    borderColor: 'transparent',
    ...JonoTheme.shadows.medium,
  },
  centerOrbFocused: {
    backgroundColor: JonoTheme.colors.accent.primary,
    transform: [{ scale: 1.08 }],
    borderColor: JonoTheme.colors.accent.muted,
    ...JonoTheme.shadows.strong,
  },
  centerOrbIcon: {
    fontSize: 24,
  },
});
