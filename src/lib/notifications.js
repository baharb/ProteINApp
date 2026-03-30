import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotifications() {
  if (!Device.isDevice) return null;
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;
  return true;
}

export async function scheduleDailyProteinReminder(goalProtein) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  // Morning reminder at 8am
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '💪 Morning Protein Check',
      body: `Start strong — aim for ${Math.round(goalProtein / 4)}g protein at breakfast!`,
    },
    trigger: { hour: 8, minute: 0, repeats: true },
  });
  // Evening nudge at 7pm
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🍽️ Evening Check-in',
      body: 'Have you hit your protein goal today? Log your last meal!',
    },
    trigger: { hour: 19, minute: 0, repeats: true },
  });
}

export async function sendProteinGoalNotification(achieved, goal) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🏆 Protein Goal Hit!',
      body: `Amazing! You hit ${achieved}g / ${goal}g protein today. Keep it up!`,
    },
    trigger: null, // immediate
  });
}
