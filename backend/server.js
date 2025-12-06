const http = require('http');
const { MongoClient } = require('mongodb');
const WebSocket = require('ws');
const { handleAuthRoutes } = require('./routes/auth');
const { handleDocumentRoutes } = require('./routes/documents');
const { handleAnalyticsRoutes } = require('./routes/analytics');
const { setupWebSocket } = require('./websocket/websocket');

const MONGODB_URI = 'mongodb://localhost:27017/collaborative_editor';
let db;

const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    try {
        if (req.url.startsWith('/api/auth')) {
            await handleAuthRoutes(req, res, db);
        } else if (req.url.startsWith('/api/documents')) {
            await handleDocumentRoutes(req, res, db);
        } else if (req.url.startsWith('/api/analytics')) {
            await handleAnalyticsRoutes(req, res, db);
        } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                status: 'online', 
                message: 'Collaborative Editor API',
                version: '1.0.0',
                endpoints: ['/api/auth', '/api/documents', '/api/analytics']
            }));
        }
    } catch (error) {
        console.error('Server error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
    }
});

async function initializeServer() {
    try {
        const client = new MongoClient(MONGODB_URI);
        await client.connect();
        db = client.db();
        console.log('✅ Connected to MongoDB');
        
        const wss = new WebSocket.Server({ server });
        setupWebSocket(wss, db);
        
        const PORT = 3001;
        server.listen(PORT, () => {
            console.log(`✅ Server running on http://localhost:${PORT}`);
            console.log(`✅ WebSocket server ready for real-time communication`);
        });
    } catch (error) {
        console.error('❌ Failed to initialize server:', error);
        process.exit(1);
    }
}

initializeServer();