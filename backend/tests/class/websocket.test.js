const WebSocket = require('ws');

// 模拟 WebSocket 服务类
class MockWebSocketService {
  constructor() {
    this.connections = new Map();
    this.messageHandlers = new Map();
    this.documentSubscriptions = new Map();
  }

  addConnection(ws, userId) {
    this.connections.set(userId, ws);
    this.emit('connection', { userId, ws });
    return true;
  }

  removeConnection(userId) {
    const deleted = this.connections.delete(userId);
    // 从所有文档订阅中移除
    for (const [docId, users] of this.documentSubscriptions) {
      if (users.has(userId)) {
        users.delete(userId);
      }
    }
    return deleted;
  }

  subscribeToDocument(userId, documentId) {
    if (!this.documentSubscriptions.has(documentId)) {
      this.documentSubscriptions.set(documentId, new Set());
    }
    this.documentSubscriptions.get(documentId).add(userId);
    return true;
  }

  unsubscribeFromDocument(userId, documentId) {
    if (this.documentSubscriptions.has(documentId)) {
      return this.documentSubscriptions.get(documentId).delete(userId);
    }
    return false;
  }

  sendToUser(userId, message) {
    const ws = this.connections.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  broadcastToDocument(documentId, message, excludeUserId = null) {
    if (!this.documentSubscriptions.has(documentId)) return 0;
    
    const users = this.documentSubscriptions.get(documentId);
    let count = 0;
    
    for (const userId of users) {
      if (userId !== excludeUserId) {
        if (this.sendToUser(userId, message)) {
          count++;
        }
      }
    }
    return count;
  }

  broadcastToAll(message, excludeUserId = null) {
    let count = 0;
    for (const [userId, ws] of this.connections) {
      if (userId !== excludeUserId && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
        count++;
      }
    }
    return count;
  }

  getConnectionCount() {
    return this.connections.size;
  }

  getDocumentSubscriberCount(documentId) {
    if (!this.documentSubscriptions.has(documentId)) return 0;
    return this.documentSubscriptions.get(documentId).size;
  }

  on(event, handler) {
    if (!this.messageHandlers.has(event)) {
      this.messageHandlers.set(event, []);
    }
    this.messageHandlers.get(event).push(handler);
  }

  emit(event, data) {
    const handlers = this.messageHandlers.get(event) || [];
    handlers.forEach(handler => handler(data));
  }
}

describe('WebSocket Service Class Tests', () => {
  let service;
  let mockWs1, mockWs2, mockWs3;

  beforeEach(() => {
    service = new MockWebSocketService();
    mockWs1 = { readyState: WebSocket.OPEN, send: jest.fn(), close: jest.fn() };
    mockWs2 = { readyState: WebSocket.OPEN, send: jest.fn(), close: jest.fn() };
    mockWs3 = { readyState: WebSocket.OPEN, send: jest.fn(), close: jest.fn() };
  });

  describe('Connection Management', () => {
    test('should add connection successfully', () => {
      const result = service.addConnection(mockWs1, 'user1');
      expect(result).toBe(true);
      expect(service.connections.has('user1')).toBe(true);
      expect(service.getConnectionCount()).toBe(1);
    });

    test('should add multiple connections', () => {
      service.addConnection(mockWs1, 'user1');
      service.addConnection(mockWs2, 'user2');
      service.addConnection(mockWs3, 'user3');
      
      expect(service.getConnectionCount()).toBe(3);
    });

    test('should remove connection successfully', () => {
      service.addConnection(mockWs1, 'user1');
      expect(service.getConnectionCount()).toBe(1);
      
      const result = service.removeConnection('user1');
      expect(result).toBe(true);
      expect(service.getConnectionCount()).toBe(0);
    });

    test('should handle removal of non-existent connection', () => {
      const result = service.removeConnection('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('Document Subscription', () => {
    test('should subscribe user to document', () => {
      service.addConnection(mockWs1, 'user1');
      const result = service.subscribeToDocument('user1', 'doc1');
      
      expect(result).toBe(true);
      expect(service.getDocumentSubscriberCount('doc1')).toBe(1);
    });

    test('should allow multiple users to subscribe to same document', () => {
      service.addConnection(mockWs1, 'user1');
      service.addConnection(mockWs2, 'user2');
      service.addConnection(mockWs3, 'user3');
      
      service.subscribeToDocument('user1', 'doc1');
      service.subscribeToDocument('user2', 'doc1');
      service.subscribeToDocument('user3', 'doc1');
      
      expect(service.getDocumentSubscriberCount('doc1')).toBe(3);
    });

    test('should allow user to subscribe to multiple documents', () => {
      service.addConnection(mockWs1, 'user1');
      
      service.subscribeToDocument('user1', 'doc1');
      service.subscribeToDocument('user1', 'doc2');
      
      expect(service.getDocumentSubscriberCount('doc1')).toBe(1);
      expect(service.getDocumentSubscriberCount('doc2')).toBe(1);
    });

    test('should unsubscribe user from document', () => {
      service.addConnection(mockWs1, 'user1');
      service.subscribeToDocument('user1', 'doc1');
      expect(service.getDocumentSubscriberCount('doc1')).toBe(1);
      
      const result = service.unsubscribeFromDocument('user1', 'doc1');
      expect(result).toBe(true);
      expect(service.getDocumentSubscriberCount('doc1')).toBe(0);
    });
  });

  describe('Message Sending', () => {
    beforeEach(() => {
      service.addConnection(mockWs1, 'user1');
      service.addConnection(mockWs2, 'user2');
    });

    test('should send message to specific user', () => {
      const result = service.sendToUser('user1', { type: 'test', data: 'hello' });
      
      expect(result).toBe(true);
      expect(mockWs1.send).toHaveBeenCalledWith(JSON.stringify({ type: 'test', data: 'hello' }));
    });

    test('should return false when user not connected', () => {
      const result = service.sendToUser('nonexistent', { type: 'test' });
      expect(result).toBe(false);
    });

    test('should broadcast to all users', () => {
      const count = service.broadcastToAll({ type: 'broadcast', data: 'to all' });
      
      expect(count).toBe(2);
      expect(mockWs1.send).toHaveBeenCalled();
      expect(mockWs2.send).toHaveBeenCalled();
    });

    test('should broadcast excluding specific user', () => {
      const count = service.broadcastToAll({ type: 'broadcast' }, 'user1');
      
      expect(count).toBe(1);
      expect(mockWs1.send).not.toHaveBeenCalled();
      expect(mockWs2.send).toHaveBeenCalled();
    });

    test('should broadcast to document subscribers only', () => {
      service.subscribeToDocument('user1', 'doc1');
      service.subscribeToDocument('user2', 'doc1');
      
      const count = service.broadcastToDocument('doc1', { type: 'doc-update' });
      
      expect(count).toBe(2);
      expect(mockWs1.send).toHaveBeenCalled();
      expect(mockWs2.send).toHaveBeenCalled();
    });

    test('should broadcast to document excluding specific user', () => {
      service.subscribeToDocument('user1', 'doc1');
      service.subscribeToDocument('user2', 'doc1');
      
      const count = service.broadcastToDocument('doc1', { type: 'doc-update' }, 'user1');
      
      expect(count).toBe(1);
      expect(mockWs1.send).not.toHaveBeenCalled();
      expect(mockWs2.send).toHaveBeenCalled();
    });

    test('should return zero when no subscribers', () => {
      const count = service.broadcastToDocument('nonexistent', { type: 'update' });
      expect(count).toBe(0);
    });
  });

  describe('Event Handling', () => {
    test('should register event handlers', () => {
      const handler = jest.fn();
      service.on('user-joined', handler);
      
      service.emit('user-joined', { userId: 'user1' });
      
      expect(handler).toHaveBeenCalledWith({ userId: 'user1' });
    });

    test('should support multiple handlers for same event', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      
      service.on('message', handler1);
      service.on('message', handler2);
      
      service.emit('message', { text: 'test' });
      
      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    test('should do nothing for events with no handlers', () => {
      expect(() => {
        service.emit('unhandled-event', { data: 'test' });
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    test('should handle sending to user with closed connection', () => {
      const closedWs = { readyState: WebSocket.CLOSED, send: jest.fn() };
      service.addConnection(closedWs, 'closed-user');
      
      const result = service.sendToUser('closed-user', { type: 'test' });
      
      expect(result).toBe(false);
      expect(closedWs.send).not.toHaveBeenCalled();
    });

    test('should handle multiple subscriptions and unsubscriptions correctly', () => {
      service.addConnection(mockWs1, 'user1');
      service.subscribeToDocument('user1', 'doc1');
      service.subscribeToDocument('user1', 'doc2');
      
      expect(service.getDocumentSubscriberCount('doc1')).toBe(1);
      expect(service.getDocumentSubscriberCount('doc2')).toBe(1);
      
      service.removeConnection('user1');
      
      expect(service.getDocumentSubscriberCount('doc1')).toBe(0);
      expect(service.getDocumentSubscriberCount('doc2')).toBe(0);
    });
  });
});