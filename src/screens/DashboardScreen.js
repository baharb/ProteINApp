import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, TIPS } from '../data/constants';
import { useApp } from '../hooks/useApp';
import { MacroBar, ProteinStatusBadge, TipCard } from '../components/UI';

const TIP = TIPS[Math.floor(Math.random() * TIPS.length)];
const SLOTS = [
  { name: 'Breakfast', icon: '🌅', slot: 0 },
  { name: 'Lunch',     icon: '☀️',  slot: 1 },
  { name: 'Dinner',    icon: '🌙',  slot: 2 },
  { name: 'Snack',     icon: '🍎',  slot: 3 },
];

export default function DashboardScreen({ navigation }) {
  const { today, goals, removeMeal } = useApp();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const dateStr = new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' });

  const pPct  = goals.protein  > 0 ? Math.min(100, today.protein  / goals.protein  * 100) : 0;
  const cPct  = goals.calories > 0 ? Math.min(100, today.calories / goals.calories * 100) : 0;
  const score = Math.round(pPct * 0.6 + cPct * 0.4);

  const scoreEmoji = score >= 80 ? '🏆' : score >= 60 ? '💪' : score >= 30 ? '🔥' : '🌱';

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>{greeting} 👋</Text>
            <Text style={s.date}>{dateStr}</Text>
          </View>
          <TouchableOpacity style={s.coachBtn} onPress={() => navigation.navigate('Coach')} activeOpacity={0.8}>
            <Text style={{fontSize:22}}>🤖</Text>
          </TouchableOpacity>
        </View>

        {/* Score card */}
        <View style={s.scoreCard}>
          <View>
            <Text style={s.scoreLabel}>Today's Score</Text>
            <Text style={s.scoreValue}>{score}<Text style={s.scoreMax}>/100</Text></Text>
            <ProteinStatusBadge today={today} goals={goals} />
          </View>
          <Text style={{fontSize:56}}>{scoreEmoji}</Text>
        </View>

        {/* Macros */}
        <View style={s.macroRow}>
          <MacroBar label="Protein" icon="💪" value={today.protein} target={goals.protein} color={colors.accent} />
          <MacroBar label="Calories" icon="🔥" value={today.calories} target={goals.calories} unit="" color={colors.orange} />
        </View>
        <View style={s.macroRow}>
          <MacroBar label="Carbs" icon="🌾" value={today.carbs} target={goals.carbs} color={colors.accent3} />
          <MacroBar label="Fat"   icon="🥑" value={today.fat}   target={goals.fat}   color={colors.pink} />
        </View>

        {/* Quick actions */}
        <View style={s.actionRow}>
          <TouchableOpacity style={s.actionBtn} onPress={() => navigation.navigate('ScanTab')} activeOpacity={0.85}>
            <Text style={{fontSize:24}}>📷</Text>
            <Text style={s.actionText}>Scan</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBtn} onPress={() => navigation.navigate('AddTab')} activeOpacity={0.85}>
            <Text style={{fontSize:24}}>➕</Text>
            <Text style={s.actionText}>Add Food</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBtn} onPress={() => navigation.navigate('Coach')} activeOpacity={0.85}>
            <Text style={{fontSize:24}}>🤖</Text>
            <Text style={s.actionText}>AI Coach</Text>
          </TouchableOpacity>
        </View>

        {/* Meals */}
        <Text style={s.sectionTitle}>Today's Meals</Text>
        {today.meals.length === 0 ? (
          <View style={s.emptyMeals}>
            <Text style={s.emptyEmoji}>🍽️</Text>
            <Text style={s.emptyText}>No meals logged yet</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ScanTab')} style={s.emptyBtn}>
              <Text style={s.emptyBtnText}>Scan your first meal →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          today.meals.map((m, i) => {
            const slot = SLOTS.find(sl => sl.slot === m.slot) || SLOTS[0];
            return (
              <View key={i} style={s.mealRow}>
                <Text style={{fontSize:18, marginRight:10}}>{slot.icon}</Text>
                <View style={{flex:1}}>
                  <Text style={s.mealName}>{m.name}</Text>
                  <Text style={s.mealMacros}>{m.p}g protein · {m.cal} kcal</Text>
                </View>
                <TouchableOpacity onPress={() => removeMeal(i)} style={s.removeBtn}>
                  <Text style={{color:colors.text3, fontSize:18}}>×</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}

        <TipCard tip={TIP} />
        <View style={{height:20}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:colors.bg },
  scroll: { padding:18, paddingTop:10 },
  header: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:16 },
  greeting: { fontSize:22, fontWeight:'700', color:colors.text, letterSpacing:-0.5 },
  date: { fontSize:12, color:colors.text2, marginTop:2 },
  coachBtn: { width:44, height:44, backgroundColor:colors.card, borderRadius:22, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:colors.border },
  scoreCard: { backgroundColor:'#0f1a20', borderRadius:radius.lg, padding:18, marginBottom:12, flexDirection:'row', justifyContent:'space-between', alignItems:'center', borderWidth:1, borderColor:'rgba(0,212,255,0.2)' },
  scoreLabel: { fontSize:11, color:colors.text2, textTransform:'uppercase', letterSpacing:1, marginBottom:4 },
  scoreValue: { fontSize:44, fontWeight:'700', color:colors.accent3, marginBottom:8 },
  scoreMax: { fontSize:16, color:colors.text2, fontWeight:'400' },
  macroRow: { flexDirection:'row', gap:10, marginBottom:10 },
  actionRow: { flexDirection:'row', gap:10, marginBottom:18 },
  actionBtn: { flex:1, backgroundColor:colors.card, borderRadius:radius.sm, paddingVertical:14, alignItems:'center', gap:4, borderWidth:1, borderColor:colors.border },
  actionText: { fontSize:11, color:colors.text2, fontWeight:'600' },
  sectionTitle: { fontSize:16, fontWeight:'700', color:colors.text, marginBottom:10 },
  emptyMeals: { backgroundColor:colors.card, borderRadius:radius.lg, padding:28, alignItems:'center', marginBottom:12, borderWidth:1, borderColor:colors.border },
  emptyEmoji: { fontSize:40, marginBottom:8 },
  emptyText: { fontSize:14, color:colors.text2, marginBottom:12 },
  emptyBtn: { backgroundColor:'rgba(126,255,160,0.12)', borderRadius:radius.sm, paddingHorizontal:16, paddingVertical:8 },
  emptyBtnText: { color:colors.accent, fontWeight:'600', fontSize:13 },
  mealRow: { backgroundColor:colors.card, borderRadius:radius.sm, padding:14, marginBottom:8, flexDirection:'row', alignItems:'center', borderWidth:1, borderColor:colors.border },
  mealName: { fontSize:13, fontWeight:'600', color:colors.text, marginBottom:2 },
  mealMacros: { fontSize:11, color:colors.text2 },
  removeBtn: { padding:4, paddingLeft:12 },
});
