import { ReactNode } from 'react'

// 卡片组件 - 统一的卡片容器样式
interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg'
}

export default function Card({ children, className = '', padding = 'md' }: CardProps) {
  const paddings = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  }
  
  return (
    <div className={`bg-card text-card-foreground rounded-lg border border-border shadow-sm ${paddings[padding]} ${className}`}>
      {children}
    </div>
  )
}

