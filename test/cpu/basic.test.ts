// 基础指令测试
import { CPU } from '@/core/cpu/index.js';
import { Memory } from '@/core/memory/index.js';
import { TestCartridge } from '../test-cartridge.js';

export function testBasicInstructions() {
  console.log('🧪 开始基础指令测试...');

  const memory = new Memory();
  const cpu = new CPU(memory);

  // 设置测试卡带
  const testCartridge = new TestCartridge();
  memory.setTestCartridge(testCartridge);

  cpu.reset();

  let testCount = 0;
  let passCount = 0;

  function runTest(name: string, testFn: () => void) {
    testCount++;
    try {
      testFn();
      console.log(`✅ ${name}`);
      passCount++;
    } catch (error) {
      console.log(`❌ ${name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  function assertEqual<T>(actual: T, expected: T, message?: string) {
    if (actual !== expected) {
      throw new Error(message || `期望 ${expected}，实际 ${actual}`);
    }
  }

  // 测试 NOP
  runTest('NOP 指令测试', () => {
    memory.writeByte(0x8000, 0xEA); // NOP
    cpu.setPC(0x8000);

    const cycles = cpu.step();

    assertEqual(cpu.getPC(), 0x8001);
    assertEqual(cycles, 2);
  });

  // 测试 BRK
  runTest('BRK 指令测试', () => {
    cpu.reset();
    memory.writeByte(0x8000, 0x00); // BRK
    memory.writeWord(0xFFFE, 0xC000); // IRQ向量

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertEqual(cpu.getPC(), 0xC000);
    assertEqual(cpu.getFlag('I'), true);
    assertEqual(cycles, 7);
  });

  console.log(`📊 基础指令测试完成: ${passCount}/${testCount} 通过`);
  return passCount === testCount;
}