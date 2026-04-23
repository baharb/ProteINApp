import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert:true, shouldPlaySound:true, shouldSetBadge:false }),
});

export async function registerForPushNotifications() {
  if (!Device.isDevice) return false;
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
}

export async function scheduleDailyProteinReminder(proteinGoal) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  // 8am reminder
  await Notifications.scheduleNotificationAsync({
    content: { title:"🥩 Good morning!", body:`Don't forget your protein goal: ${proteinGoal}g today. Start strong!` },
    trigger: { hour:8, minute:0, repeats:true },
  });
  // 7pm reminder
  await Notifications.scheduleNotificationAsync({
    content: { title:"💪 Evening check-in", body:`How's your protein intake? Make sure to hit your ${proteinGoal}g goal!` },
    trigger: { hour:19, minute:0, repeats:true },
  });
}

export async function scheduleProgramReminder(programText) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  // Daily 8am with program summary
  await Notifications.scheduleNotificationAsync({
    content: {
      title:"📋 Your Daily Program",
      body:"Tap to view today's diet and exercise plan",
      data: { programPreview: programText.substring(0, 200) },
    },
    trigger: { hour:8, minute:0, repeats:true },
  });
}

export async function sendProteinGoalNotification(current, goal) {
  await Notifications.scheduleNotificationAsync({
    content: { title:"🎉 Protein Goal Reached!", body:`You've hit your ${goal}g protein goal today. Great work!` },
    trigger: null,
  });
}
