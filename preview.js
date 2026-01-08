// 游戏素材预览脚本

// 游戏配置（从主游戏复制）
const GameColors = ['#00ff00', '#0099ff', '#ff0000', '#ffba00']; // 匹配实际游戏的4种颜色

// 预览状态
let previewState = {
    baseHealth: 1000,
    baseMaxHealth: 1000,
    droneHealth: 1,
    droneMaxHealth: 1,
    showTarget: false,
    showTrail: true,
    animationId: null,
    explosions: [], // 存储爆炸动画状态
    spriteExplosions: [], // 存储雪碧图爆炸动画
    spriteImage: null, // 雪碧图图像
    spriteFrameCount: 9, // 9帧动画
    spriteFrameSize: 60, // 60x60px每帧
    spriteLayout: 'horizontal', // 水平排列
    lastSpriteExplosion: 0, // 上次爆炸时间
    spriteColorIndex: 0, // 当前颜色索引
    // 各预览区域选中的颜色索引
    selectedColors: {
        base: 0,      // 基地默认绿色
        drone: 1,     // 无人机默认蓝色  
        projectile: 2, // 投射物默认红色
        debris: 0,    // 资源碎片默认蓝色
        ui: 0         // UI元素默认绿色
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeCanvases();
    createColorPalettes();
    loadSpriteImage(); // 自动加载雪碧图
    startAnimationLoop();
});

// 自动加载雪碧图
function loadSpriteImage() {
    const img = new Image();
    img.onload = function() {
        previewState.spriteImage = img;
        console.log('雪碧图已加载: ship_explosion.png');
    };
    img.onerror = function() {
        console.log('雪碧图加载失败，使用程序生成效果');
    };
    img.src = 'assets/images/ship_explosion.png';
}

// 初始化所有画布
function initializeCanvases() {
    const canvases = ['baseCanvas', 'droneCanvas', 'projectileCanvas', 'debrisCanvas', 'uiCanvas', 'spriteExplosionCanvas'];
    
    canvases.forEach(canvasId => {
        const canvas = document.getElementById(canvasId);
        if (canvas) {
            const ctx = canvas.getContext('2d');
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            
            // 设置高DPI支持
            const dpr = window.devicePixelRatio || 1;
            canvas.width = canvas.offsetWidth * dpr;
            canvas.height = canvas.offsetHeight * dpr;
            ctx.scale(dpr, dpr);
            canvas.style.width = canvas.offsetWidth + 'px';
            canvas.style.height = canvas.offsetHeight + 'px';
        }
    });
}

// 创建颜色调色板
function createColorPalettes() {
    const palettes = [
        { id: 'baseColors', type: 'base' },
        { id: 'droneColors', type: 'drone' },
        { id: 'projectileColors', type: 'projectile' }
    ];
    
    palettes.forEach(paletteInfo => {
        const palette = document.getElementById(paletteInfo.id);
        if (palette) {
            GameColors.forEach((color, index) => {
                const colorSample = document.createElement('div');
                colorSample.className = 'color-sample';
                colorSample.style.backgroundColor = color;
                colorSample.title = color;
                
                // 设置默认选中状态
                if (index === previewState.selectedColors[paletteInfo.type]) {
                    colorSample.classList.add('selected');
                    colorSample.style.boxShadow = `0 0 10px ${color}`;
                }
                
                // 添加点击事件
                colorSample.addEventListener('click', () => {
                    // 移除同一调色板中其他颜色的选中状态
                    palette.querySelectorAll('.color-sample').forEach(sample => {
                        sample.classList.remove('selected');
                        sample.style.boxShadow = '';
                    });
                    
                    // 设置当前颜色为选中状态
                    colorSample.classList.add('selected');
                    colorSample.style.boxShadow = `0 0 10px ${color}`;
                    
                    // 更新预览状态
                    previewState.selectedColors[paletteInfo.type] = index;
                    
                    console.log(`${paletteInfo.type}选择颜色:`, color);
                });
                
                palette.appendChild(colorSample);
            });
        }
    });
}

