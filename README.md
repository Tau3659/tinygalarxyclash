# 🎮 无人机战略游戏

一款基于HTML5 Canvas的实时策略游戏，支持多种游戏模式和AI难度。

![游戏版本](https://img.shields.io/badge/version-1.0.0-blue)
![Node版本](https://img.shields.io/badge/node-%3E%3D16.0.0-green)
![许可证](https://img.shields.io/badge/license-MIT-orange)

## ✨ 游戏特性

- 🎯 **三种游戏模式**
  - 1v1 对战模式
  - 2v2 团队模式
  - 混战模式（FFA）

- 🤖 **三种AI难度**
  - 简单：被动防御
  - 中等：平衡策略
  - 困难：主动进攻

- 📱 **全平台支持**
  - 桌面端完美适配
  - 移动端触摸优化
  - 响应式设计

- ⚡ **游戏系统**
  - 无人机升级系统
  - 基地强化系统
  - 资源收集机制
  - 群体智能行为

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 本地运行

```bash
npm start
```

然后在浏览器中访问 `http://localhost:3000`

### 开发模式

```bash
npm run dev
```

使用nodemon自动重启服务器

## 📦 部署

### 微信云托管

详细部署步骤请查看 [WECHAT_CLOUD_DEPLOY.md](./WECHAT_CLOUD_DEPLOY.md)

```bash
# 使用Docker部署
docker build -t drone-war-game .
docker run -p 80:80 drone-war-game
```

### Vercel部署

项目已配置vercel.json，可直接部署到Vercel。

## 📁 项目结构

```
.
├── assets/              # 游戏资源
│   └── images/         # 图片资源
├── client/             # 客户端代码（如有）
├── server/             # 服务器代码（如有）
├── game.js             # 游戏核心逻辑
├── index.html          # 游戏主页面
├── simple_server.js    # Express服务器
├── package.json        # 项目配置
├── Dockerfile          # Docker配置
└── README.md           # 项目说明
```

## 🎮 游戏玩法

### 基本操作

- **设置集结点**：点击空白区域
- **攻击目标**：点击敌方单位或资源
- **升级**：使用资源升级无人机和基地

### 升级系统

- **攻击力**：增加伤害
- **攻击速度**：提高射速
- **移动速度**：加快移动
- **生命值**：增加无人机血量
- **基地血量**：强化基地防御

### 获胜条件

摧毁所有敌方基地即可获胜！

## 🛠️ 技术栈

- **前端**：HTML5 Canvas, JavaScript ES6+
- **后端**：Node.js, Express.js
- **部署**：Docker, 微信云托管

## 📊 代码质量

- 代码行数：3580行
- 代码质量：⭐⭐⭐⭐ (4/5)
- 详细报告：[CODE_QUALITY_REPORT.md](./CODE_QUALITY_REPORT.md)
- 代码结构：[CODE_STRUCTURE.md](./CODE_STRUCTURE.md)

## 🔧 开发

### 添加新功能

1. 修改 `game.js` 中的相关类
2. 更新 `GameConfig` 配置
3. 测试功能
4. 提交代码

### 调试

使用浏览器开发者工具：
- Console：查看日志
- Network：检查资源加载
- Performance：性能分析

## 📝 更新日志

### v1.0.0 (2026-01-06)

- ✅ 完整的游戏功能
- ✅ 三种游戏模式
- ✅ 三种AI难度
- ✅ 移动端适配
- ✅ 安全边界系统
- ✅ 性能优化

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

MIT License

## 👥 作者

DroneWar Team

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者！

---

**享受游戏！** 🎮✨
