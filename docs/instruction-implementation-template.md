# CPU 指令实现模板和示例代码

## 📁 文件结构建议

```
src/core/cpu/
├── index.ts                    # CPU主类
├── types.ts                   # 类型定义
├── instructionDecoder.ts       # 指令解码器
├── addressingModes.ts         # 寻址模式实现
├── instructions/              # 指令实现目录
│   ├── basic.ts              # 基础指令(NOP等)
│   ├── load.ts               # 加载指令(LDA,LDX,LDY)
│   ├── store.ts              # 存储指令(STA,STX,STY)
│   ├── transfer.ts           # 传送指令(TAX,TAY等)
│   ├── jump.ts               # 跳转指令(JMP,JSR等)
│   ├── branch.ts             # 分支指令
│   ├── arithmetic.ts         # 算术指令
│   ├── logic.ts              # 逻辑指令
│   ├── shift.ts              # 移位指令
│   ├── stack.ts              # 栈操作指令
│   └── flags.ts              # 标志位操作指令
└── tests/                    # 测试文件
    └── ...
```

## 🏗️ 核心类型定义

```typescript
// src/core/cpu/types.ts

export interface CPURegisters {
  A: number;      // 累加器
  X: number;      // X寄存器
  Y: number;      // Y寄存器
  SP: number;     // 栈指针
  PC: number;     // 程序计数器
}

export interface CPUFlags {
  C: boolean;     // 进位标志
  Z: boolean;     // 零标志
  I: boolean;     // 中断禁用
  D: boolean;     // 十进制模式
  B: boolean;     // 中断标志
  V: boolean;     // 溢出标志
  N: boolean;     // 负数标志
}

export type AddressingMode = 
  | 'immediate' | 'zeroPage' | 'zeroPageX' | 'zeroPageY'
  | 'absolute' | 'absoluteX' | 'absoluteY' | 'indirect'
  | 'indirectX' | 'indirectY' | 'relative' | 'accumulator' | 'implied';

export interface InstructionInfo {
  mnemonic: string;
  mode: AddressingMode;
  cycles: number;
  size: number;
  func: () => number; // 返回实际执行周期数
}

export interface AddressingResult {
  address: number;    // 有效地址
  value?: number;      // 操作数值(如果有)
  crossedPage: boolean; // 是否跨页
  cycles: number;      // 寻址周期数
}
```

## 🔍 寻址模式实现模板

