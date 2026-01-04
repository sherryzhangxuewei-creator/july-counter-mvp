'use client'

import { useEffect } from 'react'

// Toast 提示组件 - 用于显示临时消息
interface ToastProps {
  message: string
  isVisible: boolean
  onClose: () => void
  duration?: number
}

export default function Toast({ message, isVisible, onClose, duration = 5000 }: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onClose])

  if (!isVisible) return null

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2">
      <div className="bg-card border border-border rounded-lg shadow-lg px-6 py-4 max-w-md">
        <p className="text-foreground text-sm font-medium">{message}</p>
      </div>
    </div>
  )
}

