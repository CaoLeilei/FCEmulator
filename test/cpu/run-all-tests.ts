// 测试运行器 - 运行所有CPU测试
import { testBasicInstructions } from './basic.test.js';
import { testLoadInstructions } from './load.test.js';
import { testAddressingModes } from './test-addressing-modes.js';
import { testStoreInstructions } from './test-store-instructions.js';
import { testBranchInstructions } from './test-branch-instructions.js';
import { testArithmeticInstructions } from './test-arithmetic-instructions.js';
import { testLogicInstructions } from './test-logic-instructions.js';
import { testShiftInstructions } from './test-shift-instructions.js';
import { testStackInstructions } from './test-stack-instructions.js';
import { testInstructionDecoder } from './test-instruction-decoder.js';
import { testCompatibility } from './test-compatibility.js';

export function runAllTests() {
  console.log('🚀 开始运行完整的CPU测试套件...\n');

  const testResults = {
    basic: { name: '基础指令测试', passed: false, count: 0, total: 0 },
    load: { name: '加载指令测试', passed: false, count: 0, total: 0 },
    addressing: { name: '寻址模式测试', passed: false, count: 0, total: 0 },
    store: { name: '存储指令测试', passed: false, count: 0, total: 0 },
    branch: { name: '分支指令测试', passed: false, count: 0, total: 0 },
    arithmetic: { name: '算术指令测试', passed: false, count: 0, total: 0 },
    logic: { name: '逻辑指令测试', passed: false, count: 0, total: 0 },
    shift: { name: '移位指令测试', passed: false, count: 0, total: 0 },
    stack: { name: '栈操作指令测试', passed: false, count: 0, total: 0 },
    decoder: { name: '指令解码器测试', passed: false, count: 0, total: 0 },
    compatibility: { name: '兼容性测试', passed: false, count: 0, total: 0 }
  };

  try {
    // 运行各项测试
    console.log('='.repeat(60));
    testResults.basic.passed = testBasicInstructions();
    console.log('');

    console.log('='.repeat(60));
    testResults.load.passed = testLoadInstructions();
    console.log('');

    console.log('='.repeat(60));
    testResults.addressing.passed = testAddressingModes();
    console.log('');

    console.log('='.repeat(60));
    testResults.store.passed = testStoreInstructions();
    console.log('');

    console.log('='.repeat(60));
    testResults.branch.passed = testBranchInstructions();
    console.log('');

    console.log('='.repeat(60));
    testResults.arithmetic.passed = testArithmeticInstructions();
    console.log('');

    console.log('='.repeat(60));
    testResults.logic.passed = testLogicInstructions();
    console.log('');

    console.log('='.repeat(60));
    testResults.shift.passed = testShiftInstructions();
    console.log('');

    console.log('='.repeat(60));
    testResults.stack.passed = testStackInstructions();
    console.log('');

    console.log('='.repeat(60));
    testResults.decoder.passed = testInstructionDecoder();
    console.log('');

    console.log('='.repeat(60));
    testResults.compatibility.passed = testCompatibility();
    console.log('');

  } catch (error) {
    console.error('❌ 测试运行过程中发生错误:', error);
  }

  // 统计结果
  console.log('='.repeat(60));
  console.log('📊 测试结果汇总:');
  console.log('='.repeat(60));

  let totalPassed = 0;
  let totalTests = Object.keys(testResults).length;

  for (const [, result] of Object.entries(testResults)) {
    const status = result.passed ? '✅ 通过' : '❌ 失败';
    console.log(`${status} ${result.name}`);
    if (!result.passed) {
      console.log(`   ${result.count}/${result.total} 个测试用例通过`);
    }
    if (result.passed) totalPassed++;
  }

  console.log('='.repeat(60));
  console.log(`🎯 总体结果: ${totalPassed}/${totalTests} 个测试套件通过`);

  if (totalPassed === totalTests) {
    console.log('🎉 所有测试套件都通过了！CPU实现质量良好。');
    console.log('💡 建议继续添加更多边界测试和性能测试。');
  } else {
    console.log('⚠️  部分测试套件失败，需要检查实现。');
    console.log('🔧 请检查失败的测试用例并修复相关实现。');
  }

  console.log('\n📈 测试覆盖范围:');
  console.log('  ✅ 基础功能 - NOP, BRK');
  console.log('  ✅ 数据传送 - LDA, LDX, LDY, STA, STX, STY');
  console.log('  ✅ 寻址模式 - 13种6502寻址模式');
  console.log('  ✅ 算术运算 - ADC, SBC, CMP, CPX, CPY');
  console.log('  ✅ 逻辑运算 - AND, ORA, EOR, BIT');
  console.log('  ✅ 移位操作 - ASL, LSR, ROL, ROR, INC, DEC');
  console.log('  ✅ 程序控制 - JMP, JSR, RTS, RTI, 分支指令');
  console.log('  ✅ 栈操作 - PHA, PHP, PLA, PLP');
  console.log('  ✅ 标志操作 - CLC, CLD, CLI, CLV, SEC, SED, SEI');
  console.log('  ✅ 寄存器传送 - TAX, TAY, TXA, TYA, TSX, TXS');

  console.log('\n🚀 下一步建议:');
  if (totalPassed === totalTests) {
    console.log('  1. 添加NES官方测试ROM验证');
    console.log('  2. 实现性能基准测试');
    console.log('  3. 添加时序精确性验证');
    console.log('  4. 集成完整的NES游戏测试');
  } else {
    console.log('  1. 修复失败的测试用例');
    console.log('  2. 确保所有指令都正确实现');
    console.log('  3. 验证标志位处理');
    console.log('  4. 检查寻址模式实现');
  }

  return totalPassed === totalTests;
}

// 浏览器环境，将函数添加到全局对象
if (typeof window !== 'undefined') {
  (window as any).runAllTests = runAllTests;
}