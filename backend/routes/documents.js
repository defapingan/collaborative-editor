const { verifyToken } = require('../auth/auth');
const { ObjectId } = require('mongodb');

async function handleDocumentRoutes(req, res, db) {
    const { method, url } = req;
    const urlParts = url.split('/');
    const documentId = urlParts[3];
    
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
        
        if (method === 'GET' && !documentId) {
            await getDocuments(req, res, db, userId);
        } else if (method === 'GET' && documentId) {
            await getDocument(req, res, db, userId, documentId);
        } else if (method === 'POST' && !documentId) {
            await createDocument(req, res, db, userId);
        } else if (method === 'PUT' && documentId) {
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
            .find({ ownerId: new ObjectId(userId) })
            .project({ content: 0 })
            .toArray();
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(documents));
    } catch (error) {
        console.error('Get documents error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to fetch documents' }));
    }
}

async function getDocument(req, res, db, userId, documentId) {
    try {
        const document = await db.collection('documents').findOne({
            _id: new ObjectId(documentId),
            ownerId: new ObjectId(userId)
        });
        
        if (!document) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Document not found' }));
            return;
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(document));
    } catch (error) {
        console.error('Get document error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to fetch document' }));
    }
}

async function createDocument(req, res, db, userId) {
    try {
        const body = await getRequestBody(req);
        const { title, content } = JSON.parse(body);
        
        if (!title) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Title is required' }));
            return;
        }
        
        const document = {
            title,
            content: content || '',
            ownerId: new ObjectId(userId),
            createdAt: new Date(),
            updatedAt: new Date(),
            version: 1
        };
        
        const result = await db.collection('documents').insertOne(document);
        
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            id: result.insertedId,
            title: document.title,
            createdAt: document.createdAt
        }));
    } catch (error) {
        console.error('Create document error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to create document' }));
    }
}

async function updateDocument(req, res, db, userId, documentId) {
    try {
        const body = await getRequestBody(req);
        const { content, version } = JSON.parse(body);
        
        const result = await db.collection('documents').updateOne(
            { 
                _id: new ObjectId(documentId),
                ownerId: new ObjectId(userId)
            },
            { 
                $set: { 
                    content: content || '',
                    updatedAt: new Date(),
                    version: version || 1
                } 
            }
        );
        
        if (result.modifiedCount === 0) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Document not found' }));
            return;
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            message: 'Document updated successfully',
            updatedAt: new Date()
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