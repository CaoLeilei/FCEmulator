// 逻辑指令测试
import { CPU } from '@/core/cpu/index.js';
import { TestCartridge } from '../test-cartridge.js';
import { Memory } from '@/core/memory/index.js';

export function testLogicInstructions() {
  console.log('🧪 开始逻辑指令测试...');

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

  // 测试 AND - 立即寻址
  runTest('AND #$nn - 基本与运算', () => {
    cpu.setA(0xF0);
    memory.writeByte(0x8000, 0x29); // AND #$0F
    memory.writeByte(0x8001, 0x0F);

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertEqual(cpu.getA(), 0x00); // 0xF0 & 0x0F = 0x00
    assertEqual(cpu.getFlag('Z'), true);
    assertEqual(cpu.getFlag('N'), false);
    assertEqual(cycles, 2);
  });

  runTest('AND #$nn - 结果为非零', () => {
    cpu.setA(0xAA);
    memory.writeByte(0x8000, 0x29); // AND #$55
    memory.writeByte(0x8001, 0x55);

    cpu.setPC(0x8000);
    cpu.step();

    assertEqual(cpu.getA(), 0x00); // 0xAA & 0x55 = 0x00
    assertEqual(cpu.getFlag('Z'), true);
  });

  runTest('AND #$nn - 结果为负数', () => {
    cpu.setA(0xFF);
    memory.writeByte(0x8000, 0x29); // AND #$80
    memory.writeByte(0x8001, 0x80);

    cpu.setPC(0x8000);
    cpu.step();

    assertEqual(cpu.getA(), 0x80); // 0xFF & 0x80 = 0x80
    assertEqual(cpu.getFlag('Z'), false);
    assertEqual(cpu.getFlag('N'), true);
  });

  // 测试 ORA - 立即寻址
  runTest('ORA #$nn - 基本或运算', () => {
    cpu.setA(0x0F);
    memory.writeByte(0x8000, 0x09); // ORA #$F0
    memory.writeByte(0x8001, 0xF0);

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertEqual(cpu.getA(), 0xFF); // 0x0F | 0xF0 = 0xFF
    assertEqual(cpu.getFlag('Z'), false);
    assertEqual(cpu.getFlag('N'), true);
    assertEqual(cycles, 2);
  });

  runTest('ORA #$nn - 无新位设置', () => {
    cpu.setA(0x55);
    memory.writeByte(0x8000, 0x09); // ORA #$00
    memory.writeByte(0x8001, 0x00);

    cpu.setPC(0x8000);
    cpu.step();

    assertEqual(cpu.getA(), 0x55); // 0x55 | 0x00 = 0x55
    assertEqual(cpu.getFlag('Z'), false);
    assertEqual(cpu.getFlag('N'), false);
  });

  // 测试 EOR - 立即寻址
  runTest('EOR #$nn - 基本异或运算', () => {
    cpu.setA(0xAA);
    memory.writeByte(0x8000, 0x49); // EOR #$55
    memory.writeByte(0x8001, 0x55);

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertEqual(cpu.getA(), 0xFF); // 0xAA ^ 0x55 = 0xFF
    assertEqual(cpu.getFlag('Z'), false);
    assertEqual(cpu.getFlag('N'), true);
    assertEqual(cycles, 2);
  });

  runTest('EOR #$nn - 结果为零', () => {
    cpu.setA(0x33);
    memory.writeByte(0x8000, 0x49); // EOR #$33
    memory.writeByte(0x8001, 0x33);

    cpu.setPC(0x8000);
    cpu.step();

    assertEqual(cpu.getA(), 0x00); // 0x33 ^ 0x33 = 0x00
    assertEqual(cpu.getFlag('Z'), true);
    assertEqual(cpu.getFlag('N'), false);
  });

  runTest('EOR #$nn - 取反操作', () => {
    cpu.setA(0x0F);
    memory.writeByte(0x8000, 0x49); // EOR #$FF
    memory.writeByte(0x8001, 0xFF);

    cpu.setPC(0x8000);
    cpu.step();

    assertEqual(cpu.getA(), 0xF0); // 0x0F ^ 0xFF = 0xF0
    assertEqual(cpu.getFlag('Z'), false);
    assertEqual(cpu.getFlag('N'), true);
  });

  // 测试 BIT - 零页寻址
  runTest('BIT $nn - 位测试，零结果', () => {
    cpu.setA(0x0F);
    memory.writeByte(0x0050, 0xF0);
    memory.writeByte(0x8000, 0x24); // BIT $50
    memory.writeByte(0x8001, 0x50);

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertEqual(cpu.getA(), 0x0F); // A不变
    assertEqual(cpu.getFlag('Z'), true); // 0x0F & 0xF0 = 0x00
    assertEqual(cpu.getFlag('V'), true); // bit 6 of 0xF0 is 1
    assertEqual(cpu.getFlag('N'), true); // bit 7 of 0xF0 is 1
    assertEqual(cycles, 3);
  });

  runTest('BIT $nn - 位测试，非零结果', () => {
    cpu.setA(0x88);
    memory.writeByte(0x0060, 0x81);
    memory.writeByte(0x8000, 0x24); // BIT $60
    memory.writeByte(0x8001, 0x60);

    cpu.setPC(0x8000);
    cpu.step();

    assertEqual(cpu.getFlag('Z'), false); // 0x88 & 0x81 = 0x80 != 0
    assertEqual(cpu.getFlag('V'), false); // bit 6 of 0x81 is 0
    assertEqual(cpu.getFlag('N'), true); // bit 7 of 0x81 is 1
  });

  // 测试 BIT - 绝对寻址
  runTest('BIT $nnnn - 绝对寻址', () => {
    cpu.setA(0x55);
    memory.writeByte(0x2000, 0xC4);
    memory.writeByte(0x8000, 0x2C); // BIT $2000
    memory.writeWord(0x8001, 0x2000);

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertEqual(cpu.getFlag('Z'), false); // 0x55 & 0xC4 = 0x44 != 0
    assertEqual(cpu.getFlag('V'), true); // bit 6 of 0xC4 is 1
    assertEqual(cpu.getFlag('N'), true); // bit 7 of 0xC4 is 1
    assertEqual(cycles, 4);
  });

  // 测试零页寻址的逻辑指令
  runTest('AND $nn - 零页寻址', () => {
    cpu.setA(0xFF);
    memory.writeByte(0x0070, 0x0F);
    memory.writeByte(0x8000, 0x25); // AND $70
    memory.writeByte(0x8001, 0x70);

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertEqual(cpu.getA(), 0x0F);
    assertEqual(cycles, 3);
  });

  runTest('ORA $nn - 零页寻址', () => {
    cpu.setA(0x10);
    memory.writeByte(0x0080, 0x20);
    memory.writeByte(0x8000, 0x05); // ORA $80
    memory.writeByte(0x8001, 0x80);

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertEqual(cpu.getA(), 0x30);
    assertEqual(cycles, 3);
  });

  runTest('EOR $nn - 零页寻址', () => {
    cpu.setA(0xCC);
    memory.writeByte(0x0090, 0x33);
    memory.writeByte(0x8000, 0x45); // EOR $90
    memory.writeByte(0x8001, 0x90);

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertEqual(cpu.getA(), 0xFF);
    assertEqual(cycles, 3);
  });

  // 测试绝对寻址的逻辑指令
  runTest('AND $nnnn - 绝对寻址', () => {
    cpu.setA(0xAA);
    memory.writeByte(0x3000, 0x55);
    memory.writeByte(0x8000, 0x2D); // AND $3000
    memory.writeWord(0x8001, 0x3000);

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertEqual(cpu.getA(), 0x00);
    assertEqual(cpu.getFlag('Z'), true);
    assertEqual(cycles, 4);
  });

  // 测试变址寻址的逻辑指令
  runTest('AND $nnnn,X - 绝对X变址', () => {
    cpu.setA(0xFF);
    cpu.setX(0x10);
    memory.writeByte(0x2010, 0x0F);
    memory.writeByte(0x8000, 0x3D); // AND $2000,X
    memory.writeWord(0x8001, 0x2000);

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertEqual(cpu.getA(), 0x0F);
    assertEqual(cycles, 4); // 不跨页
  });

  runTest('ORA $nnnn,Y - 绝对Y变址', () => {
    cpu.setA(0x00);
    cpu.setY(0x05);
    memory.writeByte(0x1505, 0x88);
    memory.writeByte(0x8000, 0x19); // ORA $1500,Y
    memory.writeWord(0x8001, 0x1500);

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertEqual(cpu.getA(), 0x88);
    assertEqual(cpu.getFlag('N'), true);
    assertEqual(cycles, 4); // 不跨页
  });

  // 测试间接变址寻址
  runTest('AND ($nn,X) - 间接X变址', () => {
    cpu.setA(0xFF);
    cpu.setX(0x08);
    memory.writeWord(0x0058, 0x4000); // $58,$59 = $4000
    memory.writeByte(0x4000, 0x33);
    memory.writeByte(0x8000, 0x21); // AND ($50,X)
    memory.writeByte(0x8001, 0x50);

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertEqual(cpu.getA(), 0x33);
    assertEqual(cycles, 6);
  });

  runTest('EOR ($nn),Y - 间接Y变址', () => {
    cpu.setA(0x00);
    cpu.setY(0x03);
    memory.writeWord(0x0060, 0x9000); // $60,$61 = $9000 (在PRG ROM范围内)
    memory.writeByte(0x9003, 0xAA);
    memory.writeByte(0x8000, 0x51); // EOR ($60),Y
    memory.writeByte(0x8001, 0x60);

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertEqual(cpu.getA(), 0xAA);
    assertEqual(cpu.getFlag('N'), true);
    assertEqual(cycles, 5); // 不跨页
  });

  // 测试标志位设置的边界情况
  runTest('AND 设置零标志和负标志', () => {
    cpu.setA(0x80);
    memory.writeByte(0x8000, 0x29); // AND #$00
    memory.writeByte(0x8001, 0x00);

    cpu.setPC(0x8000);
    cpu.step();

    assertEqual(cpu.getA(), 0x00);
    assertEqual(cpu.getFlag('Z'), true);
    assertEqual(cpu.getFlag('N'), false);
  });

  runTest('BIT 指令标志位测试', () => {
    cpu.setA(0x01);
    memory.writeByte(0x0070, 0x40); // 只有V标志位为1
    memory.writeByte(0x8000, 0x24); // BIT $70
    memory.writeByte(0x8001, 0x70);

    cpu.setPC(0x8000);
    cpu.step();

    assertEqual(cpu.getFlag('Z'), true); // 0x01 & 0x40 = 0x00
    assertEqual(cpu.getFlag('V'), true); // bit 6 is 1
    assertEqual(cpu.getFlag('N'), false); // bit 7 is 0
  });

  console.log(`📊 逻辑指令测试完成: ${passCount}/${testCount} 通过`);
  return passCount === testCount;
}