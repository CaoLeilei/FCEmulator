// 加载指令测试
import { CPU } from '@/core/cpu/index.js';
import { Memory } from '@/core/memory/index.js';
import { TestCartridge } from '../test-cartridge.js';

export function testLoadInstructions() {
  console.log('🧪 开始加载指令测试...');

  const memory = new Memory();
  const testCartridge = new TestCartridge();
  memory.setTestCartridge(testCartridge);
  const cpu = new CPU(memory);
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

  // 测试 LDA 立即寻址
  runTest('LDA #$42', () => {
    memory.writeByte(0x8000, 0xA9); // LDA #$42
    memory.writeByte(0x8001, 0x42);

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertEqual(cpu.getA(), 0x42);
    assertEqual(cpu.getFlag('Z'), false);
    assertEqual(cpu.getFlag('N'), false);
    assertEqual(cpu.getPC(), 0x8002);
    assertEqual(cycles, 2);
  });

  // 测试 LDA 零页寻址
  runTest('LDA $30', () => {
    memory.writeByte(0x0030, 0x7F); // 零页数据
    memory.writeByte(0x8000, 0xA5); // LDA $30
    memory.writeByte(0x8001, 0x30);

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertEqual(cpu.getA(), 0x7F);
    assertEqual(cpu.getFlag('Z'), false);
    assertEqual(cpu.getFlag('N'), false);
    assertEqual(cycles, 3);
  });

  // 测试 LDA 设置零标志
  runTest('LDA #$00 应该设置零标志', () => {
    memory.writeByte(0x8000, 0xA9); // LDA #$00
    memory.writeByte(0x8001, 0x00);

    cpu.setPC(0x8000);
    cpu.step();

    assertEqual(cpu.getA(), 0x00);
    assertEqual(cpu.getFlag('Z'), true);
    assertEqual(cpu.getFlag('N'), false);
  });

  // 测试 LDA 设置负标志
  runTest('LDA #$80 应该设置负标志', () => {
    memory.writeByte(0x8000, 0xA9); // LDA #$80
    memory.writeByte(0x8001, 0x80);

    cpu.setPC(0x8000);
    cpu.step();

    assertEqual(cpu.getA(), 0x80);
    assertEqual(cpu.getFlag('Z'), false);
    assertEqual(cpu.getFlag('N'), true);
  });

  // 测试 LDX
  runTest('LDX #$15', () => {
    memory.writeByte(0x8000, 0xA2); // LDX #$15
    memory.writeByte(0x8001, 0x15);

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertEqual(cpu.getX(), 0x15);
    assertEqual(cpu.getFlag('Z'), false);
    assertEqual(cpu.getFlag('N'), false);
    assertEqual(cycles, 2);
  });

  // 测试 LDY
  runTest('LDY #$23', () => {
    memory.writeByte(0x8000, 0xA0); // LDY #$23
    memory.writeByte(0x8001, 0x23);

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertEqual(cpu.getY(), 0x23);
    assertEqual(cpu.getFlag('Z'), false);
    assertEqual(cpu.getFlag('N'), false);
    assertEqual(cycles, 2);
  });

  console.log(`📊 加载指令测试完成: ${passCount}/${testCount} 通过`);
  return passCount === testCount;
}