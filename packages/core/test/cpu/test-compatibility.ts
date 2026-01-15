// 兼容性测试 - 测试经典ROM和场景
import { CPU } from '../../src/core/cpu/index.js';
import { TestCartridge } from '../test-cartridge.js';
import { Memory } from '../../src/core/memory/index.js';

export function testCompatibility() {
  console.log('🧪 开始兼容性测试...');

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
      throw new Error(message || `期望 ${expected}(0x${(expected as number).toString(16)})，实际 ${actual}(0x${(actual as number).toString(16)})`);
    }
  }

  // 测试经典指令序列
  runTest('经典累加器操作序列', () => {
    // 设置复位向量到测试程序的起始地址
    memory.writeWord(0xFFFC, 0x8000); // Reset向量指向0x8000
    cpu.reset();

    // LDA #$10
    memory.writeByte(0x8000, 0xA9);
    memory.writeByte(0x8001, 0x10);
    cpu.step();
    assertEqual(cpu.getA(), 0x10);

    // ADC #$20
    memory.writeByte(0x8002, 0x69);
    memory.writeByte(0x8003, 0x20);
    cpu.step();
    assertEqual(cpu.getA(), 0x30);
    assertEqual(cpu.getFlag('C'), false);

    // STA $00
    memory.writeByte(0x8004, 0x85);
    memory.writeByte(0x8005, 0x00);
    cpu.step();
    assertEqual(memory.readByte(0x0000), 0x30);

    // LDA $00
    memory.writeByte(0x8006, 0xA5);
    memory.writeByte(0x8007, 0x00);
    cpu.step();
    assertEqual(cpu.getA(), 0x30);
  });

  runTest('标志位操作经典场景', () => {
    // 设置复位向量到测试程序的起始地址
    memory.writeWord(0xFFFC, 0x8000); // Reset向量指向0x8000
    cpu.reset();

    // CLC
    memory.writeByte(0x8000, 0x18); // CLC
    cpu.step();
    assertEqual(cpu.getFlag('C'), false);

    // SEC
    memory.writeByte(0x8001, 0x38); // SEC
    cpu.step();
    assertEqual(cpu.getFlag('C'), true);

    // CLD
    memory.writeByte(0x8002, 0xD8); // CLD
    cpu.step();
    assertEqual(cpu.getFlag('D'), false);

    // SED
    memory.writeByte(0x8003, 0xF8); // SED
    cpu.step();
    assertEqual(cpu.getFlag('D'), true);

    // CLI
    memory.writeByte(0x8004, 0x58); // CLI
    cpu.step();
    assertEqual(cpu.getFlag('I'), false);

    // SEI
    memory.writeByte(0x8005, 0x78); // SEI
    cpu.step();
    assertEqual(cpu.getFlag('I'), true);
  });

  runTest('循环计数经典模式', () => {
    // 设置复位向量到测试程序的起始地址
    memory.writeWord(0xFFFC, 0x8000); // Reset向量指向0x8000
    cpu.reset();

    // 程序布局:
    // 0x8000: LDX #$10
    // 0x8002: DEX
    // 0x8003: BNE 0x8002

    // LDX #$10
    memory.writeByte(0x8000, 0xA2);
    memory.writeByte(0x8001, 0x10);

    // 循环开始
    memory.writeByte(0x8002, 0xCA); // DEX
    memory.writeByte(0x8003, 0xD0); // BNE 
    memory.writeByte(0x8004, 0xFD); // -3 (回到0x8002)

    // 执行程序
    cpu.step(); // LDX
    assertEqual(cpu.getX(), 0x10);
    assertEqual(cpu.getPC(), 0x8002);

    let expectedX = 0x10;
    let iterations = 0;
    const maxIterations = 20; // 防止无限循环

    while (cpu.getPC() === 0x8002 && iterations < maxIterations) {
      cpu.step(); // DEX
      expectedX--;
      assertEqual(cpu.getX(), expectedX);
      assertEqual(cpu.getPC(), 0x8003);

      if (expectedX > 0) {
        cpu.step(); // BNE (应该跳转)
        assertEqual(cpu.getPC(), 0x8002);
      } else {
        cpu.step(); // BNE (不跳转)
        assertEqual(cpu.getPC(), 0x8005);
        break;
      }
      iterations++;
    }
    assertEqual(expectedX, 0);
    assertEqual(iterations, 0x0F); // 15次迭代（从0到14）
  });

  runTest('栈使用经典场景 - 子程序调用', () => {
    cpu.reset();

    // 设置返回地址
    memory.writeWord(0xFFFC, 0x8000); // Reset向量

    cpu.reset(); // PC现在指向0x8000

    // JSR $9000
    memory.writeByte(0x8000, 0x20); // JSR
    memory.writeWord(0x8001, 0x9000);

    // 子程序
    // PHA
    memory.writeByte(0x9000, 0x48); // PHA
    // LDA #$42
    memory.writeByte(0x9001, 0xA9);
    memory.writeByte(0x9002, 0x42);
    // PLA
    memory.writeByte(0x9003, 0x68); // PLA
    // RTS
    memory.writeByte(0x9004, 0x60); // RTS

    cpu.setA(0x11);
    cpu.setPC(0x8000);

    // JSR调用
    const cycles1 = cpu.step();
    assertEqual(cpu.getPC(), 0x9000);
    assertEqual(cpu.getSP(), 0xFB); // 推入了返回地址的低字节

    // PHA
    const cycles2 = cpu.step();
    assertEqual(cpu.getSP(), 0xFA);
    assertEqual(memory.readByte(0x01FA), 0x11); // A入栈

    // LDA #$42
    const cycles3 = cpu.step();
    assertEqual(cpu.getA(), 0x42);

    // PLA
    const cycles4 = cpu.step();
    assertEqual(cpu.getA(), 0x11); // 恢复原始值
    assertEqual(cpu.getSP(), 0xFB);

    // RTS
    const cycles5 = cpu.step();
    assertEqual(cpu.getPC(), 0x8003); // 返回到JSR后面
    assertEqual(cpu.getSP(), 0xFD); // 栈恢复
  });

  runTest('中断处理兼容性测试', () => {
    // 设置复位向量到测试程序的起始地址
    memory.writeWord(0xFFFC, 0x8000); // Reset向量指向0x8000
    cpu.reset();

    // 设置中断向量
    memory.writeWord(0xFFFE, 0xA000); // IRQ向量
    memory.writeWord(0xFFFA, 0xB000); // NMI向量

    // 设置主程序
    memory.writeByte(0x8000, 0xEA); // NOP
    memory.writeByte(0x8001, 0xEA); // NOP

    // 设置IRQ处理程序
    // PHA (保存A)
    memory.writeByte(0xA000, 0x48);
    // LDA #$FF
    memory.writeByte(0xA001, 0xA9);
    memory.writeByte(0xA002, 0xFF);
    // PLA (恢复A)
    memory.writeByte(0xA003, 0x68);
    // RTI
    memory.writeByte(0xA004, 0x40);

    cpu.setA(0x55);
    cpu.setPC(0x8000);
    cpu.setFlag('I', false); // 允许中断

    // 触发IRQ
    cpu.requestIRQ();

    // 检查中断是否被处理
    assertEqual(cpu.getPC(), 0xA000);
    assertEqual(cpu.getFlag('I'), true); // 中断应该被禁用

    // 执行中断处理程序
    cpu.step(); // PHA
    assertEqual(cpu.getSP(), 0xF9);
    assertEqual(memory.readByte(0x01F9), 0x55);

    cpu.step(); // LDA #$FF
    assertEqual(cpu.getA(), 0xFF);

    cpu.step(); // PLA
    assertEqual(cpu.getA(), 0x55); // A应该被恢复

    cpu.step(); // RTI
    assertEqual(cpu.getPC(), 0x8001); // 返回到中断点
    assertEqual(cpu.getSP(), 0xFD); // 栈应该恢复
  });

  runTest('位操作经典场景', () => {
    cpu.reset();

    // 设置测试数据
    memory.writeByte(0x0050, 0b10101010); // 0xAA
    cpu.setA(0b01010101); // 0x55

    // AND $50 - 应该得到0
    memory.writeByte(0x8000, 0x25); // AND $50
    memory.writeByte(0x8001, 0x50);
    cpu.step();
    assertEqual(cpu.getA(), 0x00);
    assertEqual(cpu.getFlag('Z'), true);

    // 重置A
    cpu.setA(0b11110000); // 0xF0

    // ORA $50 - 应该得到0xFA
    memory.writeByte(0x8002, 0x05); // ORA $50
    memory.writeByte(0x8003, 0x50);
    cpu.step();
    assertEqual(cpu.getA(), 0xFA); // 0xF0 | 0xAA = 0xFA
    assertEqual(cpu.getFlag('Z'), false);
    assertEqual(cpu.getFlag('N'), true);

    // 重置A
    cpu.setA(0b11110000); // 0xF0

    // EOR $50 - 应该得到0x5A
    memory.writeByte(0x8004, 0x45); // EOR $50
    memory.writeByte(0x8005, 0x50);
    cpu.step();
    assertEqual(cpu.getA(), 0x5A); // 0xF0 ^ 0xAA = 0x5A
    assertEqual(cpu.getFlag('N'), false);
  });

  runTest('移位操作边界测试', () => {
    memory.writeWord(0xFFFC, 0x8000);
    cpu.reset();

    // 测试8位移位循环
    cpu.setA(0x80);
    cpu.setFlag('C', false); // 清除进位

    // 8次右移的期望值序列
    const expectedValues = [
      0x40, // 0x80 >> 1
      0x20, // 0x40 >> 1
      0x10, // 0x20 >> 1
      0x08, // 0x10 >> 1
      0x04, // 0x08 >> 1
      0x02, // 0x04 >> 1
      0x01, // 0x02 >> 1
      0x00  // 0x01 >> 1
    ];

    // 8次右移，应该回到原始值
    for (let i = 0; i < 8; i++) {
      memory.writeByte(0x8000 + i, 0x6A); // ROR A
    }

    cpu.setPC(0x8000);
    for (let i = 0; i < 8; i++) {
      cpu.step();
      assertEqual(cpu.getA(), expectedValues[i]);
    }
  });

  runTest('算术运算精度测试', () => {
    memory.writeWord(0xFFFC, 0x8000);
    cpu.reset();

    // 测试加法进位链
    cpu.setA(0x01);
    cpu.setFlag('C', true);

    // 连续8次ADC #$FF，应该产生8个进位
    for (let i = 0; i < 8; i++) {
      memory.writeByte(0x8000 + i * 2, 0x69); // ADC #$FF
      memory.writeByte(0x8001 + i * 2, 0xFF);

      cpu.step();
      assertEqual(cpu.getA(), 0x01); // 0x01 + 0xFF + C(1) = 0x101，A = 0x01
      assertEqual(cpu.getFlag('C'), true); // 应该有进位
      assertEqual(cpu.getFlag('Z'), false); // A不为零
    }
  });

  runTest('内存映射I/O兼容性', () => {
    cpu.reset();

    // 测试PPU寄存器访问 (0x2000-0x2007)
    // 这些地址通常有特殊的副作用
    memory.writeByte(0x2000, 0x55);
    cpu.setA(0xAA);

    memory.writeByte(0x8000, 0x8D); // STA $2000
    memory.writeWord(0x8001, 0x2000);

    cpu.step();
    assertEqual(memory.readByte(0x2000), 0xAA);

    // 测试APU寄存器访问 (0x4000-0x4017)
    memory.writeByte(0x4000, 0x33);
    cpu.setA(0xCC);

    memory.writeByte(0x8003, 0x8D); // STA $4000
    memory.writeWord(0x8004, 0x4000);

    cpu.step();
    assertEqual(memory.readByte(0x4000), 0xCC);
  });

  // 简单的Nestest风格测试
  runTest('Nestest风格的基础验证', () => {
    cpu.reset();

    // 设置一些基本的测试场景
    const tests = [
      // [地址, 操作码, 操作数, 预期A, 预期标志]
      [0x8000, 0xA9, 0x00, 0x00, { Z: true, N: false }], // LDA #$00
      [0x8002, 0xA9, 0x80, 0x80, { Z: false, N: true }], // LDA #$80
      [0x8004, 0xA9, 0xFF, 0xFF, { Z: false, N: true }], // LDA #$FF
      [0x8006, 0xA9, 0x7F, 0x7F, { Z: false, N: false }], // LDA #$7F
    ];

    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      const addr = test[0] as number;
      const opcode = test[1] as number;
      const operand = test[2] as number;
      const expectedA = test[3] as number;
      const expectedFlags = test[4] as { Z?: boolean; N?: boolean };

      memory.writeByte(addr, opcode);
      memory.writeByte(addr + 1, operand);

      cpu.setPC(addr);
      cpu.step();

      assertEqual(cpu.getA(), expectedA);

      if (expectedFlags.Z !== undefined) {
        assertEqual(cpu.getFlag('Z'), expectedFlags.Z);
      }
      if (expectedFlags.N !== undefined) {
        assertEqual(cpu.getFlag('N'), expectedFlags.N);
      }
    }
  });

  console.log(`📊 兼容性测试完成: ${passCount}/${testCount} 通过`);
  return passCount === testCount;
}