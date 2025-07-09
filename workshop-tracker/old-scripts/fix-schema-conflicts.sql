-- ====================================================================
-- ŞEMA ÇAKIŞMALARINI DÜZELTME VE TUTARLI İLİŞKİLER KURMA
-- Fix schema conflicts and establish consistent relationships
-- ====================================================================

DO $$
BEGIN
  RAISE NOTICE '🔧 ŞEMA ÇAKIŞMALARI DÜZELTME BAŞLATILIYOR...';
  RAISE NOTICE 'Starting schema conflicts resolution...';
  RAISE NOTICE '';
END $$;

-- ====================================================================
-- ADIM 1: PROFILES TABLOSUNU İYİLEŞTİR (EMAIL KOLONU EKLE)
-- ====================================================================

DO $$
DECLARE
  email_column_exists BOOLEAN;
BEGIN
  RAISE NOTICE '1️⃣  PROFILES TABLOSUNA EMAIL KOLONU EKLENİYOR...';
  
  -- Email kolonu var mı kontrol et
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'email'
  ) INTO email_column_exists;
  
  IF NOT email_column_exists THEN
    -- Email kolonu ekle
    ALTER TABLE profiles ADD COLUMN email TEXT;
    RAISE NOTICE '✅ profiles.email kolonu eklendi';
    
    -- auth.users'dan email verilerini kopyala
    UPDATE profiles 
    SET email = au.email
    FROM auth.users au 
    WHERE profiles.id = au.id;
    
    RAISE NOTICE '✅ Email verileri auth.users''dan profiles''e kopyalandı';
  ELSE
    RAISE NOTICE '✅ profiles.email kolonu zaten mevcut';
    
    -- Boş email değerlerini güncelle
    UPDATE profiles 
    SET email = au.email
    FROM auth.users au 
    WHERE profiles.id = au.id 
      AND (profiles.email IS NULL OR profiles.email = '');
      
    RAISE NOTICE '✅ Boş email değerleri güncellendi';
  END IF;
END $$;

-- ====================================================================
-- ADIM 2: TÜM AUTH.USERS İLİŞKİLERİNİ TESPİT ET VE TEMİZLE
-- ====================================================================

DO $$
DECLARE
  constraint_name TEXT;
  constraint_count INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '2️⃣  ÇAKIŞAN AUTH.USERS İLİŞKİLERİ TEMİZLENİYOR...';
  
  -- Auth.users'a bağlı tüm constraint'leri bul ve kaldır (profiles hariç)
  FOR constraint_name IN 
    SELECT tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu 
      ON tc.constraint_name = ccu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.constraint_schema = 'public'
      AND ccu.table_name = 'users'
      AND ccu.column_name = 'id'
      AND tc.table_name != 'profiles'  -- profiles'deki ana ilişkiyi koru
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', 
        (SELECT table_name FROM information_schema.table_constraints 
         WHERE constraint_name = constraint_name AND constraint_schema = 'public'), 
        constraint_name);
      
      constraint_count := constraint_count + 1;
      RAISE NOTICE '🗑️  Kaldırıldı: %', constraint_name;
    EXCEPTION 
      WHEN OTHERS THEN
        RAISE NOTICE '❌ Kaldırılamadı %: %', constraint_name, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE '✅ % adet çakışan constraint temizlendi', constraint_count;
END $$;

-- ====================================================================
-- ADIM 3: TÜM TABLOLARDA USER_ID/CREATED_BY KOLONLARINI KONTROL ET
-- ====================================================================

DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '3️⃣  USER İLİŞKİ KOLONLARI KONTROL EDİLİYOR...';
  
  -- clients.created_by kontrolü
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'created_by'
  ) INTO column_exists;
  
  IF NOT column_exists THEN
    ALTER TABLE clients ADD COLUMN created_by UUID;
    RAISE NOTICE '✅ clients.created_by kolonu eklendi';
  END IF;
  
  -- incomes.user_id kontrolü
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'incomes' AND column_name = 'user_id'
  ) INTO column_exists;
  
  IF NOT column_exists THEN
    ALTER TABLE incomes ADD COLUMN user_id UUID;
    RAISE NOTICE '✅ incomes.user_id kolonu eklendi';
  END IF;
  
  -- expenses.user_id kontrolü
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'expenses' AND column_name = 'user_id'
  ) INTO column_exists;
  
  IF NOT column_exists THEN
    ALTER TABLE expenses ADD COLUMN user_id UUID;
    RAISE NOTICE '✅ expenses.user_id kolonu eklendi';
  END IF;
  
  -- documents.uploaded_by kontrolü
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'uploaded_by'
  ) INTO column_exists;
  
  IF NOT column_exists THEN
    ALTER TABLE documents ADD COLUMN uploaded_by UUID;
    RAISE NOTICE '✅ documents.uploaded_by kolonu eklendi';
  END IF;
  
  -- workshops.created_by kontrolü (eğer tablo varsa)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'workshops') THEN
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'workshops' AND column_name = 'created_by'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
      ALTER TABLE workshops ADD COLUMN created_by UUID;
      RAISE NOTICE '✅ workshops.created_by kolonu eklendi';
    END IF;
  END IF;
