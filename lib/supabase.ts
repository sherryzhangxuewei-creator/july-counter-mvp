import { createClient } from '@supabase/supabase-js'

// 获取环境变量
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 检查是否是占位符值
const isPlaceholder = (value: string | undefined) => {
  if (!value) return true
  return value.includes('your_supabase') || 
         value.includes('your-project-id') || 
         value.includes('placeholder')
}

// 验证 Supabase URL 格式
const isValidSupabaseUrl = (url: string | undefined) => {
  if (!url) return false
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.includes('supabase.co') || urlObj.hostname.includes('supabase.in')
  } catch {
    return false
  }
}

// 验证 Supabase Key 格式（支持 JWT 格式和 publishable key 格式）
const isValidSupabaseKey = (key: string | undefined) => {
  if (!key) return false
  // JWT 格式（以 eyJ 开头）
  if (key.startsWith('eyJ')) return true
  // Publishable key 格式（以 sb_publishable_ 开头）
  if (key.startsWith('sb_publishable_')) return true
  return false
}

// 开发环境调试：检查环境变量是否加载
if (typeof window === 'undefined' && process.env.NODE_ENV === 'development') {
  const urlStatus = supabaseUrl 
    ? (isPlaceholder(supabaseUrl) ? '⚠ Placeholder' : '✓ Loaded')
    : '✗ Missing'
  const keyStatus = supabaseAnonKey
    ? (isPlaceholder(supabaseAnonKey) ? '⚠ Placeholder' : '✓ Loaded')
    : '✗ Missing'
  
  console.log('Supabase URL:', urlStatus)
  console.log('Supabase Anon Key:', keyStatus)
  
  if (isPlaceholder(supabaseUrl) || isPlaceholder(supabaseAnonKey)) {
    console.warn(
      '\n⚠️  Warning: Supabase environment variables contain placeholder values.\n' +
      'Please update .env.local with your actual Supabase credentials.\n'
    )
  }
}

// 验证环境变量并创建客户端
let supabase: ReturnType<typeof createClient>

// 检查是否是构建时（SSR/SSG）
const isBuildTime = typeof window === 'undefined' && (process.env.NEXT_PHASE === 'phase-production-build' || process.env.NODE_ENV === 'production')

// 验证环境变量
const isUrlValid = supabaseUrl && !isPlaceholder(supabaseUrl) && isValidSupabaseUrl(supabaseUrl)
const isKeyValid = supabaseAnonKey && !isPlaceholder(supabaseAnonKey) && isValidSupabaseKey(supabaseAnonKey)

if (!isUrlValid || !isKeyValid) {
  const missing = []
  if (!supabaseUrl || isPlaceholder(supabaseUrl) || !isValidSupabaseUrl(supabaseUrl)) {
    missing.push('NEXT_PUBLIC_SUPABASE_URL')
  }
  if (!supabaseAnonKey || isPlaceholder(supabaseAnonKey) || !isValidSupabaseKey(supabaseAnonKey)) {
    missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
  
  const errorMessage = 
    `Missing or invalid Supabase environment variables: ${missing.join(', ')}\n\n` +
    `Please update .env.local with your actual Supabase credentials:\n` +
    `1. Go to your Supabase project dashboard\n` +
    `2. Navigate to Settings > API\n` +
    `3. Copy the Project URL and anon/public key\n` +
    `4. Update .env.local file\n` +
    `5. Restart the dev server\n`
  
  // 在构建时使用占位符值，允许构建完成
  if (isBuildTime) {
    // 构建时使用占位符，不显示错误
    supabase = createClient(
      'https://placeholder.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTIwMDAsImV4cCI6MTk2MDc2ODAwMH0.placeholder'
    )
  } else if (process.env.NODE_ENV === 'development') {
    // 开发环境：显示警告，但允许应用启动
    if (typeof window !== 'undefined') {
      console.warn(
        '⚠️  Supabase 环境变量未配置或为占位符值。\n' +
        '请更新 .env.local 文件中的 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY\n' +
        '当前无法使用 Supabase 功能（登录、数据存储等）'
      )
    }
    // 使用占位符 URL，但实际功能无法使用
    supabase = createClient(
      'https://placeholder.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTIwMDAsImV4cCI6MTk2MDc2ODAwMH0.placeholder'
    )
  } else {
    // 生产运行时必须要有正确的配置
    throw new Error(errorMessage)
  }
} else {
  // 验证通过，创建 Supabase 客户端
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and Key must be provided')
  }
  supabase = createClient(supabaseUrl, supabaseAnonKey)
}

export { supabase }