// 动画循环
function startAnimationLoop() {
    function animate() {
        renderAllPreviews();
        previewState.animationId = requestAnimationFrame(animate);
    }
    animate();
}

// 渲染所有预览
function renderAllPreviews() {
    renderBase();
    renderDrone();
    renderProjectile();
    renderDebris();
    renderUI();
    renderSpriteExplosions(); // 添加雪碧图爆炸效果渲染
}

// 渲染基地预览
function renderBase() {
    const canvas = document.getElementById('baseCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    
    // 清空画布
    ctx.fillStyle = '#000814';
    ctx.fillRect(0, 0, width, height);
    
    // 绘制基地
    const centerX = width / 2;
    const centerY = height / 2;
    const baseSize = 40;
    const color = GameColors[previewState.selectedColors.base]; // 使用选中的颜色
    
    // 基地主体
    ctx.fillStyle = color;
    if (previewState.baseHealth < previewState.baseMaxHealth * 0.3) {
        ctx.fillStyle = '#ffba00'; // 无敌状态
    }
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseSize, 0, Math.PI * 2);
    ctx.fill();
    
    // 基地边框
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 血量条 - 使用绿色（玩家及同盟）
    const barWidth = 80;
    const barHeight = 8;
    const barX = centerX - barWidth / 2;
    const barY = centerY - baseSize - 20;
    
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    ctx.fillStyle = '#00ff00'; // 绿色血量条，匹配实际游戏
    const healthPercent = previewState.baseHealth / previewState.baseMaxHealth;
    ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
    
    // 血量数值
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.ceil(previewState.baseHealth)}/${previewState.baseMaxHealth}`, centerX, barY - 5);
}

// 渲染无人机预览
function renderDrone() {
    const canvas = document.getElementById('droneCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    
    // 清空画布
    ctx.fillStyle = '#000814';
    ctx.fillRect(0, 0, width, height);
    
    const centerX = width / 2;
    const centerY = height / 2;
    const droneSize = 8; // 匹配实际游戏尺寸
    const color = GameColors[previewState.selectedColors.drone]; // 使用选中的颜色
    
    // 推进器光晕效果
    const time = Date.now() * 0.001;
    const thrusterIntensity = Math.sin(time * 2) * 0.5 + 0.5;
    
    if (thrusterIntensity > 0.1) {
        const thrusterGradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, droneSize * 2
        );
        thrusterGradient.addColorStop(0, color + '80');
        thrusterGradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = thrusterGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, droneSize * 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 无人机主体
    ctx.fillStyle = color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, droneSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    ctx.shadowBlur = 0;
    
    // 绘制方向指示器
    const facing = time * 0.5; // 缓慢旋转展示
    const directionLength = droneSize * 0.8;
    const directionStartDistance = droneSize * 0.6;
    
    const startX = centerX + Math.cos(facing) * directionStartDistance;
    const startY = centerY + Math.sin(facing) * directionStartDistance;
    const endX = centerX + Math.cos(facing) * (directionStartDistance + directionLength);
    const endY = centerY + Math.sin(facing) * (directionStartDistance + directionLength);
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    
    // 绘制箭头
    const arrowSize = 3;
    const arrowAngle = 0.5;
    
    const leftArrowX = endX - Math.cos(facing - arrowAngle) * arrowSize;
    const leftArrowY = endY - Math.sin(facing - arrowAngle) * arrowSize;
    const rightArrowX = endX - Math.cos(facing + arrowAngle) * arrowSize;
    const rightArrowY = endY - Math.sin(facing + arrowAngle) * arrowSize;
    
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(leftArrowX, leftArrowY);
    ctx.moveTo(endX, endY);
    ctx.lineTo(rightArrowX, rightArrowY);
    ctx.stroke();
    
    ctx.lineCap = 'butt';
    
    // 内部细节
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(centerX, centerY, droneSize * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // 护盾效果演示
    const shieldRadius = droneSize + 4 + Math.sin(time * 4) * 2;
    const shieldAlpha = 0.5 + Math.sin(time * 8) * 0.2;
    
    const shieldGradient = ctx.createRadialGradient(
        centerX, centerY, droneSize,
        centerX, centerY, shieldRadius
    );
    shieldGradient.addColorStop(0, 'transparent');
    shieldGradient.addColorStop(0.7, `rgba(0, 255, 255, ${shieldAlpha * 0.3})`);
    shieldGradient.addColorStop(1, `rgba(0, 255, 255, ${shieldAlpha * 0.6})`);
    
    ctx.fillStyle = shieldGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, shieldRadius, 0, Math.PI * 2);
    ctx.fill();
}

// 渲染投射物预览
function renderProjectile() {
    const canvas = document.getElementById('projectileCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    
    // 清空画布
    ctx.fillStyle = '#000814';
    ctx.fillRect(0, 0, width, height);
    
    const time = Date.now() * 0.001;
    const projectileSize = 3; // 匹配实际游戏尺寸
    const color = GameColors[previewState.selectedColors.projectile]; // 使用选中的颜色
    
    // 模拟多个投射物轨迹
    for (let i = 0; i < 3; i++) {
        const startX = 50;
        const startY = height / 2 + (i - 1) * 40;
        const endX = width - 50;
        const endY = height / 2 + (i - 1) * 20;
        
        const progress = (Math.sin(time + i) + 1) / 2;
        const currentX = startX + (endX - startX) * progress;
        const currentY = startY + (endY - startY) * progress;
        
        // 轨迹
        if (previewState.showTrail) {
            const trailLength = 30;
            ctx.strokeStyle = color + '40';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            
            ctx.beginPath();
            for (let j = 0; j < trailLength; j++) {
                const trailProgress = Math.max(0, progress - j * 0.02);
                const trailX = startX + (endX - startX) * trailProgress;
                const trailY = startY + (endY - startY) * trailProgress;
                
                if (j === 0) {
                    ctx.moveTo(trailX, trailY);
                } else {
                    ctx.lineTo(trailX, trailY);
                }
            }
            ctx.stroke();
        }
        
        // 投射物主体
        const gradient = ctx.createRadialGradient(
            currentX, currentY, 0,
            currentX, currentY, projectileSize * 2
        );
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.7, color + 'AA');
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(currentX, currentY, projectileSize * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // 核心
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(currentX, currentY, projectileSize * 0.5, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 渲染资源碎片预览
function renderDebris() {
    const canvas = document.getElementById('debrisCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    
    // 清空画布
    ctx.fillStyle = '#000814';
    ctx.fillRect(0, 0, width, height);
    
    const time = Date.now() * 0.001;
    
    // 绘制多个资源碎片
    for (let i = 0; i < 4; i++) {
        const x = (width / 5) * (i + 1);
        const y = height / 2;
        const size = 15 + i * 3;
        const rotation = time * 0.5 + i;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        
        // 资源碎片主体
        ctx.fillStyle = '#4a9eff';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        
        // 绘制多边形
        const sides = 6;
        ctx.beginPath();
        for (let j = 0; j < sides; j++) {
            const angle = (j / sides) * Math.PI * 2;
            const radius = size + Math.sin(time * 2 + j) * 2;
            const px = Math.cos(angle) * radius;
            const py = Math.sin(angle) * radius;
            
            if (j === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // 内部发光
        const innerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
        innerGradient.addColorStop(0, '#ffffff40');
        innerGradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = innerGradient;
        ctx.fill();
        
        ctx.restore();
    }
}

// 渲染特效预览
function renderEffects() {
    const canvas = document.getElementById('effectsCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    
    // 星空背景
    const gradient = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, Math.max(width, height)
    );
    gradient.addColorStop(0, '#001122');
    gradient.addColorStop(0.5, '#000814');
    gradient.addColorStop(1, '#000000');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // 绘制星星
    const time = Date.now() * 0.001;
    for (let i = 0; i < 30; i++) {
        const x = (i * 37) % width;
        const y = (i * 73) % height;
        const size = 0.5 + (i % 3);
        const twinkle = Math.sin(time + i * 0.5) * 0.3 + 0.7;
        
        ctx.fillStyle = `rgba(255, 255, 255, ${twinkle})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        
        // 大星星的十字光
        if (size > 2) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${twinkle * 0.3})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(x - size * 2, y);
            ctx.lineTo(x + size * 2, y);
            ctx.moveTo(x, y - size * 2);
            ctx.lineTo(x, y + size * 2);
            ctx.stroke();
        }
    }
}

