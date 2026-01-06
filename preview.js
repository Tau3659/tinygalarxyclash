// 游戏素材预览脚本

// 游戏配置（从主游戏复制）
const GameColors = ['#00ff00', '#0099ff', '#ff6600', '#ff0099', '#9900ff', '#ffff00'];

// 预览状态
let previewState = {
    baseHealth: 1000,
    baseMaxHealth: 1000,
    droneHealth: 1,
    droneMaxHealth: 1,
    showTarget: false,
    showTrail: true,
    animationId: null
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeCanvases();
    createColorPalettes();
    startAnimationLoop();
});

// 初始化所有画布
function initializeCanvases() {
    const canvases = ['baseCanvas', 'droneCanvas', 'projectileCanvas', 'debrisCanvas', 'effectsCanvas', 'uiCanvas'];
    
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
    const palettes = ['baseColors', 'droneColors', 'projectileColors'];
    
    palettes.forEach(paletteId => {
        const palette = document.getElementById(paletteId);
        if (palette) {
            GameColors.forEach(color => {
                const colorSample = document.createElement('div');
                colorSample.className = 'color-sample';
                colorSample.style.backgroundColor = color;
                colorSample.title = color;
                colorSample.addEventListener('click', () => {
                    // 这里可以添加颜色切换逻辑
                    console.log('选择颜色:', color);
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
    renderEffects();
    renderUI();
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
    const color = GameColors[0];
    
    // 基地主体
    ctx.fillStyle = color;
    if (previewState.baseHealth < previewState.baseMaxHealth * 0.3) {
        ctx.fillStyle = '#ffff00'; // 无敌状态
    }
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseSize, 0, Math.PI * 2);
    ctx.fill();
    
    // 基地边框
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 血量条
    const barWidth = 80;
    const barHeight = 8;
    const barX = centerX - barWidth / 2;
    const barY = centerY - baseSize - 20;
    
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    ctx.fillStyle = '#ff0000';
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
    const droneSize = 12; // 放大显示
    const color = GameColors[1];
    
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
    
    // 火箭尾焰演示
    const flameAngle = facing + Math.PI; // 与朝向相反
    const flameLength = droneSize * 1.5;
    const flameWidth = droneSize * 0.6;
    const flameDistance = droneSize * 0.8;
    
    const flameStartX = centerX + Math.cos(flameAngle) * flameDistance;
    const flameStartY = centerY + Math.sin(flameAngle) * flameDistance;
    const flameEndX = flameStartX + Math.cos(flameAngle) * flameLength;
    const flameEndY = flameStartY + Math.sin(flameAngle) * flameLength;
    
    const flameGradient = ctx.createLinearGradient(
        flameStartX, flameStartY,
        flameEndX, flameEndY
    );
    flameGradient.addColorStop(0, color + 'FF');
    flameGradient.addColorStop(0.3, color + 'CC');
    flameGradient.addColorStop(0.7, color + '66');
    flameGradient.addColorStop(1, 'transparent');
    
    const sideAngle1 = flameAngle + Math.PI / 2;
    const sideAngle2 = flameAngle - Math.PI / 2;
    const side1X = flameStartX + Math.cos(sideAngle1) * flameWidth / 2;
    const side1Y = flameStartY + Math.sin(sideAngle1) * flameWidth / 2;
    const side2X = flameStartX + Math.cos(sideAngle2) * flameWidth / 2;
    const side2Y = flameStartY + Math.sin(sideAngle2) * flameWidth / 2;
    
    ctx.fillStyle = flameGradient;
    ctx.beginPath();
    ctx.moveTo(side1X, side1Y);
    ctx.lineTo(side2X, side2Y);
    ctx.lineTo(flameEndX, flameEndY);
    ctx.closePath();
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
    const projectileSize = 4;
    const color = GameColors[2];
    
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
    const healthColors = ['#00ff00', '#ffaa00', '#ff6600', '#ff0000'];
    
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
    
    // 集结点动画
    const rallyX = width - 80;
    const rallyY = height / 2;
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('集结点', rallyX, rallyY - 40);
    
    // 主圆圈
    ctx.strokeStyle = GameColors[0];
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(rallyX, rallyY, 15, 0, Math.PI * 2);
    ctx.stroke();
    
    // 动画圆圈
    const animRadius = 20 + Math.sin(time * 2) * 5;
    ctx.strokeStyle = GameColors[0] + '80';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(rallyX, rallyY, animRadius, 0, Math.PI * 2);
    ctx.stroke();
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