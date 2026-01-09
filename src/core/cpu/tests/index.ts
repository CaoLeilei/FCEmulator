// CPU测试套件入口文件
// 导出所有测试函数，便于单独运行或集成到更大的测试框架中

export { testBasicInstructions } from './basic.test.js';
export { testLoadInstructions } from './load.test.js';
export { testAddressingModes } from './test-addressing-modes.js';
export { testStoreInstructions } from './test-store-instructions.js';
export { testBranchInstructions } from './test-branch-instructions.js';
export { testArithmeticInstructions } from './test-arithmetic-instructions.js';
export { testLogicInstructions } from './test-logic-instructions.js';
export { testShiftInstructions } from './test-shift-instructions.js';
export { testStackInstructions } from './test-stack-instructions.js';
export { testInstructionDecoder } from './test-instruction-decoder.js';
export { testCompatibility } from './test-compatibility.js';

// 导出测试运行器
export { runAllTests } from './run-all-tests.js';

// 测试套件信息
export const TEST_SUITES = [
  { name: '基础指令测试', file: 'basic.test.js', function: 'testBasicInstructions' },
  { name: '加载指令测试', file: 'load.test.js', function: 'testLoadInstructions' },
  { name: '寻址模式测试', file: 'test-addressing-modes.js', function: 'testAddressingModes' },
  { name: '存储指令测试', file: 'test-store-instructions.js', function: 'testStoreInstructions' },
  { name: '分支指令测试', file: 'test-branch-instructions.js', function: 'testBranchInstructions' },
  { name: '算术指令测试', file: 'test-arithmetic-instructions.js', function: 'testArithmeticInstructions' },
  { name: '逻辑指令测试', file: 'test-logic-instructions.js', function: 'testLogicInstructions' },
  { name: '移位指令测试', file: 'test-shift-instructions.js', function: 'testShiftInstructions' },
  { name: '栈操作指令测试', file: 'test-stack-instructions.js', function: 'testStackInstructions' },
  { name: '指令解码器测试', file: 'test-instruction-decoder.js', function: 'testInstructionDecoder' },
  { name: '兼容性测试', file: 'test-compatibility.js', function: 'testCompatibility' }
];

// 测试统计
export const TEST_STATS = {
  totalSuites: TEST_SUITES.length,
  coverageAreas: [
    '基础功能',
    '数据传送',
    '寻址模式',
    '算术运算',
    '逻辑运算',
    '移位操作',
    '程序控制',
    '栈操作',
    '标志操作',
    '寄存器传送'
  ]
};

// 默认导出运行器
import { runAllTests } from './run-all-tests.js';
export default runAllTests;