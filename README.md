# July - 计数类目标追踪 MVP

基于 Next.js 14+ (App Router) + TypeScript + Tailwind CSS + Supabase 的 PC 端计数类产品 MVP。

## 产品概念

- 用户创建目标（例如：一年读完 12 本书 / 一年跳舞 50 小时）
- 用户完成一次事件后点击"记录一次"进行打卡
- 目标可以按不同单位计数：次 / 本 / 小时
- 核心目标：第一次使用 30 秒内能完成一次记录

## 技术栈

- **Next.js 14+** - React 框架，使用 App Router
- **TypeScript** - 类型安全
- **Tailwind CSS** - 实用优先的 CSS 框架
- **Supabase** - 用户认证 + PostgreSQL 数据持久化
- **React Hooks** - 状态管理

## 快速开始

### 安装依赖

```bash
npm install
```

### 环境变量

创建 `.env.local`，填入 Supabase 项目配置：

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
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
│   ├── globals.css          # 全局样式、Tailwind 配置、动画定义
│   ├── layout.tsx           # 根布局（含 AuthProvider）
│   ├── page.tsx             # Dashboard 页面 (/)
│   ├── profile/
│   │   └── page.tsx         # Profile 页面（已归档目标）
│   ├── onboarding/
│   │   └── page.tsx         # 新手引导页面 (/onboarding)
│   └── auth/callback/
│       └── route.ts         # OAuth 回调处理
├── components/              # 可复用组件
│   ├── Button.tsx           # 按钮组件（支持 forwardRef）
│   ├── Card.tsx             # 卡片组件
│   ├── CelebrationCard.tsx  # 目标完成庆祝卡片（含收纳动画）
│   ├── ConfirmDialog.tsx    # 确认对话框（支持二次确认）
│   ├── Input.tsx            # 输入框组件
│   ├── Progress.tsx         # 进度条组件
│   ├── SidebarItem.tsx      # 侧边栏项目组件
│   ├── Toast.tsx            # Toast 通知（支持 Undo）
│   └── AuthGuard.tsx        # 认证保护组件
├── lib/
│   ├── hooks.ts             # useGoals 状态管理 Hook
│   ├── auth.tsx             # AuthProvider & useAuth Hook
│   ├── supabase.ts          # Supabase 客户端配置
│   └── mockData.ts          # 目标模板数据
├── types/
│   └── index.ts             # TypeScript 类型接口
└── public/images/
    ├── tree-button.png      # 打卡按钮静态图
    └── tree-button.gif      # 打卡按钮动效 GIF
```

## 页面说明

### Dashboard (/)
主控制台，包含：
- **左侧目标列表**（280px）：展示所有进行中目标，支持切换；底部有 My Profile 入口
- **右侧详情面板**：
  - 目标名称、统计信息（累计完成 / 剩余 / 完成率）
  - 「记录一次」主按钮（树图标，点击触发摇晃 + GIF 动效）
  - 总体进度条
  - 最近 7 次记录列表
  - 达到目标上限后按钮替换为 ✅ 完成状态

### Profile (/profile)
归档目标管理页，包含：
- 用户基础信息（邮箱）
- 已归档目标列表（完成/手动结束的目标）
- 支持恢复归档目标

### Onboarding (/onboarding)
新手引导，3 步流程：
1. 选择目标模板（读书 / 跳舞 / 喝水 / 自定义）
2. 填写参数（名称、单位、目标量、周期、每次增量）
3. 确认创建，跳转 Dashboard

## 功能特性

- ✅ 创建和管理多个目标
- ✅ 支持不同单位（次 / 本 / 小时等）
- ✅ 支持不同周期（一年 / 一个月 / 自定义日期）
- ✅ 每次记录可配置增量（1 或 0.5）
- ✅ 打卡上限保护：completedAmount 不可超过 targetAmount（前端 + hook 双重校验）
- ✅ 完成目标时弹出庆祝卡片（目标名称 + 实际用时 + 鼓励文案）
- ✅ 庆祝卡片关闭后触发收纳动画（缩小飞向 My Profile 按钮），目标自动归档
- ✅ 刷新后不重复弹出庆祝（归档后从 activeGoals 移除）
- ✅ 防连点：打卡请求进行中时按钮禁用
- ✅ 实时进度条与完成率
- ✅ 最近 7 次记录历史
- ✅ Supabase 数据持久化
- ✅ 邮箱 OTP + Google OAuth 登录
- ✅ 归档目标系统（End goal / 手动归档 + Undo 恢复）
- ✅ My Profile 页面展示已归档目标
- ✅ Profile 页面 Back to Home 按钮（左上角固定）

## 数据模型

### Goal（目标）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 唯一标识 |
| name | string | 目标名称 |
| unit | string | 单位（次/本/小时等） |
| targetAmount | number | 目标总量 |
| completedAmount | number | 已完成数量（≤ targetAmount） |
| period | string | 周期（year / month / custom） |
| startDate | string | 开始日期（ISO） |
| endDate | string | 结束日期（ISO，自定义时有值） |
| incrementValue | number | 每次打卡增量（1 或 0.5） |
| createdAt | string | 创建时间 |
| status | string | active / archived |
| archivedAt | string | 归档时间 |

### Record（记录）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 唯一标识 |
| goalId | string | 关联目标 ID |
| value | number | 本次记录值 |
| timestamp | string | 完整时间戳 |
| date | string | 日期 YYYY-MM-DD（按日统计用） |

## 核心交互说明

### 打卡上限保护
- 前端：`handleRecordWithFx` 在调用前检查 `completedAmount >= targetAmount`，直接拦截并 Toast 提示
- Hook 层：`addRecord` 再次校验并 `throw 'GOAL_LIMIT_REACHED'`，防止绕过前端
- 实际写入值通过 `Math.min(value, target - completed)` clamp，保证不超出

### 庆祝卡片 & 收纳动画
- 当 `addRecord` 返回 `isNowComplete: true` 时，延迟 600ms（等树摇动画）后弹出 `CelebrationCard`
- 卡片展示：目标名、实际用时（startDate → 当前）、「恭喜你离目标又近了一步」
- 点击关闭：通过 `getBoundingClientRect()` 计算卡片中心 → My Profile 按钮中心的位移，CSS transition 实现 `translate + scale(0.08) + opacity:0` 飞入收纳（500ms）
- 动画结束后调用 `archiveGoal`，目标进入归档，刷新后不再触发庆祝

## 样式说明

- 桌面端适配（>= 1024px），居中布局，最大宽度 1100px
- CSS 动画（`globals.css`）：
  - `tree-shake`：打卡按钮摇晃（600ms）
  - `celebration-enter`：庆祝卡片弹性入场（400ms spring）
  - `celebration-bounce`：庆祝 emoji 弹跳（800ms）
- 极简清爽产品风格，Tailwind CSS 设计系统