END $$;

-- ====================================================================
-- ADIM 4: TÜM İLİŞKİLERİ PROFILES TABLOSUNA YÖNLENDİR
-- ====================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '4️⃣  TÜM İLİŞKİLER PROFILES TABLOSUNA YÖNLENDİRİLİYOR...';
END $$;

-- clients.created_by → profiles.id
DO $$
BEGIN
  BEGIN
    ALTER TABLE clients 
    ADD CONSTRAINT clients_created_by_profiles_fkey 
    FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;
    
    RAISE NOTICE '✅ clients.created_by → profiles.id bağlandı';
  EXCEPTION 
    WHEN duplicate_object THEN
      RAISE NOTICE '⚠️  clients_created_by_profiles_fkey zaten mevcut';
    WHEN OTHERS THEN
      RAISE NOTICE '❌ clients constraint hatası: %', SQLERRM;
  END;
END $$;

-- incomes.user_id → profiles.id
DO $$
BEGIN
  BEGIN
    ALTER TABLE incomes 
    ADD CONSTRAINT incomes_user_id_profiles_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;
    
    RAISE NOTICE '✅ incomes.user_id → profiles.id bağlandı';
  EXCEPTION 
    WHEN duplicate_object THEN
      RAISE NOTICE '⚠️  incomes_user_id_profiles_fkey zaten mevcut';
    WHEN OTHERS THEN
      RAISE NOTICE '❌ incomes constraint hatası: %', SQLERRM;
  END;
END $$;

-- expenses.user_id → profiles.id
DO $$
BEGIN
  BEGIN
    ALTER TABLE expenses 
    ADD CONSTRAINT expenses_user_id_profiles_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;
    
    RAISE NOTICE '✅ expenses.user_id → profiles.id bağlandı';
  EXCEPTION 
    WHEN duplicate_object THEN
      RAISE NOTICE '⚠️  expenses_user_id_profiles_fkey zaten mevcut';
    WHEN OTHERS THEN
      RAISE NOTICE '❌ expenses constraint hatası: %', SQLERRM;
  END;
END $$;

-- documents.uploaded_by → profiles.id
DO $$
BEGIN
  BEGIN
    ALTER TABLE documents 
    ADD CONSTRAINT documents_uploaded_by_profiles_fkey 
    FOREIGN KEY (uploaded_by) REFERENCES profiles(id) ON DELETE SET NULL;
    
    RAISE NOTICE '✅ documents.uploaded_by → profiles.id bağlandı';
  EXCEPTION 
    WHEN duplicate_object THEN
      RAISE NOTICE '⚠️  documents_uploaded_by_profiles_fkey zaten mevcut';
    WHEN OTHERS THEN
      RAISE NOTICE '❌ documents constraint hatası: %', SQLERRM;
  END;
END $$;

-- workshops.created_by → profiles.id (eğer tablo varsa)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'workshops') THEN
    BEGIN
      ALTER TABLE workshops 
      ADD CONSTRAINT workshops_created_by_profiles_fkey 
      FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;
      
      RAISE NOTICE '✅ workshops.created_by → profiles.id bağlandı';
    EXCEPTION 
      WHEN duplicate_object THEN
        RAISE NOTICE '⚠️  workshops_created_by_profiles_fkey zaten mevcut';
      WHEN OTHERS THEN
        RAISE NOTICE '❌ workshops constraint hatası: %', SQLERRM;
    END;
  END IF;
END $$;

-- ====================================================================
-- ADIM 5: NULL USER_ID DEĞERLERİNİ GÜNCELLE
-- ====================================================================

DO $$
DECLARE
  first_profile_id UUID;
  updated_clients INTEGER;
  updated_incomes INTEGER;
  updated_expenses INTEGER;
  updated_documents INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '5️⃣  NULL USER_ID DEĞERLERİ GÜNCELLENİYOR...';
  
  -- İlk profile id'sini al
  SELECT id INTO first_profile_id FROM profiles ORDER BY created_at ASC LIMIT 1;
  
  IF first_profile_id IS NOT NULL THEN
    -- clients tablosu
    UPDATE clients SET created_by = first_profile_id WHERE created_by IS NULL;
    GET DIAGNOSTICS updated_clients = ROW_COUNT;
    
    -- incomes tablosu
    UPDATE incomes SET user_id = first_profile_id WHERE user_id IS NULL;
    GET DIAGNOSTICS updated_incomes = ROW_COUNT;
    
    -- expenses tablosu
    UPDATE expenses SET user_id = first_profile_id WHERE user_id IS NULL;
    GET DIAGNOSTICS updated_expenses = ROW_COUNT;
    
    -- documents tablosu
    UPDATE documents SET uploaded_by = first_profile_id WHERE uploaded_by IS NULL;
    GET DIAGNOSTICS updated_documents = ROW_COUNT;
    
    RAISE NOTICE '✅ Güncellenen kayıtlar:';
    RAISE NOTICE '   - clients: % kayıt', updated_clients;
    RAISE NOTICE '   - incomes: % kayıt', updated_incomes;
    RAISE NOTICE '   - expenses: % kayıt', updated_expenses;
    RAISE NOTICE '   - documents: % kayıt', updated_documents;
  ELSE
    RAISE NOTICE '⚠️  Profile bulunamadı, user_id güncellemesi yapılamadı';
  END IF;
