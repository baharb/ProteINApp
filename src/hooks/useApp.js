import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { localDateKey } from '../lib/dates';
import { supabase } from '../lib/supabase';
import { SERVER_URL, fetchWithTimeout } from '../lib/config';
import { DEMO, DEMO_SESSION, DEMO_PROFILE, DEMO_GOALS, DEMO_TODAY, DEMO_MY_FOODS } from '../lib/demo';

const AppCtx = createContext(null);

export function AppProvider({ children }) {
  const [session,   setSession]   = useState(null);
  const [profile,   setProfile]   = useState(null);
  const [goals,     setGoals]     = useState({ calories:2000, protein:120, carbs:200, fat:60 });
  const [goals2,    setGoals2]    = useState(['muscle']);
  const [units,     setUnits]     = useState({ weight:'kg', height:'cm' });
  const [today,     setToday]     = useState({ calories:0, protein:0, carbs:0, fat:0, meals:[] });
  const [weightLog, setWeightLog] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [myFoods,   setMyFoods]   = useState({});   // name -> { name, emoji, image, protein, calories, count, slots[4], last }

  // Which user/day is currently loaded. Token refreshes fire auth events too —
  // they must not trigger a full reload (that flashed the splash screen and
  // threw the user back to Home mid-scan).
  const loadedUser = useRef(null);
  const loadedDay  = useRef(localDateKey());
  const sessionRef = useRef(null);
  sessionRef.current = session;

  useEffect(() => {
    if (DEMO) {   // web screenshots only (see lib/demo.js)
      setSession(DEMO_SESSION); setProfile(DEMO_PROFILE); setGoals(DEMO_GOALS);
      setToday(DEMO_TODAY); setLoading(false);
      return;
    }
    function handle(sess) {
      setSession(sess);
      if (!sess) {
        if (loadedUser.current) resetState();
        loadedUser.current = null;
        setLoading(false);
      } else if (loadedUser.current !== sess.user.id) {
        loadedUser.current = sess.user.id;
        loadUserData(sess.user.id);
      }
    }
    supabase.auth.getSession().then(({ data: { session } }) => handle(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, sess) => handle(sess));
    return () => subscription.unsubscribe();
  }, []);

  // New day while the app was open or in the background → start today fresh.
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state !== 'active' || loadedDay.current === localDateKey()) return;
      loadedDay.current = localDateKey();
      setToday({ calories:0, protein:0, carbs:0, fat:0, meals:[] });
      if (sessionRef.current) loadUserData(sessionRef.current.user.id, { silent:true });
    });
    return () => sub.remove();
  }, []);

  function resetState() {
    setProfile(null);
    setGoals({ calories:2000, protein:120, carbs:200, fat:60 });
    setGoals2(['muscle']);
    setToday({ calories:0, protein:0, carbs:0, fat:0, meals:[] });
    setWeightLog([]);
  }

  // No account = guest. Guests can look around; saving anything needs an account.
  const isGuest = !session;

  async function getSignedAvatarUrl(path) {
    if (!path) return null;
    try {
      const { data, error } = await supabase.storage.from('avatars').createSignedUrl(path, 60*60*24*7);
      if (error) throw error;
      return data.signedUrl;
    } catch { return null; }
  }

  async function loadUserData(userId, { silent = false } = {}) {
    if (!silent) setLoading(true);
    try {
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (prof) {
        const avatarUrl = prof.avatar_path ? await getSignedAvatarUrl(prof.avatar_path) : null;
        setProfile({ ...prof, avatar_url: avatarUrl });
        setGoals({ calories:prof.goal_calories||2000, protein:prof.goal_protein||120, carbs:prof.goal_carbs||200, fat:prof.goal_fat||60 });
        setGoals2(prof.goals||['muscle']);
        setUnits({ weight:prof.weight_unit||'kg', height:prof.height_unit||'cm' });
      }
      const todayStr = localDateKey();
      const { data: meals } = await supabase.from('meals').select('*')
        .eq('user_id', userId).eq('date', todayStr).order('created_at', { ascending:true });
      if (meals?.length) {
        const tot = meals.reduce((a,m)=>({ calories:a.calories+m.calories, protein:a.protein+m.protein, carbs:a.carbs+m.carbs, fat:a.fat+m.fat }),{calories:0,protein:0,carbs:0,fat:0});
        setToday({ ...tot, meals:meals.map(m=>({ id:m.id, name:m.name, cal:m.calories, p:m.protein, c:m.carbs, f:m.fat, slot:m.slot })) });
      }
      const { data: wts } = await supabase.from('weight_log').select('*').eq('user_id', userId).order('logged_at',{ascending:true}).limit(30);
      if (wts) setWeightLog(wts.map(w=>({ weight:w.weight_kg, date:new Date(w.logged_at).toLocaleDateString('en-US',{month:'short',day:'numeric'}) })));
    } catch(e) { console.error('loadUserData:', e); }
    finally { setLoading(false); }
  }

  // ── "Your foods": everything the user logs is remembered, so next time it's one tap ──
  const foodsKey = `my_foods_v1_${session?.user?.id || 'guest'}`;
  useEffect(() => {
    if (DEMO) { setMyFoods(DEMO_MY_FOODS); return; }
    AsyncStorage.getItem(foodsKey).then(raw => setMyFoods(raw ? JSON.parse(raw) : {})).catch(() => setMyFoods({}));
  }, [foodsKey]);

  function rememberFood(obj, meta) {
    setMyFoods(prev => {
      const old  = prev[obj.name];
      const slots = old?.slots ? [...old.slots] : [0,0,0,0];
      if (obj.slot >= 0 && obj.slot < 4) slots[obj.slot] += 1;
      const next = { ...prev, [obj.name]: {
        name: obj.name, protein: obj.p, calories: obj.cal,
        emoji: meta?.emoji || old?.emoji || '🍽️', image: meta?.image || old?.image || null,
        unit: meta?.unit || old?.unit, qty: meta?.qty ?? old?.qty,
        protein_per_unit: meta?.protein_per_unit ?? old?.protein_per_unit, calories_per_unit: meta?.calories_per_unit ?? old?.calories_per_unit,
        count: (old?.count || 0) + 1, slots, last: Date.now(),
      }};
      AsyncStorage.setItem(foodsKey, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }

  async function addMeal(name, cal, p, c, f, slot, meta) {
    const obj = { name, cal:Math.round(cal), p:Math.round(p), c:Math.round(c), f:Math.round(f), slot, emoji:meta?.emoji, image:meta?.image };
    rememberFood(obj, meta);
    setToday(prev => ({
      calories:prev.calories+obj.cal, protein:prev.protein+obj.p,
      carbs:prev.carbs+obj.c, fat:prev.fat+obj.f,
      meals:[...prev.meals, obj],
    }));
    if (!session||isGuest||DEMO) return;
    const todayStr = localDateKey();
    const { data } = await supabase.from('meals')
      .insert({ user_id:session.user.id, name, date:todayStr, slot, calories:obj.cal, protein:obj.p, carbs:obj.c, fat:obj.f })
      .select('id').single();
    // Attach the DB id so remove/update can reach this row later.
    if (data?.id) setToday(prev => ({ ...prev, meals:prev.meals.map(m => m===obj ? { ...m, id:data.id } : m) }));
  }

  async function removeMeal(index) {
    const meal = today.meals[index];
    setToday(prev => ({
      calories:prev.calories-meal.cal, protein:prev.protein-meal.p,
      carbs:prev.carbs-meal.c, fat:prev.fat-meal.f,
      meals:prev.meals.filter((_,i)=>i!==index),
    }));
    if (meal.id&&session&&!isGuest) await supabase.from('meals').delete().eq('id', meal.id);
  }

  async function updateMeal(index, newMacros) {
    const meal = today.meals[index];
    const diff = { cal:newMacros.cal-meal.cal, p:newMacros.p-meal.p, c:newMacros.c-meal.c, f:newMacros.f-meal.f };
    setToday(prev => ({
      calories:prev.calories+diff.cal, protein:prev.protein+diff.p,
      carbs:prev.carbs+diff.c, fat:prev.fat+diff.f,
      meals:prev.meals.map((m,i) => i===index ? {...m,...newMacros} : m),
    }));
    if (meal.id&&session&&!isGuest) await supabase.from('meals').update({ calories:newMacros.cal, protein:newMacros.p, carbs:newMacros.c, fat:newMacros.f }).eq('id', meal.id);
  }

  async function logWeight(kg) {
    setWeightLog(prev => [...prev, { weight:kg, date:new Date().toLocaleDateString('en-US',{month:'short',day:'numeric'}) }]);
    if (session&&!isGuest) await supabase.from('weight_log').insert({ user_id:session.user.id, weight_kg:kg });
  }

  async function calcAndSetGoals(age, weightKg, heightCm, gender, activity, selectedGoals, weightUnit, heightUnit) {
    let bmr = gender==='male' ? 10*weightKg+6.25*heightCm-5*age+5 : 10*weightKg+6.25*heightCm-5*age-161;
    const actMult = { sedentary:1.2, light:1.375, moderate:1.55, active:1.725 };
    const tdee = bmr * (actMult[activity]||1.55);
    let calAdj=0, protMult=1.8;
    const isRecomp = selectedGoals.includes('lose') && selectedGoals.includes('muscle');
    if (isRecomp)                         { calAdj = -100; protMult = 2.4; }
    else if (selectedGoals.includes('lose'))   { calAdj = -350; protMult = 2.2; }
    else if (selectedGoals.includes('muscle')) { calAdj =  200; protMult = 2.0; }
    const calories = Math.round(tdee+calAdj);
    const protein  = Math.round(weightKg*protMult);
    const fat      = Math.round(calories*0.25/9);
    const carbs    = Math.max(Math.round((calories-protein*4-fat*9)/4), 80);
    const newGoals = { calories, protein, carbs, fat };
    setGoals(newGoals); setGoals2(selectedGoals);
    setUnits({ weight:weightUnit, height:heightUnit });
    const pd = { id:session?.user.id, age, weight_kg:weightKg, height_cm:heightCm, gender, activity, goals:selectedGoals, goal_calories:calories, goal_protein:protein, goal_carbs:carbs, goal_fat:fat, weight_unit:weightUnit, height_unit:heightUnit, updated_at:new Date().toISOString() };
    setProfile(prev => ({ ...prev, ...pd }));
    if (session&&!isGuest) await supabase.from('profiles').upsert(pd);
  }

  async function updateDisplayName(name) {
    if (!name) return;
    setProfile(prev => ({ ...prev, display_name:name }));
    if (session&&!isGuest) await supabase.from('profiles').update({ display_name:name }).eq('id', session.user.id);
  }

  async function updateProfilePhoto(filePath) {
    const url = await getSignedAvatarUrl(filePath);
    setProfile(prev => ({ ...prev, avatar_url:url, avatar_path:filePath }));
    if (session&&!isGuest) await supabase.from('profiles').update({ avatar_path:filePath }).eq('id', session.user.id);
  }

  async function signUp(email, password) { const { error } = await supabase.auth.signUp({ email, password }); return error; }
  async function signIn(email, password) { const { error } = await supabase.auth.signInWithPassword({ email, password }); return error; }
  async function signOut() { await supabase.auth.signOut(); resetState(); }

  // Permanently deletes the account and all its data (Google Play requirement).
  async function deleteAccount() {
    const res = await fetchWithTimeout(`${SERVER_URL}/account`, { method:'DELETE' }, 45000);
    if (!res.ok) throw new Error('deleteFailed');
    await AsyncStorage.removeItem(foodsKey).catch(() => {});
    await signOut();
  }

  return (
    <AppCtx.Provider value={{
      session, isGuest, profile, goals, goals2, units, setUnits, myFoods,
      today, weightLog, loading,
      addMeal, removeMeal, updateMeal, logWeight, calcAndSetGoals,
      updateDisplayName, updateProfilePhoto, deleteAccount, signUp, signIn, signOut,
    }}>
      {children}
    </AppCtx.Provider>
  );
}

export function useApp() { return useContext(AppCtx); }
