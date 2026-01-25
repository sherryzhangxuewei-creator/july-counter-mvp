'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useGoals } from '@/lib/hooks'
import { goalTemplates } from '@/lib/mockData'
import { GoalFormData, Goal, GoalPeriod } from '@/types'
import Card from '@/components/Card'
import Button from '@/components/Button'
import Input from '@/components/Input'
import Progress from '@/components/Progress'

export default function Onboarding() {
  const router = useRouter()
  const { addGoal, completeOnboarding } = useGoals()
  const [currentStep, setCurrentStep] = useState(1)
  
  // 默认选中"读书"模板
  const defaultTemplate = goalTemplates.find(t => t.id === 'reading') || goalTemplates[0]
  
  const [formData, setFormData] = useState<GoalFormData>({
    name: defaultTemplate.id === 'custom' ? '' : `一年读完 ${defaultTemplate.defaultAmount || 12} ${defaultTemplate.defaultUnit}`,
    unit: defaultTemplate.defaultUnit,
    targetAmount: defaultTemplate.defaultAmount || 12,
    period: 'year',
    incrementValue: defaultTemplate.defaultUnit === '小时' ? 1 : 1,
  })
  const [selectedTemplate, setSelectedTemplate] = useState<string>(defaultTemplate.id)
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  const totalSteps = 3

  // Step 1: 选择模板
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)
    const template = goalTemplates.find(t => t.id === templateId)
    if (template) {
      const defaultIncrement = template.defaultUnit === '小时' ? 1 : 1
      setFormData(prev => ({
        ...prev,
        name: template.id === 'custom' ? '' : `一年${template.name} ${template.defaultAmount || 0} ${template.defaultUnit}`,
        unit: template.defaultUnit,
        targetAmount: template.defaultAmount || 0,
        incrementValue: defaultIncrement,
      }))
    }
  }

  // 初始化：默认选中读书模板
  useEffect(() => {
    if (defaultTemplate) {
      handleTemplateSelect(defaultTemplate.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Step 2: 填写参数
  const handleFormChange = (field: keyof GoalFormData, value: any) => {
    setFormData({ ...formData, [field]: value })
  }

  // 快速创建：使用当前表单数据直接创建
  const handleQuickCreate = () => {
    if (!formData.name.trim()) {
      alert('请输入目标名称')
      return
    }
    if (formData.targetAmount <= 0) {
      alert('请输入有效的目标总量')
      return
    }
    handleCreateGoal()
  }

  // Step 3: 创建目标
  const handleCreateGoal = () => {
    let startDate: string | undefined
    let endDate: string | undefined

    if (formData.period === 'year') {
      const now = new Date()
      startDate = new Date(now.getFullYear(), 0, 1).toISOString()
      endDate = new Date(now.getFullYear() + 1, 0, 1).toISOString()
    } else if (formData.period === 'month') {
      const now = new Date()
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()
    } else {
      startDate = customStartDate ? new Date(customStartDate).toISOString() : undefined
      endDate = customEndDate ? new Date(customEndDate).toISOString() : undefined
    }

    const newGoal: Goal = {
      id: `goal-${Date.now()}`,
      name: formData.name,
      unit: formData.unit,
      targetAmount: formData.targetAmount,
      completedAmount: 0,
      period: formData.period,
      startDate,
      endDate,
      incrementValue: formData.incrementValue,
      createdAt: new Date().toISOString(),
    }

    addGoal(newGoal)
    completeOnboarding()
    
    // 确保 localStorage 写入完成后再跳转，避免竞态条件
    // 使用 setTimeout 确保状态更新和 localStorage 写入完成
    setTimeout(() => {
      router.replace(`/?newGoal=true&goalName=${encodeURIComponent(formData.name)}`)
    }, 100)
  }

  const handleNext = () => {
    if (currentStep === 1 && !selectedTemplate) {
      alert('请选择一个目标模板')
      return
    }
    if (currentStep === 2) {
      if (!formData.name.trim()) {
        alert('请输入目标名称')
        return
      }
      if (formData.targetAmount <= 0) {
        alert('请输入有效的目标总量')
        return
      }
      if (formData.period === 'custom') {
        if (!customStartDate || !customEndDate) {
          alert('请选择自定义起止日期')
          return
        }
        if (new Date(customEndDate) <= new Date(customStartDate)) {
          alert('结束日期必须晚于开始日期')
          return
        }
      }
    }
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // 获取增量选项（根据单位）
  const getIncrementOptions = () => {
    if (formData.unit === '小时') {
      return [0.5, 1, 2]
    }
    return [1]
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container-desktop py-8">
        <div className="max-w-2xl mx-auto">
          <Card padding="lg">
            {/* 进度条 */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-foreground">
                  步骤 {currentStep} / {totalSteps}
                </span>
              </div>
              <Progress
                completed={currentStep}
                total={totalSteps}
                showLabel={false}
              />
            </div>

            {/* Step 1: 选择模板 */}
            {currentStep === 1 && (
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  选择一个目标模板
                </h1>
                <p className="text-muted-foreground mb-6">
                  选择一个预设模板，或创建自定义目标
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {goalTemplates.map(template => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template.id)}
                      className={`relative p-4 rounded-lg border-2 transition-all text-left cursor-pointer ${
                        selectedTemplate === template.id
                          ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/20'
                          : 'border-border hover:border-primary/50 hover:bg-accent/50'
                      }`}
                    >
                      {selectedTemplate === template.id && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      <div className="text-2xl mb-2">{template.icon}</div>
                      <div className={`font-medium ${selectedTemplate === template.id ? 'text-primary' : 'text-foreground'}`}>
                        {template.name}
                      </div>
                      {template.defaultAmount !== undefined && template.defaultAmount > 0 && (
                        <div className="text-sm text-muted-foreground mt-1">
                          默认：{template.defaultAmount} {template.defaultUnit}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: 填写参数 */}
            {currentStep === 2 && (
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  填写目标参数
                </h1>
                <p className="text-muted-foreground mb-6">
                  设置您的目标名称和周期（可快速创建，无需修改）
                </p>
                <div className="space-y-4">
                  <Input
                    label="目标名称"
                    placeholder="例如：一年读完 12 本书"
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                  />
                  
                  <Input
                    label="目标总量"
                    type="number"
                    placeholder="12"
                    value={formData.targetAmount}
                    onChange={(e) => handleFormChange('targetAmount', Number(e.target.value))}
                  />

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      周期
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring mb-3"
                      value={formData.period}
                      onChange={(e) => handleFormChange('period', e.target.value as GoalPeriod)}
                    >
                      <option value="year">一年</option>
                      <option value="month">一个月</option>
                      <option value="custom">自定义起止日期</option>
                    </select>
                    
                    {formData.period === 'custom' && (
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <Input
                          label="开始日期"
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                        />
                        <Input
                          label="结束日期"
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  {/* 快速创建按钮 */}
                  <div className="pt-4 border-t border-border">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleQuickCreate}
                    >
                      ⚡ 快速创建（使用当前设置）
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: 确认创建 */}
            {currentStep === 3 && (
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  确认并创建目标
                </h1>
                <p className="text-muted-foreground mb-6">
                  请确认您的目标信息
                </p>
                <Card className="bg-accent/50">
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-muted-foreground">目标名称：</span>
                      <span className="font-medium text-foreground ml-2">{formData.name}</span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">目标总量：</span>
                      <span className="font-medium text-foreground ml-2">
                        {formData.targetAmount}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">周期：</span>
                      <span className="font-medium text-foreground ml-2">
                        {formData.period === 'year' ? '一年' : formData.period === 'month' ? '一个月' : '自定义'}
                      </span>
                    </div>
                  </div>
                </Card>
                <div className="mt-6 p-4 bg-primary/10 rounded-lg">
                  <p className="text-sm text-foreground">
                    ✅ 创建成功后，您将自动跳转到 Dashboard，可以立即开始记录！
                  </p>
                </div>
              </div>
            )}

            {/* 导航按钮 */}
            <div className="flex justify-between items-center pt-6 mt-8 border-t border-border">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={currentStep === 1}
              >
                上一步
              </Button>

              {currentStep < totalSteps ? (
                <Button variant="primary" onClick={handleNext}>
                  下一步
                </Button>
              ) : (
                <Button variant="primary" onClick={handleCreateGoal}>
                  创建目标
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
