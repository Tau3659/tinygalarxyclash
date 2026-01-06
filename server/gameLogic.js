/**
 * 服务端游戏逻辑
 * 基于客户端游戏逻辑，适配多人联机
 */

class GameLogic {
    constructor(config) {
        this.gameMode = config.gameMode;
        this.players = config.players;
        this.aiDifficulty = config.aiDifficulty;
        
        // 游戏状态
        this.gameState = {
            status: 'playing',
            startTime: Date.now(),
            players: this.initializePlayers(),
            debris: this.generateDebris(),
            projectiles: [],
            winner: null
        };
        
        console.log(`🎮 游戏逻辑初始化: ${this.gameMode} 模式`);
    }
    
    initializePlayers() {
        const gamePlayers = [];
        
        this.players.forEach((player, index) => {
            const gamePlayer = {
                id: player.id,
                name: player.name,
                color: player.color,
                team: this.getPlayerTeam(index),
                isHuman: true,
                resources: 0,
                killCount: 0,
                base: this.createBase(index),
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
            
            // 生成初始无人机
            for (let i = 0; i < 20; i++) {
                gamePlayer.drones.push(this.createDrone(gamePlayer, i));
            }
            
            gamePlayers.push(gamePlayer);
        });
        
        // 添加AI玩家（如果需要）
        if (this.needsAI()) {
            gamePlayers.push(this.createAIPlayer());
        }
        
        return gamePlayers;
    }
    
    getPlayerTeam(index) {
        switch (this.gameMode) {
            case '1v1':
                return index;
            case '2v2':
                return Math.floor(index / 2);
            case 'ffa':
                return index;
            default:
                return index;
        }
    }
    
    createBase(playerIndex) {
        // 基地位置计算（简化版）
        const positions = [
            { x: 100, y: 100 },   // 玩家1
            { x: 700, y: 500 },   // 玩家2
            { x: 100, y: 500 },   // 玩家3
            { x: 700, y: 100 }    // 玩家4
        ];
        
        const pos = positions[playerIndex] || { x: 400, y: 300 };
        
        return {
            x: pos.x,
            y: pos.y,
            maxHealth: 1000,
            health: 1000,
            size: 40
        };
    }
    
    createDrone(player, index) {
        // 无人机初始位置（围绕基地）
        const angle = (index * 0.5);
        const radius = 60 + Math.floor(index / 8) * 20;
        
        return {
            id: `${player.id}_drone_${index}`,
            x: player.base.x + Math.cos(angle) * radius,
            y: player.base.y + Math.sin(angle) * radius,
            playerId: player.id,
            health: 1,
            maxHealth: 1,
            size: 8,
            moveSpeed: 1.5,
            attackRange: 160,
            target: null,
            state: 'idle' // idle, moving, attacking
        };
    }
    
    generateDebris() {
        const debris = [];
        const debrisCount = this.gameMode === '2v2' ? 0 : 5;
        
        for (let i = 0; i < debrisCount; i++) {
            debris.push({
                id: `debris_${i}`,
                x: 200 + Math.random() * 400,
                y: 200 + Math.random() * 200,
                size: 20 + Math.random() * 20,
                points: 5 + Math.floor(Math.random() * 11),
                health: 50 + Math.floor(Math.random() * 101),
                maxHealth: 50 + Math.floor(Math.random() * 101)
            });
        }
        
        return debris;
    }
    
    needsAI() {
        // 根据游戏模式判断是否需要AI
        const requiredPlayers = {
            '1v1': 2,
            '2v2': 4,
            'ffa': 3
        };
        
        return this.players.length < requiredPlayers[this.gameMode];
    }
    
    createAIPlayer() {
        return {
            id: 'ai_player',
            name: 'AI对手',
            color: '#ff0000',
            team: 1,
            isHuman: false,
            resources: 0,
            killCount: 0,
            base: this.createBase(1),
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
    
    update() {
        if (this.gameState.status !== 'playing') return;
        
        // 更新游戏逻辑
        this.updateDrones();
        this.updateProjectiles();
        this.checkCollisions();
        this.checkGameEnd();
        
        // 生成新无人机
        this.spawnDrones();
    }
    
    updateDrones() {
        this.gameState.players.forEach(player => {
            player.drones.forEach(drone => {
                // 简化的无人机更新逻辑
                if (drone.target) {
                    this.moveDroneToTarget(drone);
                }
            });
        });
    }
    
    moveDroneToTarget(drone) {
        if (!drone.target) return;
        
        const dx = drone.target.x - drone.x;
        const dy = drone.target.y - drone.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > drone.attackRange) {
            // 移动向目标
            const moveX = (dx / distance) * drone.moveSpeed;
            const moveY = (dy / distance) * drone.moveSpeed;
            
            drone.x += moveX;
            drone.y += moveY;
            drone.state = 'moving';
        } else {
            // 攻击目标
            drone.state = 'attacking';
            this.droneAttack(drone);
        }
    }
    
    droneAttack(drone) {
        // 创建投射物
        const projectile = {
            id: `projectile_${Date.now()}_${Math.random()}`,
            x: drone.x,
            y: drone.y,
            targetX: drone.target.x,
            targetY: drone.target.y,
            speed: 3,
            damage: 1,
            ownerId: drone.playerId
        };
        
        this.gameState.projectiles.push(projectile);
    }
    
    updateProjectiles() {
        this.gameState.projectiles = this.gameState.projectiles.filter(projectile => {
            // 移动投射物
            const dx = projectile.targetX - projectile.x;
            const dy = projectile.targetY - projectile.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < projectile.speed) {
                // 到达目标
                return false;
            }
            
            const moveX = (dx / distance) * projectile.speed;
            const moveY = (dy / distance) * projectile.speed;
            
            projectile.x += moveX;
            projectile.y += moveY;
            
            return true;
        });
    }
    
    checkCollisions() {
        // 简化的碰撞检测
        // 实际实现中需要更复杂的碰撞逻辑
    }
    
    checkGameEnd() {
        const aliveTeams = new Set();
        
        this.gameState.players.forEach(player => {
            if (player.base.health > 0) {
                aliveTeams.add(player.team);
            }
        });
        
        if (aliveTeams.size <= 1) {
            this.gameState.status = 'finished';
            this.gameState.winner = aliveTeams.values().next().value;
        }
    }
    
    spawnDrones() {
        this.gameState.players.forEach(player => {
            if (player.base.health > 0 && player.drones.length < 30) {
                // 每秒生成一架无人机的逻辑
                if (Math.random() < 0.016) { // 约每秒60帧中的1帧
                    const newDrone = this.createDrone(player, player.drones.length);
                    player.drones.push(newDrone);
                }
            }
        });
    }
    
    handlePlayerAction(playerId, action) {
        const player = this.gameState.players.find(p => p.id === playerId);
        if (!player) return;
        
        switch (action.type) {
            case 'setRallyPoint':
                player.rallyPoint = { x: action.x, y: action.y };
                // 更新所有无人机目标
                player.drones.forEach(drone => {
                    drone.target = player.rallyPoint;
                });
                break;
                
            case 'attackTarget':
                // 设置攻击目标
                player.drones.forEach(drone => {
                    drone.target = action.target;
                });
                break;
                
            case 'upgrade':
                if (player.resources > 0) {
                    player.resources--;
                    player.upgrades[action.attribute]++;
                }
                break;
        }
    }
    
    getGameState() {
        return {
            ...this.gameState,
            timestamp: Date.now()
        };
    }
}

module.exports = GameLogic;