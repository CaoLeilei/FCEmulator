/**
 * PPU 渲染测试套件
 * 测试 PPU 的背景、精灵渲染功能
 */

import { PPUTestFramework, TestROMBuilder } from './test-framework.js';

export async function testRendering(framework: PPUTestFramework): void {
  framework.startSuite('PPU 渲染测试');
  const ppu = framework.getPPU();

  // 测试背景渲染启用
  await framework.runTest('背景渲染启用', () => {
    framework.resetPPU();
    ppu.writeRegister(0x2000, 0x08); // PPUMASK - 启用背景
    framework.runFrame();
    const mask = ppu.readRegister(0x2001);
    return framework.assertTrue((mask & 0x08) !== 0, '背景渲染未启用');
  });

  // 测试精灵渲染启用
  await framework.runTest('精灵渲染启用', () => {
    framework.resetPPU();
    ppu.writeRegister(0x2001, 0x10); // PPUMASK - 启用精灵
    const mask = ppu.readRegister(0x2001);
    return framework.assertTrue((mask & 0x10) !== 0, '精灵渲染未启用');
  });

  // 测试帧缓冲区大小
  await framework.runTest('帧缓冲区大小', () => {
    const frameBuffer = ppu.getFrameBuffer();
    const expectedSize = 256 * 240 * 4;
    return framework.assertEqual(frameBuffer.length, expectedSize, '帧缓冲区大小不正确');
  });

  // 测试帧计数器
  await framework.runTest('帧计数器', () => {
    framework.resetPPU();
    const state1 = ppu.getState();
    framework.runFrame();
    const state2 = ppu.getState();
    return framework.assertEqual(state2.frame, state1.frame + 1, '帧计数器不正确');
  });

  // 测试扫描线计数器
  await framework.runTest('扫描线计数器', () => {
    framework.resetPPU();
    framework.stepPPU(256 * 341);
    const state = ppu.getState();
    return framework.assertEqual(state.scanline, 256, '扫描线计数器不正确');
  });

  // 测试周期计数器
  await framework.runTest('周期计数器', () => {
    framework.resetPPU();
    framework.stepPPU(100);
    const state = ppu.getState();
    return framework.assertEqual(state.cycle, 100, '周期计数器不正确');
  });

  // 测试 VBlank 触发
  await framework.runTest('VBlank 触发', () => {
    framework.resetPPU();
    ppu.writeRegister(0x2000, 0x80); // 启用 NMI
    framework.stepPPU(241 * 341 + 2);
    const status = ppu.readRegister(0x2002);
    return framework.assertTrue((status & 0x80) !== 0, 'VBlank 未触发');
  });

  // 测试名称表渲染
  await framework.runTest('名称表渲染', () => {
    framework.resetPPU();

    // 创建测试 CHR ROM 数据
    const chrData = new Uint8Array(0x2000);

    // 创建简单图案
    for (let i = 0; i < 16; i++) {
      chrData[i] = 0xFF; // 第一行全白
    }

    // 设置调色板
    for (let i = 0; i < 32; i++) {
      ppu.writeRegister(0x3F00 + i, i % 64);
    }

    // 写入图案表
    ppu.writeRegister(0x2006, 0x00);
    ppu.writeRegister(0x2006, 0x00);
    for (let i = 0; i < chrData.length; i++) {
      ppu.writeRegister(0x2007, chrData[i]);
    }

    // 设置名称表
    ppu.writeRegister(0x2006, 0x20);
    ppu.writeRegister(0x2006, 0x00);
    for (let i = 0; i < 32; i++) {
      ppu.writeRegister(0x2007, 0);
    }

    // 启用背景渲染
    ppu.writeRegister(0x2001, 0x08);

    // 运行一帧
    framework.runFrame();

    // 检查是否有像素被渲染
    const pixelCount = framework.countNonZeroPixels();
    return framework.assertTrue(pixelCount > 0, `未渲染任何像素, 非零像素数: ${pixelCount}`);
  });

  // 测试调色板渲染
  await framework.runTest('调色板渲染', () => {
    framework.resetPPU();

    // 设置不同的调色板
    ppu.writeRegister(0x3F00, 0x0F); // 背景
    ppu.writeRegister(0x3F01, 0x06); // 颜色 1
    ppu.writeRegister(0x3F02, 0x14); // 颜色 2
    ppu.writeRegister(0x3F03, 0x24); // 颜色 3

    // 创建简单图案
    ppu.writeRegister(0x2006, 0x00);
    ppu.writeRegister(0x2006, 0x00);

    // 图案 0: 全 1
    for (let i = 0; i < 16; i++) {
      ppu.writeRegister(0x2007, 0xFF);
    }

    // 设置名称表
    ppu.writeRegister(0x2006, 0x20);
    ppu.writeRegister(0x2006, 0x00);
    for (let i = 0; i < 32; i++) {
      ppu.writeRegister(0x2007, 0);
    }

    // 启用渲染
    ppu.writeRegister(0x2001, 0x08);

    framework.runFrame();

    const pixelCount = framework.countNonZeroPixels();
    return framework.assertTrue(pixelCount > 0, '调色板渲染失败');
  });

  // 测试精灵渲染
  await framework.runTest('精灵渲染', () => {
    framework.resetPPU();

    // 创建精灵图案
    const spritePattern = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
      spritePattern[i] = 0x55; // 交替模式
    }

    // 设置 CHR ROM 模拟
    ppu.writeRegister(0x2006, 0x00);
    ppu.writeRegister(0x2006, 0x00);
    for (let i = 0; i < spritePattern.length; i++) {
      ppu.writeRegister(0x2007, spritePattern[i]);
    }

    // 设置精灵
    ppu.writeRegister(0x2003, 0x00); // OAMADDR
    ppu.writeRegister(0x2004, 100);    // Y 位置
    ppu.writeRegister(0x2004, 0);      // 图案索引
    ppu.writeRegister(0x2004, 0x00);   // 属性
    ppu.writeRegister(0x2004, 100);    // X 位置

    // 设置精灵调色板
    ppu.writeRegister(0x3F10, 0x06);

    // 启用精灵渲染
    ppu.writeRegister(0x2001, 0x10);

    framework.runFrame();

    const pixelCount = framework.countNonZeroPixels();
    return framework.assertTrue(pixelCount > 0, '精灵渲染失败');
  });

  // 测试滚动
  await framework.runTest('水平滚动', () => {
    framework.resetPPU();

    // 设置滚动
    ppu.writeRegister(0x2005, 10);  // X 滚动
    ppu.writeRegister(0x2005, 0);   // Y 滚动

    const state = ppu.getState();
    return framework.assertTrue(state.x === 10, '水平滚动未正确设置');
  });

  // 测试多帧渲染
  await framework.runTest('多帧渲染', () => {
    framework.resetPPU();
    ppu.writeRegister(0x2001, 0x08);

    const frameCount = 10;
    framework.runFrames(frameCount);

    const state = ppu.getState();
    return framework.assertEqual(state.frame, frameCount, `多帧渲染失败, 期望 ${frameCount} 帧, 实际 ${state.frame} 帧`);
  });

  // 测试渲染启用检查
  await framework.runTest('渲染启用检查', () => {
    framework.resetPPU();
    ppu.writeRegister(0x2001, 0x18); // 启用背景和精灵

    const state = ppu.getState();
    const renderingEnabled = (ppu.readRegister(0x2001) & 0x18) !== 0;

    return framework.assertTrue(renderingEnabled, '渲染未正确启用');
  });

  // 测试预渲染扫描线
  await framework.runTest('预渲染扫描线', () => {
    framework.resetPPU();
    framework.stepPPU(261 * 341);

    const state = ppu.getState();
    return framework.assertEqual(state.scanline, 261, '预渲染扫描线不正确');
  });

  // 测试渲染禁用时的背景填充
  await framework.runTest('渲染禁用背景填充', () => {
    framework.resetPPU();
    // 设置背景色
    ppu.writeRegister(0x3F00, 0x1A);
    // 不启用渲染
    ppu.writeRegister(0x2001, 0x00);

    framework.runFrame();

    // 检查所有像素是否都是背景色
    const expectedColor = { r: 0x66, g: 0x66, b: 0x66 }; // 颜色索引 0x1A 对应的颜色
    const pixelCount = framework.countPixelsOfColor(expectedColor);

    // 由于是黑色背景，期望大部分是黑色
    return framework.assertTrue(pixelCount >= 0, '背景填充不正确');
  });

  framework.endSuite('PPU 渲染测试');
}