```typescript
// src/core/cpu/addressingModes.ts

export class AddressingModes {
  private cpu: any; // CPU实例引用

  constructor(cpu: any) {
    this.cpu = cpu;
  }

  // 立即寻址 #$nn
  immediate(): AddressingResult {
    const address = this.cpu.PC;
    const value = this.cpu.readByte(address);
    this.cpu.PC++;
    
    return {
      address,
      value,
      crossedPage: false,
      cycles: 0 // 立即寻址不产生额外周期
    };
  }

  // 零页寻址 $nn
  zeroPage(): AddressingResult {
    const address = this.cpu.readByte(this.cpu.PC);
    const value = this.cpu.readByte(address);
    this.cpu.PC++;
    
    return {
      address,
      value,
      crossedPage: false,
      cycles: 0
    };
  }

  // 零页X变址 $nn,X
  zeroPageX(): AddressingResult {
    const base = this.cpu.readByte(this.cpu.PC);
    const address = (base + this.cpu.X) & 0xFF; // 零页回绕
    const value = this.cpu.readByte(address);
    this.cpu.PC++;
    
    return {
      address,
      value,
      crossedPage: false,
      cycles: 0
    };
  }

  // 零页Y变址 $nn,Y
  zeroPageY(): AddressingResult {
    const base = this.cpu.readByte(this.cpu.PC);
    const address = (base + this.cpu.Y) & 0xFF; // 零页回绕
    const value = this.cpu.readByte(address);
    this.cpu.PC++;
    
    return {
      address,
      value,
      crossedPage: false,
      cycles: 0
    };
  }

  // 绝对寻址 $nnnn
  absolute(): AddressingResult {
    const address = this.cpu.readWord(this.cpu.PC);
    const value = this.cpu.readByte(address);
    this.cpu.PC += 2;
    
    return {
      address,
      value,
      crossedPage: false,
      cycles: 0
    };
  }

  // 绝对X变址 $nnnn,X
  absoluteX(): AddressingResult {
    const base = this.cpu.readWord(this.cpu.PC);
    const address = base + this.cpu.X;
    const value = this.cpu.readByte(address);
    const crossedPage = (base & 0xFF00) !== (address & 0xFF00);
    this.cpu.PC += 2;
    
    return {
      address,
      value,
      crossedPage,
      cycles: crossedPage ? 1 : 0 // 跨页额外周期
    };
  }

  // 绝对Y变址 $nnnn,Y
  absoluteY(): AddressingResult {
    const base = this.cpu.readWord(this.cpu.PC);
    const address = base + this.cpu.Y;
    const value = this.cpu.readByte(address);
    const crossedPage = (base & 0xFF00) !== (address & 0xFF00);
    this.cpu.PC += 2;
    
    return {
      address,
      value,
      crossedPage,
      cycles: crossedPage ? 1 : 0 // 跨页额外周期
    };
  }

  // 间接寻址 ($nnnn) - JMP专用
  indirect(): AddressingResult {
    const indirectAddr = this.cpu.readWord(this.cpu.PC);
    
    // 6502的间接寻址bug：如果间接地址的低位是0xFF，会跨页读取
    let effectiveAddr: number;
    if ((indirectAddr & 0x00FF) === 0x00FF) {
      // 模拟6502 bug
      const low = this.cpu.readByte(indirectAddr);
      const high = this.cpu.readByte(indirectAddr & 0xFF00); // 不增加高位
      effectiveAddr = (high << 8) | low;
    } else {
      effectiveAddr = this.cpu.readWord(indirectAddr);
    }
    
    this.cpu.PC += 2;
    
    return {
      address: effectiveAddr,
      crossedPage: false,
      cycles: 0
    };
  }

  // 间接X变址 ($nn,X)
  indirectX(): AddressingResult {
    const zeroPageAddr = this.cpu.readByte(this.cpu.PC);
    const indirectAddr = (zeroPageAddr + this.cpu.X) & 0xFF;
    const effectiveAddr = this.cpu.readWord(indirectAddr);
    const value = this.cpu.readByte(effectiveAddr);
    this.cpu.PC++;
    
    return {
      address: effectiveAddr,
      value,
      crossedPage: false,
      cycles: 0
    };
  }

  // 间接Y变址 ($nn),Y
  indirectY(): AddressingResult {
    const zeroPageAddr = this.cpu.readByte(this.cpu.PC);
    const base = this.cpu.readWord(zeroPageAddr);
    const effectiveAddr = base + this.cpu.Y;
    const value = this.cpu.readByte(effectiveAddr);
    const crossedPage = (base & 0xFF00) !== (effectiveAddr & 0xFF00);
    this.cpu.PC++;
    
    return {
      address: effectiveAddr,
      value,
      crossedPage,
      cycles: crossedPage ? 1 : 0 // 跨页额外周期
    };
  }

  // 相对寻址 - 分支指令专用
  relative(): AddressingResult {
    const offset = this.cpu.readByte(this.cpu.PC);
    let address = this.cpu.PC + 1 + offset;
    
    // 处理有符号偏移
    if (offset >= 0x80) {
      address -= 0x100;
    }
    
    this.cpu.PC++;
    
    const crossedPage = ((this.cpu.PC & 0xFF00) !== (address & 0xFF00));
    
    return {
      address,
      crossedPage,
      cycles: crossedPage ? 2 : 1 // 分支周期：基础2+跨页额外1
    };
  }

  // 累加器寻址
  accumulator(): AddressingResult {
    return {
      address: 0, // 不使用地址
      value: this.cpu.A,
      crossedPage: false,
      cycles: 0
    };
  }

  // 隐含寻址
  implied(): AddressingResult {
    return {
      address: 0, // 不使用地址
      crossedPage: false,
      cycles: 0
    };
  }
}
```

