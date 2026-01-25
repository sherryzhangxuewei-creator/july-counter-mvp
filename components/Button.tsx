import { ButtonHTMLAttributes, ReactNode, forwardRef } from 'react'

// 按钮组件 - 统一的按钮样式
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'soft-destructive'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}, ref) => {
  const baseStyles = 'font-medium transition-all duration-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer'
  
  const variants = {
    primary: 'bg-primary text-primary-foreground hover:opacity-90 focus:ring-primary',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-secondary',
    outline: 'border border-border bg-transparent hover:bg-accent hover:text-accent-foreground focus:ring-ring',
    ghost: 'hover:bg-accent hover:text-accent-foreground focus:ring-ring',
    destructive: 'bg-destructive text-destructive-foreground hover:opacity-90 focus:ring-destructive',
    'soft-destructive': 'bg-destructive/10 text-destructive hover:bg-destructive/20 focus:ring-destructive/50'
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }
  
  return (
    <button
      ref={ref}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
})

Button.displayName = 'Button'

export default Button

