'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import Card from '@/components/Card'
import Button from '@/components/Button'
import Input from '@/components/Input'
import Toast from '@/components/Toast'

function LoginContent() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showToast, setShowToast] = useState(false)
  const { signIn, signInWithGoogle, user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  // 如果已登录，跳转到首页（在 useEffect 中处理，避免渲染期间触发路由更新）
  useEffect(() => {
    if (!loading && user) {
      router.replace('/')
    }
  }, [loading, user, router])

  // 检查是否有错误参数
  useEffect(() => {
    const error = searchParams.get('error')
    if (error === 'oauth') {
      setMessage('OAuth 登录失败，请重试')
      setShowToast(true)
    } else if (error === 'config') {
      setMessage('配置错误，请检查环境变量')
      setShowToast(true)
    }
  }, [searchParams])

  // 如果正在加载或已登录，显示加载状态或返回 null，避免闪烁
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    )
  }

  if (user) {
    return null // 等待 useEffect 执行完成跳转
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      setMessage('请输入邮箱地址')
      setShowToast(true)
      return
    }

    setIsLoading(true)
    const { error } = await signIn(email)
    setIsLoading(false)

    if (error) {
      // 如果是配置错误，显示更详细的提示
      if (error.message?.includes('环境变量未配置')) {
        setMessage(
          '⚠️  Supabase 未配置\n\n' +
          '请按以下步骤配置：\n' +
          '1. 访问 https://app.supabase.com\n' +
          '2. 创建项目并进入 Settings > API\n' +
          '3. 复制 Project URL 和 anon key\n' +
          '4. 更新 .env.local 文件\n' +
          '5. 重启开发服务器'
        )
      } else {
        setMessage(`登录失败: ${error.message}`)
      }
      setShowToast(true)
    } else {
      setMessage('登录链接已发送到您的邮箱，请查收')
      setShowToast(true)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    const { error } = await signInWithGoogle()
    setIsLoading(false)

    if (error) {
      // 如果是配置错误，显示更详细的提示
      if (error.message?.includes('环境变量未配置')) {
        setMessage(
          '⚠️  Supabase 未配置\n\n' +
          '请按以下步骤配置：\n' +
          '1. 访问 https://app.supabase.com\n' +
          '2. 创建项目并进入 Settings > API\n' +
          '3. 复制 Project URL 和 anon key\n' +
          '4. 更新 .env.local 文件\n' +
          '5. 重启开发服务器'
        )
      } else if (error.message?.includes('provider is not enabled') || error.message?.includes('Unsupported provider')) {
        setMessage(
          '⚠️  Google 登录未启用\n\n' +
          '请在 Supabase Dashboard 中启用：\n' +
          '1. 访问 https://app.supabase.com\n' +
          '2. 进入 Authentication > Providers\n' +
          '3. 找到 Google 并点击启用\n' +
          '4. 配置 Google OAuth（需要 Google Cloud Console）\n' +
          '5. 添加 Redirect URL: http://localhost:3000/auth/callback'
        )
      } else {
        setMessage(`Google 登录失败: ${error.message}`)
      }
      setShowToast(true)
    }
    // OAuth 会跳转到 Google，不需要显示成功消息
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Toast
        message={message}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
        duration={5000}
      />
      
      <div className="w-full max-w-md px-4">
        <Card padding="lg">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Welcome to July
            </h1>
            <p className="text-muted-foreground text-sm">
              使用邮箱登录，开始记录你的目标
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="邮箱地址"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? '发送中...' : '发送登录链接'}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">或</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full mt-4"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              使用 Google 登录
            </Button>
          </div>

          <p className="mt-6 text-xs text-muted-foreground text-center">
            我们将向您的邮箱发送一个登录链接，点击链接即可登录
          </p>
        </Card>
      </div>
    </div>
  )
}

export default function Login() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
