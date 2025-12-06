const { authenticateUser, registerUser } = require('../auth/auth');

async function handleAuthRoutes(req, res, db) {
    const { method, url } = req;
    
    if (method === 'POST' && url === '/api/auth/login') {
        await handleLogin(req, res, db);
    } else if (method === 'POST' && url === '/api/auth/register') {
        await handleRegister(req, res, db);
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Authentication endpoint not found' }));
    }
}

async function handleLogin(req, res, db) {
    try {
        const body = await getRequestBody(req);
        const { email, password } = JSON.parse(body);
        
        if (!email || !password) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Email and password required' }));
            return;
        }
        
        const result = await authenticateUser(email, password, db);
        
        if (result.success) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                token: result.token, 
                user: result.user 
            }));
        } else {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: result.error }));
        }
    } catch (error) {
        console.error('Login route error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
    }
}

async function handleRegister(req, res, db) {
    try {
        const body = await getRequestBody(req);
        const { email, password } = JSON.parse(body);
        
        if (!email || !password) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Email and password required' }));
            return;
        }
        
        if (password.length < 6) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Password must be at least 6 characters' }));
            return;
        }
        
        const result = await registerUser(email, password, db);
        
        if (result.success) {
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                token: result.token, 
                user: result.user 
            }));
        } else {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: result.error }));
        }
    } catch (error) {
        console.error('Register route error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
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
    handleAuthRoutes
};