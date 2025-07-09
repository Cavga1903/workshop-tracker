-- ====================================================================
-- CLIENT MANAGEMENT RLS POLİTİKALARI DÜZELTME
-- Fix RLS policies for Client Management API access
-- ====================================================================

DO $$
BEGIN
  RAISE NOTICE '🔐 CLIENT RLS POLİTİKALARI DÜZELTME BAŞLATILIYOR...';
  RAISE NOTICE 'Fixing Client Management RLS policies...';
  RAISE NOTICE '';
END $$;

-- ====================================================================
-- ADIM 1: MEVCUT RLS POLİTİKALARINI KALDIR
-- ====================================================================

DO $$
BEGIN
  RAISE NOTICE '1️⃣  MEVCUT RLS POLİTİKALARI TEMİZLENİYOR...';
  
  -- Clients tablosundaki tüm politikaları kaldır
  DROP POLICY IF EXISTS "Users can view own clients" ON clients;
  DROP POLICY IF EXISTS "Users can insert own clients" ON clients;
  DROP POLICY IF EXISTS "Users can update own clients" ON clients;
  DROP POLICY IF EXISTS "Users can delete own clients" ON clients;
  DROP POLICY IF EXISTS "Enable read access for authenticated users" ON clients;
  DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON clients;
  DROP POLICY IF EXISTS "Enable update access for authenticated users" ON clients;
  DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON clients;
  
  RAISE NOTICE '✅ Mevcut RLS politikaları temizlendi';
END $$;

-- ====================================================================
-- ADIM 2: RLS'İ ETKINLEŞTIR
-- ====================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '2️⃣  RLS ETKINLEŞTİRME...';
  
  -- Clients tablosunda RLS'i etkinleştir
  ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
  
  RAISE NOTICE '✅ Clients tablosunda RLS etkinleştirildi';
END $$;

-- ====================================================================
-- ADIM 3: YENİ RLS POLİTİKALARI OLUŞTUR
-- ====================================================================

-- READ policy - Authenticated users can read all clients
CREATE POLICY "clients_read_policy" ON clients
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT policy - Authenticated users can insert clients
CREATE POLICY "clients_insert_policy" ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE policy - Users can update clients they created
CREATE POLICY "clients_update_policy" ON clients
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- DELETE policy - Users can delete clients they created
CREATE POLICY "clients_delete_policy" ON clients
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- ====================================================================
-- ADIM 4: PROFILES TABLOSU RLS POLİTİKALARI
-- ====================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '3️⃣  PROFILES RLS POLİTİKALARI KONTROL EDİLİYOR...';
  
  -- Profiles tablosunda RLS'i etkinleştir (eğer değilse)
  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
  
  RAISE NOTICE '✅ Profiles tablosunda RLS etkinleştirildi';
END $$;

-- Profiles READ policy - Authenticated users can read all profiles
DO $$
BEGIN
  -- Mevcut policy varsa kaldır
  DROP POLICY IF EXISTS "profiles_read_policy" ON profiles;
  
  -- Yeni policy oluştur
  CREATE POLICY "profiles_read_policy" ON profiles
    FOR SELECT
    TO authenticated
    USING (true);
    
  RAISE NOTICE '✅ Profiles read policy oluşturuldu';
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE '⚠️  Profiles read policy zaten mevcut';
END $$;

-- ====================================================================
-- ADIM 5: PUBLIC SCHEMA ERİŞİM İZINLERİ
-- ====================================================================

-- Authenticated role'a gerekli izinleri ver
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON clients TO authenticated;
GRANT SELECT ON profiles TO authenticated;

-- ====================================================================
-- ADIM 6: ANON ERİŞİM İZINLERİ (API için)
-- ====================================================================

-- Anon role'a gerekli izinleri ver (Supabase API için)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON clients TO anon;
GRANT SELECT ON profiles TO anon;

-- ====================================================================
-- ADIM 7: RLS POLİTİKA TESTLERİ
-- ====================================================================

-- Mevcut politikaları listele
SELECT 
  '🔍 CLIENTS RLS POLİTİKALARI' as check_name,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'clients'
ORDER BY policyname;

-- Profiles politikalarını listele
SELECT 
  '🔍 PROFILES RLS POLİTİKALARI' as check_name,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'profiles'
ORDER BY policyname;

-- ====================================================================
-- ADIM 8: SAMPLE DATA İLE TEST
-- ====================================================================

-- Eğer client verisi yoksa sample data oluştur
DO $$
DECLARE
  client_count INTEGER;
  profile_count INTEGER;
  first_profile_id UUID;
