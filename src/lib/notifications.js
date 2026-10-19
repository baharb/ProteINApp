import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner:true, shouldShowList:true, shouldPlaySound:true, shouldSetBadge:false }),
});

export async function registerForPushNotifications() {
  if (!Device.isDevice) return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
}

export async function scheduleDailyProteinReminder(proteinGoal) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  // Morning reminder
  await Notifications.scheduleNotificationAsync({
    content: { title:"🥩 Protein check!", body:`Goal: ${proteinGoal}g protein today. Start strong!` },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour:8, minute:0 },
  });
  // Evening reminder
  await Notifications.scheduleNotificationAsync({
    content: { title:"💪 Evening check-in", body:`Don't lose your streak — hit your ${proteinGoal}g goal!` },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour:19, minute:0 },
  });
}

export async function scheduleSmartReminder(remainingProtein, streak) {
  // Context-aware notification based on remaining protein and streak
  let body = '';
  if (streak > 3)            body = `Don't lose your ${streak}-day streak — ${remainingProtein}g left today 🔥`;
  else if (remainingProtein <= 20) body = `Only ${remainingProtein}g left — finish strong! 💪`;
  else                             body = `You're ${remainingProtein}g short today — quick fix? 🥩`;
  await Notifications.scheduleNotificationAsync({
    content: { title:"ProteIN AI", body },
    trigger: null, // immediate
  });
}

export async function sendProteinGoalNotification(current, goal) {
  await Notifications.scheduleNotificationAsync({
    content: { title:"🎉 Protein Goal Hit!", body:`You've reached your ${goal}g protein goal today!` },
    trigger: null,
  });
}

export async function scheduleProgramReminder(programText) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: { title:"📋 Your Daily Program", body:"Tap to view today's nutrition & exercise plan" },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour:8, minute:0 },
  });
}

// Are daily reminders currently scheduled? (Doesn't prompt for permission.)
export async function remindersEnabled() {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return false;
    return (await Notifications.getAllScheduledNotificationsAsync()).length > 0;
  } catch { return false; }
}

export async function cancelReminders() {
  try { await Notifications.cancelAllScheduledNotificationsAsync(); } catch {}
}
