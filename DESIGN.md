# 薪跳 · 设计系统（DESIGN.md）

> 本文档是《需求文档.md》「附录 A · 设计系统」的完整版。所有值已在 `styles.css` 的 `:root` 中以 `hsl()` 落地为 CSS 自定义属性（token），组件样式只允许引用 token，不写死数值。

## A.1 颜色

| Token              | HSL                | 落地 Hex | 用途                          |
| ------------------ | ------------------ | -------- | ----------------------------- |
| `--primary`        | `9 78% 55%`        | `#E5484D` | 主番茄红，按钮/图标/状态选中  |
| `--primary-deep`   | `9 70% 45%`        | `#B73033` | hover 加深                    |
| `--primary-soft`   | `9 78% 96%`        | `#FDEAEA` | 浅番茄，提示背景              |
| `--primary-light`  | `15 60% 94%`       | `#F9DDD4` | 进度条轨道 / 任务底色         |
| `--background`     | `30 60% 98%`       | `#FDF8F3` | 页面背景                      |
| `--card`           | `0 0% 100%`        | `#FFFFFF` | 卡片 / 浮层 / 胶囊            |
| `--foreground`     | `250 12% 28%`      | `#45404D` | 正文文字                      |
| `--muted-foreground` | `250 8% 45%`    | `#787485` | 次要文字                      |
| `--accent`         | `20 80% 93%`       | `#FCDDC9` | 描边 / 辅助点缀               |
| `--accent-warm`    | `38 92% 85%`       | `#FCE4B0` | 节假日小图标底色              |
| `--border`         | `20 40% 90%`       | `#EFE2D9` | 描边                          |
| `--ring`           | `9 78% 55%`        | `#E5484D` | 聚焦环                        |

**禁用清单**：黑色粗边框、强投影、小圆角、霓虹发光。

## A.2 圆角

| Token      | 值       | 用途                |
| ---------- | -------- | ------------------- |
| `--radius` | `1rem`   | 卡片基础圆角        |
| `--r-md`   | `0.875rem` | 任务项 / 输入框   |
| `--r-lg`   | `1.125rem` | 大卡片             |
| `--r-xl`   | `1.25rem` | 面板 / 弹窗         |
| `--r-pill` | `9999px` | 所有胶囊形元素      |

## A.3 阴影

| Token           | 值                                             | 用途          |
| --------------- | ---------------------------------------------- | ------------- |
| `--shadow-card` | `0 4px 16px -4px hsl(9 60% 55% / 0.18)`        | 卡片 / 浮层   |
| `--shadow-hover`| `0 8px 28px -6px hsl(9 60% 50% / 0.28)`        | hover / 弹窗  |
| `--shadow-sm`   | `0 2px 8px -2px hsl(9 60% 55% / 0.12)`         | 头像 / 轻提示 |

## A.4 字体

- 标题 / 胶囊金额：`Resource Han Rounded`（`ResourceHanRoundedCN-Bold.ttf`）
- 正文 / 输入：`HarmonyOS Sans`（`HarmonyOSSans_Regular.ttf`）
- CDN：`https://resource-static.bj.bcebos.com/fonts-skill/`
- 降级：`PingFang SC` → `Microsoft YaHei` → 系统无衬线
- 加载策略：`font-display: swap`

## A.5 动效曲线

- 全局缓动：`cubic-bezier(0.34, 1.56, 0.64, 1)` —— 先过冲再回弹，模拟"柔软糖果被按压"
- 按压节奏：
  - hover：scale 1.04 ~ 1.10
  - active：scale 0.92 ~ 0.95
  - 过渡时长：180 ~ 320ms
- `@keyframes rise`：出现动效（translateY 8px + scale 0.98 → 1）
- `@keyframes chipPop`：选中态 / Toast 动效（scale 0.6 → 1）
- 所有按钮、卡片、checkbox 在 hover/active 使用相同节奏与曲线

## A.6 滚动条

- 宽 6px，圆角 `9999px`
- 未 hover：`--border` 浅米色；hover 加深为 `--accent`

## 应用规则

1. 组件样式只引用 token，禁止出现 `#` 色值字面量（avatar SVG 除外，属插画资产）。
2. 金额翻页 roller 的位移单位为 `em`，字号变化时无需改动。
3. 布局遵循《需求文档.md》§3 页面结构，模块开关控制渲染（关闭后不占位）。
