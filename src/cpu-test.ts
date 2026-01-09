/**
 * CPU 指令集实现验证
 */

import { CPU } from './core/cpu/index.js';
import { Memory } from './core/memory/index.js';
import { TestCartridge } from './test-cartridge.js';

// 导入生成的测试套件
import { 
  runAllTests, 
  TEST_SUITES, 
  TEST_STATS,
  testBasicInstructions as testBasicInstructionsSuite,
  testLoadInstructions as testLoadInstructionsSuite,
  testAddressingModes,
  testStoreInstructions as testStoreInstructionsSuite,
  testBranchInstructions,
  testArithmeticInstructions,
  testLogicInstructions,
  testShiftInstructions,
  testStackInstructions,
  testInstructionDecoder,
  testCompatibility
} from './core/cpu/tests/index.js';

/**
 * 主测试函数 - 运行完整的CPU测试套件
 */
export function testCPUInstructions(options?: {
  runOriginal?: boolean;      // 是否运行原始测试
  runGenerated?: boolean;     // 是否运行生成的测试套件
  specificSuite?: string;     // 运行特定测试套件
  verbose?: boolean;          // 详细输出模式
}): void {
  const opts = {
    runOriginal: true,
    runGenerated: true,
    specificSuite: undefined as string | undefined,
    verbose: false,
    ...options
  };

  console.log('🧪 开始 CPU 指令集完整测试...');
  console.log('=====================================');

  // 1. 运行原始测试（如果启用）
  if (opts.runOriginal) {
    console.log('\n📋 运行原始功能验证测试...\n');
    runOriginalTests();
  }

  // 2. 运行生成的测试套件（如果启用）
  if (opts.runGenerated) {
    console.log('\n📋 运行生成的测试套件...\n');
    if (opts.specificSuite) {
      runSpecificTestSuite(opts.specificSuite, opts.verbose);
    } else {
      runAllTests();
    }
  }

  // 3. 显示测试统计
  showTestStatistics();

  console.log('\n🎉 CPU 指令集测试完成!');
}

/**
 * 运行原始的验证测试
 */
function runOriginalTests(): void {
  const memory = new Memory();
  const cpu = new CPU(memory);
  
  // 设置测试卡带
  const testCartridge = new TestCartridge();
  memory.setTestCartridge(testCartridge);

  // 设置测试程序
  setupTestProgram(memory);

  // 重置CPU
  cpu.reset();

  console.log('✅ 已实现的指令数量:', cpu.getImplementedCount());

  // 测试基础指令
  testBasicInstructions(cpu, memory);

  // 测试加载指令
  testLoadInstructions(cpu, memory);

  // 测试存储指令
  testStoreInstructions(cpu, memory);
}

/**
 * 运行特定的测试套件
 */
function runSpecificTestSuite(suiteName: string, verbose: boolean = false): void {
  const suite = TEST_SUITES.find(s => s.name.includes(suiteName) || s.function.includes(suiteName));
  
  if (!suite) {
    console.error(`❌ 未找到测试套件: ${suiteName}`);
    console.log('可用的测试套件:');
    TEST_SUITES.forEach(s => console.log(`  - ${s.name} (${s.function})`));
    return;
  }

  console.log(`🎯 运行特定测试套件: ${suite.name}`);
  
  try {
    // 使用已导入的函数
    let testFunction: (() => boolean) | undefined;
    
    switch (suite.function) {
      case 'testBasicInstructions':
        testFunction = testBasicInstructionsSuite;
        break;
      case 'testLoadInstructions':
        testFunction = testLoadInstructionsSuite;
        break;
      case 'testStoreInstructions':
        testFunction = testStoreInstructionsSuite;
        break;
      case 'testAddressingModes':
        testFunction = testAddressingModes;
        break;
      case 'testBranchInstructions':
        testFunction = testBranchInstructions;
        break;
      case 'testArithmeticInstructions':
        testFunction = testArithmeticInstructions;
        break;
      case 'testLogicInstructions':
        testFunction = testLogicInstructions;
        break;
      case 'testShiftInstructions':
        testFunction = testShiftInstructions;
        break;
      case 'testStackInstructions':
        testFunction = testStackInstructions;
        break;
      case 'testInstructionDecoder':
        testFunction = testInstructionDecoder;
        break;
      case 'testCompatibility':
        testFunction = testCompatibility;
        break;
    }
    
    if (testFunction) {
      const startTime = Date.now();
      const result = testFunction();
      const endTime = Date.now();
      
      console.log(`✅ ${suite.name} 完成 (耗时: ${endTime - startTime}ms)`);
      if (verbose && result) {
        console.log('详细结果:', result);
      }
    } else {
      console.error(`❌ 测试函数 ${suite.function} 不存在`);
    }
  } catch (error) {
    console.error(`❌ 运行测试套件 ${suite.name} 时出错:`, error);
  }
}

/**
 * 显示测试统计信息
 */
function showTestStatistics(): void {
  console.log('\n📊 测试统计信息');
  console.log('==================');
  console.log(`📦 总测试套件数: ${TEST_STATS.totalSuites}`);
  console.log(`🎯 覆盖领域数: ${TEST_STATS.coverageAreas.length}`);
  console.log('\n📋 测试覆盖领域:');
  TEST_STATS.coverageAreas.forEach((area, index) => {
    console.log(`  ${index + 1}. ${area}`);
  });
}

/**
 * 便捷的测试运行函数
 */
export function runQuickTest(): void {
  testCPUInstructions({
    runOriginal: false,
    runGenerated: true,
    verbose: false
  });
}

export function runDetailedTest(): void {
  testCPUInstructions({
    runOriginal: true,
    runGenerated: true,
    verbose: true
  });
}

