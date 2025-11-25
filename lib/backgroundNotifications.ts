/**
 * Backend notification helper to send push notifications
 * Call this from message insertion to notify receivers even when app is closed
 */

import { supabase } from './supabase';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface PushNotificationData {
  receiverId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

/**
 * Send push notification to a user (works even when app is closed)
 * This calls Expo's push service directly
 */
export async function sendPushNotificationToUser({
  receiverId,
  title,
  body,
  data = {},
}: PushNotificationData): Promise<boolean> {
  try {
    // Get the receiver's push token from database
    const { data: tokenData, error: tokenError } = await supabase
      .from('push_tokens')
      .select('push_token')
      .eq('user_id', receiverId)
      .single();

    if (tokenError || !tokenData?.push_token) {
      console.log('No push token found for user:', receiverId);
      return false;
    }

    const pushToken = tokenData.push_token;

    // Send push notification via Expo Push API
    const message = {
      to: pushToken,
      sound: 'default',
      title: title,
      body: body,
      data: data,
      priority: 'high',
      channelId: 'default',
      badge: 1,
    };

    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([message]),
    });

    const result = await response.json();
    
    if (result.data?.[0]?.status === 'ok') {
      console.log('✅ Background push notification sent successfully');
      return true;
    } else {
      console.error('❌ Push notification failed:', result);
      return false;
    }
  } catch (error) {
    console.error('Error sending background push notification:', error);
    return false;
  }
}

/**
 * Send push notification when a message is sent
 */
export async function notifyNewMessage(
  receiverId: string,
  senderName: string,
  messageText: string,
  senderId: string
) {
  return sendPushNotificationToUser({
    receiverId,
    title: senderName || 'New Message',
    body: messageText.substring(0, 100),
    data: {
      type: 'message',
      senderId: senderId,
      timestamp: new Date().toISOString(),
    },
  });
}
