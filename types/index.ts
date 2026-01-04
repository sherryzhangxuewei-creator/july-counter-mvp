// 目标周期类型
export type GoalPeriod = 'year' | 'month' | 'custom'

// 目标模板类型
export type GoalTemplate = {
  id: string
  name: string
  icon: string
  defaultUnit: string
  defaultAmount?: number
}

// 目标接口
export interface Goal {
  id: string
  name: string
  unit: string
  targetAmount: number
  completedAmount: number
  period: GoalPeriod
  startDate?: string
  endDate?: string
  incrementValue: number // 每次记录增加的值（1 或 0.5）
  createdAt: string
}

// 记录接口
export interface Record {
  id: string
  goalId: string
  value: number
  timestamp: string
  date: string // YYYY-MM-DD 格式，用于按日统计
}

// 目标表单数据
export interface GoalFormData {
  templateId?: string
  name: string
  unit: string
  targetAmount: number
  period: GoalPeriod
  startDate?: string
  endDate?: string
  incrementValue: number
}

