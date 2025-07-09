-- Add missing fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Add unique constraint to username
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_username_unique UNIQUE (username);

-- Update existing profiles to have updated_at
UPDATE public.profiles 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- Create or update storage bucket for avatars
DO $$ 
BEGIN
    -- Check if avatars bucket exists
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars') THEN
        -- Create avatars bucket
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'avatars',
            'avatars',
            true,
            5242880, -- 5MB limit
            ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp']
        );
        
        RAISE NOTICE 'Created avatars storage bucket';
    ELSE
        RAISE NOTICE 'Avatars bucket already exists';
    END IF;
END $$;

-- Storage policies for avatars bucket
DO $$ 
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
    DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
    
    -- Create new policies
    CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
        FOR SELECT USING (bucket_id = 'avatars');

    CREATE POLICY "Users can upload their own avatar" ON storage.objects
        FOR INSERT WITH CHECK (
            bucket_id = 'avatars' AND 
            auth.uid() IS NOT NULL
        );

    CREATE POLICY "Users can update their own avatar" ON storage.objects
        FOR UPDATE USING (
            bucket_id = 'avatars' AND 
            auth.uid() IS NOT NULL
        );

    CREATE POLICY "Users can delete their own avatar" ON storage.objects
        FOR DELETE USING (
            bucket_id = 'avatars' AND 
            auth.uid() IS NOT NULL
        );
    
    RAISE NOTICE 'Created storage policies for avatars bucket';
END $$;

-- Update trigger for profiles updated_at
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at_trigger ON public.profiles;
CREATE TRIGGER update_profiles_updated_at_trigger
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_profiles_updated_at();

-- Final success message
DO $$ 
BEGIN
    RAISE NOTICE 'Profile schema fixes completed!';
    RAISE NOTICE 'Added: updated_at field, username unique constraint, avatars bucket';
END $$; 