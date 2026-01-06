/**
 * Node.js 本地测试脚本
 * 用于验证Node.js环境和依赖是否正确安装
 */

console.log('🚀 开始Node.js环境测试...\n');

// 检查Node.js版本
console.log('📋 系统信息:');
console.log(`Node.js版本: ${process.version}`);
console.log(`平台: ${process.platform}`);
console.log(`架构: ${process.arch}`);
console.log('');

// 检查必要的模块
const requiredModules = ['express', 'socket.io', 'cors', 'uuid'];
let allModulesAvailable = true;

console.log('📦 检查依赖模块:');
requiredModules.forEach(moduleName => {
    try {
        require.resolve(moduleName);
        console.log(`✅ ${moduleName} - 已安装`);
    } catch (e) {
        console.log(`❌ ${moduleName} - 未安装`);
        allModulesAvailable = false;
    }
});

console.log('');

if (allModulesAvailable) {
    console.log('🎉 所有依赖模块都已正确安装！');
    console.log('');
    console.log('🚀 可以启动服务器了:');
    console.log('   npm start     - 启动生产服务器');
    console.log('   npm run dev   - 启动开发服务器（需要nodemon）');
    console.log('');
    console.log('🌐 服务器启动后访问: http://localhost:3000');
} else {
    console.log('⚠️  请先安装缺失的依赖:');
    console.log('   npm install');
    console.log('');
}

// 测试基本的服务器功能
if (allModulesAvailable) {
    console.log('🧪 测试基本功能...');
    
    try {
        const express = require('express');
        const app = express();
        
        // 测试Express
        app.get('/test', (req, res) => {
            res.json({ status: 'ok', message: '测试成功' });
        });
        
        console.log('✅ Express - 正常');
        
        // 测试Socket.IO
        const socketIo = require('socket.io');
        console.log('✅ Socket.IO - 正常');
        
        console.log('');
        console.log('🎯 环境测试完成，一切正常！');
        
    } catch (error) {
        console.log('❌ 功能测试失败:', error.message);
    }
}