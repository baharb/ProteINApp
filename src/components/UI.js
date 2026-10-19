import React, { useRef, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, Image } from 'react-native';
import { Text } from './AppText';
import Svg, { Circle } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { C, R } from '../data/theme';
import { FOOD_IMAGES, guessFoodImage } from '../data/foodImages';
import { useLang } from '../hooks/useLang';

// ── Food photo (falls back to the emoji while loading / offline) ─────────
export function FoodImage({ image, emoji, name, size=56, round=false, style }) {
  const src = FOOD_IMAGES[image] || FOOD_IMAGES[guessFoodImage(name)];
  const shape = { width:size, height:size, borderRadius: round ? size/2 : Math.round(size*0.22) };
  // Cut-out food on a plain dark tile; emoji for foods without a picture.
  return (
    <View style={[shape, { backgroundColor:C.card2, alignItems:'center', justifyContent:'center', overflow:'hidden' }, style]}>
      {src
        ? <Image source={src.source} style={{ width:size*0.84, height:size*0.84 }} resizeMode="contain" />
        : <Text style={{ fontSize:size*0.45 }}>{emoji || '🍽️'}</Text>}
    </View>
  );
}

// ── Protein Ring ─────────────────────────────────────────────────────────
export function ProteinRing({ consumed, goal, size=140, stroke=10 }) {
  const radius   = (size - stroke) / 2;
  const circum   = 2 * Math.PI * radius;
  const progress = Math.min(consumed / Math.max(goal, 1), 1);
  const dash     = circum * progress;
  const animVal  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animVal, { toValue: progress, duration:800, useNativeDriver:false }).start();
  }, [progress]);

  const remaining = Math.max(0, goal - consumed);
  const pct = Math.round(progress * 100);

  return (
    <View style={{ alignItems:'center', justifyContent:'center', width:size, height:size }}>
      <Svg width={size} height={size} style={{ position:'absolute' }}>
        {/* Background track */}
        <Circle cx={size/2} cy={size/2} r={radius}
          stroke={C.border} strokeWidth={stroke} fill="none" />
        {/* Progress arc */}
        <Circle cx={size/2} cy={size/2} r={radius}
          stroke={progress >= 1 ? C.success : C.primary}
          strokeWidth={stroke} fill="none"
          strokeDasharray={`${dash} ${circum - dash}`}
          strokeDashoffset={circum / 4}
          strokeLinecap="round"
        />
      </Svg>
      <View style={{ alignItems:'center' }}>
        <Text style={{ fontSize:28, fontWeight:'800', color:C.text }}>{consumed}g</Text>
        <Text style={{ fontSize:11, color:C.text2 }}>of {goal}g</Text>
        <Text style={{ fontSize:11, color:progress>=1?C.success:C.primary, fontWeight:'700' }}>{pct}%</Text>
      </View>
    </View>
  );
}

