const dataCollector = require('../utils/dataCollector');

function setupWebSocket(wss, db) {
    const documentClients = new Map();
    
    wss.on('connection', (ws) => {
        console.log('✅ New WebSocket connection established');
        
        let currentDocumentId = null;
        
        ws.on('message', async (message) => {
            try {
                const data = JSON.parse(message);
                
                switch (data.type) {
                    case 'join-document':
                        await handleJoinDocument(ws, data.documentId, documentClients);
                        currentDocumentId = data.documentId;
                        break;
                        
                    case 'text-update':
                        await handleTextUpdate(ws, data, documentClients, db);
                        break;
                        
                    case 'cursor-update':
                        broadcastToDocumentClients(
                            currentDocumentId, 
                            documentClients, 
                            ws, 
                            data
                        );
                        break;
                        
                    case 'request-analytics':
                        const vizData = dataCollector.getVisualizationData(data.documentId);
                        ws.send(JSON.stringify({
                            type: 'analytics-data',
                            data: vizData
                        }));
                        break;
                }
            } catch (error) {
                console.error('WebSocket message error:', error);
                ws.send(JSON.stringify({ 
                    type: 'error', 
                    message: 'Failed to process message' 
                }));
            }
        });
        
        ws.on('close', () => {
            console.log('WebSocket connection closed');
            if (currentDocumentId && documentClients.has(currentDocumentId)) {
                const clients = documentClients.get(currentDocumentId);
                const index = clients.indexOf(ws);
                if (index > -1) clients.splice(index, 1);
                if (clients.length === 0) documentClients.delete(currentDocumentId);
            }
        });
    });
}

async function handleJoinDocument(ws, documentId, documentClients) {
    if (!documentClients.has(documentId)) {
        documentClients.set(documentId, []);
    }
    
    const clients = documentClients.get(documentId);
    if (!clients.includes(ws)) {
        clients.push(ws);
    }
    
    ws.send(JSON.stringify({
        type: 'joined-document',
        documentId: documentId,
        message: 'Successfully joined document'
    }));
    
    console.log(`Client joined document: ${documentId}, total clients: ${clients.length}`);
}

async function handleTextUpdate(ws, data, documentClients, db) {
    const { documentId, content, version, paragraphId } = data;
    
    // 记录编辑数据到收集器
    if (paragraphId && data.userId) {
        dataCollector.recordEdit(documentId, paragraphId, data.userId, 'edit');
        dataCollector.updateParagraphLength(documentId, paragraphId, content.length);
    }
    
    // 广播给同一文档的其他客户端
    broadcastToDocumentClients(documentId, documentClients, ws, {
        type: 'text-update',
        content: content,
        version: version,
        paragraphId: paragraphId,
        timestamp: new Date().toISOString()
    });
}

function broadcastToDocumentClients(documentId, documentClients, senderWs, message) {
    if (!documentClients.has(documentId)) return;
    
    const clients = documentClients.get(documentId);
    clients.forEach(client => {
        if (client !== senderWs && client.readyState === client.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
}

module.exports = {
    setupWebSocket
};