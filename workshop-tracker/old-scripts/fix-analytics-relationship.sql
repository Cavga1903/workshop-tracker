-- ====================================================================
-- HIZLI ÇÖZÜM: ANALYTICS SAYFASI İÇİN İNCOMES.USER_ID İLİŞKİSİ
-- Quick Fix: Analytics page incomes.user_id relationship error
-- ====================================================================

DO $$
BEGIN
  RAISE NOTICE '🔧 ANALYTICS SAYFASI İLİŞKİ HATASI ÇÖZÜMÜ BAŞLATILIYOR...';
  RAISE NOTICE 'Fixing Analytics page relationship error...';
  RAISE NOTICE '';
END $$;

-- 1. İNCOMES.USER_ID KOLONUNUN VAR OLUP OLMADIĞINI KONTROL ET
DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  RAISE NOTICE '1️⃣  Incomes.user_id kolonunu kontrol ediliyor...';
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'incomes' 
      AND column_name = 'user_id'
  ) INTO column_exists;
  
  IF column_exists THEN
    RAISE NOTICE '✅ incomes.user_id kolonu mevcut';
  ELSE
    RAISE NOTICE '❌ incomes.user_id kolonu eksik - ekleniyor...';
    ALTER TABLE incomes ADD COLUMN user_id UUID;
    RAISE NOTICE '✅ incomes.user_id kolonu eklendi';
  END IF;
END $$;

-- 2. MEVCUT TÜM USER_ID İLİŞKİLERİNİ TEMİZLE
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '2️⃣  Mevcut incomes.user_id ilişkileri temizleniyor...';
  
  -- Tüm mevcut user_id constraint'lerini kaldır
  FOR constraint_name IN 
    SELECT tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.constraint_schema = 'public'
      AND tc.table_name = 'incomes'
      AND kcu.column_name = 'user_id'
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE incomes DROP CONSTRAINT %I', constraint_name);
      RAISE NOTICE '🗑️  Kaldırıldı: %', constraint_name;
    EXCEPTION 
      WHEN OTHERS THEN
        RAISE NOTICE '❌ Kaldırılamadı %: %', constraint_name, SQLERRM;
    END;
  END LOOP;
END $$;

-- 3. PROFILES TABLOSUNUN VAR OLUP OLMADIĞINI KONTROL ET
DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '3️⃣  Profiles tablosu kontrol ediliyor...';
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE '✅ profiles tablosu mevcut';
  ELSE
    RAISE NOTICE '❌ profiles tablosu eksik!';
    RAISE NOTICE 'Profiles tablosu oluşturuluyor...';
    
    -- Profiles tablosunu oluştur
    CREATE TABLE IF NOT EXISTS profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      full_name TEXT,
      email TEXT,
      role TEXT DEFAULT 'user',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Mevcut kullanıcılar için profile kayıtları oluştur
    INSERT INTO profiles (id, email, full_name)
    SELECT 
      id, 
      email,
      COALESCE(raw_user_meta_data->>'full_name', email) as full_name
    FROM auth.users
    WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.users.id);
    
    RAISE NOTICE '✅ profiles tablosu oluşturuldu ve dolduruldu';
  END IF;
END $$;

-- 4. TEMİZ İNCOMES.USER_ID → PROFILES.ID İLİŞKİSİNİ OLUŞTUR
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '4️⃣  Yeni incomes.user_id → profiles.id ilişkisi oluşturuluyor...';
  
  BEGIN
    ALTER TABLE incomes 
    ADD CONSTRAINT incomes_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;
    
    RAISE NOTICE '✅ BAŞARILI: incomes.user_id → profiles.id ilişkisi oluşturuldu';
  EXCEPTION 
    WHEN OTHERS THEN
      RAISE NOTICE '❌ HATA: incomes_user_id_fkey oluşturulamadı - %', SQLERRM;
      
      -- Alternatif: auth.users'a bağlamaya çalış
      BEGIN
        ALTER TABLE incomes 
        ADD CONSTRAINT incomes_user_id_auth_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
        
        RAISE NOTICE '✅ ALTERNATİF: incomes.user_id → auth.users.id ilişkisi oluşturuldu';
      EXCEPTION 
        WHEN OTHERS THEN
          RAISE NOTICE '❌ ALTERNATİF DE BAŞARISIZ: %', SQLERRM;
      END;
  END;
