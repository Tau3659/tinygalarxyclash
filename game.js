// 游戏配置
const GameConfig = {
    modes: {
        '1v1': { players: 2, teams: 2 },
        '2v2': { players: 4, teams: 2 },
        'ffa': { players: 3, teams: 3 }
    },
    colors: ['#00ff00', '#0099ff', '#ff0000', '#ffba00'],
    droneColors: {
        '#00ff00': '#00ff00',
        '#0099ff': '#0099ff', 
        '#ff0000': '#ff0000',
        '#ffba00': '#ffba00'
    },
    // 爆炸效果配置
    explosion: {
        duration: 400,          // 爆炸持续时间（毫秒）
        maxRadius: 18,          // 最大半径
        radiusVariation: 4,     // 半径随机变化范围
        expandPhase: 0.3,       // 扩张阶段占比（30%）
        maxExplosions: 20       // 最大同时爆炸数量（性能优化）
    },
    // AI 难度配置
    difficulty: {
        easy: {
            name: '简单',
            aggressive: false,      // 被动防御
            defensive: true,        // 被动防守
            upgradeRatio: 0,        // 不使用资源升级
            attackRange: 150,       // 防守范围
            retreatThreshold: 0.3,  // 血量低于30%撤退
            reactionTime: 2000,     // 2秒反应时间
            droneSpeedMultiplier: 0.8,  // 无人机速度80%
            attackSpeedMultiplier: 0.8, // 攻击速度80%
            resourcePriority: false,    // 不主动收集资源
            initiativeLevel: 'passive'  // 被动防御
        },
        medium: {
            name: '中等',
            aggressive: true,       // 偶尔主动进攻
            defensive: true,        // 优先保护基地
            upgradeRatio: 0.5,      // 使用50%资源升级
            attackRange: 300,       // 进攻范围
            retreatThreshold: 0.2,  // 血量低于20%撤退
            reactionTime: 1000,     // 1秒反应时间
            droneSpeedMultiplier: 1.0,  // 正常无人机速度
            attackSpeedMultiplier: 1.0, // 正常攻击速度
            resourcePriority: true,     // 会收集资源
            tactical: true,         // 使用基础战术
            initiativeLevel: 'moderate' // 偶尔主动进攻
        },
        hard: {
            name: '困难',
            aggressive: true,       // 积极主动进攻
            defensive: false,       // 不过分保护基地
            upgradeRatio: 1.0,      // 使用全部资源升级
            attackRange: 500,       // 大范围进攻
            retreatThreshold: 0.05, // 血量低于5%撤退（更激进）
            reactionTime: 500,      // 0.5秒快速反应
            droneSpeedMultiplier: 1.3,  // 无人机速度130%
            attackSpeedMultiplier: 1.5, // 攻击速度150%
            resourcePriority: true,     // 积极收集资源
            tactical: true,         // 使用高级战术
            predictive: true,       // 预测性攻击
            multiTarget: true,      // 多目标同时攻击
            flanking: true,         // 侧翼包抄战术
            economicBonus: 1.2,     // 资源收集效率120%
            initiativeLevel: 'aggressive' // 积极主动进攻
        }
    },
    // 基准分辨率（用于缩放计算）
    baseWidth: 1200,
    baseHeight: 800
};

// 爆炸效果管理器
class ExplosionManager {
    constructor() {
        this.explosions = [];
        this.explosionPool = []; // 对象池优化性能
        this.spriteImage = null; // 雪碧图图像
        this.spriteFrameCount = 9; // 9帧动画
        this.spriteFrameSize = 60; // 60x60px每帧
        this.loadSpriteImage(); // 自动加载雪碧图
    }
    
    // 加载雪碧图
    loadSpriteImage() {
        const img = new Image();
        img.onload = () => {
            this.spriteImage = img;
            console.log('爆炸雪碧图已加载');
        };
        img.onerror = () => {
            console.warn('爆炸雪碧图加载失败，爆炸效果将被禁用');
        };
        img.src = 'assets/images/ship_explosion.png';
    }
    
    // 创建爆炸效果
    createExplosion(x, y, color, scale = 1) {
        // 如果爆炸数量超过限制，移除最老的爆炸
        if (this.explosions.length >= GameConfig.explosion.maxExplosions) {
            const oldExplosion = this.explosions.shift();
            this.returnToPool(oldExplosion);
        }
        
        // 从对象池获取或创建新的爆炸对象
        let explosion = this.explosionPool.pop();
        if (!explosion) {
            explosion = {};
        }
        
        // 初始化爆炸参数
        explosion.x = x;
        explosion.y = y;
        explosion.color = color;
        explosion.scale = scale;
        explosion.startTime = Date.now();
        explosion.duration = GameConfig.explosion.duration;
        
        this.explosions.push(explosion);
    }
    
    // 更新所有爆炸效果
    update() {
        const currentTime = Date.now();
        
        // 移除已完成的爆炸（倒序遍历）
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const explosion = this.explosions[i];
            if (currentTime - explosion.startTime >= explosion.duration) {
                this.returnToPool(explosion);
                this.explosions.splice(i, 1);
            }
        }
    }
    
    // 渲染所有爆炸效果
    render(ctx) {
        const currentTime = Date.now();
        
        this.explosions.forEach(explosion => {
            this.renderExplosion(ctx, explosion, currentTime);
        });
    }
    
    // 渲染单个爆炸效果
    renderExplosion(ctx, explosion, currentTime) {
        const elapsed = currentTime - explosion.startTime;
        const progress = elapsed / explosion.duration;
        
        if (progress >= 1 || !this.spriteImage) return;
        
        const x = explosion.x;
        const y = explosion.y;
        const color = explosion.color;
        const scale = explosion.scale;
        
        ctx.save();
        this.renderSpriteExplosion(ctx, explosion, progress);
        ctx.restore();
    }
    
    // 渲染雪碧图爆炸效果
    renderSpriteExplosion(ctx, explosion, progress) {
        const x = explosion.x;
        const y = explosion.y;
        const color = explosion.color;
        const scale = explosion.scale;
        
        // 计算当前帧
        const frameIndex = Math.floor(progress * this.spriteFrameCount);
        const clampedFrameIndex = Math.min(frameIndex, this.spriteFrameCount - 1);
        
        // 使用滤色混合模式去除黑色背景
        ctx.globalCompositeOperation = 'screen';
        
        // 应用色相旋转来改变颜色
        const hueRotation = this.getHueRotation(color);
        if (hueRotation !== 0) {
            ctx.filter = `hue-rotate(${hueRotation}deg)`;
        }
        
        // 计算源坐标（水平排列）
        const sx = clampedFrameIndex * this.spriteFrameSize;
        const sy = 0;
        const sw = this.spriteFrameSize;
        const sh = this.spriteFrameSize;
        
        // 计算绘制尺寸和位置
        const drawSize = this.spriteFrameSize * scale * 1.5; // 增大到1.5倍，约90px
        const dx = x - drawSize / 2;
        const dy = y - drawSize / 2;
        
        // 绘制雪碧图帧
        ctx.drawImage(this.spriteImage, sx, sy, sw, sh, dx, dy, drawSize, drawSize);
        
        // 恢复默认混合模式和滤镜
        ctx.globalCompositeOperation = 'source-over';
        ctx.filter = 'none';
    }
    
    // 获取色相旋转角度
    getHueRotation(targetColor) {
        // 基于蓝色雪碧图计算色相旋转角度
        const colorMap = {
            '#00ff00': -60,  // 绿色：蓝色 → 绿色
            '#0099ff': 0,    // 蓝色：无需旋转
            '#ff0000': 140,  // 红色：蓝色 → 红色
            '#ffba00': 180   // 黄色：蓝色 → 黄色
        };
        
        return colorMap[targetColor] || 0;
    }
    
    // 回收爆炸对象到对象池
    returnToPool(explosion) {
        if (this.explosionPool.length < GameConfig.explosion.maxExplosions) {
            this.explosionPool.push(explosion);
        }
    }
    
    // 清理所有爆炸效果
    clear() {
        this.explosions.forEach(explosion => this.returnToPool(explosion));
        this.explosions.length = 0;
    }
}

// 动态缩放系统
class ScaleManager {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        
        // 检测是否为移动设备
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || canvasWidth <= 768;
        
        // 获取设备像素比，用于高DPI屏幕适配
        this.dpr = window.devicePixelRatio || 1;
        
        // 计算缩放比例（基于宽度，但限制最大最小值）
        this.scaleX = canvasWidth / GameConfig.baseWidth;
        this.scaleY = canvasHeight / GameConfig.baseHeight;
        this.scale = Math.min(this.scaleX, this.scaleY);
        
        // 限制缩放范围，避免过快或过慢
        this.scale = Math.max(0.3, Math.min(2.0, this.scale));
        
        // 移动端额外放大倍数 - 优化缩放倍数，减少过度放大
        if (this.isMobile) {
            // 根据DPI调整缩放倍数，避免高DPI设备过度放大
            const dpiAdjustment = Math.min(1.5, Math.max(1.0, 2.0 / this.dpr));
            
            if (canvasWidth <= 480) {
                this.mobileScaleMultiplier = 1.4 * dpiAdjustment; // 从2.0减少到1.4
            } else {
                this.mobileScaleMultiplier = 1.2 * dpiAdjustment; // 从1.6减少到1.2
            }
            
            this.scale *= this.mobileScaleMultiplier;
            console.log(`移动端缩放: 基础${(this.scale / this.mobileScaleMultiplier).toFixed(2)} × 移动端倍数${this.mobileScaleMultiplier.toFixed(2)} (DPI: ${this.dpr}) = ${this.scale.toFixed(2)}`);
        }
        
        console.log(`缩放比例: ${this.scale.toFixed(2)} (画布: ${canvasWidth}x${canvasHeight}, ${this.isMobile ? '移动端' : '桌面端'})`);
    }
    
    // 缩放距离/速度值
    scaleValue(value) {
        return value * this.scale;
    }
    
    // 缩放位置坐标
    scalePosition(x, y) {
        return {
            x: x * this.scaleX,
            y: y * this.scaleY
        };
    }
    
    // 获取基于缩放的基础数值
    getScaledValues() {
        return {
            // 无人机属性
            droneSize: this.scaleValue(8),
            droneCollisionRadius: this.scaleValue(9), // 碰撞半径，从10px改为9px
            droneBaseSpeed: this.scaleValue(1.5), // 减半：3 -> 1.5
            droneSpeedUpgrade: this.scaleValue(0.4), // 减半：0.8 -> 0.4
            droneAttackRange: this.scaleValue(160), // 增加到20倍体长，确保后排无人机能射击
            droneAutoAttackRange: this.scaleValue(180), // 相应增加自动索敌距离
            droneRallyRange: this.scaleValue(30),
            
            // 投射物属性
            projectileBaseSpeed: this.scaleValue(1.65), // 无人机速度的1.1倍：1.5 * 1.1 = 1.65
            projectileSpeedUpgrade: this.scaleValue(0.33), // 从45像素/秒改为20像素/秒：20/60 ≈ 0.33
            projectileSize: this.scaleValue(3),
            
            // 基地属性
            baseSize: this.scaleValue(40),
            baseCollisionRadius: this.scaleValue(45), // 碰撞半径，比显示大小稍大
            
            // 碎片属性
            debrisMinSize: this.scaleValue(10),
            debrisMaxSize: this.scaleValue(20)
        };
    }
}

