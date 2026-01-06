# 微信云托管部署指南

## 📋 部署信息

### 端口配置
- **容器端口**: 80
- **服务器代码**: `process.env.PORT || 3000`
- **微信云托管**: 自动设置 `PORT=80`

### 项目信息
- **项目名称**: 无人机战略游戏
- **运行环境**: Node.js 16+
- **框架**: Express.js
- **类型**: 静态网页游戏

## 🚀 部署步骤

### 方法一：通过微信开发者工具

#### 1. 准备工作
```bash
# 确保已安装依赖
npm install

# 测试本地运行
npm start
# 访问 http://localhost:3000 确认游戏正常
```

#### 2. 创建云托管服务
1. 打开微信开发者工具
2. 进入"云开发" -> "云托管"
3. 创建新服务
   - 服务名称: `drone-war-game`
   - 端口: `80`
   - 流量配置: 按需选择

#### 3. 上传代码
1. 在微信开发者工具中选择"上传代码"
2. 选择项目根目录
3. 等待构建完成

#### 4. 配置域名（可选）
1. 在云托管控制台配置自定义域名
2. 添加域名解析
3. 配置SSL证书

### 方法二：通过命令行工具

#### 1. 安装微信云托管CLI
```bash
npm install -g @cloudbase/cli
```

#### 2. 登录
```bash
cloudbase login
```

#### 3. 初始化配置
```bash
cloudbase init
```

#### 4. 部署
```bash
cloudbase run deploy
```

### 方法三：通过Docker手动部署

#### 1. 构建镜像
```bash
# 构建Docker镜像
docker build -t drone-war-game:latest .

# 测试镜像
docker run -p 80:80 drone-war-game:latest
```

#### 2. 推送到微信云托管
```bash
# 登录微信云托管镜像仓库
docker login ccr.ccs.tencentyun.com

# 标记镜像
docker tag drone-war-game:latest ccr.ccs.tencentyun.com/你的命名空间/drone-war-game:latest

# 推送镜像
docker push ccr.ccs.tencentyun.com/你的命名空间/drone-war-game:latest
```

## 📁 需要上传的文件

### 必需文件
```
✅ package.json          # 依赖配置
✅ package-lock.json     # 依赖锁定
✅ simple_server.js      # 服务器入口
✅ index.html            # 游戏主页
✅ game.js               # 游戏逻辑
✅ Dockerfile            # Docker配置
✅ .dockerignore         # Docker忽略文件
```

### 资源文件
```
✅ assets/               # 游戏资源
   └── images/          # 图片资源
       └── backgrounds/ # 背景图片
```

### 可选文件
```
⚪ README.md            # 项目说明
⚪ CODE_STRUCTURE.md    # 代码结构文档
⚪ CODE_QUALITY_REPORT.md # 代码质量报告
```

### 不需要上传
```
❌ node_modules/        # 依赖包（会自动安装）
❌ test*.html           # 测试文件
❌ debug*.html          # 调试文件
❌ .git/                # Git仓库
❌ .vscode/             # 编辑器配置
❌ .kiro/               # Kiro配置
```

## ⚙️ 环境变量配置

在微信云托管控制台配置以下环境变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `PORT` | `80` | 服务端口（自动设置） |
| `NODE_ENV` | `production` | 运行环境 |

## 🔍 健康检查

微信云托管会自动检查服务健康状态：

**健康检查端点**: `GET /health`

**返回示例**:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-06T10:00:00.000Z",
  "uptime": 3600
}
```

## 📊 资源配置建议

### 基础配置（推荐）
- **CPU**: 0.25核
- **内存**: 0.5GB
- **实例数**: 1-3个
- **流量**: 按需

### 高负载配置
- **CPU**: 0.5核
- **内存**: 1GB
- **实例数**: 3-5个
- **流量**: 按需

## 🌐 访问地址

部署成功后，你的游戏将可以通过以下地址访问：

- **默认域名**: `https://你的服务名-你的环境ID.service.tcloudbase.com`
- **自定义域名**: `https://你的域名.com`（需配置）

## 🧪 部署后测试

### 1. 检查服务状态
```bash
curl https://你的域名/health
```

### 2. 访问游戏
在浏览器中打开: `https://你的域名`

### 3. 测试功能
- ✅ 游戏加载正常
- ✅ 选择模式和难度
- ✅ 开始游戏
- ✅ 桌面端和移动端都能正常运行

## 🐛 常见问题

### 1. 端口配置错误
**问题**: 服务无法启动  
**解决**: 确保Dockerfile中 `EXPOSE 80` 和环境变量 `PORT=80` 一致

### 2. 依赖安装失败
**问题**: 构建失败  
**解决**: 检查 `package.json` 中的依赖版本，确保兼容

### 3. 静态资源404
**问题**: 图片或CSS加载失败  
**解决**: 检查 `.dockerignore`，确保资源文件没有被忽略

### 4. 内存不足
**问题**: 服务频繁重启  
**解决**: 增加内存配置到1GB

## 📝 部署检查清单

部署前请确认：

- [ ] `package.json` 中依赖完整
- [ ] `simple_server.js` 端口配置正确
- [ ] `Dockerfile` 配置正确
- [ ] `.dockerignore` 配置合理
- [ ] 本地测试通过
- [ ] 资源文件完整
- [ ] 环境变量配置正确

## 🔄 更新部署

当需要更新游戏时：

```bash
# 1. 修改代码
# 2. 本地测试
npm start

# 3. 重新部署
# 通过微信开发者工具上传新版本
# 或使用命令行
cloudbase run deploy
```

## 📞 技术支持

如遇到问题，可以：
1. 查看微信云托管文档: https://cloud.weixin.qq.com/cloudrun
2. 查看服务日志
3. 检查健康检查端点

## 🎉 部署成功

部署成功后，你的无人机战略游戏就可以在微信生态中运行了！

**游戏特性**:
- ✅ 支持桌面和移动端
- ✅ 三种游戏模式
- ✅ 三种AI难度
- ✅ 完整的升级系统
- ✅ 流畅的游戏体验

祝你游戏运营顺利！🚀
