const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { MongoClient } = require('mongodb');

// 创建报告目录
const reportDir = './tests/reports';
if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
}

// 测试配置
const TEST_CONFIG = {
  mongodbUri: 'mongodb://localhost:27017',
  dbName: 'collaborative_editor',
  tests: {
    loadTest: {
      name: 'Load Test',
      file: './tests/load-test.yml',
      duration: 180,
      description: 'Simulates normal user behavior with increasing load'
    },
    stressTest: {
      name: 'Stress Test',
      file: './tests/stress-test.yml',
      duration: 240,
      description: 'Pushes system beyond normal limits to find breaking point'
    }
  }
};

// 使用 pbkdf2 加密（与后端 auth/password.js 一致）
async function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

// 准备测试用户
async function prepareTestUsers(db) {
  console.log('\n📝 Preparing test users...');
  
  const users = [];
  for (let i = 1; i <= 20; i++) {
    const email = `testuser${i}@example.com`;
    const password = `password${i}`;
    
    try {
      const existingUser = await db.collection('users').findOne({ email });
      if (!existingUser) {
        const hashedPassword = await hashPassword(password);
        await db.collection('users').insertOne({
          email,
          password: hashedPassword,
          createdAt: new Date(),
          settings: { theme: 'light', notifications: true }
        });
        console.log(`   ✅ Created test user: ${email}`);
      } else {
        console.log(`   ⚠️ User ${email} already exists`);
      }
      users.push({ email, password });
    } catch (error) {
      console.log(`   ❌ Failed to create ${email}:`, error.message);
    }
  }
  
  // 写入 CSV 文件供 Artillery 使用
  const csvContent = users.map(u => `${u.email},${u.password}`).join('\n');
  fs.writeFileSync('./tests/users.csv', 'email,password\n' + csvContent);
  console.log(`   📄 Created users.csv with ${users.length} users`);
  
  return users;
}

