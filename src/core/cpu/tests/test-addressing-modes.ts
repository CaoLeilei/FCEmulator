// 寻址模式测试
import { CPU } from '../index.js';
import { Memory } from '../../memory/index.js';
import { TestCartridge } from '../../../test-cartridge.js';

export function testAddressingModes() {
  console.log('🧪 开始寻址模式测试...');
  
  const memory = new Memory();
  const testCartridge = new TestCartridge(0x10000); // 64KB，覆盖整个地址空间
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

  // 测试立即寻址
  runTest('立即寻址 #$nn', () => {
    memory.writeByte(0x8000, 0xA9); // LDA #$42
    memory.writeByte(0x8001, 0x42);
    
    cpu.setPC(0x8000);
    cpu.step();
    
    assertEqual(cpu.getA(), 0x42);
    assertEqual(cpu.getPC(), 0x8002);
  });

  // 测试零页寻址
  runTest('零页寻址 $nn', () => {
    memory.writeByte(0x0050, 0x7F);
    memory.writeByte(0x8000, 0xA5); // LDA $50
    memory.writeByte(0x8001, 0x50);
    
    cpu.setPC(0x8000);
    cpu.step();
    
    assertEqual(cpu.getA(), 0x7F);
    assertEqual(cpu.getPC(), 0x8002);
  });

  // 测试零页X变址寻址
  runTest('零页X变址寻址 $nn,X', () => {
    cpu.setX(0x05);
    memory.writeByte(0x0055, 0x33);
    memory.writeByte(0x8000, 0xB5); // LDA $50,X
    memory.writeByte(0x8001, 0x50);
    
    cpu.setPC(0x8000);
    cpu.step();
    
    assertEqual(cpu.getA(), 0x33);
    assertEqual(cpu.getPC(), 0x8002);
  });

  // 测试零页Y变址寻址
  runTest('零页Y变址寻址 $nn,Y', () => {
    cpu.setA(0x00); // 清零A寄存器
    cpu.setY(0x03);
    memory.writeByte(0x0063, 0x88);
    memory.writeByte(0x8000, 0xB9); // LDA $60,Y (绝对Y变址，用小地址模拟)
    memory.writeByte(0x8001, 0x60);
    memory.writeByte(0x8002, 0x00);
    
    cpu.setPC(0x8000);
    cpu.step();
    
    assertEqual(cpu.getA(), 0x88);
    assertEqual(cpu.getPC(), 0x8003);
  });

  // 测试绝对寻址
  runTest('绝对寻址 $nnnn', () => {
    memory.writeByte(0x1234, 0x9A);
    memory.writeByte(0x8000, 0xAD); // LDA $1234
    memory.writeWord(0x8001, 0x1234);
    
    cpu.setPC(0x8000);
    cpu.step();
    
    assertEqual(cpu.getA(), 0x9A);
    assertEqual(cpu.getPC(), 0x8003);
  });

  // 测试绝对X变址寻址 - 不跨页
  runTest('绝对X变址寻址 $nnnn,X (不跨页)', () => {
    cpu.setX(0x10);
    memory.writeByte(0x123A, 0x55);
    memory.writeByte(0x8000, 0xBD); // LDA $122A,X
    memory.writeWord(0x8001, 0x122A);
    
    cpu.setPC(0x8000);
    const cycles = cpu.step();
    
    assertEqual(cpu.getA(), 0x55);
    assertEqual(cpu.getPC(), 0x8003);
    assertEqual(cycles, 4); // 不跨页：4周期
  });

  // 测试绝对X变址寻址 - 跨页
  runTest('绝对X变址寻址 $nnnn,X (跨页)', () => {
    cpu.setX(0x20);
    memory.writeByte(0x1305, 0x77);
    memory.writeByte(0x8000, 0xBD); // LDA $12E5,X
    memory.writeWord(0x8001, 0x12E5);
    
    cpu.setPC(0x8000);
    const cycles = cpu.step();
    
    assertEqual(cpu.getA(), 0x77);
    assertEqual(cpu.getPC(), 0x8003);
    assertEqual(cycles, 5); // 跨页：5周期
  });

  // 测试绝对Y变址寻址
  runTest('绝对Y变址寻址 $nnnn,Y', () => {
    cpu.setY(0x08);
    memory.writeByte(0x2008, 0xCC);
    memory.writeByte(0x8000, 0xB9); // LDA $2000,Y
    memory.writeWord(0x8001, 0x2000);
    
    cpu.setPC(0x8000);
    cpu.step();
    
    assertEqual(cpu.getA(), 0xCC);
    assertEqual(cpu.getPC(), 0x8003);
  });

  // 测试间接X变址寻址
  runTest('间接X变址寻址 ($nn,X)', () => {
    cpu.setX(0x10);
    memory.writeWord(0x0020, 0x3000); // $20,$21 = $3000
    memory.writeByte(0x3000, 0xAA);
    memory.writeByte(0x8000, 0xA1); // LDA ($10,X)
    memory.writeByte(0x8001, 0x10);
    
    cpu.setPC(0x8000);
    cpu.step();
    
    assertEqual(cpu.getA(), 0xAA);
    assertEqual(cpu.getPC(), 0x8002);
  });

  // 测试间接Y变址寻址 - 不跨页
  runTest('间接Y变址寻址 ($nn),Y (不跨页)', () => {
    cpu.setY(0x05);
    memory.writeWord(0x0030, 0x4000); // $30,$31 = $4000
    memory.writeByte(0x4005, 0xBB);
    memory.writeByte(0x8000, 0xB1); // LDA ($30),Y
    memory.writeByte(0x8001, 0x30);
    
    cpu.setPC(0x8000);
    const cycles = cpu.step();
    
    assertEqual(cpu.getA(), 0xBB);
    assertEqual(cpu.getPC(), 0x8002);
    assertEqual(cycles, 5); // 不跨页：5周期
  });

  // 测试间接Y变址寻址 - 跨页
  runTest('间接Y变址寻址 ($nn),Y (跨页)', () => {
    cpu.setY(0x20);
    memory.writeWord(0x0040, 0x80F0); // $40,$41 = $80F0
    memory.writeByte(0x8110, 0xDD); // $80F0 + $20 = $8110 (跨页)
    memory.writeByte(0x8000, 0xB1); // LDA ($40),Y
    memory.writeByte(0x8001, 0x40);
    
    cpu.setPC(0x8000);
    const cycles = cpu.step();
    
    assertEqual(cpu.getA(), 0xDD);
    assertEqual(cpu.getPC(), 0x8002);
    assertEqual(cycles, 6); // 跨页：6周期
  });

  // 测试相对寻址 - 正向分支
  runTest('相对寻址 - 正向分支', () => {
    memory.writeByte(0x8000, 0x90); // BCC +10
    memory.writeByte(0x8001, 0x0A);
    
    cpu.setFlag('C', false);
    cpu.setPC(0x8000);
    const cycles = cpu.step();
    
    assertEqual(cpu.getPC(), 0x800C); // 0x8002 + 0x0A
    assertEqual(cycles, 3); // 分支成功：3周期
  });

  // 测试相对寻址 - 负向分支
  runTest('相对寻址 - 负向分支', () => {
    memory.writeByte(0x8010, 0xD0); // BNE -8
    memory.writeByte(0x8011, 0xF8);
    
    cpu.setFlag('Z', false);
    cpu.setPC(0x8010);
    cpu.step();
    
    assertEqual(cpu.getPC(), 0x800A); // 0x8012 - 0x08
  });

  // 测试相对寻址 - 分支不成功
  runTest('相对寻址 - 分支不成功', () => {
    memory.writeByte(0x8000, 0xF0); // BEQ +5
    memory.writeByte(0x8001, 0x05);
    
    cpu.setFlag('Z', false);
    cpu.setPC(0x8000);
    const cycles = cpu.step();
    
    assertEqual(cpu.getPC(), 0x8002); // 不跳转
    assertEqual(cycles, 2); // 分支失败：2周期
  });

  // 测试累加器寻址
  runTest('累加器寻址 A', () => {
    cpu.setA(0x55);
    memory.writeByte(0x8000, 0x0A); // ASL A
    
    cpu.setPC(0x8000);
    cpu.step();
    
    assertEqual(cpu.getA(), 0xAA);
    assertEqual(cpu.getFlag('C'), false);
    assertEqual(cpu.getFlag('N'), true);
    assertEqual(cpu.getPC(), 0x8001);
  });

  // 测试隐含寻址
  runTest('隐含寻址', () => {
    cpu.setA(0x42);
    memory.writeByte(0x8000, 0xAA); // TAX
    
    cpu.setPC(0x8000);
    cpu.step();
    
    assertEqual(cpu.getX(), 0x42);
    assertEqual(cpu.getFlag('Z'), false);
    assertEqual(cpu.getFlag('N'), false);
    assertEqual(cpu.getPC(), 0x8001);
  });

  // 测试6502间接寻址bug
  runTest('6502间接寻址bug ($FFXX)', () => {
    // 设置bug场景：间接地址低位是0xFF
    memory.writeWord(0x10FF, 0x1234); // 正常应该读取$10FF,$1100
    memory.writeWord(0x1000, 0x5678); // 但bug会读取$10FF,$1000
    memory.writeByte(0x8000, 0x6C); // JMP ($10FF)
    memory.writeWord(0x8001, 0x10FF);
    
    cpu.setPC(0x8000);
    cpu.step();
    
    // 由于bug，应该跳转到0x7834而不是0x3412
    assertEqual(cpu.getPC(), 0x7834);
  });

  console.log(`📊 寻址模式测试完成: ${passCount}/${testCount} 通过`);
  return passCount === testCount;
}