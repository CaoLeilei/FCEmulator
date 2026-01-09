// 栈操作指令测试
import { CPU } from '../index.js';
import { TestCartridge } from '../../../test-cartridge.js';
import { Memory } from '../../memory/index.js';

export function testStackInstructions() {
  console.log('🧪 开始栈操作指令测试...');
  
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

  // 测试 PHA - A入栈
  runTest('PHA - A入栈', () => {
    cpu.setA(0x42);
    cpu.setSP(0xFD);
    memory.writeByte(0x8000, 0x48); // PHA
    
    cpu.setPC(0x8000);
    const cycles = cpu.step();
    
    // 检查栈指针递减
    assertEqual(cpu.getSP(), 0xFC);
    // 检查数据入栈
    assertMemory(0x01FC, 0x42); // 0x100 + 0xFC = 0x1FC
    // 检查周期数
    assertEqual(cycles, 3);
    // A寄存器应该不变
    assertEqual(cpu.getA(), 0x42);
  });

  runTest('PHA - 多次入栈', () => {
    cpu.reset();
    cpu.setA(0x11);
    memory.writeByte(0x8000, 0x48); // PHA
    cpu.setPC(0x8000);
    cpu.step();
    assertEqual(cpu.getSP(), 0xFC);
    assertMemory(0x01FC, 0x11);
    
    cpu.setA(0x22);
    memory.writeByte(0x8001, 0x48); // PHA
    cpu.setPC(0x8001);
    cpu.step();
    assertEqual(cpu.getSP(), 0xFB);
    assertMemory(0x01FB, 0x22);
    
    cpu.setA(0x33);
    memory.writeByte(0x8002, 0x48); // PHA
    cpu.setPC(0x8002);
    cpu.step();
    assertEqual(cpu.getSP(), 0xFA);
    assertMemory(0x01FA, 0x33);
  });

  // 测试 PHP - 状态寄存器入栈
  runTest('PHP - 状态寄存器入栈', () => {
    // 设置一些标志位
    cpu.setFlag('C', true);
    cpu.setFlag('Z', false);
    cpu.setFlag('I', true);
    cpu.setFlag('D', false);
    cpu.setFlag('B', false); // PHP会设置B标志
    cpu.setFlag('V', true);
    cpu.setFlag('N', false);
    
    cpu.setSP(0xFD);
    memory.writeByte(0x8000, 0x08); // PHP
    
    cpu.setPC(0x8000);
    const cycles = cpu.step();
    
    // 检查栈指针
    assertEqual(cpu.getSP(), 0xFC);
    
    // 检查状态寄存器入栈 (PHP会设置B标志位和保留位)
    const pushedValue = memory.readByte(0x01FC);
    // PHP设置B标志(0x10)和保留位(0x20): C(1) + Z(0) + I(1) + D(0) + B(1) + 保留(1) + V(1) + N(0) = 0x75
    assertEqual(pushedValue & 0xFF, 0x75);
    assertEqual(cycles, 3);
  });

  // 测试 PLA - A出栈
  runTest('PLA - A出栈', () => {
    // 先入栈一个值
    cpu.setSP(0xFC);
    memory.writeByte(0x01FC, 0x77); // 模拟栈中数据
    
    memory.writeByte(0x8000, 0x68); // PLA
    
    cpu.setPC(0x8000);
    const cycles = cpu.step();
    
    // 检查A寄存器
    assertEqual(cpu.getA(), 0x77);
    // 检查栈指针递增
    assertEqual(cpu.getSP(), 0xFD);
    // 检查标志位
    assertEqual(cpu.getFlag('Z'), false);
    assertEqual(cpu.getFlag('N'), false);
    assertEqual(cycles, 4);
  });

  runTest('PLA - 出栈设置零标志', () => {
    cpu.setSP(0xFC);
    memory.writeByte(0x01FC, 0x00); // 栈中为零
    
    memory.writeByte(0x8000, 0x68); // PLA
    
    cpu.setPC(0x8000);
    cpu.step();
    
    assertEqual(cpu.getA(), 0x00);
    assertEqual(cpu.getFlag('Z'), true);
    assertEqual(cpu.getFlag('N'), false);
  });

  runTest('PLA - 出栈设置负标志', () => {
    cpu.setSP(0xFC);
    memory.writeByte(0x01FC, 0x80); // 栈中为负数
    
    memory.writeByte(0x8000, 0x68); // PLA
    
    cpu.setPC(0x8000);
    cpu.step();
    
    assertEqual(cpu.getA(), 0x80);
    assertEqual(cpu.getFlag('Z'), false);
    assertEqual(cpu.getFlag('N'), true);
  });

  // 测试 PLP - 状态寄存器出栈
  runTest('PLP - 状态寄存器出栈', () => {
    // 先入栈一个状态值 (修正值)
    cpu.setSP(0xFC);
    memory.writeByte(0x01FC, 0x75); // C(1)+Z(0)+I(1)+D(0)+B(1)+保留(1)+V(1)+N(0) = 0x75
    
    memory.writeByte(0x8000, 0x28); // PLP
    
    cpu.setPC(0x8000);
    const cycles = cpu.step();
    
    // 检查标志位恢复 (忽略B标志位)
    assertEqual(cpu.getFlag('C'), true);
    assertEqual(cpu.getFlag('Z'), false);
    assertEqual(cpu.getFlag('I'), true);
    assertEqual(cpu.getFlag('D'), false);
    assertEqual(cpu.getFlag('V'), true);
    assertEqual(cpu.getFlag('N'), false);
    // 检查栈指针递增
    assertEqual(cpu.getSP(), 0xFD);
    assertEqual(cycles, 4);
  });

  // 测试完整的入栈出栈序列
  runTest('完整入栈出栈序列', () => {
    cpu.reset();
    
    // 设置初始值
    cpu.setA(0xAA);
    cpu.setX(0x55);
    cpu.setY(0x33);
    
    // A入栈
    memory.writeByte(0x8000, 0x48); // PHA
    cpu.setPC(0x8000);
    cpu.step();
    assertEqual(cpu.getSP(), 0xFC);
    
    // X入栈 (通过TXA+PHA模拟)
    memory.writeByte(0x8001, 0x8A); // TXA
    cpu.setPC(0x8001);
    cpu.step();
    memory.writeByte(0x8002, 0x48); // PHA
    cpu.setPC(0x8002);
    cpu.step();
    assertEqual(cpu.getSP(), 0xFB);
    
    // X出栈
    memory.writeByte(0x8003, 0x68); // PLA
    cpu.setPC(0x8003);
    cpu.step();
    assertEqual(cpu.getA(), 0x55); // 应该得到X的值
    assertEqual(cpu.getSP(), 0xFC);
    
    // A出栈
    memory.writeByte(0x8004, 0x68); // PLA
    cpu.setPC(0x8004);
    cpu.step();
    assertEqual(cpu.getA(), 0xAA); // 应该得到原始A的值
    assertEqual(cpu.getSP(), 0xFD);
  });

  // 测试栈溢出处理
  runTest('栈边界测试 - 栈底', () => {
    cpu.reset();
    cpu.setSP(0x00); // 栈底
    cpu.setA(0xFF);
    
    memory.writeByte(0x8000, 0x48); // PHA
    cpu.setPC(0x8000);
    cpu.step();
    
    // 栈指针应该回绕到0xFF
    assertEqual(cpu.getSP(), 0xFF);
    assertMemory(0x01FF, 0xFF);
  });

  runTest('栈边界测试 - 栈顶', () => {
    cpu.reset();
    cpu.setSP(0xFF); // 栈顶
    
    // 在栈顶放置数据
    memory.writeByte(0x01FF, 0x42);
    
    memory.writeByte(0x8000, 0x68); // PLA
    cpu.setPC(0x8000);
    cpu.step();
    
    // 栈指针应该递增到0x00
    assertEqual(cpu.getSP(), 0x00);
    assertEqual(cpu.getA(), 0x42);
  });

  // 测试状态寄存器保存和恢复
  runTest('PHP + PLP 完整状态保存恢复', () => {
    // 设置初始状态
    cpu.setFlag('C', false);
    cpu.setFlag('Z', true);
    cpu.setFlag('I', false);
    cpu.setFlag('D', true);
    cpu.setFlag('V', true);
    cpu.setFlag('N', false);
    
    // 保存状态
    memory.writeByte(0x8000, 0x08); // PHP
    cpu.setPC(0x8000);
    cpu.step();
    
    // 修改状态
    cpu.setFlag('C', true);
    cpu.setFlag('Z', false);
    cpu.setFlag('I', true);
    cpu.setFlag('D', false);
    cpu.setFlag('V', false);
    cpu.setFlag('N', true);
    
    // 恢复状态
    memory.writeByte(0x8001, 0x28); // PLP
    cpu.setPC(0x8001);
    cpu.step();
    
    // 验证状态恢复
    assertEqual(cpu.getFlag('C'), false);
    assertEqual(cpu.getFlag('Z'), true);
    assertEqual(cpu.getFlag('I'), false);
    assertEqual(cpu.getFlag('D'), true);
    assertEqual(cpu.getFlag('V'), true);
    assertEqual(cpu.getFlag('N'), false);
  });

  // 测试中断标志位在PHP中的特殊处理
  runTest('PHP 中断标志位测试', () => {
    // 重置SP到标准值，确保测试在正确状态下运行
    cpu.setSP(0xFD);
    
    // 设置一些标志
    cpu.setFlag('C', true);
    cpu.setFlag('Z', false);
    cpu.setFlag('I', true);
    cpu.setFlag('V', true);
    cpu.setFlag('N', false);
    
    memory.writeByte(0x8000, 0x08); // PHP
    cpu.setPC(0x8000);
    cpu.step();
    
    const status = memory.readByte(0x01FC);
    // PHP应该设置B标志位(0x30)
    assertEqual(status & 0x30, 0x30); // B标志应该被设置
    assertEqual(status & 0x01, 0x01); // C = 1
    assertEqual(status & 0x02, 0x00); // Z = 0
    assertEqual(status & 0x04, 0x04); // I = 1
    assertEqual(status & 0x40, 0x40); // V = 1
    assertEqual(status & 0x80, 0x00); // N = 0
  });

  console.log(`📊 栈操作指令测试完成: ${passCount}/${testCount} 通过`);
  return passCount === testCount;
}