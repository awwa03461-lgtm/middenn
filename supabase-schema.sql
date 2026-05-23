-- ============================================================
-- Flappy Miden — Database Schema for Supabase
-- ============================================================
-- این SQL رو در Supabase SQL Editor اجرا کن
-- (Dashboard → SQL Editor → New Query)

-- جدول امتیازات
CREATE TABLE IF NOT EXISTS scores (
    id BIGSERIAL PRIMARY KEY,
    address TEXT NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 9999),
    tx_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ایندکس برای جستجوی سریع
CREATE INDEX IF NOT EXISTS idx_scores_address ON scores(address);
CREATE INDEX IF NOT EXISTS idx_scores_score ON scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_scores_created_at ON scores(created_at DESC);

-- Row Level Security (RLS) - مهم برای امنیت
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- اجازه خوندن برای همه (anon)
CREATE POLICY "Anyone can read scores"
ON scores FOR SELECT
TO anon
USING (true);

-- اجازه نوشتن فقط از سرور (با service_role key)
-- frontend نمی‌تونه مستقیم insert کنه
CREATE POLICY "Only service can insert scores"
ON scores FOR INSERT
TO service_role
WITH CHECK (true);

-- ============================================================
-- (اختیاری) جدول آمار جهانی
-- ============================================================
CREATE TABLE IF NOT EXISTS game_stats (
    id INTEGER PRIMARY KEY DEFAULT 1,
    total_games INTEGER DEFAULT 0,
    total_players INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO game_stats (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- بعد از اجرای این SQL:
-- ۱. برو به Settings → API
-- ۲. Project URL → کپی کن، می‌ذاری توی SUPABASE_URL
-- ۳. service_role key → کپی کن، می‌ذاری توی SUPABASE_KEY
-- ============================================================
