/**
 * 无人机战略游戏 - 服务器入口
 * 基于 Express.js + Socket.IO 的实时联机游戏服务器
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const GameServer = require('./gameServer');

const app = express();
const server = http.createServer(app);

// 配置 Socket.IO，支持跨域
const io = socketIo(server, {
    cors: {
        origin: "*", // 生产环境中应该设置具体域名
        methods: ["GET", "POST"]
    }
});

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

// 静态文件服务 - 提供游戏客户端
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// API 路由
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        players: gameServer.getTotalPlayers(),
        rooms: gameServer.getTotalRooms(),
        timestamp: new Date().toISOString()
    });
});

// 创建游戏服务器实例
const gameServer = new GameServer(io);

// 启动服务器
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 无人机战略游戏服务器启动成功`);
    console.log(`📡 服务器地址: http://localhost:${PORT}`);
    console.log(`🎮 游戏模式: 联机对战`);
    console.log(`⏰ 启动时间: ${new Date().toLocaleString('zh-CN')}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
    console.log('🔄 收到 SIGTERM 信号，正在关闭服务器...');
    server.close(() => {
        console.log('✅ 服务器已关闭');
        process.exit(0);
    });
});

module.exports = app;