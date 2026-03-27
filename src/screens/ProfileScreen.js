import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius } from '../data/constants';
import { useApp } from '../hooks/useApp';

const GOAL_LABELS = {
  lose: '🔥 Lose Fat',
  muscle: '💪 Build Muscle',
  healthy: '🌿 Stay Healthy',
};

export default function ProfileScreen({ navigation }) {
  const { goals, goal } = useApp();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={{ fontSize: 30 }}>👤</Text>
          </View>
          <View>
            <Text style={styles.profileName}>My Profile</Text>
            <Text style={styles.profileGoal}>{GOAL_LABELS[goal] || '💪 Build Muscle'}</Text>
            <View style={styles.freeBadge}>
              <Text style={styles.freeBadgeText}>⭐ Free Plan</Text>
            </View>
          </View>
        </View>

        {/* Premium Banner */}
        <View style={styles.premiumCard}>
          <View>
            <Text style={styles.premiumTitle}>⭐ Upgrade to Premium</Text>
            <Text style={styles.premiumSub}>Unlimited AI scans · Meal plans · Advanced insights</Text>
          </View>
          <TouchableOpacity style={styles.premiumBtn}>
            <Text style={styles.premiumBtnText}>$7/mo</Text>
          </TouchableOpacity>
        </View>

        {/* Daily Goals */}
        <View style={styles.goalsCard}>
          <Text style={styles.cardTitle}>Your Daily Goals</Text>
          {[
            { label: 'Calories', val: `${goals.calories.toLocaleString()} kcal` },
            { label: 'Protein', val: `${goals.protein}g` },
            { label: 'Carbs', val: `${goals.carbs}g` },
            { label: 'Fat', val: `${goals.fat}g` },
            { label: 'Goal', val: GOAL_LABELS[goal] || '-' },
          ].map(r => (
            <View key={r.label} style={styles.goalRow}>
              <Text style={styles.goalLabel}>{r.label}</Text>
              <Text style={styles.goalVal}>{r.val}</Text>
            </View>
          ))}
        </View>

        {/* Tip */}
        <View style={styles.tipCard}>
          <Text style={styles.tipLabel}>💡 Did You Know?</Text>
          <Text style={styles.tipText}>
            Spreading your protein intake evenly across 3–4 meals (20–40g each) is more effective for muscle protein synthesis than eating it all in one sitting.
          </Text>
        </View>

        {/* Settings */}
        <View style={styles.settingsCard}>
          <Text style={styles.cardTitle}>Settings</Text>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>🔔 Smart Notifications</Text>
            <Switch
              value={true}
              trackColor={{ false: colors.card2, true: colors.accent }}
              thumbColor="#fff"
              onValueChange={() => {}}
            />
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>📊 Units</Text>
            <Text style={styles.settingValue}>Metric (kg, cm)</Text>
          </View>

          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingLabel}>🎯 Update Goals</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>📱 Wearable Integration</Text>
            <Text style={styles.settingValue}>Coming Soon</Text>
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>📴 Offline Mode</Text>
            <Switch
              value={true}
              trackColor={{ false: colors.card2, true: colors.accent }}
              thumbColor="#fff"
              onValueChange={() => {}}
            />
          </View>

          <TouchableOpacity style={[styles.settingItem, { borderBottomWidth: 0 }]}>
            <Text style={styles.settingLabel}>🛒 Grocery List</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Version */}
        <Text style={styles.version}>ProteIN AI v1.0.0 · Made with ❤️</Text>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 18, paddingTop: 16 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(126,255,160,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(126,255,160,0.3)' },
  profileName: { fontSize: 22, fontWeight: '700', color: colors.text, letterSpacing: -0.5 },
  profileGoal: { fontSize: 13, color: colors.text2, marginTop: 2 },
  freeBadge: { marginTop: 6, alignSelf: 'flex-start', backgroundColor: 'rgba(255,215,0,0.1)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)' },
  freeBadgeText: { fontSize: 12, color: colors.gold, fontWeight: '600' },
  premiumCard: { backgroundColor: '#1a1500', borderRadius: radius.lg, padding: 18, marginBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)' },
  premiumTitle: { fontSize: 16, fontWeight: '700', color: colors.gold, marginBottom: 3 },
  premiumSub: { fontSize: 12, color: 'rgba(255,215,0,0.6)', maxWidth: 200 },
  premiumBtn: { backgroundColor: colors.gold, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  premiumBtnText: { color: '#0a0a0f', fontWeight: '700', fontSize: 13 },
  goalsCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: colors.border },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 14 },
  goalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  goalLabel: { fontSize: 14, color: colors.text2 },
  goalVal: { fontSize: 16, fontWeight: '700', color: colors.accent },
  tipCard: { backgroundColor: 'rgba(255,107,157,0.08)', borderRadius: radius.lg, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,107,157,0.2)' },
  tipLabel: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: colors.pink, fontWeight: '700', marginBottom: 6 },
  tipText: { fontSize: 13, color: colors.text, lineHeight: 20 },
  settingsCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: colors.border },
  settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.border },
  settingLabel: { fontSize: 14, fontWeight: '500', color: colors.text },
  settingValue: { fontSize: 13, color: colors.text2 },
  settingArrow: { fontSize: 18, color: colors.text3 },
  version: { textAlign: 'center', fontSize: 12, color: colors.text3, marginTop: 4 },
});
