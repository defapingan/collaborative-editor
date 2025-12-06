const crypto = require('crypto');
const { hashPassword, verifyPassword } = require('./password');

const JWT_SECRET = process.env.JWT_SECRET || 'collaborative-editor-secret-key-2025';

function generateToken(payload) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
        .createHmac('sha256', JWT_SECRET)
        .update(`${header}.${payloadEncoded}`)
        .digest('base64url');
    
    return `${header}.${payloadEncoded}.${signature}`;
}

function verifyToken(token) {
    try {
        const [header, payload, signature] = token.split('.');
        const expectedSignature = crypto
            .createHmac('sha256', JWT_SECRET)
            .update(`${header}.${payload}`)
            .digest('base64url');
        
        if (signature !== expectedSignature) return null;
        return JSON.parse(Buffer.from(payload, 'base64url').toString());
    } catch (error) {
        console.error('Token verification error:', error);
        return null;
    }
}

async function authenticateUser(email, password, db) {
    try {
        console.log('🔍 [DEBUG] Authenticating user:', email);
        console.log('🔍 [DEBUG] Password provided (first 3 chars):', password.substring(0, 3) + '***');
        
        const user = await db.collection('users').findOne({ email });
        
        if (!user) {
            console.log('❌ [DEBUG] User not found in database:', email);
            return { success: false, error: 'User not found' };
        }
        
        console.log('✅ [DEBUG] User found:', user.email);
        console.log('🔍 [DEBUG] Stored password hash:', user.password);
        console.log('🔍 [DEBUG] Hash algorithm:', user.password.startsWith('$2b$') ? 'bcrypt' : 
                   user.password.startsWith('$2a$') ? 'bcrypt' : 
                   user.password.startsWith('$2y$') ? 'bcrypt' : 'unknown');
        
        console.log('🔍 [DEBUG] Calling verifyPassword function...');
        const isPasswordValid = await verifyPassword(password, user.password);
        console.log('🔍 [DEBUG] verifyPassword result:', isPasswordValid);
        
        if (!isPasswordValid) {
            console.log('❌ [DEBUG] Password validation failed for user:', email);
            console.log('🔍 [DEBUG] Input password:', password);
            console.log('🔍 [DEBUG] Stored hash:', user.password);
            return { success: false, error: 'Invalid password' };
        }
        
        console.log('✅ [DEBUG] Password validation successful for user:', email);
        const token = generateToken({ 
            userId: user._id.toString(), 
            email: user.email 
        });
        
        return { 
            success: true, 
            token, 
            user: { id: user._id, email: user.email } 
        };
    } catch (error) {
        console.error('❌ [DEBUG] Authentication error:', error);
        console.error('❌ [DEBUG] Error stack:', error.stack);
        return { success: false, error: 'Authentication failed' };
    }
}

async function registerUser(email, password, db) {
    try {
        console.log('🔍 [DEBUG] Registering new user:', email);
        
        const existingUser = await db.collection('users').findOne({ email });
        if (existingUser) {
            console.log('❌ [DEBUG] User already exists:', email);
            return { success: false, error: 'User already exists' };
        }
        
        console.log('🔍 [DEBUG] Hashing password...');
        const hashedPassword = await hashPassword(password);
        console.log('✅ [DEBUG] Password hashed successfully');
        console.log('🔍 [DEBUG] Generated hash:', hashedPassword);
        
        const result = await db.collection('users').insertOne({
            email,
            password: hashedPassword,
            createdAt: new Date(),
            settings: {
                theme: 'light',
                notifications: true
            }
        });
        
        console.log('✅ [DEBUG] User inserted with ID:', result.insertedId);
        const token = generateToken({ 
            userId: result.insertedId.toString(), 
            email 
        });
        
        return { 
            success: true, 
            token, 
            user: { id: result.insertedId, email } 
        };
    } catch (error) {
        console.error('❌ [DEBUG] Registration error:', error);
        console.error('❌ [DEBUG] Error stack:', error.stack);
        return { success: false, error: 'Registration failed' };
    }
}

module.exports = {
    generateToken,
    verifyToken,
    authenticateUser,
    registerUser
};