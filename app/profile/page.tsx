'use client'

import { useRouter } from 'next/navigation'
import { useGoals } from '@/lib/hooks'
import AuthGuard from '@/components/AuthGuard'
import Card from '@/components/Card'
import Button from '@/components/Button'
import ArchivedGoalCard from '@/components/ArchivedGoalCard'
import { useAuth } from '@/lib/auth'

export default function ProfilePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { archivedGoals, restoreFromArchive, records } = useGoals()

  // 计算每个目标的记录数量
  const getGoalRecordCount = (goalId: string) => {
    return records.filter(r => r.goalId === goalId).length
  }

  // 恢复目标
  const handleRestore = async (goalId: string) => {
    const success = await restoreFromArchive(goalId)
    if (success) {
      // 恢复成功后可以显示提示或跳转
      router.push('/')
    }
  }

  return (
    <AuthGuard>
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
                    {user?.email || 'Your goals and progress'}
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
    </AuthGuard>
  )
}
