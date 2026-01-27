'use client'

import { useState, useEffect } from 'react'
import Button from './Button'

// 确认对话框组件 - 用于删除等危险操作的二次确认
interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  description: string | React.ReactNode
  stats?: {
    daysSinceCreation: number
    daysWithRecords: number
    totalRecords: number
    lastRecordTime: Date | null
  }
  confirmText?: string
  cancelText?: string
  confirmVariant?: 'primary' | 'destructive' | 'soft-destructive' | 'outline'
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
  enableDoubleConfirm?: boolean // 是否启用二次微确认
}

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  stats,
  confirmText = '确认',
  cancelText = '取消',
  confirmVariant = 'destructive',
  onConfirm,
  onCancel,
  isLoading = false,
  enableDoubleConfirm = false,
}: ConfirmDialogProps) {
  const [showDoubleConfirm, setShowDoubleConfirm] = useState(false)
  const [confirmButtonProgress, setConfirmButtonProgress] = useState(0)

  // 重置状态当对话框关闭时
  useEffect(() => {
    if (!isOpen) {
      setShowDoubleConfirm(false)
      setConfirmButtonProgress(0)
    }
  }, [isOpen])

  // 二次确认动画
  useEffect(() => {
    if (showDoubleConfirm && enableDoubleConfirm) {
      const duration = 600 // 600ms
      const startTime = Date.now()
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime
        const progress = Math.min((elapsed / duration) * 100, 100)
        setConfirmButtonProgress(progress)
        
        if (progress >= 100) {
          clearInterval(interval)
        }
      }, 16) // ~60fps

      return () => clearInterval(interval)
    }
  }, [showDoubleConfirm, enableDoubleConfirm])

  const handleConfirmClick = () => {
    if (enableDoubleConfirm && !showDoubleConfirm) {
      // 第一次点击：显示二次确认
      setShowDoubleConfirm(true)
    } else {
      // 第二次点击（或没有启用二次确认）：执行确认操作
      console.log('ConfirmDialog: Calling onConfirm')
      onConfirm()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* 对话框内容 */}
      <div className="relative bg-card border border-border rounded-lg shadow-xl p-6 max-w-md w-full mx-4 animate-in fade-in zoom-in-95">
        <h2 className="text-xl font-semibold text-foreground mb-3">
          {title}
        </h2>
        
        {/* 描述内容 */}
        <div className="text-muted-foreground mb-4 space-y-2">
          {typeof description === 'string' ? (
            <p>{description}</p>
          ) : (
            description
          )}
        </div>

        {/* 统计信息 */}
        {stats && (
          <div className="mb-6 p-4 bg-accent/30 rounded-lg space-y-2">
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• {stats.daysWithRecords} days with records</p>
              <p>• {stats.totalRecords} total records</p>
              {stats.lastRecordTime && (
                <p>• Last record: {stats.lastRecordTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
              )}
            </div>
          </div>
        )}

        {stats && (
          <p className="text-sm text-muted-foreground mb-6">
            All records will be archived and no longer editable.
          </p>
        )}
        
        {/* 按钮组 */}
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading || showDoubleConfirm}
          >
            {cancelText}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={handleConfirmClick}
            disabled={isLoading}
            className="relative overflow-hidden"
            style={{
              position: 'relative',
            }}
          >
            {showDoubleConfirm && enableDoubleConfirm ? (
              <>
                <span className="relative z-10">Yes, I'm ready</span>
                {confirmButtonProgress > 0 && (
                  <div
                    className="absolute inset-0 bg-current opacity-20 transition-all duration-75 pointer-events-none"
                    style={{
                      width: `${confirmButtonProgress}%`,
                      transition: 'width 75ms linear',
                    }}
                  />
                )}
              </>
            ) : (
              isLoading ? '处理中...' : confirmText
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
