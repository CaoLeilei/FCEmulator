# CPU 指令集实现规划

## 📊 当前状态分析

根据代码分析，CPU 指令实现情况：
- ✅ CPU 架构框架：90% 完成
- ✅ 中断系统：70% 完成  
- ✅ 内存接口：80% 完成
- ❌ 指令实现：0% 完成
- ❌ 寻址模式：0% 完成

## 🎯 实现策略

### 核心原则
1. **渐进式实现** - 从简单到复杂
2. **测试驱动** - 每个指令都有对应测试
3. **模块化设计** - 按功能分组实现
4. **时序精确** - 严格按照6502时序

### 实现顺序

## 🚀 第一阶段：基础框架 (1-2周)

### 1.1 指令解码器基础
**文件**: `src/core/cpu/instructionDecoder.ts`

```typescript
// 建议的指令表结构
interface InstructionInfo {
  mnemonic: string;
  mode: AddressingMode;
  cycles: number;
  size: number;
  func: () => number; // 返回执行周期数
}

type AddressingMode = 
  | 'immediate' | 'zeroPage' | 'zeroPageX' | 'zeroPageY'
  | 'absolute' | 'absoluteX' | 'absoluteY' | 'indirect'
  | 'indirectX' | 'indirectY' | 'relative' | 'accumulator' | 'implied';
```

### 1.2 寻址模式实现
**文件**: `src/core/cpu/addressingModes.ts`

需要实现的13种寻址模式：
- [ ] `immediate()` - 立即寻址
- [ ] `zeroPage()` - 零页寻址  
- [ ] `zeroPageX()` - 零页X变址
- [ ] `zeroPageY()` - 零页Y变址
- [ ] `absolute()` - 绝对寻址
- [ ] `absoluteX()` - 绝对X变址
- [ ] `absoluteY()` - 绝对Y变址
- [ ] `indirect()` - 间接寻址(JMP专用)
- [ ] `indirectX()` - 间接X变址
- [ ] `indirectY()` - 间接Y变址
- [ ] `relative()` - 相对寻址
- [ ] `accumulator()` - 累加器寻址
- [ ] `implied()` - 隐含寻址

### 1.3 最简指令实现
**文件**: `src/core/cpu/instructions/basic.ts`

#### 1.3.1 NOP (0xEA) - 第一条指令
```typescript
NOP(): number {
  return 2; // 2个周期
}
```

#### 1.3.2 标志位更新函数
```typescript
// 标志位更新辅助函数
private updateNZFlags(value: number): void {
  this.P.Z = (value & 0xFF) === 0;
  this.P.N = (value & 0x80) !== 0;
}
```

## 🔥 第二阶段：数据传送指令 (1-2周)

### 2.1 基础加载指令
**文件**: `src/core/cpu/instructions/load.ts`

- [ ] `LDA_IMM (0xA9)` - 立即加载A
- [ ] `LDA_ZP (0xA5)` - 零页加载A  
- [ ] `LDA_ABS (0xAD)` - 绝对加载A
- [ ] `LDX_IMM (0xA2)` - 立即加载X
- [ ] `LDX_ZP (0xA6)` - 零页加载X
- [ ] `LDY_IMM (0xA0)` - 立即加载Y
- [ ] `LDY_ZP (0xA4)` - 零页加载Y

### 2.2 基础存储指令
**文件**: `src/core/cpu/instructions/store.ts`

- [ ] `STA_ZP (0x85)` - 零页存储A
- [ ] `STA_ABS (0x8D)` - 绝对存储A
- [ ] `STX_ZP (0x86)` - 零页存储X
- [ ] `STX_ABS (0x8E)` - 绝对存储X
- [ ] `STY_ZP (0x84)` - 零页存储Y
- [ ] `STY_ABS (0x8C)` - 绝对存储Y

### 2.3 寄存器传送指令
- [ ] `TAX (0xAA)` - A→X
- [ ] `TAY (0xA8)` - A→Y  
- [ ] `TXA (0x8A)` - X→A
- [ ] `TYA (0x98)` - Y→A
- [ ] `TSX (0xBA)` - SP→X
- [ ] `TXS (0x9A)` - X→SP

## 🎮 第三阶段：程序控制指令 (1周)

### 3.1 跳转指令
**文件**: `src/core/cpu/instructions/jump.ts`

