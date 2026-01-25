'use client'

import { useState, useEffect, useCallback } from 'react'
import { Goal, Record } from '@/types'
import { supabase } from './supabase'
import { useAuth } from './auth'

// 状态管理 Hook - 管理目标和记录（使用 Supabase）
export function useGoals() {
  const { user } = useAuth()
  const [goals, setGoals] = useState<Goal[]>([])
  const [records, setRecords] = useState<Record[]>([])
  const [currentGoalId, setCurrentGoalId] = useState<string | null>(null)
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 从 Supabase 加载数据
  const loadData = useCallback(async () => {
    if (!user) {
      setIsLoading(false)
      return
    }

    try {
      // 加载 goals
      const { data: goalsData, error: goalsError } = await (supabase
        .from('goals') as any)
        .select('*')
        .eq('user_uuid', user.id)
        .order('created_at', { ascending: false })

      if (goalsError) throw goalsError

      // 转换数据库格式到前端格式
      const formattedGoals: Goal[] = (goalsData || []).map((g: any) => ({
        id: g.id,
        name: g.name,
        unit: g.unit,
        targetAmount: g.target_amount,
        completedAmount: g.completed_amount || 0,
        period: g.period,
        startDate: g.start_date,
        endDate: g.end_date,
        incrementValue: g.increment_value,
        createdAt: g.created_at,
        status: g.status || 'active',
        archivedAt: g.archived_at,
      }))

      setGoals(formattedGoals)

      // 设置第一个 active 目标为当前目标
      const firstActiveGoal = formattedGoals.find(g => g.status !== 'archived')
      if (firstActiveGoal) {
        setCurrentGoalId(firstActiveGoal.id)
      }

      // 加载 records
      const { data: recordsData, error: recordsError } = await (supabase
        .from('records') as any)
        .select('*')
        .eq('user_uuid', user.id)
        .order('timestamp', { ascending: false })

      if (recordsError) throw recordsError

      // 转换数据库格式到前端格式
      const formattedRecords: Record[] = (recordsData || []).map((r: any) => ({
        id: r.id,
        goalId: r.goal_id,
        value: r.value,
        timestamp: r.timestamp,
        date: r.date,
      }))

      setRecords(formattedRecords)

      // 检查是否有目标（用于 onboarding 状态）
      setOnboardingCompleted(formattedGoals.length > 0)
    } catch (error) {
      console.error('Failed to load data:', error)
      setGoals([])
      setRecords([])
      setOnboardingCompleted(false)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  // 初始化数据
  useEffect(() => {
    loadData()
  }, [loadData])

  // 添加目标
  const addGoal = async (goal: Goal) => {
    if (!user) return

    try {
      const goalWithStatus = {
        ...goal,
        status: goal.status || 'active',
      }

      // 转换前端格式到数据库格式
      const { data, error } = await (supabase
        .from('goals') as any)
        .insert({
          user_uuid: user.id,
          name: goalWithStatus.name,
          unit: goalWithStatus.unit,
          target_amount: goalWithStatus.targetAmount,
          completed_amount: goalWithStatus.completedAmount || 0,
          period: goalWithStatus.period,
          start_date: goalWithStatus.startDate || null,
          end_date: goalWithStatus.endDate || null,
          increment_value: goalWithStatus.incrementValue,
          status: goalWithStatus.status,
        })
        .select()
        .single()

      if (error) throw error

      // 转换并添加到本地状态
      const goalData = data as any
      const newGoal: Goal = {
        id: goalData.id,
        name: goalData.name,
        unit: goalData.unit,
        targetAmount: goalData.target_amount,
        completedAmount: goalData.completed_amount,
        period: goalData.period,
        startDate: goalData.start_date,
        endDate: goalData.end_date,
        incrementValue: goalData.increment_value,
        createdAt: goalData.created_at,
        status: goalData.status,
        archivedAt: goalData.archived_at,
      }

      setGoals(prev => [...prev, newGoal])
      setCurrentGoalId(newGoal.id)
      setOnboardingCompleted(true)
    } catch (error) {
      console.error('Failed to add goal:', error)
      throw error
    }
  }

  // 更新目标
  const updateGoal = async (goalId: string, updates: Partial<Goal>) => {
    if (!user) return

    try {
      const updateData: any = {}
      if (updates.name !== undefined) updateData.name = updates.name
      if (updates.unit !== undefined) updateData.unit = updates.unit
      if (updates.targetAmount !== undefined) updateData.target_amount = updates.targetAmount
      if (updates.completedAmount !== undefined) updateData.completed_amount = updates.completedAmount
      if (updates.period !== undefined) updateData.period = updates.period
      if (updates.startDate !== undefined) updateData.start_date = updates.startDate
      if (updates.endDate !== undefined) updateData.end_date = updates.endDate
      if (updates.incrementValue !== undefined) updateData.increment_value = updates.incrementValue
      if (updates.status !== undefined) updateData.status = updates.status
      if (updates.archivedAt !== undefined) updateData.archived_at = updates.archivedAt

      const { error } = await (supabase
        .from('goals') as any)
        .update(updateData)
        .eq('id', goalId)
        .eq('user_uuid', user.id)

      if (error) throw error

      // 更新本地状态
      setGoals(prev => prev.map(goal => 
        goal.id === goalId ? { ...goal, ...updates } : goal
      ))
    } catch (error) {
      console.error('Failed to update goal:', error)
      throw error
    }
  }

  // 添加记录
  const addRecord = async (goalId: string, value: number) => {
    if (!user) return

    try {
      const now = new Date()
      const date = now.toISOString().split('T')[0]

      const { data, error } = await (supabase
        .from('records') as any)
        .insert({
          user_uuid: user.id,
          goal_id: goalId,
          value,
          timestamp: now.toISOString(),
          date,
        })
        .select()
        .single()

      if (error) throw error

      // 添加到本地状态
      const recordData = data as any
      const newRecord: Record = {
        id: recordData.id,
        goalId: recordData.goal_id,
        value: recordData.value,
        timestamp: recordData.timestamp,
        date: recordData.date,
      }

      setRecords(prev => [newRecord, ...prev])

      // 更新目标的完成数量
      const goal = goals.find(g => g.id === goalId)
      if (goal) {
        await updateGoal(goalId, {
          completedAmount: goal.completedAmount + value,
        })
      }
    } catch (error) {
      console.error('Failed to add record:', error)
      throw error
    }
  }

  // 归档目标
  const archiveGoal = async (goalId: string): Promise<{ success: boolean; archivedGoal?: Goal }> => {
    if (!user) return { success: false }

    try {
      const now = new Date().toISOString()
      const { error } = await (supabase
        .from('goals') as any)
        .update({
          status: 'archived',
          archived_at: now,
        })
        .eq('id', goalId)
        .eq('user_uuid', user.id)

      if (error) throw error

      // 更新本地状态
      const updatedGoals = goals.map(goal => {
        if (goal.id === goalId) {
          return {
            ...goal,
            status: 'archived' as const,
            archivedAt: now,
          }
        }
        return goal
      })
      setGoals(updatedGoals)

      // 如果归档的是当前目标，切换到其他 active 目标
      if (currentGoalId === goalId) {
        const activeGoals = updatedGoals.filter(g => g.status !== 'archived')
        if (activeGoals.length > 0) {
          setCurrentGoalId(activeGoals[0].id)
        } else {
          setCurrentGoalId(null)
        }
      }

      const archivedGoal = updatedGoals.find(g => g.id === goalId)
      return { success: true, archivedGoal }
    } catch (error) {
      console.error('Failed to archive goal:', error)
      return { success: false }
    }
  }

  // 从归档恢复目标
  const restoreFromArchive = async (goalId: string): Promise<boolean> => {
    if (!user) return false

    try {
      const { error } = await (supabase
        .from('goals') as any)
        .update({
          status: 'active',
          archived_at: null,
        })
        .eq('id', goalId)
        .eq('user_uuid', user.id)

      if (error) throw error

      // 更新本地状态
      setGoals(prev => prev.map(goal => {
        if (goal.id === goalId) {
          const { archivedAt, ...rest } = goal
          return {
            ...rest,
            status: 'active' as const,
          }
        }
        return goal
      }))

      setCurrentGoalId(goalId)
      return true
    } catch (error) {
      console.error('Failed to restore goal from archive:', error)
      return false
    }
  }

  // 恢复已删除的目标（undo功能 - 保留用于兼容）
  const restoreGoal = async (goal: Goal, goalRecords: Record[]): Promise<boolean> => {
    if (!user) return false

    try {
      // 恢复目标
      const goalToRestore = {
        ...goal,
        status: 'active' as const,
      }

      const { data, error } = await (supabase
        .from('goals') as any)
        .insert({
          id: goalToRestore.id,
          user_uuid: user.id,
          name: goalToRestore.name,
          unit: goalToRestore.unit,
          target_amount: goalToRestore.targetAmount,
          completed_amount: goalToRestore.completedAmount,
          period: goalToRestore.period,
          start_date: goalToRestore.startDate || null,
          end_date: goalToRestore.endDate || null,
          increment_value: goalToRestore.incrementValue,
          status: goalToRestore.status,
          created_at: goalToRestore.createdAt,
        })
        .select()
        .single()

      if (error) throw error

      // 恢复记录
      if (goalRecords.length > 0) {
        const recordsToInsert = goalRecords.map(r => ({
          id: r.id,
          user_uuid: user.id,
          goal_id: r.goalId,
          value: r.value,
          timestamp: r.timestamp,
          date: r.date,
        }))

        const { error: recordsError } = await (supabase
          .from('records') as any)
          .insert(recordsToInsert)

        if (recordsError) throw recordsError
      }

      // 重新加载数据
      await loadData()
      setCurrentGoalId(goalToRestore.id)
      return true
    } catch (error) {
      console.error('Failed to restore goal:', error)
      return false
    }
  }

  // 获取目标的统计信息
  const getGoalStats = (goalId: string) => {
    const goal = goals.find(g => g.id === goalId)
    if (!goal) return null

    const goalRecords = records.filter(r => r.goalId === goalId)
    const createdAt = new Date(goal.createdAt)
    const now = new Date()
    const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
    
    const uniqueDates = new Set(goalRecords.map(r => r.date))
    const daysWithRecords = uniqueDates.size

    const lastRecord = goalRecords.length > 0 
      ? goalRecords.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
      : null

    return {
      daysSinceCreation,
      daysWithRecords,
      totalRecords: goalRecords.length,
      lastRecordTime: lastRecord ? new Date(lastRecord.timestamp) : null,
      completedAmount: goal.completedAmount,
    }
  }

  // 完成 onboarding
  const completeOnboarding = () => {
    setOnboardingCompleted(true)
  }

  // 重置所有数据
  const resetData = async () => {
    if (!user) return

    try {
      // 删除所有 goals 和 records
      await (supabase.from('records') as any).delete().eq('user_uuid', user.id)
      await (supabase.from('goals') as any).delete().eq('user_uuid', user.id)
      
      setGoals([])
      setRecords([])
      setCurrentGoalId(null)
      setOnboardingCompleted(false)
    } catch (error) {
      console.error('Failed to reset data:', error)
    }
  }

  // 获取当前目标（只从 active 目标中查找）
  const currentGoal = goals.find(g => g.id === currentGoalId && g.status !== 'archived') || null

  // 获取当前目标的记录
  const currentGoalRecords = records
    .filter(r => r.goalId === currentGoalId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 7)

  // 获取 active 目标列表（用于首页）
  const activeGoals = goals.filter(g => g.status !== 'archived')

  // 获取 archived 目标列表（用于 Profile 页面）
  const archivedGoals = goals.filter(g => g.status === 'archived')

  // 获取今日记录
  const getTodayRecords = (goalId: string) => {
    const today = new Date().toISOString().split('T')[0]
    return records
      .filter(r => r.goalId === goalId && r.date === today)
      .reduce((sum, r) => sum + r.value, 0)
  }

  return {
    goals,
    records,
    currentGoal,
    currentGoalId,
    currentGoalRecords,
    activeGoals,
    archivedGoals,
    onboardingCompleted,
    isLoading,
    setCurrentGoalId,
    addGoal,
    updateGoal,
    addRecord,
    archiveGoal,
    restoreFromArchive,
    restoreGoal,
    getGoalStats,
    getTodayRecords,
    completeOnboarding,
    resetData,
  }
}
