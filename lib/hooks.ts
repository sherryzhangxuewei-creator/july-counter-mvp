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
        setGoals(parsed)
        if (parsed.length > 0) {
          setCurrentGoalId(parsed[0].id)
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
    const newGoals = [...goals, goal]
    setGoals(newGoals)
    if (typeof window !== 'undefined') {
      localStorage.setItem('goals', JSON.stringify(newGoals))
    }
    setCurrentGoalId(goal.id)
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

  // 删除目标及其关联记录
  const deleteGoal = (goalId: string): boolean => {
    try {
      // 检查目标是否存在
      const goalExists = goals.some(g => g.id === goalId)
      if (!goalExists) {
        console.warn(`Goal with id ${goalId} not found`)
        return false
      }

      // 删除目标
      const updatedGoals = goals.filter(goal => goal.id !== goalId)
      setGoals(updatedGoals)

      // 删除该目标的所有记录
      const updatedRecords = records.filter(record => record.goalId !== goalId)
      setRecords(updatedRecords)

      // 更新 localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('goals', JSON.stringify(updatedGoals))
        localStorage.setItem('records', JSON.stringify(updatedRecords))
      }

      // 如果删除的是当前目标，切换到其他目标或清空
      if (currentGoalId === goalId) {
        if (updatedGoals.length > 0) {
          // 切换到第一个目标
          setCurrentGoalId(updatedGoals[0].id)
        } else {
          // 没有目标了，清空当前目标ID
          setCurrentGoalId(null)
        }
      }

      return true
    } catch (error) {
      console.error('Failed to delete goal:', error)
      return false
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

  // 获取当前目标
  const currentGoal = goals.find(g => g.id === currentGoalId) || null

  // 获取当前目标的记录
  const currentGoalRecords = records
    .filter(r => r.goalId === currentGoalId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 7)

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
    onboardingCompleted,
    isLoading,
    setCurrentGoalId,
    addGoal,
    updateGoal,
    addRecord,
    deleteGoal,
    getTodayRecords,
    completeOnboarding,
    resetData,
  }
}
