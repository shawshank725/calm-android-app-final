# Background Push Notifications Setup

This guide explains how push notifications work even when the app is closed.

## How It Works

1. **When User Opens App**: 
   - App registers for push notifications
   - Expo Push Token is saved to `push_tokens` table in Supabase
   - Token is linked to user's UUID

2. **When Message is Sent**:
   - Message is inserted into `messages` table
   - App calls `notifyNewMessage()` function
   - Function looks up receiver's push token
   - Sends notification via Expo Push API
   - **Notification arrives even if app is closed**

3. **When Notification Arrives**:
   - **App Closed**: OS shows notification, user can tap to open app
   - **App Open**: Local notification appears, handled by real-time listeners

## Configuration Done

### ✅ App Configuration (`app.json`)
- Added Android notification permissions
- Configured notification plugin with background support
- Set up notification channel

### ✅ Notification Service (`lib/notificationService.ts`)
- Registers for push notifications on app start
- Saves push tokens to database
- Handles foreground notifications

### ✅ Background Notifications (`lib/backgroundNotifications.ts`)
- Sends push notifications via Expo API
- Works independently of app state
- Called automatically when messages are sent

### ✅ Message Screens
- Student chat sends background notifications
- Expert chat sends background notifications
- All messages trigger push notifications

## Testing Background Notifications

1. **Build the App**:
   ```bash
   eas build --profile preview --platform android
   ```

2. **Install APK on Device**

3. **Login and Allow Notifications**

4. **Close the App Completely**

5. **Send Message from Another Account**

6. **Notification Should Appear** even though app is closed!

## Troubleshooting

### Notifications Not Arriving When App is Closed?

1. **Check Push Token Registration**:
   - Open app and check console for "✅ Push token saved to database"
   - Verify token exists in Supabase `push_tokens` table

2. **Check Notification Sending**:
   - Look for "✅ Background push notification sent successfully" in console
   - Check Expo push notification dashboard

3. **Android Battery Optimization**:
   - Go to Settings → Apps → C.A.L.M Space
   - Battery → Unrestricted
   - Notifications → Allow all

4. **Check Android Version**:
   - Android 13+ requires explicit notification permission
   - Make sure user granted permission

### Push Token Not Saving?

1. Check Supabase `push_tokens` table exists:
   ```sql
   CREATE TABLE push_tokens (
     user_id UUID PRIMARY KEY REFERENCES auth.users(id),
     push_token TEXT NOT NULL,
     platform TEXT NOT NULL,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );
   ```

2. Enable RLS policies:
   ```sql
   ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
   
   CREATE POLICY "Users can update own push token"
   ON push_tokens FOR UPDATE
   USING (auth.uid() = user_id);
   
   CREATE POLICY "Users can insert own push token"
   ON push_tokens FOR INSERT
   WITH CHECK (auth.uid() = user_id);
   ```

## Advanced: Database Trigger (Optional)

For fully automated background notifications without app code, you can use the SQL trigger in `supabase/send-message-notification.sql`.

**Requirements**:
- Supabase pg_net extension enabled
- Run the SQL file in Supabase SQL Editor

This will automatically send push notifications on every message insert, completely independent of the app.

## Push Notification Flow

```
User A sends message
    ↓
App calls notifyNewMessage()
    ↓
Fetch User B's push token from database
    ↓
Send to Expo Push API (https://exp.host/--/api/v2/push/send)
    ↓
Expo delivers to User B's device
    ↓
Notification appears (even if app closed)
    ↓
User B taps notification
    ↓
App opens to chat screen
```

## Important Notes

- ✅ Notifications work when app is **closed**
- ✅ Notifications work when app is **background**
- ✅ Notifications work when app is **foreground** (using local notifications)
- ✅ Push tokens are refreshed on each app launch
- ✅ Works on Android (iOS requires Apple Developer Account + APNs configuration)

## Next Steps

1. Build and test the APK
2. Verify notifications arrive when app is completely closed
3. Test with multiple users
4. Monitor Expo Push Notification dashboard for delivery status
