const dataCollector = require('../utils/dataCollector');
const { ObjectId } = require('mongodb');

function setupWebSocket(wss, db) {
    const documentClients = new Map(); // documentId -> Map of userId -> { ws, userName, lastSeen }
    // 【修改】改为追踪每个用户加入了哪些文档：userId -> Set of documentId
    const userDocuments = new Map();
    
    // 心跳检测：每30秒检查一次
    const heartbeatInterval = setInterval(() => {
        const now = Date.now();
        
        for (const [docId, userMap] of documentClients.entries()) {
            for (const [userId, userInfo] of userMap.entries()) {
                if (now - userInfo.lastSeen > 45000) {
                    console.log(`User ${userId} timed out in document ${docId}`);
                    userMap.delete(userId);
                    
                    // 【修改】从用户文档列表中移除
                    removeUserFromDocument(userId, docId, userDocuments);
                    
                    broadcastToDocumentClients(docId, documentClients, null, {
                        type: 'user-left',
                        userId: userId,
                        userName: userInfo.userName,
                        documentId: docId,
                        timestamp: now
                    });
                    
                    // 【新增】检查用户是否还有其他文档在线
                    checkAndBroadcastGlobalStatus(userId, userInfo.userName, userDocuments, wss);
                }
            }
            if (userMap.size === 0) {
                documentClients.delete(docId);
            }
        }
    }, 30000);
    
    wss.on('connection', (ws, req) => {
        console.log('✅ New WebSocket connection established');
        
        let currentDocumentId = null;
        let currentUserId = null;
        let currentUserName = null;
        
        // 立即发送欢迎消息测试连接
        ws.send(JSON.stringify({ type: 'welcome', message: 'Connected to WebSocket server' }));
        
        ws.on('message', async (message) => {
            try {
                const data = JSON.parse(message);
                console.log('📨 WebSocket message received:', data.type, 'userId:', data.userId);
                
                switch (data.type) {
                    case 'auth':
                        currentUserId = data.userId;
                        currentUserName = data.userName || 'User';
                        ws.userId = data.userId;
                        ws.userName = currentUserName;
                        
                        console.log(`🔐 User authenticated: ${currentUserId} (${currentUserName})`);
                        ws.send(JSON.stringify({ type: 'auth-success', userId: data.userId }));
                        break;
                        
                    case 'join-document':
                        try {
                            console.log(`📝 Joining document: ${data.documentId}, user: ${data.userId}`);
                            await handleJoinDocument(ws, data, documentClients, db, userDocuments, wss);
                            currentDocumentId = data.documentId;
                            currentUserId = data.userId;
                            currentUserName = data.userName || 'User';
                            console.log(`✅ Successfully joined document: ${currentDocumentId}`);
                        } catch (err) {
                            console.error('❌ Failed to join document:', err);
                            ws.send(JSON.stringify({ type: 'error', message: 'Failed to join document: ' + err.message }));
                        }
                        break;
                        
                    case 'text-update':
                        await handleTextUpdate(ws, data, documentClients, db);
                        break;
                        
                    case 'cursor-update':
                        broadcastToDocumentClients(currentDocumentId, documentClients, ws, {
                            type: 'cursor-update',
                            userId: currentUserId,
                            userName: currentUserName,
                            position: data.position,
                            documentId: currentDocumentId,
                            timestamp: Date.now()
                        });
                        break;
                        
                    case 'heartbeat':
                        if (currentDocumentId && currentUserId && documentClients.has(currentDocumentId)) {
                            const userMap = documentClients.get(currentDocumentId);
                            if (userMap.has(currentUserId)) {
                                userMap.get(currentUserId).lastSeen = Date.now();
                            }
                        }
                        ws.send(JSON.stringify({ type: 'heartbeat-ack', timestamp: Date.now() }));
                        break;
                        
                    case 'leave-document':
                        handleLeaveDocument(ws, currentDocumentId, currentUserId, documentClients, userDocuments, wss);
                        currentDocumentId = null;
                        break;
                        
                    default:
                        console.log(`Unknown message type: ${data.type}`);
                }
            } catch (error) {
                console.error('❌ WebSocket message parse error:', error);
                ws.send(JSON.stringify({ type: 'error', message: 'Failed to process message' }));
            }
        });
        
        ws.on('close', (code, reason) => {
            console.log(`🔌 WebSocket connection closed for user: ${currentUserId}, code: ${code}, reason: ${reason || 'no reason'}`);
            if (currentDocumentId && currentUserId) {
                handleLeaveDocument(ws, currentDocumentId, currentUserId, documentClients, userDocuments, wss);
            }
        });
        
        ws.on('error', (error) => {
            console.error('❌ WebSocket error:', error);
        });
    });
    
    wss.on('close', () => {
        clearInterval(heartbeatInterval);
    });
}