## 📋 指令实现模板

### 基础指令模板

```typescript
// src/core/cpu/instructions/basic.ts

export class BasicInstructions {
  private cpu: any;
  private addressing: AddressingModes;

  constructor(cpu: any, addressing: AddressingModes) {
    this.cpu = cpu;
    this.addressing = addressing;
  }

  // 标志位更新辅助函数
  private updateNZFlags(value: number): void {
    const maskedValue = value & 0xFF;
    this.cpu.P.Z = maskedValue === 0;
    this.cpu.P.N = (maskedValue & 0x80) !== 0;
  }

  // NOP - 空操作
  NOP(): number {
    return 2;
  }
}
```

### 加载指令模板

```typescript
// src/core/cpu/instructions/load.ts

export class LoadInstructions {
  private cpu: any;
  private addressing: AddressingModes;

  constructor(cpu: any, addressing: AddressingModes) {
    this.cpu = cpu;
    this.addressing = addressing;
  }

  private updateNZFlags(value: number): void {
    const maskedValue = value & 0xFF;
    this.cpu.P.Z = maskedValue === 0;
    this.cpu.P.N = (maskedValue & 0x80) !== 0;
  }

  // LDA - Load Accumulator
  LDA_IMM(): number {
    const result = this.addressing.immediate();
    this.cpu.A = result.value!;
    this.updateNZFlags(this.cpu.A);
    return 2;
  }

  LDA_ZP(): number {
    const result = this.addressing.zeroPage();
    this.cpu.A = result.value!;
    this.updateNZFlags(this.cpu.A);
    return 3;
  }

  LDA_ZPX(): number {
    const result = this.addressing.zeroPageX();
    this.cpu.A = result.value!;
    this.updateNZFlags(this.cpu.A);
    return 4;
  }

  LDA_ABS(): number {
    const result = this.addressing.absolute();
    this.cpu.A = result.value!;
    this.updateNZFlags(this.cpu.A);
    return 4;
  }

  LDA_ABSX(): number {
    const result = this.addressing.absoluteX();
    this.cpu.A = result.value!;
    this.updateNZFlags(this.cpu.A);
    return 4 + result.cycles;
  }

  LDA_ABSY(): number {
    const result = this.addressing.absoluteY();
    this.cpu.A = result.value!;
    this.updateNZFlags(this.cpu.A);
    return 4 + result.cycles;
  }

  LDA_INDX(): number {
    const result = this.addressing.indirectX();
    this.cpu.A = result.value!;
    this.updateNZFlags(this.cpu.A);
    return 6;
  }

  LDA_INDY(): number {
    const result = this.addressing.indirectY();
    this.cpu.A = result.value!;
    this.updateNZFlags(this.cpu.A);
    return 5 + result.cycles;
  }

  // LDX - Load X Register
  LDX_IMM(): number {
    const result = this.addressing.immediate();
    this.cpu.X = result.value!;
    this.updateNZFlags(this.cpu.X);
    return 2;
  }

  LDX_ZP(): number {
    const result = this.addressing.zeroPage();
    this.cpu.X = result.value!;
    this.updateNZFlags(this.cpu.X);
    return 3;
  }

  LDX_ZPY(): number {
    const result = this.addressing.zeroPageY();
    this.cpu.X = result.value!;
    this.updateNZFlags(this.cpu.X);
    return 4;
  }

  LDX_ABS(): number {
    const result = this.addressing.absolute();
    this.cpu.X = result.value!;
    this.updateNZFlags(this.cpu.X);
    return 4;
  }

  LDX_ABSY(): number {
    const result = this.addressing.absoluteY();
    this.cpu.X = result.value!;
    this.updateNZFlags(this.cpu.X);
    return 4 + result.cycles;
  }

  // LDY - Load Y Register (类似实现)
  // ... LDX的各种模式
}
```

### 存储指令模板