- [ ] `JMP_ABS (0x4C)` - 绝对跳转
- [ ] `JMP_IND (0x6C)` - 间接跳转
- [ ] `JSR (0x20)` - 子程序调用
- [ ] `RTS (0x60)` - 子程序返回

### 3.2 分支指令
**文件**: `src/core/cpu/instructions/branch.ts`

- [ ] `BCC (0x90)` - 进位为0跳转
- [ ] `BCS (0xB0)` - 进位为1跳转
- [ ] `BEQ (0xF0)` - 零标志为1跳转
- [ ] `BNE (0xD0)` - 零标志为0跳转
- [ ] `BMI (0x30)` - 负数跳转
- [ ] `BPL (0x10)` - 正数跳转
- [ ] `BVC (0x50)` - 溢出为0跳转
- [ ] `BVS (0x70)` - 溢出为1跳转

### 3.3 中断指令
- [ ] `BRK (0x00)` - 强制中断
- [ ] `RTI (0x40)` - 中断返回

## 🔧 第四阶段：运算指令 (2周)

### 4.1 算术运算
**文件**: `src/core/cpu/instructions/arithmetic.ts`

- [ ] `ADC_IMM (0x69)` - 立即加法
- [ ] `ADC_ZP (0x65)` - 零页加法
- [ ] `ADC_ABS (0x6D)` - 绝对加法
- [ ] `SBC_IMM (0xE9)` - 立即减法
- [ ] `SBC_ZP (0xE5)` - 零页减法
- [ ] `SBC_ABS (0xED)` - 绝对减法
- [ ] `INC_ZP (0xE6)` - 零页增1
- [ ] `INC_ABS (0xEE)` - 绝对增1
- [ ] `INX (0xE8)` - X增1
- [ ] `INY (0xC8)` - Y增1
- [ ] `DEC_ZP (0xC6)` - 零页减1
- [ ] `DEC_ABS (0xCE)` - 绝对减1
- [ ] `DEX (0xCA)` - X减1
- [ ] `DEY (0x88)` - Y减1

### 4.2 逻辑运算
**文件**: `src/core/cpu/instructions/logic.ts`

- [ ] `AND_IMM (0x29)` - 立即与
- [ ] `AND_ZP (0x25)` - 零页与
- [ ] `AND_ABS (0x2D)` - 绝对与
- [ ] `ORA_IMM (0x09)` - 立即或
- [ ] `ORA_ZP (0x05)` - 零页或
- [ ] `ORA_ABS (0x0D)` - 绝对或
- [ ] `EOR_IMM (0x49)` - 立即异或
- [ ] `EOR_ZP (0x45)` - 零页异或
- [ ] `EOR_ABS (0x4D)` - 绝对异或
- [ ] `BIT_ZP (0x24)` - 零页位测试
- [ ] `BIT_ABS (0x2C)` - 绝对位测试

### 4.3 比较指令
- [ ] `CMP_IMM (0xC9)` - 立即比较
- [ ] `CMP_ZP (0xC5)` - 零页比较
- [ ] `CMP_ABS (0xCD)` - 绝对比较
- [ ] `CPX_IMM (0xE0)` - X立即比较
- [ ] `CPX_ZP (0xE4)` - X零页比较
- [ ] `CPX_ABS (0xEC)` - X绝对比较
- [ ] `CPY_IMM (0xC0)` - Y立即比较
- [ ] `CPY_ZP (0xC4)` - Y零页比较
- [ ] `CPY_ABS (0xCC)` - Y绝对比较

## 🔄 第五阶段：移位和栈操作 (1-2周)

### 5.1 移位指令
**文件**: `src/core/cpu/instructions/shift.ts`

- [ ] `ASL_A (0x0A)` - 累加器左移
- [ ] `ASL_ZP (0x06)` - 零页左移
- [ ] `ASL_ABS (0x0E)` - 绝对左移
- [ ] `LSR_A (0x4A)` - 累加器右移
- [ ] `LSR_ZP (0x46)` - 零页右移
- [ ] `LSR_ABS (0x4E)` - 绝对右移
- [ ] `ROL_A (0x2A)` - 累加器循环左
- [ ] `ROL_ZP (0x26)` - 零页循环左
- [ ] `ROL_ABS (0x2E)` - 绝对循环左
- [ ] `ROR_A (0x6A)` - 累加器循环右
- [ ] `ROR_ZP (0x66)` - 零页循环右
- [ ] `ROR_ABS (0x6E)` - 绝对循环右

