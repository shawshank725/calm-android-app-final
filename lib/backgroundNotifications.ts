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
  console.log('Push notifications disabled - push_tokens table removed');
  // Just send local notification instead
  return false;
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
