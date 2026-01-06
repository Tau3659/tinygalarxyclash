/**
 * 游戏服务器核心逻辑
 * 处理玩家连接、房间管理、游戏状态同步
 */

const { v4: uuidv4 } = require('uuid');
const RoomManager = require('./roomManager');

class GameServer {
    constructor(io) {
        this.io = io;
        this.roomManager = new RoomManager();
        this.players = new Map(); // playerId -> playerInfo
        
        this.setupSocketHandlers();
        
        console.log('🎮 游戏服务器初始化完成');
    }
    
    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`👤 玩家连接: ${socket.id}`);
            
            // 玩家加入
            socket.on('playerJoin', (playerData) => {
                this.handlePlayerJoin(socket, playerData);
            });
            
            // 创建房间
            socket.on('createRoom', (roomConfig) => {
                this.handleCreateRoom(socket, roomConfig);
            });
            
            // 加入房间
            socket.on('joinRoom', (roomId) => {
                this.handleJoinRoom(socket, roomId);
            });
            
            // 离开房间
            socket.on('leaveRoom', () => {
                this.handleLeaveRoom(socket);
            });
            
            // 游戏操作
            socket.on('gameAction', (action) => {
                this.handleGameAction(socket, action);
            });
            
            // 玩家准备
            socket.on('playerReady', () => {
                this.handlePlayerReady(socket);
            });
            
            // 断线处理
            socket.on('disconnect', () => {
                this.handlePlayerDisconnect(socket);
            });
        });
    }
    
    handlePlayerJoin(socket, playerData) {
        const playerId = uuidv4();
        const player = {
            id: playerId,
            socketId: socket.id,
            name: playerData.name || `玩家${Math.floor(Math.random() * 1000)}`,
            color: playerData.color || '#00ff00',
            isReady: false,
            roomId: null,
            joinTime: Date.now()
        };
        
        this.players.set(playerId, player);
        socket.playerId = playerId;
        
        // 发送玩家信息
        socket.emit('playerJoined', {
            playerId: playerId,
            playerInfo: player
        });
        
        // 发送房间列表
        socket.emit('roomList', this.roomManager.getRoomList());
        
        console.log(`✅ 玩家加入成功: ${player.name} (${playerId})`);
    }
    
    handleCreateRoom(socket, roomConfig) {
        const player = this.players.get(socket.playerId);
        if (!player) return;
        
        const room = this.roomManager.createRoom({
            hostId: player.id,
            gameMode: roomConfig.gameMode || '1v1',
            maxPlayers: roomConfig.maxPlayers || 2,
            isPrivate: roomConfig.isPrivate || false,
            aiDifficulty: roomConfig.aiDifficulty || 'medium'
        });
        
        // 玩家加入房间
        this.joinPlayerToRoom(player, room.id);
        
        // 通知所有玩家房间列表更新
        this.io.emit('roomList', this.roomManager.getRoomList());
        
        console.log(`🏠 房间创建成功: ${room.id} by ${player.name}`);
    }
    
    handleJoinRoom(socket, roomId) {
        const player = this.players.get(socket.playerId);
        if (!player) return;
        
        const room = this.roomManager.getRoom(roomId);
        if (!room) {
            socket.emit('error', { message: '房间不存在' });
            return;
        }
        
        if (room.players.length >= room.maxPlayers) {
            socket.emit('error', { message: '房间已满' });
            return;
        }
        
        this.joinPlayerToRoom(player, roomId);
        
        // 通知房间内所有玩家
        this.io.to(roomId).emit('playerJoinedRoom', {
            player: player,
            room: room
        });
        
        // 更新房间列表
        this.io.emit('roomList', this.roomManager.getRoomList());
        
        console.log(`🚪 玩家加入房间: ${player.name} -> ${roomId}`);
    }
    
    joinPlayerToRoom(player, roomId) {
        // 如果玩家已在其他房间，先离开
        if (player.roomId) {
            this.leavePlayerFromRoom(player);
        }
        
        const room = this.roomManager.addPlayerToRoom(roomId, player);
        if (room) {
            player.roomId = roomId;
            player.isReady = false;
            
            // 加入 Socket.IO 房间
            const socket = this.io.sockets.sockets.get(player.socketId);
            if (socket) {
                socket.join(roomId);
                socket.emit('joinedRoom', { room: room });
            }
        }
    }
    
    handleLeaveRoom(socket) {
        const player = this.players.get(socket.playerId);
        if (!player || !player.roomId) return;
        
        this.leavePlayerFromRoom(player);
    }
    
    leavePlayerFromRoom(player) {
        if (!player.roomId) return;
        
        const roomId = player.roomId;
        const room = this.roomManager.removePlayerFromRoom(roomId, player.id);
        
        // 离开 Socket.IO 房间
        const socket = this.io.sockets.sockets.get(player.socketId);
        if (socket) {
            socket.leave(roomId);
            socket.emit('leftRoom');
        }
        
        player.roomId = null;
        player.isReady = false;
        
        // 通知房间内其他玩家
        this.io.to(roomId).emit('playerLeftRoom', {
            playerId: player.id,
            room: room
        });
        
        // 更新房间列表
        this.io.emit('roomList', this.roomManager.getRoomList());
        
        console.log(`🚪 玩家离开房间: ${player.name} <- ${roomId}`);
    }
    
    handlePlayerReady(socket) {
        const player = this.players.get(socket.playerId);
        if (!player || !player.roomId) return;
        
        player.isReady = !player.isReady;
        const room = this.roomManager.getRoom(player.roomId);
        
        // 通知房间内所有玩家
        this.io.to(player.roomId).emit('playerReadyChanged', {
            playerId: player.id,
            isReady: player.isReady,
            room: room
        });
        
        // 检查是否所有玩家都准备好了
        if (this.roomManager.areAllPlayersReady(player.roomId)) {
            this.startGame(player.roomId);
        }
        
        console.log(`🎯 玩家准备状态: ${player.name} -> ${player.isReady}`);
    }
    
    startGame(roomId) {
        const room = this.roomManager.startGame(roomId);
        if (!room) return;
        
        // 通知房间内所有玩家游戏开始
        this.io.to(roomId).emit('gameStarted', {
            room: room,
            gameState: room.gameState
        });
        
        // 开始游戏循环
        this.startGameLoop(roomId);
        
        console.log(`🎮 游戏开始: 房间 ${roomId}`);
    }
    
    startGameLoop(roomId) {
        const room = this.roomManager.getRoom(roomId);
        if (!room || room.status !== 'playing') return;
        
        // 游戏循环逻辑（每秒60帧）
        room.gameLoopInterval = setInterval(() => {
            if (room.gameLogic) {
                room.gameLogic.update();
                
                // 广播游戏状态更新
                this.io.to(roomId).emit('gameUpdate', {
                    gameState: room.gameLogic.getGameState(),
                    timestamp: Date.now()
                });
            }
        }, 1000 / 60); // 60 FPS
    }
    
    handleGameAction(socket, action) {
        const player = this.players.get(socket.playerId);
        if (!player || !player.roomId) return;
        
        const room = this.roomManager.getRoom(player.roomId);
        if (!room || room.status !== 'playing') return;
        
        // 处理游戏操作
        if (room.gameLogic) {
            room.gameLogic.handlePlayerAction(player.id, action);
        }
        
        // 广播操作给房间内其他玩家
        socket.to(player.roomId).emit('playerAction', {
            playerId: player.id,
            action: action,
            timestamp: Date.now()
        });
    }
    
    handlePlayerDisconnect(socket) {
        const player = this.players.get(socket.playerId);
        if (!player) return;
        
        console.log(`👋 玩家断线: ${player.name} (${socket.playerId})`);
        
        // 离开房间
        if (player.roomId) {
            this.leavePlayerFromRoom(player);
        }
        
        // 移除玩家
        this.players.delete(socket.playerId);
    }
    
    // 获取统计信息
    getTotalPlayers() {
        return this.players.size;
    }
    
    getTotalRooms() {
        return this.roomManager.getRoomCount();
    }
}

module.exports = GameServer;