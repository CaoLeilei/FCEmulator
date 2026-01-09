// 分支指令测试
import { CPU } from '../index.js';
import { Memory } from '../../memory/index.js';
import { TestCartridge } from '../../../test-cartridge.js';

export function testBranchInstructions() {
  console.log('🧪 开始分支指令测试...');
  
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

  // 测试 BCC - 进位为0时跳转
  runTest('BCC - 进位为0时跳转', () => {
    cpu.setFlag('C', false);
    memory.writeByte(0x8000, 0x90); // BCC +10
    memory.writeByte(0x8001, 0x0A);
    
    cpu.setPC(0x8000);
    const cycles = cpu.step();
    
    assertEqual(cpu.getPC(), 0x800C); // 0x8002 + 0x0A
    assertEqual(cycles, 3); // 分支成功：3周期
  });

  runTest('BCC - 进位为1时不跳转', () => {
    cpu.setFlag('C', true);
    memory.writeByte(0x8000, 0x90); // BCC +10
    memory.writeByte(0x8001, 0x0A);
    
    cpu.setPC(0x8000);
    const cycles = cpu.step();
    
    assertEqual(cpu.getPC(), 0x8002); // 不跳转
    assertEqual(cycles, 2); // 分支失败：2周期
  });

  // 测试 BCS - 进位为1时跳转
  runTest('BCS - 进位为1时跳转', () => {
    cpu.setFlag('C', true);
    memory.writeByte(0x8000, 0xB0); // BCS +5
    memory.writeByte(0x8001, 0x05);
    
    cpu.setPC(0x8000);
    const cycles = cpu.step();
    
    assertEqual(cpu.getPC(), 0x8007); // 0x8002 + 0x05
    assertEqual(cycles, 3);
  });

  runTest('BCS - 进位为0时不跳转', () => {
    cpu.setFlag('C', false);
    memory.writeByte(0x8000, 0xB0); // BCS +5
    memory.writeByte(0x8001, 0x05);
    
    cpu.setPC(0x8000);
    const cycles = cpu.step();
    
    assertEqual(cpu.getPC(), 0x8002);
    assertEqual(cycles, 2);
  });

  // 测试 BEQ - 零标志为1时跳转
  runTest('BEQ - 零标志为1时跳转', () => {
    cpu.setFlag('Z', true);
    memory.writeByte(0x8000, 0xF0); // BEQ +8
    memory.writeByte(0x8001, 0x08);
    
    cpu.setPC(0x8000);
    const cycles = cpu.step();
    
    assertEqual(cpu.getPC(), 0x800A); // 0x8002 + 0x08
    assertEqual(cycles, 3);
  });

  runTest('BEQ - 零标志为0时不跳转', () => {
    cpu.setFlag('Z', false);
    memory.writeByte(0x8000, 0xF0); // BEQ +8
    memory.writeByte(0x8001, 0x08);
    
    cpu.setPC(0x8000);
    const cycles = cpu.step();
    
    assertEqual(cpu.getPC(), 0x8002);
    assertEqual(cycles, 2);
  });

  // 测试 BNE - 零标志为0时跳转
  runTest('BNE - 零标志为0时跳转', () => {
    cpu.setFlag('Z', false);
    memory.writeByte(0x8000, 0xD0); // BNE +6
    memory.writeByte(0x8001, 0x06);
    
    cpu.setPC(0x8000);
    const cycles = cpu.step();
    
    assertEqual(cpu.getPC(), 0x8008); // 0x8002 + 0x06
    assertEqual(cycles, 3);
  });

  runTest('BNE - 零标志为1时不跳转', () => {
    cpu.setFlag('Z', true);
    memory.writeByte(0x8000, 0xD0); // BNE +6
    memory.writeByte(0x8001, 0x06);
    
    cpu.setPC(0x8000);
    const cycles = cpu.step();
    
    assertEqual(cpu.getPC(), 0x8002);
    assertEqual(cycles, 2);
  });

  // 测试 BMI - 负标志为1时跳转
  runTest('BMI - 负标志为1时跳转', () => {
    cpu.setFlag('N', true);
    memory.writeByte(0x8000, 0x30); // BMI +4
    memory.writeByte(0x8001, 0x04);
    
    cpu.setPC(0x8000);
    const cycles = cpu.step();
    
    assertEqual(cpu.getPC(), 0x8006); // 0x8002 + 0x04
    assertEqual(cycles, 3);
  });

  runTest('BMI - 负标志为0时不跳转', () => {
    cpu.setFlag('N', false);
    memory.writeByte(0x8000, 0x30); // BMI +4
    memory.writeByte(0x8001, 0x04);
    
    cpu.setPC(0x8000);
    const cycles = cpu.step();
    
    assertEqual(cpu.getPC(), 0x8002);
    assertEqual(cycles, 2);
  });

  // 测试 BPL - 负标志为0时跳转
  runTest('BPL - 负标志为0时跳转', () => {
    cpu.setFlag('N', false);
    memory.writeByte(0x8000, 0x10); // BPL +7
    memory.writeByte(0x8001, 0x07);
    
    cpu.setPC(0x8000);
    const cycles = cpu.step();
    
    assertEqual(cpu.getPC(), 0x8009); // 0x8002 + 0x07
    assertEqual(cycles, 3);
  });

  runTest('BPL - 负标志为1时不跳转', () => {
    cpu.setFlag('N', true);
    memory.writeByte(0x8000, 0x10); // BPL +7
    memory.writeByte(0x8001, 0x07);
    
    cpu.setPC(0x8000);
    const cycles = cpu.step();
    
    assertEqual(cpu.getPC(), 0x8002);
    assertEqual(cycles, 2);
  });

  // 测试 BVC - 溢出标志为0时跳转
  runTest('BVC - 溢出标志为0时跳转', () => {
    cpu.setFlag('V', false);
    memory.writeByte(0x8000, 0x50); // BVC +3
    memory.writeByte(0x8001, 0x03);
    
    cpu.setPC(0x8000);
    const cycles = cpu.step();
    
    assertEqual(cpu.getPC(), 0x8005); // 0x8002 + 0x03
    assertEqual(cycles, 3);
  });

  runTest('BVC - 溢出标志为1时不跳转', () => {
    cpu.setFlag('V', true);
    memory.writeByte(0x8000, 0x50); // BVC +3
    memory.writeByte(0x8001, 0x03);
    
    cpu.setPC(0x8000);
    const cycles = cpu.step();
    
    assertEqual(cpu.getPC(), 0x8002);
    assertEqual(cycles, 2);
  });

  // 测试 BVS - 溢出标志为1时跳转
  runTest('BVS - 溢出标志为1时跳转', () => {
    cpu.setFlag('V', true);
    memory.writeByte(0x8000, 0x70); // BVS +9
    memory.writeByte(0x8001, 0x09);
    
    cpu.setPC(0x8000);
    const cycles = cpu.step();
    
    assertEqual(cpu.getPC(), 0x800B); // 0x8002 + 0x09
    assertEqual(cycles, 3);
  });

  runTest('BVS - 溢出标志为0时不跳转', () => {
    cpu.setFlag('V', false);
    memory.writeByte(0x8000, 0x70); // BVS +9
    memory.writeByte(0x8001, 0x09);
    
    cpu.setPC(0x8000);
    const cycles = cpu.step();
    
    assertEqual(cpu.getPC(), 0x8002);
    assertEqual(cycles, 2);
  });

  // 测试负向分支（有符号偏移）
  runTest('负向分支 -1', () => {
    cpu.setFlag('Z', false);
    memory.writeByte(0x8010, 0xD0); // BNE -1 (0xFF)
    memory.writeByte(0x8011, 0xFF);
    
    cpu.setPC(0x8010);
    cpu.step();
    
    assertEqual(cpu.getPC(), 0x8011); // 0x8012 - 1 = 0x8011
  });

  runTest('负向分支 -8', () => {
    cpu.setFlag('C', false);
    memory.writeByte(0x8020, 0x90); // BCC -8 (0xF8)
    memory.writeByte(0x8021, 0xF8);
    
    cpu.setPC(0x8020);
    cpu.step();
    
    assertEqual(cpu.getPC(), 0x801A); // 0x8022 - 8 = 0x801A
  });

  // 测试跨页分支的额外周期
  runTest('跨页分支 - 额外周期', () => {
    cpu.setFlag('Z', true);
    memory.writeByte(0x80FF, 0xF0); // BEQ +2 (跨页)
    memory.writeByte(0x8100, 0x02);
    
    cpu.setPC(0x80FF);
    const cycles = cpu.step();
    
    assertEqual(cpu.getPC(), 0x8103); // 0x8101 + 0x02
    assertEqual(cycles, 4); // 跨页分支：4周期
  });

  // 测试分支到分支指令
  runTest('分支链式跳转', () => {
    // 设置第一个分支
    cpu.setFlag('C', false);
    memory.writeByte(0x8000, 0x90); // BCC +5 -> 跳到0x8007
    memory.writeByte(0x8001, 0x05);
    
    // 设置第二个分支
    memory.writeByte(0x8007, 0xD0); // BNE +3 -> 跳到0x800C
    memory.writeByte(0x8008, 0x03);
    
    cpu.setPC(0x8000);
    
    // 执行第一个分支
    const cycles1 = cpu.step();
    assertEqual(cpu.getPC(), 0x8007);
    assertEqual(cycles1, 3);
    
    // 设置BNE的条件
    cpu.setFlag('Z', false);
    
    // 执行第二个分支
    const cycles2 = cpu.step();
    assertEqual(cpu.getPC(), 0x800C);
    assertEqual(cycles2, 3);
  });

  // 测试零偏移量分支
  runTest('零偏移量分支', () => {
    cpu.setFlag('Z', true);
    memory.writeByte(0x8000, 0xF0); // BEQ +0 (无实际跳转)
    memory.writeByte(0x8001, 0x00);
    
    cpu.setPC(0x8000);
    const cycles = cpu.step();
    
    assertEqual(cpu.getPC(), 0x8002); // 0x8002 + 0x00
    assertEqual(cycles, 3); // 仍算分支成功
  });

  console.log(`📊 分支指令测试完成: ${passCount}/${testCount} 通过`);
  return passCount === testCount;
}