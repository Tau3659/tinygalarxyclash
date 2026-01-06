/**
 * 健康检查脚本
 * 用于微信云托管的容器健康检查
 */

const http = require('http');

const options = {
    hostname: 'localhost',
    port: process.env.PORT || 3000,
    path: '/api/status',
    method: 'GET',
    timeout: 2000
};

const req = http.request(options, (res) => {
    if (res.statusCode === 200) {
        console.log('健康检查通过');
        process.exit(0);
    } else {
        console.log(`健康检查失败: HTTP ${res.statusCode}`);
        process.exit(1);
    }
});

req.on('error', (err) => {
    console.log(`健康检查错误: ${err.message}`);
    process.exit(1);
});

req.on('timeout', () => {
    console.log('健康检查超时');
    req.destroy();
    process.exit(1);
});

req.end();