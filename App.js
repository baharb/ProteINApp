import 'react-native-url-polyfill/auto';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, StyleSheet, TouchableOpacity, Image, Modal, Pressable } from 'react-native';
import { Text } from './src/components/AppText';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { AppProvider, useApp } from './src/hooks/useApp';
import { LangProvider, useLang } from './src/hooks/useLang';
import { C, R } from './src/data/theme';
import { useRequireAccount } from './src/hooks/useRequireAccount';
import { wakeServer } from './src/lib/config';
import { DEMO_SCREEN } from './src/lib/demo';
import { useFonts } from 'expo-font';
import { APP_FONTS } from './src/components/AppText';

import AuthScreen       from './src/screens/AuthScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import HomeScreen       from './src/screens/HomeScreen';
import ScanScreen       from './src/screens/ScanScreen';
import ProgressScreen   from './src/screens/ProgressScreen';
import ProfileScreen    from './src/screens/ProfileScreen';
import CoachScreen      from './src/screens/CoachScreen';
import AddFoodScreen    from './src/screens/AddFoodScreen';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ── Custom SVG Icons ──────────────────────────────────────────────────────
function HomeIcon({ color }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z"
        stroke={color} strokeWidth={1.8} strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

function ProgressIcon({ color }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="3"  y="14" width="3.5" height="7" rx="1" stroke={color} strokeWidth={1.8} fill="none" />
      <Rect x="10" y="9"  width="3.5" height="12" rx="1" stroke={color} strokeWidth={1.8} fill="none" />
      <Rect x="17" y="4"  width="3.5" height="17" rx="1" stroke={color} strokeWidth={1.8} fill="none" />
    </Svg>
  );
}