```typescript
// src/core/cpu/instructions/store.ts

export class StoreInstructions {
  private cpu: any;
  private addressing: AddressingModes;

  constructor(cpu: any, addressing: AddressingModes) {
    this.cpu = cpu;
    this.addressing = addressing;
  }

  // STA - Store Accumulator
  STA_ZP(): number {
    const result = this.addressing.zeroPage();
    this.cpu.writeByte(result.address, this.cpu.A);
    return 3;
  }

  STA_ZPX(): number {
    const result = this.addressing.zeroPageX();
    this.cpu.writeByte(result.address, this.cpu.A);
    return 4;
  }

  STA_ABS(): number {
    const result = this.addressing.absolute();
    this.cpu.writeByte(result.address, this.cpu.A);
    return 4;
  }

  STA_ABSX(): number {
    const result = this.addressing.absoluteX();
    this.cpu.writeByte(result.address, this.cpu.A);
    return 5;
  }

  STA_ABSY(): number {
    const result = this.addressing.absoluteY();
    this.cpu.writeByte(result.address, this.cpu.A);
    return 5;
  }

  STA_INDX(): number {
    const result = this.addressing.indirectX();
    this.cpu.writeByte(result.address, this.cpu.A);
    return 6;
  }

  STA_INDY(): number {
    const result = this.addressing.indirectY();
    this.cpu.writeByte(result.address, this.cpu.A);
    return 6;
  }

  // STX, STY 类似实现...
}
```

### 算术指令模板

```typescript
// src/core/cpu/instructions/arithmetic.ts

export class ArithmeticInstructions {
  private cpu: any;
  private addressing: AddressingModes;

  constructor(cpu: any, addressing: AddressingModes) {
    this.cpu = cpu;
    this.addressing = addressing;
  }

  private updateNZFlags(value: number): void {
    const maskedValue = value & 0xFF;
    this.cpu.P.Z = maskedValue === 0;
    this.cpu.P.N = (maskedValue & 0x80) !== 0;
  }

  // ADC - Add with Carry
  ADC_IMM(): number {
    const result = this.addressing.immediate();
    const operand = result.value!;
    const sum = this.cpu.A + operand + (this.cpu.P.C ? 1 : 0);
    
    // 设置进位
    this.cpu.P.C = sum > 0xFF;
    
    // 设置溢出 (符号不同时检查)
    const signedA = (this.cpu.A << 24) >> 24;
    const signedOp = (operand << 24) >> 24;
    const signedSum = (sum << 24) >> 24;
    this.cpu.P.V = (signedA === signedOp) && (signedA !== signedSum);
    
    this.cpu.A = sum & 0xFF;
    this.updateNZFlags(this.cpu.A);
    
    return 2;
  }

  ADC_ZP(): number {
    const result = this.addressing.zeroPage();
    const operand = result.value!;
    const sum = this.cpu.A + operand + (this.cpu.P.C ? 1 : 0);
    
    this.cpu.P.C = sum > 0xFF;
    
    const signedA = (this.cpu.A << 24) >> 24;
    const signedOp = (operand << 24) >> 24;
    const signedSum = (sum << 24) >> 24;
    this.cpu.P.V = (signedA === signedOp) && (signedA !== signedSum);
    
    this.cpu.A = sum & 0xFF;
    this.updateNZFlags(this.cpu.A);
    
    return 3;
  }

  // 其他寻址模式的ADC...
  
  // SBC - Subtract with Carry
  SBC_IMM(): number {
    const result = this.addressing.immediate();
    const operand = result.value!;
    const diff = this.cpu.A - operand - (this.cpu.P.C ? 0 : 1);
    
    // 设置借位 (进位)
    this.cpu.P.C = diff >= 0;
    
    // 设置溢出
    const signedA = (this.cpu.A << 24) >> 24;
    const signedOp = (operand << 24) >> 24;
    const signedDiff = (diff << 24) >> 24;
    this.cpu.P.V = (signedA !== signedOp) && (signedA !== signedDiff);
    
    this.cpu.A = diff & 0xFF;
    this.updateNZFlags(this.cpu.A);
    
    return 2;
  }

  // 其他算术指令...
}
```

## 🔧 指令解码器实现

