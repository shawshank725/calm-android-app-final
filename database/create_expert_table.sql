-- Create expert table for CALM Android App
-- This table stores information about mental health experts/counselors

CREATE TABLE IF NOT EXISTS expert (
    id SERIAL PRIMARY KEY,
    registration_number VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20),
    specialist VARCHAR(100) NOT NULL,
    qualifications TEXT,
    experience_years INTEGER,
    bio TEXT,
    profile_image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    rating DECIMAL(3,2) DEFAULT 4.5,
    total_sessions INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_expert_registration_number ON expert(registration_number);
CREATE INDEX IF NOT EXISTS idx_expert_email ON expert(email);
CREATE INDEX IF NOT EXISTS idx_expert_specialist ON expert(specialist);
CREATE INDEX IF NOT EXISTS idx_expert_is_active ON expert(is_active);
CREATE INDEX IF NOT EXISTS idx_expert_is_verified ON expert(is_verified);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_expert_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_expert_updated_at
    BEFORE UPDATE ON expert
    FOR EACH ROW
    EXECUTE FUNCTION update_expert_updated_at();

-- Insert sample data for testing
INSERT INTO expert (
    registration_number,
    password,
    name,
    email,
    phone,
    specialist,
    qualifications,
    experience_years,
    bio,
    is_active,
    is_verified,
    rating
) VALUES
(
    'EXP001',
    'password123',
    'Dr. Sarah Johnson',
    'sarah.johnson@calmapp.com',
    '+1-555-0101',
    'Anxiety and Depression',
    'PhD in Clinical Psychology, Licensed Professional Counselor',
    8,
    'Dr. Sarah Johnson specializes in anxiety disorders and depression treatment.',
    true,
    true,
    4.9
),
(
    'EXP002',
    'securepass456',
    'Dr. Michael Chen',
    'michael.chen@calmapp.com',
    '+1-555-0102',
    'Stress Management',
    'Masters in Counseling Psychology, Certified Stress Management Consultant',
    6,
    'Dr. Chen helps professionals manage workplace stress and achieve work-life balance.',
    true,
    true,
    4.8
),
(
    'EXP003',
    'expert789',
    'Dr. Priya Patel',
    'priya.patel@calmapp.com',
    '+1-555-0103',
    'Trauma and PTSD',
    'PhD in Clinical Psychology, Certified EMDR Therapist',
    10,
    'Dr. Patel is an expert in trauma recovery and PTSD treatment.',
    true,
    true,
    4.9
);

-- Enable Row Level Security (RLS)
ALTER TABLE expert ENABLE ROW LEVEL SECURITY;

-- Create policies for expert table
CREATE POLICY "Experts can view own data" ON expert
    FOR SELECT USING (auth.uid()::text = registration_number);

CREATE POLICY "Public can view active verified experts" ON expert
    FOR SELECT USING (is_active = true AND is_verified = true);

CREATE POLICY "Authenticated users can manage experts" ON expert
    FOR ALL USING (auth.role() = 'authenticated');

-- Comments for documentation
COMMENT ON TABLE expert IS 'Stores information about mental health experts and counselors';
COMMENT ON COLUMN expert.registration_number IS 'Unique registration number for the expert';
COMMENT ON COLUMN expert.specialist IS 'Area of specialization';
COMMENT ON COLUMN expert.is_verified IS 'Whether the expert has been verified by admin';
COMMENT ON COLUMN expert.rating IS 'Average rating from 0.00 to 5.00';
