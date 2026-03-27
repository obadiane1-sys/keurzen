import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase/client';
import { useAuthStore } from '../stores/auth.store';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function usePushNotifications() {
  const { user } = useAuthStore();
  const notifListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();

  useEffect(() => {
    if (!user?.id) return;

    registerForPushNotifications(user.id);

    // Listen to received notifications
    notifListener.current = Notifications.addNotificationReceivedListener((_notification) => {
      // Notification reçue en foreground — gérer la navigation si nécessaire
    });

    // Listen to notification responses (user tapped)
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      handleNotificationResponse(data);
    });

    return () => {
      if (notifListener.current) {
        Notifications.removeNotificationSubscription(notifListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [user?.id]);
}

async function registerForPushNotifications(userId: string) {
  if (!Device.isDevice) {
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return;
  }

  // Android channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Keurzen',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#88D4A9',
    });
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;
    const platform = Platform.OS === 'ios' ? 'ios' : 'android';

    // Upsert push token in Supabase
    await supabase.from('push_tokens').upsert(
      {
        user_id: userId,
        token,
        platform,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,token' }
    );
  } catch (err) {
    console.error('Error registering push token:', err);
  }
}

function handleNotificationResponse(data: Record<string, unknown>) {
  // Deep link handling based on notification type
  const type = data?.type;

  switch (type) {
    case 'overdue':
      // Navigate to task detail
      // router.push(`/(app)/tasks/${data.task_id}`);
      break;
    case 'morning_digest':
      // Navigate to tasks list
      // router.push('/(app)/tasks');
      break;
    default:
      break;
  }
}

/**
 * Schedule a local reminder 30 minutes before a task due time
 */
export async function scheduleTaskReminder(
  taskId: string,
  taskTitle: string,
  dueDate: Date
) {
  const reminderTime = new Date(dueDate.getTime() - 30 * 60 * 1000);

  if (reminderTime <= new Date()) return; // Don't schedule if in the past

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '⏰ Rappel tâche',
      body: `"${taskTitle}" est dans 30 minutes`,
      data: { type: 'reminder', task_id: taskId },
      sound: 'default',
    },
    trigger: { date: reminderTime },
  });
}
