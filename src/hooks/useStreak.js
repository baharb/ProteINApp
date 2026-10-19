import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { localDateKey } from '../lib/dates';
import { DEMO, demoGoalDays } from '../lib/demo';

// Days the goal was hit are remembered; the streak is the run of consecutive
// hit days ending today (or yesterday, so it doesn't look broken each morning).
const KEY = 'goal_days_v1';

function countStreak(days) {
  const set = new Set(days);
  const d = new Date();
  if (!set.has(localDateKey(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (set.has(localDateKey(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

export function useStreak(todayProtein, proteinGoal) {
  const [days, setDays] = useState([]);

  useEffect(() => {
    if (DEMO) { setDays(demoGoalDays()); return; }
    AsyncStorage.getItem(KEY).then(raw => { if (raw) setDays(JSON.parse(raw)); }).catch(() => {});
  }, []);

  // Record today as soon as the goal is reached.
  useEffect(() => {
    if (!proteinGoal || todayProtein < proteinGoal) return;
    const today = localDateKey();
    setDays(prev => {
      if (prev.includes(today)) return prev;
      const next = [...prev, today].slice(-400);
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, [todayProtein, proteinGoal]);

  return { streak: countStreak(days), goalDays: days };
}