export function runTestSuite(suiteName: string): void {
  testCPUInstructions({
    runOriginal: false,
    runGenerated: true,
    specificSuite: suiteName,
    verbose: true
  });
}

/**
 * 显示所有可用的测试套件
 */
export function showAvailableTestSuites(): void {
  console.log('📋 可用的测试套件:');
  console.log('==================');
  TEST_SUITES.forEach((suite, index) => {
    console.log(`${index + 1}. ${suite.name}`);
    console.log(`   函数: ${suite.function}`);
    console.log(`   文件: ${suite.file}`);
    console.log('');
  });
}

function setupTestProgram(memory: Memory): void {
  // 设置测试程序在 $8000
  memory.write16(0xFFFC, 0x8000); // 复位向量

  // 测试1: NOP
  memory.write(0x8000, 0xEA); // NOP

  // 测试2: LDA #$42
  memory.write(0x8001, 0xA9); // LDA immediate
  memory.write(0x8002, 0x42); // #$42

  // 测试3: LDX #$10
  memory.write(0x8003, 0xA2); // LDX immediate
  memory.write(0x8004, 0x10); // #$10

  // 测试4: LDY #$20
  memory.write(0x8005, 0xA0); // LDY immediate
  memory.write(0x8006, 0x20); // #$20

  // 测试5: TAX
  memory.write(0x8007, 0xAA); // TAX

  // 测试6: STA $0200
  memory.write(0x8008, 0x8D); // STA absolute
  memory.write16(0x8009, 0x0200); // $0200

  // 测试7: BRK
  memory.write(0x800B, 0x00); // BRK
  memory.write16(0xFFFE, 0xC000); // IRQ向量
}

function testBasicInstructions(cpu: CPU, _memory: Memory): void {
  console.log('\n📋 测试基础指令...');

  const initialState = cpu.getState();
  console.log('初始状态:', {
    PC: `0x${initialState.PC.toString(16).toUpperCase()}`,
    A: `0x${initialState.A.toString(16).toUpperCase()}`,
    X: `0x${initialState.X.toString(16).toUpperCase()}`,
    Y: `0x${initialState.Y.toString(16).toUpperCase()}`
  });

  // 测试 NOP
  console.log('📍 测试 NOP...');
  const cycles1 = cpu.step();
  console.log(`  周期数: ${cycles1}`);

  // 测试 LDA #$42
  console.log('📍 测试 LDA #$42...');
  const cycles2 = cpu.step();
  const state2 = cpu.getState();
  console.log(`  A=0x${state2.A.toString(16).toUpperCase()}, Z=${state2.flags.Z}, N=${state2.flags.N}, 周期=${cycles2}`);

  // 测试 LDX #$10
  console.log('📍 测试 LDX #$10...');
  const cycles3 = cpu.step();
  const state3 = cpu.getState();
  console.log(`  X=0x${state3.X.toString(16).toUpperCase()}, Z=${state3.flags.Z}, N=${state3.flags.N}, 周期=${cycles3}`);

  // 测试 LDY #$20
  console.log('📍 测试 LDY #$20...');
  const cycles4 = cpu.step();
  const state4 = cpu.getState();
  console.log(`  Y=0x${state4.Y.toString(16).toUpperCase()}, Z=${state4.flags.Z}, N=${state4.flags.N}, 周期=${cycles4}`);
}

function testLoadInstructions(cpu: CPU, _memory: Memory): void {
  console.log('\n📋 测试加载指令...');

  // 测试 TAX (A -> X)
  console.log('📍 测试 TAX...');
  const cycles1 = cpu.step();
  const state1 = cpu.getState();
  console.log(`  A=0x${state1.A.toString(16).toUpperCase()} -> X=0x${state1.X.toString(16).toUpperCase()}, 周期=${cycles1}`);
}

function testStoreInstructions(cpu: CPU, memory: Memory): void {
  console.log('\n📋 测试存储指令...');

  // 测试 STA $0200
  console.log('📍 测试 STA $0200...');
  const cycles1 = cpu.step();
  const storedValue = memory.read(0x0200);
  console.log(`  存储值=0x${storedValue.toString(16).toUpperCase()}, 周期=${cycles1}`);
}

// 在浏览器控制台运行测试
if (typeof window !== 'undefined') {
  const win = window as any;
  
  // 主测试函数
  win.testCPUInstructions = testCPUInstructions;
  
  // 便捷函数
  win.runQuickTest = runQuickTest;
  win.runDetailedTest = runDetailedTest;
  win.runTestSuite = runTestSuite;
  win.showAvailableTestSuites = showAvailableTestSuites;
  
  // 单独的测试套件
  win.testBasicInstructions = testBasicInstructionsSuite;
  win.testLoadInstructions = testLoadInstructionsSuite;
  win.testAddressingModes = testAddressingModes;
  win.testStoreInstructions = testStoreInstructionsSuite;
  win.testBranchInstructions = testBranchInstructions;
  win.testArithmeticInstructions = testArithmeticInstructions;
  win.testLogicInstructions = testLogicInstructions;
  win.testShiftInstructions = testShiftInstructions;
  win.testStackInstructions = testStackInstructions;
  win.testInstructionDecoder = testInstructionDecoder;
  win.testCompatibility = testCompatibility;
  
  console.log('💡 CPU测试函数已加载到浏览器控制台:');
  console.log('   - testCPUInstructions() - 主测试函数');
  console.log('   - runQuickTest() - 快速测试');
  console.log('   - runDetailedTest() - 详细测试');
  console.log('   - runTestSuite("名称") - 运行特定套件');
  console.log('   - showAvailableTestSuites() - 显示可用套件');
  console.log('   - 以及各个单独的测试函数');
}