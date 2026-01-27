-- ============================================
-- 创建 records 表（如果不存在）
-- ============================================

-- 如果表不存在，创建完整的 records 表
CREATE TABLE IF NOT EXISTS public.records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_uuid UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  value NUMERIC NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  date DATE NOT NULL,
  note TEXT
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_records_user_uuid ON public.records(user_uuid);
CREATE INDEX IF NOT EXISTS idx_records_goal_id ON public.records(goal_id);
CREATE INDEX IF NOT EXISTS idx_records_date ON public.records(date);

-- 启用 RLS
ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;

-- 删除现有策略（如果存在，避免重复）
DROP POLICY IF EXISTS "select own records" ON public.records;
DROP POLICY IF EXISTS "insert own records" ON public.records;
DROP POLICY IF EXISTS "update own records" ON public.records;
DROP POLICY IF EXISTS "delete own records" ON public.records;

-- 创建 RLS 策略
CREATE POLICY "select own records"
ON public.records FOR SELECT
USING (user_uuid = auth.uid());

CREATE POLICY "insert own records"
ON public.records FOR INSERT
WITH CHECK (user_uuid = auth.uid());

CREATE POLICY "update own records"
ON public.records FOR UPDATE
USING (user_uuid = auth.uid())
WITH CHECK (user_uuid = auth.uid());

CREATE POLICY "delete own records"
ON public.records FOR DELETE
USING (user_uuid = auth.uid());
