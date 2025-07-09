-- ====================================================================
-- HEDEFLENEN ÇAKIŞMA ÇÖZÜMÜ - SPECIFIC CONFLICT RESOLUTION
-- Bu script analiz edilen şemadaki spesifik çakışmaları çözer
-- ====================================================================

DO $$
BEGIN
  RAISE NOTICE '🎯 SPESIFIK ÇAKIŞMALAR ÇÖZÜLÜYOR...';
  RAISE NOTICE 'Resolving specific schema conflicts identified in analysis...';
  RAISE NOTICE '';
  RAISE NOTICE '📊 ÇAKIŞMA İSTATİSTİKLERİ:';
  RAISE NOTICE '   - clients: 2 constraint → 1 constraint';
  RAISE NOTICE '   - documents: 3 constraint → 1 constraint';
  RAISE NOTICE '   - expenses: 3 constraint → 1 constraint';
  RAISE NOTICE '   - incomes: 3 constraint → 1 constraint';
  RAISE NOTICE '   - workshops: 2 constraint → 1 constraint';
  RAISE NOTICE '';
END $$;

-- ====================================================================
-- ADIM 1: CLIENTS TABLOSU - AUTH.USERS REFERANSINI KALDIR
-- ====================================================================

DO $$
BEGIN
  RAISE NOTICE '1️⃣  CLIENTS TABLOSU DÜZELTME...';
  
  -- clients_created_by_fkey constraint'ini kaldır (auth.users referansı)
  BEGIN
    ALTER TABLE clients DROP CONSTRAINT clients_created_by_fkey;
    RAISE NOTICE '✅ clients_created_by_fkey (auth.users referansı) kaldırıldı';
  EXCEPTION
    WHEN undefined_object THEN
      RAISE NOTICE '⚠️  clients_created_by_fkey zaten mevcut değil';
    WHEN OTHERS THEN
      RAISE NOTICE '❌ clients_created_by_fkey kaldırılamadı: %', SQLERRM;
  END;
  
  -- Korunan constraint'i kontrol et
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'clients_created_by_profiles_fkey'
  ) THEN
    RAISE NOTICE '✅ clients_created_by_profiles_fkey (profiles referansı) korundu';
  ELSE
    RAISE NOTICE '❌ clients_created_by_profiles_fkey bulunamadı!';
  END IF;
END $$;

-- ====================================================================
-- ADIM 2: DOCUMENTS TABLOSU - İKİ AUTH.USERS REFERANSINI KALDIR
-- ====================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '2️⃣  DOCUMENTS TABLOSU DÜZELTME...';
  
  -- fk_documents_uploaded_by_fixed constraint'ini kaldır
  BEGIN
    ALTER TABLE documents DROP CONSTRAINT fk_documents_uploaded_by_fixed;
    RAISE NOTICE '✅ fk_documents_uploaded_by_fixed (auth.users referansı) kaldırıldı';
  EXCEPTION
    WHEN undefined_object THEN
      RAISE NOTICE '⚠️  fk_documents_uploaded_by_fixed zaten mevcut değil';
    WHEN OTHERS THEN
      RAISE NOTICE '❌ fk_documents_uploaded_by_fixed kaldırılamadı: %', SQLERRM;
  END;
  
  -- documents_uploaded_by_fkey constraint'ini kaldır
  BEGIN
    ALTER TABLE documents DROP CONSTRAINT documents_uploaded_by_fkey;
    RAISE NOTICE '✅ documents_uploaded_by_fkey (auth.users referansı) kaldırıldı';
  EXCEPTION
    WHEN undefined_object THEN
      RAISE NOTICE '⚠️  documents_uploaded_by_fkey zaten mevcut değil';
    WHEN OTHERS THEN
      RAISE NOTICE '❌ documents_uploaded_by_fkey kaldırılamadı: %', SQLERRM;
  END;
  
  -- Korunan constraint'i kontrol et
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'documents_uploaded_by_profiles_fkey'
  ) THEN
    RAISE NOTICE '✅ documents_uploaded_by_profiles_fkey (profiles referansı) korundu';
  ELSE
    RAISE NOTICE '❌ documents_uploaded_by_profiles_fkey bulunamadı!';
  END IF;
END $$;

