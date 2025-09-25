-- Run this in your Supabase SQL Editor to fix the "Connect with Psychologist" loading issue

-- Create the experts table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS experts (
    id SERIAL PRIMARY KEY,
    registration_number VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20),
    specialist VARCHAR(100) NOT NULL,
    qualifications TEXT,
    experience_years INTEGER DEFAULT 5,
    bio TEXT,
    profile_image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT true,
    rating DECIMAL(3,2) DEFAULT 4.8,
    total_sessions INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample experts for testing
INSERT INTO experts (
    registration_number,
    password,
    name,
    email,
    phone,
    specialist,
    qualifications,
    experience_years,
    bio,
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
    'Dr. Sarah Johnson specializes in anxiety disorders and depression treatment using evidence-based therapies.',
    4.9
),
(
    'EXP002',
    'password456',
    'Dr. Michael Chen',
    'michael.chen@calmapp.com',
    '+1-555-0102',
    'Stress Management',
    'Masters in Counseling Psychology, Certified Stress Management Consultant',
    6,
    'Dr. Chen helps professionals manage workplace stress and achieve work-life balance.',
    4.8
),
(
    'EXP003',
    'password789',
    'Dr. Priya Patel',
    'priya.patel@calmapp.com',
    '+1-555-0103',
    'Trauma and PTSD',
    'PhD in Clinical Psychology, Certified EMDR Therapist',
    10,
    'Dr. Patel is an expert in trauma recovery and PTSD treatment using specialized techniques.',
    4.9
),
(
    'EXP004',
    'password101',
    'Dr. James Wilson',
    'james.wilson@calmapp.com',
    '+1-555-0104',
    'Youth Mental Health',
    'Masters in Clinical Mental Health Counseling, Certified Adolescent Counselor',
    5,
    'Dr. Wilson focuses on supporting teenagers and young adults with mental health challenges.',
    4.7
),
(
    'EXP005',
    'password202',
    'Dr. Lisa Rodriguez',
    'lisa.rodriguez@calmapp.com',
    '+1-555-0105',
    'Mindfulness and Meditation',
    'PhD in Mindfulness Studies, Certified Mindfulness Teacher',
    7,
    'Dr. Rodriguez teaches mindfulness-based practices for mental wellness and stress reduction.',
    4.8
);

-- Enable Row Level Security (optional, but recommended)
ALTER TABLE experts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow reading expert data
CREATE POLICY "Allow read access to experts" ON experts
    FOR SELECT USING (is_active = true AND is_verified = true);

-- Create policy for authenticated users to manage data (for admin purposes)
CREATE POLICY "Allow full access for authenticated users" ON experts
    FOR ALL USING (auth.role() = 'authenticated');

-- Verify the data was inserted
SELECT
    id,
    name,
    registration_number,
    specialist,
    experience_years,
    rating,
    is_active,
    is_verified
FROM experts
ORDER BY name;