// ── Custom tab bar: Today · [+ Log] · Progress ────────────────────────────
// Logging is the core action, so it gets a big raised button in the center.
// It offers the same three ways as Home (photo, voice, typing) from any screen.
function TabBar({ state, navigation, descriptors }) {
  const { t } = useLang();
  const insets = useSafeAreaInsets();
  const requireAccount = useRequireAccount();
  const current = state.routes[state.index].name;
  const [chooser, setChooser] = React.useState(false);
  // A screen can hide the bar (Scan does while the camera is open).
  if (descriptors[state.routes[state.index].key]?.options?.tabBarStyle?.display === 'none') return null;

  function go(name) {
    const route = state.routes.find(r => r.name === name);
    const event = navigation.emit({ type:'tabPress', target:route.key, canPreventDefault:true });
    if (current !== name && !event.defaultPrevented) navigation.navigate(name);
  }

  function SideTab({ name, icon: Icon, label }) {
    const focused = current === name;
    const color   = focused ? C.primary : C.text2;
    return (
      <TouchableOpacity style={tb.side} onPress={() => go(name)} activeOpacity={0.8}
        accessibilityRole="button" accessibilityState={{ selected:focused }} accessibilityLabel={label}>
        <View style={[tb.iconWrap, focused && { backgroundColor:C.primary + '18' }]}>
          <Icon color={color} />
        </View>
        <Text style={[tb.label, { color, fontWeight: focused ? '700' : '500' }]}>{label}</Text>
      </TouchableOpacity>
    );
  }

  function pick(how) {
    setChooser(false);
    if (how === 'snap') { if (requireAccount('scan')) navigation.navigate('ScanTab', { open: Date.now() }); return; }
    if (requireAccount('log')) navigation.navigate('HomeTab', { action: how, ts: Date.now() });
  }

  return (
    <View style={[tb.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <SideTab name="HomeTab" icon={HomeIcon} label={t('today')} />
      <View style={tb.center}>
        <TouchableOpacity style={tb.scanBtn} onPress={() => setChooser(true)} activeOpacity={0.9}
          accessibilityRole="button" accessibilityLabel={t('logWhatYouAte')}>
          <Text style={tb.plus}>+</Text>
        </TouchableOpacity>
        <Text style={[tb.label, { color: current === 'ScanTab' ? C.primary : C.text2, fontWeight:'700' }]}>
          {t('logTab')}
        </Text>
      </View>
      <SideTab name="ProgressTab" icon={ProgressIcon} label={t('progress')} />

      <Modal visible={chooser} transparent animationType="fade" onRequestClose={() => setChooser(false)}>
        <Pressable style={tb.backdrop} onPress={() => setChooser(false)}>
          <Pressable style={[tb.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
            <Text style={tb.sheetTitle}>{t('chooseHow')}</Text>
            <View style={tb.sheetRow}>
              {[['snap', '📷', t('snap')], ['say', '🎤', t('say')], ['type', '⌨️', t('typeIt')]].map(([how, icon, label]) => (
                <TouchableOpacity key={how} style={[tb.choice, how === 'snap' && tb.choiceMain]} onPress={() => pick(how)} activeOpacity={0.9}>
                  <Text style={tb.choiceIcon}>{icon}</Text>
                  <Text style={[tb.choiceTxt, how === 'snap' && { color:'#0B0F14' }]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const tb = StyleSheet.create({
  bar:      { flexDirection:'row', alignItems:'flex-end', backgroundColor:C.card, borderTopWidth:1, borderTopColor:C.border, paddingTop:8 },
  side:     { flex:1, alignItems:'center', gap:3 },
  iconWrap: { width:44, height:32, borderRadius:10, alignItems:'center', justifyContent:'center' },
  label:    { fontSize:11 },
  center:   { flex:1, alignItems:'center', gap:3 },
  scanBtn:  {
    width:64, height:64, borderRadius:32, backgroundColor:C.primary,
    alignItems:'center', justifyContent:'center', marginTop:-30,
    borderWidth:4, borderColor:C.bg,
    shadowColor:C.primary, shadowOpacity:0.4, shadowRadius:10, shadowOffset:{ width:0, height:4 }, elevation:8,
  },
  plus:       { fontSize:36, lineHeight:40, fontWeight:'500', color:'#07111F', marginTop:-2 },
  backdrop:   { flex:1, backgroundColor:'rgba(0,0,0,0.55)', justifyContent:'flex-end' },
  sheet:      { backgroundColor:C.card, borderTopLeftRadius:24, borderTopRightRadius:24, padding:20, width:'100%', maxWidth:620, alignSelf:'center', borderWidth:1, borderColor:C.border },
  sheetTitle: { fontSize:17, fontWeight:'800', color:C.text, marginBottom:16, textAlign:'center' },
  sheetRow:   { flexDirection:'row', gap:10 },
  choice:     { flex:1, height:100, borderRadius:R.lg, backgroundColor:C.card2, borderWidth:1, borderColor:C.border, alignItems:'center', justifyContent:'center', gap:8 },
  choiceMain: { backgroundColor:C.primary, borderColor:C.primary },
  choiceIcon: { fontSize:30 },
  choiceTxt:  { fontSize:15, fontWeight:'800', color:C.text },
});

// ── Main Tabs ─────────────────────────────────────────────────────────────
function MainTabs() {
  return (
    <Tab.Navigator initialRouteName={{ scan:'ScanTab', progress:'ProgressTab' }[DEMO_SCREEN] || 'HomeTab'} screenOptions={{ headerShown:false }} tabBar={props => <TabBar {...props} />}>
      <Tab.Screen name="HomeTab"     component={HomeScreen} />
      <Tab.Screen name="ScanTab"     component={ScanScreen} />
      <Tab.Screen name="ProgressTab" component={ProgressScreen} />
    </Tab.Navigator>
  );
}

// ── Root Navigator ────────────────────────────────────────────────────────
function RootNavigator() {
  const { session, profile, loading } = useApp();

  if (loading) {
    return (
      <View style={{ flex:1, backgroundColor:C.bg, alignItems:'center', justifyContent:'center' }}>
        <Image source={require('./assets/logo.png')} style={{ width:110, height:110, marginBottom:20 }} />
        <Text style={{ fontSize:24, fontWeight:'900', color:C.primary, marginBottom:16, letterSpacing:-0.5 }}>ProteIN</Text>
        <ActivityIndicator color={C.primary} size="large" />
      </View>
    );
  }

  if (session && !profile?.goal_calories) return <OnboardingScreen />;

  return (
    <Stack.Navigator initialRouteName={DEMO_SCREEN === 'coach' ? 'Coach' : 'Main'} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main"    component={MainTabs} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ animation:'slide_from_right' }} />
      <Stack.Screen name="Coach"   component={CoachScreen}   options={{ animation:'slide_from_bottom' }} />
      <Stack.Screen name="AddFood" component={AddFoodScreen} options={{ animation:'slide_from_right' }} />
      <Stack.Screen name="Auth"    component={AuthScreen}    options={{ presentation:'modal', animation:'slide_from_bottom' }} />
    </Stack.Navigator>
  );
}

// ── App Root ──────────────────────────────────────────────────────────────
export default function App() {
  React.useEffect(() => { wakeServer(); }, []);
  // Bundled fonts (Vazirmatn for Farsi) load in a moment; if they fail, the system font is used.
  const [fontsLoaded, fontError] = useFonts(APP_FONTS);
  if (!fontsLoaded && !fontError) return <View style={{ flex:1, backgroundColor:C.bg }} />;
  return (
    <SafeAreaProvider>
      <LangProvider>
        <AppProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </AppProvider>
      </LangProvider>
    </SafeAreaProvider>
  );
}
