import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [goals, setGoals] = useState({ calories: 2100, protein: 140, carbs: 230, fat: 65 });
  const [today, setToday] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0, meals: [] });
  const [weightLog, setWeightLog] = useState([]);
  const [goal, setGoal] = useState('muscle');
  const [weekData] = useState({
    protein: [82, 118, 95, 140, 76, 130, 0],
    calories: [1800, 2050, 1950, 2100, 1700, 2200, 0],
  });

  function addMeal(name, cal, p, c, f, slot) {
    setToday(prev => ({
      calories: prev.calories + cal,
      protein: prev.protein + p,
      carbs: prev.carbs + c,
      fat: prev.fat + f,
      meals: [...prev.meals, { name, cal, p, c, f, slot }],
    }));
  }

  function logWeight(weight) {
    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    setWeightLog(prev => [...prev, { weight, date }]);
  }

  function calcAndSetGoals(age, weight, height, gender, activity, userGoal) {
    let bmr = gender === 'male'
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161;
    const actMult = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 };
    let tdee = bmr * (actMult[activity] || 1.2);
    const goalAdj = { lose: -400, muscle: 200, healthy: 0 };
    const calories = Math.round(tdee + goalAdj[userGoal]);
    const proteinMult = { lose: 2.2, muscle: 2.0, healthy: 1.6 };
    const protein = Math.round(weight * proteinMult[userGoal]);
    const fat = Math.round(calories * 0.25 / 9);
    const carbs = Math.max(Math.round((calories - protein * 4 - fat * 9) / 4), 100);
    setGoals({ calories, protein, carbs, fat });
    setGoal(userGoal);
    setProfile({ age, weight, height, gender, activity, goal: userGoal });
  }

  function loadDemo() {
    setGoals({ calories: 2100, protein: 140, carbs: 230, fat: 65 });
    setGoal('muscle');
    setProfile({ age: 28, weight: 78, height: 178, gender: 'male', goal: 'muscle' });
    setToday({
      calories: 1450, protein: 92, carbs: 148, fat: 38,
      meals: [
        { name: 'Protein Oats', cal: 390, p: 30, c: 56, f: 8, slot: 0 },
        { name: 'Chicken Rice Bowl', cal: 520, p: 42, c: 58, f: 12, slot: 1 },
        { name: 'Greek Yogurt', cal: 90, p: 17, c: 7, f: 0, slot: 3 },
      ],
    });
    setWeightLog([
      { weight: 78.5, date: 'Mar 5' },
      { weight: 78.2, date: 'Mar 7' },
      { weight: 77.9, date: 'Mar 10' },
      { weight: 77.6, date: 'Mar 12' },
    ]);
  }

  return (
    <AppContext.Provider value={{
      profile, goals, today, weightLog, goal, weekData,
      addMeal, logWeight, calcAndSetGoals, loadDemo, setProfile,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
