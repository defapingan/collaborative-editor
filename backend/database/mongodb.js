const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb://localhost:27017/collaborative_editor';
let dbInstance = null;

async function connectToDatabase() {
    if (dbInstance) return dbInstance;
    
    try {
        const client = new MongoClient(MONGODB_URI);
        await client.connect();
        dbInstance = client.db();
        console.log('✅ Database connected successfully');
        return dbInstance;
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        throw error;
    }
}

function getDatabase() {
    if (!dbInstance) {
        throw new Error('Database not connected. Call connectToDatabase first.');
    }
    return dbInstance;
}

module.exports = {
    connectToDatabase,
    getDatabase
};