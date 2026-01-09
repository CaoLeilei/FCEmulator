// 兼容性测试运行器
import { testCompatibility } from './dist/core/cpu/tests/test-compatibility.js';

console.log('🚀 开始运行兼容性测试...');
try {
  testCompatibility();
} catch (error) {
  console.error('测试运行出错:', error.message);
}