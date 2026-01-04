'use client'

import { useEffect, useState, Suspense, useRef } from 'react'
import { useGoals } from '@/lib/hooks'
import { useRouter, useSearchParams } from 'next/navigation'
import SidebarItem from '@/components/SidebarItem'
import Card from '@/components/Card'
import Button from '@/components/Button'
import Progress from '@/components/Progress'
import Toast from '@/components/Toast'

// Dashboard 内容组件
function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [toastMessage, setToastMessage] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [highlightRecordButton, setHighlightRecordButton] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const recordButtonRef = useRef<HTMLButtonElement>(null)
  
  const {
    goals,
    currentGoal,
    currentGoalId,
    currentGoalRecords,
    onboardingCompleted,
    isLoading,
    setCurrentGoalId,
    addRecord,
    resetData,
  } = useGoals()

  // 首次访问检查：如果没有完成 onboarding 或没有目标，跳转到 onboarding
  useEffect(() => {
    if (!isLoading) {
      if (onboardingCompleted === false || goals.length === 0) {
        router.replace('/onboarding')
      }
    }
  }, [isLoading, onboardingCompleted, goals.length, router])

  // 检测新目标创建
  useEffect(() => {
    if (searchParams.get('newGoal') === 'true') {
      const goalName = searchParams.get('goalName') || '目标'
      setToastMessage(`已创建目标：${goalName}，现在点一次『记录一次』完成第一次计数`)
      setShowToast(true)
      setHighlightRecordButton(true)
      // 清除 URL 参数
      router.replace('/', { scroll: false })
      // 3 秒后取消高亮
      setTimeout(() => setHighlightRecordButton(false), 3000)
    }
  }, [searchParams, router])

  // 高亮按钮动画
  useEffect(() => {
    if (highlightRecordButton && recordButtonRef.current) {
      recordButtonRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlightRecordButton])

  // 处理记录一次
  const handleRecord = () => {
    if (currentGoal) {
      addRecord(currentGoal.id, currentGoal.incrementValue)
      setHighlightRecordButton(false) // 记录后取消高亮
    }
  }

  // 处理重置数据
  const handleResetData = () => {
    if (confirm('确定要重置所有数据吗？此操作不可恢复。')) {
      resetData()
      router.replace('/onboarding')
      setShowMenu(false)
    }
  }

  // 格式化时间戳
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes} 分钟前`
    if (hours < 24) return `${hours} 小时前`
    if (days < 7) return `${days} 天前`
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  // 计算预计完成率
  const calculateCompletionRate = () => {
    if (!currentGoal) return 0
    
    const now = new Date()
    let startDate: Date
    let endDate: Date
    
    if (currentGoal.period === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1)
      endDate = new Date(now.getFullYear() + 1, 0, 1)
    } else if (currentGoal.period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    } else {
      startDate = currentGoal.startDate ? new Date(currentGoal.startDate) : now
      endDate = currentGoal.endDate ? new Date(currentGoal.endDate) : new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
    }
    
    const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    const elapsedDays = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    const expectedProgress = (elapsedDays / totalDays) * currentGoal.targetAmount
    
    if (expectedProgress <= 0) return 0
    return (currentGoal.completedAmount / expectedProgress) * 100
  }

  // 如果正在加载或需要跳转，显示加载状态
  if (isLoading || onboardingCompleted === false || goals.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    )
  }

  const remaining = currentGoal ? currentGoal.targetAmount - currentGoal.completedAmount : 0
  const completionRate = calculateCompletionRate()

  return (
    <div className="min-h-screen bg-background">
      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
        duration={6000}
      />
      
      <div className="flex h-screen">
        {/* 左侧目标列表 */}
        <aside className="w-[280px] border-r border-border bg-card flex flex-col">
          <div className="p-4 border-b border-border">
            <Button
              variant="primary"
              size="sm"
              className="w-full"
              onClick={() => router.push('/onboarding')}
            >
              + 新建目标
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            {goals.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                <p>还没有目标</p>
                <p className="mt-2">点击上方按钮创建第一个目标</p>
              </div>
            ) : (
              <div className="space-y-1">
                {goals.map(goal => (
                  <SidebarItem
                    key={goal.id}
                    goal={goal}
                    isActive={goal.id === currentGoalId}
                    onClick={() => setCurrentGoalId(goal.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* 右侧详情面板 */}
        <main className="flex-1 overflow-y-auto relative">
          {/* 右上角菜单 */}
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg">
                <button
                  onClick={handleResetData}
                  className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-accent rounded-lg"
                >
                  重置数据
                </button>
              </div>
            )}
          </div>

          {currentGoal ? (
            <div className="container-desktop py-8">
              {/* 标题和统计 */}
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">
                    {currentGoal.name}
                  </h1>
                  <p className="text-muted-foreground">
                    目标：{currentGoal.targetAmount} {currentGoal.unit}
                  </p>
                </div>
                
                {/* 小型统计 */}
                <Card className="min-w-[200px]">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">累计完成</p>
                      <p className="text-2xl font-bold text-foreground">
                        {currentGoal.completedAmount} {currentGoal.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">剩余</p>
                      <p className="text-lg font-semibold text-foreground">
                        {remaining > 0 ? remaining : 0} {currentGoal.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">预计完成率</p>
                      <p className="text-lg font-semibold text-foreground">
                        {completionRate.toFixed(0)}%
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* 主按钮：记录一次 */}
              <div className="mb-8">
                <Button
                  ref={recordButtonRef}
                  variant="primary"
                  size="lg"
                  className={`w-full py-6 text-lg transition-all ${
                    highlightRecordButton
                      ? 'ring-4 ring-primary ring-offset-2 animate-pulse'
                      : ''
                  }`}
                  onClick={handleRecord}
                >
                  记录一次 {currentGoal.incrementValue !== 1 ? `(+${currentGoal.incrementValue})` : ''}
                </Button>
              </div>

              {/* 进度条 */}
              <Card className="mb-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">总体进度</h2>
                <Progress
                  completed={currentGoal.completedAmount}
                  total={currentGoal.targetAmount}
                />
              </Card>

              {/* 最近 7 次记录 */}
              <Card>
                <h2 className="text-lg font-semibold text-foreground mb-4">最近记录</h2>
                {currentGoalRecords.length === 0 ? (
                  <p className="text-muted-foreground text-sm">还没有记录</p>
                ) : (
                  <div className="space-y-3">
                    {currentGoalRecords.map(record => (
                      <div
                        key={record.id}
                        className="flex justify-between items-center py-2 border-b border-border last:border-0"
                      >
                        <span className="text-sm text-foreground">
                          +{record.value} {currentGoal.unit}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(record.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          ) : (
            <div className="container-desktop py-8">
              <Card className="text-center py-12">
                <p className="text-muted-foreground mb-4">还没有选择目标</p>
                {goals.length === 0 ? (
                  <Button
                    variant="primary"
                    onClick={() => router.push('/onboarding')}
                  >
                    创建第一个目标
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    请从左侧列表选择一个目标
                  </p>
                )}
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

// Dashboard 主组件，使用 Suspense 包裹 useSearchParams
export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
