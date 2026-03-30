import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { enableScreens } from 'react-native-screens';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text, View, StyleSheet, ActivityIndicator } from 'react-native';

import { AppProvider, useApp } from './src/hooks/useApp';
import { colors } from './src/data/constants';

import AuthScreen        from './src/screens/AuthScreen';
import OnboardingScreen  from './src/screens/OnboardingScreen';
import DashboardScreen   from './src/screens/DashboardScreen';
import ScanScreen        from './src/screens/ScanScreen';
import AddFoodScreen     from './src/screens/AddFoodScreen';
import ProgressScreen    from './src/screens/ProgressScreen';
import ProfileScreen     from './src/screens/ProfileScreen';
import CoachScreen       from './src/screens/CoachScreen';

enableScreens();

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabIcon({ emoji, label, focused }) {
  return (
    <View style={ti.wrap}>
      <Text style={[ti.emoji, { opacity: focused ? 1 : 0.4 }]}>{emoji}</Text>
      <Text style={[ti.label, { color: focused ? colors.accent : colors.text3 }]}>{label}</Text>
    </View>
  );
}
const ti = StyleSheet.create({
  wrap:  { alignItems: 'center', justifyContent: 'center', paddingTop: 6 },
  emoji: { fontSize: 20 },
  label: { fontSize: 9, fontWeight: '700', marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.5 },
});

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.bg2,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 68,
        },
      }}
    >
      {[
        { name: 'HomeTab',     comp: DashboardScreen, emoji: '🏠', label: 'Home'     },
        { name: 'ScanTab',     comp: ScanScreen,      emoji: '📷', label: 'Scan'     },
        { name: 'AddTab',      comp: AddFoodScreen,   emoji: '➕', label: 'Add'      },
        { name: 'ProgressTab', comp: ProgressScreen,  emoji: '📊', label: 'Progress' },
        { name: 'ProfileTab',  comp: ProfileScreen,   emoji: '👤', label: 'Profile'  },
      ].map(({ name, comp, emoji, label }) => (
        <Tab.Screen key={name} name={name} component={comp}
          options={{ tabBarIcon: ({ focused }) => <TabIcon emoji={emoji} label={label} focused={focused} /> }}
        />
      ))}
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { session, profile, loading } = useApp();
  const [onboarded, setOnboarded] = useState(false);

  // Reset onboarded when profile loads from Supabase
  useEffect(() => {
    if (profile) setOnboarded(true);
  }, [profile]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 48, marginBottom: 20 }}>🥗</Text>
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={{ color: colors.text2, marginTop: 16, fontSize: 14 }}>Loading your data…</Text>
      </View>
    );
  }

  // Not logged in → Auth
  if (!session) return <AuthScreen />;

  // Logged in but no profile yet → Onboarding
  if (!onboarded) return <OnboardingScreen onComplete={() => setOnboarded(true)} />;

  // Logged in + profile → Main app
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen
        name="Coach"
        component={CoachScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <NavigationContainer>
          <StatusBar style="light" backgroundColor={colors.bg} />
          <AppNavigator />
        </NavigationContainer>
      </AppProvider>
    </SafeAreaProvider>
  );
}
