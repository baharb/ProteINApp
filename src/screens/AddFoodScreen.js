import React, { useState, useCallback, useRef } from 'react';
import { View, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Modal, Alert, useWindowDimensions } from 'react-native';
import { Text, TextInput } from '../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, MEAL_OPTIONS } from '../data/constants';
import { useApp } from '../hooks/useApp';
import { useLang } from '../hooks/useLang';
import { getSlot } from '../data/theme';
import { ScreenHeader, PrimaryButton, SecondaryButton } from '../components/UI';
import { searchFood } from '../lib/foodApi';
import { searchLocalDB } from '../data/nutritionDB';


// ── Serving size picker modal ─────────────────────────────────────────────
function ServingModal({ food, onAdd, onClose }) {
  const { t } = useLang();
  const [grams, setGrams] = useState('100');
  const PRESETS = ['50','100','150','200','250','300'];
  const g = parseFloat(grams) || 0;
  const factor = g / 100;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={ms.overlay}>
        <View style={ms.sheet}>
          <View style={ms.handle} />
          <Text style={ms.title} numberOfLines={2}>{food.name}</Text>
          <Text style={ms.sub}>{t('per100')}</Text>
          <View style={ms.macroRow}>
            {[{v:food.cal,l:t('kcal'),c:colors.text},{v:food.p+'g',l:t('protein'),c:colors.accent},{v:food.c+'g',l:t('carbs'),c:colors.accent3},{v:food.f+'g',l:t('fat'),c:colors.orange}].map(m => (
              <View key={m.l} style={ms.macroBox}>
                <Text style={[ms.macroVal,{color:m.c}]}>{m.v}</Text>
                <Text style={ms.macroLabel}>{m.l}</Text>
              </View>
            ))}
          </View>
          <Text style={ms.servingLabel}>{t('servingSize')}</Text>
          <View style={ms.presetRow}>
            {PRESETS.map(p => (
              <TouchableOpacity key={p} style={[ms.preset, grams===p && ms.presetOn]} onPress={() => setGrams(p)}>
                <Text style={[ms.presetTxt, grams===p && {color:colors.accent}]}>{p}g</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput style={ms.gramInput} value={grams} onChangeText={setGrams} keyboardType="numeric" placeholder={t('customGrams')} placeholderTextColor={colors.text3} selectTextOnFocus />
          {g > 0 && (
            <View style={ms.calcCard}>
              <Text style={ms.calcTitle}>For {grams}g:</Text>
              <View style={ms.calcRow}>
                {[
                  {l:t('calories'),v:Math.round(food.cal*factor),unit:'',c:colors.text},
                  {l:t('protein'), v:Math.round(food.p*factor),  unit:'g',   c:colors.accent},
                  {l:t('carbs'),   v:Math.round(food.c*factor),  unit:'g',   c:colors.accent3},
                  {l:t('fat'),     v:Math.round(food.f*factor),  unit:'g',   c:colors.orange},
                ].map(m => (
                  <View key={m.l} style={ms.calcItem}>
                    <Text style={[ms.calcVal,{color:m.c}]}>{m.v}{m.unit}</Text>
                    <Text style={ms.calcLabel}>{m.l}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          <PrimaryButton title={t('addToToday', { n: grams })} onPress={() => { if (!g) return; onAdd(food, g); }} style={{ marginTop:16 }} />
          <SecondaryButton title={t('cancel')} onPress={onClose} style={{ marginTop:8 }} />
        </View>
      </View>
    </Modal>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────
export default function AddFoodScreen({ navigation }) {
  const { addMeal, today, goals } = useApp();
  const { t } = useLang();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const [query,        setQuery]        = useState('');
  const [results,      setResults]      = useState([]);
  const [searching,    setSearching]    = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [tab,          setTab]          = useState('search');
  // Manual
  const [manualName,   setManualName]   = useState('');
  const [manualGrams,  setManualGrams]  = useState('100');
  const [manualFood,   setManualFood]   = useState(null);
  const [manualSearch, setManualSearch] = useState('');
  const [manualDropdown, setManualDropdown] = useState([]);
  // Build meal
  const [ingredients,  setIngredients]  = useState([]);
  const [ingQuery,     setIngQuery]     = useState('');
  const [ingDropdown,  setIngDropdown]  = useState([]);
  // Added items notification
  const [recentAdded,  setRecentAdded]  = useState([]);

  const searchTimeout = useRef(null);
  const proteinLeft = Math.max(0, goals.protein - today.protein);

  // Live search with debounce
  const doSearch = useCallback(async (text) => {
    if (text.length < 2) { setResults([]); return; }
    setSearching(true);
    const foods = await searchFood(text, 20);
    setResults(foods);
    setSearching(false);
  }, []);

  function handleQueryChange(text) {
    setQuery(text);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => doSearch(text), 400);
  }

  // Fix #5 — dropdown search for manual/build meal
  function handleManualSearch(text) {
    setManualSearch(text);
    setManualFood(null);
    if (text.length >= 1) {
      setManualDropdown(searchLocalDB(text).slice(0, 8));
    } else {
      setManualDropdown([]);
    }
  }

  function handleIngQuery(text) {
    setIngQuery(text);
    if (text.length >= 1) {
      setIngDropdown(searchLocalDB(text).slice(0, 8));
    } else {
      setIngDropdown([]);
    }
  }

  async function handleAddWithServing(food, grams) {
    const factor = grams / 100;
    const name = `${food.name} (${grams}g)`;
    await addMeal(name, Math.round(food.cal*factor), Math.round(food.p*factor), Math.round(food.c*factor), Math.round(food.f*factor), getSlot());
    // Fix #7 — show added item at top instead of popup
    setRecentAdded(prev => [{ name, p: Math.round(food.p*factor), cal: Math.round(food.cal*factor) }, ...prev].slice(0, 3));
    setSelectedFood(null);
    setQuery('');
    setResults([]);
  }

  // Manual tab: user picks food + grams → app calculates
  async function addManualFood() {
    if (!manualFood) { Alert.alert(t('selectFood'), t('selectFoodSub')); return; }
    const g = parseFloat(manualGrams) || 100;
    const factor = g / 100;
    const name = `${manualFood.name} (${g}g)`;
    await addMeal(name, Math.round(manualFood.cal*factor), Math.round(manualFood.p*factor), Math.round(manualFood.c*factor), Math.round(manualFood.f*factor), getSlot());
    setRecentAdded(prev => [{ name, p: Math.round(manualFood.p*factor), cal: Math.round(manualFood.cal*factor) }, ...prev].slice(0, 3));
    setManualFood(null); setManualSearch(''); setManualGrams('100');
  }

  function selectManualFood(food) {
    setManualFood(food);
    setManualSearch(food.name);
    setManualDropdown([]);
  }

  // Build meal tab
  function selectIngredient(food) {
    setIngredients(prev => [...prev, { ...food, grams: 100 }]);
    setIngQuery('');
    setIngDropdown([]);
  }

  function updateIngGrams(i, g) {
    setIngredients(prev => prev.map((ing, idx) => idx===i ? {...ing, grams: parseFloat(g)||0} : ing));
  }

  function removeIng(i) { setIngredients(prev => prev.filter((_,idx) => idx!==i)); }

  async function addAllIngredients() {
    if (!ingredients.length) return;
    let tCal=0, tP=0, tC=0, tF=0;
    ingredients.forEach(ing => { const f=ing.grams/100; tCal+=ing.cal*f; tP+=ing.p*f; tC+=ing.c*f; tF+=ing.f*f; });
    const name = ingredients.map(i=>i.name.split(' ')[0]).join('+');
    await addMeal(name, tCal, tP, tC, tF, getSlot());
    setRecentAdded(prev => [{ name, p: Math.round(tP), cal: Math.round(tCal) }, ...prev].slice(0, 3));
    setIngredients([]);
    navigation.goBack();
  }

  // Computed ingredient totals
  const ingTotals = ingredients.reduce((acc, ing) => {
    const f = ing.grams/100;
    return { cal: acc.cal+ing.cal*f, p: acc.p+ing.p*f, c: acc.c+ing.c*f, f: acc.f+ing.f*f };
  }, { cal:0, p:0, c:0, f:0 });

  // Manual food calculated macros
  const manualG = parseFloat(manualGrams) || 0;
  const manualCalc = manualFood && manualG > 0 ? {
    cal: Math.round(manualFood.cal * manualG/100),
    p:   Math.round(manualFood.p   * manualG/100),
    c:   Math.round(manualFood.c   * manualG/100),
    f:   Math.round(manualFood.f   * manualG/100),
  } : null;

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}>
        <ScreenHeader title={t('addFood')} />

        {/* Today summary */}
        <View style={[s.todaySummary, isLandscape && s.todaySummaryLandscape]}>
          {[
            { val:`${today.protein}g`, label:t('protein'), color:colors.accent },
            { val:`${today.calories}`, label:t('calories'), color:colors.orange },
            { val:`${proteinLeft}g`,   label:t('left'),     color:colors.text2 },
            { val:`${today.meals.length}`, label:t('meals'), color:colors.accent3 },
          ].map(item => (
            <View key={item.label} style={s.summaryItem}>
              <Text style={[s.summaryVal,{color:item.color}]}>{item.val}</Text>
              <Text style={s.summaryLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Fix #7 — recently added items shown at top */}
        {recentAdded.length > 0 && (
          <View style={s.recentWrap}>
            <Text style={s.recentTitle}>{t('recentlyAdded')}</Text>
            {recentAdded.map((item, i) => (
              <View key={i} style={s.recentItem}>
                <Text style={s.recentName} numberOfLines={1}>{item.name}</Text>
                <Text style={s.recentMacros}>{t('proteinKcal', { p: item.p, c: item.cal })}</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={s.viewTodayBtn}>
                  <Text style={s.viewTodayTxt}>{t('viewToday')}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Tabs */}
        <View style={s.tabs}>
          {[['search',t('tabSearch')],['manual',t('tabManual')],['ingredients',t('tabBuild')]].map(([key,label]) => (
            <TouchableOpacity key={key} style={[s.tab, tab===key && s.tabOn]} onPress={() => setTab(key)}>
              <Text style={[s.tabTxt, tab===key && {color:colors.accent}]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.scroll, isLandscape && s.scrollLandscape]} keyboardShouldPersistTaps="handled">

          {/* ── SEARCH TAB ── */}
          {tab === 'search' && (
            <>
              <View style={s.searchRow}>
                <TextInput style={s.searchInput} value={query} onChangeText={handleQueryChange}
                  placeholder={t('searchPh')}
                  placeholderTextColor={colors.text3} returnKeyType="search"
                  onSubmitEditing={() => doSearch(query)} />
                {searching && <ActivityIndicator color={colors.accent} style={{marginRight:10}} />}
              </View>
              {results.map((f,i) => (
                <TouchableOpacity key={i} style={s.foodRow} onPress={() => setSelectedFood(f)} activeOpacity={0.8}>
                  <View style={{flex:1}}>
                    <Text style={s.foodName} numberOfLines={2}>{f.name}</Text>
                    <Text style={s.foodMacros}>{t('proteinPer100', { p: f.p, c: f.cal })}</Text>
                    {f.source === 'local' && <Text style={s.sourceTag}>{t('builtIn')}</Text>}
                  </View>
                  <View style={s.addPill}><Text style={s.addPillTxt}>{t('add')}</Text></View>
                </TouchableOpacity>
              ))}
              {query.length >= 2 && results.length === 0 && !searching && (
                <View style={s.noResults}>
                  <Text style={s.noResultsTxt}>{t('noResults', { q: query })}</Text>
                  <Text style={s.noResultsSub}>{t('noResultsSub')}</Text>
                </View>
              )}
              {results.length === 0 && query.length === 0 && (
                <>
                  <Text style={s.sectionTitle}>{t('suggestedMeals')}</Text>
                  <Text style={s.sectionSub}>{t('needMore', { n: proteinLeft })}</Text>
                  {MEAL_OPTIONS.map(opt => (
                    <TouchableOpacity key={opt.name} style={s.mealOpt} onPress={() => setSelectedFood({...opt, per:'1 serving'})} activeOpacity={0.8}>
                      <Text style={{fontSize:22,marginRight:10}}>{opt.emoji}</Text>
                      <View style={{flex:1}}>
                        <Text style={s.mealOptName}>{opt.name}</Text>
                        <Text style={s.mealOptDesc}>{opt.desc}</Text>
                      </View>
                      <Text style={s.mealOptP}>{opt.p}g</Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </>
          )}

          {/* ── MANUAL / ADD FOOD TAB ── Fix #4: user picks food + weight, app calculates */}
          {tab === 'manual' && (
            <>
              <Text style={s.sectionTitle}>{t('byWeightTitle')}</Text>
              <Text style={s.sectionSub}>{t('byWeightSub')}</Text>

              {/* Food search with dropdown */}
              <View>
                <TextInput style={s.searchInput} value={manualSearch} onChangeText={handleManualSearch}
                  placeholder={t('typeFood')}
                  placeholderTextColor={colors.text3} />
                {manualDropdown.length > 0 && (
                  <View style={s.dropdown}>
                    {manualDropdown.map((f, i) => (
                      <TouchableOpacity key={i} style={[s.dropdownItem, i===manualDropdown.length-1 && {borderBottomWidth:0}]} onPress={() => selectManualFood(f)}>
                        <Text style={s.dropdownName}>{f.name}</Text>
                        <Text style={s.dropdownMacros}>{t('proteinPer100', { p: f.p, c: f.cal })}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {manualFood && (
                <>
                  <View style={s.selectedFood}>
                    <Text style={s.selectedFoodName}>✓ {manualFood.name}</Text>
                    <Text style={s.selectedFoodSub}>{t('proteinPer100', { p: manualFood.p, c: manualFood.cal })}</Text>
                  </View>

                  <Text style={[s.sectionTitle,{marginTop:12}]}>{t('howManyGrams')}</Text>
                  <View style={s.gramsRow}>
                    {['50','100','150','200','250','300'].map(p => (
                      <TouchableOpacity key={p} style={[s.gramPreset, manualGrams===p && s.gramPresetOn]} onPress={() => setManualGrams(p)}>
                        <Text style={[s.gramPresetTxt, manualGrams===p && {color:colors.accent}]}>{p}g</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TextInput style={s.gramCustom} value={manualGrams} onChangeText={setManualGrams} keyboardType="numeric" placeholder={t('customGrams')} placeholderTextColor={colors.text3} selectTextOnFocus />

                  {manualCalc && (
                    <View style={s.calcPreview}>
                      <Text style={s.calcPreviewTitle}>{t('valuesFor', { n: manualGrams })}</Text>
                      <View style={s.calcGrid}>
                        {[
                          {l:t('calories'), v:`${manualCalc.cal}`, c:colors.text},
                          {l:t('protein'),  v:`${manualCalc.p}g`,       c:colors.accent},
                          {l:t('carbs'),    v:`${manualCalc.c}g`,       c:colors.accent3},
                          {l:t('fat'),      v:`${manualCalc.f}g`,       c:colors.orange},
                        ].map(m => (
                          <View key={m.l} style={s.calcGridItem}>
                            <Text style={[s.calcGridVal,{color:m.c}]}>{m.v}</Text>
                            <Text style={s.calcGridLabel}>{m.l}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                  <PrimaryButton title={t('addGramsOf', { n: manualGrams, name: manualFood.name.split(' ')[0] })} onPress={addManualFood} style={{marginTop:12}} />
                </>
              )}
            </>
          )}

          {/* ── BUILD MEAL TAB ── Fix #5: dropdown ingredient search */}
          {tab === 'ingredients' && (
            <>
              <Text style={s.sectionTitle}>{t('buildTitle')}</Text>
              <Text style={s.sectionSub}>{t('buildSub')}</Text>

              <View>
                <View style={s.ingRow}>
                  <TextInput style={[s.searchInput,{flex:1}]} value={ingQuery} onChangeText={handleIngQuery}
                    placeholder={t('typeIngredient')}
                    placeholderTextColor={colors.text3} returnKeyType="done" />
                </View>
                {ingDropdown.length > 0 && (
                  <View style={s.dropdown}>
                    {ingDropdown.map((f, i) => (
                      <TouchableOpacity key={i} style={[s.dropdownItem, i===ingDropdown.length-1 && {borderBottomWidth:0}]} onPress={() => selectIngredient(f)}>
                        <Text style={s.dropdownName}>{f.name}</Text>
                        <Text style={s.dropdownMacros}>{t('proteinPer100', { p: f.p, c: f.cal })}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {ingredients.length === 0 && (
                <Text style={s.hint}>{t('addOneByOne')}</Text>
              )}

              {ingredients.map((ing, i) => (
                <View key={i} style={s.ingItem}>
                  <View style={{flex:1}}>
                    <Text style={s.ingName} numberOfLines={1}>{ing.name}</Text>
                    <Text style={s.ingMacros}>{t('proteinKcal', { p: Math.round(ing.p*ing.grams/100), c: Math.round(ing.cal*ing.grams/100) })}</Text>
                  </View>
                  <TextInput style={s.ingGrams} value={String(ing.grams)} onChangeText={g => updateIngGrams(i, g)} keyboardType="numeric" selectTextOnFocus />
                  <Text style={s.ingUnit}>g</Text>
                  <TouchableOpacity onPress={() => removeIng(i)} style={{paddingLeft:8}}>
                    <Text style={{color:colors.text3,fontSize:18}}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {ingredients.length > 0 && (
                <>
                  <View style={s.ingTotal}>
                    <Text style={s.ingTotalTitle}>{t('totalNutrition')}</Text>
                    <View style={s.calcGrid}>
                      {[
                        {l:t('calories'), v:`${Math.round(ingTotals.cal)}`, c:colors.text},
                        {l:t('protein'),  v:`${Math.round(ingTotals.p)}g`,       c:colors.accent},
                        {l:t('carbs'),    v:`${Math.round(ingTotals.c)}g`,       c:colors.accent3},
                        {l:t('fat'),      v:`${Math.round(ingTotals.f)}g`,       c:colors.orange},
                      ].map(m => (
                        <View key={m.l} style={s.calcGridItem}>
                          <Text style={[s.calcGridVal,{color:m.c}]}>{m.v}</Text>
                          <Text style={s.calcGridLabel}>{m.l}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  <PrimaryButton title={t('addFullMeal')} onPress={addAllIngredients} />
                </>
              )}
            </>
          )}

          <View style={{height:40}} />
        </ScrollView>
      </KeyboardAvoidingView>

      {selectedFood && (
        <ServingModal food={selectedFood} onAdd={handleAddWithServing} onClose={() => setSelectedFood(null)} />
      )}
    </SafeAreaView>
  );
}

const ms = StyleSheet.create({
  overlay: { flex:1, backgroundColor:'rgba(0,0,0,0.7)', justifyContent:'flex-end' },
  sheet: { backgroundColor:colors.bg2, borderTopLeftRadius:24, borderTopRightRadius:24, padding:20, paddingBottom:40 },
  handle: { width:40, height:4, backgroundColor:colors.border, borderRadius:2, alignSelf:'center', marginBottom:16 },
  title: { fontSize:17, fontWeight:'700', color:colors.text, marginBottom:4 },
  sub: { fontSize:12, color:colors.text2, marginBottom:14 },
  macroRow: { flexDirection:'row', gap:8, marginBottom:16 },
  macroBox: { flex:1, backgroundColor:colors.card, borderRadius:10, padding:10, alignItems:'center' },
  macroVal: { fontSize:15, fontWeight:'700' },
  macroLabel: { fontSize:9, textTransform:'uppercase', color:colors.text2, marginTop:2 },
  servingLabel: { fontSize:13, fontWeight:'700', color:colors.text, marginBottom:8 },
  presetRow: { flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:10 },
  preset: { backgroundColor:colors.card, borderRadius:8, paddingHorizontal:14, paddingVertical:8, borderWidth:1, borderColor:colors.border },
  presetOn: { borderColor:colors.accent, backgroundColor:'rgba(74,222,128,0.1)' },
  presetTxt: { fontSize:13, color:colors.text2, fontWeight:'600' },
  gramInput: { backgroundColor:colors.card, borderWidth:1, borderColor:colors.border, borderRadius:radius.sm, padding:12, fontSize:16, color:colors.text, marginBottom:14, textAlign:'center' },
  calcCard: { backgroundColor:'rgba(74,222,128,0.06)', borderRadius:radius.sm, padding:14, borderWidth:1, borderColor:'rgba(74,222,128,0.2)' },
  calcTitle: { fontSize:12, color:colors.text2, marginBottom:10, fontWeight:'600' },
  calcRow: { flexDirection:'row', justifyContent:'space-between' },
  calcItem: { alignItems:'center' },
  calcVal: { fontSize:18, fontWeight:'700' },
  calcLabel: { fontSize:10, color:colors.text2, marginTop:2 },
});

const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:colors.bg },
  scroll: { padding:18, paddingTop:8 },
  scrollLandscape: { paddingHorizontal:32 },
  todaySummary: { flexDirection:'row', backgroundColor:colors.card, marginHorizontal:18, marginBottom:6, borderRadius:radius.sm, padding:12, borderWidth:1, borderColor:colors.border },
  todaySummaryLandscape: { marginHorizontal:32 },
  summaryItem: { flex:1, alignItems:'center' },
  summaryVal: { fontSize:18, fontWeight:'700' },
  summaryLabel: { fontSize:10, color:colors.text2, marginTop:2 },
  recentWrap: { backgroundColor:'rgba(74,222,128,0.07)', marginHorizontal:18, borderRadius:radius.sm, padding:12, marginBottom:6, borderWidth:1, borderColor:'rgba(74,222,128,0.2)' },
  recentTitle: { fontSize:11, fontWeight:'700', color:colors.accent, textTransform:'uppercase', letterSpacing:0.5, marginBottom:8 },
  recentItem: { flexDirection:'row', alignItems:'center', marginBottom:4 },
  recentName: { flex:1, fontSize:12, color:colors.text, fontWeight:'600' },
  recentMacros: { fontSize:11, color:colors.text2, marginRight:8 },
  viewTodayBtn: { backgroundColor:'rgba(74,222,128,0.15)', borderRadius:10, paddingHorizontal:8, paddingVertical:3 },
  viewTodayTxt: { color:colors.accent, fontSize:10, fontWeight:'700' },
  tabs: { flexDirection:'row', marginHorizontal:18, marginBottom:10, backgroundColor:colors.card, borderRadius:radius.sm, padding:4, borderWidth:1, borderColor:colors.border },
  tab: { flex:1, paddingVertical:8, alignItems:'center', borderRadius:8 },
  tabOn: { backgroundColor:colors.bg3 },
  tabTxt: { fontSize:11, fontWeight:'700', color:colors.text2 },
  searchRow: { flexDirection:'row', alignItems:'center', backgroundColor:colors.card, borderRadius:radius.sm, borderWidth:1, borderColor:colors.border, marginBottom:10 },
  searchInput: { flex:1, padding:12, fontSize:14, color:colors.text },
  dropdown: { backgroundColor:colors.card2, borderRadius:radius.sm, borderWidth:1, borderColor:colors.border, marginBottom:10, overflow:'hidden' },
  dropdownItem: { padding:12, borderBottomWidth:1, borderBottomColor:colors.border },
  dropdownName: { fontSize:13, fontWeight:'600', color:colors.text },
  dropdownMacros: { fontSize:11, color:colors.text2, marginTop:2 },
  foodRow: { backgroundColor:colors.card, borderRadius:radius.sm, padding:14, marginBottom:7, flexDirection:'row', alignItems:'center', borderWidth:1, borderColor:colors.border },
  foodName: { fontSize:13, fontWeight:'600', color:colors.text, marginBottom:2 },
  foodMacros: { fontSize:11, color:colors.text2 },
  sourceTag: { fontSize:10, color:colors.text3, marginTop:2 },
  addPill: { backgroundColor:'rgba(74,222,128,0.15)', borderRadius:20, paddingHorizontal:10, paddingVertical:5, borderWidth:1, borderColor:'rgba(74,222,128,0.3)' },
  addPillTxt: { color:colors.accent, fontWeight:'700', fontSize:12 },
  noResults: { padding:20, alignItems:'center' },
  noResultsTxt: { color:colors.text, fontSize:14, fontWeight:'600', marginBottom:6 },
  noResultsSub: { color:colors.text2, fontSize:12, textAlign:'center' },
  sectionTitle: { fontSize:15, fontWeight:'700', color:colors.text, marginBottom:4, marginTop:8 },
  sectionSub: { fontSize:12, color:colors.text2, marginBottom:10 },
  mealOpt: { backgroundColor:colors.card, borderRadius:radius.sm, padding:14, marginBottom:8, flexDirection:'row', alignItems:'center', borderWidth:1, borderColor:colors.border },
  mealOptName: { fontSize:13, fontWeight:'600', color:colors.text, marginBottom:2 },
  mealOptDesc: { fontSize:11, color:colors.text2 },
  mealOptP: { fontSize:18, fontWeight:'700', color:colors.accent },
  hint: { color:colors.text2, fontSize:12, textAlign:'center', padding:16 },
  selectedFood: { backgroundColor:'rgba(74,222,128,0.08)', borderRadius:radius.sm, padding:12, marginTop:8, borderWidth:1, borderColor:'rgba(74,222,128,0.25)' },
  selectedFoodName: { fontSize:14, fontWeight:'700', color:colors.accent },
  selectedFoodSub: { fontSize:12, color:colors.text2, marginTop:2 },
  gramsRow: { flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:10 },
  gramPreset: { backgroundColor:colors.card, borderRadius:8, paddingHorizontal:14, paddingVertical:8, borderWidth:1, borderColor:colors.border },
  gramPresetOn: { borderColor:colors.accent, backgroundColor:'rgba(74,222,128,0.1)' },
  gramPresetTxt: { fontSize:13, color:colors.text2, fontWeight:'600' },
  gramCustom: { backgroundColor:colors.card, borderWidth:1, borderColor:colors.border, borderRadius:radius.sm, padding:12, fontSize:15, color:colors.text, textAlign:'center', marginBottom:8 },
  calcPreview: { backgroundColor:'rgba(0,212,255,0.06)', borderRadius:radius.sm, padding:14, borderWidth:1, borderColor:'rgba(0,212,255,0.2)', marginBottom:4 },
  calcPreviewTitle: { fontSize:12, color:colors.text2, marginBottom:10, fontWeight:'600' },
  calcGrid: { flexDirection:'row', justifyContent:'space-between' },
  calcGridItem: { alignItems:'center', flex:1 },
  calcGridVal: { fontSize:16, fontWeight:'700' },
  calcGridLabel: { fontSize:10, color:colors.text2, marginTop:2 },
  ingRow: { flexDirection:'row', gap:8, marginBottom:4 },
  ingItem: { backgroundColor:colors.card, borderRadius:radius.sm, padding:12, marginBottom:8, flexDirection:'row', alignItems:'center', borderWidth:1, borderColor:colors.border },
  ingName: { fontSize:13, fontWeight:'600', color:colors.text },
  ingMacros: { fontSize:11, color:colors.text2 },
  ingGrams: { backgroundColor:colors.bg3, borderRadius:6, padding:6, width:52, textAlign:'center', color:colors.text, fontSize:14, borderWidth:1, borderColor:colors.border },
  ingUnit: { color:colors.text2, fontSize:12, marginLeft:3 },
  ingTotal: { backgroundColor:'rgba(74,222,128,0.06)', borderRadius:radius.sm, padding:14, marginBottom:12, borderWidth:1, borderColor:'rgba(74,222,128,0.2)' },
  ingTotalTitle: { fontSize:12, color:colors.text2, fontWeight:'700', marginBottom:10, textTransform:'uppercase', letterSpacing:0.5 },
});
