# July - 计数类目标追踪 MVP

基于 Next.js 14+ (App Router) + TypeScript + Tailwind CSS 的 PC 端计数类产品 MVP。

## 产品概念

- 用户创建目标（例如：一年读完 12 本书 / 一年跳舞 50 小时）
- 用户完成一次事件后点击"记录一次"
- 目标可以按不同单位计数：次 / 本 / 小时
- 核心目标：第一次使用 30 秒内能完成一次记录

## 技术栈

- **Next.js 14+** - React 框架，使用 App Router
- **TypeScript** - 类型安全
- **Tailwind CSS** - 实用优先的 CSS 框架
- **React Hooks** - 状态管理（使用 localStorage 持久化）

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

### 构建生产版本

```bash
npm run build
npm start
```

## 项目结构

```
July/
├── app/
│   ├── globals.css          # 全局样式和 Tailwind 配置
│   ├── layout.tsx           # 根布局组件
│   ├── page.tsx             # Dashboard 页面 (/)
│   └── onboarding/
│       └── page.tsx         # 新手引导页面 (/onboarding)
├── components/              # 可复用组件
│   ├── Button.tsx           # 按钮组件
│   ├── Card.tsx             # 卡片组件
│   ├── Input.tsx            # 输入框组件
│   ├── Progress.tsx         # 进度条组件
│   └── SidebarItem.tsx      # 侧边栏项目组件
├── lib/                     # 工具函数和 hooks
│   ├── hooks.ts             # 状态管理 Hook
│   └── mockData.ts          # Mock 数据
├── types/                   # TypeScript 类型定义
│   └── index.ts             # 类型接口定义
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
├── postcss.config.js
└── README.md
```

## 页面说明

### Dashboard (/)
主控制台页面，包含：
- **左侧目标列表**（宽 280px）：展示所有目标，支持切换
- **右侧详情面板**：显示当前目标的详细信息
  - 目标名称和统计信息
  - 今日进度
  - 「记录一次」主按钮
  - 总体进度条
  - 最近 7 次记录列表

### Onboarding (/onboarding)
新手引导页面，3 步流程：
1. **选择目标模板**：读书/跳舞/喝水/自定义
2. **填写目标参数**：目标名称、单位、目标总量、周期、每次记录增量
3. **确认并创建**：确认信息后创建目标，自动跳转到 Dashboard

## 功能特性

- ✅ 创建和管理多个目标
- ✅ 支持不同单位（次/本/小时等）
- ✅ 支持不同周期（一年/一个月/自定义日期）
- ✅ 每次记录可配置增量（1 或 0.5）
- ✅ 实时显示今日进度和总体进度
- ✅ 记录历史查看（最近 7 次）
- ✅ 数据持久化（localStorage）
- ✅ 新目标创建提示

## 样式说明

- 页面默认宽度适配桌面端（>= 1024px）
- 居中布局，最大宽度 1100px
- 使用 Tailwind CSS 设计系统
- 极简、清爽的产品化风格
- 组件化设计，易于维护和扩展

## 开发说明

- 所有页面使用 TypeScript 编写
- 使用 Next.js App Router 进行路由管理
- 响应式设计，适配桌面端显示
- 使用 React Hooks 进行状态管理
- 数据存储在 localStorage（可后续替换为后端 API）

## 组件说明

### Button
统一的按钮组件，支持多种变体（primary、secondary、outline、ghost）和尺寸。

### Input
统一的输入框组件，支持标签和错误提示。

### Card
统一的卡片容器组件，用于内容分组。

### Progress
进度条组件，显示目标完成百分比。

### SidebarItem
侧边栏列表项组件，用于目标列表展示。

## 数据模型

### Goal（目标）
- id: 唯一标识
- name: 目标名称
- unit: 单位
- targetAmount: 目标总量
- completedAmount: 已完成数量
- period: 周期类型
- incrementValue: 每次记录增量

### Record（记录）
- id: 唯一标识
- goalId: 关联的目标 ID
- value: 记录值
- timestamp: 时间戳
- date: 日期（用于按日统计）
