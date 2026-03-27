import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [goals, setGoals] = useState({ calories: 2100, protein: 140, carbs: 230, fat: 65 });
  const [goals2, setGoals2] = useState([]);           // ['lose','muscle','healthy']
  const [units, setUnits] = useState({ weight: 'kg', height: 'cm' }); // weight: kg|lbs  height: cm|in|ft
  const [today, setToday] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0, meals: [] });
  const [weightLog, setWeightLog] = useState([]);
  const [weekData] = useState({
    protein:  [82, 118, 95, 140, 76, 130, 0],
    calories: [1800, 2050, 1950, 2100, 1700, 2200, 0],
  });

  function addMeal(name, cal, p, c, f, slot) {
    setToday(prev => ({
      calories: prev.calories + cal,
      protein:  prev.protein  + p,
      carbs:    prev.carbs    + c,
      fat:      prev.fat      + f,
      meals: [...prev.meals, { name, cal, p, c, f, slot }],
    }));
  }

  function removeMeal(index) {
    setToday(prev => {
      const m = prev.meals[index];
      const meals = prev.meals.filter((_, i) => i !== index);
      return {
        calories: prev.calories - m.cal,
        protein:  prev.protein  - m.p,
        carbs:    prev.carbs    - m.c,
        fat:      prev.fat      - m.f,
        meals,
      };
    });
  }

  function logWeight(weight) {
    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    setWeightLog(prev => [...prev, { weight, date }]);
  }

  function calcAndSetGoals(ageYrs, weightKg, heightCm, gender, activity, selectedGoals) {
    let bmr = gender === 'male'
      ? 10 * weightKg + 6.25 * heightCm - 5 * ageYrs + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * ageYrs - 161;
    const actMult = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 };
    const tdee = bmr * (actMult[activity] || 1.2);

    // Blend adjustments for combined goals
    let calAdj = 0, proteinMult = 1.8;
    if (selectedGoals.includes('lose'))    { calAdj   -= 300; proteinMult = Math.max(proteinMult, 2.2); }
    if (selectedGoals.includes('muscle'))  { calAdj   += 150; proteinMult = Math.max(proteinMult, 2.0); }
    if (selectedGoals.includes('healthy')) { proteinMult = Math.max(proteinMult, 1.6); }

    const calories = Math.round(tdee + calAdj);
    const protein  = Math.round(weightKg * proteinMult);
    const fat      = Math.round(calories * 0.25 / 9);
    const carbs    = Math.max(Math.round((calories - protein * 4 - fat * 9) / 4), 80);

    setGoals({ calories, protein, carbs, fat });
    setGoals2(selectedGoals);
    setProfile({ age: ageYrs, weightKg, heightCm, gender, activity, goals: selectedGoals });
  }

  return (
    <AppContext.Provider value={{
      profile, goals, goals2, units, setUnits,
      today, weightLog, weekData,
      addMeal, removeMeal, logWeight, calcAndSetGoals, setProfile,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() { return useContext(AppContext); }
