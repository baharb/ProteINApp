import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, displayWeight, displayHeight } from '../data/constants';
import { useApp } from '../hooks/useApp';
import { ScreenHeader } from '../components/UI';

const GOAL_LABELS = { lose:'🔥 Lose Fat', muscle:'💪 Build Muscle', healthy:'🌿 Stay Healthy' };
const W_UNITS = ['kg','lbs'];
const H_UNITS = ['cm','in','ft'];

export default function ProfileScreen({ navigation }) {
  const { goals, goals2, profile, units, setUnits } = useApp();
  const [notifications, setNotifications] = useState(true);

  function changeWeightUnit(u) { setUnits(prev => ({ ...prev, weight: u })); }
  function changeHeightUnit(u) { setUnits(prev => ({ ...prev, height: u })); }

  const weightDisplay = profile ? displayWeight(profile.weightKg, units?.weight||'kg') : '—';
  const heightDisplay = profile ? displayHeight(profile.heightCm, units?.height||'cm') : '—';

  return (
    <SafeAreaView style={s.safe}>
      <ScreenHeader title="Profile" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Avatar & basics */}
        <View style={s.profileHead}>
          <View style={s.avatar}><Text style={{fontSize:32}}>👤</Text></View>
          <View>
            <Text style={s.profileTitle}>My Profile</Text>
            {profile && <Text style={s.profileSub}>{weightDisplay} · {heightDisplay}</Text>}
            <View style={s.goalChips}>
              {(goals2||[]).map(g => (
                <View key={g} style={s.goalChip}>
                  <Text style={s.goalChipText}>{GOAL_LABELS[g]}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Daily Goals */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Daily Goals</Text>
          {[
            {label:'Calories', val:`${goals.calories.toLocaleString()} kcal`},
            {label:'Protein',  val:`${goals.protein}g`},
            {label:'Carbs',    val:`${goals.carbs}g`},
            {label:'Fat',      val:`${goals.fat}g`},
          ].map(r => (
            <View key={r.label} style={s.goalRow}>
              <Text style={s.goalLabel}>{r.label}</Text>
              <Text style={s.goalVal}>{r.val}</Text>
            </View>
          ))}
        </View>

        {/* Units */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Units</Text>

          <Text style={s.unitGroupLabel}>Weight</Text>
          <View style={s.unitRow}>
            {W_UNITS.map(u => (
              <TouchableOpacity key={u} style={[s.unitBtn, (units?.weight||'kg')===u && s.unitBtnOn]} onPress={()=>changeWeightUnit(u)}>
                <Text style={[s.unitBtnText, (units?.weight||'kg')===u && {color:colors.accent3}]}>{u}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[s.unitGroupLabel,{marginTop:12}]}>Height</Text>
          <View style={s.unitRow}>
            {H_UNITS.map(u => (
              <TouchableOpacity key={u} style={[s.unitBtn, (units?.height||'cm')===u && s.unitBtnOn]} onPress={()=>changeHeightUnit(u)}>
                <Text style={[s.unitBtnText, (units?.height||'cm')===u && {color:colors.accent3}]}>{u}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Settings */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Settings</Text>
          <View style={s.settingRow}>
            <Text style={s.settingLabel}>🔔 Notifications</Text>
            <Switch value={notifications} onValueChange={setNotifications} trackColor={{false:colors.card2,true:colors.accent}} thumbColor="#fff" />
          </View>
          <View style={[s.settingRow,{borderBottomWidth:0}]}>
            <Text style={s.settingLabel}>📱 Wearable Sync</Text>
            <Text style={s.comingSoon}>Coming soon</Text>
          </View>
        </View>

        <Text style={s.version}>ProteIN AI v1.0.0</Text>
        <View style={{height:30}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:colors.bg },
  scroll: { padding:18, paddingTop:8 },
  profileHead: { flexDirection:'row', alignItems:'center', gap:16, marginBottom:18 },
  avatar: { width:70, height:70, borderRadius:35, backgroundColor:'rgba(126,255,160,0.15)', alignItems:'center', justifyContent:'center', borderWidth:2, borderColor:'rgba(126,255,160,0.3)' },
  profileTitle: { fontSize:20, fontWeight:'700', color:colors.text },
  profileSub: { fontSize:12, color:colors.text2, marginTop:2, marginBottom:6 },
  goalChips: { flexDirection:'row', flexWrap:'wrap', gap:6 },
  goalChip: { backgroundColor:'rgba(126,255,160,0.12)', borderRadius:20, paddingHorizontal:10, paddingVertical:3, borderWidth:1, borderColor:'rgba(126,255,160,0.25)' },
  goalChipText: { fontSize:11, color:colors.accent, fontWeight:'600' },
  card: { backgroundColor:colors.card, borderRadius:radius.lg, padding:16, marginBottom:14, borderWidth:1, borderColor:colors.border },
  cardTitle: { fontSize:15, fontWeight:'700', color:colors.text, marginBottom:12 },
  goalRow: { flexDirection:'row', justifyContent:'space-between', paddingVertical:9, borderBottomWidth:1, borderBottomColor:colors.border },
  goalLabel: { fontSize:13, color:colors.text2 },
  goalVal: { fontSize:16, fontWeight:'700', color:colors.accent },
  unitGroupLabel: { fontSize:11, textTransform:'uppercase', letterSpacing:1, color:colors.text2, fontWeight:'700', marginBottom:8 },
  unitRow: { flexDirection:'row', gap:8 },
  unitBtn: { flex:1, backgroundColor:colors.bg3, borderWidth:2, borderColor:colors.border, borderRadius:radius.sm, paddingVertical:10, alignItems:'center' },
  unitBtnOn: { borderColor:colors.accent3, backgroundColor:'rgba(0,212,255,0.1)' },
  unitBtnText: { fontSize:13, fontWeight:'700', color:colors.text2 },
  settingRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:12, borderBottomWidth:1, borderBottomColor:colors.border },
  settingLabel: { fontSize:14, color:colors.text },
  comingSoon: { fontSize:12, color:colors.text3 },
  version: { textAlign:'center', fontSize:11, color:colors.text3, marginTop:4 },
});
