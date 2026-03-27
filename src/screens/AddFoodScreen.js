import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, FOOD_DB, MEAL_OPTIONS, GROCERY } from '../data/constants';
import { useApp } from '../hooks/useApp';
import { PrimaryButton, SectionTitle } from '../components/UI';

function currentSlot() {
  const h = new Date().getHours();
  if (h < 10) return 0; if (h < 14) return 1; if (h < 19) return 2; return 3;
}

export default function AddFoodScreen({ navigation }) {
  const { addMeal, today, goals } = useApp();
  const [search, setSearch] = useState('');
  const [qaCal, setQaCal] = useState('');
  const [qaProtein, setQaProtein] = useState('');
  const [qaCarbs, setQaCarbs] = useState('');
  const [qaFat, setQaFat] = useState('');
  const [checked, setChecked] = useState({});

  const filtered = search
    ? FOOD_DB.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
    : FOOD_DB.slice(0, 8);

  const proteinNeeded = Math.max(0, goals.protein - today.protein);

  function addFood(f) {
    addMeal(f.name, f.cal, f.p, f.c, f.f, currentSlot());
    navigation.navigate('HomeTab');
  }

  function quickAddManual() {
    const cal = parseInt(qaCal) || 0;
    const p = parseInt(qaProtein) || 0;
    const c = parseInt(qaCarbs) || 0;
    const f = parseInt(qaFat) || 0;
    if (cal === 0 && p === 0) return;
    addMeal('Custom Meal', cal, p, c, f, currentSlot());
    setQaCal(''); setQaProtein(''); setQaCarbs(''); setQaFat('');
    navigation.navigate('HomeTab');
  }

  function addMealOption(opt) {
    addMeal(opt.name, opt.cal, opt.p, opt.c, opt.f, currentSlot());
    navigation.navigate('HomeTab');
  }

  function toggleCheck(key) {
    setChecked(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function renderGrocerySection(title, items, prefix) {
    return (
      <View style={{ marginBottom: 18 }}>
        <Text style={styles.gcTitle}>{title}</Text>
        {items.map((item, i) => {
          const key = `${prefix}-${i}`;
          return (
            <View key={key} style={styles.gcItem}>
              <View>
                <Text style={styles.gcName}>{item.name}</Text>
                {item.p ? <Text style={styles.gcProtein}>{item.p} protein</Text> : null}
              </View>
              <TouchableOpacity style={[styles.checkbox, checked[key] && styles.checkboxOn]} onPress={() => toggleCheck(key)}>
                {checked[key] && <Text style={{ color: '#0a0a0f', fontSize: 12, fontWeight: '700' }}>✓</Text>}
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Text style={styles.title}>Add Food</Text>
          <Text style={styles.subtitle}>Search, describe, or quick-add</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Search */}
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search food…"
              placeholderTextColor={colors.text3}
            />
            <View style={styles.searchIcon}><Text style={{ fontSize: 18 }}>🔍</Text></View>
          </View>

          {/* Food Results */}
          <View style={{ marginBottom: 16 }}>
            {filtered.map(f => (
              <TouchableOpacity key={f.name} style={styles.foodItem} onPress={() => addFood(f)} activeOpacity={0.8}>
                <View>
                  <Text style={styles.foodName}>{f.name}</Text>
                  <Text style={styles.foodMacros}>{f.cal} kcal · {f.c}g carbs · {f.f}g fat</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.foodProtein}>{f.p}g</Text>
                  <Text style={styles.foodProteinLabel}>protein</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick Add */}
          <View style={styles.qaCard}>
            <Text style={styles.sectionTitleText}>⚡ Quick Add</Text>
            <View style={styles.qaRow}>
              <View style={styles.qaField}>
                <Text style={styles.qaLabel}>Calories</Text>
                <TextInput style={styles.qaInput} value={qaCal} onChangeText={setQaCal} keyboardType="numeric" placeholder="250" placeholderTextColor={colors.text3} />
              </View>
              <View style={styles.qaField}>
                <Text style={styles.qaLabel}>Protein (g)</Text>
                <TextInput style={styles.qaInput} value={qaProtein} onChangeText={setQaProtein} keyboardType="numeric" placeholder="30" placeholderTextColor={colors.text3} />
              </View>
            </View>
            <View style={styles.qaRow}>
              <View style={styles.qaField}>
                <Text style={styles.qaLabel}>Carbs (g)</Text>
                <TextInput style={styles.qaInput} value={qaCarbs} onChangeText={setQaCarbs} keyboardType="numeric" placeholder="20" placeholderTextColor={colors.text3} />
              </View>
              <View style={styles.qaField}>
                <Text style={styles.qaLabel}>Fat (g)</Text>
                <TextInput style={styles.qaInput} value={qaFat} onChangeText={setQaFat} keyboardType="numeric" placeholder="8" placeholderTextColor={colors.text3} />
              </View>
            </View>
            <PrimaryButton title="Add to Today" onPress={quickAddManual} />
          </View>

          {/* AI Meal Builder */}
          <View style={styles.mbSection}>
            <Text style={styles.sectionTitleText}>🤖 AI Meal Builder</Text>
            <Text style={styles.mbSub}>
              You need <Text style={{ color: colors.accent, fontWeight: '700' }}>{proteinNeeded}g</Text> more protein today. Suggested meals:
            </Text>
            {MEAL_OPTIONS.map(opt => (
              <TouchableOpacity key={opt.name} style={styles.mbOption} onPress={() => addMealOption(opt)} activeOpacity={0.8}>
                <View style={styles.mbHead}>
                  <Text style={styles.mbName}>{opt.emoji} {opt.name}</Text>
                  <Text style={styles.mbProtein}>{opt.p}g</Text>
                </View>
                <Text style={styles.mbDesc}>{opt.desc} · {opt.cal} kcal</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Grocery List */}
          <View style={styles.grocerySection}>
            <SectionTitle title="🛒 Smart Grocery List" />
            {renderGrocerySection('High-Protein Foods', GROCERY.protein, 'p')}
            {renderGrocerySection('Complex Carbs', GROCERY.carbs, 'c')}
            {renderGrocerySection('Vegetables', GROCERY.veg, 'v')}
          </View>

          <View style={{ height: 30 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 26, fontWeight: '700', color: colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: colors.text2, marginTop: 2 },
  scroll: { padding: 18, paddingTop: 8 },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, marginBottom: 12, paddingRight: 14 },
  searchInput: { flex: 1, padding: 13, fontSize: 14, color: colors.text },
  searchIcon: { padding: 4 },
  foodItem: { backgroundColor: colors.card, borderRadius: radius.sm, padding: 14, marginBottom: 7, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  foodName: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 3 },
  foodMacros: { fontSize: 11, color: colors.text2 },
  foodProtein: { fontSize: 18, fontWeight: '700', color: colors.accent },
  foodProteinLabel: { fontSize: 10, color: colors.text2 },
  qaCard: { backgroundColor: 'rgba(0,212,255,0.06)', borderRadius: radius.lg, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(0,212,255,0.15)' },
  sectionTitleText: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 14 },
  qaRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  qaField: { flex: 1, gap: 6 },
  qaLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, color: colors.text2 },
  qaInput: { backgroundColor: colors.bg3, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 11, fontSize: 15, color: colors.text },
  mbSection: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: colors.border },
  mbSub: { fontSize: 13, color: colors.text2, marginBottom: 14 },
  mbOption: { backgroundColor: colors.card2, borderRadius: radius.sm, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  mbHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  mbName: { fontSize: 14, fontWeight: '600', color: colors.text },
  mbProtein: { fontSize: 16, fontWeight: '700', color: colors.accent },
  mbDesc: { fontSize: 12, color: colors.text2 },
  grocerySection: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: colors.border },
  gcTitle: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: colors.text2, fontWeight: '600', marginBottom: 10 },
  gcItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.card2, borderRadius: radius.sm, padding: 12, marginBottom: 7 },
  gcName: { fontSize: 13, fontWeight: '500', color: colors.text },
  gcProtein: { fontSize: 11, color: colors.accent, fontWeight: '600', marginTop: 2 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxOn: { backgroundColor: colors.accent, borderColor: colors.accent },
});