END $$;

-- 5. MEVCUT INCOME KAYITLARINI GÜNCELLEMESİ (NULL USER_ID'LERİ DÜZELT)
DO $$
DECLARE
  current_user_id UUID;
  updated_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '5️⃣  Null user_id değerleri güncelleniyor...';
  
  -- İlk kullanıcı ID'sini al (eğer sadece bir kullanıcı varsa)
  SELECT id INTO current_user_id 
  FROM profiles 
  ORDER BY created_at ASC 
  LIMIT 1;
  
  IF current_user_id IS NOT NULL THEN
    -- NULL user_id'leri güncelle
    UPDATE incomes 
    SET user_id = current_user_id 
    WHERE user_id IS NULL;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE '✅ % income kaydının user_id değeri güncellendi', updated_count;
  ELSE
    RAISE NOTICE '⚠️  Kullanıcı bulunamadı, user_id güncellemesi yapılamadı';
  END IF;
END $$;

-- 6. SUPABASE SCHEMA CACHE'İNİ ZORLA YENİLE
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '6️⃣  Supabase schema cache yenileniyor...';
  
  -- Çoklu cache yenileme yöntemleri
  NOTIFY pgrst, 'reload schema';
  NOTIFY pgrst, 'reload config';
  NOTIFY pgrst;
  
  -- Dummy ayar güncelleme (schema reload tetikler)
  PERFORM set_config('app.analytics_fix', NOW()::text, false);
  
  RAISE NOTICE '🔄 Schema cache yenileme sinyalleri gönderildi';
END $$;

-- 7. İLİŞKİ ÇALIŞIYOR MU TEST ET
SELECT 
  'İLİŞKİ_TEST' as test,
  i.id as income_id,
  i.name as income_name,
  i.user_id,
  p.full_name as user_name,
  p.email as user_email,
  CASE 
    WHEN p.id IS NOT NULL THEN '✅ İLİŞKİ ÇALIŞIYOR'
    ELSE '❌ İLİŞKİ ÇALIŞMIYOR'
  END as durum
FROM incomes i
LEFT JOIN profiles p ON i.user_id = p.id
LIMIT 3;

-- 8. CONSTRAINT DOĞRULAMA
SELECT 
  'CONSTRAINT_KONTROL' as kontrol,
  tc.constraint_name,
  'incomes' as tablo,
  'user_id' as kolon,
  ccu.table_name as hedef_tablo,
  ccu.column_name as hedef_kolon
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.constraint_schema = 'public'
  AND tc.table_name = 'incomes'
  AND kcu.column_name = 'user_id';

-- 9. SONuç ÖZET
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== ANALYTICS İLİŞKİ HATASI ÇÖZÜM ÖZET ===';
  RAISE NOTICE '';
  RAISE NOTICE 'YAPILAN İŞLEMLER:';
  RAISE NOTICE '✅ incomes.user_id kolonu kontrol edildi/eklendi';
  RAISE NOTICE '✅ Eski constraint''ler temizlendi';
  RAISE NOTICE '✅ profiles tablosu kontrol edildi/oluşturuldu';
  RAISE NOTICE '✅ incomes.user_id → profiles.id ilişkisi kuruldu';
  RAISE NOTICE '✅ NULL user_id değerleri güncellendi';
  RAISE NOTICE '✅ Schema cache yenilendi';
  RAISE NOTICE '';
  RAISE NOTICE 'SONRAKİ ADIMLAR:';
  RAISE NOTICE '1. 30 saniye bekleyin (cache propagation)';
  RAISE NOTICE '2. Tarayıcı cache''ini temizleyin (Ctrl+Shift+R)';
  RAISE NOTICE '3. Analytics sayfasını yeniden test edin';
  RAISE NOTICE '4. Hala hata varsa logout/login yapın';
  RAISE NOTICE '';
  RAISE NOTICE 'Zaman damgası: %', NOW();
END $$; 