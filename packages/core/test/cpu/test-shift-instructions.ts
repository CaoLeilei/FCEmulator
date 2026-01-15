// 移位指令测试
import { CPU } from '../../src/core/cpu/index.js';
import { TestCartridge } from '../test-cartridge.js';
import { Memory } from '../../src/core/memory/index.js';

export function testShiftInstructions() {
  console.log('🧪 开始移位指令测试...');

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

  function assertMemory(address: number, expected: number) {
    const actual = memory.readByte(address);
    if (actual !== expected) {
      throw new Error(`内存地址 0x${address.toString(16).toUpperCase()} 期望 0x${expected.toString(16).toUpperCase()}，实际 0x${actual.toString(16).toUpperCase()}`);
    }
  }

  // 测试 ASL - 累加器寻址
  runTest('ASL A - 无进位左移', () => {
    cpu.setA(0x40);
    memory.writeByte(0x8000, 0x0A); // ASL A

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertEqual(cpu.getA(), 0x80);
    assertEqual(cpu.getFlag('C'), false);
    assertEqual(cpu.getFlag('Z'), false);
    assertEqual(cpu.getFlag('N'), true);
    assertEqual(cycles, 2);
  });

  runTest('ASL A - 有进位左移', () => {
    cpu.setA(0x80);
    memory.writeByte(0x8000, 0x0A); // ASL A

    cpu.setPC(0x8000);
    cpu.step();

    assertEqual(cpu.getA(), 0x00);
    assertEqual(cpu.getFlag('C'), true);
    assertEqual(cpu.getFlag('Z'), true);
    assertEqual(cpu.getFlag('N'), false);
  });

  // 测试 LSR - 累加器寻址
  runTest('LSR A - 无进位右移', () => {
    cpu.setA(0x08);
    memory.writeByte(0x8000, 0x4A); // LSR A

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertEqual(cpu.getA(), 0x04);
    assertEqual(cpu.getFlag('C'), false);
    assertEqual(cpu.getFlag('Z'), false);
    assertEqual(cpu.getFlag('N'), false);
    assertEqual(cycles, 2);
  });

  runTest('LSR A - 有进位右移', () => {
    cpu.setA(0x01);
    memory.writeByte(0x8000, 0x4A); // LSR A

    cpu.setPC(0x8000);
    cpu.step();

    assertEqual(cpu.getA(), 0x00);
    assertEqual(cpu.getFlag('C'), true);
    assertEqual(cpu.getFlag('Z'), true);
    assertEqual(cpu.getFlag('N'), false);
  });

  // 测试 ROL - 累加器寻址
  runTest('ROL A - 无进位循环左移', () => {
    cpu.setA(0x40);
    cpu.setFlag('C', false);
    memory.writeByte(0x8000, 0x2A); // ROL A

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertEqual(cpu.getA(), 0x80);
    assertEqual(cpu.getFlag('C'), false);
    assertEqual(cpu.getFlag('Z'), false);
    assertEqual(cpu.getFlag('N'), true);
    assertEqual(cycles, 2);
  });

  runTest('ROL A - 带进位循环左移', () => {
    cpu.setA(0x40);
    cpu.setFlag('C', true);
    memory.writeByte(0x8000, 0x2A); // ROL A

    cpu.setPC(0x8000);
    cpu.step();

    assertEqual(cpu.getA(), 0x81); // 0x40 << 1 + C(1) = 0x81
    assertEqual(cpu.getFlag('C'), false);
    assertEqual(cpu.getFlag('Z'), false);
    assertEqual(cpu.getFlag('N'), true);
  });

  runTest('ROL A - 进位输出循环左移', () => {
    cpu.setA(0x80);
    cpu.setFlag('C', false);
    memory.writeByte(0x8000, 0x2A); // ROL A

    cpu.setPC(0x8000);
    cpu.step();

    assertEqual(cpu.getA(), 0x00);
    assertEqual(cpu.getFlag('C'), true);
    assertEqual(cpu.getFlag('Z'), true);
    assertEqual(cpu.getFlag('N'), false);
  });

  // 测试 ROR - 累加器寻址
  runTest('ROR A - 无进位循环右移', () => {
    cpu.setA(0x08);
    cpu.setFlag('C', false);
    memory.writeByte(0x8000, 0x6A); // ROR A

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertEqual(cpu.getA(), 0x04);
    assertEqual(cpu.getFlag('C'), false);
    assertEqual(cpu.getFlag('Z'), false);
    assertEqual(cpu.getFlag('N'), false);
    assertEqual(cycles, 2);
  });

  runTest('ROR A - 带进位循环右移', () => {
    cpu.setA(0x08);
    cpu.setFlag('C', true);
    memory.writeByte(0x8000, 0x6A); // ROR A

    cpu.setPC(0x8000);
    cpu.step();

    assertEqual(cpu.getA(), 0x84); // 0x08 >> 1 + (C << 7) = 0x84
    assertEqual(cpu.getFlag('C'), false);
    assertEqual(cpu.getFlag('Z'), false);
    assertEqual(cpu.getFlag('N'), true);
  });

  runTest('ROR A - 进位输出循环右移', () => {
    cpu.setA(0x01);
    cpu.setFlag('C', false);
    memory.writeByte(0x8000, 0x6A); // ROR A

    cpu.setPC(0x8000);
    cpu.step();

    assertEqual(cpu.getA(), 0x00);
    assertEqual(cpu.getFlag('C'), true);
    assertEqual(cpu.getFlag('Z'), true);
    assertEqual(cpu.getFlag('N'), false);
  });

  // 测试零页寻址的移位指令
  runTest('ASL $nn - 零页左移', () => {
    memory.writeByte(0x0050, 0x40);
    memory.writeByte(0x8000, 0x06); // ASL $50
    memory.writeByte(0x8001, 0x50);

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertMemory(0x0050, 0x80);
    assertEqual(cpu.getFlag('C'), false);
    assertEqual(cpu.getFlag('N'), true);
    assertEqual(cycles, 5);
  });

  runTest('LSR $nn - 零页右移', () => {
    memory.writeByte(0x0060, 0x08);
    memory.writeByte(0x8000, 0x46); // LSR $60
    memory.writeByte(0x8001, 0x60);

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertMemory(0x0060, 0x04);
    assertEqual(cpu.getFlag('C'), false);
    assertEqual(cycles, 5);
  });

  runTest('ROL $nn - 零页循环左移', () => {
    memory.writeByte(0x0070, 0x80);
    cpu.setFlag('C', false);
    memory.writeByte(0x8000, 0x26); // ROL $70
    memory.writeByte(0x8001, 0x70);

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertMemory(0x0070, 0x00);
    assertEqual(cpu.getFlag('C'), true);
    assertEqual(cpu.getFlag('Z'), true);
    assertEqual(cycles, 5);
  });

  runTest('ROR $nn - 零页循环右移', () => {
    memory.writeByte(0x0080, 0x01);
    cpu.setFlag('C', false);
    memory.writeByte(0x8000, 0x66); // ROR $80
    memory.writeByte(0x8001, 0x80);

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertMemory(0x0080, 0x00);
    assertEqual(cpu.getFlag('C'), true);
    assertEqual(cycles, 5);
  });

  // 测试绝对寻址的移位指令
  runTest('ASL $nnnn - 绝对左移', () => {
    memory.writeByte(0x2000, 0x7F);
    memory.writeByte(0x8000, 0x0E); // ASL $2000
    memory.writeWord(0x8001, 0x2000);

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertMemory(0x2000, 0xFE);
    assertEqual(cpu.getFlag('C'), false);
    assertEqual(cpu.getFlag('N'), true);
    assertEqual(cycles, 6);
  });

  // 测试零页X变址移位指令
  runTest('ASL $nn,X - 零页X变址左移', () => {
    cpu.setX(0x10);
    memory.writeByte(0x0060, 0x40); // 0x50 + 0x10 = 0x60
    memory.writeByte(0x8000, 0x16); // ASL $50,X
    memory.writeByte(0x8001, 0x50);

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertMemory(0x0060, 0x80);
    assertEqual(cpu.getFlag('N'), true);
    assertEqual(cycles, 6);
  });

  // 测试绝对X变址移位指令
  runTest('LSR $nnnn,X - 绝对X变址右移', () => {
    cpu.setX(0x08);
    memory.writeByte(0x2008, 0x10); // 0x2000 + 0x08 = 0x2008
    memory.writeByte(0x8000, 0x5E); // LSR $2000,X
    memory.writeWord(0x8001, 0x2000);

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertMemory(0x2008, 0x08);
    assertEqual(cpu.getFlag('C'), false);
    assertEqual(cycles, 7);
  });

  // 测试 INC 指令
  runTest('INC $nn - 零页增1', () => {
    memory.writeByte(0x0030, 0x7F);
    memory.writeByte(0x8000, 0xE6); // INC $30
    memory.writeByte(0x8001, 0x30);

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertMemory(0x0030, 0x80);
    assertEqual(cpu.getFlag('Z'), false);
    assertEqual(cpu.getFlag('N'), true);
    assertEqual(cycles, 5);
  });

  runTest('INC $nnnn - 绝对增1', () => {
    memory.writeByte(0x3000, 0xFF);
    memory.writeByte(0x8000, 0xEE); // INC $3000
    memory.writeWord(0x8001, 0x3000);

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertMemory(0x3000, 0x00);
    assertEqual(cpu.getFlag('Z'), true);
    assertEqual(cpu.getFlag('N'), false);
    assertEqual(cycles, 6);
  });

  runTest('INC $nn,X - 零页X变址增1', () => {
    cpu.setX(0x05);
    memory.writeByte(0x0045, 0x00); // 0x40 + 0x05 = 0x45
    memory.writeByte(0x8000, 0xF6); // INC $40,X
    memory.writeByte(0x8001, 0x40);

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertMemory(0x0045, 0x01);
    assertEqual(cpu.getFlag('Z'), false);
    assertEqual(cpu.getFlag('N'), false);
    assertEqual(cycles, 6);
  });

  // 测试 DEC 指令
  runTest('DEC $nn - 零页减1', () => {
    memory.writeByte(0x0070, 0x01);
    memory.writeByte(0x8000, 0xC6); // DEC $70
    memory.writeByte(0x8001, 0x70);

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertMemory(0x0070, 0x00);
    assertEqual(cpu.getFlag('Z'), true);
    assertEqual(cpu.getFlag('N'), false);
    assertEqual(cycles, 5);
  });

  runTest('DEC $nnnn - 绝对减1', () => {
    memory.writeByte(0x4000, 0x80);
    memory.writeByte(0x8000, 0xCE); // DEC $4000
    memory.writeWord(0x8001, 0x4000);

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertMemory(0x4000, 0x7F);
    assertEqual(cpu.getFlag('Z'), false);
    assertEqual(cpu.getFlag('N'), false);
    assertEqual(cycles, 6);
  });

  // 测试 INX/INY 指令
  runTest('INX - X增1', () => {
    cpu.setX(0xFF);
    memory.writeByte(0x8000, 0xE8); // INX

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertEqual(cpu.getX(), 0x00);
    assertEqual(cpu.getFlag('Z'), true);
    assertEqual(cpu.getFlag('N'), false);
    assertEqual(cycles, 2);
  });

  runTest('INY - Y增1', () => {
    cpu.setY(0x7F);
    memory.writeByte(0x8000, 0xC8); // INY

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertEqual(cpu.getY(), 0x80);
    assertEqual(cpu.getFlag('Z'), false);
    assertEqual(cpu.getFlag('N'), true);
    assertEqual(cycles, 2);
  });

  // 测试 DEX/DEY 指令
  runTest('DEX - X减1', () => {
    cpu.setX(0x01);
    memory.writeByte(0x8000, 0xCA); // DEX

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertEqual(cpu.getX(), 0x00);
    assertEqual(cpu.getFlag('Z'), true);
    assertEqual(cpu.getFlag('N'), false);
    assertEqual(cycles, 2);
  });

  runTest('DEY - Y减1', () => {
    cpu.setY(0x00);
    memory.writeByte(0x8000, 0x88); // DEY

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertEqual(cpu.getY(), 0xFF);
    assertEqual(cpu.getFlag('Z'), false);
    assertEqual(cpu.getFlag('N'), true);
    assertEqual(cycles, 2);
  });

  // 测试边界情况
  runTest('ASL A - 最高位测试', () => {
    cpu.setA(0x80);
    memory.writeByte(0x8000, 0x0A); // ASL A

    cpu.setPC(0x8000);
    cpu.step();

    assertEqual(cpu.getA(), 0x00);
    assertEqual(cpu.getFlag('C'), true);
    assertEqual(cpu.getFlag('Z'), true);
    assertEqual(cpu.getFlag('N'), false);
  });

  runTest('ROR A - 最低位测试', () => {
    cpu.setA(0x01);
    cpu.setFlag('C', false);
    memory.writeByte(0x8000, 0x6A); // ROR A

    cpu.setPC(0x8000);
    cpu.step();

    assertEqual(cpu.getA(), 0x00);
    assertEqual(cpu.getFlag('C'), true);
    assertEqual(cpu.getFlag('Z'), true);
  });

  console.log(`📊 移位指令测试完成: ${passCount}/${testCount} 通过`);
  return passCount === testCount;
}