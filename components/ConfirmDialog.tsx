'use client'

import Button from './Button'

// 确认对话框组件 - 用于删除等危险操作的二次确认
interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  confirmVariant?: 'primary' | 'destructive' | 'outline'
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText = '确认',
  cancelText = '取消',
  confirmVariant = 'destructive',
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmDialogProps) {
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
        <h2 className="text-xl font-semibold text-foreground mb-2">
          {title}
        </h2>
        <p className="text-muted-foreground mb-6">
          {description}
        </p>
        
        {/* 按钮组 */}
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? '处理中...' : confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}
