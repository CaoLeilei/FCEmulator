# CPU 测试使用指南

## 📋 概述

`src/cpu-test.ts` 文件已经完全重构，支持运行生成的测试套件以及原始的验证测试。

## 🚀 使用方法

### 1. 运行完整测试套件

```typescript
import { testCPUInstructions } from './src/cpu-test.js';

// 运行所有测试（原始 + 生成）
testCPUInstructions();

// 只运行生成的测试
testCPUInstructions({ runOriginal: false });

// 只运行原始测试
testCPUInstructions({ runGenerated: false });
```

### 2. 便捷函数

```typescript
import { 
  runQuickTest, 
  runDetailedTest, 
  runTestSuite,
  showAvailableTestSuites 
} from './src/cpu-test.js';

// 快速测试（仅生成的测试）
runQuickTest();

// 详细测试（所有测试，详细输出）
runDetailedTest();

// 运行特定测试套件
runTestSuite('基础指令');
runTestSuite('加载指令');
runTestSuite('算术指令');

// 显示所有可用测试套件
showAvailableTestSuites();
```

### 3. 单独运行测试套件

```typescript
import {
  testBasicInstructions,
  testLoadInstructions,
  testAddressingModes,
  testStoreInstructions,
  testBranchInstructions,
  testArithmeticInstructions,
  testLogicInstructions,
  testShiftInstructions,
  testStackInstructions,
  testInstructionDecoder,
  testCompatibility
} from './src/cpu-test.js';

// 单独运行各个测试
testBasicInstructions();
testLoadInstructions();
// ... 等等
```

## 🌐 浏览器控制台使用

在浏览器中加载此文件后，可以直接在控制台使用：

```javascript
// 主测试
testCPUInstructions();

// 便捷测试
runQuickTest();
runDetailedTest();

// 特定测试套件
runTestSuite('基础指令');

// 查看可用套件
showAvailableTestSuites();

// 单独测试
testBasicInstructions();
testArithmeticInstructions();
```

## 📊 测试覆盖范围

测试套件覆盖以下领域：

1. **基础功能** - NOP, 标志位操作等
2. **数据传送** - LDA, LDX, LDY, STA, STX, STY
3. **寻址模式** - 13种6502寻址模式
4. **算术运算** - ADC, SBC, INC, DEC, INX, DEX等
5. **逻辑运算** - AND, ORA, EOR, BIT
6. **移位操作** - ASL, LSR, ROL, ROR
7. **程序控制** - JMP, JSR, RTS, 分支指令
8. **栈操作** - PHA, PHP, PLA, PLP
9. **标志操作** - CLC, SEC, CLD等
10. **寄存器传送** - TAX, TAY, TXA, TYA等

## 📈 测试统计

运行测试后会显示详细统计信息：
- 总测试套件数量
- 覆盖领域数量
- 每个套件的通过/失败情况
- 执行时间统计

## 🔧 自定义选项

`testCPUInstructions` 函数支持以下选项：

```typescript
interface TestOptions {
  runOriginal?: boolean;      // 是否运行原始测试 (默认: true)
  runGenerated?: boolean;     // 是否运行生成的测试 (默认: true)
  specificSuite?: string;     // 运行特定测试套件
  verbose?: boolean;          // 详细输出模式 (默认: false)
}
```

## 📝 示例输出

```
🧪 开始 CPU 指令集完整测试...
=====================================

📋 运行原始功能验证测试...

✅ 已实现的指令数量: 151

📋 测试基础指令...
📍 测试 NOP...
📍 测试 LDA #$42...

📋 运行生成的测试套件...

🎯 基础指令测试
  ✅ NOP指令测试 - 通过
  ✅ 标志位操作测试 - 通过
  ✅ 寄存器传送测试 - 通过
  通过: 3/3

📊 测试统计信息
==================
📦 总测试套件数: 11
🎯 覆盖领域数: 10

🎉 CPU 指令集测试完成!
```

## 🔧 问题修复

在最新版本中，我们修复了以下问题：

1. **✅ 引入冲突解决** - 修复了 `testBasicInstructions` 和 `testLoadInstructions` 函数名冲突
2. **✅ 浏览器兼容性** - 移除了 `process` 引用，确保在浏览器环境中正常运行
3. **✅ 动态导入优化** - 使用静态导入替代 `require()` 提高性能
4. **✅ Lint 警告清除** - 修复了所有 TypeScript 和 ESLint 警告

## 🎯 测试环境支持

- **✅ 浏览器环境** - 完全支持，所有功能可用
- **✅ Node.js 环境** - 支持通过模块系统运行
- **✅ 混合环境** - 自动检测并适配不同运行环境

这个升级后的测试系统提供了全面的CPU指令集验证，既保留了原有的简单验证功能，又集成了详细的测试套件，为你的FC模拟器项目提供完整的质量保证。