// 渲染UI元素预览
function renderUI() {
    const canvas = document.getElementById('uiCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    
    // 清空画布
    ctx.fillStyle = '#000814';
    ctx.fillRect(0, 0, width, height);
    
    const time = Date.now() * 0.001;
    
    // 血量条示例
    const barY = 50;
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('血量条样式:', 20, barY - 10);
    
    const barWidth = 100;
    const barHeight = 8;
    const barX = 20;
    
    // 不同血量状态的血量条
    const healthStates = [1.0, 0.7, 0.4, 0.1];
    const healthColors = ['#00ff00', '#ffaa00', '#ff0000', '#ff0000']; // 修正颜色值
    
    for (let i = 0; i < healthStates.length; i++) {
        const y = barY + i * 25;
        
        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(barX - 1, y - 1, barWidth + 2, barHeight + 2);
        
        ctx.fillStyle = '#333333';
        ctx.fillRect(barX, y, barWidth, barHeight);
        
        // 血量
        ctx.fillStyle = healthColors[i];
        ctx.fillRect(barX, y, barWidth * healthStates[i], barHeight);
        
        // 边框
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(barX, y, barWidth, barHeight);
        
        // 标签
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.fillText(`${Math.floor(healthStates[i] * 100)}%`, barX + barWidth + 10, y + 6);
    }
    
    // 集结点动画 - 显示四种颜色
    const rallyStartX = width - 150;
    const rallyY = height / 2;
    const rallySpacing = 35;
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('集结点', rallyStartX + rallySpacing * 1.5, rallyY - 40);
    
    // 绘制四种颜色的集结点
    GameColors.forEach((color, index) => {
        const x = rallyStartX + (index % 2) * rallySpacing;
        const y = rallyY + Math.floor(index / 2) * rallySpacing - 15;
        
        // 主圆圈
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.stroke();
        
        // 动画圆圈
        const animRadius = 16 + Math.sin(time * 2 + index * 0.5) * 4;
        ctx.strokeStyle = color + '80';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, animRadius, 0, Math.PI * 2);
        ctx.stroke();
    });
}