// ── Suggestion Card ───────────────────────────────────────────────────────
export function SuggestionCard({ food, onAdd, isPrimary=false, t }) {
  return (
    <TouchableOpacity style={[sc.card, isPrimary && sc.primaryCard]} onPress={onAdd} activeOpacity={0.85}>
      <View style={sc.left}>
        {food.tag && <View style={sc.tag}><Text style={sc.tagTxt}>{food.tag}</Text></View>}
        <Text style={[sc.emoji]}>{food.emoji}</Text>
        <View style={sc.info}>
          <Text style={sc.name} numberOfLines={1}>{food.name}</Text>
          <Text style={sc.protein}>+{food.protein}g protein</Text>
        </View>
      </View>
      <TouchableOpacity style={[sc.addBtn, isPrimary && sc.addBtnPrimary]} onPress={onAdd} activeOpacity={0.8}>
        <Text style={[sc.addTxt, isPrimary && { color:'#07111F' }]}>{t ? t('add') : 'ADD'}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const sc = StyleSheet.create({
  card: { backgroundColor:C.card, borderRadius:R.md, padding:14, flexDirection:'row', alignItems:'center', justifyContent:'space-between', borderWidth:1, borderColor:C.border, marginBottom:8 },
  primaryCard: { borderColor:C.primary+'40', backgroundColor:C.card2 },
  left: { flexDirection:'row', alignItems:'center', flex:1, gap:10 },
  tag: { position:'absolute', top:-18, left:0, backgroundColor:C.primary+'20', borderRadius:R.sm, paddingHorizontal:8, paddingVertical:2 },
  tagTxt: { fontSize:10, color:C.primary, fontWeight:'700' },
  emoji: { fontSize:24 },
  info: { flex:1 },
  name: { fontSize:15, fontWeight:'600', color:C.text, marginBottom:2 },
  protein: { fontSize:12, color:C.primary, fontWeight:'600' },
  addBtn: { backgroundColor:C.border, borderRadius:R.sm, paddingHorizontal:14, paddingVertical:8 },
  addBtnPrimary: { backgroundColor:C.primary },
  addTxt: { fontSize:12, fontWeight:'800', color:C.text },
});

// ── Quick Add Pill ────────────────────────────────────────────────────────
export function QuickAddPill({ item, onAdd }) {
  return (
    <TouchableOpacity style={qa.pill} onPress={onAdd} activeOpacity={0.8}>
      <Text style={qa.emoji}>{item.emoji}</Text>
      <Text style={qa.name}>{item.name}</Text>
      <Text style={qa.protein}>+{item.protein}g</Text>
    </TouchableOpacity>
  );
}

const qa = StyleSheet.create({
  pill: { backgroundColor:C.card, borderRadius:R.md, paddingVertical:12, paddingHorizontal:14, alignItems:'center', minWidth:80, borderWidth:1, borderColor:C.border },
  emoji: { fontSize:20, marginBottom:4 },
  name: { fontSize:12, fontWeight:'600', color:C.text, marginBottom:2 },
  protein: { fontSize:11, color:C.primary, fontWeight:'700' },
});

// ── Macro Pill ────────────────────────────────────────────────────────────
export function MacroPill({ label, value, color }) {
  return (
    <View style={mp.wrap}>
      <Text style={[mp.val, { color }]}>{value}</Text>
      <Text style={mp.label}>{label}</Text>
    </View>
  );
}

const mp = StyleSheet.create({
  wrap: { alignItems:'center', flex:1 },
  val: { fontSize:18, fontWeight:'700' },
  label: { fontSize:11, color:C.text2, marginTop:2 },
});

// ── Section Header ────────────────────────────────────────────────────────
export function SectionHeader({ title, action, onAction }) {
  return (
    <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
      <Text style={{ fontSize:17, fontWeight:'700', color:C.text }}>{title}</Text>
      {action && <TouchableOpacity onPress={onAction}><Text style={{ fontSize:13, color:C.primary, fontWeight:'600' }}>{action}</Text></TouchableOpacity>}
    </View>
  );
}

// ── Primary Button ────────────────────────────────────────────────────────
export function PrimaryBtn({ title, onPress, style, disabled, variant='green' }) {
  const bg = variant==='blue' ? C.secondary : variant==='outline' ? 'transparent' : C.primary;
  const textColor = variant==='outline' ? C.text : '#07111F';
  return (
    <TouchableOpacity style={[pb.btn, { backgroundColor:bg, borderWidth:variant==='outline'?1:0, borderColor:C.border }, disabled&&{opacity:0.5}, style]}
      onPress={onPress} disabled={disabled} activeOpacity={0.85}>
      <Text style={[pb.txt, { color:textColor }]}>{title}</Text>
    </TouchableOpacity>
  );
}

const pb = StyleSheet.create({
  btn: { height:52, borderRadius:R.md, alignItems:'center', justifyContent:'center', paddingHorizontal:20 },
  txt: { fontSize:15, fontWeight:'800', letterSpacing:0.3 },
});

// Names used by the older screens (AddFood, Program, Dashboard).
export const PrimaryButton = PrimaryBtn;
export function SecondaryButton(props) { return <PrimaryBtn variant="outline" {...props} />; }

// ── Screen Header (with back button when there is somewhere to go back to) ──
export function ScreenHeader({ title, subtitle }) {
  const navigation = useNavigation();
  const { back } = useLang();
  const canGoBack  = navigation.canGoBack();
  return (
    <View style={hd.wrap}>
      {canGoBack && (
        <TouchableOpacity onPress={() => navigation.goBack()} style={hd.back} hitSlop={{ top:10, bottom:10, left:10, right:10 }}>
          <Text style={hd.backTxt}>{back}</Text>
        </TouchableOpacity>
      )}
      <View style={{ flex:1 }}>
        <Text style={hd.title}>{title}</Text>
        {subtitle && <Text style={hd.sub}>{subtitle}</Text>}
      </View>
      {canGoBack && <View style={{ width:32 }} />}
    </View>
  );
}

const hd = StyleSheet.create({
  wrap:    { flexDirection:'row', alignItems:'center', paddingHorizontal:16, paddingVertical:12 },
  back:    { width:32 },
  backTxt: { fontSize:30, color:C.text, lineHeight:32 },
  title:   { fontSize:18, fontWeight:'800', color:C.text, textAlign:'center' },
  sub:     { fontSize:12, color:C.text2, textAlign:'center', marginTop:2 },
});

// ── Stat Card ─────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, color }) {
  return (
    <View style={st.card}>
      <Text style={[st.value, { color: color||C.primary }]}>{value}</Text>
      {sub && <Text style={st.sub}>{sub}</Text>}
      <Text style={st.label}>{label}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  card: { backgroundColor:C.card, borderRadius:R.md, padding:14, alignItems:'center', flex:1, borderWidth:1, borderColor:C.border },
  value: { fontSize:20, fontWeight:'800' },
  sub: { fontSize:10, color:C.text3, marginTop:1 },
  label: { fontSize:11, color:C.text2, marginTop:4, textAlign:'center' },
});

// ── Settings Row ──────────────────────────────────────────────────────────
export function SettingsRow({ icon, label, value, onPress, showArrow=true }) {
  const { fwd } = useLang();
  return (
    <TouchableOpacity style={sr.row} onPress={onPress} activeOpacity={onPress?0.7:1}>
      {icon && <Text style={{ fontSize:18, marginRight:12 }}>{icon}</Text>}
      <Text style={sr.label}>{label}</Text>
      <View style={{ marginLeft:'auto', flexDirection:'row', alignItems:'center', gap:6 }}>
        {value && <Text style={sr.value}>{value}</Text>}
        {showArrow && onPress && <Text style={{ color:C.text3, fontSize:16 }}>{fwd}</Text>}
      </View>
    </TouchableOpacity>
  );
}

const sr = StyleSheet.create({
  row: { flexDirection:'row', alignItems:'center', paddingVertical:15, borderBottomWidth:1, borderBottomColor:C.border },
  label: { fontSize:15, color:C.text },
  value: { fontSize:14, color:C.text2 },
});
