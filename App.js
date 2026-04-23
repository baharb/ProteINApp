import 'react-native-url-polyfill/auto';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './src/hooks/useApp';
import { colors } from './src/data/constants';

import AuthScreen      from './src/screens/AuthScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ScanScreen      from './src/screens/ScanScreen';
import AddFoodScreen   from './src/screens/AddFoodScreen';
import ProgressScreen  from './src/screens/ProgressScreen';
import ProfileScreen   from './src/screens/ProfileScreen';
import CoachScreen     from './src/screens/CoachScreen';
import ProgramScreen   from './src/screens/ProgramScreen';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabIcon({ emoji, label, focused }) {
  return (
    <View style={{ alignItems:'center', paddingTop:4 }}>
      <Text style={{ fontSize:20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
      <Text style={{ fontSize:9, color: focused ? colors.accent : colors.text3, marginTop:2, fontWeight: focused?'700':'400' }}>{label}</Text>
    </View>
  );
}

// Guest login button shown in tab bar header area
function GuestLoginButton({ navigation }) {
  const { signOut } = useApp();
  return (
    <TouchableOpacity
      style={gl.btn}
      onPress={() => signOut()} // signOut resets isGuest, goes back to Auth
      activeOpacity={0.85}
    >
      <Text style={gl.txt}>🔑 Login</Text>
    </TouchableOpacity>
  );
}
const gl = StyleSheet.create({
  btn:{ backgroundColor:'rgba(126,255,160,0.15)', borderRadius:20, paddingHorizontal:14, paddingVertical:6, borderWidth:1, borderColor:'rgba(126,255,160,0.3)' },
  txt:{ color:colors.accent, fontWeight:'700', fontSize:13 },
});

function MainTabs() {
  const { isGuest } = useApp();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor:colors.bg2, borderTopColor:colors.border, height:60, paddingBottom:8 },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen name="HomeTab"     component={DashboardScreen} options={{ tabBarIcon:({focused})=><TabIcon emoji="🏠" label="Home"     focused={focused}/> }} />
      <Tab.Screen name="ScanTab"     component={ScanScreen}      options={{ tabBarIcon:({focused})=><TabIcon emoji="📷" label="Scan"     focused={focused}/> }} />
      <Tab.Screen name="AddTab"      component={AddFoodScreen}   options={{ tabBarIcon:({focused})=><TabIcon emoji="➕" label="Add"      focused={focused}/> }} />
      <Tab.Screen name="ProgramTab"  component={ProgramScreen}   options={{ tabBarIcon:({focused})=><TabIcon emoji="📋" label="Program"  focused={focused}/> }} />
      <Tab.Screen name="ProgressTab" component={ProgressScreen}  options={{ tabBarIcon:({focused})=><TabIcon emoji="📊" label="Progress" focused={focused}/> }} />
      <Tab.Screen name="ProfileTab"  component={ProfileScreen}   options={{
        tabBarIcon: ({focused}) => <TabIcon emoji={isGuest?"🔑":"👤"} label={isGuest?"Login":"Profile"} focused={focused}/>,
      }} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { session, isGuest, profile, loading } = useApp();

  if (loading) {
    return (
      <View style={{ flex:1, backgroundColor:colors.bg, alignItems:'center', justifyContent:'center' }}>
        <Text style={{ fontSize:32, marginBottom:16 }}>🥗</Text>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  // Not logged in and not guest → show auth
  if (!session && !isGuest) return <AuthScreen />;

  // Guest mode — show main tabs (ProfileTab shows login button)
  if (isGuest) {
    return (
      <Stack.Navigator screenOptions={{ headerShown:false }}>
        <Stack.Screen name="Main"    component={MainTabs} />
        <Stack.Screen name="Coach"   component={CoachScreen} />
        <Stack.Screen name="Program" component={ProgramScreen} />
      </Stack.Navigator>
    );
  }

  // Logged in but no profile → onboarding
  if (session && !profile?.goal_calories) {
    return <OnboardingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown:false }}>
      <Stack.Screen name="Main"    component={MainTabs} />
      <Stack.Screen name="Coach"   component={CoachScreen} />
      <Stack.Screen name="Program" component={ProgramScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AppProvider>
    </SafeAreaProvider>
  );
}