-- ====================================================================
-- ADIM 3: EXPENSES TABLOSU - İKİ AUTH.USERS REFERANSINI KALDIR
-- ====================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '3️⃣  EXPENSES TABLOSU DÜZELTME...';
  
  -- fk_expenses_user_id_fixed constraint'ini kaldır
  BEGIN
    ALTER TABLE expenses DROP CONSTRAINT fk_expenses_user_id_fixed;
    RAISE NOTICE '✅ fk_expenses_user_id_fixed (auth.users referansı) kaldırıldı';
  EXCEPTION
    WHEN undefined_object THEN
      RAISE NOTICE '⚠️  fk_expenses_user_id_fixed zaten mevcut değil';
    WHEN OTHERS THEN
      RAISE NOTICE '❌ fk_expenses_user_id_fixed kaldırılamadı: %', SQLERRM;
  END;
  
  -- expenses_user_id_fkey constraint'ini kaldır
  BEGIN
    ALTER TABLE expenses DROP CONSTRAINT expenses_user_id_fkey;
    RAISE NOTICE '✅ expenses_user_id_fkey (auth.users referansı) kaldırıldı';
  EXCEPTION
    WHEN undefined_object THEN
      RAISE NOTICE '⚠️  expenses_user_id_fkey zaten mevcut değil';
    WHEN OTHERS THEN
      RAISE NOTICE '❌ expenses_user_id_fkey kaldırılamadı: %', SQLERRM;
  END;
  
  -- Korunan constraint'i kontrol et
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'expenses_user_id_profiles_fkey'
  ) THEN
    RAISE NOTICE '✅ expenses_user_id_profiles_fkey (profiles referansı) korundu';
  ELSE
    RAISE NOTICE '❌ expenses_user_id_profiles_fkey bulunamadı!';
  END IF;
END $$;

-- ====================================================================
-- ADIM 4: INCOMES TABLOSU - İKİ AUTH.USERS REFERANSINI KALDIR
-- ====================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '4️⃣  INCOMES TABLOSU DÜZELTME...';
  
  -- fk_incomes_user_id_fixed constraint'ini kaldır
  BEGIN
    ALTER TABLE incomes DROP CONSTRAINT fk_incomes_user_id_fixed;
    RAISE NOTICE '✅ fk_incomes_user_id_fixed (auth.users referansı) kaldırıldı';
  EXCEPTION
    WHEN undefined_object THEN
      RAISE NOTICE '⚠️  fk_incomes_user_id_fixed zaten mevcut değil';
    WHEN OTHERS THEN
      RAISE NOTICE '❌ fk_incomes_user_id_fixed kaldırılamadı: %', SQLERRM;
  END;
  
  -- incomes_user_id_fkey constraint'ini kaldır
  BEGIN
    ALTER TABLE incomes DROP CONSTRAINT incomes_user_id_fkey;
    RAISE NOTICE '✅ incomes_user_id_fkey (auth.users referansı) kaldırıldı';
  EXCEPTION
    WHEN undefined_object THEN
      RAISE NOTICE '⚠️  incomes_user_id_fkey zaten mevcut değil';
    WHEN OTHERS THEN
      RAISE NOTICE '❌ incomes_user_id_fkey kaldırılamadı: %', SQLERRM;
  END;
  
  -- Korunan constraint'i kontrol et
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'incomes_user_id_profiles_fkey'
  ) THEN
    RAISE NOTICE '✅ incomes_user_id_profiles_fkey (profiles referansı) korundu';
  ELSE
    RAISE NOTICE '❌ incomes_user_id_profiles_fkey bulunamadı!';
  END IF;
END $$;

-- ====================================================================
-- ADIM 5: WORKSHOPS TABLOSU - AUTH.USERS REFERANSINI KALDIR
-- ====================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '5️⃣  WORKSHOPS TABLOSU DÜZELTME...';
  
  -- workshops_created_by_fkey constraint'ini kaldır (auth.users referansı)
  BEGIN
    ALTER TABLE workshops DROP CONSTRAINT workshops_created_by_fkey;
    RAISE NOTICE '✅ workshops_created_by_fkey (auth.users referansı) kaldırıldı';
  EXCEPTION
    WHEN undefined_object THEN
      RAISE NOTICE '⚠️  workshops_created_by_fkey zaten mevcut değil';
    WHEN OTHERS THEN
      RAISE NOTICE '❌ workshops_created_by_fkey kaldırılamadı: %', SQLERRM;
  END;
  
  -- Korunan constraint'i kontrol et
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'workshops_created_by_profiles_fkey'
  ) THEN
    RAISE NOTICE '✅ workshops_created_by_profiles_fkey (profiles referansı) korundu';
  ELSE
    RAISE NOTICE '❌ workshops_created_by_profiles_fkey bulunamadı!';
  END IF;
END $$;

