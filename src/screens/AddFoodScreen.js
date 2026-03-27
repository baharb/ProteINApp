import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, FOOD_DB, MEAL_OPTIONS } from '../data/constants';
import { useApp } from '../hooks/useApp';
import { ScreenHeader, PrimaryButton } from '../components/UI';

function currentSlot() {
  const h = new Date().getHours();
  if (h < 10) return 0; if (h < 14) return 1; if (h < 19) return 2; return 3;
}

export default function AddFoodScreen({ navigation }) {
  const { addMeal, today, goals } = useApp();
  const [search, setSearch]     = useState('');
  const [qaCal, setQaCal]       = useState('');
  const [qaP, setQaP]           = useState('');
  const [qaC, setQaC]           = useState('');
  const [qaF, setQaF]           = useState('');

  const filtered = search
    ? FOOD_DB.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
    : FOOD_DB.slice(0, 10);

  const proteinLeft = Math.max(0, goals.protein - today.protein);

  function addFood(f) {
    addMeal(f.name, f.cal, f.p, f.c, f.f, currentSlot());
    navigation.navigate('HomeTab');
  }

  function quickAddManual() {
    const cal = parseInt(qaCal)||0, p=parseInt(qaP)||0, c=parseInt(qaC)||0, f=parseInt(qaF)||0;
    if (!cal && !p) return;
    addMeal('Custom Meal', cal, p, c, f, currentSlot());
    setQaCal(''); setQaP(''); setQaC(''); setQaF('');
    navigation.navigate('HomeTab');
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}>
        <ScreenHeader title="Add Food" subtitle="Search or enter manually" />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          {/* Protein remaining */}
          <View style={s.remainingCard}>
            <Text style={s.remainingLabel}>Protein remaining today</Text>
            <Text style={s.remainingVal}>{proteinLeft}g</Text>
          </View>

          {/* Search */}
          <TextInput
            style={s.search}
            value={search}
            onChangeText={setSearch}
            placeholder="Search food database…"
            placeholderTextColor={colors.text3}
          />

          {filtered.map(f => (
            <TouchableOpacity key={f.name} style={s.foodRow} onPress={() => addFood(f)} activeOpacity={0.8}>
              <View style={{flex:1}}>
                <Text style={s.foodName}>{f.name}</Text>
                <Text style={s.foodMacros}>{f.cal} kcal · {f.c}g carbs · {f.f}g fat</Text>
              </View>
              <View style={{alignItems:'flex-end'}}>
                <Text style={s.foodP}>{f.p}g</Text>
                <Text style={s.foodPLabel}>protein</Text>
              </View>
            </TouchableOpacity>
          ))}

          {/* Manual entry */}
          <Text style={s.sectionTitle}>Quick Add (manual)</Text>
          <View style={s.qaGrid}>
            {[['Calories','numeric',qaCal,setQaCal],['Protein (g)','numeric',qaP,setQaP],
              ['Carbs (g)','numeric',qaC,setQaC],['Fat (g)','numeric',qaF,setQaF]].map(([label,kb,val,set]) => (
              <View key={label} style={s.qaField}>
                <Text style={s.qaLabel}>{label}</Text>
                <TextInput style={s.qaInput} value={val} onChangeText={set} keyboardType={kb} placeholderTextColor={colors.text3} placeholder="0" />
              </View>
            ))}
          </View>
          <PrimaryButton title="Add to Today" onPress={quickAddManual} />

          {/* AI Meal Suggestions */}
          <Text style={[s.sectionTitle,{marginTop:20}]}>🤖 Suggested Meals</Text>
          <Text style={s.sectionSub}>You need {proteinLeft}g more protein today</Text>
          {MEAL_OPTIONS.map(opt => (
            <TouchableOpacity key={opt.name} style={s.mealOpt} onPress={() => addFood(opt)} activeOpacity={0.8}>
              <Text style={{fontSize:24,marginRight:12}}>{opt.emoji}</Text>
              <View style={{flex:1}}>
                <Text style={s.mealOptName}>{opt.name}</Text>
                <Text style={s.mealOptDesc}>{opt.desc} · {opt.cal} kcal</Text>
              </View>
              <Text style={s.mealOptP}>{opt.p}g</Text>
            </TouchableOpacity>
          ))}

          <View style={{height:30}} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:colors.bg },
  scroll: { padding:18, paddingTop:8 },
  remainingCard: { backgroundColor:'rgba(126,255,160,0.08)', borderRadius:radius.sm, padding:14, marginBottom:14, flexDirection:'row', justifyContent:'space-between', alignItems:'center', borderWidth:1, borderColor:'rgba(126,255,160,0.2)' },
  remainingLabel: { fontSize:13, color:colors.text2 },
  remainingVal: { fontSize:24, fontWeight:'700', color:colors.accent },
  search: { backgroundColor:colors.card, borderWidth:1, borderColor:colors.border, borderRadius:radius.sm, padding:12, fontSize:14, color:colors.text, marginBottom:12 },
  foodRow: { backgroundColor:colors.card, borderRadius:radius.sm, padding:14, marginBottom:7, flexDirection:'row', alignItems:'center', borderWidth:1, borderColor:colors.border },
  foodName: { fontSize:13, fontWeight:'600', color:colors.text, marginBottom:2 },
  foodMacros: { fontSize:11, color:colors.text2 },
  foodP: { fontSize:18, fontWeight:'700', color:colors.accent },
  foodPLabel: { fontSize:10, color:colors.text2 },
  sectionTitle: { fontSize:16, fontWeight:'700', color:colors.text, marginBottom:4, marginTop:10 },
  sectionSub: { fontSize:12, color:colors.text2, marginBottom:10 },
  qaGrid: { flexDirection:'row', flexWrap:'wrap', gap:10, marginBottom:12 },
  qaField: { width:'47%' },
  qaLabel: { fontSize:11, fontWeight:'700', textTransform:'uppercase', letterSpacing:0.5, color:colors.text2, marginBottom:5 },
  qaInput: { backgroundColor:colors.bg3, borderWidth:1, borderColor:colors.border, borderRadius:8, padding:11, fontSize:15, color:colors.text },
  mealOpt: { backgroundColor:colors.card, borderRadius:radius.sm, padding:14, marginBottom:8, flexDirection:'row', alignItems:'center', borderWidth:1, borderColor:colors.border },
  mealOptName: { fontSize:14, fontWeight:'600', color:colors.text, marginBottom:2 },
  mealOptDesc: { fontSize:11, color:colors.text2 },
  mealOptP: { fontSize:18, fontWeight:'700', color:colors.accent },
});
