/**
 * 房间管理器
 * 负责游戏房间的创建、管理和销毁
 */

const { v4: uuidv4 } = require('uuid');
const GameLogic = require('./gameLogic');

class RoomManager {
    constructor() {
        this.rooms = new Map(); // roomId -> Room
        console.log('🏠 房间管理器初始化完成');
    }
    
    createRoom(config) {
        const roomId = uuidv4();
        const room = {
            id: roomId,
            hostId: config.hostId,
            gameMode: config.gameMode,
            maxPlayers: config.maxPlayers,
            isPrivate: config.isPrivate,
            aiDifficulty: config.aiDifficulty,
            status: 'waiting', // waiting, playing, finished
            players: [],
            gameLogic: null,
            gameLoopInterval: null,
            createdAt: Date.now()
        };
        
        this.rooms.set(roomId, room);
        return room;
    }
    
    getRoom(roomId) {
        return this.rooms.get(roomId);
    }
    
    addPlayerToRoom(roomId, player) {
        const room = this.rooms.get(roomId);
        if (!room) return null;
        
        // 检查玩家是否已在房间中
        const existingPlayerIndex = room.players.findIndex(p => p.id === player.id);
        if (existingPlayerIndex === -1) {
            room.players.push(player);
        }
        
        return room;
    }
    
    removePlayerFromRoom(roomId, playerId) {
        const room = this.rooms.get(roomId);
        if (!room) return null;
        
        // 移除玩家
        room.players = room.players.filter(p => p.id !== playerId);
        
        // 如果房间为空，删除房间
        if (room.players.length === 0) {
            this.deleteRoom(roomId);
            return null;
        }
        
        // 如果房主离开，转移房主权限
        if (room.hostId === playerId && room.players.length > 0) {
            room.hostId = room.players[0].id;
        }
        
        return room;
    }
    
    deleteRoom(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) return;
        
        // 清理游戏循环
        if (room.gameLoopInterval) {
            clearInterval(room.gameLoopInterval);
        }
        
        this.rooms.delete(roomId);
        console.log(`🗑️ 房间已删除: ${roomId}`);
    }
    
    areAllPlayersReady(roomId) {
        const room = this.rooms.get(roomId);
        if (!room || room.players.length < 2) return false;
        
        return room.players.every(player => player.isReady);
    }
    
    startGame(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) return null;
        
        room.status = 'playing';
        
        // 初始化游戏逻辑
        room.gameLogic = new GameLogic({
            gameMode: room.gameMode,
            players: room.players,
            aiDifficulty: room.aiDifficulty
        });
        
        return room;
    }
    
    getRoomList() {
        const publicRooms = [];
        
        for (const room of this.rooms.values()) {
            if (!room.isPrivate && room.status === 'waiting') {
                publicRooms.push({
                    id: room.id,
                    gameMode: room.gameMode,
                    playerCount: room.players.length,
                    maxPlayers: room.maxPlayers,
                    hostName: room.players.find(p => p.id === room.hostId)?.name || '未知',
                    createdAt: room.createdAt
                });
            }
        }
        
        return publicRooms;
    }
    
    getRoomCount() {
        return this.rooms.size;
    }
    
    // 清理长时间无活动的房间
    cleanupInactiveRooms() {
        const now = Date.now();
        const INACTIVE_TIMEOUT = 30 * 60 * 1000; // 30分钟
        
        for (const [roomId, room] of this.rooms.entries()) {
            if (now - room.createdAt > INACTIVE_TIMEOUT && room.status === 'waiting') {
                this.deleteRoom(roomId);
            }
        }
    }
}

module.exports = RoomManager;