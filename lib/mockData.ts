import { Goal, Record, GoalTemplate } from '@/types'

// 目标模板数据
export const goalTemplates: GoalTemplate[] = [
  { id: 'reading', name: '读书', icon: '📚', defaultUnit: '本', defaultAmount: 12 },
  { id: 'dancing', name: '跳舞', icon: '💃', defaultUnit: '小时', defaultAmount: 50 },
  { id: 'water', name: '喝水', icon: '💧', defaultUnit: '杯', defaultAmount: 2000 },
  { id: 'custom', name: '自定义', icon: '✨', defaultUnit: '次', defaultAmount: 0 },
]

// Mock 目标数据
export const mockGoals: Goal[] = [
  {
    id: '1',
    name: '一年读完 12 本书',
    unit: '本',
    targetAmount: 12,
    completedAmount: 3,
    period: 'year',
    incrementValue: 1,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: '一年跳舞 50 小时',
    unit: '小时',
    targetAmount: 50,
    completedAmount: 12.5,
    period: 'year',
    incrementValue: 0.5,
    createdAt: '2024-01-15T00:00:00Z',
  },
]

// Mock 记录数据
export const mockRecords: Record[] = [
  {
    id: 'r1',
    goalId: '1',
    value: 1,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    date: new Date().toISOString().split('T')[0],
  },
  {
    id: 'r2',
    goalId: '1',
    value: 1,
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  },
  {
    id: 'r3',
    goalId: '2',
    value: 0.5,
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    date: new Date().toISOString().split('T')[0],
  },
  {
    id: 'r4',
    goalId: '2',
    value: 1,
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  },
]

