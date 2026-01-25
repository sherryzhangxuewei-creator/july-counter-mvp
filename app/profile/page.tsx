'use client'

import { useGoals } from '@/lib/hooks'
import { useRouter } from 'next/navigation'
import Card from '@/components/Card'
import ArchivedGoalCard from '@/components/ArchivedGoalCard'
import Button from '@/components/Button'

export default function Profile() {
  const router = useRouter()
  const { archivedGoals, records, restoreFromArchive } = useGoals()

  // 获取目标的记录数
  const getGoalRecordCount = (goalId: string) => {
    return records.filter(r => r.goalId === goalId).length
  }

  // 处理恢复目标
  const handleRestore = (goalId: string) => {
    const success = restoreFromArchive(goalId)
    if (success) {
      // 恢复后跳转到首页
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container-desktop py-8">
        <div className="max-w-4xl mx-auto">
          {/* 用户基础信息区 */}
          <Card className="mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center">
                <span className="text-2xl">👤</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-1">
                  Profile
                </h1>
                <p className="text-muted-foreground text-sm">
                  Your goals and progress
                </p>
              </div>
            </div>
          </Card>

          {/* Archived Goals 列表 */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">
                Archived Goals
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/')}
              >
                Back to Home
              </Button>
            </div>

            {archivedGoals.length === 0 ? (
              <Card className="text-center py-12">
                <p className="text-muted-foreground mb-2">
                  No archived goals yet
                </p>
                <p className="text-sm text-muted-foreground">
                  Goals you close will appear here
                </p>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {archivedGoals.map(goal => (
                  <ArchivedGoalCard
                    key={goal.id}
                    goal={goal}
                    totalRecords={getGoalRecordCount(goal.id)}
                    onRestore={handleRestore}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
