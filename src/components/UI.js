import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, radius } from '../data/constants';

export function Card({ children, style }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function ScreenHeader({ title, subtitle, navigation, backLabel = 'Back' }) {
  return (
    <View style={s.header}>
      {navigation && (
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
          <Text style={s.backText}>‹ {backLabel}</Text>
        </TouchableOpacity>
      )}
      <Text style={s.title}>{title}</Text>
      {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function MacroBar({ label, icon, value, target, unit = 'g', color }) {
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  return (
    <View style={[s.macroCard, { borderColor: color + '44' }]}>
      <View style={s.macroHead}>
        <Text style={s.macroLabel}>{label}</Text>
        <Text style={{ fontSize: 16 }}>{icon}</Text>
      </View>
      <Text style={[s.macroValue, { color }]}>{value}{unit !== '' ? unit : ''}</Text>
      <Text style={s.macroTarget}>/ {target}{unit !== '' ? unit : ' kcal'}</Text>
      <View style={s.barBg}>
        <View style={[s.barFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export function PrimaryButton({ title, onPress, style, loading = false, disabled = false }) {
  return (
    <TouchableOpacity style={[s.primaryBtn, (loading || disabled) && { opacity: 0.6 }, style]} onPress={onPress} activeOpacity={0.85} disabled={loading || disabled}>
      {loading ? <ActivityIndicator color="#0a0a0f" /> : <Text style={s.primaryBtnText}>{title}</Text>}
    </TouchableOpacity>
  );
}

export function SecondaryButton({ title, onPress, style }) {
  return (
    <TouchableOpacity style={[s.secondaryBtn, style]} onPress={onPress} activeOpacity={0.85}>
      <Text style={s.secondaryBtnText}>{title}</Text>
    </TouchableOpacity>
  );
}

export function TipCard({ tip }) {
  return (
    <View style={s.tipCard}>
      <Text style={s.tipLabel}>💡 Tip</Text>
      <Text style={s.tipText}>{tip}</Text>
    </View>
  );
}

export function ProteinStatusBadge({ today, goals }) {
  const pct = goals.protein > 0 ? Math.min(100, (today.protein / goals.protein) * 100) : 0;
  const remaining = Math.max(0, goals.protein - today.protein);
  const isMet = pct >= 100, isClose = pct >= 70;
  const color = isMet ? colors.accent : isClose ? colors.accent3 : colors.orange;
  const label = isMet ? '✓ Goal Met!' : isClose ? 'Almost There' : 'Low Protein';
  return (
    <View style={[s.badge, { borderColor: color + '55', backgroundColor: color + '18' }]}>
      <Text style={[s.badgeLabel, { color }]}>{label}</Text>
      {!isMet && <Text style={s.badgeRemaining}>{remaining}g to go</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
  header: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 8 },
  backBtn: { alignSelf: 'flex-start', marginBottom: 6 },
  backText: { fontSize: 17, color: colors.accent, fontWeight: '600' },
  title: { fontSize: 26, fontWeight: '700', color: colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: colors.text2, marginTop: 2 },
  macroCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 12, flex: 1, borderWidth: 1 },
  macroHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  macroLabel: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: colors.text2, fontWeight: '700' },
  macroValue: { fontSize: 22, fontWeight: '700' },
  macroTarget: { fontSize: 11, color: colors.text2, marginBottom: 6 },
  barBg: { height: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 10 },
  primaryBtn: { backgroundColor: colors.accent, borderRadius: radius.sm, paddingVertical: 14, alignItems: 'center' },
  primaryBtnText: { color: '#0a0a0f', fontWeight: '700', fontSize: 15 },
  secondaryBtn: { backgroundColor: colors.card, borderRadius: radius.sm, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  secondaryBtnText: { color: colors.text, fontWeight: '500', fontSize: 14 },
  tipCard: { backgroundColor: 'rgba(255,107,157,0.08)', borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: 'rgba(255,107,157,0.2)', marginBottom: 12 },
  tipLabel: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: colors.pink, fontWeight: '700', marginBottom: 4 },
  tipText: { fontSize: 13, color: colors.text, lineHeight: 20 },
  badge: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8 },
  badgeLabel: { fontSize: 13, fontWeight: '700' },
  badgeRemaining: { fontSize: 12, color: colors.text2 },
});
