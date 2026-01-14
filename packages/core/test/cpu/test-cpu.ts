#!/usr/bin/env node

/**
 * CPU测试运行脚本
 * 用于快速运行CPU指令集测试
 */

import { runAllTests, TEST_SUITES } from '@/core/cpu/tests/index.js';

console.log('🎮 FC/NES CPU测试套件');
console.log('='.repeat(50));

// 运行所有测试
const success = runAllTests();

// 显示测试套件信息
console.log('\n📋 可用测试套件:');
TEST_SUITES.forEach((suite, index) => {
  console.log(`  ${index + 1}. ${suite.name} (${suite.file})`);
});

// 退出码
process.exit(success ? 0 : 1);