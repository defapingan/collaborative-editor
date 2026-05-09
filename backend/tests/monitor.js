const os = require('os');
const fs = require('fs');
const axios = require('axios');

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      cpu: [],
      memory: [],
      responseTimes: [],
      errorCount: 0,
      requestCount: 0
    };
    this.startTime = Date.now();
  }

  // 收集 CPU 使用率
  collectCPUUsage() {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;
    
    cpus.forEach(cpu => {
      for (let type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });
    
    const usage = 100 - (totalIdle / totalTick) * 100;
    this.metrics.cpu.push({
      timestamp: Date.now(),
      usage: usage
    });
    return usage;
  }

  // 收集内存使用率
  collectMemoryUsage() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const usage = (usedMem / totalMem) * 100;
    
    this.metrics.memory.push({
      timestamp: Date.now(),
      usage: usage,
      usedMB: usedMem / (1024 * 1024),
      totalMB: totalMem / (1024 * 1024)
    });
    return usage;
  }

  // 收集 Node.js 进程内存
  collectProcessMemory() {
    const memUsage = process.memoryUsage();
    this.metrics.processMemory = {
      rss: memUsage.rss / (1024 * 1024),
      heapTotal: memUsage.heapTotal / (1024 * 1024),
      heapUsed: memUsage.heapUsed / (1024 * 1024),
      external: memUsage.external / (1024 * 1024)
    };
    return this.metrics.processMemory;
  }

  // 记录 API 响应时间
  recordResponseTime(url, timeMs, success = true) {
    this.metrics.responseTimes.push({
      url,
      timeMs,
      success,
      timestamp: Date.now()
    });
    this.metrics.requestCount++;
    if (!success) this.metrics.errorCount++;
  }

  // 获取 MongoDB 统计信息
  async getMongoDBStats(db) {
    try {
      const stats = await db.stats();
      return {
        collections: stats.collections,
        objects: stats.objects,
        avgObjSize: stats.avgObjSize,
        dataSize: stats.dataSize / (1024 * 1024),
        storageSize: stats.storageSize / (1024 * 1024),
        indexes: stats.indexes,
        indexSize: stats.indexSize / (1024 * 1024)
      };
    } catch (error) {
      console.error('Failed to get MongoDB stats:', error);
      return null;
    }
  }

  // 生成报告
  generateReport() {
    const endTime = Date.now();
    const duration = (endTime - this.startTime) / 1000;
    
    // 计算统计信息
    const avgCpu = this.metrics.cpu.reduce((sum, m) => sum + m.usage, 0) / this.metrics.cpu.length;
    const maxCpu = Math.max(...this.metrics.cpu.map(m => m.usage));
    const avgMemory = this.metrics.memory.reduce((sum, m) => sum + m.usage, 0) / this.metrics.memory.length;
    const maxMemory = Math.max(...this.metrics.memory.map(m => m.usage));
    
    const responseTimes = this.metrics.responseTimes.filter(r => r.success).map(r => r.timeMs);
    const avgResponseTime = responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length;
    const p95ResponseTime = this.getPercentile(responseTimes, 95);
    const p99ResponseTime = this.getPercentile(responseTimes, 99);
    
    const errorRate = (this.metrics.errorCount / this.metrics.requestCount) * 100;
    
    const report = {
      testDuration: `${duration} seconds`,
      timestamp: new Date().toISOString(),
      
      // 并发能力
      concurrentCapability: {
        maxConcurrentUsers: this.estimateMaxConcurrentUsers(),
        maxConcurrentEditors: this.estimateMaxConcurrentEditors(),
        limitingFactor: this.identifyLimitingFactor(),
        recommendation: this.generateRecommendation()
      },
      
      // 资源使用
      resourceUsage: {
        cpu: {
          average: `${avgCpu.toFixed(2)}%`,
          peak: `${maxCpu.toFixed(2)}%`
        },
        memory: {
          system: {
            average: `${avgMemory.toFixed(2)}%`,
            peak: `${maxMemory.toFixed(2)}%`
          },
          process: this.metrics.processMemory
        }
      },
      
      // API 性能
      apiPerformance: {
        totalRequests: this.metrics.requestCount,
        errorRate: `${errorRate.toFixed(2)}%`,
        responseTime: {
          average: `${avgResponseTime.toFixed(2)}ms`,
          p95: `${p95ResponseTime.toFixed(2)}ms`,
          p99: `${p99ResponseTime.toFixed(2)}ms`
        }
      },
      
      // 结论
      conclusion: this.generateConclusion(avgResponseTime, errorRate, maxCpu, maxMemory)
    };
    
    // 保存报告
    const reportPath = `./tests/reports/perf-report-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📊 Performance report saved to: ${reportPath}`);
    
    // 打印摘要
    this.printSummary(report);
    
    return report;
  }

  getPercentile(arr, percentile) {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  estimateMaxConcurrentUsers() {
    // 基于资源使用估算最大并发用户数
    const avgCpu = this.metrics.cpu.reduce((sum, m) => sum + m.usage, 0) / this.metrics.cpu.length;
    const avgMem = this.metrics.memory.reduce((sum, m) => sum + m.usage, 0) / this.metrics.memory.length;
    
    // 假设 CPU 75% 或内存 80% 为瓶颈
    const cpuLimit = avgCpu > 0 ? (75 / avgCpu) * (this.metrics.requestCount / 10) : 100;
    const memLimit = avgMem > 0 ? (80 / avgMem) * 100 : 100;
    
    return Math.floor(Math.min(cpuLimit, memLimit, 50)); // 最多报告50
  }

  estimateMaxConcurrentEditors() {
    // 估算同一文档的最大协作者数
    // 基于 WebSocket 连接和操作同步的开销
    return Math.floor(this.estimateMaxConcurrentUsers() * 0.3);
  }

  identifyLimitingFactor() {
    const avgCpu = this.metrics.cpu.reduce((sum, m) => sum + m.usage, 0) / this.metrics.cpu.length;
    const avgMem = this.metrics.memory.reduce((sum, m) => sum + m.usage, 0) / this.metrics.memory.length;
    
    if (avgCpu > 70) return "CPU - High utilization indicates CPU-bound operations";
    if (avgMem > 70) return "Memory - High memory usage may require optimization";
    return "Network/IO - Consider database indexing or query optimization";
  }

  generateRecommendation() {
    const avgCpu = this.metrics.cpu.reduce((sum, m) => sum + m.usage, 0) / this.metrics.cpu.length;
    const avgMem = this.metrics.memory.reduce((sum, m) => sum + m.usage, 0) / this.metrics.memory.length;
    
    const recommendations = [];
    if (avgCpu > 60) recommendations.push("Consider optimizing CPU-intensive operations (OT algorithms)");
    if (avgMem > 60) recommendations.push("Implement connection pooling and session timeout");
    if (this.metrics.errorCount > 10) recommendations.push("Add retry logic and improve error handling");
    
    recommendations.push("Implement WebSocket connection scaling (horizontal scaling)");
    recommendations.push("Add Redis for session management across instances");
    
    return recommendations;
  }

  generateConclusion(avgResponseTime, errorRate, maxCpu, maxMemory) {
    let grade = "A";
    let assessment = "";
    
    if (avgResponseTime < 200 && errorRate < 1 && maxCpu < 60 && maxMemory < 60) {
      grade = "A";
      assessment = "Excellent performance. System handles load efficiently with low latency.";
    } else if (avgResponseTime < 500 && errorRate < 5 && maxCpu < 80 && maxMemory < 80) {
      grade = "B";
      assessment = "Good performance. Suitable for moderate production use.";
    } else if (avgResponseTime < 1000 && errorRate < 10) {
      grade = "C";
      assessment = "Acceptable performance but needs optimization for production.";
    } else {
      grade = "D";
      assessment = "Performance issues detected. Urgent optimization required.";
    }
    
    return { grade, assessment };
  }

  printSummary(report) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 PERFORMANCE TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`\n📈 CONCURRENT CAPABILITY:`);
    console.log(`   - Max Concurrent Users: ~${report.concurrentCapability.maxConcurrentUsers}`);
    console.log(`   - Max Concurrent Editors/Doc: ~${report.concurrentCapability.maxConcurrentEditors}`);
    console.log(`   - Limiting Factor: ${report.concurrentCapability.limitingFactor}`);
    
    console.log(`\n💻 RESOURCE USAGE:`);
    console.log(`   - CPU (Avg/Peak): ${report.resourceUsage.cpu.average} / ${report.resourceUsage.cpu.peak}`);
    console.log(`   - Memory (Avg/Peak): ${report.resourceUsage.memory.system.average} / ${report.resourceUsage.memory.system.peak}`);
    
    console.log(`\n⚡ API PERFORMANCE:`);
    console.log(`   - Requests: ${report.apiPerformance.totalRequests}`);
    console.log(`   - Error Rate: ${report.apiPerformance.errorRate}`);
    console.log(`   - Response Time (Avg/P95/P99): ${report.apiPerformance.responseTime.average} / ${report.apiPerformance.responseTime.p95} / ${report.apiPerformance.responseTime.p99}`);
    
    console.log(`\n🎯 CONCLUSION:`);
    console.log(`   - Grade: ${report.conclusion.grade}`);
    console.log(`   - Assessment: ${report.conclusion.assessment}`);
    
    console.log(`\n📝 RECOMMENDATIONS:`);
    report.concurrentCapability.recommendation.forEach((rec, i) => {
      console.log(`   ${i + 1}. ${rec}`);
    });
    console.log('\n' + '='.repeat(60));
  }
}

module.exports = PerformanceMonitor;