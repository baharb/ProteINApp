import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, displayWeight, displayHeight, GOAL_LABELS } from '../data/constants';
import { useApp } from '../hooks/useApp';
import { ScreenHeader } from '../components/UI';
import { registerForPushNotifications, scheduleDailyProteinReminder } from '../lib/notifications';

const W_UNITS = ['kg', 'lbs'];
const H_UNITS = ['cm', 'in', 'ft'];

export default function ProfileScreen() {
  const { goals, goals2, profile, units, setUnits, signOut, session } = useApp();
  const [notifications, setNotifications] = useState(false);

  useEffect(() => {
    registerForPushNotifications().then(granted => setNotifications(!!granted));
  }, []);

  async function toggleNotifications(val) {
    if (val) {
      const granted = await registerForPushNotifications();
      if (granted) {
        await scheduleDailyProteinReminder(goals.protein);
        setNotifications(true);
      } else {
        Alert.alert('Permission Denied', 'Please enable notifications in your phone Settings.');
      }
    } else {
      setNotifications(false);
    }
  }

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  }

  const wu = units?.weight || 'kg';
  const hu = units?.height || 'cm';

  return (
    <SafeAreaView style={s.safe}>
      <ScreenHeader title="Profile" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        <View style={s.profileHead}>
          <View style={s.avatar}><Text style={{ fontSize: 32 }}>👤</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.email} numberOfLines={1}>{session?.user?.email || 'Your Profile'}</Text>
            {profile && (
              <Text style={s.bodyStats}>
                {displayWeight(profile.weight_kg, wu)} · {displayHeight(profile.height_cm, hu)} · Age {profile.age}
              </Text>
            )}
            <View style={s.chips}>
              {(goals2 || []).map(g => (
                <View key={g} style={s.chip}>
                  <Text style={s.chipTxt}>{GOAL_LABELS[g]}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Daily Goals</Text>
          {[
            { label: 'Calories', val: `${goals.calories.toLocaleString()} kcal` },
            { label: 'Protein',  val: `${goals.protein}g` },
            { label: 'Carbs',    val: `${goals.carbs}g` },
            { label: 'Fat',      val: `${goals.fat}g` },
          ].map(r => (
            <View key={r.label} style={s.row}>
              <Text style={s.rowLabel}>{r.label}</Text>
              <Text style={s.rowVal}>{r.val}</Text>
            </View>
          ))}
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Units</Text>
          <Text style={s.unitGroupLabel}>Weight</Text>
          <View style={s.unitRow}>
            {W_UNITS.map(u => (
              <TouchableOpacity key={u} style={[s.unitBtn, wu === u && s.unitBtnOn]} onPress={() => setUnits(p => ({ ...p, weight: u }))}>
                <Text style={[s.unitBtnTxt, wu === u && { color: colors.accent3 }]}>{u}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[s.unitGroupLabel, { marginTop: 14 }]}>Height</Text>
          <View style={s.unitRow}>
            {H_UNITS.map(u => (
              <TouchableOpacity key={u} style={[s.unitBtn, hu === u && s.unitBtnOn]} onPress={() => setUnits(p => ({ ...p, height: u }))}>
                <Text style={[s.unitBtnTxt, hu === u && { color: colors.accent3 }]}>{u}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Settings</Text>
          <View style={s.settingRow}>
            <View>
              <Text style={s.settingLabel}>🔔 Daily Reminders</Text>
              <Text style={s.settingDesc}>8am + 7pm protein nudges</Text>
            </View>
            <Switch value={notifications} onValueChange={toggleNotifications} trackColor={{ false: colors.card2, true: colors.accent }} thumbColor="#fff" />
          </View>
          <View style={[s.settingRow, { borderBottomWidth: 0 }]}>
            <View>
              <Text style={s.settingLabel}>📱 Wearable Sync</Text>
              <Text style={s.settingDesc}>Apple Watch / Fitbit</Text>
            </View>
            <Text style={s.comingSoon}>Coming soon</Text>
          </View>
        </View>

        <TouchableOpacity style={s.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
          <Text style={s.signOutTxt}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={s.version}>ProteIN AI v1.0.0 · Groq + Supabase</Text>
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 18, paddingTop: 8 },
  profileHead: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  avatar: { width: 66, height: 66, borderRadius: 33, backgroundColor: 'rgba(126,255,160,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(126,255,160,0.3)' },
  email: { fontSize: 15, fontWeight: '700', color: colors.text },
  bodyStats: { fontSize: 12, color: colors.text2, marginTop: 2, marginBottom: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { backgroundColor: 'rgba(126,255,160,0.12)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(126,255,160,0.25)' },
  chipTxt: { fontSize: 11, color: colors.accent, fontWeight: '600' },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: colors.border },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { fontSize: 13, color: colors.text2 },
  rowVal: { fontSize: 16, fontWeight: '700', color: colors.accent },
  unitGroupLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: colors.text2, fontWeight: '700', marginBottom: 8 },
  unitRow: { flexDirection: 'row', gap: 8 },
  unitBtn: { flex: 1, backgroundColor: colors.bg3, borderWidth: 2, borderColor: colors.border, borderRadius: radius.sm, paddingVertical: 10, alignItems: 'center' },
  unitBtnOn: { borderColor: colors.accent3, backgroundColor: 'rgba(0,212,255,0.1)' },
  unitBtnTxt: { fontSize: 13, fontWeight: '700', color: colors.text2 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  settingLabel: { fontSize: 14, color: colors.text, fontWeight: '500' },
  settingDesc: { fontSize: 11, color: colors.text2, marginTop: 2 },
  comingSoon: { fontSize: 12, color: colors.text3 },
  signOutBtn: { backgroundColor: 'rgba(255,140,66,0.1)', borderRadius: radius.sm, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,140,66,0.3)', marginBottom: 14 },
  signOutTxt: { color: colors.orange, fontWeight: '700', fontSize: 15 },
  version: { textAlign: 'center', fontSize: 11, color: colors.text3 },
});
