#!/usr/bin/env node

import { runAllTests } from './dist/cpu-test.js';

console.log('🚀 运行完整CPU测试套件\n');

try {
  const success = runAllTests();
  process.exit(success ? 0 : 1);
} catch (error) {
  console.error('❌ 测试执行失败:', error);
  process.exit(1);
}