'use client'

import { useEffect, useState, Suspense, useRef } from 'react'
import { useGoals } from '@/lib/hooks'
import { useRouter, useSearchParams } from 'next/navigation'
import SidebarItem from '@/components/SidebarItem'
import Card from '@/components/Card'
import Button from '@/components/Button'
import Progress from '@/components/Progress'
import Toast from '@/components/Toast'
import ConfirmDialog from '@/components/ConfirmDialog'

// Dashboard 内容组件
function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [toastMessage, setToastMessage] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [highlightRecordButton, setHighlightRecordButton] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [isTreeShaking, setIsTreeShaking] = useState(false)
  const [recordImageError, setRecordImageError] = useState(false)
  const [isRecordGifPlaying, setIsRecordGifPlaying] = useState(false)
  const [recordGifToken, setRecordGifToken] = useState(0)
  const gifTimerRef = useRef<number | null>(null)
  const shakeTimerRef = useRef<number | null>(null)
  const [isGifLoaded, setIsGifLoaded] = useState(false)
  const gifImgRef = useRef<HTMLImageElement>(null)
  const recordButtonRef = useRef<HTMLButtonElement>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const {
    goals,
    currentGoal,
    currentGoalId,
    currentGoalRecords,
    onboardingCompleted,
    isLoading,
    setCurrentGoalId,
    addRecord,
    deleteGoal,
    resetData,
  } = useGoals()

  // 首次访问检查：如果没有完成 onboarding 或没有目标，跳转到 onboarding
  useEffect(() => {
    if (!isLoading) {
      // 如果 URL 中有 newGoal 参数，说明刚创建了目标，不要跳转回 onboarding
      const isNewGoal = searchParams.get('newGoal') === 'true'
      if (!isNewGoal && (onboardingCompleted === false || goals.length === 0)) {
        router.replace('/onboarding')
      }
    }
  }, [isLoading, onboardingCompleted, goals.length, router, searchParams])

  // 监听目标列表变化：如果删除后没有目标了，跳转到 onboarding
  useEffect(() => {
    if (!isLoading && goals.length === 0 && onboardingCompleted === true) {
      // 延迟一下，避免与删除操作的跳转冲突
      const timer = setTimeout(() => {
        router.replace('/onboarding')
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [goals.length, isLoading, onboardingCompleted, router])

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (showMenu && !target.closest('[data-menu-container]')) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showMenu])

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

  // 处理记录一次（带树摇晃动画）
  const handleRecord = () => {
    if (currentGoal) {
      addRecord(currentGoal.id, currentGoal.incrementValue)
      setHighlightRecordButton(false) // 记录后取消高亮
    }
  }

  // 点击记录：先触发动效，再写入记录
  const handleRecordWithFx = () => {
    // 触发树摇晃（用 class 切换，避免 remount 导致白屏）
    setIsTreeShaking(true)
    if (shakeTimerRef.current) window.clearTimeout(shakeTimerRef.current)
    shakeTimerRef.current = window.setTimeout(() => setIsTreeShaking(false), 650)

    // 触发 GIF 播放：重置 GIF 到第一帧
    setRecordImageError(false)
    setIsGifLoaded(false)
    
    // 更新 token 来重置 GIF，开始加载
    setRecordGifToken((t) => t + 1)
    
    // 标记开始播放 GIF
    setIsRecordGifPlaying(true)
    
    // 清理之前的结束 timer
    if (gifTimerRef.current) window.clearTimeout(gifTimerRef.current)
    // 7 秒后切回静态图（GIF 实际时长 6秒 + 缓冲）
    gifTimerRef.current = window.setTimeout(() => {
      setIsRecordGifPlaying(false)
    }, 7000)
    
    handleRecord()
  }

  // 组件卸载时清理 timer
  useEffect(() => {
    return () => {
      if (gifTimerRef.current) window.clearTimeout(gifTimerRef.current)
      if (shakeTimerRef.current) window.clearTimeout(shakeTimerRef.current)
    }
  }, [])

  // 预加载 GIF，避免点击时才加载导致空白
  // 预加载多个带不同 token 的 URL，确保浏览器缓存
  useEffect(() => {
    if (typeof window === 'undefined') return
    // 预加载基础 GIF
    const img1 = new Image()
    img1.src = '/images/tree-button.gif?play=1'
    // 预加载带 token 的 GIF（提前缓存）
    const img2 = new Image()
    img2.src = '/images/tree-button.gif?play=2'
  }, [])


  // 处理删除目标
  const handleDeleteGoal = async () => {
    if (!currentGoal) return

    setIsDeleting(true)
    
    try {
      // 保存目标名称用于提示
      const goalName = currentGoal.name
      const goalIdToDelete = currentGoal.id
      const remainingGoalsCount = goals.length - 1
      
      const success = deleteGoal(goalIdToDelete)
      
      if (success) {
        setShowDeleteDialog(false)
        setShowMenu(false)
        setToastMessage(`已删除目标：${goalName}`)
        setShowToast(true)
        // 删除后跳转逻辑由 useEffect 处理
      } else {
        setToastMessage('删除失败，请重试')
        setShowToast(true)
      }
    } catch (error) {
      console.error('Failed to delete goal:', error)
      setToastMessage('删除失败，请重试')
      setShowToast(true)
    } finally {
      setIsDeleting(false)
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

  // 导出数据（本地备份）
  const exportData = () => {
    const data = {
      goals: localStorage.getItem('goals'),
      records: localStorage.getItem('records'),
      onboardingCompleted: localStorage.getItem('onboardingCompleted'),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `july-counter-backup-${new Date().toISOString()}.json`
    a.click()
    URL.revokeObjectURL(url)
    setShowMenu(false)
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

  // 计算完成率：已记录次数/目标次数*100%
  const calculateCompletionRate = () => {
    if (!currentGoal || currentGoal.targetAmount === 0) return 0
    return (currentGoal.completedAmount / currentGoal.targetAmount) * 100
  }

  // 如果正在加载或需要跳转，显示加载状态
  // 如果 URL 中有 newGoal 参数，说明刚创建了目标，给更多时间加载数据
  const isNewGoal = searchParams.get('newGoal') === 'true'
  const shouldShowLoading = isLoading || (!isNewGoal && (onboardingCompleted === false || goals.length === 0))
  
  if (shouldShowLoading) {
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
      
      {/* 删除确认对话框 */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="删除此目标？"
        description="此操作无法撤销，将删除该目标及其所有记录。"
        confirmText="删除"
        cancelText="取消"
        confirmVariant="destructive"
        onConfirm={handleDeleteGoal}
        onCancel={() => setShowDeleteDialog(false)}
        isLoading={isDeleting}
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
          <div className="absolute top-4 right-4 z-10" data-menu-container>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg" data-menu-container>
                {currentGoal && (
                  <button
                    onClick={() => {
                      setShowDeleteDialog(true)
                      setShowMenu(false)
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-accent rounded-lg"
                  >
                    删除目标
                  </button>
                )}
                <button
                  onClick={exportData}
                  className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-accent rounded-lg"
                >
                  导出数据
                </button>
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
                      <p className="text-xs text-muted-foreground mb-1">完成率</p>
                      <p className="text-lg font-semibold text-foreground">
                        {completionRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* 主按钮：记录一次 */}
              <div className="flex flex-col items-center mt-24 mb-12">
                <button
                  ref={recordButtonRef}
                  onClick={handleRecordWithFx}
                  className={`
                    w-36 h-36
                    bg-transparent
                    flex items-center justify-center
                    shadow-xl
                    rounded-lg
                    cursor-pointer
                    transition-transform
                    overflow-hidden
                    relative
                    ${isTreeShaking ? 'tree-shake' : ''}
                  `}
                  style={{
                    transformOrigin: '50% 100%'
                  }}
                >
                  {/* PNG 底图：始终存在，z-index 较低，确保在 GIF 加载期间始终可见 */}
                  <img
                    src="/images/tree-button.png"
                    alt="记录一次"
                    className="absolute top-0 left-0 w-full h-full object-cover"
                    style={{
                      opacity: isRecordGifPlaying && isGifLoaded ? 0 : 1,
                      zIndex: 1,
                      transition: 'opacity 0ms ease-out',
                      pointerEvents: 'none',
                      width: '100%',
                      height: '100%',
                    }}
                    onError={() => {
                      setRecordImageError(true)
                    }}
                  />

                  {/* GIF 叠层：始终存在，通过 opacity 和 z-index 控制显示 */}
                  <img
                    ref={gifImgRef}
                    src={`/images/tree-button.gif?play=${recordGifToken}`}
                    alt="记录一次动效"
                    className="absolute top-0 left-0 w-full h-full object-cover"
                    style={{
                      opacity: isRecordGifPlaying && isGifLoaded ? 1 : 0,
                      zIndex: 2,
                      transition: 'opacity 0ms ease-out',
                      pointerEvents: 'none',
                      width: '100%',
                      height: '100%',
                    }}
                    onLoad={() => {
                      // GIF 加载完成，可以显示了
                      setIsGifLoaded(true)
                    }}
                    onError={() => {
                      setRecordImageError(true)
                      setIsRecordGifPlaying(false)
                    }}
                  />

                  {/* 占位符 - 仅当图片加载失败时显示（避免遮挡你的图片） */}
                  {recordImageError && (
                    <div className="absolute inset-0 flex items-center justify-center text-6xl pointer-events-none">
                      🌳
                    </div>
                  )}

                </button>
                <p className="mt-3 text-sm text-muted-foreground">点我记录一次</p>
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
