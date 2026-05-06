class WebSocketService {
    constructor() {
        this.socket = null;
        this.documentId = null;
        this.userId = null;
        this.messageHandlers = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectTimeout = null;
        this.isConnecting = false;
    }
    
    connect(documentId, userId, userName) {
        if (this.isConnecting) return;
        
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.leaveDocument();
            this.socket.close();
        }
        
        this.documentId = documentId;
        this.userId = userId;
        this.userName = userName;
        this.isConnecting = true;
        
        this.socket = new WebSocket('ws://localhost:3001');
        
        this.socket.onopen = () => {
            console.log('✅ WebSocket connected');
            this.reconnectAttempts = 0;
            this.isConnecting = false;
            
            // 发送认证信息
            this.send({
                type: 'auth',
                userId: this.userId
            });
            
            // 加入文档
            setTimeout(() => {
                this.joinDocument();
            }, 100);
        };
        
        this.socket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                this.handleMessage(message);
            } catch (error) {
                console.error('Failed to parse WebSocket message:', error);
            }
        };
        
        this.socket.onclose = () => {
            console.log('WebSocket disconnected');
            this.isConnecting = false;
            this.attemptReconnect();
        };
        
        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.isConnecting = false;
        };
    }
    
    joinDocument() {
        if (this.socket && this.socket.readyState === WebSocket.OPEN && this.documentId && this.userId) {
            this.send({
                type: 'join-document',
                documentId: this.documentId,
                userId: this.userId,
                userName: this.userName
            });
        }
    }
    
    leaveDocument() {
        if (this.socket && this.socket.readyState === WebSocket.OPEN && this.documentId) {
            this.send({
                type: 'leave-document',
                documentId: this.documentId
            });
        }
    }
    
    sendTextUpdate(content, version, paragraphId = null) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.send({
                type: 'text-update',
                documentId: this.documentId,
                content: content,
                version: version,
                userId: this.userId,
                userName: this.userName,
                paragraphId: paragraphId
            });
        }
    }
    
    sendCursorUpdate(position) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.send({
                type: 'cursor-update',
                documentId: this.documentId,
                userId: this.userId,
                userName: this.userName,
                position: position
            });
        }
    }
    
    send(message) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message));
        } else {
            console.warn('WebSocket not connected, cannot send message:', message.type);
        }
    }
    
    handleMessage(message) {
        const handlers = this.messageHandlers.get(message.type) || [];
        handlers.forEach(handler => handler(message));
        
        if (message.type === 'error') {
            console.error('WebSocket error message:', message);
        }
    }
    
    on(messageType, handler) {
        if (!this.messageHandlers.has(messageType)) {
            this.messageHandlers.set(messageType, []);
        }
        this.messageHandlers.get(messageType).push(handler);
    }
    
    off(messageType, handler) {
        if (this.messageHandlers.has(messageType)) {
            const handlers = this.messageHandlers.get(messageType);
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }
    
    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts && this.documentId && this.userId) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            
            if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = setTimeout(() => {
                this.connect(this.documentId, this.userId, this.userName);
            }, 3000 * Math.min(this.reconnectAttempts, 5));
        }
    }
    
    disconnect() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        
        if (this.socket) {
            this.leaveDocument();
            this.socket.close();
            this.socket = null;
        }
        
        this.messageHandlers.clear();
        this.documentId = null;
        this.userId = null;
        this.isConnecting = false;
    }
    
    isConnected() {
        return this.socket && this.socket.readyState === WebSocket.OPEN;
    }
}

export const websocketService = new WebSocketService();