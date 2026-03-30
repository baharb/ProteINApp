import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [session,  setSession]  = useState(null);
  const [profile,  setProfile]  = useState(null);
  const [goals,    setGoals]    = useState({ calories: 2100, protein: 140, carbs: 230, fat: 65 });
  const [goals2,   setGoals2]   = useState([]);
  const [units,    setUnits]    = useState({ weight: 'kg', height: 'cm' });
  const [today,    setToday]    = useState({ calories: 0, protein: 0, carbs: 0, fat: 0, meals: [] });
  const [weightLog,setWeightLog]= useState([]);
  const [loading,  setLoading]  = useState(true);

  // ── Auth listener ──────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadUserData(session.user.id);
      else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadUserData(session.user.id);
      else { resetState(); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  function resetState() {
    setProfile(null);
    setGoals({ calories: 2100, protein: 140, carbs: 230, fat: 65 });
    setGoals2([]);
    setToday({ calories: 0, protein: 0, carbs: 0, fat: 0, meals: [] });
    setWeightLog([]);
  }

  // ── Load user data from Supabase ──────────────────────────────────────────
  async function loadUserData(userId) {
    try {
      setLoading(true);

      // Profile
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (prof) {
        setProfile(prof);
        setGoals({ calories: prof.goal_calories, protein: prof.goal_protein, carbs: prof.goal_carbs, fat: prof.goal_fat });
        setGoals2(prof.goals || []);
        setUnits({ weight: prof.weight_unit || 'kg', height: prof.height_unit || 'cm' });
      }

      // Today's meals
      const today = new Date().toISOString().split('T')[0];
      const { data: meals } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .order('created_at', { ascending: true });

      if (meals?.length) {
        const totals = meals.reduce((acc, m) => ({
          calories: acc.calories + m.calories,
          protein:  acc.protein  + m.protein,
          carbs:    acc.carbs    + m.carbs,
          fat:      acc.fat      + m.fat,
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
        setToday({ ...totals, meals: meals.map(m => ({ id: m.id, name: m.name, cal: m.calories, p: m.protein, c: m.carbs, f: m.fat, slot: m.slot })) });
      }

      // Weight log
      const { data: weights } = await supabase
        .from('weight_log')
        .select('*')
        .eq('user_id', userId)
        .order('logged_at', { ascending: true })
        .limit(30);

      if (weights) setWeightLog(weights.map(w => ({ weight: w.weight_kg, date: new Date(w.logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) })));

    } catch (e) {
      console.error('loadUserData error:', e);
    } finally {
      setLoading(false);
    }
  }

  // ── Add meal ───────────────────────────────────────────────────────────────
  async function addMeal(name, cal, p, c, f, slot) {
    // Optimistic update
    setToday(prev => ({
      calories: prev.calories + cal,
      protein:  prev.protein  + p,
      carbs:    prev.carbs    + c,
      fat:      prev.fat      + f,
      meals: [...prev.meals, { name, cal, p, c, f, slot }],
    }));

    if (!session) return;
    const today = new Date().toISOString().split('T')[0];
    await supabase.from('meals').insert({
      user_id: session.user.id,
      name, date: today, slot,
      calories: cal, protein: p, carbs: c, fat: f,
    });
  }

  // ── Remove meal ────────────────────────────────────────────────────────────
  async function removeMeal(index) {
    const meal = today.meals[index];
    setToday(prev => {
      const meals = prev.meals.filter((_, i) => i !== index);
      return { calories: prev.calories - meal.cal, protein: prev.protein - meal.p, carbs: prev.carbs - meal.c, fat: prev.fat - meal.f, meals };
    });
    if (meal.id && session) {
      await supabase.from('meals').delete().eq('id', meal.id);
    }
  }

  // ── Log weight ─────────────────────────────────────────────────────────────
  async function logWeight(weightKg) {
    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    setWeightLog(prev => [...prev, { weight: weightKg, date }]);
    if (!session) return;
    await supabase.from('weight_log').insert({ user_id: session.user.id, weight_kg: weightKg });
  }

  // ── Save profile & calculated goals ───────────────────────────────────────
  async function calcAndSetGoals(age, weightKg, heightCm, gender, activity, selectedGoals, weightUnit, heightUnit) {
    let bmr = gender === 'male'
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
    const actMult = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 };
    const tdee = bmr * (actMult[activity] || 1.2);
    let calAdj = 0, protMult = 1.8;
    if (selectedGoals.includes('lose'))    { calAdj -= 300; protMult = Math.max(protMult, 2.2); }
    if (selectedGoals.includes('muscle'))  { calAdj += 150; protMult = Math.max(protMult, 2.0); }
    if (selectedGoals.includes('healthy')) { protMult = Math.max(protMult, 1.6); }
    const calories = Math.round(tdee + calAdj);
    const protein  = Math.round(weightKg * protMult);
    const fat      = Math.round(calories * 0.25 / 9);
    const carbs    = Math.max(Math.round((calories - protein * 4 - fat * 9) / 4), 80);

    const newGoals = { calories, protein, carbs, fat };
    setGoals(newGoals);
    setGoals2(selectedGoals);
    setUnits({ weight: weightUnit, height: heightUnit });

    const profileData = {
      id: session?.user.id,
      age, weight_kg: weightKg, height_cm: heightCm,
      gender, activity, goals: selectedGoals,
      goal_calories: calories, goal_protein: protein,
      goal_carbs: carbs, goal_fat: fat,
      weight_unit: weightUnit, height_unit: heightUnit,
      updated_at: new Date().toISOString(),
    };
    setProfile(profileData);

    if (session) {
      await supabase.from('profiles').upsert(profileData);
    }
  }

  // ── Auth helpers ───────────────────────────────────────────────────────────
  async function signUp(email, password) {
    const { error } = await supabase.auth.signUp({ email, password });
    return error;
  }
  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error;
  }
  async function signOut() {
    await supabase.auth.signOut();
    resetState();
  }

  return (
    <AppContext.Provider value={{
      session, profile, goals, goals2, units, setUnits,
      today, weightLog, loading,
      addMeal, removeMeal, logWeight, calcAndSetGoals,
      signUp, signIn, signOut,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() { return useContext(AppContext); }
