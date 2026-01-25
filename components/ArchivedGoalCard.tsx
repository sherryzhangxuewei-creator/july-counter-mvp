'use client'

import { Goal } from '@/types'
import Button from './Button'
import Card from './Card'

interface ArchivedGoalCardProps {
  goal: Goal
  totalRecords: number
  onRestore: (goalId: string) => void
}

export default function ArchivedGoalCard({
  goal,
  totalRecords,
  onRestore,
}: ArchivedGoalCardProps) {
  const createdAt = new Date(goal.createdAt)
  const archivedAt = goal.archivedAt ? new Date(goal.archivedAt) : null

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  return (
    <Card className="transition-all duration-300 hover:shadow-md">
      <div className="space-y-4">
        {/* 标题和状态 */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {goal.name}
            </h3>
            <span className="inline-block px-2 py-1 text-xs font-medium bg-accent text-muted-foreground rounded-md">
              Archived
            </span>
          </div>
        </div>

        {/* 时间跨度 */}
        <div className="text-sm text-muted-foreground space-y-1">
          <p>
            <span className="font-medium">Created:</span> {formatDate(createdAt)}
          </p>
          {archivedAt && (
            <p>
              <span className="font-medium">Archived:</span> {formatDate(archivedAt)}
            </p>
          )}
        </div>

        {/* 统计信息 */}
        <div className="pt-2 border-t border-border">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">{totalRecords}</span> check ins
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Completed: <span className="font-medium">{goal.completedAmount}</span> / {goal.targetAmount} {goal.unit}
          </p>
        </div>

        {/* 操作按钮 */}
        <div className="pt-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => onRestore(goal.id)}
            className="w-full"
          >
            Restore goal
          </Button>
        </div>
      </div>
    </Card>
  )
}
