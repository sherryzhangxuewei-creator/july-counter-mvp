-- ============================================
-- 快速修复：添加 completed_amount 字段
-- ============================================
-- 在 Supabase SQL Editor 中执行此脚本

-- 添加 completed_amount 字段（如果不存在）
ALTER TABLE public.goals 
ADD COLUMN IF NOT EXISTS completed_amount INTEGER DEFAULT 0;

-- 如果表中已有数据，为现有记录设置默认值
UPDATE public.goals 
SET completed_amount = 0 
WHERE completed_amount IS NULL;
