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
import CelebrationCard from '@/components/CelebrationCard'
import AuthGuard from '@/components/AuthGuard'
import { useAuth } from '@/lib/auth'

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
  const [deletedGoalData, setDeletedGoalData] = useState<{ goal: any; records: any[] } | null>(null)
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null)
  // 【新增】庆祝卡片相关状态
  const [showCelebration, setShowCelebration] = useState(false)
  const [celebrationGoal, setCelebrationGoal] = useState<{ id: string; name: string; startTime: string } | null>(null)
  // 【新增】防止同一目标重复弹庆祝（session 内）
  const celebratedGoalsRef = useRef<Set<string>>(new Set())
  // 【新增】防止按钮连点
  const [isRecording, setIsRecording] = useState(false)
  // 【新增】My Profile 按钮的 ref，用于收纳动画的目标位置
  const profileButtonRef = useRef<HTMLButtonElement>(null)
  const { signOut } = useAuth()
  
  const {
    goals,
    records,
    activeGoals,
    currentGoal,
    currentGoalId,
    currentGoalRecords,
    onboardingCompleted,
    isLoading,
    setCurrentGoalId,
    addRecord,
    archiveGoal,
    restoreFromArchive,
    restoreGoal,
    getGoalStats,
    resetData,
  } = useGoals()

  // 首次访问检查：如果没有完成 onboarding 或没有 active 目标，跳转到 onboarding
  useEffect(() => {
    if (!isLoading) {
      // 如果 URL 中有 newGoal 参数，说明刚创建了目标，不要跳转回 onboarding
      const isNewGoal = searchParams.get('newGoal') === 'true'
      if (!isNewGoal && (onboardingCompleted === false || activeGoals.length === 0)) {
        router.replace('/onboarding')
      }
    }
  }, [isLoading, onboardingCompleted, activeGoals.length, router, searchParams])

  // 监听目标列表变化：如果归档后没有 active 目标了，跳转到 onboarding
  useEffect(() => {
    if (!isLoading && activeGoals.length === 0 && onboardingCompleted === true) {
      // 延迟一下，避免与归档操作的跳转冲突
      const timer = setTimeout(() => {
        router.replace('/onboarding')
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [activeGoals.length, isLoading, onboardingCompleted, router])

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

  // 处理记录一次（写入数据，返回是否刚好完成）
  const handleRecord = async (): Promise<boolean> => {
    if (!currentGoal) return false
    try {
      const result = await addRecord(currentGoal.id, currentGoal.incrementValue)
      setHighlightRecordButton(false)
      return result?.isNowComplete ?? false
    } catch (error: any) {
      if (error?.message === 'GOAL_LIMIT_REACHED') {
        setToastMessage('你已完成全部目标，无法继续打卡 🎯')
        setShowToast(true)
      }
      return false
    }
  }

  // 点击记录：先触发动效，再写入记录
  // 【修改】增加上限拦截 + 连点防护 + 完成时触发庆祝卡
  const handleRecordWithFx = async () => {
    // 【新增】防止连续点击
    if (isRecording) return

    // 【新增】前端上限校验：已完成则拦截并提示
    if (!currentGoal || currentGoal.completedAmount >= currentGoal.targetAmount) {
      setToastMessage('你已完成全部目标，无法继续打卡 🎯')
      setShowToast(true)
      return
    }

    setIsRecording(true)

    // 触发树摇晃（用 class 切换，避免 remount 导致白屏）
    setIsTreeShaking(true)
    if (shakeTimerRef.current) window.clearTimeout(shakeTimerRef.current)
    shakeTimerRef.current = window.setTimeout(() => setIsTreeShaking(false), 650)

    // 触发 GIF 播放：重置 GIF 到第一帧
    setRecordImageError(false)
    setIsGifLoaded(false)
    setRecordGifToken((t) => t + 1)
    setIsRecordGifPlaying(true)
    if (gifTimerRef.current) window.clearTimeout(gifTimerRef.current)
    gifTimerRef.current = window.setTimeout(() => {
      setIsRecordGifPlaying(false)
    }, 7000)

    // 【新增】记录快照（避免异步后 currentGoal 变化导致闭包读旧值）
    const goalSnapshot = currentGoal

    try {
      const isNowComplete = await handleRecord()

      // 【新增】如果刚刚完成目标，且本 session 内未弹过庆祝
      if (isNowComplete && !celebratedGoalsRef.current.has(goalSnapshot.id)) {
        celebratedGoalsRef.current.add(goalSnapshot.id)
        // 延迟 600ms，让树摇晃动画先播完
        setTimeout(() => {
          setCelebrationGoal({
            id: goalSnapshot.id,
            name: goalSnapshot.name,
            startTime: goalSnapshot.startDate || goalSnapshot.createdAt,
          })
          setShowCelebration(true)
        }, 600)
      }
    } finally {
      setIsRecording(false)
    }
  }

  // 【新增】关闭庆祝卡片：动画结束后归档目标
  const handleCelebrationClose = async () => {
    setShowCelebration(false)
    if (celebrationGoal) {
      await archiveGoal(celebrationGoal.id)
      setCelebrationGoal(null)
    }
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


  // 处理归档目标（End goal）
  const handleDeleteGoal = async () => {
    console.log('handleDeleteGoal called, currentGoal:', currentGoal)
    if (!currentGoal) {
      console.log('No current goal, returning')
      return
    }

    console.log('Starting archive process for goal:', currentGoal.id)
    setIsDeleting(true)
    setDeletingGoalId(currentGoal.id)
    
    try {
      const goalIdToArchive = currentGoal.id
      
      // 延迟一下，让动画先播放
      await new Promise(resolve => setTimeout(resolve, 350))
      
      const result = await archiveGoal(goalIdToArchive)
      
      if (result.success && result.archivedGoal) {
        // 保存归档的数据用于undo
        const goalRecords = records.filter((r: any) => r.goalId === goalIdToArchive)
        setDeletedGoalData({
          goal: result.archivedGoal,
          records: goalRecords,
        })
        
        setShowDeleteDialog(false)
        setShowMenu(false)
        setToastMessage(`Goal archived. You can find it in Archived goals.`)
        setShowToast(true)
        // 归档后跳转逻辑由 useEffect 处理
      } else {
        setToastMessage('归档目标失败，请重试')
        setShowToast(true)
      }
    } catch (error) {
      console.error('Failed to archive goal:', error)
      setToastMessage('归档目标失败，请重试')
      setShowToast(true)
    } finally {
      setIsDeleting(false)
      // 延迟清除deletingGoalId，确保动画完成
      setTimeout(() => setDeletingGoalId(null), 100)
    }
  }

  // 处理Undo恢复（从归档恢复）
  const handleUndoDelete = async () => {
    if (!deletedGoalData) return

    // 如果目标是 archived 状态，使用 restoreFromArchive
    if (deletedGoalData.goal.status === 'archived') {
      const success = await restoreFromArchive(deletedGoalData.goal.id)
      if (success) {
        setDeletedGoalData(null)
        setToastMessage('目标已恢复')
        setShowToast(true)
      }
    } else {
      // 兼容旧逻辑（如果目标被完全删除）
      const success = await restoreGoal(deletedGoalData.goal, deletedGoalData.records)
      if (success) {
        setDeletedGoalData(null)
        setToastMessage('目标已恢复')
        setShowToast(true)
      }
    }
  }

  // 处理重置数据
  const handleResetData = async () => {
    if (confirm('确定要重置所有数据吗？此操作不可恢复。')) {
      await resetData()
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
  const shouldShowLoading = isLoading || (!isNewGoal && (onboardingCompleted === false || activeGoals.length === 0))
  
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
        onClose={() => {
          setShowToast(false)
          // 清除undo数据（Toast关闭后不再支持undo）
          if (deletedGoalData) {
            setTimeout(() => setDeletedGoalData(null), 100)
          }
        }}
        duration={8000}
        showUndo={!!deletedGoalData}
        onUndo={handleUndoDelete}
      />
      
      {/* 【新增】庆祝卡片 */}
      {showCelebration && celebrationGoal && (
        <CelebrationCard
          goalName={celebrationGoal.name}
          startTime={celebrationGoal.startTime}
          profileButtonRef={profileButtonRef}
          onClose={handleCelebrationClose}
        />
      )}

      {/* 删除确认对话框 */}
      {currentGoal && (
        <ConfirmDialog
          isOpen={showDeleteDialog}
          title="Say goodbye to this goal?"
          description={
            <span>
              You worked on this goal for <span className="font-semibold">{getGoalStats(currentGoal.id)?.daysSinceCreation || 0} days</span>.
            </span>
          }
          stats={getGoalStats(currentGoal.id) || undefined}
          confirmText="End goal"
          cancelText="Keep it"
          confirmVariant="soft-destructive"
          onConfirm={handleDeleteGoal}
          onCancel={() => setShowDeleteDialog(false)}
          isLoading={isDeleting}
          enableDoubleConfirm={true}
        />
      )}
      
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
            {activeGoals.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                <p>还没有目标</p>
                <p className="mt-2">点击上方按钮创建第一个目标</p>
              </div>
            ) : (
              <div className="space-y-1">
                {activeGoals.map(goal => (
                  <SidebarItem
                    key={goal.id}
                    goal={goal}
                    isActive={goal.id === currentGoalId}
                    onClick={() => setCurrentGoalId(goal.id)}
                    isDeleting={deletingGoalId === goal.id}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 左下角 My profile 按钮 — ref 用于庆祝卡片的收纳动画目标位置 */}
          <div className="p-4 border-t border-border">
            <Button
              ref={profileButtonRef}
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => router.push('/profile')}
            >
              My profile
            </Button>
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
                    className="w-full text-left px-4 py-2 text-sm text-foreground hover:text-muted-foreground hover:bg-accent rounded-lg flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    End goal
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
                <button
                  onClick={signOut}
                  className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-accent rounded-lg"
                >
                  登出
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
              {/* 【新增】达到上限时显示已完成提示，替换记录按钮 */}
              <div className="flex flex-col items-center mt-24 mb-12">
                {currentGoal.completedAmount >= currentGoal.targetAmount ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-36 h-36 rounded-lg bg-accent flex items-center justify-center shadow-xl opacity-60">
                      <span className="text-5xl">✅</span>
                    </div>
                    <p className="text-sm text-muted-foreground">目标已完成</p>
                  </div>
                ) : (
                <button
                  ref={recordButtonRef}
                  onClick={handleRecordWithFx}
                  disabled={isRecording}
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
                    ${isRecording ? 'opacity-70 cursor-not-allowed' : ''}
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
                )}
                {currentGoal.completedAmount < currentGoal.targetAmount && (
                  <p className="mt-3 text-sm text-muted-foreground">点我记录一次</p>
                )}
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
                {activeGoals.length === 0 ? (
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
    <AuthGuard>
      <Suspense fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-muted-foreground">加载中...</div>
        </div>
      }>
        <DashboardContent />
      </Suspense>
    </AuthGuard>
  )
}
