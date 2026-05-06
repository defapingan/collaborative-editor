const { verifyToken } = require('../auth/auth');
const { ObjectId } = require('mongodb');

async function handleDocumentRoutes(req, res, db) {
    const { method, url } = req;
    const urlParts = url.split('/');
    const documentId = urlParts[3];
    const subPath = urlParts[4];
    
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Authentication required' }));
            return;
        }
        
        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);
        
        if (!decoded) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid token' }));
            return;
        }
        
        const userId = decoded.userId;
        
        // 分享文档
        if (method === 'POST' && documentId && subPath === 'share') {
            await shareDocument(req, res, db, userId, documentId);
        }
        // 获取共享给我的文档
        else if (method === 'GET' && url === '/api/documents/shared-with-me') {
            await getSharedWithMe(req, res, db, userId);
        }
        // 获取我分享的文档
        else if (method === 'GET' && url === '/api/documents/sharing-with-others') {
            await getSharingWithOthers(req, res, db, userId);
        }
        // 更新协作者权限
        else if (method === 'PUT' && documentId && subPath === 'collaborator') {
            await updateCollaborator(req, res, db, userId, documentId);
        }
        // 退出协作
        else if (method === 'POST' && documentId && subPath === 'quit') {
            await quitCollaboration(req, res, db, userId, documentId);
        }
        // 标准CRUD
        else if (method === 'GET' && !documentId) {
            await getDocuments(req, res, db, userId);
        } else if (method === 'GET' && documentId) {
            await getDocument(req, res, db, userId, documentId);
        } else if (method === 'POST' && !documentId) {
            await createDocument(req, res, db, userId);
        } else if (method === 'PUT' && documentId && !subPath) {
            await updateDocument(req, res, db, userId, documentId);
        } else if (method === 'DELETE' && documentId) {
            await deleteDocument(req, res, db, userId, documentId);
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Endpoint not found' }));
        }
    } catch (error) {
        console.error('Document route error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
    }
}

async function getDocuments(req, res, db, userId) {
    try {
        const documents = await db.collection('documents')
            .find({ 
                $or: [
                    { ownerId: new ObjectId(userId) },
                    { 'collaborators.userId': new ObjectId(userId), 'collaborators.status': 'active' }
                ]
            })
            .sort({ updatedAt: -1 })
            .toArray();
        
        // 为每个文档添加类型标记
        const enrichedDocs = documents.map(doc => {
            const types = [];
            if (doc.ownerId.toString() === userId) types.push('my');
            
            const collaborator = doc.collaborators?.find(c => c.userId.toString() === userId);
            if (collaborator && collaborator.status === 'active') {
                types.push('sharedWithMe');
            }
            if (doc.ownerId.toString() === userId && doc.collaborators?.length > 0) {
                types.push('sharingWithOthers');
            }
            
            return {
                ...doc,
                _id: doc._id.toString(),
                ownerId: doc.ownerId.toString(),
                types,
                owner: { email: doc.ownerEmail || 'unknown' }
            };
        });
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(enrichedDocs));
    } catch (error) {
        console.error('Get documents error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to fetch documents' }));
    }
}

async function getSharedWithMe(req, res, db, userId) {
    try {
        const documents = await db.collection('documents')
            .find({
                'collaborators.userId': new ObjectId(userId),
                'collaborators.status': 'active'
            })
            .toArray();
        
        const enrichedDocs = documents.map(doc => ({
            ...doc,
            _id: doc._id.toString(),
            ownerId: doc.ownerId.toString(),
            types: ['sharedWithMe'],
            owner: { email: doc.ownerEmail || 'unknown' },
            permissions: doc.collaborators?.find(c => c.userId.toString() === userId)?.role || 'viewer'
        }));
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(enrichedDocs));
    } catch (error) {
        console.error('Get shared with me error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to fetch shared documents' }));
    }
}

async function getSharingWithOthers(req, res, db, userId) {
    try {
        const documents = await db.collection('documents')
            .find({ ownerId: new ObjectId(userId) })
            .toArray();
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(documents.map(doc => ({ ...doc, _id: doc._id.toString() }))));
    } catch (error) {
        console.error('Get sharing with others error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to fetch sharing documents' }));
    }
}

async function getDocument(req, res, db, userId, documentId) {
    try {
        const document = await db.collection('documents').findOne({
            _id: new ObjectId(documentId),
            $or: [
                { ownerId: new ObjectId(userId) },
                { 'collaborators.userId': new ObjectId(userId), 'collaborators.status': 'active' }
            ]
        });
        
        if (!document) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Document not found' }));
            return;
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ...document, _id: document._id.toString() }));
    } catch (error) {
        console.error('Get document error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to fetch document' }));
    }
}

// 【关键修复】创建文档函数 - 完整实现
async function createDocument(req, res, db, userId) {
    try {
        const body = await getRequestBody(req);
        console.log('📝 Create document request body:', body);
        
        const { title, content } = JSON.parse(body);
        
        if (!title) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Title is required' }));
            return;
        }
        
        // 获取用户信息
        const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
        
        const now = new Date();
        const document = {
            title: title.trim(),
            content: content || '',
            ownerId: new ObjectId(userId),
            ownerEmail: user?.email || 'unknown',
            createdAt: now,
            updatedAt: now,
            version: 1,
            collaborators: [],
            tags: [],
            editStats: {
                totalSaves: 0,
                lastSavedAt: null,
                paragraphEdits: {}
            }
        };
        
        const result = await db.collection('documents').insertOne(document);
        console.log('✅ Document created with ID:', result.insertedId);
        
        // 返回与前端期望格式一致的数据
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            id: result.insertedId.toString(),
            _id: result.insertedId.toString(),
            title: document.title,
            content: document.content,
            createdAt: document.createdAt,
            updatedAt: document.updatedAt,
            ownerId: document.ownerId.toString(),
            ownerEmail: document.ownerEmail,
            version: document.version,
            editStats: document.editStats
        }));
    } catch (error) {
        console.error('Create document error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to create document: ' + error.message }));
    }
}

