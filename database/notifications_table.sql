-- Create notifications table for the Calm Android App
-- This table stores all notifications sent within the system

-- First, create the table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    sender_id UUID REFERENCES auth.users(id),
    recipient_id UUID REFERENCES auth.users(id),
    recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('student', 'peer', 'expert', 'admin', 'all')),
    notification_type VARCHAR(30) NOT NULL CHECK (notification_type IN ('general', 'session', 'appointment', 'reminder', 'alert', 'update')),
    priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_type ON notifications(recipient_type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_notification_type ON notifications(notification_type);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread ON notifications(recipient_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_type_priority ON notifications(recipient_type, priority);

-- Enable Row Level Security (RLS)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can see notifications sent to them specifically or to their user type or to 'all'
CREATE POLICY "Users can view their notifications" ON notifications
    FOR SELECT USING (
        recipient_id = auth.uid() OR
        recipient_type = (
            SELECT user_type FROM user_profiles WHERE user_id = auth.uid()
        ) OR
        recipient_type = 'all'
    );

-- Users can insert notifications (for sending)
CREATE POLICY "Authenticated users can send notifications" ON notifications
    FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Users can update their own received notifications (mark as read)
CREATE POLICY "Users can update their notifications" ON notifications
    FOR UPDATE USING (
        recipient_id = auth.uid() OR
        recipient_type = (
            SELECT user_type FROM user_profiles WHERE user_id = auth.uid()
        ) OR
        recipient_type = 'all'
    );

-- Experts and admins can delete notifications they sent
CREATE POLICY "Senders can delete their notifications" ON notifications
    FOR DELETE USING (sender_id = auth.uid());

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create a function to clean up expired notifications
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM notifications
    WHERE expires_at IS NOT NULL AND expires_at < NOW();

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Insert sample notifications for testing (optional)
-- Note: Replace the UUIDs with actual user IDs from your auth.users table
/*
INSERT INTO notifications (title, message, recipient_type, notification_type, priority) VALUES
('Welcome to Calm!', 'Welcome to the Calm mental health support platform. We''re here to help you on your journey.', 'all', 'general', 'medium'),
('New Resource Available', 'A new mental health resource has been added to the library. Check it out!', 'student', 'update', 'low'),
('Session Reminder', 'You have a counseling session scheduled for tomorrow at 2:00 PM.', 'student', 'reminder', 'high'),
('System Maintenance', 'The system will undergo maintenance tonight from 2:00 AM to 4:00 AM.', 'all', 'alert', 'medium'),
('New Peer Support Group', 'A new peer support group for anxiety management is now available.', 'peer', 'general', 'medium');
*/

-- Create a view for unread notifications count by user
CREATE OR REPLACE VIEW user_unread_notifications AS
SELECT
    CASE
        WHEN recipient_id IS NOT NULL THEN recipient_id
        ELSE (SELECT user_id FROM user_profiles WHERE user_type = notifications.recipient_type)
    END as user_id,
    COUNT(*) as unread_count
FROM notifications
WHERE is_read = FALSE
    AND (expires_at IS NULL OR expires_at > NOW())
GROUP BY
    CASE
        WHEN recipient_id IS NOT NULL THEN recipient_id
        ELSE (SELECT user_id FROM user_profiles WHERE user_type = notifications.recipient_type)
    END;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO authenticated;
GRANT SELECT ON user_unread_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_notifications() TO authenticated;

-- Comment on table and important columns
COMMENT ON TABLE notifications IS 'Stores all notifications sent within the Calm app system';
COMMENT ON COLUMN notifications.recipient_type IS 'Type of user this notification is for: student, peer, expert, admin, or all';
COMMENT ON COLUMN notifications.notification_type IS 'Category of notification: general, session, appointment, reminder, alert, update';
COMMENT ON COLUMN notifications.priority IS 'Priority level: low, medium, high, urgent';
COMMENT ON COLUMN notifications.metadata IS 'Additional data stored as JSON, can include action buttons, links, etc.';
COMMENT ON COLUMN notifications.expires_at IS 'Optional expiration date for time-sensitive notifications';
