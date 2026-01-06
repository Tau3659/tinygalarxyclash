/**
 * 本地开发服务器
 * 专门用于本地预览和测试，使用3000端口
 */

const express = require('express');
const path = require('path');

const app = express();
const PORT = 8000; // 固定使用8000端口进行本地开发

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
        uptime: process.uptime(),
        environment: 'local-development'
    });
});

// 游戏信息接口
app.get('/api/info', (req, res) => {
    res.json({
        name: '无人机战略游戏',
        version: '1.0.0',
        description: '基于HTML5 Canvas的实时策略游戏',
        environment: '本地开发环境',
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
    console.log('🚀 本地开发服务器启动成功');
    console.log(`📡 访问地址: http://localhost:${PORT}`);
    console.log(`🎮 游戏类型: 本地开发版`);
    console.log(`⏰ 启动时间: ${new Date().toLocaleString('zh-CN')}`);
    console.log('');
    console.log('💡 提示：');
    console.log('   - 修改代码后需要手动刷新浏览器');
    console.log('   - 按 Ctrl+C 停止服务器');
    console.log('   - 生产环境使用 simple_server.js (端口80)');
});

// 优雅关闭
process.on('SIGTERM', () => {
    console.log('🔄 收到关闭信号，正在停止本地服务器...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n🔄 正在停止本地服务器...');
    process.exit(0);
});

module.exports = app;