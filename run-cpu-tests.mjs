#!/usr/bin/env node

// 运行所有CPU测试套件
async function runAllSuites() {
  console.log('🚀 开始运行完整的CPU测试套件...\n');
  
  const testSuites = [
    { name: '基础指令测试', module: './dist/core/cpu/tests/basic.test.js', function: 'testBasicInstructions' },
    { name: '加载指令测试', module: './dist/core/cpu/tests/load.test.js', function: 'testLoadInstructions' },
    { name: '寻址模式测试', module: './dist/core/cpu/tests/test-addressing-modes.js', function: 'testAddressingModes' },
    { name: '存储指令测试', module: './dist/core/cpu/tests/test-store-instructions.js', function: 'testStoreInstructions' },
    { name: '分支指令测试', module: './dist/core/cpu/tests/test-branch-instructions.js', function: 'testBranchInstructions' },
    { name: '算术指令测试', module: './dist/core/cpu/tests/test-arithmetic-instructions.js', function: 'testArithmeticInstructions' },
    { name: '逻辑指令测试', module: './dist/core/cpu/tests/test-logic-instructions.js', function: 'testLogicInstructions' },
    { name: '移位指令测试', module: './dist/core/cpu/tests/test-shift-instructions.js', function: 'testShiftInstructions' },
    { name: '栈操作指令测试', module: './dist/core/cpu/tests/test-stack-instructions.js', function: 'testStackInstructions' },
    { name: '指令解码器测试', module: './dist/core/cpu/tests/test-instruction-decoder.js', function: 'testInstructionDecoder' },
    { name: '兼容性测试', module: './dist/core/cpu/tests/test-compatibility.js', function: 'testCompatibility' }
  ];
  
  const results = [];
  let totalPassed = 0;
  
  for (const suite of testSuites) {
    console.log('='.repeat(60));
    console.log(`🧪 ${suite.name}`);
    console.log('='.repeat(60));
    
    try {
      const module = await import(suite.module);
      const result = module[suite.function]();
      results.push({ name: suite.name, passed: result, error: null });
      
      if (result) {
        totalPassed++;
        console.log(`✅ ${suite.name} 通过\n`);
      } else {
        console.log(`❌ ${suite.name} 失败\n`);
      }
    } catch (error) {
      console.error(`❌ ${suite.name} 运行错误:`, error.message);
      results.push({ name: suite.name, passed: false, error: error.message });
    }
  }
  
  // 汇总结果
  console.log('='.repeat(60));
  console.log('📊 测试结果汇总:');
  console.log('='.repeat(60));
  
  for (const result of results) {
    const status = result.passed ? '✅ 通过' : '❌ 失败';
    console.log(`${status} ${result.name}`);
    if (result.error) {
      console.log(`   错误: ${result.error}`);
    }
  }
  
  console.log('='.repeat(60));
  console.log(`🎯 总体结果: ${totalPassed}/${testSuites.length} 个测试套件通过`);
  
  if (totalPassed === testSuites.length) {
    console.log('🎉 所有测试套件都通过了！CPU实现质量良好。');
    console.log('💡 建议继续添加更多边界测试和性能测试。');
  } else {
    console.log('⚠️  部分测试套件失败，需要检查实现。');
    console.log('🔧 请检查失败的测试用例并修复相关实现。');
  }
  
  return totalPassed === testSuites.length;
}

// 运行测试
runAllSuites().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('测试运行失败:', error);
  process.exit(1);
});