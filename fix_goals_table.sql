-- ============================================
-- 修复 goals 表结构
-- 添加缺失的字段
-- ============================================

-- 检查并添加 completed_amount 字段
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'goals' AND column_name = 'completed_amount'
  ) THEN
    ALTER TABLE public.goals 
    ADD COLUMN completed_amount INTEGER DEFAULT 0;
  END IF;
END $$;

-- 检查并添加 target_amount 字段
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'goals' AND column_name = 'target_amount'
  ) THEN
    ALTER TABLE public.goals 
    ADD COLUMN target_amount INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

-- 检查并添加 unit 字段
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'goals' AND column_name = 'unit'
  ) THEN
    ALTER TABLE public.goals 
    ADD COLUMN unit TEXT NOT NULL DEFAULT '';
  END IF;
END $$;

-- 检查并添加 period 字段
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'goals' AND column_name = 'period'
  ) THEN
    ALTER TABLE public.goals 
    ADD COLUMN period TEXT NOT NULL DEFAULT 'year';
  END IF;
END $$;

-- 检查并添加 start_date 字段
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'goals' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE public.goals 
    ADD COLUMN start_date TIMESTAMPTZ;
  END IF;
END $$;

-- 检查并添加 end_date 字段
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'goals' AND column_name = 'end_date'
  ) THEN
    ALTER TABLE public.goals 
    ADD COLUMN end_date TIMESTAMPTZ;
  END IF;
END $$;

-- 检查并添加 increment_value 字段
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'goals' AND column_name = 'increment_value'
  ) THEN
    ALTER TABLE public.goals 
    ADD COLUMN increment_value NUMERIC NOT NULL DEFAULT 1;
  END IF;
END $$;

-- 检查并添加 status 字段
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'goals' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.goals 
    ADD COLUMN status TEXT NOT NULL DEFAULT 'active' 
    CHECK (status IN ('active', 'archived'));
  END IF;
END $$;

-- 检查并添加 archived_at 字段
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'goals' AND column_name = 'archived_at'
  ) THEN
    ALTER TABLE public.goals 
    ADD COLUMN archived_at TIMESTAMPTZ;
  END IF;
END $$;

-- 检查并添加 created_at 字段
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'goals' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.goals 
    ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
END $$;

-- 检查并添加 user_uuid 字段（如果表使用 user_id，需要重命名）
DO $$ 
BEGIN
  -- 如果存在 user_id 但不存在 user_uuid，重命名
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'goals' AND column_name = 'user_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'goals' AND column_name = 'user_uuid'
  ) THEN
    ALTER TABLE public.goals 
    RENAME COLUMN user_id TO user_uuid;
  END IF;
  
  -- 如果都不存在，添加 user_uuid
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'goals' AND (column_name = 'user_uuid' OR column_name = 'user_id')
  ) THEN
    ALTER TABLE public.goals 
    ADD COLUMN user_uuid UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 创建索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_goals_user_uuid ON public.goals(user_uuid);
CREATE INDEX IF NOT EXISTS idx_goals_status ON public.goals(status);
CREATE INDEX IF NOT EXISTS idx_goals_created_at ON public.goals(created_at);
