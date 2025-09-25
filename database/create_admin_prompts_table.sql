-- Create Admin Prompts table for storing custom AI prompts created by administrators
-- This table stores all custom prompts that admins create for the AI system

CREATE TABLE IF NOT EXISTS admin_prompts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prompt_id TEXT NOT NULL UNIQUE, -- Client-side generated ID for tracking
    question TEXT NOT NULL, -- The trigger question/keyword
    answer TEXT NOT NULL, -- The AI response to provide
    category TEXT DEFAULT 'general', -- Category for organization (anxiety, stress, general, etc.)
    created_by TEXT NOT NULL, -- Admin user ID who created this prompt
    created_by_name TEXT, -- Admin user display name
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true, -- Whether this prompt is currently active
    usage_count INTEGER DEFAULT 0, -- Track how often this prompt is used
    tags TEXT[], -- Optional tags for better organization
    priority INTEGER DEFAULT 0 -- Priority level for prompt matching (higher = more priority)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_prompts_created_by ON admin_prompts(created_by);
CREATE INDEX IF NOT EXISTS idx_admin_prompts_category ON admin_prompts(category);
CREATE INDEX IF NOT EXISTS idx_admin_prompts_is_active ON admin_prompts(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_prompts_question ON admin_prompts USING gin(to_tsvector('english', question));
CREATE INDEX IF NOT EXISTS idx_admin_prompts_created_at ON admin_prompts(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_prompts_priority ON admin_prompts(priority DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_prompts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_admin_prompts_updated_at_trigger
    BEFORE UPDATE ON admin_prompts
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_prompts_updated_at();

-- Row Level Security (RLS) policies
ALTER TABLE admin_prompts ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for now (you can restrict based on your auth system)
CREATE POLICY "Allow all operations on admin prompts" ON admin_prompts
    FOR ALL USING (true);

-- Optional: Create a function to search prompts by question similarity
CREATE OR REPLACE FUNCTION search_admin_prompts(search_term TEXT, limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
    id UUID,
    prompt_id TEXT,
    question TEXT,
    answer TEXT,
    category TEXT,
    similarity REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.prompt_id,
        p.question,
        p.answer,
        p.category,
        similarity(p.question, search_term) as similarity
    FROM admin_prompts p
    WHERE p.is_active = true
    AND similarity(p.question, search_term) > 0.1
    ORDER BY similarity DESC, p.priority DESC, p.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Create a view for active prompts with usage statistics
CREATE OR REPLACE VIEW active_admin_prompts AS
SELECT 
    id,
    prompt_id,
    question,
    answer,
    category,
    created_by,
    created_by_name,
    created_at,
    updated_at,
    usage_count,
    tags,
    priority,
    -- Calculate days since creation
    EXTRACT(DAY FROM (NOW() - created_at)) as days_old,
    -- Calculate usage rate (uses per day)
    CASE 
        WHEN EXTRACT(DAY FROM (NOW() - created_at)) > 0 
        THEN usage_count / EXTRACT(DAY FROM (NOW() - created_at))
        ELSE usage_count 
    END as usage_rate
FROM admin_prompts
WHERE is_active = true
ORDER BY priority DESC, usage_rate DESC, created_at DESC;

-- Insert some sample prompts for testing (optional)
INSERT INTO admin_prompts (prompt_id, question, answer, category, created_by, created_by_name, priority) VALUES
('sample_1', 'anxiety', 'I understand you''re feeling anxious. Try the 4-7-8 breathing technique: breathe in for 4 counts, hold for 7, exhale for 8. Remember, this feeling is temporary and you''re not alone.', 'anxiety', 'admin', 'System Admin', 10),
('sample_2', 'stress', 'Stress can be overwhelming, but you can manage it. Try breaking down what''s stressing you into smaller, manageable parts. Take a short walk or do some deep breathing exercises.', 'stress', 'admin', 'System Admin', 10),
('sample_3', 'sad', 'I''m sorry you''re feeling sad. Your emotions are valid, and it''s okay to sit with these feelings. Would you like to talk about what''s making you feel this way? Sometimes sharing helps.', 'emotion', 'admin', 'System Admin', 10),
('sample_4', 'sleep', 'Good sleep is crucial for mental health. Try creating a bedtime routine: no screens 30 minutes before sleep, keep your room cool, dark, and quiet. Consider relaxation techniques like progressive muscle relaxation.', 'wellness', 'admin', 'System Admin', 8),
('sample_5', 'motivation', 'Feeling unmotivated is normal and temporary. Start with one small task you can complete easily. Success builds momentum. Remember your past achievements and why you started this journey.', 'motivation', 'admin', 'System Admin', 8)
ON CONFLICT (prompt_id) DO NOTHING;

-- Grant necessary permissions (adjust based on your RLS setup)
-- GRANT ALL ON admin_prompts TO authenticated;
-- GRANT ALL ON active_admin_prompts TO authenticated;