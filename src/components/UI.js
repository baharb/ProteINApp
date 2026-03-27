import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius } from '../data/constants';

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function MacroBar({ label, icon, value, target, unit = 'g', color, fillColor }) {
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  return (
    <View style={[styles.macroCard, { borderColor: color + '33' }]}>
      <View style={styles.macroHead}>
        <Text style={styles.macroLabel}>{label}</Text>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>
      <Text style={[styles.macroValue, { color }]}>{value}{unit}</Text>
      <Text style={styles.macroTarget}>of {target}{unit} daily</Text>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export function ProteinStatusCard({ today, goals }) {
  const remaining = goals.protein - today.protein;
  const pct = goals.protein > 0 ? Math.min(100, Math.round((today.protein / goals.protein) * 100)) : 0;
  const isGood = pct >= 70;
  const isMet = pct >= 100;

  const suggestions = remaining > 30
    ? ['Chicken breast', 'Protein shake', 'Tuna']
    : ['Greek yogurt', 'Cottage cheese', 'Eggs'];

  return (
    <Card style={styles.psCard}>
      <View style={styles.psHead}>
        <Text style={styles.psTitle}>Protein Status</Text>
        <View style={[styles.psBadge, isMet ? styles.badgeGood : isGood ? styles.badgeAlmost : styles.badgeLow]}>
          <Text style={[styles.psBadgeText, { color: isMet || isGood ? colors.accent : colors.orange }]}>
            {isMet ? '✓ Goal Met' : isGood ? 'Almost There' : 'Low Protein'}
          </Text>
        </View>
      </View>
      <Text style={styles.psMsg}>
        {isMet
          ? `Amazing! You've hit your protein goal today (${today.protein}g / ${goals.protein}g) 🎉`
          : `You need ${Math.max(0, remaining)}g more protein today.`}
      </Text>
      {!isMet && (
        <View style={styles.psChips}>
          {suggestions.map(s => (
            <View key={s} style={styles.chip}>
              <Text style={styles.chipText}>{s}</Text>
            </View>
          ))}
        </View>
      )}
    </Card>
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

export function SectionTitle({ title, action, onAction }) {
  return (
    <View style={styles.sectionHead}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && (
        <TouchableOpacity onPress={onAction}>
          <Text style={styles.sectionLink}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export function TipCard({ tip }) {
  return (
    <View style={styles.tipCard}>
      <Text style={styles.tipLabel}>💡 Tip of the Day</Text>
      <Text style={styles.tipText}>{tip}</Text>
    </View>
  );
}

export function HealthScoreRing({ score, onPress }) {
  const label = score >= 80 ? 'Excellent! 🌟' : score >= 60 ? 'Good Progress' : score >= 40 ? 'Keep Going!' : 'Just Starting';
  const circumference = 2 * Math.PI * 32;
  const strokeDash = circumference - (circumference * score / 100);

  return (
    <TouchableOpacity style={styles.hsCard} onPress={onPress} activeOpacity={0.9}>
      <View>
        <Text style={styles.hsLabel}>Today's Health Score</Text>
        <Text style={styles.hsScore}>
          {score}<Text style={styles.hsMax}>/100</Text>
        </Text>
        <Text style={styles.hsStatus}>{label}</Text>
        <Text style={styles.hsTap}>Tap for AI Coach →</Text>
      </View>
      <View style={styles.ringWrap}>
        <Text style={{ fontSize: 48, textAlign: 'center' }}>
          {score >= 80 ? '🏆' : score >= 60 ? '💪' : score >= 40 ? '🔥' : '🌱'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  macroCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 14,
    flex: 1,
    gap: 7,
    borderWidth: 1,
  },
  macroHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  macroLabel: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: colors.text2, fontWeight: '600' },
  macroValue: { fontSize: 22, fontWeight: '700' },
  macroTarget: { fontSize: 11, color: colors.text2 },
  barBg: { height: 5, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 10 },
  psCard: { marginBottom: 14 },
  psHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  psTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  psBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  badgeGood: { backgroundColor: 'rgba(126,255,160,0.15)', borderColor: 'rgba(126,255,160,0.3)' },
  badgeAlmost: { backgroundColor: 'rgba(126,255,160,0.1)', borderColor: 'rgba(126,255,160,0.2)' },
  badgeLow: { backgroundColor: 'rgba(255,140,66,0.15)', borderColor: 'rgba(255,140,66,0.3)' },
  psBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  psMsg: { fontSize: 13, color: colors.text2, lineHeight: 20, marginBottom: 10 },
  psChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: { backgroundColor: colors.card2, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: colors.border },
  chipText: { fontSize: 11, color: colors.text2, fontWeight: '600' },
  primaryBtn: { backgroundColor: colors.accent, borderRadius: radius.sm, paddingVertical: 14, alignItems: 'center' },
  primaryBtnText: { color: '#0a0a0f', fontWeight: '700', fontSize: 15 },
  secondaryBtn: { backgroundColor: colors.card, borderRadius: radius.sm, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  secondaryBtnText: { color: colors.text, fontWeight: '500', fontSize: 14 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  sectionLink: { fontSize: 13, color: colors.accent, fontWeight: '500' },
  tipCard: { backgroundColor: 'rgba(255,107,157,0.08)', borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: 'rgba(255,107,157,0.2)', marginBottom: 14 },
  tipLabel: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: colors.pink, fontWeight: '700', marginBottom: 6 },
  tipText: { fontSize: 13, color: colors.text, lineHeight: 20 },
  hsCard: {
    backgroundColor: '#0f1a20',
    borderRadius: radius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.2)',
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hsLabel: { fontSize: 11, color: colors.text2, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  hsScore: { fontSize: 48, fontWeight: '700', color: colors.accent3 },
  hsMax: { fontSize: 18, color: colors.text2, fontWeight: '400' },
  hsStatus: { fontSize: 13, color: colors.accent3, fontWeight: '600', marginTop: 2 },
  hsTap: { fontSize: 11, color: colors.text2, marginTop: 4 },
  ringWrap: { width: 80, alignItems: 'center', justifyContent: 'center' },
});
