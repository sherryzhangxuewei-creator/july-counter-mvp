-- ============================================
-- 创建 goals 表（如果不存在）
-- ============================================

-- 如果表不存在，创建完整的 goals 表
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_uuid UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  target_amount INTEGER NOT NULL,
  completed_amount INTEGER DEFAULT 0,
  period TEXT NOT NULL CHECK (period IN ('year', 'month', 'custom')),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  increment_value NUMERIC NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_goals_user_uuid ON public.goals(user_uuid);
CREATE INDEX IF NOT EXISTS idx_goals_status ON public.goals(status);
CREATE INDEX IF NOT EXISTS idx_goals_created_at ON public.goals(created_at);

-- 启用 RLS
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- 删除现有策略（如果存在，避免重复）
DROP POLICY IF EXISTS "select own goals" ON public.goals;
DROP POLICY IF EXISTS "insert own goals" ON public.goals;
DROP POLICY IF EXISTS "update own goals" ON public.goals;
DROP POLICY IF EXISTS "delete own goals" ON public.goals;

-- 创建 RLS 策略
CREATE POLICY "select own goals"
ON public.goals FOR SELECT
USING (user_uuid = auth.uid());

CREATE POLICY "insert own goals"
ON public.goals FOR INSERT
WITH CHECK (user_uuid = auth.uid());

CREATE POLICY "update own goals"
ON public.goals FOR UPDATE
USING (user_uuid = auth.uid())
WITH CHECK (user_uuid = auth.uid());

CREATE POLICY "delete own goals"
ON public.goals FOR DELETE
USING (user_uuid = auth.uid());
