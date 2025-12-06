const { MongoClient } = require('mongodb');
const crypto = require('crypto');

function hashPassword(password) {
    return new Promise((resolve, reject) => {
        const salt = crypto.randomBytes(16).toString('hex');
        crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
            if (err) reject(err);
            resolve(`${salt}:${derivedKey.toString('hex')}`);
        });
    });
}

async function initDatabase() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const db = client.db('collaborative_editor');
        
        console.log('Initializing database...');
        
        await db.collection('users').createIndex({ email: 1 }, { unique: true });
        await db.collection('documents').createIndex({ ownerId: 1 });
        await db.collection('documents').createIndex({ updatedAt: -1 });
        await db.collection('templates').createIndex({ ownerId: 1 });
        
        console.log('✅ Database indexes created successfully');
        
        const testPassword = await hashPassword('password123');
        const testUser = {
            email: 'test@example.com',
            password: testPassword,
            createdAt: new Date(),
            settings: { theme: 'light', notifications: true }
        };
        
        try {
            const userResult = await db.collection('users').insertOne(testUser);
            console.log('✅ Test user created: test@example.com / password123');
            console.log('User ID:', userResult.insertedId);
            
            const testDocument = {
                title: 'Sample Collaborative Document',
                content: 'This is a sample document for testing.\n\nYou can edit this content in real-time.\n\nThe system tracks all changes for 3D visualization.',
                ownerId: userResult.insertedId,
                createdAt: new Date(),
                updatedAt: new Date(),
                version: 1,
                collaborators: [],
                tags: ['sample', 'test'],
                isPublic: false
            };
            
            const docResult = await db.collection('documents').insertOne(testDocument);
            console.log('✅ Sample document created with ID:', docResult.insertedId);
            
            const testTemplate = {
                name: 'Academic Paper Template',
                description: 'Standard structure for academic papers',
                structure: {
                    required: ['title', 'abstract', 'introduction', 'methodology', 'results', 'discussion', 'conclusion', 'references'],
                    optional: ['acknowledgements', 'appendix'],
                    minSections: 5,
                    maxDepth: 3
                },
                ownerId: userResult.insertedId,
                createdAt: new Date(),
                updatedAt: new Date(),
                isDefault: true
            };
            
            const templateResult = await db.collection('templates').insertOne(testTemplate);
            console.log('✅ Sample template created with ID:', templateResult.insertedId);
            
        } catch (error) {
            if (error.code === 11000) {
                console.log('ℹ️ Test user already exists, skipping creation');
            } else {
                throw error;
            }
        }
        
        console.log('\n🎉 Database initialization complete!');
        console.log('\nTest Credentials:');
        console.log('- Email: test@example.com');
        console.log('- Password: password123');
        console.log('\nAPI Endpoints:');
        console.log('- Backend: http://localhost:3001');
        console.log('- Frontend: http://localhost:3000');
        
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        process.exit(1);
    } finally {
        await client.close();
    }
}

initDatabase();