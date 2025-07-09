-- ====================================================================
-- PROFILES TABLOSU YAPISINI DETAYLI İNCELEME
-- Detailed investigation of profiles table structure
-- ====================================================================

DO $$
BEGIN
  RAISE NOTICE '🔍 PROFILES TABLOSU YAPISINI İNCELEME BAŞLATILIYOR...';
  RAISE NOTICE 'Starting detailed profiles table investigation...';
  RAISE NOTICE '';
END $$;

-- 1. PROFILES TABLOSUNUN VAR OLUP OLMADIĞINI KONTROL ET
DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  RAISE NOTICE '1️⃣  Profiles tablosu varlık kontrolü...';
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE '✅ profiles tablosu mevcut';
  ELSE
    RAISE NOTICE '❌ profiles tablosu bulunamadı!';
  END IF;
END $$;

-- 2. PROFILES TABLOSUNUN TÜM KOLONLARINI LİSTELE
SELECT 
  'PROFILES_COLUMNS' as investigation,
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 3. PROFILES TABLOSUNDAKI VERİ ÖRNEKLERİNİ GÖSTER
SELECT 
  'PROFILES_DATA_SAMPLE' as investigation,
  *
FROM profiles 
LIMIT 3;

-- 4. AUTH.USERS TABLOSUNUN YAPISINI KONTROL ET
SELECT 
  'AUTH_USERS_COLUMNS' as investigation,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'auth' 
  AND table_name = 'users'
  AND column_name IN ('id', 'email', 'raw_user_meta_data', 'user_metadata')
ORDER BY ordinal_position;

-- 5. AUTH.USERS'DAN EMAIL VERİLERİNİ KONTROL ET
SELECT 
  'AUTH_USERS_EMAIL_DATA' as investigation,
  id,
  email,
  raw_user_meta_data->>'full_name' as full_name_from_metadata,
  user_metadata,
  created_at
FROM auth.users 
LIMIT 3;

-- 6. PROFILES VE AUTH.USERS ARASINDA İLİŞKİ VAR MI KONTROL ET
SELECT 
  'PROFILES_AUTH_RELATIONSHIP' as investigation,
  COUNT(p.id) as profiles_count,
  COUNT(au.id) as auth_users_count,
  COUNT(CASE WHEN p.id = au.id THEN 1 END) as matching_ids
FROM profiles p
FULL OUTER JOIN auth.users au ON p.id = au.id;

-- 7. MEVCUT FOREIGN KEY CONSTRAINT'LERİ KONTROL ET
SELECT 
  'PROFILES_CONSTRAINTS' as investigation,
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS referenced_table,
  ccu.column_name AS referenced_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND (tc.table_name = 'profiles' OR ccu.table_name = 'profiles');

-- 8. İNCOMES TABLOSUNUN YAPISINI KONTROL ET
SELECT 
  'INCOMES_COLUMNS' as investigation,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'incomes'
  AND column_name IN ('id', 'user_id', 'created_by', 'name')
ORDER BY ordinal_position;

-- 9. İNCOMES VERİLERİNDEN ÖRNEK
SELECT 
  'INCOMES_DATA_SAMPLE' as investigation,
  id,
  user_id,
  name,
  CASE 
    WHEN user_id IS NOT NULL THEN 'HAS_USER_ID'
    ELSE 'NULL_USER_ID'
  END as user_id_status
FROM incomes 
LIMIT 5;

-- 10. EMAİL VERİSİNİN NEREDE TUTULDUĞUNU BUL
DO $$
DECLARE
  profiles_has_email BOOLEAN;
  auth_users_accessible BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔍 EMAIL VERİSİ LOKASYON ANALİZİ...';
  
  -- Profiles tablosunda email kolonu var mı?
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'email'
  ) INTO profiles_has_email;
  
  -- auth.users tablosuna erişim var mı?
  BEGIN
    PERFORM 1 FROM auth.users LIMIT 1;
    auth_users_accessible := TRUE;
  EXCEPTION 
    WHEN OTHERS THEN
      auth_users_accessible := FALSE;
  END;
  
  RAISE NOTICE 'profiles.email kolonu: %', 
    CASE WHEN profiles_has_email THEN 'VAR' ELSE 'YOK' END;
  RAISE NOTICE 'auth.users erişimi: %', 
    CASE WHEN auth_users_accessible THEN 'VAR' ELSE 'YOK' END;
    
  IF NOT profiles_has_email AND auth_users_accessible THEN
    RAISE NOTICE '💡 ÇÖZÜM: Email verisini auth.users tablosundan almalıyız';
  ELSIF NOT profiles_has_email THEN
    RAISE NOTICE '⚠️  PROBLEM: Email verisi hiçbir erişilebilir yerde yok';
  END IF;
END $$;

-- 11. DOĞRU JOIN SORGUSu TESTÍ
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🧪 DOĞRU JOIN SORGUSU TESTİ...';
END $$;

-- Email için auth.users ile join yaparak test
SELECT 
  'CORRECT_JOIN_TEST' as test,
  i.id as income_id,
  i.name as income_name,
  i.user_id,
  COALESCE(p.full_name, au.raw_user_meta_data->>'full_name', au.email) as user_name,
  au.email as user_email,
  CASE 
    WHEN au.id IS NOT NULL THEN '✅ EMAIL BULUNDU'
    ELSE '❌ EMAIL BULUNAMADI'
  END as email_status
FROM incomes i
LEFT JOIN profiles p ON i.user_id = p.id
LEFT JOIN auth.users au ON i.user_id = au.id
LIMIT 3;

-- 12. PROFILES TABLOSUNA EMAIL KOLONU EKLEMESİ ÖNERİSİ
DO $$
DECLARE
  profiles_has_email BOOLEAN;
  user_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '💡 PROFILES TABLOSU İYİLEŞTİRME ÖNERİLERİ...';
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'email'
  ) INTO profiles_has_email;
  
  SELECT COUNT(*) INTO user_count FROM auth.users;
  
  IF NOT profiles_has_email THEN
    RAISE NOTICE 'ÖNERİ 1: profiles tablosuna email kolonu ekleyin';
    RAISE NOTICE 'ÖNERİ 2: Mevcut % kullanıcının email bilgisini profiles''e kopyalayın', user_count;
    RAISE NOTICE 'ÖNERİ 3: Frontend sorgularını auth.users ile join yapmak için güncelleyin';
  ELSE
    RAISE NOTICE '✅ profiles.email kolonu zaten var, veri senkronizasyonu kontrolü yapın';
  END IF;
END $$;

-- 13. SONUÇ ÖZET
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== PROFILES YAPI ANALİZİ ÖZET ===';
  RAISE NOTICE '';
  RAISE NOTICE 'BULGULAR:';
  RAISE NOTICE '- Yukarıdaki sonuçları inceleyin';
  RAISE NOTICE '- Email verisi lokasyonunu belirleyin';
  RAISE NOTICE '- Uygun çözüm stratejisini seçin';
  RAISE NOTICE '';
  RAISE NOTICE 'MÖJÜLEBILE ÇÖZÜMLER:';
  RAISE NOTICE '1. profiles tablosuna email kolonu ekle';
  RAISE NOTICE '2. Frontend sorgularını auth.users ile join yap';
  RAISE NOTICE '3. profiles-auth.users senkronizasyonu kur';
  RAISE NOTICE '';
  RAISE NOTICE 'ANALİZ TARİHİ: %', NOW();
END $$; 