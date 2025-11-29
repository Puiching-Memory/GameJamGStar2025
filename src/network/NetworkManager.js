/**
 * 网络管理器
 * 处理WebSocket连接和游戏状态同步
 */
export class NetworkManager {
    constructor() {
        this.ws = null;
        this.roomId = null;
        this.playerId = null;
        this.playerRole = null; // 'player' 或 'opponent'
        this.isConnected = false;
        this.isInRoom = false;
        this.isGameStarted = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000;
        
        // 事件回调
        this.onRoomJoined = null;
        this.onGameStarted = null;
        this.onCardPlayed = null;
        this.onTurnEnded = null;
        this.onGameStateUpdated = null;
        this.onOpponentDisconnected = null;
        this.onError = null;
    }

    /**
     * 连接到服务器
     */
    connect(serverUrl = null) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.log('已经连接到服务器');
            return;
        }

        // 默认使用当前页面的WebSocket地址
        if (!serverUrl) {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            let host = window.location.host;
            const hostname = window.location.hostname;
            const port = window.location.port;
            
            // 开发模式下，如果端口是3000（vite dev server），则连接到18000端口（FastAPI服务器）
            // 或者如果当前端口不是18000，且是localhost，则尝试18000
            if (port === '3000' || (port === '' && hostname === 'localhost')) {
                // Vite开发服务器，连接到FastAPI服务器
                host = `${hostname}:18000`;
            } else if (port && port !== '18000' && (hostname === 'localhost' || hostname === '127.0.0.1')) {
                // 其他本地端口，尝试18000
                host = `${hostname}:18000`;
            }
            // 如果已经是18000端口或生产环境，使用当前host
            
            serverUrl = `${protocol}//${host}/ws/game`;
        }

        console.log('正在连接到服务器:', serverUrl);
        
        try {
            this.ws = new WebSocket(serverUrl);
            this.setupEventHandlers();
        } catch (error) {
            console.error('连接失败:', error);
            if (this.onError) {
                this.onError(error);
            }
        }
    }

    /**
     * 设置WebSocket事件处理器
     */
    setupEventHandlers() {
        this.ws.onopen = () => {
            console.log('WebSocket连接已建立');
            this.isConnected = true;
            this.reconnectAttempts = 0;
        };

        this.ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                this.handleMessage(message);
            } catch (error) {
                console.error('解析消息失败:', error);
            }
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket错误:', error);
            if (this.onError) {
                this.onError(error);
            }
        };

        this.ws.onclose = () => {
            console.log('WebSocket连接已关闭');
            this.isConnected = false;
            this.isInRoom = false;
            
            // 尝试重连
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectAttempts++;
                console.log(`尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
                setTimeout(() => {
                    this.connect();
                }, this.reconnectDelay);
            }
        };
    }

    /**
     * 处理服务器消息
     */
    handleMessage(message) {
        const type = message.type;
        
        switch (type) {
            case 'waiting_for_opponent':
                console.log('等待对手加入...');
                break;
                
            case 'room_joined':
                this.roomId = message.room_id;
                this.playerRole = message.player_role;
                this.isInRoom = true;
                console.log('已加入房间:', this.roomId, '角色:', this.playerRole);
                if (this.onRoomJoined) {
                    this.onRoomJoined({
                        roomId: this.roomId,
                        playerRole: this.playerRole,
                        opponentId: message.opponent_id
                    });
                }
                break;
                
            case 'game_started':
                this.isGameStarted = true;
                console.log('游戏已开始');
                if (this.onGameStarted) {
                    this.onGameStarted(message.game_state);
                }
                break;
                
            case 'card_played':
                if (this.onCardPlayed) {
                    this.onCardPlayed({
                        playerId: message.player_id,
                        playerRole: message.player_role,
                        card: message.card
                    });
                }
                break;
                
            case 'turn_ended':
                if (this.onTurnEnded) {
                    this.onTurnEnded({
                        newTurn: message.new_turn,
                        turnNumber: message.turn_number,
                        gameState: message.game_state
                    });
                }
                break;
                
            case 'game_state_updated':
                if (this.onGameStateUpdated) {
                    this.onGameStateUpdated(message.game_state);
                }
                break;
                
            case 'opponent_disconnected':
                console.log('对手断开连接');
                if (this.onOpponentDisconnected) {
                    this.onOpponentDisconnected();
                }
                break;
                
            case 'matchmaking_cancelled':
                console.log('匹配已取消');
                this.isInRoom = false;
                break;
                
            case 'pong':
                // 心跳响应
                break;
                
            default:
                console.log('未知消息类型:', type);
        }
    }

    /**
     * 发送消息到服务器
     */
    sendMessage(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        } else {
            console.error('WebSocket未连接，无法发送消息');
        }
    }

    /**
     * 取消匹配
     */
    cancelMatchmaking() {
        this.sendMessage({ type: 'cancel_matchmaking' });
    }

    /**
     * 开始游戏
     */
    startGame() {
        this.sendMessage({ type: 'start_game' });
    }

    /**
     * 出牌
     */
    playCard(card) {
        this.sendMessage({
            type: 'play_card',
            card: card
        });
    }

    /**
     * 结束回合
     */
    endTurn() {
        this.sendMessage({ type: 'end_turn' });
    }

    /**
     * 更新游戏状态
     */
    updateGameState(gameState) {
        this.sendMessage({
            type: 'update_game_state',
            game_state: gameState
        });
    }

    /**
     * 发送心跳
     */
    ping() {
        this.sendMessage({ type: 'ping' });
    }

    /**
     * 断开连接
     */
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
        this.isInRoom = false;
        this.isGameStarted = false;
    }

    /**
     * 获取连接状态
     */
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            isInRoom: this.isInRoom,
            isGameStarted: this.isGameStarted,
            roomId: this.roomId,
            playerRole: this.playerRole
        };
    }
}

