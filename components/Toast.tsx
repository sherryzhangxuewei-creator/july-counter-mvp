'use client'

import { useEffect } from 'react'

// Toast 提示组件 - 用于显示临时消息
interface ToastProps {
  message: string
  isVisible: boolean
  onClose: () => void
  duration?: number
  onUndo?: () => void // Undo 回调
  showUndo?: boolean // 是否显示 Undo 按钮
}

export default function Toast({ 
  message, 
  isVisible, 
  onClose, 
  duration = 5000,
  onUndo,
  showUndo = false,
}: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onClose])

  const handleUndo = () => {
    if (onUndo) {
      onUndo()
    }
    onClose()
  }

  if (!isVisible) return null

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2">
      <div className="bg-card border border-border rounded-lg shadow-lg px-6 py-4 max-w-md flex items-center justify-between gap-4">
        <p className="text-foreground text-sm font-medium flex-1">{message}</p>
        {showUndo && onUndo && (
          <button
            onClick={handleUndo}
            className="text-primary hover:text-primary/80 text-sm font-medium underline flex-shrink-0"
          >
            Undo
          </button>
        )}
      </div>
    </div>
  )
}