// 更新文档函数 - 保持原有逻辑，添加更多日志
async function updateDocument(req, res, db, userId, documentId) {
    try {
        const body = await getRequestBody(req);
        const { content, title, paragraphId } = JSON.parse(body);
        console.log('📝 Update document:', documentId, 'content length:', content?.length);
        
        // 获取原文档以获取当前编辑统计
        const existingDoc = await db.collection('documents').findOne({
            _id: new ObjectId(documentId),
            $or: [
                { ownerId: new ObjectId(userId) },
                { 'collaborators.userId': new ObjectId(userId), 'collaborators.status': 'active', 'collaborators.role': { $in: ['admin', 'editor'] } }
            ]
        });
        
        if (!existingDoc) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Document not found or no permission' }));
            return;
        }
        
        // 初始化编辑统计
        let editStats = existingDoc.editStats || { totalSaves: 0, lastSavedAt: null, paragraphEdits: {} };
        
        // 增加保存次数
        if (content !== undefined) {
            editStats.totalSaves = (editStats.totalSaves || 0) + 1;
            editStats.lastSavedAt = new Date();
            
            // 如果是段落编辑，记录段落编辑次数
            if (paragraphId) {
                const paraKey = `paragraph_${paragraphId}`;
                editStats.paragraphEdits[paraKey] = (editStats.paragraphEdits[paraKey] || 0) + 1;
                console.log('📝 Paragraph edit:', paraKey, 'new count:', editStats.paragraphEdits[paraKey]);
            }
        }
        
        const updateFields = {
            updatedAt: new Date(),
            version: existingDoc.version + 1,
            editStats: editStats
        };
        if (content !== undefined) updateFields.content = content;
        if (title !== undefined) updateFields.title = title;
        
        const result = await db.collection('documents').updateOne(
            { _id: new ObjectId(documentId) },
            { $set: updateFields }
        );
        
        if (result.modifiedCount === 0) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Document not found' }));
            return;
        }
        
        console.log('✅ Document updated, total saves:', editStats.totalSaves);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            message: 'Document updated successfully',
            updatedAt: updateFields.updatedAt,
            version: updateFields.version,
            editStats: editStats
        }));
    } catch (error) {
        console.error('Update document error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to update document' }));
    }
}

async function deleteDocument(req, res, db, userId, documentId) {
    try {
        const result = await db.collection('documents').deleteOne({
            _id: new ObjectId(documentId),
            ownerId: new ObjectId(userId)
        });
        
        if (result.deletedCount === 0) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Document not found' }));
            return;
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Document deleted successfully' }));
    } catch (error) {
        console.error('Delete document error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to delete document' }));
    }
}

async function shareDocument(req, res, db, userId, documentId) {
    try {
        const body = await getRequestBody(req);
        const { email, role } = JSON.parse(body);
        
        const document = await db.collection('documents').findOne({
            _id: new ObjectId(documentId),
            ownerId: new ObjectId(userId)
        });
        
        if (!document) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Document not found' }));
            return;
        }
        
        const userToShare = await db.collection('users').findOne({ email });
        if (!userToShare) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'User not found' }));
            return;
        }
        
        const existingCollaborator = document.collaborators?.find(
            c => c.userId.toString() === userToShare._id.toString()
        );
        
        if (existingCollaborator) {
            await db.collection('documents').updateOne(
                { _id: new ObjectId(documentId), 'collaborators.userId': userToShare._id },
                { $set: { 'collaborators.$.status': 'active', 'collaborators.$.role': role } }
            );
        } else {
            await db.collection('documents').updateOne(
                { _id: new ObjectId(documentId) },
                { $push: { collaborators: { userId: userToShare._id, email, role, status: 'active', joinedAt: new Date() } } }
            );
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Document shared successfully' }));
    } catch (error) {
        console.error('Share document error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to share document' }));
    }
}

async function updateCollaborator(req, res, db, userId, documentId) {
    try {
        const body = await getRequestBody(req);
        const { collaboratorId, role, action } = JSON.parse(body);
        
        if (action === 'kick') {
            await db.collection('documents').updateOne(
                { _id: new ObjectId(documentId), ownerId: new ObjectId(userId) },
                { $set: { 'collaborators.$[elem].status': 'kicked' } },
                { arrayFilters: [{ 'elem.userId': new ObjectId(collaboratorId) }] }
            );
        } else if (role) {
            await db.collection('documents').updateOne(
                { _id: new ObjectId(documentId), ownerId: new ObjectId(userId) },
                { $set: { 'collaborators.$[elem].role': role } },
                { arrayFilters: [{ 'elem.userId': new ObjectId(collaboratorId) }] }
            );
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Collaborator updated successfully' }));
    } catch (error) {
        console.error('Update collaborator error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to update collaborator' }));
    }
}

async function quitCollaboration(req, res, db, userId, documentId) {
    try {
        await db.collection('documents').updateOne(
            { _id: new ObjectId(documentId) },
            { $set: { 'collaborators.$[elem].status': 'quit' } },
            { arrayFilters: [{ 'elem.userId': new ObjectId(userId) }] }
        );
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Quit collaboration successfully' }));
    } catch (error) {
        console.error('Quit collaboration error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to quit collaboration' }));
    }
}

function getRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            resolve(body);
        });
        req.on('error', reject);
    });
}

module.exports = {
    handleDocumentRoutes
};