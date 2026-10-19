import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, useWindowDimensions, Modal, Alert } from 'react-native';
import { Text, TextInput } from '../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, TIPS } from '../data/constants';
import { useApp } from '../hooks/useApp';
import { MacroBar, ProteinStatusBadge, TipCard, PrimaryButton, SecondaryButton } from '../components/UI';

const TIP = TIPS[Math.floor(Math.random() * TIPS.length)];
const SLOTS = [
  { name:'Breakfast', icon:'🌅', slot:0 },
  { name:'Lunch',     icon:'☀️',  slot:1 },
  { name:'Dinner',    icon:'🌙',  slot:2 },
  { name:'Snack',     icon:'🍎',  slot:3 },
];

// Fix #4 — edit meal amount modal
function EditMealModal({ meal, mealIndex, onSave, onDelete, onClose }) {
  // We store the meal's original per-100g or per-unit data
  // Since meals are logged with absolute values, we let user re-enter a multiplier
  // by showing current macros and letting them scale by percentage or grams
  const [multiplier, setMultiplier] = useState('100'); // 100 = keep same, 50 = halve, 200 = double
  const pct = parseFloat(multiplier) || 100;
  const factor = pct / 100;

  const newMacros = {
    cal: Math.round(meal.cal * factor),
    p:   Math.round(meal.p   * factor),
    c:   Math.round(meal.c   * factor),
    f:   Math.round(meal.f   * factor),
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={em.overlay}>
        <View style={em.sheet}>
          <View style={em.handle} />
          <Text style={em.title} numberOfLines={2}>{meal.name}</Text>
          <Text style={em.sub}>Original: {meal.p}g protein · {meal.cal} kcal</Text>

          <Text style={em.label}>Adjust amount (%)</Text>
          <Text style={em.hint}>100% = same amount · 50% = half · 200% = double</Text>
          <View style={em.presetsRow}>
            {['25','50','75','100','150','200'].map(p => (
              <TouchableOpacity key={p} style={[em.preset, multiplier===p && em.presetOn]} onPress={() => setMultiplier(p)}>
                <Text style={[em.presetTxt, multiplier===p && { color:colors.accent }]}>{p}%</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput style={em.input} value={multiplier} onChangeText={setMultiplier}
            keyboardType="numeric" placeholder="Custom %" placeholderTextColor={colors.text3}
            selectTextOnFocus />

          <View style={em.preview}>
            <Text style={em.previewTitle}>Updated macros ({multiplier}%):</Text>
            <View style={em.previewRow}>
              {[
                { l:'Calories', v:`${newMacros.cal}`, c:colors.text    },
                { l:'Protein',  v:`${newMacros.p}g`,  c:colors.accent  },
                { l:'Carbs',    v:`${newMacros.c}g`,  c:colors.accent3 },
                { l:'Fat',      v:`${newMacros.f}g`,  c:colors.orange  },
              ].map(m => (
                <View key={m.l} style={em.previewItem}>
                  <Text style={[em.previewVal, { color:m.c }]}>{m.v}</Text>
                  <Text style={em.previewLabel}>{m.l}</Text>
                </View>
              ))}
            </View>
          </View>

          <PrimaryButton title="Save Changes" onPress={() => onSave(mealIndex, newMacros, pct)} style={{ marginTop:12 }} />
          <TouchableOpacity style={em.deleteBtn} onPress={() => onDelete(mealIndex)}>
            <Text style={em.deleteTxt}>🗑 Remove this meal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ padding:12, alignItems:'center' }} onPress={onClose}>
            <Text style={{ color:colors.text2 }}>Cancel</Text>
          </TouchableOpacity>
          <View style={{ height:10 }} />
        </View>
      </View>
    </Modal>
  );
}

const em = StyleSheet.create({
  overlay: { flex:1, backgroundColor:'rgba(0,0,0,0.75)', justifyContent:'flex-end' },
  sheet: { backgroundColor:colors.bg2, borderTopLeftRadius:24, borderTopRightRadius:24, padding:20 },
  handle: { width:40, height:4, backgroundColor:colors.border, borderRadius:2, alignSelf:'center', marginBottom:16 },
  title: { fontSize:17, fontWeight:'700', color:colors.text, marginBottom:4 },
  sub: { fontSize:12, color:colors.text2, marginBottom:16 },
  label: { fontSize:11, fontWeight:'700', textTransform:'uppercase', letterSpacing:1, color:colors.text2, marginBottom:4 },
  hint: { fontSize:11, color:colors.text3, marginBottom:8 },
  presetsRow: { flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:10 },
  preset: { backgroundColor:colors.card, borderRadius:8, paddingHorizontal:14, paddingVertical:8, borderWidth:1, borderColor:colors.border },
  presetOn: { borderColor:colors.accent, backgroundColor:'rgba(126,255,160,0.1)' },
  presetTxt: { fontSize:12, fontWeight:'600', color:colors.text2 },
  input: { backgroundColor:colors.card, borderWidth:1, borderColor:colors.border, borderRadius:radius.sm, padding:12, fontSize:16, color:colors.text, textAlign:'center', marginBottom:12 },
  preview: { backgroundColor:colors.card, borderRadius:radius.sm, padding:14, marginBottom:4 },
  previewTitle: { fontSize:11, color:colors.text2, marginBottom:10, fontWeight:'600' },
  previewRow: { flexDirection:'row', justifyContent:'space-between' },
  previewItem: { alignItems:'center', flex:1 },
  previewVal: { fontSize:18, fontWeight:'700' },
  previewLabel: { fontSize:10, color:colors.text2, marginTop:2 },
  deleteBtn: { alignItems:'center', padding:12, marginTop:4 },
  deleteTxt: { color:colors.orange, fontSize:14, fontWeight:'600' },
});

export default function DashboardScreen({ navigation }) {
  const { today, goals, removeMeal, updateMeal } = useApp();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const [editingMeal, setEditingMeal] = useState(null); // { meal, index }

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const dateStr  = new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' });
  const pPct     = goals.protein  > 0 ? Math.min(100, today.protein  / goals.protein  * 100) : 0;
  const cPct     = goals.calories > 0 ? Math.min(100, today.calories / goals.calories * 100) : 0;
  const score    = Math.round(pPct * 0.6 + cPct * 0.4);
  const emoji    = score >= 80 ? '🏆' : score >= 60 ? '💪' : score >= 30 ? '🔥' : '🌱';

  function handleEditMeal(meal, index) {
    setEditingMeal({ meal, index });
  }

  function handleSaveMeal(index, newMacros, pct) {
    updateMeal(index, newMacros);
    setEditingMeal(null);
  }

  function handleDeleteMeal(index) {
    removeMeal(index);
    setEditingMeal(null);
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.scroll, isLandscape && s.scrollL]}>

        <View style={s.header}>
          <View style={{ flex:1 }}>
            <Text style={s.greeting}>{greeting} 👋</Text>
            <Text style={s.date}>{dateStr}</Text>
          </View>
          <TouchableOpacity style={s.coachBtn} onPress={() => navigation.navigate('Coach')} activeOpacity={0.8}>
            <Text style={{ fontSize:22 }}>🤖</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.scoreCard} onPress={() => navigation.navigate('Coach')} activeOpacity={0.9}>
          <View>
            <Text style={s.scoreLabel}>Today's Score</Text>
            <Text style={s.scoreVal}>{score}<Text style={s.scoreMax}>/100</Text></Text>
            <ProteinStatusBadge today={today} goals={goals} />
          </View>
          <Text style={{ fontSize:56 }}>{emoji}</Text>
        </TouchableOpacity>

        {isLandscape ? (
          <View style={s.macroRow4}>
            <MacroBar label="Protein"  icon="💪" value={today.protein}  target={goals.protein}  color={colors.accent}  />
            <MacroBar label="Calories" icon="🔥" value={today.calories} target={goals.calories} color={colors.orange} unit="" />
            <MacroBar label="Carbs"    icon="🌾" value={today.carbs}    target={goals.carbs}    color={colors.accent3} />
            <MacroBar label="Fat"      icon="🥑" value={today.fat}      target={goals.fat}      color={colors.pink}    />
          </View>
        ) : (
          <>
            <View style={s.macroRow}>
              <MacroBar label="Protein"  icon="💪" value={today.protein}  target={goals.protein}  color={colors.accent}  />
              <MacroBar label="Calories" icon="🔥" value={today.calories} target={goals.calories} color={colors.orange} unit="" />
            </View>
            <View style={s.macroRow}>
              <MacroBar label="Carbs" icon="🌾" value={today.carbs} target={goals.carbs} color={colors.accent3} />
              <MacroBar label="Fat"   icon="🥑" value={today.fat}   target={goals.fat}   color={colors.pink}    />
            </View>
          </>
        )}

        <View style={s.actions}>
          {[
            { emoji:'📷', label:'Scan Meal', nav:'ScanTab'  },
            { emoji:'➕', label:'Add Food',  nav:'AddTab'   },
            { emoji:'🤖', label:'AI Coach',  nav:'Coach'    },
          ].map(a => (
            <TouchableOpacity key={a.label} style={s.actionBtn}
              onPress={() => navigation.navigate(a.nav)} activeOpacity={0.85}>
              <Text style={{ fontSize:24 }}>{a.emoji}</Text>
              <Text style={s.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.sectionTitle}>Today's Meals</Text>
        {today.meals.length === 0 ? (
          <View style={s.empty}>
            <Text style={{ fontSize:36, marginBottom:8 }}>🍽️</Text>
            <Text style={s.emptyTxt}>No meals logged yet</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ScanTab')} style={s.emptyBtn}>
              <Text style={s.emptyBtnTxt}>Scan your first meal →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          today.meals.map((m, i) => {
            const slot = SLOTS.find(sl => sl.slot === m.slot) || SLOTS[0];
            return (
              // Fix #4 — tap meal to edit amount
              <TouchableOpacity key={i} style={s.mealRow} onPress={() => handleEditMeal(m, i)} activeOpacity={0.8}>
                <Text style={{ fontSize:18, marginRight:10 }}>{slot.icon}</Text>
                <View style={{ flex:1 }}>
                  <Text style={s.mealName} numberOfLines={1}>{m.name}</Text>
                  <Text style={s.mealMacros}>{m.p}g protein · {m.cal} kcal · {m.c}g carbs · {m.f}g fat</Text>
                </View>
                <Text style={s.editHint}>✏️</Text>
              </TouchableOpacity>
            );
          })
        )}

        <TipCard tip={TIP} />
        <View style={{ height:20 }} />
      </ScrollView>

      {editingMeal && (
        <EditMealModal
          meal={editingMeal.meal}
          mealIndex={editingMeal.index}
          onSave={handleSaveMeal}
          onDelete={handleDeleteMeal}
          onClose={() => setEditingMeal(null)}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:colors.bg },
  scroll: { padding:18, paddingTop:10 },
  scrollL: { paddingHorizontal:40 },
  header: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:16 },
  greeting: { fontSize:22, fontWeight:'700', color:colors.text, letterSpacing:-0.5 },
  date: { fontSize:12, color:colors.text2, marginTop:2 },
  coachBtn: { width:44, height:44, backgroundColor:colors.card, borderRadius:22, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:colors.border },
  scoreCard: { backgroundColor:'#0f1a20', borderRadius:radius.lg, padding:18, marginBottom:12, flexDirection:'row', justifyContent:'space-between', alignItems:'center', borderWidth:1, borderColor:'rgba(0,212,255,0.2)' },
  scoreLabel: { fontSize:11, color:colors.text2, textTransform:'uppercase', letterSpacing:1, marginBottom:4 },
  scoreVal: { fontSize:44, fontWeight:'700', color:colors.accent3, marginBottom:8 },
  scoreMax: { fontSize:16, color:colors.text2, fontWeight:'400' },
  macroRow: { flexDirection:'row', gap:10, marginBottom:10 },
  macroRow4: { flexDirection:'row', gap:8, marginBottom:10 },
  actions: { flexDirection:'row', gap:10, marginBottom:18 },
  actionBtn: { flex:1, backgroundColor:colors.card, borderRadius:radius.sm, paddingVertical:14, alignItems:'center', gap:4, borderWidth:1, borderColor:colors.border },
  actionLabel: { fontSize:11, color:colors.text2, fontWeight:'600' },
  sectionTitle: { fontSize:16, fontWeight:'700', color:colors.text, marginBottom:10 },
  empty: { backgroundColor:colors.card, borderRadius:radius.lg, padding:28, alignItems:'center', marginBottom:12, borderWidth:1, borderColor:colors.border },
  emptyTxt: { fontSize:14, color:colors.text2, marginBottom:12 },
  emptyBtn: { backgroundColor:'rgba(126,255,160,0.12)', borderRadius:radius.sm, paddingHorizontal:16, paddingVertical:8 },
  emptyBtnTxt: { color:colors.accent, fontWeight:'600', fontSize:13 },
  mealRow: { backgroundColor:colors.card, borderRadius:radius.sm, padding:14, marginBottom:8, flexDirection:'row', alignItems:'center', borderWidth:1, borderColor:colors.border },
  mealName: { fontSize:13, fontWeight:'600', color:colors.text, marginBottom:2 },
  mealMacros: { fontSize:11, color:colors.text2 },
  editHint: { fontSize:14, color:colors.text3, paddingLeft:8 },
});
