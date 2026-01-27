'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string) => Promise<{ error: any }>
  signInWithGoogle: () => Promise<{ data: any; error: any }>
  signOut: () => Promise<void>
}

// 检查 Supabase 配置是否有效
const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) return false
  if (url.includes('your_supabase') || url.includes('your-project-id')) return false
  if (key.includes('your_supabase') || key.includes('your_anon_key')) return false
  if (url === 'https://placeholder.supabase.co') return false
  
  return true
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // 获取当前 session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // 监听 auth 状态变化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string) => {
    // 检查 Supabase 配置
    if (!isSupabaseConfigured()) {
      return {
        error: {
          message: 'Supabase 环境变量未配置。请更新 .env.local 文件中的 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY',
        },
      }
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { error }
  }

  const signInWithGoogle = async () => {
    // 检查 Supabase 配置
    if (!isSupabaseConfigured()) {
      return {
        data: null,
        error: {
          message: 'Supabase 环境变量未配置。请更新 .env.local 文件中的 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY',
        },
      }
    }

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      
      // 如果有错误，直接返回
      if (error) {
        console.error('Google OAuth error:', error)
        return { data, error }
      }
      
      // 如果成功，data.url 应该包含重定向 URL
      // 但在浏览器环境中，Supabase 通常会自动重定向
      // 如果没有自动重定向，可以手动处理
      if (data?.url) {
        // 在浏览器中，通常会自动跳转，但为了保险可以手动处理
        window.location.href = data.url
      }
      
      return { data, error: null }
    } catch (err: any) {
      console.error('Google OAuth exception:', err)
      return {
        data: null,
        error: {
          message: err.message || 'Google 登录失败，请重试',
        },
      }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
