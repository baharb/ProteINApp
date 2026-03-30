import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, MEAL_OPTIONS } from '../data/constants';
import { useApp } from '../hooks/useApp';
import { ScreenHeader, PrimaryButton } from '../components/UI';
import { searchFood } from '../lib/foodApi';

function getSlot() {
  const h = new Date().getHours();
  if (h < 10) return 0; if (h < 14) return 1; if (h < 19) return 2; return 3;
}

export default function AddFoodScreen({ navigation }) {
  const { addMeal, today, goals } = useApp();
  const [query,      setQuery]      = useState('');
  const [results,    setResults]    = useState([]);
  const [searching,  setSearching]  = useState(false);
  const [qaCal, setQaCal] = useState('');
  const [qaP,   setQaP]   = useState('');
  const [qaC,   setQaC]   = useState('');
  const [qaF,   setQaF]   = useState('');

  const proteinLeft = Math.max(0, goals.protein - today.protein);

  const doSearch = useCallback(async (text) => {
    if (text.length < 2) { setResults([]); return; }
    setSearching(true);
    const foods = await searchFood(text, 15);
    setResults(foods);
    setSearching(false);
  }, []);

  function handleQueryChange(text) {
    setQuery(text);
    if (text.length >= 2) doSearch(text);
    else setResults([]);
  }

  async function addFood(f) {
    await addMeal(f.name, f.cal, f.p, f.c, f.f, getSlot());
    navigation.navigate('HomeTab');
  }

  async function quickAddManual() {
    const cal = parseInt(qaCal) || 0, p = parseInt(qaP) || 0;
    if (!cal && !p) return;
    await addMeal('Custom Meal', cal, p, parseInt(qaC)||0, parseInt(qaF)||0, getSlot());
    setQaCal(''); setQaP(''); setQaC(''); setQaF('');
    navigation.navigate('HomeTab');
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScreenHeader title="Add Food" subtitle="2M+ foods from Open Food Facts" />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          {/* Protein remaining */}
          <View style={s.remainCard}>
            <Text style={s.remainLabel}>Protein remaining today</Text>
            <Text style={s.remainVal}>{proteinLeft}g</Text>
          </View>

          {/* Live search */}
          <View style={s.searchRow}>
            <TextInput
              style={s.searchInput}
              value={query}
              onChangeText={handleQueryChange}
              placeholder="Search 2M+ foods (e.g. chicken breast)…"
              placeholderTextColor={colors.text3}
              returnKeyType="search"
              onSubmitEditing={() => doSearch(query)}
            />
            {searching && <ActivityIndicator color={colors.accent} style={{ marginRight: 12 }} />}
          </View>

          {/* Search results */}
          {results.length > 0 && (
            <View style={s.results}>
              {results.map((f, i) => (
                <TouchableOpacity key={i} style={s.foodRow} onPress={() => addFood(f)} activeOpacity={0.8}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.foodName} numberOfLines={1}>{f.name}</Text>
                    <Text style={s.foodMacros}>{f.cal} kcal · {f.c}g carbs · {f.f}g fat · {f.per}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={s.foodP}>{f.p}g</Text>
                    <Text style={s.foodPLabel}>protein</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {query.length >= 2 && results.length === 0 && !searching && (
            <Text style={s.noResults}>No results found. Try a different term.</Text>
          )}

          {/* Manual entry */}
          <Text style={s.sectionTitle}>⚡ Quick Add</Text>
          <View style={s.qaGrid}>
            {[['Calories', qaCal, setQaCal], ['Protein (g)', qaP, setQaP],
              ['Carbs (g)', qaC, setQaC],   ['Fat (g)',     qaF, setQaF]].map(([label, val, set]) => (
              <View key={label} style={s.qaField}>
                <Text style={s.qaLabel}>{label}</Text>
                <TextInput style={s.qaInput} value={val} onChangeText={set} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.text3} />
              </View>
            ))}
          </View>
          <PrimaryButton title="Add Custom Meal" onPress={quickAddManual} />

          {/* AI Suggestions */}
          <Text style={[s.sectionTitle, { marginTop: 20 }]}>🤖 Suggested High-Protein Meals</Text>
          <Text style={s.sectionSub}>You need {proteinLeft}g more protein today</Text>
          {MEAL_OPTIONS.map(opt => (
            <TouchableOpacity key={opt.name} style={s.mealOpt} onPress={() => addFood(opt)} activeOpacity={0.8}>
              <Text style={{ fontSize: 24, marginRight: 12 }}>{opt.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.mealOptName}>{opt.name}</Text>
                <Text style={s.mealOptDesc}>{opt.desc} · {opt.cal} kcal</Text>
              </View>
              <Text style={s.mealOptP}>{opt.p}g</Text>
            </TouchableOpacity>
          ))}

          <View style={{ height: 30 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 18, paddingTop: 8 },
  remainCard: { backgroundColor: 'rgba(126,255,160,0.08)', borderRadius: radius.sm, padding: 14, marginBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(126,255,160,0.2)' },
  remainLabel: { fontSize: 13, color: colors.text2 },
  remainVal: { fontSize: 24, fontWeight: '700', color: colors.accent },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, marginBottom: 8 },
  searchInput: { flex: 1, padding: 13, fontSize: 14, color: colors.text },
  results: { marginBottom: 14 },
  foodRow: { backgroundColor: colors.card, borderRadius: radius.sm, padding: 14, marginBottom: 7, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  foodName: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 2 },
  foodMacros: { fontSize: 11, color: colors.text2 },
  foodP: { fontSize: 18, fontWeight: '700', color: colors.accent },
  foodPLabel: { fontSize: 10, color: colors.text2 },
  noResults: { color: colors.text2, fontSize: 13, textAlign: 'center', padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4, marginTop: 10 },
  sectionSub: { fontSize: 12, color: colors.text2, marginBottom: 10 },
  qaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  qaField: { width: '47%' },
  qaLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, color: colors.text2, marginBottom: 5 },
  qaInput: { backgroundColor: colors.bg3, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 11, fontSize: 15, color: colors.text },
  mealOpt: { backgroundColor: colors.card, borderRadius: radius.sm, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  mealOptName: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 2 },
  mealOptDesc: { fontSize: 11, color: colors.text2 },
  mealOptP: { fontSize: 18, fontWeight: '700', color: colors.accent },
});