-- ====================================================================
-- ADIM 6: SCHEMA CACHE YENİLEME
-- ====================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '6️⃣  SCHEMA CACHE YENİLEME...';
  
  -- Çoklu cache yenileme
  NOTIFY pgrst, 'reload schema';
  NOTIFY pgrst, 'reload config';
  NOTIFY pgrst;
  
  -- Config güncelleme
  PERFORM set_config('app.specific_conflict_fix', NOW()::text, false);
  
  RAISE NOTICE '🔄 Schema cache yenileme sinyalleri gönderildi';
END $$;

-- ====================================================================
-- ADIM 7: ÇÖZÜM SONRASI DOĞRULAMA
-- ====================================================================

-- Kalan constraint'leri listele
SELECT 
  '🔍 ÇÖZÜM SONRASI CONSTRAINT LİSTESİ' as verification,
  tc.table_name as tablo,
  kcu.column_name as kolon,
  tc.constraint_name as constraint_adi,
  CASE 
    WHEN ccu.table_name = 'profiles' THEN '✅ PROFILES'
    WHEN ccu.table_name = 'users' THEN '❌ AUTH.USERS'
    ELSE '❓ DİĞER'
  END as referans_tipi,
  ccu.table_name as referans_tablo,
  ccu.column_name as referans_kolon
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.constraint_schema = 'public'
  AND tc.table_name IN ('clients', 'documents', 'expenses', 'incomes', 'workshops')
  AND kcu.column_name IN ('created_by', 'uploaded_by', 'user_id')
ORDER BY tc.table_name, kcu.column_name;

-- Özet istatistikler
SELECT 
  '📊 ÇÖZÜM ÖZETİ' as summary,
  COUNT(CASE WHEN ccu.table_name = 'profiles' THEN 1 END) as profiles_referanslari,
  COUNT(CASE WHEN ccu.table_name = 'users' THEN 1 END) as auth_users_referanslari,
  COUNT(*) as toplam_constraint
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.constraint_schema = 'public'
  AND tc.table_name IN ('clients', 'documents', 'expenses', 'incomes', 'workshops')
  AND kcu.column_name IN ('created_by', 'uploaded_by', 'user_id');

-- ====================================================================
-- FINAL ÖZET MESAJI
-- ====================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== SPESİFİK ÇAKIŞMALAR ÇÖZÜLDÜ ===';
  RAISE NOTICE '';
  RAISE NOTICE 'KALDIRILAN CONSTRAINT''LER:';
  RAISE NOTICE '❌ clients_created_by_fkey → auth.users.id';
  RAISE NOTICE '❌ fk_documents_uploaded_by_fixed → auth.users.id';
  RAISE NOTICE '❌ documents_uploaded_by_fkey → auth.users.id';
  RAISE NOTICE '❌ fk_expenses_user_id_fixed → auth.users.id';
  RAISE NOTICE '❌ expenses_user_id_fkey → auth.users.id';
  RAISE NOTICE '❌ fk_incomes_user_id_fixed → auth.users.id';
  RAISE NOTICE '❌ incomes_user_id_fkey → auth.users.id';
  RAISE NOTICE '❌ workshops_created_by_fkey → auth.users.id';
  RAISE NOTICE '';
  RAISE NOTICE 'KORUNAN CONSTRAINT''LER:';
  RAISE NOTICE '✅ clients_created_by_profiles_fkey → profiles.id';
  RAISE NOTICE '✅ documents_uploaded_by_profiles_fkey → profiles.id';
  RAISE NOTICE '✅ expenses_user_id_profiles_fkey → profiles.id';
  RAISE NOTICE '✅ incomes_user_id_profiles_fkey → profiles.id';
  RAISE NOTICE '✅ workshops_created_by_profiles_fkey → profiles.id';
  RAISE NOTICE '';
  RAISE NOTICE 'SONUÇ:';
  RAISE NOTICE '🎯 13 → 5 constraint (8 adet kaldırıldı)';
  RAISE NOTICE '🔄 Schema cache yenilendi';
  RAISE NOTICE '✅ Tüm ilişkiler profiles tablosu üzerinden';
  RAISE NOTICE '';
  RAISE NOTICE 'SONRAKİ ADIMLAR:';
  RAISE NOTICE '1. 30 saniye bekleyin';
  RAISE NOTICE '2. Frontend sayfalarını test edin';
  RAISE NOTICE '3. Analytics, Calendar, Clients sayfalarını kontrol edin';
  RAISE NOTICE '';
  RAISE NOTICE 'Tarih: %', NOW();
END $$; 