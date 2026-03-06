'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, isSupabaseConfigured } from '@/lib/auth'

interface AuthGuardProps {
  children: ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const demoMode = !isSupabaseConfigured()

  useEffect(() => {
    if (!demoMode && !loading && !user) {
      router.push('/login')
    }
  }, [demoMode, user, loading, router])

  // Demo 模式：Supabase 未配置时跳过鉴权，直接渲染子页面
  if (demoMode) {
    return <>{children}</>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    )
  }

  if (!user) return null
  return <>{children}</>
}
