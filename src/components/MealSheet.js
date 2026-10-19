import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Modal, ActivityIndicator, ScrollView } from 'react-native';
import { Text } from './AppText';
import { C, R } from '../data/theme';
import { portionOptions } from '../lib/estimate';
import { useLang } from '../hooks/useLang';

// Bottom sheet: "Got it — how much?" → pick portions → Log it.
// Only protein-rich foods (10g+ per portion) with no amount given get portion buttons.
export default function MealSheet({ visible, text, title, loading, error, items: initial, remaining, onLog, onClose, onRetry }) {
  const { t, qtyLabel } = useLang();
  const [items, setItems] = useState([]);
  useEffect(() => { setItems(initial || []); }, [initial]);

  const total    = Math.round(items.reduce((a, it) => a + it.protein_per_unit * it.qty, 0));
  const calories = Math.round(items.reduce((a, it) => a + it.calories_per_unit * it.qty, 0));
  const after    = Math.max(0, remaining - total);

  const setQty = (i, qty) => setItems(prev => prev.map((it, idx) => idx === i ? { ...it, qty } : it));
  const remove = (i)      => setItems(prev => prev.filter((_, idx) => idx !== i));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={s.sheet}>
          <View style={s.handle} />

          {/* What the user said */}
          {!!text && (
            <View style={s.bubble}><Text style={s.bubbleTxt}>{text}</Text></View>
          )}

          {loading && (
            <View style={s.center}>
              <ActivityIndicator color={C.primary} size="large" />
              <Text style={s.loadingTxt}>{t('working')}</Text>
            </View>
          )}

          {!loading && !!error && (
            <View style={s.center}>
              <Text style={s.errorTxt}>{t(error)}</Text>
              <TouchableOpacity style={s.secondaryBtn} onPress={onRetry} activeOpacity={0.85}>
                <Text style={s.secondaryTxt}>{t('tryAgain')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {!loading && !error && items.length > 0 && (
            <>
              <Text style={s.title}>{title || (items.some(it => it.ask || (!it.qty_given && it.protein_per_unit >= 10)) ? t('howMuch') : t('gotIt'))}</Text>
              <ScrollView style={{ maxHeight:320 }} showsVerticalScrollIndicator={false}>
                {items.map((it, i) => {
                  const ask = it.ask || (!it.qty_given && it.protein_per_unit >= 10);
                  return (
                    <View key={`${it.name}-${i}`} style={s.item}>
                      <View style={s.itemTop}>
                        <Text style={s.itemEmoji}>{it.emoji}</Text>
                        <View style={{ flex:1 }}>
                          <Text style={s.itemName} numberOfLines={1}>{it.name.charAt(0).toUpperCase() + it.name.slice(1)}</Text>
                          {!ask && <Text style={s.itemQty}>{qtyLabel(it.qty, it.unit)}</Text>}
                        </View>
                        <Text style={s.itemProtein}>~{Math.round(it.protein_per_unit * it.qty)}g</Text>
                        <TouchableOpacity onPress={() => remove(i)} hitSlop={{ top:10, bottom:10, left:10, right:10 }}>
                          <Text style={s.itemRemove}>×</Text>
                        </TouchableOpacity>
                      </View>
                      {ask && (
                        <View style={s.chips}>
                          {portionOptions(it).map(q => (
                            <TouchableOpacity key={q} style={[s.chip, it.qty === q && s.chipOn]} onPress={() => setQty(i, q)} activeOpacity={0.85}>
                              <Text style={[s.chipTxt, it.qty === q && s.chipTxtOn]} numberOfLines={1}>{qtyLabel(q, it.unit)}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })}
              </ScrollView>

              <View style={s.totalRow}>
                <View>
                  <Text style={s.totalLabel}>{t('total')}</Text>
                  <Text style={s.totalSub}>{calories} {t('kcal')}</Text>
                </View>
                <Text style={s.totalVal}>~{total}g</Text>
              </View>
              <Text style={s.afterTxt}>
                {after > 0 ? t('afterThis', { n: after }) : t('finishesGoal')}
              </Text>

              <TouchableOpacity style={s.primaryBtn} onPress={() => onLog(items, total, calories)} activeOpacity={0.9}>
                <Text style={s.primaryTxt}>{t('logIt')}</Text>
              </TouchableOpacity>
              <Text style={s.hint}>{t('savedToFoods')}</Text>
            </>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay:  { flex:1, backgroundColor:'rgba(0,0,0,0.6)', justifyContent:'flex-end' },
  sheet:    { backgroundColor:C.card, borderTopLeftRadius:28, borderTopRightRadius:28, padding:20, paddingBottom:36, borderWidth:1, borderColor:C.border },
  handle:   { width:40, height:4, borderRadius:2, backgroundColor:C.border, alignSelf:'center', marginBottom:16 },

  bubble:    { alignSelf:'flex-end', backgroundColor:C.card2, borderRadius:16, borderBottomRightRadius:4, paddingHorizontal:14, paddingVertical:9, marginBottom:16, maxWidth:'85%' },
  bubbleTxt: { fontSize:15, color:C.text },

  center:     { alignItems:'center', paddingVertical:28, gap:14 },
  loadingTxt: { fontSize:15, color:C.text2, fontWeight:'600' },
  errorTxt:   { fontSize:15, color:C.text2, textAlign:'center', lineHeight:21 },

  title:  { fontSize:20, fontWeight:'900', color:C.text, marginBottom:14 },

  item:        { backgroundColor:C.bg, borderRadius:R.lg, padding:14, marginBottom:10, borderWidth:1, borderColor:C.border },
  itemTop:     { flexDirection:'row', alignItems:'center', gap:12 },
  itemEmoji:   { fontSize:26 },
  itemName:    { fontSize:16, fontWeight:'700', color:C.text },
  itemQty:     { fontSize:13, color:C.text2, marginTop:2 },
  itemProtein: { fontSize:16, fontWeight:'800', color:C.primary },
  itemRemove:  { fontSize:22, color:C.text3, lineHeight:24, marginLeft:4 },
  chips:       { flexDirection:'row', gap:8, marginTop:12 },
  chip:        { flex:1, paddingVertical:10, borderRadius:R.md, borderWidth:1.5, borderColor:C.border, alignItems:'center' },
  chipOn:      { borderColor:C.primary, backgroundColor:C.primary+'18' },
  chipTxt:     { fontSize:14, fontWeight:'700', color:C.text2 },
  chipTxtOn:   { color:C.primary },

  totalRow:   { flexDirection:'row', justifyContent:'space-between', alignItems:'center', backgroundColor:C.primary+'14', borderRadius:R.lg, paddingHorizontal:16, paddingVertical:12, marginTop:4, borderWidth:1, borderColor:C.primary+'40' },
  totalLabel: { fontSize:15, fontWeight:'800', color:C.primary },
  totalSub:   { fontSize:12, color:C.text2, marginTop:2 },
  totalVal:   { fontSize:28, fontWeight:'900', color:C.primary },
  afterTxt:   { fontSize:14, color:C.text2, marginTop:12, marginBottom:16, textAlign:'center' },

  primaryBtn:   { backgroundColor:C.primary, borderRadius:R.md, height:52, alignItems:'center', justifyContent:'center' },
  primaryTxt:   { fontSize:16, fontWeight:'900', color:'#0B0F14' },
  secondaryBtn: { borderRadius:R.md, paddingHorizontal:24, paddingVertical:12, borderWidth:1, borderColor:C.border },
  secondaryTxt: { fontSize:15, fontWeight:'700', color:C.text },
  hint:         { fontSize:12, color:C.text3, textAlign:'center', marginTop:10 },
});