// 【新增】将用户从文档中移除，并检查是否需要广播离线
function removeUserFromDocument(userId, documentId, userDocuments) {
    if (userDocuments.has(userId)) {
        userDocuments.get(userId).delete(documentId);
        if (userDocuments.get(userId).size === 0) {
            userDocuments.delete(userId);
        }
    }
}

// 【新增】检查用户是否完全没有文档在线，如果有变化则广播
function checkAndBroadcastGlobalStatus(userId, userName, userDocuments, wss) {
    const hasDocuments = userDocuments.has(userId) && userDocuments.get(userId).size > 0;
    
    if (!hasDocuments) {
        // 用户完全离线（没有任何文档在线），广播离线消息
        console.log(`🔴 User completely offline: ${userId} (${userName})`);
        broadcastToAllClients(wss, {
            type: 'user-offline',
            userId: userId,
            userName: userName,
            timestamp: Date.now()
        });
        userDocuments.delete(userId);
    }
}

// 【新增】广播给所有连接的客户端
function broadcastToAllClients(wss, message) {
    const messageStr = JSON.stringify(message);
    wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
            client.send(messageStr);
        }
    });
    console.log(`📡 Global broadcast: ${message.type} for user ${message.userName} (${message.userId})`);
}

async function handleJoinDocument(ws, data, documentClients, db, userDocuments, wss) {
    const { documentId, userId, userName } = data;
    
    // 验证 documentId 是否有效
    if (!documentId || !ObjectId.isValid(documentId)) {
        console.error(`Invalid documentId: ${documentId}`);
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid document ID' }));
        return;
    }
    
    // 【新增】检查是否是用户加入的第一个文档
    const isFirstDocument = !userDocuments.has(userId) || userDocuments.get(userId).size === 0;
    
    if (!documentClients.has(documentId)) {
        documentClients.set(documentId, new Map());
    }
    
    const userMap = documentClients.get(documentId);
    
    userMap.set(userId, {
        ws: ws,
        userName: userName || 'User',
        lastSeen: Date.now()
    });
    
    ws.userId = userId;
    ws.userName = userName || 'User';
    
    // 【新增】记录用户加入的文档
    if (!userDocuments.has(userId)) {
        userDocuments.set(userId, new Set());
    }
    userDocuments.get(userId).add(documentId);
    
    // 获取文档内容
    try {
        const document = await db.collection('documents').findOne({ _id: new ObjectId(documentId) });
        if (document) {
            ws.send(JSON.stringify({
                type: 'document-content',
                content: document.content || '',
                version: document.version || 1,
                title: document.title || 'Untitled'
            }));
            console.log(`📄 Sent document content to ${userId}, content length: ${document.content?.length || 0}`);
        } else {
            console.warn(`Document not found: ${documentId}`);
            ws.send(JSON.stringify({ type: 'error', message: 'Document not found' }));
        }
    } catch (error) {
        console.error('Error fetching document:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Failed to fetch document' }));
    }
    
    // 通知文档内其他用户有新用户加入
    broadcastToDocumentClients(documentId, documentClients, ws, {
        type: 'user-joined',
        userId: userId,
        userName: userName || 'User',
        documentId: documentId,
        timestamp: Date.now()
    });
    
    // 【新增】如果这是用户的第一个文档，全局广播上线
    if (isFirstDocument) {
        console.log(`🟢 User came online (first document): ${userId} (${userName})`);
        broadcastToAllClients(wss, {
            type: 'user-online',
            userId: userId,
            userName: userName || 'User',
            timestamp: Date.now()
        });
    }
    
    // 发送当前用户列表给新用户
    const users = Array.from(userMap.entries())
        .filter(([uid, info]) => uid !== userId)
        .map(([uid, info]) => ({ userId: uid, userName: info.userName }));
    
    ws.send(JSON.stringify({
        type: 'user-list',
        users: users,
        documentId: documentId
    }));
    
    console.log(`✅ Client ${userName} (${userId}) joined document: ${documentId}, total users: ${userMap.size}`);
}