BEGIN
  SELECT COUNT(*) INTO client_count FROM clients;
  SELECT COUNT(*) INTO profile_count FROM profiles;
  
  RAISE NOTICE '';
  RAISE NOTICE '4️⃣  SAMPLE DATA KONTROL...';
  RAISE NOTICE '   - Clients: % kayıt', client_count;
  RAISE NOTICE '   - Profiles: % kayıt', profile_count;
  
  -- Eğer profiles varsa ama clients yoksa sample data oluştur
  IF profile_count > 0 AND client_count = 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '💡 SAMPLE CLIENT OLUŞTURULUYOR...';
    
    -- İlk profile'ı al
    SELECT id INTO first_profile_id FROM profiles ORDER BY created_at ASC LIMIT 1;
    
    -- Sample clients oluştur
    INSERT INTO clients (full_name, email, phone, created_by, company, address, notes)
    VALUES 
      ('Sarah Johnson', 'sarah.johnson@email.com', '+1 (555) 123-4567', first_profile_id, 'Art Studio Inc', '123 Main St, City', 'Regular pottery class attendee'),
      ('Michael Chen', 'michael.chen@email.com', '+1 (555) 987-6543', first_profile_id, 'Creative Co', '456 Oak Ave, Town', 'Interested in painting workshops'),
      ('Emily Rodriguez', 'emily.rodriguez@email.com', '+1 (555) 456-7890', first_profile_id, 'Freelance', '789 Pine Rd, Village', 'Digital art enthusiast'),
      ('David Kim', 'david.kim@email.com', '+1 (555) 234-5678', first_profile_id, 'Design House', '321 Elm St, County', 'Ceramic art workshops'),
      ('Lisa Thompson', 'lisa.thompson@email.com', '+1 (555) 345-6789', first_profile_id, 'Self-employed', '654 Maple Ave, District', 'Mixed media artist');
    
    RAISE NOTICE '✅ 5 sample client oluşturuldu';
  ELSE
    RAISE NOTICE '✅ Client verisi zaten mevcut';
  END IF;
END $$;

-- ====================================================================
-- ADIM 9: SON KONTROL VE DOĞRULAMA
-- ====================================================================

-- API sorgusu test et
SELECT 
  '🎯 API SORGU TESTİ' as test_name,
  c.id,
  c.full_name,
  c.email,
  c.phone,
  c.company,
  c.created_at,
  c.created_by,
  p.full_name as creator_name,
  p.email as creator_email
FROM clients c
LEFT JOIN profiles p ON c.created_by = p.id
ORDER BY c.created_at DESC
LIMIT 5;

-- Tablo erişim izinlerini kontrol et
SELECT 
  '🔐 TABLO ERİŞİM İZINLERİ' as check_name,
  schemaname,
  tablename,
  tableowner,
  hasselect,
  hasinsert,
  hasupdate,
  hasdelete
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('clients', 'profiles');

-- ====================================================================
-- FINAL ÖZET
-- ====================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== CLIENT MANAGEMENT RLS DÜZELTME ÖZET ===';
  RAISE NOTICE '';
  RAISE NOTICE 'YAPILAN İYİLEŞTİRMELER:';
  RAISE NOTICE '✅ Clients tablosunda RLS etkinleştirildi';
  RAISE NOTICE '✅ 4 adet RLS policy oluşturuldu:';
  RAISE NOTICE '   - clients_read_policy (tüm authenticated users)';
  RAISE NOTICE '   - clients_insert_policy (authenticated users)';
  RAISE NOTICE '   - clients_update_policy (sadece creator)';
  RAISE NOTICE '   - clients_delete_policy (sadece creator)';
  RAISE NOTICE '✅ Profiles tablosunda read policy oluşturuldu';
  RAISE NOTICE '✅ Authenticated ve anon role izinleri verildi';
  RAISE NOTICE '✅ Sample data oluşturuldu (gerekirse)';
  RAISE NOTICE '';
  RAISE NOTICE 'SONRAKİ ADIMLAR:';
  RAISE NOTICE '1. Frontend''i yenileyin (Ctrl+F5)';
  RAISE NOTICE '2. Browser console''daki hataları kontrol edin';
  RAISE NOTICE '3. Network tab''ta API isteklerini kontrol edin';
  RAISE NOTICE '4. Client Management sayfasını test edin';
  RAISE NOTICE '';
  RAISE NOTICE 'Düzeltme tarihi: %', NOW();
END $$; 