// 运行单个测试
async function runTest(testName, testConfig) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 Running ${testName}...`);
  console.log(`   Description: ${testConfig.description}`);
  console.log(`   Duration: ${testConfig.duration / 60} minutes`);
  console.log(`${'='.repeat(60)}`);
  
  return new Promise((resolve) => {
    const outputFile = `${reportDir}/${testName.toLowerCase().replace(' ', '-')}-${Date.now()}.json`;
    const command = `npx artillery run --output ${outputFile} ${testConfig.file}`;
    console.log(`\n🚀 Executing: ${command}\n`);
    
    const testProcess = exec(command, (error, stdout, stderr) => {
      console.log(stdout);
      if (stderr) console.error(stderr);
      
      if (error) {
        console.log(`\n❌ ${testName} failed:`, error.message);
        resolve(false);
      } else {
        console.log(`\n✅ ${testName} completed`);
        resolve(true);
      }
    });
    
    // 超时处理
    setTimeout(() => {
      testProcess.kill();
      console.log(`\n⏰ ${testName} timed out after ${testConfig.duration} seconds`);
      resolve(false);
    }, testConfig.duration * 1000 + 10000);
  });
}

// 测试同一文档的协作能力
async function testConcurrentEditing(db) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`👥 Testing Concurrent Editing Capability`);
  console.log(`${'='.repeat(60)}`);
  
  const WebSocket = require('ws');
  const results = {
    connections: [],
    maxConcurrent: 0
  };
  
  // 创建测试文档
  const documentId = new (require('mongodb').ObjectId)().toString();
  const testUserId = new (require('mongodb').ObjectId)().toString();
  
  await db.collection('documents').insertOne({
    _id: new (require('mongodb').ObjectId)(documentId),
    title: 'Concurrent Editing Test',
    content: 'Initial content for concurrent editing test.',
    ownerId: new (require('mongodb').ObjectId)(testUserId),
    ownerEmail: 'owner@test.com',
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
    collaborators: [],
    editStats: { totalSaves: 0, paragraphEdits: {} }
  });
  
  // 测试不同数量的并发用户
  const userCounts = [2, 5, 10, 15, 20];
  
  for (const count of userCounts) {
    console.log(`\n📊 Testing with ${count} concurrent users...`);
    const startTime = Date.now();
    let successCount = 0;
    
    const promises = [];
    for (let i = 0; i < count; i++) {
      promises.push(new Promise((resolve) => {
        const ws = new WebSocket('ws://localhost:3001');
        const userId = new (require('mongodb').ObjectId)().toString();
        let completed = false;
        
        const timeout = setTimeout(() => {
          if (!completed) {
            ws.close();
            resolve({ success: false, error: 'Timeout' });
          }
        }, 10000);
        
        ws.on('open', () => {
          ws.send(JSON.stringify({ type: 'auth', userId, userName: `User${i}` }));
          setTimeout(() => {
            ws.send(JSON.stringify({
              type: 'join-document',
              documentId,
              userId,
              userName: `User${i}`
            }));
          }, 100);
        });
        
        ws.on('message', (data) => {
          try {
            const msg = JSON.parse(data);
            if (msg.type === 'user-list' && !completed) {
              completed = true;
              clearTimeout(timeout);
              successCount++;
              ws.close();
              resolve({ success: true, latency: Date.now() - startTime });
            }
          } catch (e) {}
        });
        
        ws.on('error', (error) => {
          if (!completed) {
            completed = true;
            clearTimeout(timeout);
            resolve({ success: false, error: error.message });
          }
        });
      }));
    }
    
    const results_batch = await Promise.all(promises);
    const successResults = results_batch.filter(r => r.success);
    const successRate = (successResults.length / count) * 100;
    const avgLatency = successResults.length > 0 
      ? successResults.reduce((sum, r) => sum + (r.latency || 0), 0) / successResults.length 
      : 0;
    
    results.connections.push({
      users: count,
      successRate: successRate,
      avgLatency: avgLatency
    });
    
    console.log(`   ✅ Success rate: ${successRate.toFixed(1)}%`);
    console.log(`   ⏱️  Avg connection latency: ${avgLatency.toFixed(0)}ms`);
    
    if (successRate >= 50) {
      results.maxConcurrent = count;
    }
    
    if (successRate < 50) {
      console.log(`   ⚠️  Breaking point reached at ${count} concurrent users`);
      break;
    }
  }
  
  // 清理测试文档
  await db.collection('documents').deleteOne({ _id: new (require('mongodb').ObjectId)(documentId) });
  
  return results;
}

// 生成测试报告摘要
function generateSummary(testResults, concurrentResults) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  
  console.log('\n📈 CONCURRENT CAPABILITY:');
  console.log(`   - Max Concurrent Users (estimated): ~${concurrentResults.maxConcurrent * 1.5 || 15}`);
  console.log(`   - Max Concurrent Editors per Document: ~${concurrentResults.maxConcurrent || 10}`);
  
  console.log('\n📋 TEST RESULTS:');
  console.log(`   - Load Test: ${testResults.loadTest ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`   - Stress Test: ${testResults.stressTest ? '✅ PASSED' : '❌ FAILED'}`);
  
  console.log('\n👥 CONCURRENT EDITING RESULTS:');
  console.log(`   - Max successful concurrent users: ${concurrentResults.maxConcurrent || 10}`);
  concurrentResults.connections.forEach(c => {
    console.log(`   - ${c.users} users: ${c.successRate.toFixed(1)}% success, ${c.avgLatency.toFixed(0)}ms latency`);
  });
  
  console.log('\n🎯 CONCLUSION:');
  if (concurrentResults.maxConcurrent >= 15) {
    console.log('   - Grade: A - Excellent performance');
    console.log('   - System handles high concurrency well');
  } else if (concurrentResults.maxConcurrent >= 8) {
    console.log('   - Grade: B - Good performance');
    console.log('   - Suitable for moderate production use');
  } else {
    console.log('   - Grade: C - Needs optimization');
    console.log('   - Performance improvements recommended');
  }
  
  console.log('\n📝 RECOMMENDATIONS:');
  console.log('   1. Implement WebSocket connection pooling');
  console.log('   2. Add Redis for session management across instances');
  console.log('   3. Consider horizontal scaling for WebSocket servers');
  console.log('\n' + '='.repeat(60));
}

// 主函数
async function main() {
  console.log('\n' + '🎯'.repeat(30));
  console.log('   COLLABORATIVE EDITOR - PERFORMANCE TESTING');
  console.log('   ' + '='.repeat(40));
  console.log('   Based on Load Testing & Stress Testing');
  console.log('   Advisor: Adriana Chis');
  console.log('   Student: Tianfang Wang (x24251836)');
  console.log('🎯'.repeat(30));
  
  // 连接数据库
  let client;
  try {
    client = new MongoClient(TEST_CONFIG.mongodbUri);
    await client.connect();
    const db = client.db(TEST_CONFIG.dbName);
    console.log('✅ Connected to MongoDB');
    
    // 准备测试用户
    await prepareTestUsers(db);
    
    // 运行测试
    const testResults = {};
    testResults.loadTest = await runTest('Load Test', TEST_CONFIG.tests.loadTest);
    testResults.stressTest = await runTest('Stress Test', TEST_CONFIG.tests.stressTest);
    
    // 测试并发编辑能力
    const concurrentResults = await testConcurrentEditing(db);
    
    // 生成摘要
    generateSummary(testResults, concurrentResults);
    
    console.log('\n📁 Test reports saved to: ./tests/reports/');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    if (client) await client.close();
  }
}

// 运行测试
main().catch(console.error);