// 控制函数
function animateBase() {
    previewState.baseHealth = Math.max(100, previewState.baseHealth - 200);
    setTimeout(() => {
        previewState.baseHealth = previewState.baseMaxHealth;
    }, 2000);
}

function toggleBaseHealth() {
    previewState.baseHealth = previewState.baseHealth === previewState.baseMaxHealth ? 300 : previewState.baseMaxHealth;
}

function animateDrone() {
    // 推进器效果已经在渲染循环中
    console.log('推进器效果已激活');
}

function toggleDroneHealth() {
    previewState.droneHealth = previewState.droneHealth === previewState.droneMaxHealth ? 0.3 : previewState.droneMaxHealth;
}

function toggleTarget() {
    previewState.showTarget = !previewState.showTarget;
}

function fireProjectile() {
    console.log('投射物发射演示');
}

function toggleTrail() {
    previewState.showTrail = !previewState.showTrail;
}

function animateDebris() {
    console.log('资源碎片旋转动画');
}

function damageDebris() {
    console.log('资源碎片受伤效果');
}

function showStarfield() {
    console.log('星空效果展示');
}

function showExplosion() {
    console.log('爆炸效果展示');
}

function showHealthBar() {
    console.log('血量条展示');
}

function showRallyPoint() {
    console.log('集结点展示');
}

