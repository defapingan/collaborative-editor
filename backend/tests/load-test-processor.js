const WebSocket = require('ws');

module.exports = {
  // 模拟 WebSocket 连接
  simulateWebSocketConnection: (userContext, events, done) => {
    const docId = userContext.vars.docId;
    const userId = userContext.vars.userId;
    
    try {
      const ws = new WebSocket(`ws://localhost:3001`);
      
      ws.on('open', () => {
        console.log(`[Simulation] WebSocket opened for doc ${docId}`);
        ws.send(JSON.stringify({
          type: 'auth',
          userId: userId,
          userName: `User_${userId}`
        }));
        
        setTimeout(() => {
          ws.send(JSON.stringify({
            type: 'join-document',
            documentId: docId,
            userId: userId,
            userName: `User_${userId}`
          }));
        }, 100);
      });
      
      ws.on('message', (data) => {
        const message = JSON.parse(data);
        if (message.type === 'user-list') {
          console.log(`[Simulation] User list received: ${message.users.length} users online`);
          ws.close();
          return done();
        }
      });
      
      ws.on('error', (error) => {
        console.error(`[Simulation] WebSocket error:`, error);
        done();
      });
      
      setTimeout(() => {
        ws.close();
        done();
      }, 5000);
    } catch (error) {
      console.error(`[Simulation] Failed to create WebSocket:`, error);
      done();
    }
  },
  
  // 模拟编辑操作
  simulateEditing: (userContext, events, done) => {
    // 模拟多种编辑操作
    const operations = [
      { type: 'insert', text: 'New content added ' },
      { type: 'delete', position: 0, length: 5 },
      { type: 'replace', oldText: 'test', newText: 'updated' }
    ];
    
    const randomOp = operations[Math.floor(Math.random() * operations.length)];
    console.log(`[Simulation] Simulating edit operation: ${randomOp.type}`);
    
    done();
  }
};