/**
 * 简单的静态文件服务器
 * 用于部署单机版无人机战略游戏到云端
 */

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 80;

// 静态文件服务 - 提供游戏文件
app.use(express.static(path.join(__dirname)));

// 主页路由 - 直接提供原版游戏
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 健康检查接口
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// 游戏信息接口
app.get('/api/info', (req, res) => {
    res.json({
        name: '无人机战略游戏',
        version: '1.0.0',
        description: '基于HTML5 Canvas的实时策略游戏',
        features: [
            '1v1 对战模式',
            '2v2 团队模式', 
            '混战模式',
            'AI 难度选择',
            '无人机升级系统'
        ]
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log('🚀 无人机战略游戏服务器启动成功');
    console.log(`📡 访问地址: http://localhost:${PORT}`);
    console.log(`🎮 游戏类型: 单机版（云端托管）`);
    console.log(`⏰ 启动时间: ${new Date().toLocaleString('zh-CN')}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
    console.log('🔄 收到关闭信号，正在停止服务器...');
    process.exit(0);
});

module.exports = app;