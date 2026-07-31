-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Events Table
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    event_type TEXT,
    max_guests INT DEFAULT 50 NOT NULL,
    cover_image_url TEXT,
    price INT,
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- 2. Guests Table
CREATE TABLE IF NOT EXISTS public.guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    guest_name TEXT NOT NULL,
    remaining_shots INT DEFAULT 12 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Photos Table
CREATE TABLE IF NOT EXISTS public.photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_id UUID NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    filter_used TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Storage Bucket Configuration
INSERT INTO storage.buckets (id, name, public)
VALUES ('raw_photos', 'raw_photos', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Row Level Security (RLS) for Storage
-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to prevent conflicts
DROP POLICY IF EXISTS "Allow public insert to raw_photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public select from raw_photos" ON storage.objects;

-- Allow public users (including anonymous guest uploads) to insert (upload) raw_photos
CREATE POLICY "Allow public insert to raw_photos" ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'raw_photos');

-- Allow public users to select (download/view) raw_photos
CREATE POLICY "Allow public select from raw_photos" ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'raw_photos');

-- Disable RLS on application data tables to ensure frictionless anonymous guest access
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos DISABLE ROW LEVEL SECURITY;
