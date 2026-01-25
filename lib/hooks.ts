'use client'

import { useState, useEffect } from 'react'
import { Goal, Record } from '@/types'

// 状态管理 Hook - 管理目标和记录
export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [records, setRecords] = useState<Record[]>([])
  const [currentGoalId, setCurrentGoalId] = useState<string | null>(null)
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 初始化数据
  useEffect(() => {
    // 确保只在客户端执行
    if (typeof window === 'undefined') return
    
    // 从 localStorage 读取数据
    const savedGoals = localStorage.getItem('goals')
    const savedRecords = localStorage.getItem('records')
    const savedOnboarding = localStorage.getItem('onboardingCompleted')
    
    // 读取目标
    if (savedGoals) {
      try {
        const parsed = JSON.parse(savedGoals)
        // 确保旧数据有 status 字段（向后兼容）
        const goalsWithStatus = parsed.map((goal: Goal) => ({
          ...goal,
          status: goal.status || 'active',
        }))
        setGoals(goalsWithStatus)
        // 设置第一个 active 目标为当前目标
        const firstActiveGoal = goalsWithStatus.find((g: Goal) => g.status !== 'archived')
        if (firstActiveGoal) {
          setCurrentGoalId(firstActiveGoal.id)
        }
      } catch (e) {
        console.error('Failed to parse goals:', e)
        setGoals([])
      }
    }
    
    // 读取记录
    if (savedRecords) {
      try {
        setRecords(JSON.parse(savedRecords))
      } catch (e) {
        console.error('Failed to parse records:', e)
        setRecords([])
      }
    }
    
    // 读取 onboarding 状态
    if (savedOnboarding) {
      setOnboardingCompleted(savedOnboarding === 'true')
    } else {
      setOnboardingCompleted(false)
    }
    
    setIsLoading(false)
  }, [])

  // 添加目标
  const addGoal = (goal: Goal) => {
    // 确保新目标默认为 active 状态
    const goalWithStatus = {
      ...goal,
      status: goal.status || 'active',
    }
    const newGoals = [...goals, goalWithStatus]
    setGoals(newGoals)
    if (typeof window !== 'undefined') {
      localStorage.setItem('goals', JSON.stringify(newGoals))
    }
    setCurrentGoalId(goalWithStatus.id)
  }

  // 更新目标（用于修改增量值等）
  const updateGoal = (goalId: string, updates: Partial<Goal>) => {
    const updatedGoals = goals.map(goal => {
      if (goal.id === goalId) {
        return { ...goal, ...updates }
      }
      return goal
    })
    setGoals(updatedGoals)
    if (typeof window !== 'undefined') {
      localStorage.setItem('goals', JSON.stringify(updatedGoals))
    }
  }

  // 添加记录
  const addRecord = (goalId: string, value: number) => {
    const newRecord: Record = {
      id: `r${Date.now()}`,
      goalId,
      value,
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
    }
    
    const newRecords = [newRecord, ...records]
    setRecords(newRecords)
    if (typeof window !== 'undefined') {
      localStorage.setItem('records', JSON.stringify(newRecords))
    }
    
    // 更新目标的完成数量
    const updatedGoals = goals.map(goal => {
      if (goal.id === goalId) {
        return {
          ...goal,
          completedAmount: goal.completedAmount + value,
        }
      }
      return goal
    })
    setGoals(updatedGoals)
    if (typeof window !== 'undefined') {
      localStorage.setItem('goals', JSON.stringify(updatedGoals))
    }
  }

  // 完成 onboarding
  const completeOnboarding = () => {
    setOnboardingCompleted(true)
    if (typeof window !== 'undefined') {
      localStorage.setItem('onboardingCompleted', 'true')
    }
  }

  // 归档目标（将目标状态改为 archived）
  const archiveGoal = (goalId: string): { success: boolean; archivedGoal?: Goal } => {
    try {
      // 检查目标是否存在
      const goalToArchive = goals.find(g => g.id === goalId)
      if (!goalToArchive) {
        console.warn(`Goal with id ${goalId} not found`)
        return { success: false }
      }

      // 更新目标状态为 archived
      const updatedGoals = goals.map(goal => {
        if (goal.id === goalId) {
          return {
            ...goal,
            status: 'archived' as const,
            archivedAt: new Date().toISOString(),
          }
        }
        return goal
      })
      setGoals(updatedGoals)

      // 更新 localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('goals', JSON.stringify(updatedGoals))
      }

      // 如果归档的是当前目标，切换到其他 active 目标或清空
      if (currentGoalId === goalId) {
        const activeGoals = updatedGoals.filter(g => g.status !== 'archived')
        if (activeGoals.length > 0) {
          // 切换到第一个 active 目标
          setCurrentGoalId(activeGoals[0].id)
        } else {
          // 没有 active 目标了，清空当前目标ID
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

  // 从归档恢复目标（将目标状态改回 active）
  const restoreFromArchive = (goalId: string): boolean => {
    try {
      const goalToRestore = goals.find(g => g.id === goalId)
      if (!goalToRestore) {
        console.warn(`Goal with id ${goalId} not found`)
        return false
      }

      // 更新目标状态为 active
      const updatedGoals = goals.map(goal => {
        if (goal.id === goalId) {
          const { archivedAt, ...rest } = goal
          return {
            ...rest,
            status: 'active' as const,
          }
        }
        return goal
      })
      setGoals(updatedGoals)

      // 更新 localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('goals', JSON.stringify(updatedGoals))
      }

      // 设置为当前目标
      setCurrentGoalId(goalId)

      return true
    } catch (error) {
      console.error('Failed to restore goal from archive:', error)
      return false
    }
  }

  // 恢复已删除的目标（undo功能 - 保留用于兼容）
  const restoreGoal = (goal: Goal, goalRecords: Record[]): boolean => {
    try {
      // 恢复目标（确保状态为 active）
      const goalToRestore = {
        ...goal,
        status: 'active' as const,
      }
      const updatedGoals = [...goals, goalToRestore]
      setGoals(updatedGoals)

      // 恢复记录
      const updatedRecords = [...records, ...goalRecords]
      setRecords(updatedRecords)

      // 更新 localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('goals', JSON.stringify(updatedGoals))
        localStorage.setItem('records', JSON.stringify(updatedRecords))
      }

      // 设置为当前目标
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
    
    // 获取有记录的天数（去重）
    const uniqueDates = new Set(goalRecords.map(r => r.date))
    const daysWithRecords = uniqueDates.size

    // 获取最近一次记录时间
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

  // 重置所有数据
  const resetData = () => {
    setGoals([])
    setRecords([])
    setCurrentGoalId(null)
    setOnboardingCompleted(false)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('goals')
      localStorage.removeItem('records')
      localStorage.removeItem('onboardingCompleted')
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