### 5.2 栈操作指令
**文件**: `src/core/cpu/instructions/stack.ts`

- [ ] `PHA (0x48)` - A入栈
- [ ] `PHP (0x08)` - 状态入栈
- [ ] `PLA (0x68)` - A出栈
- [ ] `PLP (0x28)` - 状态出栈

### 5.3 标志位操作指令
**文件**: `src/core/cpu/instructions/flags.ts`

- [ ] `CLC (0x18)` - 清除进位
- [ ] `CLD (0xD8)` - 清除十进制
- [ ] `CLI (0x58)` - 清除中断禁用
- [ ] `CLV (0xB8)` - 清除溢出
- [ ] `SEC (0x38)` - 设置进位
- [ ] `SED (0xF8)` - 设置十进制
- [ ] `SEI (0x78)` - 设置中断禁用

## 🎯 第六阶段：完整指令集 (2-3周)

### 6.1 变址寻址完成
完成所有指令的变址寻址模式：
- [ ] 所有指令的X变址模式
- [ ] 所有指令的Y变址模式
- [ ] 间接寻址模式
- [ ] 交叉页面检测

### 6.2 非法指令处理
**文件**: `src/core/cpu/instructions/illegal.ts`

- [ ] 0x02 - 停机指令
- [ ] 其他非法指令的基本支持

## 🧪 测试策略

### 测试文件组织
```
src/core/cpu/tests/
├── test-instruction-decoder.ts    # 指令解码测试
├── test-addressing-modes.ts       # 寻址模式测试
├── test-load-instructions.ts      # 加载指令测试
├── test-store-instructions.ts     # 存储指令测试
├── test-branch-instructions.ts    # 分支指令测试
├── test-arithmetic-instructions.ts # 算术指令测试
├── test-logic-instructions.ts     # 逻辑指令测试
├── test-shift-instructions.ts     # 移位指令测试
├── test-stack-instructions.ts     # 栈操作测试
└── test-compatibility.ts          # 兼容性测试
```

### 测试用例
1. **单元测试** - 每个指令的基本功能
2. **集成测试** - 指令组合执行
3. **时序测试** - 周期数验证
4. **边界测试** - 特殊值处理
5. **兼容性测试** - 经典ROM运行

### 测试工具
- **6502 Test ROM** - 经典指令测试
- **NESTEST** - NES模拟器标准测试
- **自定义测试用例** - 针对性测试

## 📅 时间规划

| 阶段 | 时间 | 主要目标 |
|------|------|----------|
| 第一阶段 | 1-2周 | 框架搭建，NOP指令 |
| 第二阶段 | 1-2周 | 数据传送指令完整实现 |
| 第三阶段 | 1周 | 程序控制指令 |
| 第四阶段 | 2周 | 运算指令完整实现 |
| 第五阶段 | 1-2周 | 移位和栈操作 |
| 第六阶段 | 2-3周 | 完整指令集和优化 |
| 测试阶段 | 1-2周 | 全面测试和调试 |

**总计：8-14周**

## 🎯 里程碑检查点

### 第1周检查点
- [ ] 指令解码器框架完成
- [ ] 至少3种寻址模式实现
- [ ] NOP指令正常工作

### 第3周检查点
- [ ] 所有数据传送指令完成
- [ ] 基础程序控制指令完成
- [ ] 简单ROM可运行

### 第6周检查点
- [ ] 所有运算指令完成
- [ ] 栈操作指令完成
- [ ] 经典测试ROM通过

### 第9周检查点
- [ ] 完整指令集实现
- [ ] 所有测试通过
- [ ] 时序精确性验证

## 📋 质量标准

### 代码质量
- [ ] 每个指令都有详细注释
- [ ] 统一的错误处理
- [ ] 完整的类型定义
- [ ] 性能优化考虑

### 测试覆盖率
- [ ] 指令功能测试：100%
- [ ] 寻址模式测试：100%
- [ ] 边界条件测试：95%
- [ ] 时序测试：90%

### 兼容性
- [ ] 经典NES游戏可运行
- [ ] 6502测试ROM通过
- [ ] 时序精确性符合规范

这个实现计划为你提供了清晰的路线图，建议严格按照阶段性目标推进，确保每个阶段都有充分的测试验证。