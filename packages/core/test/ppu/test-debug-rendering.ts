/**
 * 调试名称表渲染问题
 */

import { PPUTestFramework } from './test-framework.js';

export async function debugNameTableRendering(framework: PPUTestFramework): Promise<void> {
  console.log('\n=== 调试名称表渲染 ===\n');

  const ppu = framework.getPPU();

  // 测试 1: 基本名称表设置和读取
  console.log('测试 1: 基本名称表设置和读取');
  framework.resetPPU();

  // 设置 PPUADDR 到名称表 0 的起始地址
  ppu.writeRegister(0x2006, 0x20); // 高字节
  ppu.writeRegister(0x2006, 0x00); // 低字节

  // 写入一些数据到名称表
  for (let i = 0; i < 32; i++) {
    ppu.writeRegister(0x2007, i);
  }

  // 读取回来验证
  ppu.writeRegister(0x2006, 0x20);
  ppu.writeRegister(0x2006, 0x00);

  let readBackCorrect = true;
  for (let i = 0; i < 32; i++) {
    const value = ppu.readRegister(0x2007);
    if (value !== i) {
      console.error(`  错误: 位置 ${i} 期望 ${i}, 实际 ${value}`);
      readBackCorrect = false;
    }
  }

  if (readBackCorrect) {
    console.log('  ✓ 名称表读写正确');
  } else {
    console.log('  ✗ 名称表读写错误');
  }

  // 测试 2: 图案表写入
  console.log('\n测试 2: 图案表写入');
  framework.resetPPU();

  // 设置 PPUADDR 到图案表起始地址
  ppu.writeRegister(0x2006, 0x00);
  ppu.writeRegister(0x2006, 0x00);

  // 写入测试图案: 全 1 (白色)
  for (let i = 0; i < 16; i++) {
    ppu.writeRegister(0x2007, 0xFF);
  }

  console.log('  ✓ 图案表写入完成');

  // 测试 3: 调色板设置
  console.log('\n测试 3: 调色板设置');
  framework.resetPPU();

  // 设置调色板 0
  ppu.writeRegister(0x2006, 0x3F);
  ppu.writeRegister(0x2006, 0x00);
  ppu.writeRegister(0x2007, 0x0D); // 背景色

  // 设置调色板 0 的颜色 1-3
  ppu.writeRegister(0x2006, 0x3F);
  ppu.writeRegister(0x2006, 0x01);
  ppu.writeRegister(0x2007, 0x06); // 颜色 1

  ppu.writeRegister(0x2006, 0x3F);
  ppu.writeRegister(0x2006, 0x02);
  ppu.writeRegister(0x2007, 0x14); // 颜色 2

  ppu.writeRegister(0x2006, 0x3F);
  ppu.writeRegister(0x2006, 0x03);
  ppu.writeRegister(0x2007, 0x24); // 颜色 3

  // 验证调色板读取
  ppu.writeRegister(0x2006, 0x3F);
  ppu.writeRegister(0x2006, 0x00);

  const paletteData = [];
  for (let i = 0; i < 4; i++) {
    paletteData.push(ppu.readRegister(0x2007));
  }

  console.log(`  调色板数据: [${paletteData.join(', ')}]`);

  if (paletteData[0] === 0x0D && paletteData[1] === 0x06) {
    console.log('  ✓ 调色板设置正确');
  } else {
    console.log('  ✗ 调色板设置错误');
  }

  // 测试 4: 完整渲染测试
  console.log('\n测试 4: 完整渲染测试');
  framework.resetPPU();

  // 设置图案表 - 创建全白图块
  ppu.writeRegister(0x2006, 0x00);
  ppu.writeRegister(0x2006, 0x00);

  for (let i = 0; i < 16; i++) {
    ppu.writeRegister(0x2007, 0xFF);
  }

  // 设置属性表 - 每个图块使用调色板 1
  ppu.writeRegister(0x2006, 0x23);
  ppu.writeRegister(0x2006, 0xC0);
  ppu.writeRegister(0x2007, 0x55); // 每个区域使用调色板 1

  // 设置名称表 - 使用图块 0 填充第一行
  ppu.writeRegister(0x2006, 0x20);
  ppu.writeRegister(0x2006, 0x00);

  for (let i = 0; i < 32; i++) {
    ppu.writeRegister(0x2007, 0); // 使用图块 0
  }

  // 设置调色板
  ppu.writeRegister(0x2006, 0x3F);
  ppu.writeRegister(0x2006, 0x00);

  // 调色板 0
  ppu.writeRegister(0x2007, 0x0D); // 背景
  ppu.writeRegister(0x2007, 0x06); // 颜色 1 (青色)
  ppu.writeRegister(0x2007, 0x14); // 颜色 2
  ppu.writeRegister(0x2007, 0x24); // 颜色 3

  // 启用背景渲染
  ppu.writeRegister(0x2001, 0x08);

  // 运行一帧
  framework.runFrame();

  // 检查渲染结果
  const pixelCount = framework.countNonZeroPixels();
  console.log(`  非零像素数量: ${pixelCount}`);

  if (pixelCount > 0) {
    console.log('  ✓ 渲染成功');
  } else {
    console.log('  ✗ 渲染失败 - 没有像素被渲染');

    // 详细检查
    const state = ppu.getState();
    console.log(`  PPU 状态:`);
    console.log(`    ctrl: ${state.ctrl.toString(16)}`);
    console.log(`    mask: ${state.mask.toString(16)}`);
    console.log(`    scanline: ${state.scanline}`);
    console.log(`    cycle: ${state.cycle}`);
    console.log(`    frame: ${state.frame}`);
  }

  console.log('\n=== 调试完成 ===\n');
}
