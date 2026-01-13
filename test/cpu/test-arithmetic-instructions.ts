// 算术指令测试
import { CPU } from '@/core/cpu/index.js';
import { TestCartridge } from '../test-cartridge.js';
import { Memory } from '@/core/memory/index.js';

export function testArithmeticInstructions() {
  console.log('🧪 开始算术指令测试...');

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

  // 测试 ADC - 立即寻址
  runTest('ADC #$nn - 无进位无溢出', () => {
    cpu.setA(0x30);
    cpu.setFlag('C', false);
    memory.writeByte(0x8000, 0x69); // ADC #$10
    memory.writeByte(0x8001, 0x10);

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertEqual(cpu.getA(), 0x40);
    assertEqual(cpu.getFlag('C'), false);
    assertEqual(cpu.getFlag('V'), false);
    assertEqual(cpu.getFlag('Z'), false);
    assertEqual(cpu.getFlag('N'), false);
    assertEqual(cycles, 2);
  });

  runTest('ADC #$nn - 有进位', () => {
    cpu.setA(0xF0);
    cpu.setFlag('C', false);
    memory.writeByte(0x8000, 0x69); // ADC #$20
    memory.writeByte(0x8001, 0x20);

    cpu.setPC(0x8000);
    cpu.step();

    assertEqual(cpu.getA(), 0x10); // 0xF0 + 0x20 = 0x110 -> 0x10
    assertEqual(cpu.getFlag('C'), true);
    assertEqual(cpu.getFlag('V'), false);
  });

  runTest('ADC #$nn - 有溢出', () => {
    cpu.setA(0x70);
    cpu.setFlag('C', false);
    memory.writeByte(0x8000, 0x69); // ADC #$20
    memory.writeByte(0x8001, 0x20);

    cpu.setPC(0x8000);
    cpu.step();

    assertEqual(cpu.getA(), 0x90); // 0x70 + 0x20 = 0x90 (溢出)
    assertEqual(cpu.getFlag('C'), false);
    assertEqual(cpu.getFlag('V'), true);
    assertEqual(cpu.getFlag('N'), true);
  });

  runTest('ADC #$nn - 带进位', () => {
    cpu.setA(0x30);
    cpu.setFlag('C', true);
    memory.writeByte(0x8000, 0x69); // ADC #$10
    memory.writeByte(0x8001, 0x10);

    cpu.setPC(0x8000);
    cpu.step();

    assertEqual(cpu.getA(), 0x41); // 0x30 + 0x10 + 1 = 0x41
    assertEqual(cpu.getFlag('C'), false);
  });

  // 测试 SBC - 立即寻址
  runTest('SBC #$nn - 无借位', () => {
    cpu.setA(0x50);
    cpu.setFlag('C', true);
    memory.writeByte(0x8000, 0xE9); // SBC #$20
    memory.writeByte(0x8001, 0x20);

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertEqual(cpu.getA(), 0x30); // 0x50 - 0x20 = 0x30
    assertEqual(cpu.getFlag('C'), true);
    assertEqual(cpu.getFlag('V'), false);
    assertEqual(cycles, 2);
  });

  runTest('SBC #$nn - 有借位', () => {
    cpu.setA(0x20);
    cpu.setFlag('C', true);
    memory.writeByte(0x8000, 0xE9); // SBC #$30
    memory.writeByte(0x8001, 0x30);

    cpu.setPC(0x8000);
    cpu.step();

    assertEqual(cpu.getA(), 0xF0); // 0x20 - 0x30 = -0x10 -> 0xF0
    assertEqual(cpu.getFlag('C'), false);
    assertEqual(cpu.getFlag('N'), true);
  });

  runTest('SBC #$nn - 带借位标志', () => {
    cpu.setA(0x50);
    cpu.setFlag('C', false);
    memory.writeByte(0x8000, 0xE9); // SBC #$20
    memory.writeByte(0x8001, 0x20);

    cpu.setPC(0x8000);
    cpu.step();

    assertEqual(cpu.getA(), 0x2F); // 0x50 - 0x20 - 1 = 0x2F
    assertEqual(cpu.getFlag('C'), true);
  });

  // 测试 CMP - 立即寻址
  runTest('CMP #$nn - A等于操作数', () => {
    cpu.setA(0x42);
    memory.writeByte(0x8000, 0xC9); // CMP #$42
    memory.writeByte(0x8001, 0x42);

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertEqual(cpu.getA(), 0x42); // A不变
    assertEqual(cpu.getFlag('C'), true);
    assertEqual(cpu.getFlag('Z'), true);
    assertEqual(cpu.getFlag('N'), false);
    assertEqual(cycles, 2);
  });

  runTest('CMP #$nn - A大于操作数', () => {
    cpu.setA(0x80);
    memory.writeByte(0x8000, 0xC9); // CMP #$40
    memory.writeByte(0x8001, 0x40);

    cpu.setPC(0x8000);
    cpu.step();

    assertEqual(cpu.getFlag('C'), true);
    assertEqual(cpu.getFlag('Z'), false);
    assertEqual(cpu.getFlag('N'), false);
  });

  runTest('CMP #$nn - A小于操作数', () => {
    cpu.setA(0x20);
    memory.writeByte(0x8000, 0xC9); // CMP #$40
    memory.writeByte(0x8001, 0x40);

    cpu.setPC(0x8000);
    cpu.step();

    assertEqual(cpu.getFlag('C'), false);
    assertEqual(cpu.getFlag('Z'), false);
    assertEqual(cpu.getFlag('N'), true);
  });

  // 测试 CPX - 立即寻址
  runTest('CPX #$nn - X等于操作数', () => {
    cpu.setX(0x15);
    memory.writeByte(0x8000, 0xE0); // CPX #$15
    memory.writeByte(0x8001, 0x15);

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertEqual(cpu.getFlag('C'), true);
    assertEqual(cpu.getFlag('Z'), true);
    assertEqual(cpu.getFlag('N'), false);
    assertEqual(cycles, 2);
  });

  runTest('CPX #$nn - X大于操作数', () => {
    cpu.setX(0x30);
    memory.writeByte(0x8000, 0xE0); // CPX #$20
    memory.writeByte(0x8001, 0x20);

    cpu.setPC(0x8000);
    cpu.step();

    assertEqual(cpu.getFlag('C'), true);
    assertEqual(cpu.getFlag('Z'), false);
    assertEqual(cpu.getFlag('N'), false);
  });

  runTest('CPX #$nn - X小于操作数', () => {
    cpu.setX(0x10);
    memory.writeByte(0x8000, 0xE0); // CPX #$20
    memory.writeByte(0x8001, 0x20);

    cpu.setPC(0x8000);
    cpu.step();

    assertEqual(cpu.getFlag('C'), false);
    assertEqual(cpu.getFlag('Z'), false);
    assertEqual(cpu.getFlag('N'), true);
  });

  // 测试 CPY - 立即寻址
  runTest('CPY #$nn - Y等于操作数', () => {
    cpu.setY(0x88);
    memory.writeByte(0x8000, 0xC0); // CPY #$88
    memory.writeByte(0x8001, 0x88);

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertEqual(cpu.getFlag('C'), true);
    assertEqual(cpu.getFlag('Z'), true);
    assertEqual(cpu.getFlag('N'), false);
    assertEqual(cycles, 2);
  });

  runTest('CPY #$nn - Y大于操作数', () => {
    cpu.setY(0xFF);
    memory.writeByte(0x8000, 0xC0); // CPY #$01
    memory.writeByte(0x8001, 0x01);

    cpu.setPC(0x8000);
    cpu.step();

    assertEqual(cpu.getFlag('C'), true);
    assertEqual(cpu.getFlag('Z'), false);
    // 修正：根据6502规范，N标志基于减法结果的第7位
    // 0xFF - 0x01 = 0xFE，第7位为1，所以N=true
    assertEqual(cpu.getFlag('N'), true);
  });

  runTest('CPY #$nn - Y小于操作数', () => {
    cpu.setY(0x05);
    memory.writeByte(0x8000, 0xC0); // CPY #$10
    memory.writeByte(0x8001, 0x10);

    cpu.setPC(0x8000);
    cpu.step();

    assertEqual(cpu.getFlag('C'), false);
    assertEqual(cpu.getFlag('Z'), false);
    assertEqual(cpu.getFlag('N'), true);
  });

  // 测试零页寻址的算术指令
  runTest('ADC $nn - 零页寻址', () => {
    cpu.setA(0x10);
    cpu.setFlag('C', false);
    memory.writeByte(0x0050, 0x20);
    memory.writeByte(0x8000, 0x65); // ADC $50
    memory.writeByte(0x8001, 0x50);

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertEqual(cpu.getA(), 0x30);
    assertEqual(cycles, 3);
  });

  runTest('SBC $nn - 零页寻址', () => {
    cpu.setA(0x40);
    cpu.setFlag('C', true);
    memory.writeByte(0x0060, 0x15);
    memory.writeByte(0x8000, 0xE5); // SBC $60
    memory.writeByte(0x8001, 0x60);

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertEqual(cpu.getA(), 0x2B);
    assertEqual(cycles, 3);
  });

  // 测试绝对寻址的比较指令
  runTest('CMP $nnnn - 绝对寻址', () => {
    cpu.setA(0x77);
    memory.writeByte(0x2000, 0x77);
    memory.writeByte(0x8000, 0xCD); // CMP $2000
    memory.writeWord(0x8001, 0x2000);

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertEqual(cpu.getFlag('C'), true);
    assertEqual(cpu.getFlag('Z'), true);
    assertEqual(cycles, 4);
  });

  // 测试溢出标志的边界情况
  runTest('ADC 正溢出边界测试', () => {
    // 0x7F + 0x01 = 0x80 (溢出)
    cpu.setA(0x7F);
    cpu.setFlag('C', false);
    memory.writeByte(0x8000, 0x69); // ADC #$01
    memory.writeByte(0x8001, 0x01);

    cpu.setPC(0x8000);
    cpu.step();

    assertEqual(cpu.getA(), 0x80);
    assertEqual(cpu.getFlag('V'), true);
    assertEqual(cpu.getFlag('N'), true);
  });

  runTest('SBC 负溢出边界测试', () => {
    // 0x80 - 0x01 = 0x7F (溢出)
    cpu.setA(0x80);
    cpu.setFlag('C', true);
    memory.writeByte(0x8000, 0xE9); // SBC #$01
    memory.writeByte(0x8001, 0x01);

    cpu.setPC(0x8000);
    cpu.step();

    assertEqual(cpu.getA(), 0x7F);
    assertEqual(cpu.getFlag('V'), true);
    assertEqual(cpu.getFlag('N'), false);
  });

  console.log(`📊 算术指令测试完成: ${passCount}/${testCount} 通过`);
  return passCount === testCount;
}