// 游戏主类
class DroneGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 确保画布有有效的尺寸
        if (this.canvas.width === 0 || this.canvas.height === 0) {
            this.canvas.width = 1200;
            this.canvas.height = 800;
        }
        
        // 加载游戏背景图片
        this.gameBackground = new Image();
        this.gameBackground.src = 'assets/images/backgrounds/game_background.jpg';
        this.gameBackgroundLoaded = false;
        
        this.gameBackground.onload = () => {
            this.gameBackgroundLoaded = true;
            console.log('游戏背景图片加载完成');
        };
        
        this.gameBackground.onerror = () => {
            console.log('游戏背景图片加载失败，使用默认星空背景');
        };
        
        // 初始化缩放管理器
        this.scaleManager = new ScaleManager(this.canvas.width, this.canvas.height);
        this.scaledValues = this.scaleManager.getScaledValues();
        
        // 游戏设置
        this.gameMode = '1v1';
        this.playerColor = '#00ff00';
        this.aiDifficulty = 'easy'; // 默认简单难度
        this.gameState = 'welcome'; // welcome, playing, paused, gameOver
        this.isPaused = false;
        this.isModalOpen = false; // 新增：弹窗状态
        this.pauseStartTime = 0; // 当前暂停开始时间
        this.pauseTimer = null; // 暂停计时器
        this.selectedDebris = null; // 选中的资源块，用于显示详细信息
        this.lastDebrisClickTime = 0; // 上次点击资源的时间
        this.lastClickedDebris = null; // 上次点击的资源
        this.winner = null;
        this.gameStartTime = 0;
        
        // 玩家数据
        this.players = [];
        this.currentPlayer = 0;
        
        // 游戏对象
        this.debris = [];
        this.projectiles = [];
        
        // 时间管理
        this.lastTime = 0;
        this.spawnTimers = [];
        
        // 性能优化：对象池
        this.projectilePool = [];
        this.maxProjectilePool = 100;
        
        // 爆炸效果管理器
        this.explosionManager = new ExplosionManager();
        
        // 性能优化：缓存和计数器
        this.frameCount = 0;
        this.lastUIUpdate = 0;
        this.lastAIUpdate = 0;
        
        this.initWelcomeScreen();
    }
    
    initWelcomeScreen() {
        // 绑定欢迎界面事件
        const modeButtons = document.querySelectorAll('.mode-btn[data-mode]');
        const difficultyButtons = document.querySelectorAll('.mode-btn[data-difficulty]');
        const colorButtons = document.querySelectorAll('.color-btn');
        const startButton = document.getElementById('startGame');
        
        // 初始化选择状态
        this.selectedMode = null;
        this.selectedDifficulty = null;
        
        // 检查是否可以开始游戏
        const checkCanStart = () => {
            if (this.selectedMode && this.selectedDifficulty && startButton) {
                startButton.disabled = false;
            } else if (startButton) {
                startButton.disabled = true;
            }
        };
        
        // 游戏模式选择
        modeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                modeButtons.forEach(b => b.style.background = 'linear-gradient(45deg, #2196F3, #21CBF3)');
                e.target.style.background = 'linear-gradient(45deg, #4CAF50, #45a049)';
                this.gameMode = e.target.dataset.mode;
                this.selectedMode = e.target.dataset.mode;
                console.log('选择游戏模式:', this.selectedMode);
                checkCanStart();
            });
        });
        
        // 难度选择
        difficultyButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                difficultyButtons.forEach(b => {
                    b.classList.remove('selected');
                    b.style.background = 'linear-gradient(45deg, #2196F3, #21CBF3)';
                });
                e.target.classList.add('selected');
                e.target.style.background = 'linear-gradient(45deg, #FF9800, #F57C00)';
                this.aiDifficulty = e.target.dataset.difficulty;
                this.selectedDifficulty = e.target.dataset.difficulty;
                console.log('选择AI难度:', this.selectedDifficulty);
                checkCanStart();
            });
        });
        
        // 颜色选择
        colorButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                colorButtons.forEach(b => {
                    b.classList.remove('selected');
                    b.style.boxShadow = ''; // 清除发光效果
                });
                e.target.classList.add('selected');
                
                // 设置与选中颜色一致的发光效果
                const selectedColor = e.target.dataset.color;
                e.target.style.boxShadow = `0 0 20px ${selectedColor}`;
                
                this.playerColor = selectedColor;
            });
        });
        
        // 开始按钮 - 添加空值检查，避免在测试环境中报错
        if (startButton) {
            startButton.addEventListener('click', () => {
                if (!startButton.disabled) {
                    this.startGame();
                }
            });
        }
        
        // 初始检查
        checkCanStart();
        
        // 设置默认选中颜色的发光效果
        const defaultSelectedBtn = document.querySelector('.color-btn.selected');
        if (defaultSelectedBtn) {
            const defaultColor = defaultSelectedBtn.dataset.color;
            defaultSelectedBtn.style.boxShadow = `0 0 20px ${defaultColor}`;
        }
    }
    
    startGame() {
        // 隐藏欢迎界面，显示游戏界面
        document.getElementById('welcomeScreen').style.display = 'none';
        document.getElementById('gameCanvas').style.display = 'block';
        
        // 显示UI面板并添加游戏激活类
        const uiElement = document.getElementById('ui');
        uiElement.style.display = 'flex';
        uiElement.classList.add('game-active');
        
        // 降低背景音乐音量（游戏开始后保持播放但音量降低）
        console.log('游戏开始，尝试降低背景音乐音量');
        if (window.audioManager) {
            console.log('找到audioManager，降低背景音乐音量');
            window.audioManager.lowerBgMusicForGame();
        } else {
            console.log('未找到audioManager');
        }
        
        // 设置画布充满整个窗口
        this.setFullscreenCanvas();
        
        this.gameState = 'playing';
        this.gameStartTime = Date.now();
        
        // 初始化游戏
        this.initGame();
        
        // 绑定游戏事件
        this.bindGameEvents();
        
        // 绑定窗口大小变化事件
        window.addEventListener('resize', () => {
            if (this.gameState === 'playing') {
                this.setFullscreenCanvas();
            }
        });
        
        // 开始游戏循环
        this.gameLoop();
        
        // 更新UI
        this.updateUI();
    }
    
    // 暂停/恢复游戏
    togglePause() {
        if (this.gameState !== 'playing' || this.isModalOpen) return;
        
        if (!this.isPaused) {
            // 暂停游戏
            this.showPauseModal();
        } else {
            // 恢复游戏
            this.hidePauseModal();
        }
    }
    
    // 显示暂停弹窗
    showPauseModal() {
        const modal = document.getElementById('pauseModal');
        if (modal) {
            modal.style.display = 'block';
            this.isPaused = true;
            this.isModalOpen = true;
            this.pauseStartTime = Date.now();
            
            // 开始暂停计时
            this.startPauseTimer();
            
            // 更新暂停按钮状态
            const pauseBtn = document.getElementById('pauseGame');
            if (pauseBtn) {
                pauseBtn.classList.add('paused');
                pauseBtn.querySelector('.pause-icon').textContent = '▶️';
                pauseBtn.querySelector('.pause-text').textContent = '继续';
            }
        }
    }
    
    // 隐藏暂停弹窗
    hidePauseModal() {
        const modal = document.getElementById('pauseModal');
        if (modal) {
            modal.style.display = 'none';
            this.isPaused = false;
            this.isModalOpen = false;
            
            // 停止暂停计时
            this.stopPauseTimer();
            
            // 重置计时器显示
            const timerElement = document.getElementById('pauseTimer');
            if (timerElement) {
                timerElement.textContent = '暂停时间: 00:00';
            }
            
            // 更新暂停按钮状态
            const pauseBtn = document.getElementById('pauseGame');
            if (pauseBtn) {
                pauseBtn.classList.remove('paused');
                pauseBtn.querySelector('.pause-icon').textContent = '⏸️';
                pauseBtn.querySelector('.pause-text').textContent = '暂停';
            }
        }
    }
    
    // 开始暂停计时
    startPauseTimer() {
        this.stopPauseTimer(); // 确保没有重复的计时器
        
        // 重置计时器显示为00:00
        const timerElement = document.getElementById('pauseTimer');
        if (timerElement) {
            timerElement.textContent = '暂停时间: 00:00';
        }
        
        this.pauseTimer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.pauseStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            if (timerElement) {
                timerElement.textContent = `暂停时间: ${timeStr}`;
            }
        }, 1000);
    }
    
    // 停止暂停计时
    stopPauseTimer() {
        if (this.pauseTimer) {
            clearInterval(this.pauseTimer);
            this.pauseTimer = null;
        }
    }
    
    // 投降游戏
    surrenderGame() {
        if (this.gameState !== 'playing' || this.isModalOpen) return;
        
        // 显示投降确认弹窗
        this.showSurrenderModal();
    }
    
    // 显示投降确认弹窗
    showSurrenderModal() {
        const modal = document.getElementById('surrenderModal');
        if (modal) {
            modal.style.display = 'block';
            this.isModalOpen = true;
        }
    }
    
    // 隐藏投降确认弹窗
    hideSurrenderModal() {
        const modal = document.getElementById('surrenderModal');
        if (modal) {
            modal.style.display = 'none';
            this.isModalOpen = false;
        }
    }
    
    // 确认投降
    confirmSurrender() {
        console.log('玩家确认投降');
        
        // 隐藏弹窗
        this.hideSurrenderModal();
        
        // 确保玩家数据存在
        if (this.players.length === 0) {
            console.error('玩家数据不存在，无法显示结算界面');
            return;
        }
        
        // 设置游戏状态为失败
        this.gameState = 'gameOver';
        this.isPaused = false;
        
        // 设置获胜者为AI
        this.winner = 'ai';
        
        console.log('游戏结束，玩家投降失败');
    }
    
    // 设置画布充满整个窗口
    setFullscreenCanvas() {
        // 获取窗口尺寸
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // 设置画布尺寸
        this.canvas.width = width;
        this.canvas.height = height;
        
        // 根据屏幕尺寸动态设置UI安全区域
        const isMobile = width <= 768;
        const isLandscape = width > height;
        
        if (isMobile) {
            if (isLandscape) {
                // 移动端横屏：UI占视口高度的8%，最小60px，最大80px，强制水平排列
                const uiHeight = Math.max(60, Math.min(80, height * 0.08));
                this.uiSafeArea = {
                    left: 10,
                    right: 10,
                    top: uiHeight + 10,  // UI高度 + 10px边距
                    bottom: 10
                };
            } else if (width <= 399) {
                // 超小屏幕竖屏：UI垂直排列，需要更多高度，最小180px，最大250px
                const uiHeight = Math.max(180, Math.min(250, height * 0.18)); // 增加到18%
                this.uiSafeArea = {
                    left: 10,
                    right: 10,
                    top: uiHeight + 10,  // UI高度 + 10px边距
                    bottom: 10
                };
            } else if (width <= 480) {
                // 400-480px屏幕：UI水平排列，占视口高度的15%，最小100px，最大140px
                const uiHeight = Math.max(100, Math.min(140, height * 0.15)); // 增加到15%
                this.uiSafeArea = {
                    left: 10,
                    right: 10,
                    top: uiHeight + 10,  // UI高度 + 10px边距
                    bottom: 10
                };
            } else {
                // 一般移动端竖屏：UI水平排列，占视口高度的15%，最小100px，最大140px
                const uiHeight = Math.max(100, Math.min(140, height * 0.15)); // 增加到15%
                this.uiSafeArea = {
                    left: 10,
                    right: 10,
                    top: uiHeight + 10,  // UI高度 + 10px边距
                    bottom: 10
                };
            }
        } else {
            // 桌面端：UI在左侧，根据窗口大小调整
            let uiWidth;
            if (width <= 900) {
                uiWidth = 180; // 小窗口
            } else if (width <= 1200) {
                uiWidth = 200; // 中等窗口
            } else {
                uiWidth = 240; // 大窗口
            }
            
            this.uiSafeArea = {
                left: uiWidth + 30,  // UI面板宽度 + 安全边距
                right: 20,           // 右侧最小边距
                top: 20,             // 顶部最小边距
                bottom: 20           // 底部最小边距
            };
        }
        
        // 计算游戏安全区域
        this.gameSafeArea = {
            x: this.uiSafeArea.left,
            y: this.uiSafeArea.top,
            width: width - this.uiSafeArea.left - this.uiSafeArea.right,
            height: height - this.uiSafeArea.top - this.uiSafeArea.bottom
        };
        
        // 更新缩放管理器
        this.scaleManager = new ScaleManager(width, height);
        this.scaledValues = this.scaleManager.getScaledValues();
        
        if (this.gameState === 'playing') {
            // 游戏进行中时重新初始化相关组件
        }
        
        console.log(`画布设置为全屏: ${width}x${height} (${isMobile ? '移动端' : '桌面端'}, ${isLandscape ? '横屏' : '竖屏'})`);
        console.log(`游戏安全区域: ${this.gameSafeArea.width}x${this.gameSafeArea.height} at (${this.gameSafeArea.x}, ${this.gameSafeArea.y})`);
    }
    
    initGame() {
        this.players = [];
        this.debris = [];
        this.projectiles = [];
        this.spawnTimers = [];
        this.frameCount = 0;
        this.lastUIUpdate = 0;
        this.lastAIUpdate = 0;
        
        // 清理爆炸效果
        this.explosionManager.clear();
        
        const config = GameConfig.modes[this.gameMode];
        
        // 创建玩家
        for (let i = 0; i < config.players; i++) {
            const player = this.createPlayer(i, config.teams);
            this.players.push(player);
            this.spawnTimers.push(0);
        }
        
        // 生成初始无人机
        this.spawnInitialDrones();
        
        // 生成飞船碎片
        this.generateDebris();
        
        // 更新UI显示（移除不存在的元素引用，避免JavaScript错误）
        // document.getElementById('gameMode').textContent = this.gameMode;
        // document.getElementById('scaleRatio').textContent = this.scaleManager.scale.toFixed(2);
        console.log(`游戏模式: ${this.gameMode}, 缩放比例: ${this.scaleManager.scale.toFixed(2)}`);
    }
    
    // 对象池管理方法
    getProjectileFromPool() {
        return this.projectilePool.pop();
    }
    
    returnProjectileToPool(projectile) {
        if (this.projectilePool.length < this.maxProjectilePool) {
            projectile.reset();
            this.projectilePool.push(projectile);
        }
    }
    
    createPlayer(index, teamCount) {
        let x, y, team;
        
        // 获取游戏安全区域
        const safeArea = this.gameSafeArea;
        const margin = 100; // 基地距离边界的最小距离
        
        if (this.gameMode === '1v1') {
            // 对角线出生位置：左上角 vs 右下角（在安全区域内）
            if (index === 0) {
                x = safeArea.x + margin;
                y = safeArea.y + margin;
            } else {
                x = safeArea.x + safeArea.width - margin;
                y = safeArea.y + safeArea.height - margin;
            }
            team = index;
        } else if (this.gameMode === '2v2') {
            // 四角位置（在安全区域内）
            const leftX = safeArea.x + margin;
            const rightX = safeArea.x + safeArea.width - margin;
            const topY = safeArea.y + margin;
            const bottomY = safeArea.y + safeArea.height - margin;
            
            x = index < 2 ? leftX : rightX;
            y = index % 2 === 0 ? topY : bottomY;
            team = Math.floor(index / 2);
        } else { // ffa
            // 三角形分布（在安全区域内）
            const centerX = safeArea.x + safeArea.width / 2;
            const centerY = safeArea.y + safeArea.height / 2;
            const radius = Math.min(safeArea.width, safeArea.height) / 2 - margin;
            const angles = [0, 2.094, 4.189]; // 120度间隔
            
            x = centerX + Math.cos(angles[index]) * radius;
            y = centerY + Math.sin(angles[index]) * radius;
            team = index;
        }
        
        const isPlayer = index === 0;
        let color;
        
        if (isPlayer) {
            color = this.playerColor;
        } else {
            // AI使用玩家未选择的颜色
            const availableColors = GameConfig.colors.filter(c => c !== this.playerColor);
            color = availableColors[(index - 1) % availableColors.length];
        }
        
        return {
            id: index,
            team: team,
            isHuman: isPlayer,
            color: color,
            resources: 0,
            killCount: 0,
            base: new Base(x, y, index, color, this.scaledValues),
            drones: [],
            rallyPoint: null,
            upgrades: {
                attack: 0,
                attackSpeed: 0,
                moveSpeed: 0,
                health: 0,
                baseHealth: 0
            }
        };
    }
    
    spawnInitialDrones() {
        // 每个玩家初始20架无人机
        this.players.forEach(player => {
            for (let i = 0; i < 20; i++) {
                this.spawnDrone(player);
            }
        });
    }
    
    spawnDrone(player) {
        if (player.drones.length >= 30) return; // 最大数量从40减少到30
        
        // 尝试找到一个不重叠的生成位置
        let attempts = 0;
        let x, y;
        let validPosition = false;
        
        while (!validPosition && attempts < 50) {
            // 螺旋生成位置
            const angle = (player.drones.length + attempts * 0.1) * 0.5;
            const radius = Math.max(this.scaledValues.baseCollisionRadius + this.scaledValues.droneCollisionRadius + 5, 
                                  30 + Math.floor((player.drones.length + attempts) / 8) * 15);
            x = player.base.x + Math.cos(angle) * radius;
            y = player.base.y + Math.sin(angle) * radius;
            
            // 检查位置是否有效
            validPosition = this.isValidSpawnPosition(x, y, player);
            attempts++;
        }
        
        // 如果找不到有效位置，使用默认位置（可能会重叠，但至少能生成）
        if (!validPosition) {
            const angle = player.drones.length * 0.5;
            const radius = this.scaledValues.baseCollisionRadius + this.scaledValues.droneCollisionRadius + 10;
            x = player.base.x + Math.cos(angle) * radius;
            y = player.base.y + Math.sin(angle) * radius;
        }
        
        const drone = new Drone(x, y, player.id, player.color, player.upgrades, this.scaledValues);
        
        // 为AI无人机应用难度加成
        if (!player.isHuman) {
            const difficulty = GameConfig.difficulty[this.aiDifficulty];
            
            // 应用速度加成
            if (difficulty.droneSpeedMultiplier) {
                drone.moveSpeed *= difficulty.droneSpeedMultiplier;
            }
            
            // 应用攻击速度加成
            if (difficulty.attackSpeedMultiplier) {
                drone.attackSpeed = Math.max(100, drone.attackSpeed / difficulty.attackSpeedMultiplier);
            }
        }
        
        player.drones.push(drone);
    }
    
    isValidSpawnPosition(x, y, player) {
        // 检查画布边界
        const margin = this.scaledValues.droneCollisionRadius;
        if (x < margin || x > this.canvas.width - margin ||
            y < margin || y > this.canvas.height - margin) {
            return false;
        }
        
        // 安全边界检查 - 防止无人机在UI面板区域生成
        const isMobile = this.canvas.width <= 768;
        if (this.uiSafeArea) {
            if (isMobile) {
                // 移动端：检查是否在顶部UI面板区域内生成
                if (y < this.uiSafeArea.top) {
                    return false; // 无人机不能在顶部UI面板区域生成
                }
            } else {
                // 桌面端：检查是否在左侧UI面板区域内生成
                if (x < this.uiSafeArea.left) {
                    return false; // 无人机不能在左侧UI面板区域生成
                }
            }
        }
        
        // 检查与现有无人机的碰撞
        const allDrones = [];
        this.players.forEach(p => {
            allDrones.push(...p.drones);
        });
        
        for (let drone of allDrones) {
            const dx = x - drone.x;
            const dy = y - drone.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = this.scaledValues.droneCollisionRadius * 2;
            
            if (distance < minDistance) {
                return false;
            }
        }
        
        // 检查与基地的碰撞
        for (let p of this.players) {
            const dx = x - p.base.x;
            const dy = y - p.base.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = this.scaledValues.droneCollisionRadius + this.scaledValues.baseCollisionRadius;
            
            if (distance < minDistance) {
                return false;
            }
        }
        
        return true;
    }
    
    generateDebris() {
        // 减少资源块数量，但增加价值和生命值
        const debrisCount = this.gameMode === '2v2' ? 0 : 5; // 从15减少到5个
        
        // 获取游戏安全区域
        const safeArea = this.gameSafeArea;
        const margin = 80; // 资源距离边界和基地的最小距离
        
        for (let i = 0; i < debrisCount; i++) {
            let x, y;
            let validPosition = false;
            let attempts = 0;
            
            while (!validPosition && attempts < 50) {
                // 在安全区域内随机生成位置
                x = safeArea.x + margin + Math.random() * (safeArea.width - 2 * margin);
                y = safeArea.y + margin + Math.random() * (safeArea.height - 2 * margin);
                
                // 检查是否距离所有玩家基地足够远
                let minDistanceToBase = Infinity;
                for (const player of this.players) {
                    const distToBase = Math.sqrt((x - player.base.x) ** 2 + (y - player.base.y) ** 2);
                    minDistanceToBase = Math.min(minDistanceToBase, distToBase);
                }
                
                // 确保资源距离任何基地都至少200像素
                if (minDistanceToBase >= 200) {
                    validPosition = true;
                }
                attempts++;
            }
            
            // 如果找不到合适位置，使用安全区域中心附近
            if (!validPosition) {
                const centerX = safeArea.x + safeArea.width / 2;
                const centerY = safeArea.y + safeArea.height / 2;
                const offsetRange = Math.min(safeArea.width, safeArea.height) / 4;
                
                x = centerX + (Math.random() - 0.5) * offsetRange;
                y = centerY + (Math.random() - 0.5) * offsetRange;
            }
            
            // 更大的资源块
            const minSize = this.scaledValues.debrisMinSize * 2; // 双倍大小
            const maxSize = this.scaledValues.debrisMaxSize * 2;
            const size = minSize + Math.random() * (maxSize - minSize);
            
            // 更高的资源价值（5-15点资源）
            const points = 5 + Math.floor(Math.random() * 11);
            
            // 资源块生命值增加5倍：50-150点生命值
            const health = 50 + Math.floor(Math.random() * 101); // 原来是10-30，现在是50-150
            
            this.debris.push(new Debris(x, y, size, points, health));
        }
    }
    
    bindGameEvents() {
        // 统一的点击/触摸处理函数
        const handleInteraction = (e) => {
            e.preventDefault(); // 防止移动端双击缩放等默认行为
            
            const rect = this.canvas.getBoundingClientRect();
            let x, y;
            
            // 处理不同类型的事件
            if (e.type === 'touchstart' || e.type === 'touchend') {
                if (e.touches && e.touches.length > 0) {
                    x = e.touches[0].clientX - rect.left;
                    y = e.touches[0].clientY - rect.top;
                } else if (e.changedTouches && e.changedTouches.length > 0) {
                    x = e.changedTouches[0].clientX - rect.left;
                    y = e.changedTouches[0].clientY - rect.top;
                } else {
                    return;
                }
            } else {
                x = e.clientX - rect.left;
                y = e.clientY - rect.top;
            }
            
            // 安全边界检查 - 限制点击目标在安全区域内
            const isMobile = window.innerWidth <= 768;
            if (this.uiSafeArea) {
                if (isMobile) {
                    // 移动端：如果点击位置在顶部UI面板区域内，将目标限制到安全边界
                    if (y < this.uiSafeArea.top) {
                        y = this.uiSafeArea.top; // 将点击目标移动到安全边界
                        console.log(`移动端点击位置已限制到安全边界: y=${y}`);
                    }
                } else {
                    // 桌面端：如果点击位置在左侧UI面板区域内，将目标限制到安全边界
                    if (x < this.uiSafeArea.left) {
                        x = this.uiSafeArea.left; // 将点击目标移动到安全边界
                        console.log(`桌面端点击位置已限制到安全边界: x=${x}`);
                    }
                }
            }
            
            // 检查是否点击了游戏结束页面的返回按钮
            if (this.gameState === 'gameOver' && this.returnButton) {
                if (x >= this.returnButton.x && x <= this.returnButton.x + this.returnButton.width &&
                    y >= this.returnButton.y && y <= this.returnButton.y + this.returnButton.height) {
                    this.returnToWelcome();
                    return;
                }
            }
            
            if (this.gameState !== 'playing') return;
            
            // 检查是否点击了可攻击目标（敌方单位或资源）
            let clickedTarget = null;
            const clickRadius = window.innerWidth <= 768 ? 25 : 15; // 移动端增大点击区域
            
            // 检查是否点击了敌方无人机或基地
            this.players.forEach(player => {
                if (player.team === this.players[0].team) return;
                
                // 检查基地 - 只有血量大于0的基地才能被选中
                if (player.base.health > 0) {
                    const baseDist = Math.sqrt((x - player.base.x) ** 2 + (y - player.base.y) ** 2);
                    if (baseDist < this.scaledValues.baseSize + clickRadius) {
                        clickedTarget = player.base;
                    }
                }
                
                // 检查无人机 - 只有血量大于0的无人机才能被选中
                player.drones.forEach(drone => {
                    if (drone.health > 0) {
                        const droneDist = Math.sqrt((x - drone.x) ** 2 + (y - drone.y) ** 2);
                        if (droneDist < drone.size + clickRadius) {
                            clickedTarget = drone;
                        }
                    }
                });
            });
            
            // 检查是否点击了资源（飞船碎片）
            if (!clickedTarget) {
                this.debris.forEach(debris => {
                    const debrisDist = Math.sqrt((x - debris.x) ** 2 + (y - debris.y) ** 2);
                    if (debrisDist < debris.size + clickRadius) {
                        clickedTarget = debris;
                    }
                });
            }
            
            // 处理资源选择（用于显示详细信息）
            if (clickedTarget && clickedTarget.constructor.name === 'Debris') {
                // 检查是否是双击或长按（用于显示详细信息）
                const now = Date.now();
                if (this.lastDebrisClickTime && (now - this.lastDebrisClickTime < 300) && 
                    this.lastClickedDebris === clickedTarget) {
                    // 双击资源 - 显示/隐藏详细信息
                    if (this.selectedDebris === clickedTarget) {
                        this.selectedDebris = null; // 取消选择
                    } else {
                        this.selectedDebris = clickedTarget; // 选择资源
                    }
                    console.log(`${this.selectedDebris ? '显示' : '隐藏'}资源详细信息`);
                    return; // 不执行攻击命令
                }
                this.lastDebrisClickTime = now;
                this.lastClickedDebris = clickedTarget;
            }
            
            if (clickedTarget) {
                // 选中攻击目标 - 立即响应玩家操作
                const currentTime = Date.now();
                this.players[0].drones.forEach(drone => {
                    // 立即停止当前行动，响应新指令
                    drone.interruptCurrentAction();
                    drone.setPlayerTarget(clickedTarget);
                    
                    // 标记为玩家最新命令
                    drone.lastPlayerCommandTime = currentTime;
                    drone.shouldInterruptAttack = false; // 攻击命令不需要中断攻击
                });
                const targetType = clickedTarget.constructor.name === 'Debris' ? '资源' : clickedTarget.constructor.name;
                console.log(`选中攻击目标: ${targetType}`);
                
                // 移动端触觉反馈
                if (navigator.vibrate) {
                    navigator.vibrate(50); // 短震动反馈
                }
            } else {
                // 设置新的集结点 - 立即响应玩家操作
                const safePosition = this.ensureRallyPointInSafeArea(x, y);
                this.players[0].rallyPoint = safePosition;
                this.players[0].lastRallyTime = Date.now(); // 记录集结时间
                const currentTime = Date.now();
                
                // 清除资源选择状态
                this.selectedDebris = null;
                
                // 重置所有无人机的集结状态和玩家指定目标
                this.players[0].drones.forEach(drone => {
                    // 立即停止当前行动，响应新指令
                    drone.interruptCurrentAction();
                    drone.hasReachedRally = false;
                    drone.clearPlayerTarget();
                    
                    // 标记为玩家最新命令，优先级最高
                    drone.lastPlayerCommandTime = currentTime;
                    drone.shouldInterruptAttack = true;
                });
                
                console.log(`设置集结点: (${Math.round(x)}, ${Math.round(y)})`);
                
                // 移动端触觉反馈
                if (navigator.vibrate) {
                    navigator.vibrate(30); // 轻微震动反馈
                }
            }
        };
        
        // 绑定鼠标事件（桌面端）
        this.canvas.addEventListener('click', handleInteraction);
        
        // 绑定触摸事件（移动端）
        this.canvas.addEventListener('touchstart', (e) => {
            this.touchStartTime = Date.now();
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            // 只处理短时间的触摸（避免长按等手势）
            if (Date.now() - this.touchStartTime < 500) {
                handleInteraction(e);
            }
        });
        
        // 防止移动端的默认触摸行为
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        });
        
        // 升级按钮事件（支持触摸）
        const addButtonEvents = (id, attribute) => {
            const button = document.getElementById(id);
            button.addEventListener('click', () => {
                this.upgradeAttribute(attribute);
            });
            button.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.upgradeAttribute(attribute);
            });
        };
        
        addButtonEvents('upgradeAttack', 'attack');
        addButtonEvents('upgradeSpeed', 'attackSpeed');
        addButtonEvents('upgradeMoveSpeed', 'moveSpeed');
        addButtonEvents('upgradeHealth', 'health');
        addButtonEvents('upgradeBase', 'baseHealth');
        
        // 游戏控制按钮事件
        const pauseBtn = document.getElementById('pauseGame');
        const surrenderBtn = document.getElementById('surrenderGame');
        
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                this.togglePause();
            });
            pauseBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.togglePause();
            });
        }
        
        if (surrenderBtn) {
            surrenderBtn.addEventListener('click', () => {
                this.surrenderGame();
            });
            surrenderBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.surrenderGame();
            });
        }
        
        // 投降弹窗按钮事件
        const confirmSurrenderBtn = document.getElementById('confirmSurrender');
        const cancelSurrenderBtn = document.getElementById('cancelSurrender');
        
        if (confirmSurrenderBtn) {
            confirmSurrenderBtn.addEventListener('click', () => {
                this.confirmSurrender();
            });
            confirmSurrenderBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.confirmSurrender();
            });
        }
        
        if (cancelSurrenderBtn) {
            cancelSurrenderBtn.addEventListener('click', () => {
                this.hideSurrenderModal();
            });
            cancelSurrenderBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.hideSurrenderModal();
            });
        }
        
        // 暂停弹窗按钮事件
        const resumeGameBtn = document.getElementById('resumeGame');
        
        if (resumeGameBtn) {
            resumeGameBtn.addEventListener('click', () => {
                this.hidePauseModal();
            });
            resumeGameBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.hidePauseModal();
            });
        }
        
        // 阻止弹窗内容区域的点击事件冒泡（防止意外关闭）
        const surrenderDialog = document.querySelector('.surrender-dialog');
        const pauseDialog = document.querySelector('.pause-dialog');
        
        if (surrenderDialog) {
            surrenderDialog.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
        
        if (pauseDialog) {
            pauseDialog.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
    }
    
    upgradeAttribute(attribute) {
        const player = this.players[0];
        if (player.upgrades[attribute] >= 10) return;
        
        // 检查基地是否已被摧毁（仅在2v2模式下限制升级）
        if (player.base.health <= 0 && this.gameMode === '2v2') {
            console.log('基地已被摧毁，无法升级');
            return;
        }
        
        // 计算升级所需资源
        const requiredResources = this.getUpgradeCost(attribute, player.upgrades[attribute]);
        
        // 检查资源是否足够
        if (player.resources < requiredResources) return;
        
        // 消耗资源并升级
        player.resources -= requiredResources;
        player.upgrades[attribute]++;
        
        // 如果是基地血量升级，直接应用到基地
        if (attribute === 'baseHealth') {
            const currentLevel = player.upgrades[attribute];
            const increment = currentLevel <= 4 ? 100 : 50; // 4级后减半
            player.base.maxHealth += increment;
            player.base.health += increment;
        }
        
        console.log(`${attribute}升级到${player.upgrades[attribute]}级，消耗${requiredResources}点资源，剩余${player.resources}点`);
        this.updateUI();
    }
    
    // 计算升级所需资源
    getUpgradeCost(attribute, currentLevel) {
        if (attribute === 'baseHealth') {
            // 基地升级固定消耗10点资源
            return 10;
        } else {
            // 无人机属性升级：阶梯式消耗
            if (currentLevel < 4) {
                return 1; // 0-3级：1点
            } else if (currentLevel < 7) {
                return 2; // 4-6级：2点
            } else {
                return 3; // 7-9级：3点
            }
        }
    }
    
    returnToWelcome() {
        // 重置游戏状态
        this.gameState = 'welcome';
        this.winner = null;
        this.returnButton = null;
        
        // 停止暂停计时器
        this.stopPauseTimer();
        
        // 清理游戏数据
        this.players = [];
        this.debris = [];
        this.projectiles = [];
        this.spawnTimers = [];
        
        // 隐藏UI面板并移除游戏激活类
        const uiElement = document.getElementById('ui');
        uiElement.style.display = 'none';
        uiElement.classList.remove('game-active');
        
        // 显示欢迎界面，隐藏游戏界面
        document.getElementById('welcomeScreen').style.display = 'flex';
        document.getElementById('gameCanvas').style.display = 'none';
        
        // 恢复背景音乐正常音量
        if (window.audioManager) {
            window.audioManager.restoreBgMusicVolume();
        }
        
        console.log('返回到开始页面');
    }
    
    gameLoop(currentTime = 0) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        if (this.gameState === 'playing' && !this.isPaused && !this.isModalOpen) {
            // 正常游戏状态：更新和渲染
            this.update(deltaTime);
            this.render();
        } else if (this.gameState === 'playing' && (this.isPaused || this.isModalOpen)) {
            // 暂停状态或弹窗打开：只渲染，不更新游戏逻辑
            this.render();
            if (this.isPaused && !this.isModalOpen) {
                // 只有纯暂停时才显示暂停覆盖层
                this.renderPauseOverlay();
            }
        } else if (this.gameState === 'gameOver') {
            // 游戏结束状态：渲染游戏画面和结束界面
            this.render();
        } else if (this.gameState === 'welcome') {
            // 欢迎界面不需要渲染游戏内容
        }
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime) {
        this.frameCount++;
        
        // 更新无人机生产计时器
        for (let i = 0; i < this.players.length; i++) {
            const player = this.players[i];
            if (player.base.health > 0) {
                this.spawnTimers[i] += deltaTime;
                
                // 每1秒生产一架无人机（速度减半）
                if (this.spawnTimers[i] >= 1000) {
                    this.spawnDrone(player);
                    this.spawnTimers[i] = 0;
                }
            }
        }
        
        // 更新所有无人机
        this.updateDrones(deltaTime);
        
        // 更新投射物
        this.updateProjectiles(deltaTime);
        
        // 更新爆炸效果
        this.explosionManager.update();
        
        // 检查碰撞
        this.checkCollisions();
        
        // AI更新（降低频率）
        if (this.frameCount - this.lastAIUpdate > 10) { // 每10帧更新一次AI
            this.updateAI();
            this.lastAIUpdate = this.frameCount;
        }
        
        // 检查游戏结束条件
        this.checkGameEnd();
        
        // 更新UI（降低频率）
        if (this.frameCount - this.lastUIUpdate > 30) { // 每30帧更新一次UI
            this.updateUI();
            this.lastUIUpdate = this.frameCount;
        }
    }
    updateDrones(deltaTime) {
        // 缓存敌方目标，避免重复计算
        const enemiesCache = new Map();
        
        for (let i = 0; i < this.players.length; i++) {
            const player = this.players[i];
            
            // 获取或缓存敌方目标
            if (!enemiesCache.has(player.team)) {
                enemiesCache.set(player.team, this.getEnemies(player));
            }
            const enemies = enemiesCache.get(player.team);
            
            // 第一遍：更新无人机状态
            for (let j = 0; j < player.drones.length; j++) {
                const drone = player.drones[j];
                drone.update(deltaTime, player.rallyPoint, enemies, this.debris);
            }
            
            // 第二遍：应用Boids算法调整位置（降低频率）
            if (this.frameCount % 3 === 0) { // 每3帧执行一次Boids
                for (let j = 0; j < player.drones.length; j++) {
                    const drone = player.drones[j];
                    drone.applyBoids(player.drones, deltaTime);
                }
            }
            
            // 移除死亡的无人机（倒序遍历避免索引问题）
            for (let j = player.drones.length - 1; j >= 0; j--) {
                if (player.drones[j].health <= 0) {
                    const deadDrone = player.drones[j];
                    // 触发爆炸效果，使用游戏缩放
                    this.explosionManager.createExplosion(
                        deadDrone.x, 
                        deadDrone.y, 
                        deadDrone.color, 
                        this.scaleManager.scale
                    );
                    player.drones.splice(j, 1);
                }
            }
        }
    }
    
    getEnemies(player) {
        const enemies = [];
        this.players.forEach(otherPlayer => {
            if (otherPlayer.team !== player.team) {
                // 添加所有敌方无人机（血量检查在具体使用时进行）
                enemies.push(...otherPlayer.drones);
                
                // 只添加血量大于0的敌方基地
                if (otherPlayer.base.health > 0) {
                    enemies.push(otherPlayer.base);
                }
            }
        });
        return enemies;
    }
    
    updateProjectiles(deltaTime) {
        // 倒序遍历，移除超出范围的投射物
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            projectile.update(deltaTime);
            
            // 检查是否超出范围
            if (projectile.x < 0 || projectile.x > this.canvas.width ||
                projectile.y < 0 || projectile.y > this.canvas.height) {
                // 回收到对象池
                this.returnProjectileToPool(projectile);
                this.projectiles.splice(i, 1);
            }
        }
    }
    
    checkCollisions() {
        // 使用倒序遍历，避免删除元素时的索引问题
        for (let pIndex = this.projectiles.length - 1; pIndex >= 0; pIndex--) {
            const projectile = this.projectiles[pIndex];
            let closestTarget = null;
            let closestDistance = Infinity;
            
            // 获取攻击方玩家
            const attacker = this.players[projectile.owner];
            if (!attacker) {
                this.projectiles.splice(pIndex, 1);
                continue;
            }
            
            // 寻找最近的碰撞目标（确保只击中一个）
            // 子弹可以穿透己方单位，所以只检查敌方单位
            for (let i = 0; i < this.players.length; i++) {
                const player = this.players[i];
                if (player.team === attacker.team) continue; // 跳过己方单位
                
                // 检查与无人机的碰撞
                for (let j = 0; j < player.drones.length; j++) {
                    const drone = player.drones[j];
                    const dx = projectile.x - drone.x;
                    const dy = projectile.y - drone.y;
                    const distanceSq = dx * dx + dy * dy; // 使用平方距离避免sqrt
                    const collisionRadiusSq = (drone.size + projectile.size) ** 2;
                    
                    if (distanceSq < collisionRadiusSq && distanceSq < closestDistance) {
                        closestTarget = { type: 'drone', target: drone, player: player };
                        closestDistance = distanceSq;
                    }
                }
                
                // 检查与基地的碰撞 - 只有血量大于0的基地才能被攻击
                if (player.base.health > 0) {
                    const dx = projectile.x - player.base.x;
                    const dy = projectile.y - player.base.y;
                    const baseDistanceSq = dx * dx + dy * dy;
                    const baseCollisionRadiusSq = (this.scaledValues.baseCollisionRadius + projectile.size) ** 2;
                    
                    if (baseDistanceSq < baseCollisionRadiusSq && baseDistanceSq < closestDistance) {
                        closestTarget = { type: 'base', target: player.base, player: player };
                        closestDistance = baseDistanceSq;
                    }
                }
            }
            
            // 检查与碎片的碰撞（物资）
            for (let dIndex = this.debris.length - 1; dIndex >= 0; dIndex--) {
                const debris = this.debris[dIndex];
                const dx = projectile.x - debris.x;
                const dy = projectile.y - debris.y;
                const distanceSq = dx * dx + dy * dy;
                const collisionRadiusSq = (debris.size + projectile.size) ** 2;
                
                if (distanceSq < collisionRadiusSq && distanceSq < closestDistance) {
                    closestTarget = { type: 'debris', target: debris, index: dIndex };
                    closestDistance = distanceSq;
                }
            }
            
            // 处理碰撞
            if (closestTarget) {
                if (closestTarget.type === 'drone') {
                    closestTarget.target.takeDamage(projectile.damage, projectile.owner);
                    if (closestTarget.target.health <= 0) {
                        this.addKillCount(attacker);
                    }
                } else if (closestTarget.type === 'base') {
                    closestTarget.target.takeDamage(projectile.damage);
                } else if (closestTarget.type === 'debris') {
                    // 资源块受到伤害
                    const destroyed = closestTarget.target.takeDamage(projectile.damage);
                    if (destroyed) {
                        // 资源块被摧毁，给予资源奖励
                        let resourceGain = closestTarget.target.points;
                        
                        // 为困难AI应用经济加成
                        if (!attacker.isHuman) {
                            const difficulty = GameConfig.difficulty[this.aiDifficulty];
                            if (difficulty.economicBonus) {
                                resourceGain = Math.floor(resourceGain * difficulty.economicBonus);
                            }
                        }
                        
                        attacker.resources += resourceGain;
                        this.debris.splice(closestTarget.index, 1);
                    }
                }
                
                // 回收投射物到对象池
                this.returnProjectileToPool(this.projectiles[pIndex]);
                this.projectiles.splice(pIndex, 1);
            }
        }
    }
    
    addKillCount(player) {
        // 击杀数统计：记录整局游戏击杀的敌方无人机总数
        player.killCount++;
        
        // 每击杀5架无人机获得1点资源（但击杀数不重置）
        if (player.killCount % 5 === 0) {
            player.resources += 1;
            console.log(`玩家${player.id} 击杀${player.killCount}架无人机，获得资源奖励！`);
        }
    }
    
    // 确保集结点在安全区域内
    ensureRallyPointInSafeArea(x, y) {
        if (!this.uiSafeArea) return { x, y };
        
        const isMobile = this.canvas.width <= 768;
        let adjustedX = x;
        let adjustedY = y;
        
        if (isMobile) {
            // 移动端：确保集结点不在顶部UI区域
            if (adjustedY < this.uiSafeArea.top) {
                adjustedY = this.uiSafeArea.top + 20; // 添加20像素缓冲区
            }
        } else {
            // 桌面端：确保集结点不在左侧UI区域
            if (adjustedX < this.uiSafeArea.left) {
                adjustedX = this.uiSafeArea.left + 20; // 添加20像素缓冲区
            }
        }
        
        // 确保调整后的位置在画布范围内
        adjustedX = Math.max(20, Math.min(adjustedX, this.canvas.width - 20));
        adjustedY = Math.max(20, Math.min(adjustedY, this.canvas.height - 20));
        
        return { x: adjustedX, y: adjustedY };
    }

    updateAI() {
        for (let i = 0; i < this.players.length; i++) {
            const player = this.players[i];
            if (player.isHuman || player.base.health <= 0) continue;
            
            // 获取 AI 难度配置
            const difficulty = GameConfig.difficulty[this.aiDifficulty];
            
            // 战场感知：检测敌方动态
            this.updateBattlefieldAwareness(player, difficulty);
            
            // AI 战术决策（困难AI更频繁决策）
            const decisionInterval = difficulty.name === '困难' ? 50 : 100; // 困难AI决策频率翻倍
            if (this.frameCount % decisionInterval === i * 25) {
                this.makeAIDecision(player, difficulty);
            }
            
            // AI 自动升级和资源管理
            const upgradeInterval = difficulty.name === '困难' ? 150 : 200; // 困难AI更频繁升级
            if (player.resources > 0 && this.frameCount % upgradeInterval === i * 50) {
                this.handleAIUpgrade(player, difficulty);
            }
            
            // 困难AI主动收集资源
            if (difficulty.resourcePriority && difficulty.name === '困难' && 
                this.frameCount % 300 === i * 75) { // 每5秒检查一次资源
                this.handleAIResourceCollection(player, difficulty);
            }
        }
    }
    
    // 战场感知系统
    updateBattlefieldAwareness(aiPlayer, difficulty) {
        // 检测受攻击状态
        if (aiPlayer.underAttack) {
            const timeSinceAttack = Date.now() - aiPlayer.lastAttackTime;
            
            // 受攻击后的紧急反应（根据难度调整反应时间）
            const reactionTime = difficulty.reactionTime || 3000; // 使用配置中的反应时间
            
            if (timeSinceAttack < reactionTime) {
                this.executeEmergencyResponse(aiPlayer, difficulty);
                return; // 紧急状态下优先处理
            } else {
                // 清除攻击状态
                aiPlayer.underAttack = false;
                aiPlayer.attackerPlayerId = null;
            }
        }
        
        // 检测敌方玩家的移动模式
        const humanPlayer = this.players.find(p => p.isHuman);
        if (humanPlayer && this.frameCount % 60 === 0) { // 每秒检测一次
            this.analyzeEnemyMovement(aiPlayer, humanPlayer, difficulty);
        }
    }
    
    // 紧急响应
    executeEmergencyResponse(aiPlayer, difficulty) {
        const attackerPlayer = this.players[aiPlayer.attackerPlayerId];
        if (!attackerPlayer) return;
        
        // 根据难度调整响应强度
        if (difficulty.name === '简单') {
            // 简单AI：轻微调整，主要是防守
            if (Math.random() < 0.3) { // 30%概率响应
                const angle = Math.random() * Math.PI * 2;
                const radius = 100;
                const rawPosition = {
                    x: aiPlayer.base.x + Math.cos(angle) * radius,
                    y: aiPlayer.base.y + Math.sin(angle) * radius
                };
                aiPlayer.rallyPoint = this.ensureRallyPointInSafeArea(rawPosition.x, rawPosition.y);
            }
        } else if (difficulty.name === '中等') {
            // 中等AI：积极防守或反击
            if (aiPlayer.drones.length > attackerPlayer.drones.length * 0.8) {
                // 有足够兵力时反击
                const rawPosition = {
                    x: attackerPlayer.base.x + (Math.random() - 0.5) * 200,
                    y: attackerPlayer.base.y + (Math.random() - 0.5) * 200
                };
                aiPlayer.rallyPoint = this.ensureRallyPointInSafeArea(rawPosition.x, rawPosition.y);
                console.log(`AI ${aiPlayer.id} 感知到攻击，发起反击`);
            } else {
                // 兵力不足时加强防守
                const rawPosition = {
                    x: aiPlayer.base.x + (Math.random() - 0.5) * 150,
                    y: aiPlayer.base.y + (Math.random() - 0.5) * 150
                };
                aiPlayer.rallyPoint = this.ensureRallyPointInSafeArea(rawPosition.x, rawPosition.y);
            }
        } else if (difficulty.name === '困难') {
            // 困难AI：智能反击
            this.executeIntelligentCounterAttack(aiPlayer, attackerPlayer);
        }
    }
    
    // 智能反击
    executeIntelligentCounterAttack(aiPlayer, attackerPlayer) {
        // 分析攻击者的位置和兵力分布
        const attackerRally = attackerPlayer.rallyPoint;
        
        if (attackerRally) {
            // 预测攻击者的意图并制定反击策略
            const distanceToMyBase = Math.sqrt(
                (attackerRally.x - aiPlayer.base.x) ** 2 + 
                (attackerRally.y - aiPlayer.base.y) ** 2
            );
            
            if (distanceToMyBase < 300) {
                // 攻击者靠近我的基地，执行防守反击
                const counterAngle = Math.atan2(
                    attackerRally.y - aiPlayer.base.y,
                    attackerRally.x - aiPlayer.base.x
                );
                const rawPosition = {
                    x: aiPlayer.base.x + Math.cos(counterAngle) * 200,
                    y: aiPlayer.base.y + Math.sin(counterAngle) * 200
                };
                aiPlayer.rallyPoint = this.ensureRallyPointInSafeArea(rawPosition.x, rawPosition.y);
                console.log(`AI ${aiPlayer.id} 执行防守反击`);
            } else {
                // 攻击者在远处，尝试侧翼攻击
                const flankAngle = Math.atan2(
                    attackerPlayer.base.y - attackerRally.y,
                    attackerPlayer.base.x - attackerRally.x
                ) + Math.PI / 2;
                
                const rawPosition = {
                    x: attackerPlayer.base.x + Math.cos(flankAngle) * 250,
                    y: attackerPlayer.base.y + Math.sin(flankAngle) * 250
                };
                aiPlayer.rallyPoint = this.ensureRallyPointInSafeArea(rawPosition.x, rawPosition.y);
                console.log(`AI ${aiPlayer.id} 执行侧翼反击`);
            }
        } else {
            // 没有明确的攻击点，直接反击攻击者基地
            const rawPosition = {
                x: attackerPlayer.base.x + (Math.random() - 0.5) * 100,
                y: attackerPlayer.base.y + (Math.random() - 0.5) * 100
            };
            aiPlayer.rallyPoint = this.ensureRallyPointInSafeArea(rawPosition.x, rawPosition.y);
        }
    }
    
    // 分析敌方移动模式
    analyzeEnemyMovement(aiPlayer, humanPlayer, difficulty) {
        const humanRally = humanPlayer.rallyPoint;
        if (!humanRally) return;
        
        // 记录人类玩家的历史位置（简单的移动检测）
        if (!aiPlayer.enemyMovementHistory) {
            aiPlayer.enemyMovementHistory = [];
        }
        
        aiPlayer.enemyMovementHistory.push({
            x: humanRally.x,
            y: humanRally.y,
            time: Date.now()
        });
        
        // 只保留最近5秒的历史
        const fiveSecondsAgo = Date.now() - 5000;
        aiPlayer.enemyMovementHistory = aiPlayer.enemyMovementHistory.filter(
            pos => pos.time > fiveSecondsAgo
        );
        
        // 分析移动趋势
        if (aiPlayer.enemyMovementHistory.length >= 3) {
            const isMovingTowardsMe = this.isEnemyApproaching(aiPlayer, aiPlayer.enemyMovementHistory);
            const isEnemyAggressive = this.isEnemyAggressive(aiPlayer, humanPlayer);
            
            // 根据难度和分析结果调整策略
            if (isMovingTowardsMe && difficulty.name !== '简单') {
                this.respondToApproachingEnemy(aiPlayer, humanPlayer, difficulty);
            }
            
            if (isEnemyAggressive && difficulty.name === '困难') {
                this.respondToAggressiveEnemy(aiPlayer, humanPlayer);
            }
        }
    }
    
    // 检测敌人是否正在接近
    isEnemyApproaching(aiPlayer, movementHistory) {
        if (movementHistory.length < 2) return false;
        
        const recent = movementHistory[movementHistory.length - 1];
        const earlier = movementHistory[0];
        
        const recentDistance = Math.sqrt(
            (recent.x - aiPlayer.base.x) ** 2 + 
            (recent.y - aiPlayer.base.y) ** 2
        );
        
        const earlierDistance = Math.sqrt(
            (earlier.x - aiPlayer.base.x) ** 2 + 
            (earlier.y - aiPlayer.base.y) ** 2
        );
        
        return recentDistance < earlierDistance - 50; // 接近了50像素以上
    }
    
    // 检测敌人是否表现出攻击性
    isEnemyAggressive(aiPlayer, humanPlayer) {
        const humanRally = humanPlayer.rallyPoint;
        if (!humanRally) return false;
        
        // 检查人类是否将集结点设置在AI附近
        const distanceToAI = Math.sqrt(
            (humanRally.x - aiPlayer.base.x) ** 2 + 
            (humanRally.y - aiPlayer.base.y) ** 2
        );
        
        return distanceToAI < 400; // 400像素内认为是攻击性行为
    }
    
    // 响应接近的敌人
    respondToApproachingEnemy(aiPlayer, humanPlayer, difficulty) {
        if (difficulty.name === '中等') {
            // 中等AI：预防性防守
            const defenseAngle = Math.atan2(
                humanPlayer.rallyPoint.y - aiPlayer.base.y,
                humanPlayer.rallyPoint.x - aiPlayer.base.x
            );
            
            aiPlayer.rallyPoint = {
                x: aiPlayer.base.x + Math.cos(defenseAngle) * 150,
                y: aiPlayer.base.y + Math.sin(defenseAngle) * 150
            };
            console.log(`AI ${aiPlayer.id} 感知到敌人接近，准备防守`);
        } else if (difficulty.name === '困难') {
            // 困难AI：主动迎击
            aiPlayer.rallyPoint = {
                x: humanPlayer.rallyPoint.x + (Math.random() - 0.5) * 100,
                y: humanPlayer.rallyPoint.y + (Math.random() - 0.5) * 100
            };
            console.log(`AI ${aiPlayer.id} 感知到敌人接近，主动迎击`);
        }
    }
    
    // 响应攻击性敌人
    respondToAggressiveEnemy(aiPlayer, humanPlayer) {
        // 困难AI的高级战术：尝试包抄
        const humanRally = humanPlayer.rallyPoint;
        const flankAngle = Math.atan2(
            humanRally.y - aiPlayer.base.y,
            humanRally.x - aiPlayer.base.x
        ) + Math.PI / 3; // 60度侧翼
        
        const flankDistance = 200;
        aiPlayer.rallyPoint = {
            x: humanRally.x + Math.cos(flankAngle) * flankDistance,
            y: humanRally.y + Math.sin(flankAngle) * flankDistance
        };
        console.log(`AI ${aiPlayer.id} 感知到敌人攻击性，执行包抄战术`);
    }
    
    // AI 战术决策 - 增强版协同作战
    makeAIDecision(player, difficulty) {
        const enemies = this.getEnemies(player);
        if (enemies.length === 0) return;
        
        const baseHealthPercent = player.base.health / player.base.maxHealth;
        const teamMate = this.getTeamMate(player);
        const humanPlayer = this.players.find(p => p.isHuman);
        
        // 2v2模式下的协同逻辑
        if (this.gameMode === '2v2' && teamMate) {
            this.makeTeamAIDecision(player, teamMate, difficulty, enemies, baseHealthPercent);
            return;
        }
        
        // 1v1和FFA模式的原有逻辑
        if (difficulty.name === '简单') {
            this.makeSimpleAIDecision(player, difficulty, baseHealthPercent);
        } else if (difficulty.name === '中等') {
            this.makeMediumAIDecision(player, difficulty, enemies, baseHealthPercent, humanPlayer);
        } else if (difficulty.name === '困难') {
            this.makeHardAIDecision(player, difficulty, enemies, baseHealthPercent, humanPlayer);
        }
    }
    
    // 获取队友
    getTeamMate(player) {
        return this.players.find(p => p.team === player.team && p.id !== player.id);
    }
    
    // 2v2协同AI决策 - 增强版
    makeTeamAIDecision(aiPlayer, teamMate, difficulty, enemies, baseHealthPercent) {
        const humanPlayer = teamMate.isHuman ? teamMate : null;
        const aiBaseHealth = aiPlayer.base.health / aiPlayer.base.maxHealth;
        const teamMateBaseHealth = teamMate.base.health / teamMate.base.maxHealth;
        
        // 检查是否有队友基地正在受到攻击
        const teamMateUnderAttack = this.isBaseUnderAttack(teamMate);
        const selfUnderAttack = this.isBaseUnderAttack(aiPlayer);
        
        // 优先级1：队友基地受到攻击，立即支援
        if (teamMateUnderAttack) {
            this.executeEmergencyDefense(aiPlayer, teamMate, enemies);
            return;
        }
        
        // 优先级2：自己基地受到攻击，呼叫队友支援
        if (selfUnderAttack) {
            this.executeDefendSelfWithTeamSupport(aiPlayer, teamMate, enemies);
            return;
        }
        
        // 优先级3：队友基地血量危险
        if (teamMateBaseHealth < 0.3) {
            this.executeDefendTeamMate(aiPlayer, teamMate);
            return;
        }
        
        // 优先级4：自己基地血量危险
        if (aiBaseHealth < 0.4) {
            this.executeDefendSelf(aiPlayer, teamMate);
            return;
        }
        
        // 优先级5：协同进攻
        if (humanPlayer) {
            this.executeCooperateWithHuman(aiPlayer, humanPlayer, enemies, difficulty);
        } else {
            this.executeAITeamwork(aiPlayer, teamMate, enemies, difficulty);
        }
    }
    
    // 检查基地是否正在受到攻击
    isBaseUnderAttack(player) {
        const basePosition = player.base;
        const attackRange = 300; // 攻击范围
        
        // 检查是否有敌方无人机在基地附近
        for (let otherPlayer of this.players) {
            if (otherPlayer.team !== player.team) {
                for (let drone of otherPlayer.drones) {
                    if (drone.health > 0) {
                        const distance = Math.sqrt(
                            (drone.x - basePosition.x) ** 2 + 
                            (drone.y - basePosition.y) ** 2
                        );
                        if (distance < attackRange) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }
    
    // 紧急防御：队友基地受攻击
    executeEmergencyDefense(aiPlayer, teamMate, enemies) {
        // 找到攻击队友基地的敌人
        const attackers = [];
        const basePosition = teamMate.base;
        
        for (let enemy of enemies) {
            if (enemy.health > 0) {
                const distance = Math.sqrt(
                    (enemy.x - basePosition.x) ** 2 + 
                    (enemy.y - basePosition.y) ** 2
                );
                if (distance < 300) {
                    attackers.push(enemy);
                }
            }
        }
        
        if (attackers.length > 0) {
            // 选择最近的攻击者作为目标
            const closestAttacker = attackers.reduce((closest, current) => {
                const distToCurrent = Math.sqrt(
                    (current.x - aiPlayer.base.x) ** 2 + 
                    (current.y - aiPlayer.base.y) ** 2
                );
                const distToClosest = Math.sqrt(
                    (closest.x - aiPlayer.base.x) ** 2 + 
                    (closest.y - aiPlayer.base.y) ** 2
                );
                return distToCurrent < distToClosest ? current : closest;
            });
            
            aiPlayer.rallyPoint = { x: closestAttacker.x, y: closestAttacker.y };
            console.log(`AI ${aiPlayer.id} 紧急支援队友 ${teamMate.id}，攻击入侵者`);
        } else {
            // 没有找到具体攻击者，移动到队友基地附近防守
            this.executeDefendTeamMate(aiPlayer, teamMate);
        }
    }
    
    // 防守自己并请求队友支援
    executeDefendSelfWithTeamSupport(aiPlayer, teamMate, enemies) {
        // 在自己基地附近防守
        const angle = Math.random() * Math.PI * 2;
        const radius = 80 + Math.random() * 40;
        aiPlayer.rallyPoint = {
            x: aiPlayer.base.x + Math.cos(angle) * radius,
            y: aiPlayer.base.y + Math.sin(angle) * radius
        };
        
        // 如果队友是AI，让队友也来支援
        if (!teamMate.isHuman && teamMate.base.health > 0) {
            const supportAngle = angle + Math.PI; // 相对位置
            const supportRadius = 120;
            teamMate.rallyPoint = {
                x: aiPlayer.base.x + Math.cos(supportAngle) * supportRadius,
                y: aiPlayer.base.y + Math.sin(supportAngle) * supportRadius
            };
            console.log(`AI ${teamMate.id} 支援队友 ${aiPlayer.id} 防守`);
        }
        
        console.log(`AI ${aiPlayer.id} 防守基地，请求队友支援`);
    }
    
    // 保护队友
    executeDefendTeamMate(aiPlayer, teamMate) {
        // 移动到队友基地附近进行防守
        const angle = Math.random() * Math.PI * 2;
        const radius = 100 + Math.random() * 50;
        aiPlayer.rallyPoint = {
            x: teamMate.base.x + Math.cos(angle) * radius,
            y: teamMate.base.y + Math.sin(angle) * radius
        };
        console.log(`AI ${aiPlayer.id} 正在保护队友 ${teamMate.id}`);
    }
    
    // 防守自己但考虑队友支援
    executeDefendSelf(aiPlayer, teamMate) {
        // 在自己基地和队友之间选择防守位置
        const midX = (aiPlayer.base.x + teamMate.base.x) / 2;
        const midY = (aiPlayer.base.y + teamMate.base.y) / 2;
        
        aiPlayer.rallyPoint = {
            x: midX + (Math.random() - 0.5) * 100,
            y: midY + (Math.random() - 0.5) * 100
        };
        console.log(`AI ${aiPlayer.id} 防守中，等待队友支援`);
    }
    
    // 与人类玩家协同 - 增强版
    executeCooperateWithHuman(aiPlayer, humanPlayer, enemies, difficulty) {
        // 分析人类玩家的意图
        const humanRally = humanPlayer.rallyPoint;
        const humanDroneCount = humanPlayer.drones.length;
        const aiDroneCount = aiPlayer.drones.length;
        
        // 如果人类玩家有明确的集结点
        if (humanRally) {
            const distanceToHumanRally = Math.sqrt(
                (humanRally.x - aiPlayer.base.x) ** 2 + 
                (humanRally.y - aiPlayer.base.y) ** 2
            );
            
            // 判断人类是否在进攻
            const isHumanAttacking = enemies.some(enemy => {
                if (enemy.health <= 0) return false;
                const distToEnemy = Math.sqrt(
                    (humanRally.x - enemy.x) ** 2 + 
                    (humanRally.y - enemy.y) ** 2
                );
                return distToEnemy < 200;
            });
            
            if (isHumanAttacking) {
                // 协同进攻：选择侧翼或支援位置
                this.executeSupportAttack(aiPlayer, humanRally, enemies);
            } else if (distanceToHumanRally < 300) {
                // 人类在附近，提供支援
                this.executeCloseSupport(aiPlayer, humanRally);
            } else {
                // 人类在远处，执行独立巡逻或收集资源
                this.executeIndependentAction(aiPlayer, enemies);
            }
        } else {
            // 人类没有明确集结点，AI主动寻找目标
            this.executeProactiveAttack(aiPlayer, enemies);
        }
    }
    
    // 支援攻击
    executeSupportAttack(aiPlayer, humanRally, enemies) {
        // 找到人类攻击的目标
        let targetEnemy = null;
        let minDistance = Infinity;
        
        for (let enemy of enemies) {
            if (enemy.health <= 0) continue;
            const distToRally = Math.sqrt(
                (humanRally.x - enemy.x) ** 2 + 
                (humanRally.y - enemy.y) ** 2
            );
            if (distToRally < minDistance) {
                minDistance = distToRally;
                targetEnemy = enemy;
            }
        }
        
        if (targetEnemy) {
            // 选择侧翼攻击位置
            const angle = Math.atan2(targetEnemy.y - humanRally.y, targetEnemy.x - humanRally.x);
            const flankAngle = angle + Math.PI / 2; // 90度侧翼
            const flankDistance = 100;
            
            aiPlayer.rallyPoint = {
                x: targetEnemy.x + Math.cos(flankAngle) * flankDistance,
                y: targetEnemy.y + Math.sin(flankAngle) * flankDistance
            };
            console.log(`AI ${aiPlayer.id} 侧翼支援人类玩家攻击`);
        } else {
            // 没有找到目标，直接支援人类位置
            this.executeCloseSupport(aiPlayer, humanRally);
        }
    }
    
    // 近距离支援
    executeCloseSupport(aiPlayer, humanRally) {
        // 在人类集结点附近选择支援位置
        const angle = Math.random() * Math.PI * 2;
        const radius = 80 + Math.random() * 40;
        
        aiPlayer.rallyPoint = {
            x: humanRally.x + Math.cos(angle) * radius,
            y: humanRally.y + Math.sin(angle) * radius
        };
        console.log(`AI ${aiPlayer.id} 近距离支援人类玩家`);
    }
    
    // 独立行动
    executeIndependentAction(aiPlayer, enemies) {
        // 寻找最近的敌人或资源
        if (Math.random() < 0.7) {
            // 70%概率攻击敌人
            this.executeProactiveAttack(aiPlayer, enemies);
        } else {
            // 30%概率收集资源
            this.executeResourceGathering(aiPlayer);
        }
    }
    
    // 支援攻击
    executeSupportAttack(aiPlayer, humanRally, enemies) {
        // 找到最近的敌人
        let closestEnemy = null;
        let closestDistance = Infinity;
        
        for (const enemy of enemies) {
            const distance = Math.sqrt(
                (humanRally.x - enemy.x) ** 2 + 
                (humanRally.y - enemy.y) ** 2
            );
            if (distance < closestDistance) {
                closestDistance = distance;
                closestEnemy = enemy;
            }
        }
        
        if (closestEnemy) {
            // 选择侧翼攻击位置
            const angle = Math.atan2(closestEnemy.y - humanRally.y, closestEnemy.x - humanRally.x);
            const sideAngle = angle + Math.PI / 2; // 90度侧翼
            const distance = 150;
            
            aiPlayer.rallyPoint = {
                x: closestEnemy.x + Math.cos(sideAngle) * distance,
                y: closestEnemy.y + Math.sin(sideAngle) * distance
            };
            console.log(`AI ${aiPlayer.id} 执行侧翼攻击支援`);
        }
    }
    
    // 近距离支援
    executeCloseSupport(aiPlayer, humanRally) {
        // 在人类集结点附近选择支援位置
        const angle = Math.random() * Math.PI * 2;
        const radius = 80 + Math.random() * 40;
        
        aiPlayer.rallyPoint = {
            x: humanRally.x + Math.cos(angle) * radius,
            y: humanRally.y + Math.sin(angle) * radius
        };
        console.log(`AI ${aiPlayer.id} 提供近距离支援`);
    }
    
    // 独立任务
    executeIndependentTask(aiPlayer, enemies) {
        // 寻找落单的敌人或资源
        if (this.debris.length > 0 && Math.random() < 0.4) {
            const debris = this.debris[Math.floor(Math.random() * this.debris.length)];
            aiPlayer.rallyPoint = this.ensureRallyPointInSafeArea(debris.x, debris.y);
            console.log(`AI ${aiPlayer.id} 执行资源收集任务`);
        } else {
            // 寻找落单的敌方无人机
            const isolatedEnemy = this.findIsolatedEnemy(enemies);
            if (isolatedEnemy) {
                aiPlayer.rallyPoint = this.ensureRallyPointInSafeArea(isolatedEnemy.x, isolatedEnemy.y);
                console.log(`AI ${aiPlayer.id} 攻击落单敌人`);
            }
        }
    }
    
    // 主动进攻
    executeProactiveAttack(aiPlayer, enemies) {
        // 选择优先目标：无人机 > 基地（只选择血量大于0的目标）
        const enemyDrones = enemies.filter(e => e.health > 0 && e.size < 30); // 血量大于0的无人机
        const enemyBases = enemies.filter(e => e.health > 0 && e.size >= 30); // 血量大于0的基地
        
        let target = null;
        if (enemyDrones.length > 0) {
            target = enemyDrones[Math.floor(Math.random() * enemyDrones.length)];
        } else if (enemyBases.length > 0) {
            target = enemyBases[0];
        }
        
        if (target) {
            aiPlayer.rallyPoint = { x: target.x, y: target.y };
            console.log(`AI ${aiPlayer.id} 主动进攻`);
        }
    }
    
    // 资源收集
    executeResourceGathering(aiPlayer) {
        if (this.debris.length > 0) {
            const debris = this.debris[Math.floor(Math.random() * this.debris.length)];
            aiPlayer.rallyPoint = { x: debris.x, y: debris.y };
            console.log(`AI ${aiPlayer.id} 收集资源`);
        } else {
            // 没有资源时进行防守巡逻
            const angle = Math.random() * Math.PI * 2;
            const radius = 200;
            aiPlayer.rallyPoint = {
                x: aiPlayer.base.x + Math.cos(angle) * radius,
                y: aiPlayer.base.y + Math.sin(angle) * radius
            };
        }
    }
    
    // AI之间的协同（两个AI队友）- 增强版
    executeAITeamwork(aiPlayer, aiTeamMate, enemies, difficulty) {
        const aiPlayerHealth = aiPlayer.base.health / aiPlayer.base.maxHealth;
        const aiTeamMateHealth = aiTeamMate.base.health / aiTeamMate.base.maxHealth;
        const aiPlayerDrones = aiPlayer.drones.filter(d => d.health > 0).length;
        const aiTeamMateDrones = aiTeamMate.drones.filter(d => d.health > 0).length;
        
        // 检查是否有队友正在受到攻击
        const teamMateUnderAttack = this.isBaseUnderAttack(aiTeamMate);
        
        if (teamMateUnderAttack) {
            // 队友受攻击，立即支援
            this.executeEmergencyDefense(aiPlayer, aiTeamMate, enemies);
            return;
        }
        
        // 智能分工策略
        const totalEnemyDrones = enemies.filter(e => e.health > 0 && e.size < 30).length;
        const totalEnemyBases = enemies.filter(e => e.health > 0 && e.size >= 30).length;
        
        // 根据实力对比决定策略
        const ourTotalDrones = aiPlayerDrones + aiTeamMateDrones;
        const shouldCoordinate = ourTotalDrones >= totalEnemyDrones * 0.8; // 实力相当时协同
        
        if (shouldCoordinate && totalEnemyBases > 0) {
            // 协同攻击：一个攻击基地，一个清理无人机
            if (aiPlayerDrones >= aiTeamMateDrones) {
                // 实力强的攻击基地
                this.executeCoordinatedBaseAttack(aiPlayer, enemies);
                // 让队友清理无人机或收集资源
                if (totalEnemyDrones > 0) {
                    this.executeCoordinatedDroneHunt(aiTeamMate, enemies);
                } else {
                    this.executeResourceGathering(aiTeamMate);
                }
            } else {
                // 队友实力强，让队友攻击基地
                this.executeCoordinatedBaseAttack(aiTeamMate, enemies);
                // 自己清理无人机或收集资源
                if (totalEnemyDrones > 0) {
                    this.executeCoordinatedDroneHunt(aiPlayer, enemies);
                } else {
                    this.executeResourceGathering(aiPlayer);
                }
            }
        } else {
            // 实力不足时，采用保守策略
            if (aiPlayerHealth < 0.6 || aiTeamMateHealth < 0.6) {
                // 有基地受损，采用防守反击
                this.executeDefensiveCounterAttack(aiPlayer, aiTeamMate, enemies);
            } else {
                // 基地健康，分工合作
                const shouldAttack = aiPlayer.id % 2 === 0;
                if (shouldAttack) {
                    this.executeProactiveAttack(aiPlayer, enemies);
                } else {
                    this.executeResourceGathering(aiPlayer);
                }
            }
        }
    }
    
    // 协同攻击敌方基地
    executeCoordinatedBaseAttack(aiPlayer, enemies) {
        const enemyBases = enemies.filter(e => e.health > 0 && e.size >= 30);
        if (enemyBases.length > 0) {
            // 选择血量最低的基地作为目标
            const targetBase = enemyBases.reduce((weakest, current) => 
                current.health < weakest.health ? current : weakest
            );
            
            aiPlayer.rallyPoint = { x: targetBase.x, y: targetBase.y };
            console.log(`AI ${aiPlayer.id} 协同攻击敌方基地`);
        }
    }
    
    // 协同清理敌方无人机
    executeCoordinatedDroneHunt(aiPlayer, enemies) {
        const enemyDrones = enemies.filter(e => e.health > 0 && e.size < 30);
        if (enemyDrones.length > 0) {
            // 选择最近的敌方无人机
            let closestDrone = null;
            let minDistance = Infinity;
            
            for (let drone of enemyDrones) {
                const distance = Math.sqrt(
                    (drone.x - aiPlayer.base.x) ** 2 + 
                    (drone.y - aiPlayer.base.y) ** 2
                );
                if (distance < minDistance) {
                    minDistance = distance;
                    closestDrone = drone;
                }
            }
            
            if (closestDrone) {
                aiPlayer.rallyPoint = { x: closestDrone.x, y: closestDrone.y };
                console.log(`AI ${aiPlayer.id} 协同清理敌方无人机`);
            }
        }
    }
    
    // 防守反击
    executeDefensiveCounterAttack(aiPlayer, aiTeamMate, enemies) {
        // 两个AI在各自基地之间建立防线
        const midX = (aiPlayer.base.x + aiTeamMate.base.x) / 2;
        const midY = (aiPlayer.base.y + aiTeamMate.base.y) / 2;
        
        // 在防线上选择不同的防守位置
        const angle = Math.atan2(aiTeamMate.base.y - aiPlayer.base.y, aiTeamMate.base.x - aiPlayer.base.x);
        const perpAngle = angle + Math.PI / 2;
        const offset = (aiPlayer.id % 2 === 0 ? 1 : -1) * 80;
        
        aiPlayer.rallyPoint = {
            x: midX + Math.cos(perpAngle) * offset,
            y: midY + Math.sin(perpAngle) * offset
        };
        
        console.log(`AI ${aiPlayer.id} 建立防守阵线`);
    }
    
    // 寻找落单的敌人
    findIsolatedEnemy(enemies) {
        for (const enemy of enemies) {
            if (enemy.size < 30) { // 只考虑无人机
                // 检查这个敌人附近是否有其他敌人
                const nearbyEnemies = enemies.filter(other => {
                    if (other === enemy) return false;
                    const distance = Math.sqrt(
                        (enemy.x - other.x) ** 2 + 
                        (enemy.y - other.y) ** 2
                    );
                    return distance < 150;
                });
                
                if (nearbyEnemies.length === 0) {
                    return enemy; // 找到落单的敌人
                }
            }
        }
        return null;
    }
    
    // 简单AI决策 - 被动防御
    makeSimpleAIDecision(player, difficulty, baseHealthPercent) {
        // 被动防御：只在基地附近防守，不主动出击
        if (baseHealthPercent < difficulty.retreatThreshold) {
            // 血量低时更靠近基地
            player.rallyPoint = {
                x: player.base.x + (Math.random() - 0.5) * 80,
                y: player.base.y + (Math.random() - 0.5) * 80
            };
        } else {
            // 正常情况下在基地周围小范围防守
            const angle = Math.random() * Math.PI * 2;
            const radius = 100 + Math.random() * 50; // 小范围防守
            player.rallyPoint = {
                x: player.base.x + Math.cos(angle) * radius,
                y: player.base.y + Math.sin(angle) * radius
            };
        }
    }
    
    // 中等AI决策 - 偶尔主动进攻
    makeMediumAIDecision(player, difficulty, enemies, baseHealthPercent, humanPlayer) {
        if (baseHealthPercent < difficulty.retreatThreshold) {
            // 血量低时撤退防守
            player.rallyPoint = {
                x: player.base.x + (Math.random() - 0.5) * 80,
                y: player.base.y + (Math.random() - 0.5) * 80
            };
        } else {
            // 偶尔主动进攻策略 - 30%概率主动出击
            if (Math.random() < 0.3 && humanPlayer && player.drones.length > humanPlayer.drones.length * 0.8) {
                // 兵力优势时主动进攻
                const target = enemies[Math.floor(Math.random() * enemies.length)];
                player.rallyPoint = { x: target.x, y: target.y };
                console.log(`中等AI ${player.id} 偶尔主动进攻`);
            } else if (this.debris.length > 0 && Math.random() < 0.4) {
                // 40%概率收集资源
                const debris = this.debris[Math.floor(Math.random() * this.debris.length)];
                player.rallyPoint = { x: debris.x, y: debris.y };
            } else {
                // 其余时间防守巡逻
                const angle = Math.random() * Math.PI * 2;
                const radius = difficulty.attackRange * 0.6; // 中等范围巡逻
                player.rallyPoint = {
                    x: player.base.x + Math.cos(angle) * radius,
                    y: player.base.y + Math.sin(angle) * radius
                };
            }
        }
    }
    
    // 困难AI决策 - 大幅增强版
    makeHardAIDecision(player, difficulty, enemies, baseHealthPercent, humanPlayer) {
        // 困难AI的多重战术策略
        
        // 1. 预测性攻击 - 预判玩家移动
        if (difficulty.predictive && humanPlayer && humanPlayer.rallyPoint) {
            const predictedPosition = this.predictEnemyMovement(humanPlayer);
            if (predictedPosition && Math.random() < 0.6) {
                // 60%概率使用预测性攻击
                player.rallyPoint = predictedPosition;
                console.log(`困难AI ${player.id} 使用预测性攻击`);
                return;
            }
        }
        
        // 2. 多目标同时攻击策略
        if (difficulty.multiTarget && enemies.length > 1 && Math.random() < 0.4) {
            const targetGroups = this.divideEnemiesIntoGroups(enemies);
            if (targetGroups.length > 1) {
                // 选择威胁最大的目标群
                const primaryTarget = this.selectPrimaryTargetGroup(targetGroups, player);
                player.rallyPoint = primaryTarget;
                console.log(`困难AI ${player.id} 使用多目标攻击策略`);
                return;
            }
        }
        
        // 3. 侧翼包抄战术
        if (difficulty.flanking && humanPlayer && Math.random() < 0.5) {
            const flankingPosition = this.calculateFlankingPosition(player, humanPlayer, enemies);
            if (flankingPosition) {
                player.rallyPoint = flankingPosition;
                console.log(`困难AI ${player.id} 使用侧翼包抄战术`);
                return;
            }
        }
        
        // 4. 动态撤退阈值（更激进）
        if (baseHealthPercent < difficulty.retreatThreshold) {
            // 困难AI即使在低血量时也会尝试反击
            if (Math.random() < 0.3) { // 30%概率反击而不是撤退
                const counterAttackPosition = this.calculateCounterAttackPosition(player, humanPlayer);
                player.rallyPoint = counterAttackPosition;
                console.log(`困难AI ${player.id} 低血量反击`);
                return;
            } else {
                // 战术撤退到更有利位置
                const tacticalRetreatPosition = this.calculateTacticalRetreat(player, humanPlayer, enemies);
                player.rallyPoint = tacticalRetreatPosition;
                return;
            }
        }
        
        // 5. 高级战术拉扯
        if (difficulty.tactical && Math.random() < 0.6) { // 提高到60%概率
            const tacticalPosition = this.calculateAdvancedTacticalPosition(player, humanPlayer, enemies);
            player.rallyPoint = tacticalPosition;
            console.log(`困难AI ${player.id} 使用高级战术拉扯`);
            return;
        }
        
        // 6. 默认激进攻击
        let closestEnemy = null;
        let closestDistance = Infinity;
        
        for (const enemy of enemies) {
            const distance = Math.sqrt((player.base.x - enemy.x) ** 2 + (player.base.y - enemy.y) ** 2);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestEnemy = enemy;
            }
        }
        
        if (closestEnemy) {
            // 困难AI会更激进地接近目标
            const aggressiveOffset = 50; // 更接近目标
            const angle = Math.atan2(closestEnemy.y - player.base.y, closestEnemy.x - player.base.x);
            player.rallyPoint = {
                x: closestEnemy.x - Math.cos(angle) * aggressiveOffset,
                y: closestEnemy.y - Math.sin(angle) * aggressiveOffset
            };
        }
    }
    
    // 预测敌方移动
    predictEnemyMovement(humanPlayer) {
        if (!humanPlayer.rallyPoint) return null;
        
        const currentTime = Date.now();
        const timeDiff = currentTime - (humanPlayer.lastRallyTime || currentTime);
        
        // 基于玩家历史移动模式预测下一步
        const dx = humanPlayer.rallyPoint.x - humanPlayer.base.x;
        const dy = humanPlayer.rallyPoint.y - humanPlayer.base.y;
        
        // 预测玩家会继续朝同一方向移动
        return {
            x: humanPlayer.rallyPoint.x + dx * 0.3,
            y: humanPlayer.rallyPoint.y + dy * 0.3
        };
    }
    
    // 将敌人分组用于多目标攻击
    divideEnemiesIntoGroups(enemies) {
        const groups = [];
        const groupRadius = 150;
        
        for (const enemy of enemies) {
            let addedToGroup = false;
            
            for (const group of groups) {
                const centerX = group.reduce((sum, e) => sum + e.x, 0) / group.length;
                const centerY = group.reduce((sum, e) => sum + e.y, 0) / group.length;
                const distance = Math.sqrt((enemy.x - centerX) ** 2 + (enemy.y - centerY) ** 2);
                
                if (distance < groupRadius) {
                    group.push(enemy);
                    addedToGroup = true;
                    break;
                }
            }
            
            if (!addedToGroup) {
                groups.push([enemy]);
            }
        }
        
        return groups;
    }
    
    // 选择主要攻击目标群
    selectPrimaryTargetGroup(targetGroups, player) {
        let bestGroup = targetGroups[0];
        let bestScore = 0;
        
        for (const group of targetGroups) {
            const centerX = group.reduce((sum, e) => sum + e.x, 0) / group.length;
            const centerY = group.reduce((sum, e) => sum + e.y, 0) / group.length;
            const distance = Math.sqrt((player.base.x - centerX) ** 2 + (player.base.y - centerY) ** 2);
            
            // 评分：群体大小 - 距离因子
            const score = group.length * 100 - distance * 0.1;
            
            if (score > bestScore) {
                bestScore = score;
                bestGroup = group;
            }
        }
        
        const centerX = bestGroup.reduce((sum, e) => sum + e.x, 0) / bestGroup.length;
        const centerY = bestGroup.reduce((sum, e) => sum + e.y, 0) / bestGroup.length;
        
        return { x: centerX, y: centerY };
    }
    
    // 计算侧翼包抄位置
    calculateFlankingPosition(player, humanPlayer, enemies) {
        const angle = Math.atan2(humanPlayer.base.y - player.base.y, humanPlayer.base.x - player.base.x);
        
        // 选择左侧或右侧包抄
        const flankAngle = angle + (Math.random() < 0.5 ? Math.PI / 2 : -Math.PI / 2);
        const distance = 200 + Math.random() * 100;
        
        return {
            x: humanPlayer.base.x + Math.cos(flankAngle) * distance,
            y: humanPlayer.base.y + Math.sin(flankAngle) * distance
        };
    }
    
    // 计算反击位置
    calculateCounterAttackPosition(player, humanPlayer) {
        const angle = Math.atan2(humanPlayer.base.y - player.base.y, humanPlayer.base.x - player.base.x);
        const distance = 150;
        
        return {
            x: humanPlayer.base.x - Math.cos(angle) * distance,
            y: humanPlayer.base.y - Math.sin(angle) * distance
        };
    }
    
    // 计算战术撤退位置
    calculateTacticalRetreat(player, humanPlayer, enemies) {
        const retreatAngle = Math.atan2(player.base.y - humanPlayer.base.y, player.base.x - humanPlayer.base.x);
        
        // 撤退到一个可以重新组织攻击的位置
        return {
            x: player.base.x + Math.cos(retreatAngle) * 200,
            y: player.base.y + Math.sin(retreatAngle) * 200
        };
    }
    
    // 计算高级战术位置
    calculateAdvancedTacticalPosition(player, humanPlayer, enemies) {
        const angle = Math.atan2(humanPlayer.base.y - player.base.y, humanPlayer.base.x - player.base.x);
        
        // 使用更复杂的战术机动
        const tacticalAngles = [
            angle + Math.PI / 4,    // 右前方
            angle - Math.PI / 4,    // 左前方
            angle + Math.PI / 2,    // 右侧
            angle - Math.PI / 2,    // 左侧
        ];
        
        const chosenAngle = tacticalAngles[Math.floor(Math.random() * tacticalAngles.length)];
        const distance = 180 + Math.random() * 120;
        
        return {
            x: humanPlayer.base.x + Math.cos(chosenAngle) * distance,
            y: humanPlayer.base.y + Math.sin(chosenAngle) * distance
        };
    }
    
    // AI 升级处理
    handleAIUpgrade(player, difficulty) {
        const resourcesToUse = Math.floor(player.resources * difficulty.upgradeRatio);
        if (resourcesToUse <= 0) return;
        
        // 智能升级优先级
        const upgradePriorities = this.getAIUpgradePriorities(player, difficulty);
        
        let totalResourcesUsed = 0;
        
        while (totalResourcesUsed < resourcesToUse && player.resources > 0) {
            let upgraded = false;
            
            for (const upgrade of upgradePriorities) {
                if (player.upgrades[upgrade] < 10) {
                    // 计算升级所需资源
                    const requiredResources = this.getUpgradeCost(upgrade, player.upgrades[upgrade]);
                    
                    // 检查是否有足够资源且不超过预算
                    if (player.resources >= requiredResources && 
                        totalResourcesUsed + requiredResources <= resourcesToUse) {
                        
                        // 执行升级
                        player.resources -= requiredResources;
                        totalResourcesUsed += requiredResources;
                        player.upgrades[upgrade]++;
                        
                        if (upgrade === 'baseHealth') {
                            const currentLevel = player.upgrades[upgrade];
                            const increment = currentLevel <= 4 ? 100 : 50;
                            player.base.maxHealth += increment;
                            player.base.health += increment;
                        }
                        
                        upgraded = true;
                        break;
                    }
                }
            }
            
            if (!upgraded) break; // 没有可升级的项目或资源不足
        }
    }
    
    // 获取 AI 升级优先级
    getAIUpgradePriorities(player, difficulty) {
        const baseHealthPercent = player.base.health / player.base.maxHealth;
        
        if (difficulty.name === '简单') {
            // 简单 AI 不升级
            return [];
        } else if (difficulty.name === '中等') {
            // 中等 AI：平衡升级，优先防御
            if (baseHealthPercent < 0.5) {
                return ['baseHealth', 'health', 'attack', 'moveSpeed', 'attackSpeed'];
            } else {
                return ['health', 'attack', 'baseHealth', 'moveSpeed', 'attackSpeed'];
            }
        } else {
            // 困难 AI：激进升级，优先攻击
            if (baseHealthPercent < 0.3) {
                return ['baseHealth', 'attack', 'attackSpeed', 'health', 'moveSpeed'];
            } else {
                return ['attack', 'attackSpeed', 'moveSpeed', 'health', 'baseHealth'];
            }
        }
    }
    
    // AI主动资源收集策略
    handleAIResourceCollection(player, difficulty) {
        if (this.debris.length === 0) return;
        
        // 寻找最近且价值最高的资源
        let bestResource = null;
        let bestScore = 0;
        
        for (const debris of this.debris) {
            const distance = Math.sqrt((player.base.x - debris.x) ** 2 + (player.base.y - debris.y) ** 2);
            const score = debris.points * 100 - distance * 0.1; // 价值 - 距离成本
            
            if (score > bestScore) {
                bestScore = score;
                bestResource = debris;
            }
        }
        
        // 如果找到有价值的资源且当前没有紧急战斗
        if (bestResource && !player.underAttack) {
            // 派遣部分无人机去收集资源
            const resourceCollectors = Math.min(5, Math.floor(player.drones.length * 0.3));
            let collectorCount = 0;
            
            for (const drone of player.drones) {
                if (collectorCount >= resourceCollectors) break;
                
                // 选择距离资源较近的无人机
                const droneDistance = Math.sqrt((drone.x - bestResource.x) ** 2 + (drone.y - bestResource.y) ** 2);
                if (droneDistance < 300) { // 300像素范围内的无人机
                    drone.setPlayerTarget(bestResource);
                    collectorCount++;
                }
            }
            
            if (collectorCount > 0) {
                console.log(`困难AI ${player.id} 派遣 ${collectorCount} 架无人机收集资源`);
            }
        }
    }
    
    checkGameEnd() {
        const aliveTeams = new Set();
        
        // 检查每个团队是否还有基地存活
        this.players.forEach(player => {
            const hasAliveBase = player.base.health > 0;
            
            if (this.gameMode === '2v2') {
                // 2v2模式：只基于基地存活判断，团队所有基地被摧毁即失败
                if (hasAliveBase) {
                    aliveTeams.add(player.team);
                }
            } else {
                // 1v1和混战模式：只基于基地存活判断
                if (hasAliveBase) {
                    aliveTeams.add(player.team);
                }
            }
        });
        
        if (aliveTeams.size <= 1) {
            this.gameState = 'gameOver';
            
            // 确定获胜者
            if (aliveTeams.size === 1) {
                const winningTeam = Array.from(aliveTeams)[0];
                const winner = this.players.find(p => p.team === winningTeam);
                this.winner = winner.isHuman ? 'player' : 'ai';
                
                // 给获胜者奖励资源
                if (winner.isHuman) {
                    winner.resources += 10;
                }
            } else {
                this.winner = 'draw';
            }
        }
    }
    
    getDistance(obj1, obj2) {
        const dx = obj1.x - obj2.x;
        const dy = obj1.y - obj2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    // 渲染游戏背景图片
    renderGameBackground() {
        if (this.gameBackgroundLoaded) {
            // 全屏化处理，保持图片宽高比
            const canvasRatio = this.canvas.width / this.canvas.height;
            const imageRatio = this.gameBackground.width / this.gameBackground.height;
            
            let drawWidth, drawHeight, drawX, drawY;
            
            if (canvasRatio > imageRatio) {
                // 画布更宽，以宽度为准填满，图片可能上下裁剪
                drawWidth = this.canvas.width;
                drawHeight = this.canvas.width / imageRatio;
                drawX = 0;
                drawY = (this.canvas.height - drawHeight) / 2;
            } else {
                // 画布更高，以高度为准填满，图片可能左右裁剪
                drawHeight = this.canvas.height;
                drawWidth = this.canvas.height * imageRatio;
                drawX = (this.canvas.width - drawWidth) / 2;
                drawY = 0;
            }
            
            // 使用cover模式：确保图片完全覆盖画布，可能会裁剪部分内容
            this.ctx.save();
            
            // 裁剪到画布区域
            this.ctx.beginPath();
            this.ctx.rect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.clip();
            
            // 绘制背景图片
            this.ctx.drawImage(this.gameBackground, drawX, drawY, drawWidth, drawHeight);
            
            this.ctx.restore();
        } else {
            // 背景图片未加载时使用深色背景
            this.ctx.fillStyle = '#000011';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
    
    // 增强的无人机渲染
    renderEnhancedDrone(drone, color) {
        const ctx = this.ctx;
        
        // 绘制无人机主体
        ctx.fillStyle = color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        
        // 添加发光效果
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        
        ctx.beginPath();
        ctx.arc(drone.x, drone.y, drone.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // 清除阴影
        ctx.shadowBlur = 0;
        
        // 绘制方向指示器（机头朝向）
        this.renderDroneDirection(drone, color);
        
        // 绘制无人机内部细节
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(drone.x, drone.y, drone.size * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制护盾效果（如果在无敌时间内）
        if (drone.invulnerable) {
            this.renderShieldEffect(drone, color);
        }
    }
    
    
    // 渲染护盾效果
    renderShieldEffect(drone, color) {
        const ctx = this.ctx;
        const time = Date.now() * 0.003;
        
        // 计算护盾透明度（根据剩余无敌时间）
        const remainingTime = drone.invulnerableTime - (Date.now() - drone.birthTime);
        const timeRatio = remainingTime / drone.invulnerableTime;
        const baseAlpha = 0.3 + timeRatio * 0.4; // 0.3-0.7的透明度
        
        // 护盾闪烁效果
        const pulseAlpha = baseAlpha + Math.sin(time * 8) * 0.2;
        const alpha = Math.max(0.1, Math.min(0.8, pulseAlpha));
        
        // 护盾半径
        const shieldRadius = drone.size + 4 + Math.sin(time * 4) * 2;
        
        // 创建护盾渐变
        const shieldGradient = ctx.createRadialGradient(
            drone.x, drone.y, drone.size,
            drone.x, drone.y, shieldRadius
        );
        shieldGradient.addColorStop(0, 'transparent');
        shieldGradient.addColorStop(0.7, `rgba(0, 255, 255, ${alpha * 0.5})`);
        shieldGradient.addColorStop(1, `rgba(0, 255, 255, ${alpha})`);
        
        // 绘制护盾
        ctx.fillStyle = shieldGradient;
        ctx.beginPath();
        ctx.arc(drone.x, drone.y, shieldRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制护盾边框
        ctx.strokeStyle = `rgba(0, 255, 255, ${alpha * 1.5})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(drone.x, drone.y, shieldRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        // 绘制护盾粒子效果
        for (let i = 0; i < 6; i++) {
            const particleAngle = (time + i * Math.PI / 3) % (Math.PI * 2);
            const particleRadius = shieldRadius - 2;
            const particleX = drone.x + Math.cos(particleAngle) * particleRadius;
            const particleY = drone.y + Math.sin(particleAngle) * particleRadius;
            
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(particleX, particleY, 1, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // 渲染无人机方向指示器
    renderDroneDirection(drone, color) {
        const ctx = this.ctx;
        
        // 计算方向指示器的位置
        const directionLength = drone.size * 0.8; // 指示器长度
        const directionStartDistance = drone.size * 0.6; // 从无人机中心的起始距离
        
        // 计算起始点和结束点
        const startX = drone.x + Math.cos(drone.facing) * directionStartDistance;
        const startY = drone.y + Math.sin(drone.facing) * directionStartDistance;
        const endX = drone.x + Math.cos(drone.facing) * (directionStartDistance + directionLength);
        const endY = drone.y + Math.sin(drone.facing) * (directionStartDistance + directionLength);
        
        // 绘制方向线
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        
        // 绘制箭头（可选，让方向更明显）
        const arrowSize = 3;
        const arrowAngle = 0.5; // 箭头角度
        
        // 左箭头线
        const leftArrowX = endX - Math.cos(drone.facing - arrowAngle) * arrowSize;
        const leftArrowY = endY - Math.sin(drone.facing - arrowAngle) * arrowSize;
        
        // 右箭头线
        const rightArrowX = endX - Math.cos(drone.facing + arrowAngle) * arrowSize;
        const rightArrowY = endY - Math.sin(drone.facing + arrowAngle) * arrowSize;
        
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(leftArrowX, leftArrowY);
        ctx.moveTo(endX, endY);
        ctx.lineTo(rightArrowX, rightArrowY);
        ctx.stroke();
        
        // 重置线条样式
        ctx.lineCap = 'butt';
    }
    
    // 渲染血量条（已移除，保留方法以防需要）
    renderHealthBar(drone) {
        // 血量条已移除，无人机不再显示血量条
        return;
    }
    
    // 渲染目标指示器（已移除，保留方法以防需要）
    renderTargetIndicator(drone) {
        // 目标指示器已移除
        return;
    }
    
    // 增强的投射物渲染
    renderEnhancedProjectile(projectile) {
        const ctx = this.ctx;
        
        // 绘制轨迹
        if (projectile.trail && projectile.trail.length > 1) {
            ctx.strokeStyle = projectile.color + '80'; // 半透明
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            
            ctx.beginPath();
            ctx.moveTo(projectile.trail[0].x, projectile.trail[0].y);
            for (let i = 1; i < projectile.trail.length; i++) {
                ctx.lineTo(projectile.trail[i].x, projectile.trail[i].y);
            }
            ctx.stroke();
        }
        
        // 绘制投射物主体
        const gradient = ctx.createRadialGradient(
            projectile.x, projectile.y, 0,
            projectile.x, projectile.y, projectile.size * 2
        );
        gradient.addColorStop(0, projectile.color);
        gradient.addColorStop(0.7, projectile.color + 'AA');
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, projectile.size * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制核心
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, projectile.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
    }
    
    render() {
        // 绘制游戏背景图片
        this.renderGameBackground();
        
        // 批量绘制，减少状态切换
        
        // 绘制飞船碎片
        for (let i = 0; i < this.debris.length; i++) {
            const debris = this.debris[i];
            const showDetailedInfo = (this.selectedDebris === debris);
            debris.render(this.ctx, showDetailedInfo);
        }
        
        // 绘制基地
        for (let i = 0; i < this.players.length; i++) {
            const player = this.players[i];
            const playerTeam = this.players[0].team; // 玩家的team
            const isPlayerTeam = player.team === playerTeam;
            player.base.render(this.ctx, isPlayerTeam);
        }
        
        // 按颜色分组绘制无人机，减少状态切换
        const dronesByColor = new Map();
        for (let i = 0; i < this.players.length; i++) {
            const player = this.players[i];
            if (!dronesByColor.has(player.color)) {
                dronesByColor.set(player.color, []);
            }
            dronesByColor.get(player.color).push(...player.drones);
        }
        
        // 批量绘制相同颜色的无人机
        dronesByColor.forEach((drones, color) => {
            for (let i = 0; i < drones.length; i++) {
                const drone = drones[i];
                this.renderEnhancedDrone(drone, color);
            }
        });
        
        // 绘制投射物轨迹和特效
        for (let i = 0; i < this.projectiles.length; i++) {
            this.renderEnhancedProjectile(this.projectiles[i]);
        }
        
        // 绘制爆炸效果
        this.explosionManager.render(this.ctx);
        
        // 绘制玩家集结点 - 使用缩放后的尺寸，确保圆形不变形
        const humanPlayer = this.players[0];
        if (humanPlayer && humanPlayer.rallyPoint) {
            // 计算缩放后的集结点大小，确保圆形显示
            const baseRadius = this.scaledValues.droneSize * 1.2; // 稍微减小基础半径
            const rallyRadius = Math.max(8, baseRadius); // 确保最小可见大小
            const rallyAnimRadius = rallyRadius * 1.4; // 减小动画外圆比例
            const rallyLineWidth = Math.max(1, rallyRadius / 6); // 调整线宽比例
            
            // 主集结点圆圈 - 确保圆形
            this.ctx.strokeStyle = humanPlayer.color;
            this.ctx.lineWidth = rallyLineWidth;
            this.ctx.beginPath();
            this.ctx.arc(humanPlayer.rallyPoint.x, humanPlayer.rallyPoint.y, rallyRadius, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // 绘制集结点动画（降低频率）- 确保圆形动画
            if (this.frameCount % 3 === 0) { // 降低动画频率
                const time = Date.now() * 0.003; // 减慢动画速度
                const animationOffset = Math.sin(time) * (rallyRadius * 0.3); // 减小动画幅度
                
                this.ctx.strokeStyle = humanPlayer.color;
                this.ctx.globalAlpha = 0.6; // 添加透明度
                this.ctx.lineWidth = Math.max(0.5, rallyLineWidth * 0.6); // 更细的动画线条
                this.ctx.beginPath();
                this.ctx.arc(humanPlayer.rallyPoint.x, humanPlayer.rallyPoint.y, rallyAnimRadius + animationOffset, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.globalAlpha = 1.0; // 恢复透明度
            }
        }
        
        // 绘制安全边界指示器
        if (this.uiSafeArea) {
            const isMobile = this.canvas.width <= 768;
            
            // 使用与UI面板搭配的颜色和样式
            this.ctx.strokeStyle = 'rgba(100, 200, 255, 0.6)'; // 蓝色半透明，与UI面板颜色搭配
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([8, 4]); // 优雅的虚线样式
            
            if (isMobile) {
                // 移动端：绘制水平边界线（顶部UI区域）
                this.ctx.beginPath();
                this.ctx.moveTo(0, this.uiSafeArea.top);
                this.ctx.lineTo(this.canvas.width, this.uiSafeArea.top);
                this.ctx.stroke();
            } else {
                // 桌面端：绘制垂直边界线（左侧UI区域）
                this.ctx.beginPath();
                this.ctx.moveTo(this.uiSafeArea.left, 0);
                this.ctx.lineTo(this.uiSafeArea.left, this.canvas.height);
                this.ctx.stroke();
            }
            
            // 重置线条样式
            this.ctx.setLineDash([]);
        }
        
        // 显示资源检查提示（仅在有资源时显示）
        if (this.debris.length > 0 && this.gameState === 'playing') {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'left';
            const tipText = '提示：双击资源查看详细属性';
            const tipX = 10;
            const tipY = this.canvas.height - 20;
            
            // 绘制半透明背景
            const textWidth = this.ctx.measureText(tipText).width;
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(tipX - 5, tipY - 15, textWidth + 10, 18);
            
            // 绘制提示文字
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.fillText(tipText, tipX, tipY);
        }
        
        // 绘制游戏结束信息
        if (this.gameState === 'gameOver') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            
            let message = '';
            if (this.winner === 'player') {
                message = '胜利！';
                this.ctx.fillStyle = '#00ff00';
            } else if (this.winner === 'ai') {
                message = '失败！';
                this.ctx.fillStyle = '#ff0000';
            } else {
                message = '平局！';
                this.ctx.fillStyle = '#ffba00';
            }
            
            this.ctx.fillText(message, this.canvas.width / 2, this.canvas.height / 2 - 80);
            
            // 显示游戏统计信息
            const player = this.players[0];
            if (player) {
                const gameTime = Math.floor((Date.now() - this.gameStartTime) / 1000);
                const minutes = Math.floor(gameTime / 60);
                const seconds = gameTime % 60;
                const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                
                this.ctx.fillStyle = '#fff';
                this.ctx.font = '24px Arial';
                this.ctx.fillText(`游戏时间: ${timeStr}`, this.canvas.width / 2, this.canvas.height / 2 - 20);
                this.ctx.fillText(`击杀数: ${player.killCount || 0}`, this.canvas.width / 2, this.canvas.height / 2 + 10);
                this.ctx.fillText(`最终资源: ${player.resources || 0}`, this.canvas.width / 2, this.canvas.height / 2 + 40);
            } else {
                // 如果没有玩家数据，显示默认信息
                this.ctx.fillStyle = '#fff';
                this.ctx.font = '24px Arial';
                this.ctx.fillText(`游戏时间: 00:00`, this.canvas.width / 2, this.canvas.height / 2 - 20);
                this.ctx.fillText(`击杀数: 0`, this.canvas.width / 2, this.canvas.height / 2 + 10);
                this.ctx.fillText(`最终资源: 0`, this.canvas.width / 2, this.canvas.height / 2 + 40);
            }
            
            // 绘制返回按钮
            const buttonWidth = 200;
            const buttonHeight = 50;
            const buttonX = this.canvas.width / 2 - buttonWidth / 2;
            const buttonY = this.canvas.height / 2 + 80;
            
            // 按钮背景
            this.ctx.fillStyle = 'rgba(33, 150, 243, 0.8)';
            this.ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
            
            // 按钮边框
            this.ctx.strokeStyle = '#2196F3';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
            
            // 按钮文字
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '20px Arial';
            this.ctx.fillText('返回开始页面', this.canvas.width / 2, buttonY + 32);
            
            // 存储按钮位置用于点击检测
            this.returnButton = {
                x: buttonX,
                y: buttonY,
                width: buttonWidth,
                height: buttonHeight
            };
        }
    }
    
    // 渲染暂停覆盖层
    renderPauseOverlay() {
        // 半透明黑色覆盖层
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 暂停文字
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('游戏已暂停', this.canvas.width / 2, this.canvas.height / 2 - 20);
        
        // 提示文字
        this.ctx.font = '24px Arial';
        this.ctx.fillStyle = '#ccc';
        this.ctx.fillText('点击继续按钮恢复游戏', this.canvas.width / 2, this.canvas.height / 2 + 30);
    }
    
    updateUI() {
        if (this.gameState !== 'playing') return;
        
        const player = this.players[0];
        
        document.getElementById('resources').textContent = player.resources;
        document.getElementById('droneCount').textContent = player.drones.length;
        document.getElementById('killCount').textContent = player.killCount || 0;
        
        // 更新游戏时间
        const gameTime = Math.floor((Date.now() - this.gameStartTime) / 1000);
        const minutes = Math.floor(gameTime / 60);
        const seconds = gameTime % 60;
        document.getElementById('gameTime').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // 更新升级等级显示
        const upgrades = player.upgrades;
        document.getElementById('attackLevel').textContent = upgrades.attack;
        document.getElementById('speedLevel').textContent = upgrades.attackSpeed;
        document.getElementById('moveSpeedLevel').textContent = upgrades.moveSpeed;
        document.getElementById('healthLevel').textContent = upgrades.health;
        document.getElementById('baseLevel').textContent = upgrades.baseHealth;
        
        // 更新升级按钮状态（根据新的资源消耗规则）
        this.updateUpgradeButtonState('upgradeAttack', 'attack', player);
        this.updateUpgradeButtonState('upgradeSpeed', 'attackSpeed', player);
        this.updateUpgradeButtonState('upgradeMoveSpeed', 'moveSpeed', player);
        this.updateUpgradeButtonState('upgradeHealth', 'health', player);
        this.updateUpgradeButtonState('upgradeBase', 'baseHealth', player);
    }
    
    // 更新单个升级按钮的状态（不显示资源数量）
    updateUpgradeButtonState(buttonId, attribute, player) {
        const button = document.getElementById(buttonId);
        if (!button) return;
        
        const currentLevel = player.upgrades[attribute];
        const maxLevel = 10;
        
        // 检查基地是否已被摧毁（仅在2v2模式下限制升级）
        const baseDestroyed = player.base.health <= 0 && this.gameMode === '2v2';
        
        if (currentLevel >= maxLevel) {
            // 已达到最大等级
            button.disabled = true;
        } else if (baseDestroyed) {
            // 基地被摧毁且在2v2模式下，禁用所有升级
            button.disabled = true;
        } else {
            // 计算升级所需资源
            const requiredResources = this.getUpgradeCost(attribute, currentLevel);
            const hasEnoughResources = player.resources >= requiredResources;
            
            // 更新按钮状态
            button.disabled = !hasEnoughResources;
        }
    }
}

// 基地类
class Base {
    constructor(x, y, playerId, color, scaledValues) {
        this.x = x;
        this.y = y;
        this.playerId = playerId;
        this.color = color;
        this.maxHealth = 1000;
        this.health = 1000;
        this.size = scaledValues ? scaledValues.baseSize : 40; // 使用缩放后的大小
        this.invulnerable = true;
        this.invulnerableTime = 2000; // 2秒无敌时间
        
        setTimeout(() => {
            this.invulnerable = false;
        }, this.invulnerableTime);
    }
    
    takeDamage(damage) {
        if (this.invulnerable) return;
        this.health -= damage;
        if (this.health < 0) this.health = 0;
    }
    
    render(ctx, isPlayerTeam = false) {
        // 绘制基地 - 确保圆形不变形
        ctx.fillStyle = this.color; // 始终使用玩家颜色，不显示无敌状态
        
        // 使用统一半径确保圆形，避免椭圆变形
        const radius = this.size;
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制基地边框 - 使用缩放后的线宽，确保清晰显示
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = Math.max(1, radius / 15); // 稍微增加线宽比例，提高可见性
        ctx.stroke();
        
        // 绘制血量条 - 使用缩放后的尺寸，确保比例协调
        const barWidth = radius * 1.8; // 稍微增加宽度比例
        const barHeight = Math.max(3, radius / 8); // 调整高度比例
        const barX = this.x - barWidth / 2;
        const barY = this.y - radius - barHeight * 2.5; // 调整位置
        
        // 血量条背景
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // 血量条前景 - 根据阵营显示不同颜色
        ctx.fillStyle = isPlayerTeam ? '#00ff00' : '#ff0000'; // 玩家方绿色，敌人红色
        const healthPercent = this.health / this.maxHealth;
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        
        // 血量条边框
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = Math.max(0.5, radius / 40);
        ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        // 显示血量数值 - 使用缩放后的字体，确保可读性
        ctx.fillStyle = '#fff';
        const fontSize = Math.max(6, radius / 4); // 调整字体大小比例
        ctx.font = `${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${Math.ceil(this.health)}/${this.maxHealth}`, this.x, barY - barHeight);
    }
}
// 无人机类
class Drone {
    constructor(x, y, playerId, color, upgrades, scaledValues) {
        this.x = x;
        this.y = y;
        this.playerId = playerId;
        this.color = color;
        this.size = scaledValues.droneSize;
        
        // 基础属性（使用缩放后的数值）
        this.baseAttack = 1;
        this.baseAttackSpeed = 500; // 毫秒
        this.baseMoveSpeed = scaledValues.droneBaseSpeed; // 缩放后的基础移动速度
        this.baseProjectileSpeed = scaledValues.projectileBaseSpeed; // 缩放后的基础子弹速度
        this.baseHealth = 1;
        
        // 缓存缩放数值
        this.scaledValues = scaledValues;
        
        // 应用升级（4级后收益减半）
        this.attack = this.baseAttack + this.calculateUpgradeBonus(upgrades.attack, 0.5);
        this.attackSpeed = this.baseAttackSpeed - this.calculateUpgradeBonus(upgrades.attackSpeed, 10);
        this.moveSpeed = this.baseMoveSpeed + this.calculateUpgradeBonus(upgrades.moveSpeed, scaledValues.droneSpeedUpgrade);
        this.projectileSpeed = this.baseProjectileSpeed + this.calculateUpgradeBonus(upgrades.moveSpeed, scaledValues.projectileSpeedUpgrade);
        this.maxHealth = this.baseHealth + this.calculateUpgradeBonus(upgrades.health, 0.5);
        this.health = this.maxHealth;
        
        // 状态
        this.target = null;
        this.playerTarget = null; // 玩家指定的攻击目标
        this.lastAttackTime = 0;
        this.rallyPoint = null;
        this.hasReachedRally = false;
        
        // Boids算法相关
        this.vx = 0;
        this.vy = 0;
        
        // 稳定状态检测
        this.stableFrames = 0;
        this.lastPosition = { x: x, y: y };
        this.isStable = false;
        
        // 玩家命令响应系统
        this.lastPlayerCommandTime = 0;
        this.playerCommandCooldown = 100; // 100ms内的玩家命令视为最新命令
        this.shouldInterruptAttack = false;
        
        // 无人机朝向系统
        this.facing = 0; // 朝向角度（弧度）
        this.targetFacing = 0; // 目标朝向角度
        this.facingSpeed = 0.1; // 转向速度
        
        // 无敌时间系统
        this.invulnerable = true;
        this.invulnerableTime = 1000; // 1秒无敌时间
        this.birthTime = Date.now();
        
        // 设置无敌时间结束
        setTimeout(() => {
            this.invulnerable = false;
        }, this.invulnerableTime);
    }
    
    // 计算升级加成（4级后减半）
    calculateUpgradeBonus(level, baseBonus) {
        if (level <= 4) {
            return level * baseBonus;
        } else {
            return 4 * baseBonus + (level - 4) * baseBonus * 0.5;
        }
    }
    
    // 设置玩家指定的攻击目标
    setPlayerTarget(target) {
        this.playerTarget = target;
        this.hasReachedRally = false;
    }
    
    // 清除玩家指定的攻击目标
    clearPlayerTarget() {
        this.playerTarget = null;
    }
    
    // 中断当前行动，立即响应玩家指令
    interruptCurrentAction() {
        // 清除自动索敌目标，优先执行玩家指令
        this.target = null;
        // 重置移动状态
        this.hasReachedRally = false;
        // 清除 Boids 速度，避免惯性影响
        this.vx = 0;
        this.vy = 0;
        // 重置稳定状态
        this.stableFrames = 0;
        this.isStable = false;
        // 标记玩家命令时间
        this.lastPlayerCommandTime = Date.now();
    }
    
    update(deltaTime, rallyPoint, enemies, debris) {
        // 更新集结点
        if (rallyPoint && rallyPoint !== this.rallyPoint) {
            this.rallyPoint = rallyPoint;
            this.hasReachedRally = false;
        }
        
        // 寻找目标
        this.findTarget(enemies, debris);
        
        // 移动
        this.move(deltaTime);
        
        // 攻击
        this.attackUpdate(deltaTime);
        
        // 更新朝向
        this.updateFacing(deltaTime);
    }
    
    findTarget(enemies, debris) {
        // 检查无人机是否在移动中
        const isMoving = Math.abs(this.vx) > 0.1 || Math.abs(this.vy) > 0.1;
        
        // 检查是否有最新的玩家集结命令
        const currentTime = Date.now();
        const hasRecentPlayerCommand = (currentTime - this.lastPlayerCommandTime) < this.playerCommandCooldown;
        
        // 如果有最新的集结命令，不要自动寻找新目标
        if (hasRecentPlayerCommand && this.shouldInterruptAttack && this.rallyPoint) {
            this.target = null;
            return;
        }
        
        // 优先级1：玩家指定的目标（如果目标还活着）
        if (this.playerTarget && this.playerTarget.health > 0) {
            // 移动中不锁敌，清除目标
            if (isMoving) {
                this.target = null;
                return;
            }
            this.target = this.playerTarget;
            return;
        } else if (this.playerTarget) {
            // 目标已死亡，清除玩家目标
            this.playerTarget = null;
        }
        
        // 移动中不进行自动索敌，也不保持目标
        if (isMoving) {
            this.target = null;
            return;
        }
        
        // 优先级2：集结点优先级检查
        // 如果有集结点且还没到达，检查是否应该专注集结
        if (this.rallyPoint && !this.hasReachedRally) {
            const shouldFocusOnRally = this.shouldFocusOnRallyPoint();
            if (shouldFocusOnRally) {
                this.target = null; // 清除自动索敌目标，专注集结
                return;
            }
        }
        
        let closestTarget = null;
        let closestDistanceSq = Infinity; // 使用平方距离避免sqrt
        const autoAttackRangeSq = this.scaledValues.droneAutoAttackRange ** 2; // 180px的平方
        
        // 优先级3：自动索敌（180px范围内）
        // 只在以下情况下进行自动索敌：
        // 1. 已经到达集结点
        // 2. 或者被阻挡无法到达集结点
        const canAutoAttack = this.hasReachedRally || 
                             (this.rallyPoint && !this.shouldFocusOnRallyPoint());
        
        if (!canAutoAttack) {
            this.target = null; // 清除自动索敌目标
            return;
        }
        
        // 如果当前有目标且目标还活着，继续追击
        if (this.target && this.target.health > 0) {
            const dx = this.x - this.target.x;
            const dy = this.y - this.target.y;
            const distanceSq = dx * dx + dy * dy;
            // 只要目标还在视野内（180px），就继续追击
            if (distanceSq <= autoAttackRangeSq) {
                return; // 保持当前目标
            }
        }
        
        // 当前目标已死亡或超出范围，重新寻找目标
        this.target = null;
        
        // 优先攻击敌方无人机（更近的威胁）
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];
            // 只攻击血量大于0的无人机
            if (enemy.health > 0 && enemy.size && enemy.size < this.scaledValues.baseSize) { // 这是无人机
                const dx = this.x - enemy.x;
                const dy = this.y - enemy.y;
                const distanceSq = dx * dx + dy * dy;
                if (distanceSq <= autoAttackRangeSq && distanceSq < closestDistanceSq) {
                    closestTarget = enemy;
                    closestDistanceSq = distanceSq;
                }
            }
        }
        
        // 如果没有找到无人机，攻击敌方基地（只攻击血量大于0的基地）
        if (!closestTarget) {
            for (let i = 0; i < enemies.length; i++) {
                const enemy = enemies[i];
                // 只攻击血量大于0的基地
                if (enemy.health > 0 && enemy.size && enemy.size >= this.scaledValues.baseSize) { // 这是基地
                    const dx = this.x - enemy.x;
                    const dy = this.y - enemy.y;
                    const distanceSq = dx * dx + dy * dy;
                    if (distanceSq <= autoAttackRangeSq && distanceSq < closestDistanceSq) {
                        closestTarget = enemy;
                        closestDistanceSq = distanceSq;
                    }
                }
            }
        }
        
        // 移除对资源的自动索敌 - 只有玩家手动选中资源时才攻击
        
        this.target = closestTarget;
    }
    
    move(deltaTime) {
        let targetX, targetY;
        let shouldMove = false;
        
        // 检查是否有最新的玩家命令需要立即响应
        const currentTime = Date.now();
        const hasRecentPlayerCommand = (currentTime - this.lastPlayerCommandTime) < this.playerCommandCooldown;
        
        // 如果有最新的集结命令且当前在攻击，立即中断攻击响应集结
        if (hasRecentPlayerCommand && this.shouldInterruptAttack && this.rallyPoint) {
            // 清除当前攻击目标，优先响应集结
            this.target = null;
            this.shouldInterruptAttack = false;
        }
        
        // 优先级1: 玩家最新集结命令（最高优先级）
        if (hasRecentPlayerCommand && this.rallyPoint && !this.hasReachedRally) {
            const rallyDistance = this.getDistance(this.rallyPoint);
            const arrivalRange = this.calculateDynamicArrivalRange();
            
            if (rallyDistance < arrivalRange) {
                this.hasReachedRally = true;
                shouldMove = false;
                this.vx = 0;
                this.vy = 0;
                console.log(`无人机 ${this.playerId} 响应玩家命令到达集结点，距离: ${Math.round(rallyDistance)}px`);
            } else {
                targetX = this.rallyPoint.x;
                targetY = this.rallyPoint.y;
                shouldMove = true;
            }
        }
        // 优先级2: 如果有玩家指定的目标，追击目标
        else if (this.playerTarget && this.playerTarget.health > 0) {
            const distance = this.getDistance(this.playerTarget);
            const attackBuffer = 15;
            const effectiveRange = this.scaledValues.droneAttackRange - attackBuffer;
            
            if (distance > effectiveRange) {
                targetX = this.playerTarget.x;
                targetY = this.playerTarget.y;
                shouldMove = true;
            }
        }
        // 优先级3: 如果有自动索敌的目标，追击目标
        else if (this.target) {
            const distance = this.getDistance(this.target);
            const attackBuffer = 15;
            const effectiveRange = this.scaledValues.droneAttackRange - attackBuffer;
            
            if (distance > effectiveRange) {
                targetX = this.target.x;
                targetY = this.target.y;
                shouldMove = true;
            }
        }
        // 优先级4: 如果有集结点且还没到达，移动到集结点
        else if (this.rallyPoint && !this.hasReachedRally) {
            const rallyDistance = this.getDistance(this.rallyPoint);
            const arrivalRange = this.calculateDynamicArrivalRange();
            
            if (rallyDistance < arrivalRange) {
                this.hasReachedRally = true;
                shouldMove = false;
                this.vx = 0;
                this.vy = 0;
                console.log(`无人机 ${this.playerId} 到达集结点，距离: ${Math.round(rallyDistance)}px`);
            } else {
                targetX = this.rallyPoint.x;
                targetY = this.rallyPoint.y;
                shouldMove = true;
            }
        }
        
        if (!shouldMove) return;
        
        // 使用改进的路径规划
        this.moveWithPathfinding(targetX, targetY, deltaTime);
        
        // 更新朝向目标（移动时朝向移动方向）
        if (shouldMove && targetX !== undefined && targetY !== undefined) {
            const dx = targetX - this.x;
            const dy = targetY - this.y;
            if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
                this.targetFacing = Math.atan2(dy, dx);
            }
        }
    }
    
    // 改进的路径规划移动方法
    moveWithPathfinding(targetX, targetY, deltaTime) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 增加到达阈值，避免过度精确定位
        const arrivalThreshold = 5;
        if (distance < arrivalThreshold) return;
        
        // 添加减速机制，接近目标时减速
        const slowdownDistance = 30;
        let speedMultiplier = 1.0;
        if (distance < slowdownDistance) {
            speedMultiplier = Math.max(0.3, distance / slowdownDistance);
        }
        
        const moveDistance = this.moveSpeed * speedMultiplier * deltaTime / 16.67;
        let moveX = (dx / distance) * moveDistance;
        let moveY = (dy / distance) * moveDistance;
        
        const newX = this.x + moveX;
        const newY = this.y + moveY;
        
        // 直接路径可行，直接移动
        if (this.canMoveTo(newX, newY)) {
            this.x = newX;
            this.y = newY;
            return;
        }
        
        // 直接路径被阻挡，尝试智能绕行
        const avoidanceVector = this.calculateAvoidanceVector(targetX, targetY);
        
        if (avoidanceVector) {
            // 结合原方向和避障方向
            const avoidWeight = 0.7; // 避障权重
            const targetWeight = 0.3; // 目标方向权重
            
            moveX = moveX * targetWeight + avoidanceVector.x * avoidWeight;
            moveY = moveY * targetWeight + avoidanceVector.y * avoidWeight;
            
            // 归一化并应用移动距离
            const combinedDistance = Math.sqrt(moveX * moveX + moveY * moveY);
            if (combinedDistance > 0) {
                moveX = (moveX / combinedDistance) * moveDistance;
                moveY = (moveY / combinedDistance) * moveDistance;
            }
            
            const avoidX = this.x + moveX;
            const avoidY = this.y + moveY;
            
            if (this.canMoveTo(avoidX, avoidY)) {
                this.x = avoidX;
                this.y = avoidY;
                return;
            }
        }
        
        // 如果避障也失败，尝试沿边缘滑行
        this.slideAlongObstacle(targetX, targetY, moveDistance);
    }
    
    // 计算避障向量
    calculateAvoidanceVector(targetX, targetY) {
        const avoidanceRadius = this.scaledValues.droneCollisionRadius * 4; // 避障检测半径
        let avoidX = 0;
        let avoidY = 0;
        let obstacleCount = 0;
        
        // 检查所有障碍物
        const obstacles = this.getObstacles();
        
        for (const obstacle of obstacles) {
            const dx = this.x - obstacle.x;
            const dy = this.y - obstacle.y;
            const distanceSq = dx * dx + dy * dy;
            const minDistanceSq = (avoidanceRadius + obstacle.radius) ** 2;
            
            if (distanceSq < minDistanceSq && distanceSq > 0) {
                const distance = Math.sqrt(distanceSq);
                const force = (avoidanceRadius + obstacle.radius - distance) / distance;
                
                avoidX += (dx / distance) * force;
                avoidY += (dy / distance) * force;
                obstacleCount++;
            }
        }
        
        if (obstacleCount === 0) return null;
        
        // 归一化避障向量
        const avoidDistance = Math.sqrt(avoidX * avoidX + avoidY * avoidY);
        if (avoidDistance > 0) {
            return {
                x: avoidX / avoidDistance,
                y: avoidY / avoidDistance
            };
        }
        
        return null;
    }
    
    // 获取所有障碍物
    getObstacles() {
        const obstacles = [];
        
        // 添加所有基地作为障碍物
        for (const player of game.players) {
            obstacles.push({
                x: player.base.x,
                y: player.base.y,
                radius: game.scaledValues.baseCollisionRadius
            });
        }
        
        // 添加飞船碎片作为障碍物
        for (const debris of game.debris) {
            obstacles.push({
                x: debris.x,
                y: debris.y,
                radius: debris.size
            });
        }
        
        // 添加其他无人机作为小障碍物（仅限己方，避免过度拥挤）
        for (const player of game.players) {
            if (player.id === this.playerId) {
                for (const drone of player.drones) {
                    if (drone !== this) {
                        obstacles.push({
                            x: drone.x,
                            y: drone.y,
                            radius: this.scaledValues.droneCollisionRadius
                        });
                    }
                }
            }
        }
        
        return obstacles;
    }
    
    // 沿障碍物边缘滑行
    slideAlongObstacle(targetX, targetY, moveDistance) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        
        // 尝试多个角度的移动方向
        const angles = [
            Math.atan2(dy, dx) + Math.PI / 4,  // 右转45度
            Math.atan2(dy, dx) - Math.PI / 4,  // 左转45度
            Math.atan2(dy, dx) + Math.PI / 2,  // 右转90度
            Math.atan2(dy, dx) - Math.PI / 2,  // 左转90度
        ];
        
        for (const angle of angles) {
            const testX = this.x + Math.cos(angle) * moveDistance;
            const testY = this.y + Math.sin(angle) * moveDistance;
            
            if (this.canMoveTo(testX, testY)) {
                this.x = testX;
                this.y = testY;
                return;
            }
        }
        
        // 如果所有方向都被阻挡，尝试小步移动
        const smallStep = moveDistance * 0.3;
        for (const angle of angles) {
            const testX = this.x + Math.cos(angle) * smallStep;
            const testY = this.y + Math.sin(angle) * smallStep;
            
            if (this.canMoveTo(testX, testY)) {
                this.x = testX;
                this.y = testY;
                return;
            }
        }
    }
    
    attackUpdate(deltaTime) {
        if (!this.target) return;
        
        // 检查无人机是否在移动中
        const isMoving = Math.abs(this.vx) > 0.1 || Math.abs(this.vy) > 0.1;
        if (isMoving) {
            // 移动中不能攻击，但保持朝向目标
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            this.targetFacing = Math.atan2(dy, dx);
            return;
        }
        
        // 检查是否有玩家集结命令需要立即响应
        const currentTime = Date.now();
        const hasRecentPlayerCommand = (currentTime - this.lastPlayerCommandTime) < this.playerCommandCooldown;
        
        // 如果有最新的玩家集结命令，在开火后立即中断攻击
        if (hasRecentPlayerCommand && this.shouldInterruptAttack) {
            // 如果刚刚开过火，立即响应集结命令
            if (currentTime - this.lastAttackTime < 50) { // 开火后50ms内立即响应
                this.target = null; // 清除攻击目标
                this.shouldInterruptAttack = false;
                console.log(`无人机 ${this.playerId} 开火后立即响应集结命令`);
                return;
            }
        }
        
        const distance = this.getDistance(this.target);
        if (distance > this.scaledValues.droneAttackRange) return; // 160px攻击范围（20倍体长）
        
        if (currentTime - this.lastAttackTime >= this.attackSpeed) {
            // 攻击前朝向目标
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            this.targetFacing = Math.atan2(dy, dx);
            
            this.fireProjectile();
            this.lastAttackTime = currentTime;
            
            // 开火后检查是否需要立即响应玩家命令
            if (hasRecentPlayerCommand && this.shouldInterruptAttack) {
                this.target = null; // 开火后立即清除目标
                this.shouldInterruptAttack = false;
                console.log(`无人机 ${this.playerId} 开火后立即响应集结命令`);
            }
        }
    }
    
    // Boids算法：调整位置避免拥挤
    applyBoids(allDrones, deltaTime) {
        // 只在以下情况应用Boids：
        // 1. 已到达集结点
        // 2. 没有明确的移动目标
        // 3. 不在追击敌人
        if (!this.hasReachedRally && this.rallyPoint) return;
        if (this.target) return; // 追击目标时不应用Boids
        
        // 检测稳定状态，避免无意义的微调
        const positionChange = Math.sqrt(
            (this.x - this.lastPosition.x) ** 2 + 
            (this.y - this.lastPosition.y) ** 2
        );
        
        if (positionChange < 0.5) {
            this.stableFrames++;
        } else {
            this.stableFrames = 0;
        }
        
        // 如果已经稳定超过30帧（0.5秒），减少Boids影响
        this.isStable = this.stableFrames > 30;
        this.lastPosition.x = this.x;
        this.lastPosition.y = this.y;
        
        if (this.isStable) {
            // 稳定状态下减少Boids计算频率
            if (this.stableFrames % 10 !== 0) return;
        }
        
        const separationRadius = this.scaledValues.droneCollisionRadius * 3; // 分离半径
        const alignmentRadius = this.scaledValues.droneCollisionRadius * 5; // 对齐半径
        const cohesionRadius = this.scaledValues.droneCollisionRadius * 5; // 聚合半径
        
        let separationX = 0, separationY = 0;
        let alignmentX = 0, alignmentY = 0;
        let cohesionX = 0, cohesionY = 0;
        let separationCount = 0;
        let alignmentCount = 0;
        let cohesionCount = 0;
        
        allDrones.forEach(other => {
            if (other === this) return;
            
            const distance = this.getDistance(other);
            
            // 分离：避免过于靠近
            if (distance < separationRadius && distance > 0) {
                const dx = this.x - other.x;
                const dy = this.y - other.y;
                separationX += dx / distance;
                separationY += dy / distance;
                separationCount++;
            }
            
            // 对齐：与附近无人机保持相同方向
            if (distance < alignmentRadius) {
                alignmentX += other.vx;
                alignmentY += other.vy;
                alignmentCount++;
            }
            
            // 聚合：向群体中心移动
            if (distance < cohesionRadius) {
                cohesionX += other.x;
                cohesionY += other.y;
                cohesionCount++;
            }
        });
        
        // 计算平均值
        if (separationCount > 0) {
            separationX /= separationCount;
            separationY /= separationCount;
        }
        
        if (alignmentCount > 0) {
            alignmentX /= alignmentCount;
            alignmentY /= alignmentCount;
        }
        
        if (cohesionCount > 0) {
            cohesionX /= cohesionCount;
            cohesionY /= cohesionCount;
            cohesionX = (cohesionX - this.x) * 0.01;
            cohesionY = (cohesionY - this.y) * 0.01;
        }
        
        // 应用Boids力（权重调整）
        const separationWeight = 1.5;
        const alignmentWeight = 0.3;
        const cohesionWeight = 0.2;
        
        // 计算新速度，但使用平滑过渡避免突变
        const targetVx = separationX * separationWeight + alignmentX * alignmentWeight + cohesionX * cohesionWeight;
        const targetVy = separationY * separationWeight + alignmentY * alignmentWeight + cohesionY * cohesionWeight;
        
        // 速度平滑插值，减少抖动
        const smoothFactor = 0.3;
        this.vx = this.vx * (1 - smoothFactor) + targetVx * smoothFactor;
        this.vy = this.vy * (1 - smoothFactor) + targetVy * smoothFactor;
        
        // 限制速度
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > this.moveSpeed * 0.3) {
            this.vx = (this.vx / speed) * this.moveSpeed * 0.3;
            this.vy = (this.vy / speed) * this.moveSpeed * 0.3;
        }
        
        // 应用移动，增加最小速度阈值
        const minSpeed = 0.5; // 提高最小速度阈值
        if (speed > minSpeed) {
            const moveDistance = deltaTime / 16.67;
            const newX = this.x + this.vx * moveDistance;
            const newY = this.y + this.vy * moveDistance;
            
            if (this.canMoveTo(newX, newY)) {
                this.x = newX;
                this.y = newY;
            } else {
                // 如果无法移动，清除速度避免持续尝试
                this.vx *= 0.5;
                this.vy *= 0.5;
            }
        } else {
            // 速度过低时完全停止
            this.vx = 0;
            this.vy = 0;
        }
    }
    
    fireProjectile() {
        console.log('fireProjectile被调用，target:', this.target);
        if (!this.target) {
            console.log('没有目标，取消发射');
            return;
        }
        
        // 播放射击音效
        console.log('无人机发射投射物，尝试播放音效');
        if (window.audioManager) {
            console.log('找到audioManager，播放射击音效');
            window.audioManager.playShootSound();
        } else {
            console.log('audioManager未找到');
        }
        
        // 使用对象池获取投射物
        let projectile = game.getProjectileFromPool();
        if (!projectile) {
            projectile = new Projectile();
        }
        
        // 初始化投射物
        projectile.init(
            this.x, this.y,
            this.target.x, this.target.y,
            this.attack,
            this.playerId,
            this.color,
            this.projectileSpeed,
            this.scaledValues
        );
        
        // 添加到全局投射物数组
        game.projectiles.push(projectile);
    }
    
    takeDamage(damage, attackerPlayerId = null) {
        // 无敌时间内不受伤害
        if (this.invulnerable) return;
        
        this.health -= damage;
        if (this.health < 0) this.health = 0;
        
        // 战场感知：受到攻击时发出支援信号
        if (attackerPlayerId !== null && attackerPlayerId !== this.playerId) {
            this.broadcastDistressSignal(attackerPlayerId);
        }
    }
    
    // 发出求援信号，呼叫附近的友军支援
    broadcastDistressSignal(attackerPlayerId) {
        const supportRange = this.scaledValues.droneAutoAttackRange * 1.5; // 支援范围为索敌范围的1.5倍
        const myPlayer = game.players[this.playerId];
        
        if (!myPlayer) return;
        
        // 向附近的友军无人机发送支援信号
        myPlayer.drones.forEach(friendlyDrone => {
            if (friendlyDrone === this) return;
            
            const distance = this.getDistance(friendlyDrone);
            if (distance <= supportRange) {
                friendlyDrone.respondToDistressCall(this, attackerPlayerId);
            }
        });
        
        // 通知AI玩家有单位受到攻击
        if (!myPlayer.isHuman) {
            this.notifyAIOfAttack(attackerPlayerId);
        }
    }
    
    // 响应求援信号
    respondToDistressCall(distressedDrone, attackerPlayerId) {
        // 只有在没有明确任务时才响应求援
        if (this.playerTarget || (this.target && this.target.health > 0)) {
            return; // 已有明确目标，不响应
        }
        
        // 寻找攻击者
        const attackerPlayer = game.players[attackerPlayerId];
        if (!attackerPlayer) return;
        
        // 寻找最近的敌方单位作为反击目标
        let closestEnemy = null;
        let closestDistance = Infinity;
        
        // 优先攻击攻击者的无人机
        attackerPlayer.drones.forEach(enemyDrone => {
            const distance = this.getDistance(enemyDrone);
            if (distance < closestDistance && distance <= this.scaledValues.droneAutoAttackRange * 2) {
                closestDistance = distance;
                closestEnemy = enemyDrone;
            }
        });
        
        // 如果没有找到无人机，考虑攻击基地（只攻击血量大于0的基地）
        if (!closestEnemy && attackerPlayer.base.health > 0) {
            const distanceToBase = this.getDistance(attackerPlayer.base);
            if (distanceToBase <= this.scaledValues.droneAutoAttackRange * 2) {
                closestEnemy = attackerPlayer.base;
            }
        }
        
        // 设置反击目标
        if (closestEnemy) {
            this.target = closestEnemy;
            console.log(`无人机 ${this.playerId} 响应求援，反击敌方单位`);
        }
    }
    
    // 通知AI有单位受到攻击
    notifyAIOfAttack(attackerPlayerId) {
        const myPlayer = game.players[this.playerId];
        if (!myPlayer || myPlayer.isHuman) return;
        
        // 设置AI的紧急状态标记
        myPlayer.underAttack = true;
        myPlayer.lastAttackTime = Date.now();
        myPlayer.attackerPlayerId = attackerPlayerId;
        
        console.log(`AI ${this.playerId} 感知到来自玩家 ${attackerPlayerId} 的攻击`);
    }
    
    // 判断是否应该专注于集结点
    shouldFocusOnRallyPoint() {
        if (!this.rallyPoint) return false;
        
        const rallyDistance = this.getDistance(this.rallyPoint);
        const rallyRange = Math.max(this.scaledValues.droneRallyRange, 25);
        
        // 如果距离集结点很近，不需要专注集结
        if (rallyDistance < rallyRange * 2) {
            return false;
        }
        
        // 检查是否被其他无人机阻挡，无法到达集结点
        const isBlocked = this.isPathToRallyBlocked();
        
        // 如果被阻挡且距离集结点较远，允许索敌攻击
        if (isBlocked && rallyDistance > rallyRange * 3) {
            console.log(`无人机 ${this.playerId} 被阻挡，允许索敌攻击`);
            return false; // 不专注集结，允许攻击
        }
        
        // 默认情况下，在到达集结点前专注集结
        return true;
    }
    
    // 检查到集结点的路径是否被阻挡
    isPathToRallyBlocked() {
        if (!this.rallyPoint) return false;
        
        const myPlayer = game.players[this.playerId];
        if (!myPlayer) return false;
        
        const rallyDistance = this.getDistance(this.rallyPoint);
        const checkDistance = Math.min(rallyDistance, 100); // 检查前100像素的路径
        
        // 计算到集结点的方向
        const dx = this.rallyPoint.x - this.x;
        const dy = this.rallyPoint.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 1) return false;
        
        const dirX = dx / distance;
        const dirY = dy / distance;
        
        // 检查路径上是否有太多友军无人机
        let blockingDrones = 0;
        const checkRadius = this.scaledValues.droneCollisionRadius * 2;
        
        // 沿着路径检查多个点
        for (let step = 20; step < checkDistance; step += 20) {
            const checkX = this.x + dirX * step;
            const checkY = this.y + dirY * step;
            
            // 计算这个位置周围的友军无人机数量
            myPlayer.drones.forEach(otherDrone => {
                if (otherDrone === this) return;
                
                const droneDistance = Math.sqrt(
                    (checkX - otherDrone.x) ** 2 + 
                    (checkY - otherDrone.y) ** 2
                );
                
                if (droneDistance < checkRadius) {
                    blockingDrones++;
                }
            });
        }
        
        // 如果路径上有超过3个友军无人机，认为被阻挡
        const blockingThreshold = 3;
        return blockingDrones > blockingThreshold;
    }
    
    // 计算动态到达范围，根据集结点周围的拥挤程度调整
    calculateDynamicArrivalRange() {
        if (!this.rallyPoint) return 25;
        
        const myPlayer = game.players[this.playerId];
        if (!myPlayer) return 25;
        
        // 基础到达范围
        const baseRange = Math.max(this.scaledValues.droneRallyRange, 25);
        
        // 计算集结点周围的无人机密度
        const densityCheckRadius = 80; // 检查80像素范围内的密度
        let nearbyDrones = 0;
        let arrivedDrones = 0;
        
        myPlayer.drones.forEach(otherDrone => {
            if (otherDrone === this) return;
            
            const distanceToRally = Math.sqrt(
                (this.rallyPoint.x - otherDrone.x) ** 2 + 
                (this.rallyPoint.y - otherDrone.y) ** 2
            );
            
            if (distanceToRally < densityCheckRadius) {
                nearbyDrones++;
                if (otherDrone.hasReachedRally) {
                    arrivedDrones++;
                }
            }
        });
        
        // 根据密度动态调整到达范围
        let dynamicRange = baseRange;
        
        // 如果集结点周围很拥挤，扩大到达范围
        if (nearbyDrones > 8) {
            // 每超过8个无人机，扩大5像素范围
            const extraRange = (nearbyDrones - 8) * 5;
            dynamicRange = baseRange + extraRange;
        }
        
        // 根据已到达的无人机数量进一步调整
        if (arrivedDrones > 5) {
            // 如果已经有很多无人机到达，为后来者提供更大的缓冲区
            const layerBonus = Math.floor(arrivedDrones / 5) * 15;
            dynamicRange += layerBonus;
        }
        
        // 限制最大范围，避免过度扩散
        const maxRange = 100;
        dynamicRange = Math.min(dynamicRange, maxRange);
        
        return dynamicRange;
    }
    
    // 更新无人机朝向
    updateFacing(deltaTime) {
        let targetX = null;
        let targetY = null;
        
        // 确定朝向目标的优先级
        // 1. 攻击目标（最高优先级）
        if (this.target && this.target.health > 0) {
            targetX = this.target.x;
            targetY = this.target.y;
        }
        // 2. 玩家指定的攻击目标
        else if (this.playerTarget && this.playerTarget.health > 0) {
            targetX = this.playerTarget.x;
            targetY = this.playerTarget.y;
        }
        // 3. 集结点（如果正在移动）
        else if (this.rallyPoint && !this.hasReachedRally) {
            targetX = this.rallyPoint.x;
            targetY = this.rallyPoint.y;
        }
        // 4. 移动方向（如果有速度）
        else if (Math.abs(this.vx) > 0.1 || Math.abs(this.vy) > 0.1) {
            // 根据移动方向确定朝向
            targetX = this.x + this.vx * 10;
            targetY = this.y + this.vy * 10;
        }
        
        // 如果有目标，计算朝向角度
        if (targetX !== null && targetY !== null) {
            const dx = targetX - this.x;
            const dy = targetY - this.y;
            
            if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
                this.targetFacing = Math.atan2(dy, dx);
            }
        }
        
        // 平滑转向到目标朝向
        this.smoothRotateToTarget(deltaTime);
    }
    
    // 平滑转向到目标角度
    smoothRotateToTarget(deltaTime) {
        // 计算角度差
        let angleDiff = this.targetFacing - this.facing;
        
        // 处理角度跨越问题（-π到π的跳跃）
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        
        // 如果角度差很小，直接设置
        if (Math.abs(angleDiff) < 0.05) {
            this.facing = this.targetFacing;
            return;
        }
        
        // 计算转向速度（基于帧时间）
        const rotationSpeed = this.facingSpeed * (deltaTime / 16.67);
        
        // 限制每帧的最大转向角度
        const maxRotation = rotationSpeed;
        const rotation = Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), maxRotation);
        
        this.facing += rotation;
        
        // 保持角度在-π到π范围内
        while (this.facing > Math.PI) this.facing -= 2 * Math.PI;
        while (this.facing < -Math.PI) this.facing += 2 * Math.PI;
    }
    
    canMoveTo(newX, newY) {
        // 检查画布边界
        const margin = this.scaledValues.droneCollisionRadius;
        if (newX < margin || newX > game.canvas.width - margin ||
            newY < margin || newY > game.canvas.height - margin) {
            return false;
        }
        
        // 安全边界检查 - 防止无人机进入UI面板区域
        const isMobile = game.canvas.width <= 768;
        if (game.uiSafeArea) {
            if (isMobile) {
                // 移动端：检查是否进入顶部UI面板区域
                if (newY < game.uiSafeArea.top) {
                    return false; // 无人机不能进入顶部UI面板区域
                }
            } else {
                // 桌面端：检查是否进入左侧UI面板区域
                if (newX < game.uiSafeArea.left) {
                    return false; // 无人机不能进入左侧UI面板区域
                }
            }
        }
        
        // 检查与其他无人机的碰撞（使用平方距离）
        const minDistanceSq = (this.scaledValues.droneCollisionRadius * 2) ** 2;
        
        for (let i = 0; i < game.players.length; i++) {
            const player = game.players[i];
            
            for (let j = 0; j < player.drones.length; j++) {
                const other = player.drones[j];
                if (other === this) continue; // 跳过自己
                
                const dx = newX - other.x;
                const dy = newY - other.y;
                const distanceSq = dx * dx + dy * dy;
                
                if (distanceSq < minDistanceSq) {
                    return false;
                }
            }
            
            // 检查与基地的碰撞
            const dx = newX - player.base.x;
            const dy = newY - player.base.y;
            const distanceSq = dx * dx + dy * dy;
            const baseMinDistanceSq = (this.scaledValues.droneCollisionRadius + game.scaledValues.baseCollisionRadius) ** 2;
            
            if (distanceSq < baseMinDistanceSq) {
                return false;
            }
        }
        
        // 检查与飞船碎片的碰撞
        for (let i = 0; i < game.debris.length; i++) {
            const debris = game.debris[i];
            const dx = newX - debris.x;
            const dy = newY - debris.y;
            const distanceSq = dx * dx + dy * dy;
            const debrisMinDistanceSq = (this.scaledValues.droneCollisionRadius + debris.size) ** 2;
            
            if (distanceSq < debrisMinDistanceSq) {
                return false;
            }
        }
        
        return true;
    }
    
    getDistance(target) {
        const dx = this.x - target.x;
        const dy = this.y - target.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    // 渲染方法已移至主游戏类中进行批量处理以提升性能
}

// 投射物类
class Projectile {
    constructor() {
        this.reset();
    }
    
    init(startX, startY, targetX, targetY, damage, owner, color, speed = 20, scaledValues = null) {
        this.x = startX;
        this.y = startY;
        this.damage = damage;
        this.owner = owner;
        this.color = color;
        this.speed = speed; // 使用传入的子弹速度
        this.size = scaledValues ? scaledValues.projectileSize : 3; // 使用缩放后的大小
        this.targetX = targetX;
        this.targetY = targetY;
        this.hasHit = false;
        
        // 计算方向
        const dx = targetX - startX;
        const dy = targetY - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            this.vx = (dx / distance) * this.speed;
            this.vy = (dy / distance) * this.speed;
        } else {
            this.vx = 0;
            this.vy = 0;
        }
    }
    
    reset() {
        this.x = 0;
        this.y = 0;
        this.damage = 0;
        this.owner = 0;
        this.color = '#fff';
        this.speed = 0;
        this.size = 3;
        this.targetX = 0;
        this.targetY = 0;
        this.hasHit = false;
        this.vx = 0;
        this.vy = 0;
    }
    
    update(deltaTime) {
        const moveDistance = deltaTime / 16.67; // 假设60FPS
        this.x += this.vx * moveDistance;
        this.y += this.vy * moveDistance;
    }
    
    // 渲染方法已移至主游戏类中进行批量处理以提升性能
}

// 飞船碎片类
class Debris {
    constructor(x, y, size, points, health = 1) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.points = points;
        this.maxHealth = health;
        this.health = health;
        this.rotation = 0;
        this.shape = this.generateShape(); // 预生成形状，避免每帧重新计算
    }
    
    // 预生成不规则形状
    generateShape() {
        const shape = [];
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const radius = this.size * (0.7 + Math.random() * 0.6);
            shape.push({
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius
            });
        }
        return shape;
    }
    
    // 受到伤害
    takeDamage(damage) {
        this.health -= damage;
        if (this.health < 0) this.health = 0;
        return this.health <= 0; // 返回是否被摧毁
    }
    
    render(ctx, showDetailedInfo = false) {
        this.rotation += 0.005; // 减慢旋转速度
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // 根据生命值调整颜色
        const healthPercent = this.health / this.maxHealth;
        const red = Math.floor(102 + (255 - 102) * (1 - healthPercent));
        const green = Math.floor(102 * healthPercent);
        const blue = Math.floor(102 * healthPercent);
        
        ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
        ctx.strokeStyle = healthPercent > 0.5 ? '#999' : '#ff6666';
        ctx.lineWidth = 2;
        
        // 绘制预生成的形状
        ctx.beginPath();
        for (let i = 0; i < this.shape.length; i++) {
            const point = this.shape[i];
            if (i === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
        
        // 显示资源点数
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        
        // 绘制文字描边
        ctx.strokeText(`${this.points}`, this.x, this.y - 5);
        ctx.fillText(`${this.points}`, this.x, this.y - 5);
        
        // 显示生命值条
        if (this.health < this.maxHealth) {
            const barWidth = this.size * 1.5;
            const barHeight = 4;
            const barX = this.x - barWidth / 2;
            const barY = this.y + this.size + 8;
            
            // 背景
            ctx.fillStyle = '#333';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            // 生命值
            ctx.fillStyle = healthPercent > 0.3 ? '#00ff00' : '#ff0000';
            ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
            
            // 边框
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.strokeRect(barX, barY, barWidth, barHeight);
        }
        
        // 显示详细属性信息
        if (showDetailedInfo) {
            this.renderDetailedInfo(ctx);
        }
    }
    
    // 渲染详细属性信息
    renderDetailedInfo(ctx) {
        const infoLines = [
            `资源点数: ${this.points}`,
            `生命值: ${this.health}/${this.maxHealth}`,
            `大小: ${Math.round(this.size)}`,
            `位置: (${Math.round(this.x)}, ${Math.round(this.y)})`
        ];
        
        // 计算信息面板尺寸
        ctx.font = '11px Arial';
        const lineHeight = 14;
        const padding = 8;
        const maxWidth = Math.max(...infoLines.map(line => ctx.measureText(line).width));
        const panelWidth = maxWidth + padding * 2;
        const panelHeight = infoLines.length * lineHeight + padding * 2;
        
        // 确定面板位置（避免超出画布边界）
        let panelX = this.x + this.size + 10;
        let panelY = this.y - panelHeight / 2;
        
        // 边界检查
        const canvas = ctx.canvas;
        if (panelX + panelWidth > canvas.width) {
            panelX = this.x - this.size - panelWidth - 10;
        }
        if (panelY < 0) {
            panelY = 0;
        }
        if (panelY + panelHeight > canvas.height) {
            panelY = canvas.height - panelHeight;
        }
        
        // 绘制信息面板背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        
        // 绘制边框
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
        
        // 绘制信息文本
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        
        infoLines.forEach((line, index) => {
            ctx.fillText(line, panelX + padding, panelY + padding + (index + 1) * lineHeight - 2);
        });
        
        // 绘制指向资源的连接线
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(panelX, panelY + panelHeight / 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    // 检查点击是否在资源范围内
    isPointInside(x, y) {
        const distance = Math.sqrt((x - this.x) ** 2 + (y - this.y) ** 2);
        return distance <= this.size;
    }
}

// 启动游戏 - 移除重复的初始化代码，由index.html统一管理