// 爆炸效果相关函数
function renderExplosions() {
    const canvas = document.getElementById('explosionCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    
    // 清空画布 - 深色太空背景
    const gradient = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, Math.max(width, height) / 2
    );
    gradient.addColorStop(0, '#001122');
    gradient.addColorStop(0.7, '#000814');
    gradient.addColorStop(1, '#000000');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // 绘制一些背景星星
    for (let i = 0; i < 15; i++) {
        const x = (i * 37) % width;
        const y = (i * 73) % height;
        const size = 0.5 + (i % 2);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 更新和渲染所有爆炸效果
    const currentTime = Date.now();
    
    // 移除已完成的爆炸
    previewState.explosions = previewState.explosions.filter(explosion => {
        return currentTime - explosion.startTime < explosion.duration;
    });
    
    // 渲染每个爆炸效果
    previewState.explosions.forEach(explosion => {
        renderSingleExplosion(ctx, explosion, currentTime);
    });
    
    // 如果没有爆炸在进行，显示提示文字
    if (previewState.explosions.length === 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('点击下方按钮查看爆炸效果', width / 2, height / 2);
        
        ctx.font = '12px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillText('不同颜色的无人机对应不同颜色的光晕', width / 2, height / 2 + 25);
    }
}

function renderSingleExplosion(ctx, explosion, currentTime) {
    const elapsed = currentTime - explosion.startTime;
    const progress = elapsed / explosion.duration;
    
    if (progress >= 1) return; // 爆炸已结束
    
    const x = explosion.x;
    const y = explosion.y;
    const maxRadius = explosion.maxRadius;
    const color = explosion.color;
    
    // 计算当前半径和透明度
    // 0-0.3: 从小到大快速扩张
    // 0.3-1.0: 快速消失
    let currentRadius, alpha;
    
    if (progress < 0.3) {
        // 扩张阶段 - 更快的扩张
        const expandProgress = progress / 0.3;
        currentRadius = maxRadius * (1 - Math.pow(1 - expandProgress, 1.5));
        alpha = 1.0 - expandProgress * 0.1; // 从1.0降到0.9
    } else {
        // 消失阶段 - 更快消失
        const fadeProgress = (progress - 0.3) / 0.7;
        currentRadius = maxRadius * (1 + fadeProgress * 0.05); // 稍微继续扩大
        alpha = 0.9 * (1 - fadeProgress * fadeProgress * fadeProgress); // 更快消失
    }
    
    // 绘制多层光晕效果
    ctx.save();
    
    // 外层光晕 - 最大最淡
    const outerGradient = ctx.createRadialGradient(
        x, y, 0,
        x, y, currentRadius * 1.5
    );
    outerGradient.addColorStop(0, color + Math.floor(alpha * 80).toString(16).padStart(2, '0'));
    outerGradient.addColorStop(0.3, color + Math.floor(alpha * 40).toString(16).padStart(2, '0'));
    outerGradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = outerGradient;
    ctx.beginPath();
    ctx.arc(x, y, currentRadius * 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // 中层光晕 - 中等亮度
    const middleGradient = ctx.createRadialGradient(
        x, y, 0,
        x, y, currentRadius
    );
    middleGradient.addColorStop(0, color + Math.floor(alpha * 120).toString(16).padStart(2, '0'));
    middleGradient.addColorStop(0.5, color + Math.floor(alpha * 80).toString(16).padStart(2, '0'));
    middleGradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = middleGradient;
    ctx.beginPath();
    ctx.arc(x, y, currentRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // 内层核心 - 最亮，增强中心亮度
    const coreGradient = ctx.createRadialGradient(
        x, y, 0,
        x, y, currentRadius * 0.3
    );
    coreGradient.addColorStop(0, '#ffffff' + 'FF'); // 中心完全不透明的白色
    coreGradient.addColorStop(0.2, '#ffffff' + Math.floor(alpha * 240).toString(16).padStart(2, '0'));
    coreGradient.addColorStop(0.5, color + Math.floor(alpha * 220).toString(16).padStart(2, '0'));
    coreGradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(x, y, currentRadius * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

function triggerExplosion(colorType) {
    const canvas = document.getElementById('explosionCanvas');
    if (!canvas) return;
    
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    
    // 颜色映射 - 匹配实际游戏颜色
    const colorMap = {
        'green': '#00ff00',
        'blue': '#0099ff', 
        'red': '#ff0000',    // 修正为实际游戏中的红色
        'yellow': '#ffba00'
    };
    
    // 创建新的爆炸效果
    const explosion = {
        x: width / 2 + (Math.random() - 0.5) * 100, // 中心附近随机位置
        y: height / 2 + (Math.random() - 0.5) * 60,
        color: colorMap[colorType] || '#ffffff',
        maxRadius: 15 + Math.random() * 5, // 调整为无人机大小的1.5-2倍（无人机约12px）
        duration: 400, // 0.4秒，更快的爆炸
        startTime: Date.now()
    };
    
    previewState.explosions.push(explosion);
    
    console.log(`触发${colorType}爆炸效果`);
}

// 雪碧图爆炸效果相关函数
function renderSpriteExplosions() {
    const canvas = document.getElementById('spriteExplosionCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    
    // 清空画布 - 深色太空背景
    const gradient = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, Math.max(width, height) / 2
    );
    gradient.addColorStop(0, '#001122');
    gradient.addColorStop(0.7, '#000814');
    gradient.addColorStop(1, '#000000');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // 绘制一些背景星星
    for (let i = 0; i < 15; i++) {
        const x = (i * 37) % width;
        const y = (i * 73) % height;
        const size = 0.5 + (i % 2);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 同时创建四种颜色的爆炸效果
    const currentTime = Date.now();
    if (currentTime - previewState.lastSpriteExplosion > 600) { // 缩短到0.6秒一轮，更连续
        const colors = ['#00ff00', '#0099ff', '#ff0000', '#ffba00']; // 匹配实际游戏颜色
        const colorNames = ['绿色', '蓝色', '红色', '黄色'];
        
        // 同时创建四种颜色的爆炸，分布在四个位置
        const positions = [
            { x: width * 0.25, y: height * 0.4 },  // 左上
            { x: width * 0.75, y: height * 0.4 },  // 右上
            { x: width * 0.25, y: height * 0.6 },  // 左下
            { x: width * 0.75, y: height * 0.6 }   // 右下
        ];
        
        colors.forEach((color, index) => {
            const explosion = {
                x: positions[index].x + (Math.random() - 0.5) * 30,
                y: positions[index].y + (Math.random() - 0.5) * 20,
                color: color,
                colorName: colorNames[index],
                scale: 1.0 + Math.random() * 0.3,
                duration: 450,
                startTime: currentTime
            };
            
            previewState.spriteExplosions.push(explosion);
        });
        
        previewState.lastSpriteExplosion = currentTime;
    }
    
    // 移除已完成的爆炸
    previewState.spriteExplosions = previewState.spriteExplosions.filter(explosion => {
        const elapsed = currentTime - explosion.startTime;
        return elapsed < explosion.duration;
    });
    
    // 渲染每个雪碧图爆炸效果
    previewState.spriteExplosions.forEach(explosion => {
        renderSingleSpriteExplosion(ctx, explosion, currentTime);
    });
    
    // 不显示任何文字，只显示爆炸效果
}

function renderSingleSpriteExplosion(ctx, explosion, currentTime) {
    const elapsed = currentTime - explosion.startTime;
    const progress = elapsed / explosion.duration;
    
    if (progress >= 1) return; // 爆炸已结束
    
    // 计算当前帧
    const frameIndex = Math.floor(progress * previewState.spriteFrameCount);
    const clampedFrameIndex = Math.min(frameIndex, previewState.spriteFrameCount - 1);
    
    const x = explosion.x;
    const y = explosion.y;
    const scale = explosion.scale;
    const color = explosion.color;
    
    ctx.save();
    
    // 绘制雪碧图帧
    if (previewState.spriteImage) {
        // 使用滤色混合模式去除黑色背景
        ctx.globalCompositeOperation = 'screen';
        
        // 应用色相旋转来改变颜色
        const hueRotation = getHueRotation(color);
        if (hueRotation !== 0) {
            ctx.filter = `hue-rotate(${hueRotation}deg)`;
        }
        
        // 使用用户上传的雪碧图
        const frameSize = previewState.spriteFrameSize;
        
        // 根据布局计算源坐标
        let sx, sy;
        if (previewState.spriteLayout === 'horizontal') {
            // 水平排列：每帧在x轴上偏移
            sx = clampedFrameIndex * frameSize;
            sy = 0;
        } else {
            // 垂直排列：每帧在y轴上偏移
            sx = 0;
            sy = clampedFrameIndex * frameSize;
        }
        
        const sw = frameSize;
        const sh = frameSize;
        
        const drawSize = frameSize * scale;
        const dx = x - drawSize / 2;
        const dy = y - drawSize / 2;
        
        ctx.drawImage(previewState.spriteImage, sx, sy, sw, sh, dx, dy, drawSize, drawSize);
        
        // 恢复默认混合模式
        ctx.globalCompositeOperation = 'source-over';
    } else {
        // 使用程序生成的测试爆炸效果
        renderTestSpriteFrame(ctx, x, y, clampedFrameIndex, scale, color);
    }
    
    ctx.restore();
}

function renderTestSpriteFrame(ctx, x, y, frameIndex, scale, color) {
    // 简化的测试爆炸效果
    const progress = frameIndex / (previewState.spriteFrameCount - 1);
    const radius = 20 * scale * (0.3 + progress * 0.7);
    const alpha = progress < 0.7 ? 1 - progress * 0.3 : 0.7 - (progress - 0.7) * 2;
    
    if (alpha <= 0) return;
    
    // 主爆炸光晕
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, '#ffffff' + Math.floor(alpha * 255).toString(16).padStart(2, '0'));
    gradient.addColorStop(0.3, color + Math.floor(alpha * 200).toString(16).padStart(2, '0'));
    gradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
}

function getHueRotation(targetColor) {
    // 基于蓝色雪碧图计算色相旋转角度
    const colorMap = {
        '#00ff00': -60,  // 绿色：蓝色 → 绿色
        '#0099ff': 0,    // 蓝色：无需旋转
        '#ff0000': 140,  // 红色：蓝色 → 红色（修正颜色值）
        '#ffba00': 180   // 黄色：蓝色 → 黄色
    };
    
    return colorMap[targetColor] || 0;
}

function triggerSpriteExplosion(colorType) {
    const canvas = document.getElementById('spriteExplosionCanvas');
    if (!canvas) return;
    
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    
    // 颜色映射 - 匹配实际游戏颜色
    const colorMap = {
        'green': '#00ff00',
        'blue': '#0099ff', 
        'red': '#ff0000',    // 修正为实际游戏中的红色
        'yellow': '#ffba00'
    };
    
    // 创建新的雪碧图爆炸效果
    const explosion = {
        x: width / 2 + (Math.random() - 0.5) * 100,
        y: height / 2 + (Math.random() - 0.5) * 60,
        color: colorMap[colorType] || '#ffffff',
        scale: 0.8 + Math.random() * 0.4, // 随机缩放
        duration: 400, // 0.4秒
        startTime: Date.now()
    };
    
    previewState.spriteExplosions.push(explosion);
    
    console.log(`触发${colorType}雪碧图爆炸效果`);
}