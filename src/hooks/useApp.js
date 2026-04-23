import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [session,   setSession]   = useState(null);
  const [isGuest,   setIsGuest]   = useState(false);
  const [profile,   setProfile]   = useState(null);
  const [goals,     setGoals]     = useState({ calories:2100, protein:140, carbs:230, fat:65 });
  const [goals2,    setGoals2]    = useState([]);
  const [units,     setUnits]     = useState({ weight:'kg', height:'cm' });
  const [today,     setToday]     = useState({ calories:0, protein:0, carbs:0, fat:0, meals:[] });
  const [weightLog, setWeightLog] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadUserData(session.user.id);
      else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
      if (session) { setIsGuest(false); loadUserData(session.user.id); }
      else { resetState(); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  function resetState() {
    setProfile(null); setGoals({calories:2100,protein:140,carbs:230,fat:65});
    setGoals2([]); setToday({calories:0,protein:0,carbs:0,fat:0,meals:[]}); setWeightLog([]);
  }

  // Guest mode — skip auth, use app with no persistence
  function continueAsGuest() {
    setIsGuest(true); setLoading(false);
  }

  async function getSignedAvatarUrl(filePath) {
    if (!filePath) return null;
    try {
      const { data, error } = await supabase.storage.from('avatars').createSignedUrl(filePath, 60*60*24*7);
      if (error) throw error;
      return data.signedUrl;
    } catch (e) { console.error('getSignedAvatarUrl:', e.message); return null; }
  }

  async function loadUserData(userId) {
    try {
      setLoading(true);
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (prof) {
        let avatarSignedUrl = null;
        if (prof.avatar_path) avatarSignedUrl = await getSignedAvatarUrl(prof.avatar_path);
        setProfile({ ...prof, avatar_url: avatarSignedUrl });
        setGoals({ calories:prof.goal_calories, protein:prof.goal_protein, carbs:prof.goal_carbs, fat:prof.goal_fat });
        setGoals2(prof.goals||[]);
        setUnits({ weight:prof.weight_unit||'kg', height:prof.height_unit||'cm' });
      }
      const todayStr = new Date().toISOString().split('T')[0];
      const { data: meals } = await supabase.from('meals').select('*').eq('user_id',userId).eq('date',todayStr).order('created_at',{ascending:true});
      if (meals?.length) {
        const totals = meals.reduce((acc,m) => ({calories:acc.calories+m.calories,protein:acc.protein+m.protein,carbs:acc.carbs+m.carbs,fat:acc.fat+m.fat}),{calories:0,protein:0,carbs:0,fat:0});
        setToday({...totals, meals:meals.map(m=>({id:m.id,name:m.name,cal:m.calories,p:m.protein,c:m.carbs,f:m.fat,slot:m.slot}))});
      }
      const { data: weights } = await supabase.from('weight_log').select('*').eq('user_id',userId).order('logged_at',{ascending:true}).limit(30);
      if (weights) setWeightLog(weights.map(w=>({weight:w.weight_kg,date:new Date(w.logged_at).toLocaleDateString('en-US',{month:'short',day:'numeric'})})));
    } catch(e) { console.error('loadUserData:',e); }
    finally { setLoading(false); }
  }

  async function addMeal(name,cal,p,c,f,slot) {
    const mealObj={name,cal:Math.round(cal),p:Math.round(p),c:Math.round(c),f:Math.round(f),slot};
    setToday(prev=>({calories:prev.calories+mealObj.cal,protein:prev.protein+mealObj.p,carbs:prev.carbs+mealObj.c,fat:prev.fat+mealObj.f,meals:[...prev.meals,mealObj]}));
    if (!session||isGuest) return;
    const todayStr=new Date().toISOString().split('T')[0];
    await supabase.from('meals').insert({user_id:session.user.id,name,date:todayStr,slot,calories:mealObj.cal,protein:mealObj.p,carbs:mealObj.c,fat:mealObj.f});
  }

  async function removeMeal(index) {
    const meal=today.meals[index];
    setToday(prev=>{const meals=prev.meals.filter((_,i)=>i!==index);return{calories:prev.calories-meal.cal,protein:prev.protein-meal.p,carbs:prev.carbs-meal.c,fat:prev.fat-meal.f,meals};});
    if (meal.id&&session&&!isGuest) await supabase.from('meals').delete().eq('id',meal.id);
  }

  async function updateMeal(index, newMacros) {
    const meal=today.meals[index];
    const diff={cal:newMacros.cal-meal.cal,p:newMacros.p-meal.p,c:newMacros.c-meal.c,f:newMacros.f-meal.f};
    setToday(prev=>({calories:prev.calories+diff.cal,protein:prev.protein+diff.p,carbs:prev.carbs+diff.c,fat:prev.fat+diff.f,meals:prev.meals.map((m,i)=>i===index?{...m,cal:newMacros.cal,p:newMacros.p,c:newMacros.c,f:newMacros.f}:m)}));
    if (meal.id&&session&&!isGuest) await supabase.from('meals').update({calories:newMacros.cal,protein:newMacros.p,carbs:newMacros.c,fat:newMacros.f}).eq('id',meal.id);
  }

  async function logWeight(weightKg) {
    const date=new Date().toLocaleDateString('en-US',{month:'short',day:'numeric'});
    setWeightLog(prev=>[...prev,{weight:weightKg,date}]);
    if (session&&!isGuest) await supabase.from('weight_log').insert({user_id:session.user.id,weight_kg:weightKg});
  }

  async function calcAndSetGoals(age,weightKg,heightCm,gender,activity,selectedGoals,weightUnit,heightUnit) {
    let bmr=gender==='male'?10*weightKg+6.25*heightCm-5*age+5:10*weightKg+6.25*heightCm-5*age-161;
    const actMult={sedentary:1.2,light:1.375,moderate:1.55,active:1.725};
    const tdee=bmr*(actMult[activity]||1.2);
    let calAdj=0,protMult=1.8;
    if (selectedGoals.includes('lose')){calAdj-=300;protMult=Math.max(protMult,2.2);}
    if (selectedGoals.includes('muscle')){calAdj+=150;protMult=Math.max(protMult,2.0);}
    if (selectedGoals.includes('healthy')){protMult=Math.max(protMult,1.6);}
    const calories=Math.round(tdee+calAdj),protein=Math.round(weightKg*protMult);
    const fat=Math.round(calories*0.25/9),carbs=Math.max(Math.round((calories-protein*4-fat*9)/4),80);
    setGoals({calories,protein,carbs,fat}); setGoals2(selectedGoals);
    setUnits({weight:weightUnit,height:heightUnit});
    const profileData={id:session?.user.id,age,weight_kg:weightKg,height_cm:heightCm,gender,activity,goals:selectedGoals,goal_calories:calories,goal_protein:protein,goal_carbs:carbs,goal_fat:fat,weight_unit:weightUnit,height_unit:heightUnit,updated_at:new Date().toISOString()};
    setProfile(prev=>({...prev,...profileData}));
    if (session&&!isGuest) await supabase.from('profiles').upsert(profileData);
  }

  async function updateProfilePhoto(filePath) {
    const signedUrl=await getSignedAvatarUrl(filePath);
    setProfile(prev=>({...prev,avatar_url:signedUrl,avatar_path:filePath}));
    if (session&&!isGuest) await supabase.from('profiles').update({avatar_path:filePath}).eq('id',session.user.id);
  }

  // Save display_name separately (called from ProfileScreen)
  async function updateDisplayName(name) {
    setProfile(prev=>({...prev,display_name:name}));
    if (session&&!isGuest) await supabase.from('profiles').update({display_name:name}).eq('id',session.user.id);
  }

  async function signUp(email,password) { const {error}=await supabase.auth.signUp({email,password}); return error; }
  async function signIn(email,password) { const {error}=await supabase.auth.signInWithPassword({email,password}); return error; }
  async function signOut() { setIsGuest(false); await supabase.auth.signOut(); resetState(); }

  return (
    <AppContext.Provider value={{
      session, isGuest, profile, goals, goals2, units, setUnits,
      today, weightLog, loading,
      addMeal, removeMeal, updateMeal, logWeight, calcAndSetGoals,
      updateProfilePhoto, updateDisplayName, continueAsGuest, signUp, signIn, signOut,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() { return useContext(AppContext); }
