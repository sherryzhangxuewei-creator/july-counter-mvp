// 侧边栏项目组件 - 用于目标列表项
interface SidebarItemProps {
  goal: {
    id: string
    name: string
    unit: string
    completedAmount: number
    targetAmount: number
  }
  isActive: boolean
  onClick: () => void
  isDeleting?: boolean // 是否正在删除（用于动画）
}

export default function SidebarItem({ goal, isActive, onClick, isDeleting = false }: SidebarItemProps) {
  const percentage = goal.targetAmount > 0 
    ? Math.min((goal.completedAmount / goal.targetAmount) * 100, 100) 
    : 0
  
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-md transition-all duration-300 cursor-pointer ${
        isDeleting
          ? 'opacity-0 scale-[0.96] translate-y-2 pointer-events-none'
          : isActive
          ? 'bg-accent text-accent-foreground'
          : 'hover:bg-accent/50 text-foreground'
      }`}
      style={{
        transition: isDeleting ? 'opacity 350ms ease-out, transform 350ms ease-out' : undefined,
      }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-medium text-sm truncate flex-1">{goal.name}</span>
        <span className="text-xs text-muted-foreground ml-2">
          {goal.completedAmount}/{goal.targetAmount} {goal.unit}
        </span>
      </div>
      <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300 rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </button>
  )
}

