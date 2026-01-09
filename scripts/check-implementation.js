#!/usr/bin/env node

// 临时统计实现，直接从源码读取
import fs from 'fs';
import path from 'path';

console.log('🔍 FC模拟器CPU指令实现状态检查');
console.log('=====================================');

// 读取指令解码器源码来统计
const decoderPath = path.join(process.cwd(), 'src/core/cpu/instructionDecoder.ts');
const decoderContent = fs.readFileSync(decoderPath, 'utf8');

// 提取指令表中的操作码
const opcodeRegex = /0x[0-9A-Fa-f]{2}:\s*{[^}]*}/g;
const matches = decoderContent.match(opcodeRegex) || [];

console.log(`📊 已实现指令数量: ${matches.length}/151 (${((matches.length/151)*100).toFixed(1)}%)`);
console.log('');

// 按类别统计
const categories = {
  '基础指令': [0xEA, 0x00],
  '寄存器传送': [0xAA, 0xA8, 0x8A, 0x98, 0xBA, 0x9A],
  '加载指令': [
    0xA9, 0xA5, 0xB5, 0xAD, 0xBD, 0xB9, 0xA1, 0xB1, // LDA
    0xA2, 0xA6, 0xB6, 0xAE, 0xBE, // LDX  
    0xA0, 0xA4, 0xB4, 0xAC, 0xBC  // LDY
  ],
  '存储指令': [
    0x85, 0x95, 0x8D, 0x9D, 0x99, 0x81, 0x91, // STA
    0x86, 0x96, 0x8E, // STX
    0x84, 0x94, 0x8C  // STY
  ],
  '算术指令': [
    0x69, 0x65, 0x75, 0x6D, 0x7D, 0x79, 0x61, 0x71, // ADC
    0xE9, 0xE5, 0xF5, 0xED, 0xFD, 0xF9, 0xE1, 0xF1, // SBC
    0xC9, 0xC5, 0xD5, 0xCD, 0xDD, 0xD9, 0xC1, 0xD1, // CMP
    0xE0, 0xE4, 0xEC, // CPX
    0xC0, 0xC4, 0xCC  // CPY
  ],
  '逻辑指令': [
    0x29, 0x25, 0x35, 0x2D, 0x3D, 0x39, 0x21, 0x31, // AND
    0x09, 0x05, 0x15, 0x0D, 0x1D, 0x19, 0x01, 0x11, // ORA
    0x49, 0x45, 0x55, 0x4D, 0x5D, 0x59, 0x41, 0x51, // EOR
    0x24, 0x2C // BIT
  ],
  '跳转指令': [0x4C, 0x6C, 0x20, 0x60, 0x40],
  '分支指令': [0x90, 0xB0, 0xF0, 0x30, 0xD0, 0x10, 0x50, 0x70],
  '移位指令': [
    0x0A, 0x06, 0x16, 0x0E, 0x1E, // ASL
    0x4A, 0x46, 0x56, 0x4E, 0x5E, // LSR
    0x2A, 0x26, 0x36, 0x2E, 0x3E, // ROL
    0x6A, 0x66, 0x76, 0x6E, 0x7E, // ROR
    0xE6, 0xF6, 0xEE, 0xFE, // INC
    0xC6, 0xD6, 0xCE, 0xDE, // DEC
    0xE8, 0xC8, 0xCA, 0x88  // INX, INY, DEX, DEY
  ],
  '栈指令': [0x48, 0x08, 0x68, 0x28],
  '标志位指令': [0x18, 0xD8, 0x58, 0xB8, 0x38, 0xF8, 0x78]
};

// 检查操作码是否已实现
function isImplemented(opcode) {
  const hexStr = `0x${opcode.toString(16).toUpperCase().padStart(2, '0')}:`;
  return decoderContent.includes(hexStr);
}

let totalImplemented = 0;
let totalOpcodes = 0;

Object.entries(categories).forEach(([category, opcodes]) => {
  const implemented = opcodes.filter(isImplemented).length;
  const total = opcodes.length;
  totalImplemented += implemented;
  totalOpcodes += total;
  
  const percentage = ((implemented/total)*100).toFixed(1);
  const status = implemented === total ? '✅' : '⏳';
  
  console.log(`${status} ${category}: ${implemented}/${total} (${percentage}%)`);
});

console.log('');
console.log(`📈 总体进度: ${totalImplemented}/${totalOpcodes} (${((totalImplemented/totalOpcodes)*100).toFixed(1)}%)`);
console.log('');

// 检查未实现的指令
const allOpcodes = Object.values(categories).flat();
const unimplemented = allOpcodes.filter(op => !isImplemented(op));

if (unimplemented.length > 0) {
  console.log('❌ 未实现的指令:');
  unimplemented.forEach(op => {
    console.log(`   0x${op.toString(16).toUpperCase().padStart(2, '0')}`);
  });
} else {
  console.log('🎉 所有指令都已实现！');
}

console.log('');
console.log('🏁 构建状态检查完成');