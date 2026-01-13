// 存储指令测试
import { CPU } from '@/core/cpu/index.js';
import { Memory } from '@/core/memory/index.js';
import { TestCartridge } from '../test-cartridge.js';

export function testStoreInstructions() {
  console.log('🧪 开始存储指令测试...');

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

  // 测试 STA 零页寻址
  runTest('STA $nn 零页存储', () => {
    cpu.setA(0x7F);
    memory.writeByte(0x8000, 0x85); // STA $30
    memory.writeByte(0x8001, 0x30);

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertMemory(0x0030, 0x7F);
    assertEqual(cpu.getPC(), 0x8002);
    assertEqual(cycles, 3);
  });

  // 测试 STA 零页X变址寻址
  runTest('STA $nn,X 零页X变址存储', () => {
    cpu.setA(0x55);
    cpu.setX(0x08);
    memory.writeByte(0x8000, 0x95); // STA $20,X
    memory.writeByte(0x8001, 0x20);

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertMemory(0x0028, 0x55); // 0x20 + 0x08 = 0x28
    assertEqual(cpu.getPC(), 0x8002);
    assertEqual(cycles, 4);
  });

  // 测试 STA 绝对寻址
  runTest('STA $nnnn 绝对存储', () => {
    cpu.setA(0x9A);
    memory.writeByte(0x8000, 0x8D); // STA $1234
    memory.writeWord(0x8001, 0x1234);

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertMemory(0x1234, 0x9A);
    assertEqual(cpu.getPC(), 0x8003);
    assertEqual(cycles, 4);
  });

  // 测试 STA 绝对X变址寻址
  runTest('STA $nnnn,X 绝对X变址存储', () => {
    cpu.setA(0xCC);
    cpu.setX(0x10);
    memory.writeByte(0x8000, 0x9D); // STA $2000,X
    memory.writeWord(0x8001, 0x2000);

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertMemory(0x2010, 0xCC); // 0x2000 + 0x10 = 0x2010
    assertEqual(cpu.getPC(), 0x8003);
    assertEqual(cycles, 5);
  });

  // 测试 STA 绝对Y变址寻址
  runTest('STA $nnnn,Y 绝对Y变址存储', () => {
    cpu.setA(0x33);
    cpu.setY(0x05);
    memory.writeByte(0x8000, 0x99); // STA $3000,Y
    memory.writeWord(0x8001, 0x3000);

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertMemory(0x3005, 0x33); // 0x3000 + 0x05 = 0x3005
    assertEqual(cpu.getPC(), 0x8003);
    assertEqual(cycles, 5);
  });

  // 测试 STA 间接X变址寻址
  runTest('STA ($nn,X) 间接X变址存储', () => {
    cpu.setA(0x77);
    cpu.setX(0x08);
    memory.writeWord(0x0048, 0x4000); // $48,$49 = $4000
    memory.writeByte(0x8000, 0x81); // STA ($40,X)
    memory.writeByte(0x8001, 0x40);

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertMemory(0x4000, 0x77);
    assertEqual(cpu.getPC(), 0x8002);
    assertEqual(cycles, 6);
  });

  // 测试 STA 间接Y变址寻址
  runTest('STA ($nn),Y 间接Y变址存储', () => {
    cpu.setA(0x88);
    cpu.setY(0x12);
    memory.writeWord(0x0050, 0x8000); // $50,$51 = $8000
    memory.writeByte(0x8000, 0x91); // STA ($50),Y
    memory.writeByte(0x8001, 0x50);

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertMemory(0x8012, 0x88); // 0x8000 + 0x12 = 0x8012
    assertEqual(cpu.getPC(), 0x8002);
    assertEqual(cycles, 6);
  });

  // 测试 STX 零页寻址
  runTest('STX $nn 零页存储X', () => {
    cpu.setX(0x66);
    memory.writeByte(0x8000, 0x86); // STX $60
    memory.writeByte(0x8001, 0x60);

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertMemory(0x0060, 0x66);
    assertEqual(cpu.getPC(), 0x8002);
    assertEqual(cycles, 3);
  });

  // 测试 STX 零页Y变址寻址
  runTest('STX $nn,Y 零页Y变址存储X', () => {
    cpu.setX(0x44);
    cpu.setY(0x08);
    memory.writeByte(0x8000, 0x96); // STX $20,Y
    memory.writeByte(0x8001, 0x20);

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertMemory(0x0028, 0x44); // 0x20 + 0x08 = 0x28
    assertEqual(cpu.getPC(), 0x8002);
    assertEqual(cycles, 4);
  });

  // 测试 STX 绝对寻址
  runTest('STX $nnnn 绝对存储X', () => {
    cpu.setX(0x99);
    memory.writeByte(0x8000, 0x8E); // STX $8000
    memory.writeWord(0x8001, 0x8000);

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertMemory(0x8000, 0x99);
    assertEqual(cpu.getPC(), 0x8003);
    assertEqual(cycles, 4);
  });

  // 测试 STY 零页寻址
  runTest('STY $nn 零页存储Y', () => {
    cpu.setY(0x22);
    memory.writeByte(0x8000, 0x84); // STY $70
    memory.writeByte(0x8001, 0x70);

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertMemory(0x0070, 0x22);
    assertEqual(cpu.getPC(), 0x8002);
    assertEqual(cycles, 3);
  });

  // 测试 STY 零页X变址寻址
  runTest('STY $nn,X 零页X变址存储Y', () => {
    cpu.setY(0x11);
    cpu.setX(0x05);
    memory.writeByte(0x8000, 0x94); // STY $80,X
    memory.writeByte(0x8001, 0x80);

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertMemory(0x0085, 0x11); // 0x80 + 0x05 = 0x85
    assertEqual(cpu.getPC(), 0x8002);
    assertEqual(cycles, 4);
  });

  // 测试 STY 绝对寻址
  runTest('STY $nnnn 绝对存储Y', () => {
    cpu.setY(0xEE);
    memory.writeByte(0x8000, 0x8C); // STY $9000
    memory.writeWord(0x8001, 0x9000);

    cpu.setPC(0x8000);
    const cycles = cpu.step();

    assertMemory(0x9000, 0xEE);
    assertEqual(cpu.getPC(), 0x8003);
    assertEqual(cycles, 4);
  });

  // 测试存储到同一个位置的多个指令
  runTest('多个存储指令到同一位置', () => {
    const testAddr = 0x2000;

    // STA
    cpu.setA(0xAA);
    memory.writeByte(0x8000, 0x8D); // STA $2000
    memory.writeWord(0x8001, testAddr);
    cpu.setPC(0x8000);
    cpu.step();
    assertMemory(testAddr, 0xAA);

    // STX
    cpu.setX(0xBB);
    memory.writeByte(0x8003, 0x8E); // STX $2000
    memory.writeWord(0x8004, testAddr);
    cpu.setPC(0x8003);
    cpu.step();
    assertMemory(testAddr, 0xBB);

    // STY
    cpu.setY(0xCC);
    memory.writeByte(0x8007, 0x8C); // STY $2000
    memory.writeWord(0x8008, testAddr);
    cpu.setPC(0x8007);
    cpu.step();
    assertMemory(testAddr, 0xCC);
  });

  // 测试零页回绕
  runTest('零页回绕存储', () => {
    cpu.setX(0xF0);
    cpu.setA(0x33);
    memory.writeByte(0x8000, 0x95); // STA $80,X
    memory.writeByte(0x8001, 0x80);

    cpu.setPC(0x8000);
    cpu.step();

    // 0x80 + 0xF0 = 0x170，零页回绕到 0x70
    assertMemory(0x0070, 0x33);
  });

  console.log(`📊 存储指令测试完成: ${passCount}/${testCount} 通过`);
  return passCount === testCount;
}