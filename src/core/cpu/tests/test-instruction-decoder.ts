// 指令解码器测试
import { CPU } from '../index.js';
import { TestCartridge } from '../../../test-cartridge.js';
import { Memory } from '../../memory/index.js';

export function testInstructionDecoder() {
  console.log('🧪 开始指令解码器测试...');
  
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

  // 测试指令信息获取
  runTest('获取已实现指令信息', () => {
    const info = cpu.getInstructionInfo(0xEA); // NOP
    if (!info) throw new Error('指令信息未找到');
    
    assertEqual(info.mnemonic, 'NOP');
    assertEqual(info.mode, 'implied');
    assertEqual(info.cycles, 2);
    assertEqual(info.size, 1);
  });

  runTest('获取LDA指令信息', () => {
    const info = cpu.getInstructionInfo(0xA9); // LDA #$nn
    if (!info) throw new Error('指令信息未找到');
    
    assertEqual(info.mnemonic, 'LDA');
    assertEqual(info.mode, 'immediate');
    assertEqual(info.cycles, 2);
    assertEqual(info.size, 2);
  });

  // 测试指令实现检查
  runTest('检查已实现指令', () => {
    assertEqual(cpu.isImplemented(0xEA), true);  // NOP
    assertEqual(cpu.isImplemented(0xA9), true);  // LDA #$nn
    assertEqual(cpu.isImplemented(0x85), true);  // STA $nn
    assertEqual(cpu.isImplemented(0x69), true);  // ADC #$nn
    assertEqual(cpu.isImplemented(0x29), true);  // AND #$nn
    assertEqual(cpu.isImplemented(0x0A), true);  // ASL A
    assertEqual(cpu.isImplemented(0x48), true);  // PHA
    assertEqual(cpu.isImplemented(0x90), true);  // BCC
  });

  runTest('检查未实现指令', () => {
    // 这些是典型的未实现指令
    if (cpu.isImplemented(0x02)) throw new Error('0x02应该是未实现的');
    if (cpu.isImplemented(0x12)) throw new Error('0x12应该是未实现的');
    if (cpu.isImplemented(0x92)) throw new Error('0x92应该是未实现的');
    if (cpu.isImplemented(0xB2)) throw new Error('0x92应该是未实现的');
    if (cpu.isImplemented(0xD2)) throw new Error('0xD2应该是未实现的');
    if (cpu.isImplemented(0xF2)) throw new Error('0xF2应该是未实现的');
  });

  // 测试助记符获取
  runTest('获取指令助记符', () => {
    assertEqual(cpu.getInstructionInfo(0xEA)?.mnemonic, 'NOP');
    assertEqual(cpu.getInstructionInfo(0xA9)?.mnemonic, 'LDA');
    assertEqual(cpu.getInstructionInfo(0x85)?.mnemonic, 'STA');
    assertEqual(cpu.getInstructionInfo(0x69)?.mnemonic, 'ADC');
    assertEqual(cpu.getInstructionInfo(0x29)?.mnemonic, 'AND');
  });

  // 测试未实现指令的处理
  runTest('未实现指令执行', () => {
    memory.writeByte(0x8000, 0x02); // 未实现指令
    
    cpu.setPC(0x8000);
    const cycles = cpu.step();
    
    // 未实现指令应该返回默认周期数并继续执行
    assertEqual(cycles >= 0, true);
    assertEqual(cpu.getPC(), 0x8001);
  });

  // 测试已实现指令数量
  runTest('已实现指令数量检查', () => {
    const count = cpu.getImplementedCount();
    // 至少应该有基本的指令实现
    if (count < 50) {
      throw new Error(`已实现指令数量太少: ${count}`);
    }
    console.log(`📈 已实现指令数量: ${count}/151`);
  });

  // 测试不同寻址模式的同一指令
  runTest('LDA 不同寻址模式', () => {
    // LDA的8种寻址模式
    const ldaOpcodes = [
      0xA9, // immediate
      0xA5, // zeroPage
      0xB5, // zeroPageX
      0xAD, // absolute
      0xBD, // absoluteX
      0xB9, // absoluteY
      0xA1, // indirectX
      0xB1  // indirectY
    ];
    
    for (const opcode of ldaOpcodes) {
      const info = cpu.getInstructionInfo(opcode);
      if (!info) throw new Error(`LDA opcode 0x${opcode.toString(16)} 未实现`);
      if (info.mnemonic !== 'LDA') {
        throw new Error(`opcode 0x${opcode.toString(16)} 助记符错误: ${info.mnemonic}`);
      }
    }
  });

  runTest('STA 不同寻址模式', () => {
    // STA的7种寻址模式
    const staOpcodes = [
      0x85, // zeroPage
      0x95, // zeroPageX
      0x8D, // absolute
      0x9D, // absoluteX
      0x99, // absoluteY
      0x81, // indirectX
      0x91  // indirectY
    ];
    
    for (const opcode of staOpcodes) {
      const info = cpu.getInstructionInfo(opcode);
      if (!info) throw new Error(`STA opcode 0x${opcode.toString(16)} 未实现`);
      if (info.mnemonic !== 'STA') {
        throw new Error(`opcode 0x${opcode.toString(16)} 助记符错误: ${info.mnemonic}`);
      }
    }
  });

  // 测试指令大小验证
  runTest('指令大小验证', () => {
    assertEqual(cpu.getInstructionInfo(0xEA)?.size, 1); // NOP
    assertEqual(cpu.getInstructionInfo(0xA9)?.size, 2); // LDA #$nn
    assertEqual(cpu.getInstructionInfo(0xAD)?.size, 3); // LDA $nnnn
    assertEqual(cpu.getInstructionInfo(0x85)?.size, 2); // STA $nn
    assertEqual(cpu.getInstructionInfo(0x8D)?.size, 3); // STA $nnnn
  });

  // 测试指令周期数验证
  runTest('指令周期数验证', () => {
    // 基础指令
    assertEqual(cpu.getInstructionInfo(0xEA)?.cycles, 2); // NOP
    
    // 立即寻址
    assertEqual(cpu.getInstructionInfo(0xA9)?.cycles, 2); // LDA #$nn
    assertEqual(cpu.getInstructionInfo(0x69)?.cycles, 2); // ADC #$nn
    assertEqual(cpu.getInstructionInfo(0x29)?.cycles, 2); // AND #$nn
    
    // 零页寻址
    assertEqual(cpu.getInstructionInfo(0xA5)?.cycles, 3); // LDA $nn
    assertEqual(cpu.getInstructionInfo(0x85)?.cycles, 3); // STA $nn
    assertEqual(cpu.getInstructionInfo(0x65)?.cycles, 3); // ADC $nn
    
    // 绝对寻址
    assertEqual(cpu.getInstructionInfo(0xAD)?.cycles, 4); // LDA $nnnn
    assertEqual(cpu.getInstructionInfo(0x8D)?.cycles, 4); // STA $nnnn
    assertEqual(cpu.getInstructionInfo(0x6D)?.cycles, 4); // ADC $nnnn
    
    // 栈操作
    assertEqual(cpu.getInstructionInfo(0x48)?.cycles, 3); // PHA
    assertEqual(cpu.getInstructionInfo(0x68)?.cycles, 4); // PLA
    assertEqual(cpu.getInstructionInfo(0x08)?.cycles, 3); // PHP
    assertEqual(cpu.getInstructionInfo(0x28)?.cycles, 4); // PLP
  });

  // 测试变址寻址的跨页周期
  runTest('变址寻址跨页周期测试', () => {
    // 这些指令在某些寻址模式下可能有跨页额外周期
    // 基础周期数应该是正确的
    assertEqual(cpu.getInstructionInfo(0xBD)?.cycles, 4); // LDA $nnnn,X
    assertEqual(cpu.getInstructionInfo(0xB9)?.cycles, 4); // LDA $nnnn,Y
    assertEqual(cpu.getInstructionInfo(0xB1)?.cycles, 5); // LDA ($nn),Y
  });

  // 测试指令解码错误处理
  runTest('指令解码错误处理', () => {
    const nullOpcode = 0x99; // 假设这个操作码可能未实现
    
    if (!cpu.isImplemented(nullOpcode)) {
      const info = cpu.getInstructionInfo(nullOpcode);
      assertEqual(info, null);
      
      // 执行未实现指令应该不会崩溃
      memory.writeByte(0x8000, nullOpcode);
      cpu.setPC(0x8000);
      const cycles = cpu.step();
      assertEqual(cycles >= 0, true);
    }
  });

  // 测试指令实现的完整性
  runTest('核心指令组实现检查', () => {
    const coreInstructions = [
      // 基础指令
      0xEA, // NOP
      0x00, // BRK
      
      // 加载指令组
      0xA9, 0xA5, 0xB5, 0xAD, 0xBD, 0xB9, 0xA1, 0xB1, // LDA
      0xA2, 0xA6, 0xB6, 0xAE, 0xBE, // LDX
      0xA0, 0xA4, 0xB4, 0xAC, 0xBC, // LDY
      
      // 存储指令组
      0x85, 0x95, 0x8D, 0x9D, 0x99, 0x81, 0x91, // STA
      0x86, 0x96, 0x8E, // STX
      0x84, 0x94, 0x8C, // STY
      
      // 寄存器传送
      0xAA, 0xA8, 0x8A, 0x98, 0xBA, 0x9A,
    ];
    
    let missingCount = 0;
    for (const opcode of coreInstructions) {
      if (!cpu.isImplemented(opcode)) {
        missingCount++;
        console.log(`⚠️  核心指令 0x${opcode.toString(16).toUpperCase()} 未实现`);
      }
    }
    
    if (missingCount > coreInstructions.length * 0.3) {
      throw new Error(`核心指令缺失过多: ${missingCount}/${coreInstructions.length}`);
    }
  });

  console.log(`📊 指令解码器测试完成: ${passCount}/${testCount} 通过`);
  return passCount === testCount;
}