-- SQL Function to send push notifications when new messages arrive
-- This runs in the background even when the app is closed

-- Function to send push notification via Expo API
CREATE OR REPLACE FUNCTION send_message_push_notification()
RETURNS TRIGGER AS $$
DECLARE
  receiver_token TEXT;
  sender_name_val TEXT;
  message_preview TEXT;
  notification_payload JSON;
BEGIN
  -- Get the receiver's push token
  SELECT push_token INTO receiver_token
  FROM push_tokens
  WHERE user_id = NEW.receiver_id
  LIMIT 1;

  -- If no token found, skip notification
  IF receiver_token IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get sender name (default to 'New Message' if not available)
  sender_name_val := COALESCE(NEW.sender_name, 'New Message');
  
  -- Get message preview (first 100 characters)
  message_preview := SUBSTRING(NEW.message, 1, 100);

  -- Create notification payload
  notification_payload := json_build_object(
    'to', receiver_token,
    'sound', 'default',
    'title', sender_name_val,
    'body', message_preview,
    'data', json_build_object(
      'type', 'message',
      'senderId', NEW.sender_id,
      'messageId', NEW.id,
      'conversationId', NEW.sender_id
    ),
    'priority', 'high',
    'channelId', 'default'
  );

  -- Use pg_net extension to send HTTP request to Expo Push API
  -- Note: This requires pg_net extension to be enabled in Supabase
  PERFORM
    net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      headers := '{"Content-Type": "application/json", "Accept": "application/json"}'::jsonb,
      body := notification_payload::jsonb
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that fires when a new message is inserted
DROP TRIGGER IF EXISTS message_notification_trigger ON messages;
CREATE TRIGGER message_notification_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION send_message_push_notification();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION send_message_push_notification() TO authenticated;
GRANT EXECUTE ON FUNCTION send_message_push_notification() TO service_role;