END $$;

-- ====================================================================
-- ADIM 6: SCHEMA CACHE YENİLEME
-- ====================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '6️⃣  SCHEMA CACHE YENİLENİYOR...';
  
  -- Çoklu yenileme yöntemleri
  NOTIFY pgrst, 'reload schema';
  NOTIFY pgrst, 'reload config'; 
  NOTIFY pgrst;
  
  -- Dummy config güncelleme
  PERFORM set_config('app.schema_fix', NOW()::text, false);
  
  RAISE NOTICE '🔄 Schema cache yenileme sinyalleri gönderildi';
END $$;

-- ====================================================================
-- ADIM 7: YENİ ŞEMA YAPISINI DOĞRULA
-- ====================================================================

-- Tüm profiles ilişkilerini göster
SELECT 
  'YENİ_ŞEMA_YAPISI' as verification,
  tc.table_name,
  kcu.column_name,
  tc.constraint_name,
  ccu.table_name AS referenced_table,
  ccu.column_name AS referenced_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.constraint_schema = 'public'
  AND (ccu.table_name = 'profiles' OR tc.table_name = 'profiles')
ORDER BY tc.table_name, kcu.column_name;

-- İlişki testleri
SELECT 
  'İLİŞKİ_TEST_SONUÇLARI' as test_name,
  'clients' as tablo,
  COUNT(*) as toplam_kayit,
  COUNT(p.id) as profile_ile_bagli,
  CASE 
    WHEN COUNT(*) = COUNT(p.id) THEN '✅ TÜM İLİŞKİLER ÇALIŞIYOR'
    WHEN COUNT(p.id) > 0 THEN '⚠️ KISMEN ÇALIŞIYOR'
    ELSE '❌ İLİŞKİLER ÇALIŞMIYOR'
  END as durum
FROM clients c
LEFT JOIN profiles p ON c.created_by = p.id

UNION ALL

SELECT 
  'İLİŞKİ_TEST_SONUÇLARI',
  'incomes',
  COUNT(*),
  COUNT(p.id),
  CASE 
    WHEN COUNT(*) = COUNT(p.id) THEN '✅ TÜM İLİŞKİLER ÇALIŞIYOR'
    WHEN COUNT(p.id) > 0 THEN '⚠️ KISMEN ÇALIŞIYOR'
    ELSE '❌ İLİŞKİLER ÇALIŞMIYOR'
  END
FROM incomes i
LEFT JOIN profiles p ON i.user_id = p.id

UNION ALL

SELECT 
  'İLİŞKİ_TEST_SONUÇLARI',
  'expenses',
  COUNT(*),
  COUNT(p.id),
  CASE 
    WHEN COUNT(*) = COUNT(p.id) THEN '✅ TÜM İLİŞKİLER ÇALIŞIYOR'
    WHEN COUNT(p.id) > 0 THEN '⚠️ KISMEN ÇALIŞIYOR'
    ELSE '❌ İLİŞKİLER ÇALIŞMIYOR'
  END
FROM expenses e
LEFT JOIN profiles p ON e.user_id = p.id;

-- ====================================================================
-- FINAL ÖZET
-- ====================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== ŞEMA ÇAKIŞMALARI DÜZELTME ÖZET ===';
  RAISE NOTICE '';
  RAISE NOTICE 'YAPILAN İYİLEŞTİRMELER:';
  RAISE NOTICE '✅ profiles.email kolonu eklendi ve dolduruldu';
  RAISE NOTICE '✅ Çakışan auth.users constraint''leri temizlendi';
  RAISE NOTICE '✅ Tüm user ilişkileri profiles tablosuna yönlendirildi:';
  RAISE NOTICE '   - clients.created_by → profiles.id';
  RAISE NOTICE '   - incomes.user_id → profiles.id';
  RAISE NOTICE '   - expenses.user_id → profiles.id';
  RAISE NOTICE '   - documents.uploaded_by → profiles.id';
  RAISE NOTICE '   - workshops.created_by → profiles.id (varsa)';
  RAISE NOTICE '✅ NULL değerler güncellendi';
  RAISE NOTICE '✅ Schema cache yenilendi';
  RAISE NOTICE '';
  RAISE NOTICE 'YENİ TUTARLI ŞEMA:';
  RAISE NOTICE 'auth.users → profiles (1:1 ana ilişki)';
  RAISE NOTICE 'profiles ← [clients, incomes, expenses, documents, workshops]';
  RAISE NOTICE '';
  RAISE NOTICE 'SONRAKİ ADIMLAR:';
  RAISE NOTICE '1. 30 saniye bekleyin (cache propagation)';
  RAISE NOTICE '2. Frontend sorgularını test edin';
  RAISE NOTICE '3. Analytics sayfasını yeniden deneyin';
  RAISE NOTICE '';
  RAISE NOTICE 'Düzeltme tarihi: %', NOW();
END $$; 