```typescript
// src/core/cpu/instructionDecoder.ts

import { InstructionInfo, AddressingMode } from './types';
import { BasicInstructions } from './instructions/basic';
import { LoadInstructions } from './instructions/load';
import { StoreInstructions } from './instructions/store';
import { ArithmeticInstructions } from './instructions/arithmetic';
// ... 导入其他指令类

export class InstructionDecoder {
  private cpu: any;
  private addressing: AddressingModes;
  private basic: BasicInstructions;
  private load: LoadInstructions;
  private store: StoreInstructions;
  private arithmetic: ArithmeticInstructions;
  // ... 其他指令实例

  constructor(cpu: any) {
    this.cpu = cpu;
    this.addressing = new AddressingModes(cpu);
    
    // 初始化指令实现类
    this.basic = new BasicInstructions(cpu, this.addressing);
    this.load = new LoadInstructions(cpu, this.addressing);
    this.store = new StoreInstructions(cpu, this.addressing);
    this.arithmetic = new ArithmeticInstructions(cpu, this.addressing);
  }

  // 指令表
  private instructionTable: { [key: number]: InstructionInfo } = {
    // 基础指令
    0xEA: { mnemonic: 'NOP', mode: 'implied', cycles: 2, size: 1, func: () => this.basic.NOP() },
    
    // LDA指令
    0xA9: { mnemonic: 'LDA', mode: 'immediate', cycles: 2, size: 2, func: () => this.load.LDA_IMM() },
    0xA5: { mnemonic: 'LDA', mode: 'zeroPage', cycles: 3, size: 2, func: () => this.load.LDA_ZP() },
    0xB5: { mnemonic: 'LDA', mode: 'zeroPageX', cycles: 4, size: 2, func: () => this.load.LDA_ZPX() },
    0xAD: { mnemonic: 'LDA', mode: 'absolute', cycles: 4, size: 3, func: () => this.load.LDA_ABS() },
    0xBD: { mnemonic: 'LDA', mode: 'absoluteX', cycles: 4, size: 3, func: () => this.load.LDA_ABSX() },
    0xB9: { mnemonic: 'LDA', mode: 'absoluteY', cycles: 4, size: 3, func: () => this.load.LDA_ABSY() },
    0xA1: { mnemonic: 'LDA', mode: 'indirectX', cycles: 6, size: 2, func: () => this.load.LDA_INDX() },
    0xB1: { mnemonic: 'LDA', mode: 'indirectY', cycles: 5, size: 2, func: () => this.load.LDA_INDY() },
    
    // STA指令
    0x85: { mnemonic: 'STA', mode: 'zeroPage', cycles: 3, size: 2, func: () => this.store.STA_ZP() },
    0x95: { mnemonic: 'STA', mode: 'zeroPageX', cycles: 4, size: 2, func: () => this.store.STA_ZPX() },
    0x8D: { mnemonic: 'STA', mode: 'absolute', cycles: 4, size: 3, func: () => this.store.STA_ABS() },
    0x9D: { mnemonic: 'STA', mode: 'absoluteX', cycles: 5, size: 3, func: () => this.store.STA_ABSX() },
    0x99: { mnemonic: 'STA', mode: 'absoluteY', cycles: 5, size: 3, func: () => this.store.STA_ABSY() },
    0x81: { mnemonic: 'STA', mode: 'indirectX', cycles: 6, size: 2, func: () => this.store.STA_INDX() },
    0x91: { mnemonic: 'STA', mode: 'indirectY', cycles: 6, size: 2, func: () => this.store.STA_INDY() },
    
    // ADC指令
    0x69: { mnemonic: 'ADC', mode: 'immediate', cycles: 2, size: 2, func: () => this.arithmetic.ADC_IMM() },
    0x65: { mnemonic: 'ADC', mode: 'zeroPage', cycles: 3, size: 2, func: () => this.arithmetic.ADC_ZP() },
    
    // 继续添加其他指令...
  };

  // 执行指令
  executeOpcode(opcode: number): number {
    const instruction = this.instructionTable[opcode];
    
    if (!instruction) {
      console.warn(`未实现的操作码: 0x${opcode.toString(16).toUpperCase().padStart(2, '0')}`);
      return 2; // 默认2个周期
    }
    
    try {
      return instruction.func();
    } catch (error) {
      console.error(`执行指令 ${instruction.mnemonic} 时出错:`, error);
      return instruction.cycles;
    }
  }

  // 获取指令信息
  getInstructionInfo(opcode: number): InstructionInfo | null {
    return this.instructionTable[opcode] || null;
  }

  // 获取指令助记符
  getMnemonic(opcode: number): string {
    const info = this.getInstructionInfo(opcode);
    return info ? info.mnemonic : '???';
  }

  // 检查指令是否已实现
  isImplemented(opcode: number): boolean {
    return opcode in this.instructionTable;
  }
}
```