async function handleTextUpdate(ws, data, documentClients, db) {
    const { documentId, content, version, userId, userName, paragraphId } = data;
    
    // 记录编辑数据
    if (paragraphId && userId) {
        dataCollector.recordEdit(documentId, paragraphId, userId, 'edit');
        dataCollector.updateParagraphLength(documentId, paragraphId, content?.length || 0);
    }
    
    // 保存到数据库
    try {
        await db.collection('documents').updateOne(
            { _id: new ObjectId(documentId) },
            { $set: { content: content, updatedAt: new Date(), version: version } }
        );
    } catch (error) {
        console.error('Error saving to database:', error);
    }
    
    // 广播给同一文档的其他客户端
    broadcastToDocumentClients(documentId, documentClients, ws, {
        type: 'text-update',
        content: content,
        version: version,
        userId: userId,
        userName: userName,
        paragraphId: paragraphId,
        documentId: documentId,
        timestamp: new Date().toISOString()
    });
}

function handleLeaveDocument(ws, documentId, userId, documentClients, userDocuments, wss) {
    if (!documentId || !documentClients.has(documentId)) return;
    
    const userMap = documentClients.get(documentId);
    const userInfo = userMap.get(userId);
    const userName = userInfo?.userName || 'User';
    
    userMap.delete(userId);
    
    // 通知文档内其他用户
    broadcastToDocumentClients(documentId, documentClients, null, {
        type: 'user-left',
        userId: userId,
        userName: userName,
        documentId: documentId,
        timestamp: Date.now()
    });
    
    if (userMap.size === 0) {
        documentClients.delete(documentId);
    }
    
    // 【修改】从用户文档列表中移除
    removeUserFromDocument(userId, documentId, userDocuments);
    
    // 【新增】检查用户是否完全离线
    const hasDocuments = userDocuments.has(userId) && userDocuments.get(userId).size > 0;
    if (!hasDocuments) {
        console.log(`🔴 User completely offline: ${userId} (${userName})`);
        broadcastToAllClients(wss, {
            type: 'user-offline',
            userId: userId,
            userName: userName,
            timestamp: Date.now()
        });
    }
    
    console.log(`👋 User ${userName} (${userId}) left document: ${documentId}, remaining users: ${userMap.size}, still online: ${hasDocuments}`);
}

function broadcastToDocumentClients(documentId, documentClients, senderWs, message) {
    if (!documentClients.has(documentId)) return;
    
    const userMap = documentClients.get(documentId);
    const messageStr = JSON.stringify(message);
    
    for (const [userId, userInfo] of userMap.entries()) {
        const client = userInfo.ws;
        if (client !== senderWs && client.readyState === client.OPEN) {
            client.send(messageStr);
        }
    }
}

module.exports = {
    setupWebSocket
};