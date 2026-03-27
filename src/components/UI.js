import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius } from '../data/constants';

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function BackButton({ navigation, label = 'Back' }) {
  return (
    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
      <Text style={styles.backText}>‹ {label}</Text>
    </TouchableOpacity>
  );
}

export function ScreenHeader({ title, subtitle, navigation, backLabel }) {
  return (
    <View style={styles.headerWrap}>
      {navigation && <BackButton navigation={navigation} label={backLabel} />}
      <Text style={styles.headerTitle}>{title}</Text>
      {subtitle ? <Text style={styles.headerSub}>{subtitle}</Text> : null}
    </View>
  );
}

export function MacroBar({ label, icon, value, target, unit = 'g', color }) {
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  return (
    <View style={[styles.macroCard, { borderColor: color + '44' }]}>
      <View style={styles.macroHead}>
        <Text style={styles.macroLabel}>{label}</Text>
        <Text style={{ fontSize: 16 }}>{icon}</Text>
      </View>
      <Text style={[styles.macroValue, { color }]}>{value}{unit === '' ? '' : unit}</Text>
      <Text style={styles.macroTarget}>/ {target}{unit === '' ? ' kcal' : unit}</Text>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export function ProteinStatusBadge({ today, goals }) {
  const pct = goals.protein > 0 ? Math.min(100, (today.protein / goals.protein) * 100) : 0;
  const remaining = Math.max(0, goals.protein - today.protein);
  const isMet = pct >= 100;
  const isClose = pct >= 70;
  const color = isMet ? colors.accent : isClose ? colors.accent3 : colors.orange;
  const label = isMet ? '✓ Goal Met!' : isClose ? 'Almost There' : 'Low Protein';
  return (
    <View style={[styles.psBadge, { borderColor: color + '44', backgroundColor: color + '15' }]}>
      <Text style={[styles.psBadgeLabel, { color }]}>{label}</Text>
      {!isMet && <Text style={styles.psRemaining}>{remaining}g to go</Text>}
    </View>
  );
}

export function PrimaryButton({ title, onPress, style }) {
  return (
    <TouchableOpacity style={[styles.primaryBtn, style]} onPress={onPress} activeOpacity={0.85}>
      <Text style={styles.primaryBtnText}>{title}</Text>
    </TouchableOpacity>
  );
}

export function SecondaryButton({ title, onPress, style }) {
  return (
    <TouchableOpacity style={[styles.secondaryBtn, style]} onPress={onPress} activeOpacity={0.85}>
      <Text style={styles.secondaryBtnText}>{title}</Text>
    </TouchableOpacity>
  );
}

export function TipCard({ tip }) {
  return (
    <View style={styles.tipCard}>
      <Text style={styles.tipLabel}>💡 Tip</Text>
      <Text style={styles.tipText}>{tip}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card, borderRadius: radius.lg,
    padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 12,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, alignSelf: 'flex-start' },
  backText: { fontSize: 17, color: colors.accent, fontWeight: '600' },
  headerWrap: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 6 },
  headerTitle: { fontSize: 26, fontWeight: '700', color: colors.text, letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: colors.text2, marginTop: 2 },
  macroCard: {
    backgroundColor: colors.card, borderRadius: radius.lg,
    padding: 12, flex: 1, borderWidth: 1,
  },
  macroHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  macroLabel: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: colors.text2, fontWeight: '700' },
  macroValue: { fontSize: 22, fontWeight: '700' },
  macroTarget: { fontSize: 11, color: colors.text2, marginBottom: 6 },
  barBg: { height: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 10 },
  psBadge: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8 },
  psBadgeLabel: { fontSize: 13, fontWeight: '700' },
  psRemaining: { fontSize: 12, color: colors.text2 },
  primaryBtn: { backgroundColor: colors.accent, borderRadius: radius.sm, paddingVertical: 14, alignItems: 'center' },
  primaryBtnText: { color: '#0a0a0f', fontWeight: '700', fontSize: 15 },
  secondaryBtn: { backgroundColor: colors.card, borderRadius: radius.sm, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  secondaryBtnText: { color: colors.text, fontWeight: '500', fontSize: 14 },
  tipCard: { backgroundColor: 'rgba(255,107,157,0.08)', borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: 'rgba(255,107,157,0.2)', marginBottom: 12 },
  tipLabel: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: colors.pink, fontWeight: '700', marginBottom: 4 },
  tipText: { fontSize: 13, color: colors.text, lineHeight: 20 },
});
