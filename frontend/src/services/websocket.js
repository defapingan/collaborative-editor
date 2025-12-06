class WebSocketService {
    constructor() {
        this.socket = null;
        this.documentId = null;
        this.userId = null;
        this.messageHandlers = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }
    
    connect(documentId, userId) {
        if (this.socket) {
            this.disconnect();
        }
        
        this.documentId = documentId;
        this.userId = userId;
        this.socket = new WebSocket('ws://localhost:3001');
        
        this.socket.onopen = () => {
            console.log('✅ WebSocket connected');
            this.reconnectAttempts = 0;
            this.joinDocument(documentId, userId);
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
            this.attemptReconnect();
        };
        
        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }
    
    joinDocument(documentId, userId) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.send({
                type: 'join-document',
                documentId: documentId,
                userId: userId
            });
        }
    }
    
    send(message) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message));
        } else {
            console.warn('WebSocket not connected, cannot send message:', message);
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
            
            setTimeout(() => {
                this.connect(this.documentId, this.userId);
            }, 3000 * this.reconnectAttempts);
        }
    }
    
    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        this.messageHandlers.clear();
        this.documentId = null;
        this.userId = null;
    }
    
    isConnected() {
        return this.socket && this.socket.readyState === WebSocket.OPEN;
    }
}

export const websocketService = new WebSocketService();