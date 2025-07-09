-- ====================================================================
-- CLIENT MANAGEMENT DEBUG - API HATALARI ÇÖZÜMÜ
-- Debug script for Client Management API errors
-- ====================================================================

DO $$
BEGIN
  RAISE NOTICE '🐛 CLIENT MANAGEMENT DEBUG BAŞLATILIYOR...';
  RAISE NOTICE 'Debugging Client Management API errors...';
  RAISE NOTICE '';
END $$;

-- ====================================================================
-- ADIM 1: CLIENTS TABLOSU İLİŞKİLERİNİ KONTROL ET
-- ====================================================================

-- Clients tablosunu kontrol et
SELECT 
  '🔍 CLIENTS TABLO YAPISI' as check_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'clients'
ORDER BY ordinal_position;

-- Clients constraint'lerini kontrol et
SELECT 
  '🔗 CLIENTS CONSTRAINT'LERİ' as check_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS referenced_table,
  ccu.column_name AS referenced_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu 
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_schema = 'public' 
  AND tc.table_name = 'clients'
ORDER BY tc.constraint_type, tc.constraint_name;

-- ====================================================================
-- ADIM 2: RLS POLİTİKALARINI KONTROL ET
-- ====================================================================

-- Clients tablosu RLS politikalarını kontrol et
SELECT 
  '🔐 CLIENTS RLS POLİTİKALARI' as check_name,
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
  AND tablename = 'clients';

-- Profiles tablosu RLS politikalarını kontrol et
SELECT 
  '🔐 PROFILES RLS POLİTİKALARI' as check_name,
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
  AND tablename = 'profiles';

-- ====================================================================
-- ADIM 3: MEVCUT VERİLERİ KONTROL ET
-- ====================================================================

-- Clients tablosundaki verileri kontrol et
SELECT 
  '📊 CLIENTS VERİLERİ' as check_name,
  COUNT(*) as toplam_client,
  COUNT(created_by) as created_by_dolu,
  COUNT(CASE WHEN created_by IS NULL THEN 1 END) as created_by_null,
  COUNT(DISTINCT created_by) as unique_creators
FROM clients;

-- Profiles tablosundaki verileri kontrol et
SELECT 
  '📊 PROFILES VERİLERİ' as check_name,
  COUNT(*) as toplam_profile,
  COUNT(full_name) as full_name_dolu,
  COUNT(email) as email_dolu,
  COUNT(CASE WHEN full_name IS NULL THEN 1 END) as full_name_null
FROM profiles;

-- ====================================================================
-- ADIM 4: JOIN İLİŞKİSİNİ TEST ET
-- ====================================================================

