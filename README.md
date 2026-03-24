# Majdata Hub

<div align="center">
  <img src="public/icon.png" alt="Majdata Hub Logo" width="120" height="120">
  
  <h3>🎵 Majdata Hub</h3>
  <p>一个用于管理 MajdataPlay 谱面和皮肤的桌面应用</p>
  
  ![Version](https://img.shields.io/badge/version-0.3.2-blue.svg)
  ![License](https://img.shields.io/badge/license-MIT-green.svg)
  ![Tauri](https://img.shields.io/badge/Tauri-2.0-orange.svg)
  ![React](https://img.shields.io/badge/React-19-61dafb.svg)
</div>

---

## ⚠️ 重要声明

- 我们**不提倡**使用 MajdataPlay 游玩本家谱面，请支持街机游戏！
- 请勿将其他软件的游玩视频标为 MajdataPlay，但是当然欢迎你分享真 MajdataPlay 的游玩视频！
- 本软件为**开源免费软件**，开发者不做任何保证。使用本软件即表示您接受相关风险。

## ✨ 主要功能

### 游戏管理

- **下载 MajdataPlay**
- **更新 MajdataPlay 至最新版**

### 谱面管理

- **本地谱面管理**：浏览、删除本地谱面
- **在线谱面下载**：从 majdata.net 搜索和下载谱面
- **批量下载**：支持批量选择和下载谱面到指定分类
- **分类管理**：创建和管理谱面分类文件夹

### 皮肤管理

- **本地皮肤管理**：浏览和管理本地安装的皮肤
- **在线皮肤下载**：从社区获取皮肤资源

## 🛠️ 技术栈

### 前端

- **框架**: React 19 + TypeScript
- **路由**: React Router 7
- **UI 库**: Mantine Core 8
- **样式**: Tailwind CSS 4
- **动画**: Framer Motion
- **图标**: Tabler Icons
- **构建工具**: Vite 7

### 后端

- **框架**: Tauri 2
- **语言**: Rust
- **主要功能**:
  - 文件系统操作
  - ZIP 压缩解压
  - 网络请求与下载
  - 文件校验和计算

## 📦 安装与使用

### 前置要求

- **Node.js**
- **pnpm**
- **Rust** 环境配置请参照 [Tauri 官方文档](https://v2.tauri.app/zh-cn/start/prerequisites/#system-dependencies)

### 开发环境配置

1. **克隆仓库**

   ```bash
   git clone https://github.com/yourusername/majdata-hub.git
   cd majdata-hub
   ```

2. **安装依赖**

   ```bash
   pnpm install
   ```

3. **启动开发服务器**

   ```bash
   pnpm dev
   ```

### 构建应用

构建生产版本：

```bash
pnpm build
```

构建产物将生成在 `src-tauri/target/release/bundle/` 目录下。

## 📂 项目结构

``` raw
majdata-hub/
├── src/                      # 前端源代码
│   ├── components/           # React 组件
│   │   ├── Layout.tsx        # 应用布局
│   │   ├── LocalCharts.tsx   # 本地谱面管理
│   │   ├── OnlineCharts.tsx  # 在线谱面浏览
│   │   ├── LocalSkins.tsx    # 本地皮肤管理
│   │   └── OnlineSkins.tsx   # 在线皮肤浏览
│   ├── pages/                # 页面组件
│   │   ├── HomePage.tsx      # 首页
│   │   ├── ChartPage.tsx     # 谱面页
│   │   ├── SkinPage.tsx      # 皮肤页
│   │   ├── GamePage.tsx      # 游戏设置页
│   │   └── SettingPage.tsx   # 设置页
│   ├── contexts/             # React Context
│   ├── utils/                # 工具函数
│   └── types/                # TypeScript 类型定义
├── src-tauri/                # Tauri 后端代码
│   ├── src/
│   │   ├── commands/         # Tauri 命令
│   │   │   ├── file_system.rs   # 文件系统操作
│   │   │   ├── network.rs       # 网络请求
│   │   │   ├── zip.rs           # ZIP 操作
│   │   │   └── checksum.rs      # 文件校验
│   │   ├── models.rs         # 数据模型
│   │   └── lib.rs            # 主入口
│   └── tauri.conf.json       # Tauri 配置
└── package.json              # 项目配置
```

## 🎯 使用指南

### 管理谱面

1. **浏览本地谱面**
   - 进入"谱面"页面，切换到"本地"标签
   - 查看已安装的谱面及其完整性状态
   - 可按分类筛选，或删除不需要的谱面

2. **下载在线谱面**
   - 切换到"在线"标签，浏览 majdata.net 的谱面
   - 使用搜索框查找特定谱面
   - 点击"下载"按钮或启用批量模式下载多个谱面
   - 选择目标分类，谱面将自动下载并解压到对应文件夹

### 管理皮肤

1. **浏览本地皮肤**
   - 进入"皮肤"页面，切换到"本地"标签
   - 查看已安装的皮肤

2. **下载在线皮肤**
   - 切换到"在线"标签
   - 浏览和下载社区皮肤

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 开发流程

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的改动 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

## 📜 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🔗 相关链接

- [MajdataPlay](https://github.com/LingFeng-bbben/MajdataPlay) - Majdata 游玩软件
- [Majdata.net](https://majdata.net) - 谱面资源网站
- [Tauri](https://tauri.app/) - 桌面应用框架
- [React](https://react.dev/) - 前端框架
- [Mantine](https://mantine.dev/) - React UI 组件库

## 👥 致谢

感谢我自己

---

<div align="center">
  Made with ❤️ by KirisameVanilla
</div>
