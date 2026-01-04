// 进度条组件 - 显示目标完成进度
interface ProgressProps {
  completed: number
  total: number
  showLabel?: boolean
  className?: string
}

export default function Progress({ completed, total, showLabel = true, className = '' }: ProgressProps) {
  const percentage = total > 0 ? Math.min((completed / total) * 100, 100) : 0
  
  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-sm text-muted-foreground">
            {completed} / {total}
          </span>
          <span className="text-sm font-medium text-foreground">
            {percentage.toFixed(0)}%
          </span>
        </div>
      )}
      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300 rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