-- Client-Profile ilişkisini test et (frontend'in yaptığı sorgu)
SELECT 
  '🔄 CLIENT-PROFILE JOIN TESTİ' as test_name,
  c.id as client_id,
  c.full_name as client_name,
  c.email as client_email,
  c.created_by,
  p.id as profile_id,
  p.full_name as creator_name,
  p.email as creator_email,
  CASE 
    WHEN p.id IS NOT NULL THEN '✅ JOIN BAŞARILI'
    ELSE '❌ JOIN BAŞARISIZ'
  END as join_status
FROM clients c
LEFT JOIN profiles p ON c.created_by = p.id
ORDER BY c.created_at DESC
LIMIT 5;

-- ====================================================================
-- ADIM 5: API SORGU SİMÜLASYONU
-- ====================================================================

-- Frontend'in yaptığı sorguyu simüle et
WITH client_data AS (
  SELECT 
    c.*,
    p.full_name as creator_full_name,
    p.email as creator_email
  FROM clients c
  LEFT JOIN profiles p ON c.created_by = p.id
  ORDER BY c.created_at DESC
)
SELECT 
  '🎯 API SORGU SİMÜLASYONU' as simulation,
  COUNT(*) as total_records,
  COUNT(CASE WHEN creator_full_name IS NOT NULL THEN 1 END) as with_creator_info,
  COUNT(CASE WHEN creator_full_name IS NULL THEN 1 END) as without_creator_info,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ VERİ MEVCUT'
    ELSE '❌ VERİ YOK'
  END as data_status
FROM client_data;

-- ====================================================================
-- ADIM 6: POTANSIYEL ÇÖZÜMLER
-- ====================================================================

-- RLS açık mı kontrol et
SELECT 
  '🔐 RLS DURUMU' as check_name,
  schemaname,
  tablename,
  rowsecurity,
  CASE 
    WHEN rowsecurity THEN '🔒 RLS AÇIK'
    ELSE '🔓 RLS KAPALI'
  END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('clients', 'profiles');

-- ====================================================================
-- ADIM 7: SAMPLE DATA KONTROL
-- ====================================================================

-- Eğer veri yoksa sample data oluştur
DO $$
DECLARE
  client_count INTEGER;
  profile_count INTEGER;
  first_profile_id UUID;
BEGIN
  -- Mevcut veri sayısını kontrol et
  SELECT COUNT(*) INTO client_count FROM clients;
  SELECT COUNT(*) INTO profile_count FROM profiles;
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 MEVCUT VERİ DURUMU:';
  RAISE NOTICE '   - Clients: % kayıt', client_count;
  RAISE NOTICE '   - Profiles: % kayıt', profile_count;
  
  -- Eğer profiles varsa ama clients yoksa sample data oluştur
  IF profile_count > 0 AND client_count = 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '💡 SAMPLE CLIENT OLUŞTURULUYOR...';
    
    -- İlk profile'ı al
    SELECT id INTO first_profile_id FROM profiles ORDER BY created_at ASC LIMIT 1;
    
    -- Sample client oluştur
    INSERT INTO clients (full_name, email, phone, created_by, company, address, notes)
    VALUES 
      ('Sarah Johnson', 'sarah.johnson@email.com', '+1 (555) 123-4567', first_profile_id, 'Art Studio Inc', '123 Main St, City', 'Regular pottery class attendee'),
      ('Michael Chen', 'michael.chen@email.com', '+1 (555) 987-6543', first_profile_id, 'Creative Co', '456 Oak Ave, Town', 'Interested in painting workshops'),
      ('Emily Rodriguez', 'emily.rodriguez@email.com', '+1 (555) 456-7890', first_profile_id, 'Freelance', '789 Pine Rd, Village', 'Digital art enthusiast');
    
    RAISE NOTICE '✅ 3 sample client oluşturuldu';
  END IF;
END $$;

-- ====================================================================
-- ADIM 8: HATA ÇÖZÜM ÖNERİLERİ
-- ====================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== CLIENT MANAGEMENT HATA ÇÖZÜM ÖNERİLERİ ===';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 POTANSIYEL ÇÖZÜMLER:';
  RAISE NOTICE '1. RLS politikalarını kontrol edin';
  RAISE NOTICE '2. Auth token''ın geçerli olduğundan emin olun';
  RAISE NOTICE '3. Supabase client konfigürasyonunu kontrol edin';
  RAISE NOTICE '4. Browser console''da detaylı hata mesajlarını inceleyin';
  RAISE NOTICE '5. Network tab''ta failed request''leri kontrol edin';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 FRONTEND KONTROL LİSTESİ:';
  RAISE NOTICE '- Auth context''in user ve profile bilgilerini doğru yüklediğini kontrol edin';
  RAISE NOTICE '- Supabase client''ın doğru URL ve anon key ile yapılandırıldığını kontrol edin';
  RAISE NOTICE '- Browser''da localStorage''da auth token''ın olduğunu kontrol edin';
  RAISE NOTICE '';
  RAISE NOTICE 'Debug tarihi: %', NOW();
END $$;

-- Son kontrol: En basit client sorgusu
SELECT 
  '🎯 BASIT CLIENT SORGUSU' as final_test,
  id,
  full_name,
  email,
  created_at,
  created_by
FROM clients 
ORDER BY created_at DESC 
LIMIT 3; 