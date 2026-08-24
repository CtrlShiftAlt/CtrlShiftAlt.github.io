# Fish Keeper · Aquarium Lifestyle Store

一个纯前端静态电商网站模板，采用无构建工具的组件化架构。

## 快速开始

本项目使用 `fetch()` 动态加载 HTML 组件和 JSON 数据，**不能直接双击 HTML 文件运行**（file:// 协议会因 CORS 策略失败），需要通过 HTTP 服务器访问。

### 方式一：启动脚本（推荐）

双击 `serve.bat`，然后浏览器打开 http://localhost:8000

### 方式二：Python

```bash
python -m http.server 8000
```

### 方式三：Node.js

```bash
npx serve .
```

## 目录结构

```
codex-demo-test/
├── index.html              # 首页入口
├── products.html           # 产品列表页入口
├── categories.html         # 分类页入口
├── about.html              # 关于我们入口
├── contact.html            # 联系我们入口
├── serve.bat               # 本地开发服务器启动脚本
│
├── css/
│   ├── base.css            # 全局变量、reset、通用类
│   └── components.css      # 共享组件样式（产品卡片、Tab 筛选）
│
├── js/
│   ├── utils.js            # 工具函数（escapeHtml、fetchPartial）
│   ├── app.js              # 应用启动器（bootApp，唯一全局暴露）
│   └── products.js         # 共享产品渲染模块（ProductRenderer）
│
├── data/
│   └── products.json       # 产品数据源
│
├── partials/               # 自包含 HTML 组件（HTML + CSS + JS）
│   ├── header.html         # 导航栏 + 移动端菜单
│   ├── footer.html         # 页脚
│   ├── search-modal.html   # 搜索弹窗
│   ├── hero.html           # 首屏
│   ├── services.html       # 服务保障
│   ├── categories.html     # 首页分类入口
│   ├── products.html       # 首页精选产品
│   ├── brand.html          # 品牌故事
│   ├── page-products.html  # 产品列表页内容
│   ├── page-categories.html# 分类页内容
│   ├── about.html          # 关于我们内容
│   └── contact.html        # 联系我们内容
│
└── images/                 # 产品图、分类图、SVG 图标
```

## 架构说明

### 组件化模式

每个页面入口是一个"薄壳"，只包含 SEO 元信息和挂载点 `<div id="xxx-slot">`。实际内容通过 `bootApp()` 动态加载 `partials/` 下的 HTML 片段注入。

每个 partial 是**自包含组件**：HTML 结构 + `<style>` 样式 + `<script>` 逻辑合一，修改一个组件不影响其他组件。

### 启动流程

```
bootApp(partials)
  ├─ Promise.all 并行 fetch 所有 partial → 注入挂载点
  ├─ 执行 partial 内联 <script>（innerHTML 注入的 script 需手动重建）
  ├─ 若存在 #products-slot → renderProducts() 渲染产品
  └─ 初始化各模块：header 滚动 / 搜索 / 移动端菜单 / 滚动动画 / Tab / 收藏 / 导航高亮
```

### 共享模块

- **`ProductRenderer`**（js/products.js）：统一产品卡片渲染、价格解析、数据加载，消除首页与列表页的重复代码
- **`components.css`**：统一产品卡片和 Tab 筛选样式

### 响应式断点

| 设备 | 断点 | 产品网格 |
|------|------|----------|
| PC | ≥1200px | 4 列 |
| 平板 | 768–1199px | 3 列 |
| 手机 | <768px | 2 列 |

## 技术栈

- 纯 HTML5 + CSS3 + 原生 JavaScript（ES6+）
- 零依赖、零构建、零框架
- 支持部署到任意静态托管（GitHub Pages / Netlify / Vercel / Nginx）

## SEO 与无障碍

- 每页独立 meta description / Open Graph / Twitter Card / canonical
- JSON-LD 结构化数据
- skip-link 跳转、aria 属性、键盘导航支持
- 图片懒加载、语义化标签
