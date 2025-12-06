const dataCollector = require('../utils/dataCollector');
const { verifyToken } = require('../auth/auth');
const { ObjectId } = require('mongodb');

async function handleAnalyticsRoutes(req, res, db) {
    const { method, url } = req;
    
    // 验证token
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
    
    if (method === 'GET' && url.startsWith('/api/analytics/visualization/')) {
        const documentId = url.split('/').pop();
        await getVisualizationData(req, res, db, documentId);
    } else if (method === 'POST' && url === '/api/analytics/templates') {
        await createTemplate(req, res, db, decoded.userId);
    } else if (method === 'GET' && url.startsWith('/api/analytics/templates/')) {
        const templateId = url.split('/').pop();
        await getTemplate(req, res, db, templateId, decoded.userId);
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Analytics endpoint not found' }));
    }
}

async function getVisualizationData(req, res, db, documentId) {
    try {
        const document = await db.collection('documents').findOne({
            _id: new ObjectId(documentId)
        });
        
        if (!document) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Document not found' }));
            return;
        }
        
        const visualizationData = dataCollector.getVisualizationData(documentId);
        
        const response = {
            documentId: documentId,
            documentTitle: document.title,
            dataPoints: visualizationData,
            totalParagraphs: visualizationData.length,
            generatedAt: new Date().toISOString()
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
    } catch (error) {
        console.error('Get visualization data error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to fetch visualization data' }));
    }
}

async function createTemplate(req, res, db, userId) {
    try {
        const body = await getRequestBody(req);
        const { name, structure, description } = JSON.parse(body);
        
        if (!name || !structure) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Template name and structure are required' }));
            return;
        }
        
        const template = {
            name,
            structure,
            description: description || '',
            ownerId: new ObjectId(userId),
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        const result = await db.collection('templates').insertOne(template);
        
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            id: result.insertedId,
            name: template.name,
            createdAt: template.createdAt
        }));
    } catch (error) {
        console.error('Create template error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to create template' }));
    }
}

async function getTemplate(req, res, db, templateId, userId) {
    try {
        const template = await db.collection('templates').findOne({
            _id: new ObjectId(templateId),
            ownerId: new ObjectId(userId)
        });
        
        if (!template) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Template not found' }));
            return;
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(template));
    } catch (error) {
        console.error('Get template error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to fetch template' }));
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
    handleAnalyticsRoutes
};