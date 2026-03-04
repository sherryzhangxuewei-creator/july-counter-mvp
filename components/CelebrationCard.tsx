'use client'

import { useRef, useState } from 'react'

interface CelebrationCardProps {
  goalName: string
  // 用于计算实际用时（startDate 或 createdAt）
  startTime: string
  profileButtonRef: React.RefObject<HTMLButtonElement>
  onClose: () => void
}

function formatElapsed(ms: number): string {
  const days = Math.floor(ms / (1000 * 60 * 60 * 24))
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))

  if (days > 0 && hours > 0) return `${days} 天 ${hours} 小时`
  if (days > 0) return `${days} 天`
  if (hours > 0 && minutes > 0) return `${hours} 小时 ${minutes} 分钟`
  if (hours > 0) return `${hours} 小时`
  if (minutes > 0) return `${minutes} 分钟`
  return '刚刚完成'
}

export default function CelebrationCard({
  goalName,
  startTime,
  profileButtonRef,
  onClose,
}: CelebrationCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isExiting, setIsExiting] = useState(false)
  const [cardStyle, setCardStyle] = useState<React.CSSProperties>({})
  const [overlayStyle, setOverlayStyle] = useState<React.CSSProperties>({})

  const elapsedMs = Date.now() - new Date(startTime).getTime()

  const handleClose = () => {
    if (isExiting) return

    // 【关键】若拿不到两端的 rect，直接关闭
    const cardEl = cardRef.current
    const profileEl = profileButtonRef.current
    if (!cardEl || !profileEl) {
      onClose()
      return
    }

    const cardRect = cardEl.getBoundingClientRect()
    const profileRect = profileEl.getBoundingClientRect()

    // 计算卡片中心 → profile 按钮中心的位移
    const dx = profileRect.left + profileRect.width / 2 - (cardRect.left + cardRect.width / 2)
    const dy = profileRect.top + profileRect.height / 2 - (cardRect.top + cardRect.height / 2)

    setIsExiting(true)
    // 【新增】收纳动画：卡片缩小并移动到 My Profile 按钮位置
    setCardStyle({
      transform: `translate(${dx}px, ${dy}px) scale(0.08)`,
      opacity: 0,
      transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease-in',
    })
    setOverlayStyle({
      opacity: 0,
      transition: 'opacity 0.5s ease-in',
    })

    setTimeout(onClose, 520)
  }

  return (
    // 全屏遮罩
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={overlayStyle}
    >
      {/* 半透明背景 */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* 庆祝卡片 */}
      <div
        ref={cardRef}
        className="relative bg-card border border-border rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl celebration-enter"
        style={cardStyle}
      >
        {/* 关闭按钮 */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
          aria-label="关闭"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 主体内容 */}
        <div className="text-center">
          {/* 庆祝图标，带弹跳动画 */}
          <div className="text-6xl mb-5 celebration-bounce select-none">🎉</div>

          {/* 目标名称 */}
          <h2 className="text-xl font-bold text-foreground mb-1">{goalName}</h2>

          {/* 实际用时 */}
          <p className="text-sm text-muted-foreground mb-5">
            实际用时：<span className="font-medium text-foreground">{formatElapsed(elapsedMs)}</span>
          </p>

          {/* 固定文案 */}
          <div className="bg-accent rounded-xl px-4 py-3">
            <p className="text-foreground font-semibold text-base">恭喜你离目标又近了一步</p>
          </div>
        </div>
      </div>
    </div>
  )
}