## 🧪 单元测试模板

```typescript
// src/core/cpu/tests/test-load-instructions.ts

import { CPU } from '../index';
import { Memory } from '../../memory';

describe('Load Instructions', () => {
  let cpu: CPU;
  let memory: Memory;

  beforeEach(() => {
    memory = new Memory();
    cpu = new CPU(memory);
    cpu.reset();
  });

  describe('LDA Instructions', () => {
    test('LDA #$nn should load immediate value', () => {
      // 准备测试数据
      memory.writeByte(0x8000, 0xA9); // LDA #$42
      memory.writeByte(0x8001, 0x42);
      
      cpu.PC = 0x8000;
      
      // 执行指令
      const cycles = cpu.step();
      
      // 验证结果
      expect(cpu.A).toBe(0x42);
      expect(cpu.P.Z).toBe(false);
      expect(cpu.P.N).toBe(false);
      expect(cycles).toBe(2);
    });

    test('LDA #$00 should set zero flag', () => {
      memory.writeByte(0x8000, 0xA9); // LDA #$00
      memory.writeByte(0x8001, 0x00);
      
      cpu.PC = 0x8000;
      
      cpu.step();
      
      expect(cpu.A).toBe(0x00);
      expect(cpu.P.Z).toBe(true);
      expect(cpu.P.N).toBe(false);
    });

    test('LDA #$80 should set negative flag', () => {
      memory.writeByte(0x8000, 0xA9); // LDA #$80
      memory.writeByte(0x8001, 0x80);
      
      cpu.PC = 0x8000;
      
      cpu.step();
      
      expect(cpu.A).toBe(0x80);
      expect(cpu.P.Z).toBe(false);
      expect(cpu.P.N).toBe(true);
    });

    test('LDA $nn should load from zero page', () => {
      // 设置零页数据
      memory.writeByte(0x0030, 0x7F);
      
      // 设置指令
      memory.writeByte(0x8000, 0xA5); // LDA $30
      memory.writeByte(0x8001, 0x30);
      
      cpu.PC = 0x8000;
      
      cpu.step();
      
      expect(cpu.A).toBe(0x7F);
      expect(cpu.P.Z).toBe(false);
      expect(cpu.P.N).toBe(false);
    });

    // 继续添加其他测试...
  });

  describe('LDX Instructions', () => {
    // LDX测试
  });

  describe('LDY Instructions', () => {
    // LDY测试
  });
});
```

## 🎯 实现检查清单

### 每个指令实现时需要检查：
- [ ] **正确性** - 指令功能符合6502规范
- [ ] **标志位** - 所有影响的标志位都正确设置
- [ ] **时序** - 周期数计算准确
- [ ] **边界条件** - 特殊值处理正确
- [ ] **跨页检测** - 变址寻址的跨页处理
- [ ] **文档** - 详细的注释和说明
- [ ] **测试** - 完整的单元测试覆盖

### 代码质量要求：
- [ ] **TypeScript类型** - 严格的类型检查
- [ ] **错误处理** - 适当的错误捕获和处理
- [ ] **性能** - 高效的实现，避免不必要的计算
- [ ] **可读性** - 清晰的代码结构和命名
- [ ] **维护性** - 模块化设计，易于扩展

这些模板和示例代码应该为你实现完整的6502指令集提供坚实的基础。建议从最简单的NOP和LDA指令开始，逐步构建完整的指令集。