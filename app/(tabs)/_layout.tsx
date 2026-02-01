import { Tabs } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';

interface TabIconProps {
  icon: string;
  focused: boolean;
  label: string;
}

const TabIcon = ({ icon, focused, label }: TabIconProps) => (
  <View style={styles.tabContainer}>
    <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>{icon}</Text>
    <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
  </View>
);

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#0d0d1a',
          borderTopColor: '#1a1a2e',
          height: 85,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#4a4ae8',
        tabBarInactiveTintColor: '#666',
        headerStyle: {
          backgroundColor: '#0d0d1a',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '700',
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ focused }) => <TabIcon icon="📖" focused={focused} label="Today" />,
        }}
      />
      <Tabs.Screen
        name="record"
        options={{
          title: 'New Entry',
          tabBarIcon: ({ focused }) => <TabIcon icon="🎙" focused={focused} label="Record" />,
        }}
      />
      <Tabs.Screen
        name="articles"
        options={{
          title: 'Articles',
          tabBarIcon: ({ focused }) => <TabIcon icon="📄" focused={focused} label="Articles" />,
        }}
      />
      <Tabs.Screen
        name="trends"
        options={{
          title: 'Weekly Trends',
          tabBarIcon: ({ focused }) => <TabIcon icon="📊" focused={focused} label="Trends" />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  tabIconFocused: {
    transform: [{ scale: 1.1 }],
  },
  tabLabel: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  tabLabelFocused: {
    color: '#4a4ae8',
  },
});
