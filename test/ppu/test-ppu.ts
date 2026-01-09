// PPU渲染测试
import { PPU } from '../../src/core/ppu/index.js';

console.log('🧪 开始PPU渲染测试...\n');

const ppu = new PPU();

// 设置基本调色板
for (let i = 0; i < 32; i++) {
  ppu.writeRegister(0x3F00 + i, i);
}

// 设置图案表 - 创建简单的8x8像素图案
const patternAddr = 0x0000;
const patternData = [
  0b00111100, // 上半部分
  0b01111110,
  0b11111111,
  0b11111111,
  0b11111111,
  0b11111111,
  0b01111110,
  0b00111100,
  0b00000000, // 下半部分
  0b00000000,
  0b00000000,
  0b00000000,
  0b00000000,
  0b00000000,
  0b00000000,
  0b00000000
];

// 写入图案数据
ppu.writeRegister(0x2006, 0x00); // PPUADDR 高字节
ppu.writeRegister(0x2006, 0x00); // PPUADDR 低字节
for (let i = 0; i < patternData.length; i++) {
  ppu.writeRegister(0x2007, patternData[i]);
}

// 设置名称表 - 在屏幕上显示一些图块
ppu.writeRegister(0x2006, 0x20); // 名称表地址高字节
ppu.writeRegister(0x2006, 0x00); // 名称表地址低字节

// 在前32个位置填入图案索引0
for (let i = 0; i < 32; i++) {
  ppu.writeRegister(0x2007, 0);
}

// 启用背景渲染
ppu.writeRegister(0x2001, 0x08); // PPUMASK - 启用背景

// 模拟运行一帧的PPU周期
console.log('🔄 模拟PPU运行...');
let frameCount = 0;
let totalCycles = 262 * 341; // 一帧的总周期数

for (let cycle = 0; cycle < totalCycles; cycle++) {
  ppu.step();
}

// 获取帧缓冲区
const frameBuffer = ppu.getFrameBuffer();
console.log(`✅ 帧缓冲区大小: ${frameBuffer.length} 字节`);
console.log(`✅ 预期大小: ${256 * 240 * 4} 字节`);

// 检查是否有非零像素（表示渲染成功）
let nonZeroPixels = 0;
for (let i = 0; i < frameBuffer.length; i += 4) {
  if (frameBuffer[i] !== 0 || frameBuffer[i + 1] !== 0 || frameBuffer[i + 2] !== 0) {
    nonZeroPixels++;
  }
}

console.log(`✅ 非零像素数量: ${nonZeroPixels} / ${256 * 240}`);

if (nonZeroPixels > 0) {
  console.log('🎉 PPU渲染测试成功！已检测到图形输出。');
} else {
  console.log('⚠️ PPU可能需要进一步配置才能产生图形输出。');
}

// 输出PPU状态
const state = ppu.getState();
console.log('\n📊 PPU状态:');
console.log(`  帧数: ${state.frame}`);
console.log(`  扫描线: ${state.scanline}`);
console.log(`  周期: ${state.cycle}`);
console.log(`  VBlank标志: ${(state.status & 0x80) ? '1' : '0'}`);
console.log(`  NMI输出: ${state.nmiOutput ? '1' : '0'}`);

console.log('\n✅ PPU测试完成！');