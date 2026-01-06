/**
 * 客户端网络通信层
 * 处理与服务器的 WebSocket 通信
 */

class NetworkManager {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.playerId = null;
        this.currentRoom = null;
        
        // 事件回调
        this.callbacks = {
            onConnected: null,
            onDisconnected: null,
            onPlayerJoined: null,
            onRoomList: null,
            onJoinedRoom: null,
            onLeftRoom: null,
            onGameStarted: null,
            onGameUpdate: null,
            onPlayerAction: null,
            onError: null
        };
        
        console.log('🌐 网络管理器初始化');
    }
    
    // 连接到服务器
    connect(serverUrl = 'http://localhost:3000') {
        try {
            this.socket = io(serverUrl);
            this.setupEventListeners();
            console.log(`🔗 正在连接服务器: ${serverUrl}`);
        } catch (error) {
            console.error('❌ 连接失败:', error);
            this.triggerCallback('onError', { message: '连接服务器失败' });
        }
    }
    
    setupEventListeners() {
        // 连接事件
        this.socket.on('connect', () => {
            this.isConnected = true;
            console.log('✅ 服务器连接成功');
            this.triggerCallback('onConnected');
        });
        
        this.socket.on('disconnect', () => {
            this.isConnected = false;
            console.log('❌ 服务器连接断开');
            this.triggerCallback('onDisconnected');
        });
        
        // 玩家事件
        this.socket.on('playerJoined', (data) => {
            this.playerId = data.playerId;
            console.log(`👤 玩家加入成功: ${data.playerInfo.name}`);
            this.triggerCallback('onPlayerJoined', data);
        });
        
        // 房间事件
        this.socket.on('roomList', (rooms) => {
            console.log(`🏠 收到房间列表: ${rooms.length} 个房间`);
            this.triggerCallback('onRoomList', rooms);
        });
        
        this.socket.on('joinedRoom', (data) => {
            this.currentRoom = data.room;
            console.log(`🚪 加入房间成功: ${data.room.id}`);
            this.triggerCallback('onJoinedRoom', data);
        });
        
        this.socket.on('leftRoom', () => {
            this.currentRoom = null;
            console.log('🚪 离开房间');
            this.triggerCallback('onLeftRoom');
        });
        
        this.socket.on('playerJoinedRoom', (data) => {
            console.log(`👥 玩家加入房间: ${data.player.name}`);
            this.triggerCallback('onPlayerJoinedRoom', data);
        });
        
        this.socket.on('playerLeftRoom', (data) => {
            console.log(`👋 玩家离开房间: ${data.playerId}`);
            this.triggerCallback('onPlayerLeftRoom', data);
        });
        
        this.socket.on('playerReadyChanged', (data) => {
            console.log(`🎯 玩家准备状态变更: ${data.playerId} -> ${data.isReady}`);
            this.triggerCallback('onPlayerReadyChanged', data);
        });
        
        // 游戏事件
        this.socket.on('gameStarted', (data) => {
            console.log('🎮 游戏开始!');
            this.triggerCallback('onGameStarted', data);
        });
        
        this.socket.on('gameUpdate', (data) => {
            this.triggerCallback('onGameUpdate', data);
        });
        
        this.socket.on('playerAction', (data) => {
            this.triggerCallback('onPlayerAction', data);
        });
        
        // 错误事件
        this.socket.on('error', (error) => {
            console.error('🚨 服务器错误:', error);
            this.triggerCallback('onError', error);
        });
    }
    
    // 玩家加入
    joinAsPlayer(playerData) {
        if (!this.isConnected) {
            console.error('❌ 未连接到服务器');
            return;
        }
        
        this.socket.emit('playerJoin', {
            name: playerData.name || `玩家${Math.floor(Math.random() * 1000)}`,
            color: playerData.color || '#00ff00'
        });
    }
    
    // 创建房间
    createRoom(roomConfig) {
        if (!this.isConnected) {
            console.error('❌ 未连接到服务器');
            return;
        }
        
        this.socket.emit('createRoom', {
            gameMode: roomConfig.gameMode || '1v1',
            maxPlayers: roomConfig.maxPlayers || 2,
            isPrivate: roomConfig.isPrivate || false,
            aiDifficulty: roomConfig.aiDifficulty || 'medium'
        });
    }
    
    // 加入房间
    joinRoom(roomId) {
        if (!this.isConnected) {
            console.error('❌ 未连接到服务器');
            return;
        }
        
        this.socket.emit('joinRoom', roomId);
    }
    
    // 离开房间
    leaveRoom() {
        if (!this.isConnected) {
            console.error('❌ 未连接到服务器');
            return;
        }
        
        this.socket.emit('leaveRoom');
    }
    
    // 玩家准备
    toggleReady() {
        if (!this.isConnected || !this.currentRoom) {
            console.error('❌ 未在房间中');
            return;
        }
        
        this.socket.emit('playerReady');
    }
    
    // 发送游戏操作
    sendGameAction(action) {
        if (!this.isConnected || !this.currentRoom) {
            console.error('❌ 未在游戏中');
            return;
        }
        
        this.socket.emit('gameAction', {
            type: action.type,
            ...action.data,
            timestamp: Date.now()
        });
    }
    
    // 设置集结点
    setRallyPoint(x, y) {
        this.sendGameAction({
            type: 'setRallyPoint',
            data: { x, y }
        });
    }
    
    // 攻击目标
    attackTarget(target) {
        this.sendGameAction({
            type: 'attackTarget',
            data: { target }
        });
    }
    
    // 升级
    upgrade(attribute) {
        this.sendGameAction({
            type: 'upgrade',
            data: { attribute }
        });
    }
    
    // 设置事件回调
    on(event, callback) {
        if (this.callbacks.hasOwnProperty(`on${event.charAt(0).toUpperCase() + event.slice(1)}`)) {
            this.callbacks[`on${event.charAt(0).toUpperCase() + event.slice(1)}`] = callback;
        }
    }
    
    // 触发回调
    triggerCallback(callbackName, data = null) {
        const callback = this.callbacks[callbackName];
        if (callback && typeof callback === 'function') {
            callback(data);
        }
    }
    
    // 断开连接
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
            this.playerId = null;
            this.currentRoom = null;
        }
    }
    
    // 获取连接状态
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            playerId: this.playerId,
            currentRoom: this.currentRoom
        };
    }
}

// 全局网络管理器实例
window.networkManager = new NetworkManager();