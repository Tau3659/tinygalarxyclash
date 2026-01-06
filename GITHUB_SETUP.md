# GitHub 版本管理配置指南

## 📋 准备工作

### 1. 检查Git是否已安装

```bash
git --version
```

如果未安装，请访问 [git-scm.com](https://git-scm.com/) 下载安装。

### 2. 配置Git用户信息

```bash
# 设置用户名
git config --global user.name "你的名字"

# 设置邮箱
git config --global user.email "你的邮箱@example.com"

# 查看配置
git config --list
```

## 🚀 初始化Git仓库

### 方法一：从本地开始（推荐）

#### 1. 初始化本地仓库

```bash
# 在项目根目录执行
git init
```

#### 2. 添加文件到暂存区

```bash
# 添加所有文件
git add .

# 或者选择性添加
git add index.html game.js package.json
```

#### 3. 提交到本地仓库

```bash
git commit -m "初始提交：无人机战略游戏 v1.0.0"
```

#### 4. 在GitHub创建远程仓库

1. 访问 [github.com](https://github.com)
2. 点击右上角 "+" -> "New repository"
3. 填写仓库信息：
   - **Repository name**: `drone-war-game`
   - **Description**: `无人机战略游戏 - HTML5实时策略游戏`
   - **Public/Private**: 选择公开或私有
   - **不要**勾选 "Initialize with README"（我们已经有了）

#### 5. 关联远程仓库

```bash
# 添加远程仓库
git remote add origin https://github.com/你的用户名/drone-war-game.git

# 推送到远程仓库
git branch -M main
git push -u origin main
```

### 方法二：从GitHub开始

#### 1. 在GitHub创建仓库

1. 访问 [github.com](https://github.com)
2. 创建新仓库（勾选 "Initialize with README"）

#### 2. 克隆到本地

```bash
git clone https://github.com/你的用户名/drone-war-game.git
cd drone-war-game
```

#### 3. 复制项目文件到克隆的目录

#### 4. 提交并推送

```bash
git add .
git commit -m "添加游戏文件"
git push origin main
```

## 📝 日常使用

### 查看状态

```bash
# 查看文件状态
git status

# 查看修改内容
git diff
```

### 提交更改

```bash
# 1. 添加修改的文件
git add .

# 2. 提交到本地仓库
git commit -m "描述你的修改"

# 3. 推送到远程仓库
git push origin main
```

### 拉取更新

```bash
# 拉取远程更新
git pull origin main
```

## 🌿 分支管理

### 创建和切换分支

```bash
# 创建新分支
git branch feature/new-game-mode

# 切换到新分支
git checkout feature/new-game-mode

# 或者一步完成
git checkout -b feature/new-game-mode
```

### 合并分支

```bash
# 切换回主分支
git checkout main

# 合并功能分支
git merge feature/new-game-mode

# 推送到远程
git push origin main
```

### 删除分支

```bash
# 删除本地分支
git branch -d feature/new-game-mode

# 删除远程分支
git push origin --delete feature/new-game-mode
```

## 🏷️ 版本标签

### 创建标签

```bash
# 创建标签
git tag -a v1.0.0 -m "版本 1.0.0 - 初始发布"

# 推送标签到远程
git push origin v1.0.0

# 推送所有标签
git push origin --tags
```

### 查看标签

```bash
# 列出所有标签
git tag

# 查看标签详情
git show v1.0.0
```

## 📦 .gitignore 配置

已创建 `.gitignore` 文件，包含以下内容：

- ✅ `node_modules/` - 依赖包
- ✅ `.env` - 环境变量
- ✅ `*.log` - 日志文件
- ✅ `.vscode/` - 编辑器配置
- ✅ 测试和调试文件

## 🔄 常用工作流

### 功能开发流程

```bash
# 1. 创建功能分支
git checkout -b feature/ai-difficulty

# 2. 开发功能并提交
git add .
git commit -m "添加新的AI难度选项"

# 3. 推送到远程
git push origin feature/ai-difficulty

# 4. 在GitHub创建Pull Request

# 5. 合并后删除分支
git checkout main
git pull origin main
git branch -d feature/ai-difficulty
```

### Bug修复流程

```bash
# 1. 创建修复分支
git checkout -b fix/collision-bug

# 2. 修复bug并提交
git add .
git commit -m "修复：碰撞检测bug"

# 3. 推送并创建PR
git push origin fix/collision-bug
```

## 📊 查看历史

### 查看提交历史

```bash
# 查看提交日志
git log

# 简洁模式
git log --oneline

# 图形化显示
git log --graph --oneline --all

# 查看某个文件的历史
git log -- game.js
```

### 查看某次提交的详情

```bash
git show <commit-hash>
```

## 🔙 撤销操作

### 撤销工作区修改

```bash
# 撤销单个文件
git checkout -- game.js

# 撤销所有修改
git checkout -- .
```

### 撤销暂存区

```bash
# 取消暂存
git reset HEAD game.js

# 取消所有暂存
git reset HEAD .
```

### 撤销提交

```bash
# 撤销最后一次提交（保留修改）
git reset --soft HEAD^

# 撤销最后一次提交（不保留修改）
git reset --hard HEAD^
```

## 🤝 协作开发

### Fork工作流

1. **Fork仓库**：在GitHub上点击Fork按钮
2. **克隆Fork**：`git clone https://github.com/你的用户名/drone-war-game.git`
3. **添加上游**：`git remote add upstream https://github.com/原作者/drone-war-game.git`
4. **同步上游**：`git pull upstream main`
5. **创建分支**：`git checkout -b feature/my-feature`
6. **提交更改**：`git push origin feature/my-feature`
7. **创建PR**：在GitHub上创建Pull Request

## 🔐 SSH配置（推荐）

### 生成SSH密钥

```bash
# 生成密钥
ssh-keygen -t ed25519 -C "你的邮箱@example.com"

# 查看公钥
cat ~/.ssh/id_ed25519.pub
```

### 添加到GitHub

1. 复制公钥内容
2. 访问 GitHub Settings -> SSH and GPG keys
3. 点击 "New SSH key"
4. 粘贴公钥并保存

### 使用SSH地址

```bash
# 修改远程地址为SSH
git remote set-url origin git@github.com:你的用户名/drone-war-game.git
```

## 📋 提交信息规范

### 推荐格式

```
<类型>: <简短描述>

<详细描述>（可选）

<相关Issue>（可选）
```

### 类型说明

- `feat`: 新功能
- `fix`: Bug修复
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具相关

### 示例

```bash
git commit -m "feat: 添加2v2团队模式"
git commit -m "fix: 修复移动端触摸事件bug"
git commit -m "docs: 更新部署文档"
```

## 🚨 常见问题

### 1. 推送被拒绝

```bash
# 先拉取远程更新
git pull origin main --rebase

# 再推送
git push origin main
```

### 2. 合并冲突

```bash
# 1. 拉取更新时出现冲突
git pull origin main

# 2. 手动解决冲突（编辑文件）

# 3. 标记为已解决
git add .

# 4. 完成合并
git commit -m "解决合并冲突"
```

### 3. 忘记添加.gitignore

```bash
# 移除已追踪的文件
git rm -r --cached node_modules/

# 提交更改
git commit -m "移除node_modules"
```

## 📚 推荐资源

- [Git官方文档](https://git-scm.com/doc)
- [GitHub文档](https://docs.github.com/)
- [Git可视化学习](https://learngitbranching.js.org/)

## ✅ 配置检查清单

完成以下步骤后，你的GitHub版本管理就配置好了：

- [ ] 安装Git
- [ ] 配置用户信息
- [ ] 创建.gitignore文件
- [ ] 初始化本地仓库
- [ ] 在GitHub创建远程仓库
- [ ] 关联远程仓库
- [ ] 完成首次推送
- [ ] （可选）配置SSH密钥

## 🎉 完成

现在你可以使用Git和GitHub进行版本管理了！

**常用命令速查**：
```bash
git status          # 查看状态
git add .           # 添加所有文件
git commit -m ""    # 提交
git push            # 推送
git pull            # 拉取
git log             # 查看历史
```

祝你版本管理顺利！🚀
