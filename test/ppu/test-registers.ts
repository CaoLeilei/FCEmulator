/**
 * PPU 寄存器测试套件
 * 测试 PPU 寄存器的读写操作
 */

import { PPUTestFramework } from './test-framework.js';

export async function testRegisters(framework: PPUTestFramework): Promise<void> {
  framework.startSuite('PPU 寄存器测试');
  const ppu = framework.getPPU();

  // 测试 PPUCTRL ($2000)
  await await framework.runTest('PPUCTRL 写入和读取', () => {
    ppu.writeRegister(0x2000, 0xAA);
    return framework.assertEqual(ppu.readRegister(0x2000), 0xAA, 'PPUCTRL 值不匹配');
  });

  // 测试 PPUMASK ($2001)
  await framework.runTest('PPUMASK 写入和读取', () => {
    ppu.writeRegister(0x2001, 0x1E);
    return framework.assertEqual(ppu.readRegister(0x2001), 0x1E, 'PPUMASK 值不匹配');
  });

  // 测试 PPUSTATUS ($2002)
  await framework.runTest('PPUSTATUS VBlank 标志', () => {
    framework.resetPPU();
    // 运行到 VBlank (扫描线 241, 周期 1)
    // 需要执行 241 条扫描线
    framework.stepPPU(241 * 341 + 2);
    const status = ppu.readRegister(0x2002);
    return framework.assertTrue((status & 0x80) !== 0, 'VBlank 标志未设置');
  });

  // 测试 PPUSTATUS 读取后清除 VBlank 标志
  await framework.runTest('PPUSTATUS 读取清除 VBlank', () => {
    framework.resetPPU();
    framework.stepPPU(241 * 341 + 2);
    ppu.readRegister(0x2002);
    const status = ppu.readRegister(0x2002);
    return framework.assertTrue((status & 0x80) === 0, 'VBlank 标志未清除');
  });

  // 测试 OAMADDR ($2003)
  await framework.runTest('OAMADDR 写入和读取', () => {
    ppu.writeRegister(0x2003, 0x7F);
    return framework.assertEqual(ppu.readRegister(0x2003), 0x7F, 'OAMADDR 值不匹配');
  });

  // 测试 OAMDATA ($2004)
  await framework.runTest('OAMDATA 写入和读取', () => {
    ppu.writeRegister(0x2003, 0x00);
    ppu.writeRegister(0x2004, 0x55);
    ppu.writeRegister(0x2003, 0x00);
    return framework.assertEqual(ppu.readRegister(0x2004), 0x55, 'OAMDATA 值不匹配');
  });

  // 测试 PPUSCROLL ($2005) - 第一次写入
  await framework.runTest('PPUSCROLL 第一次写入', () => {
    framework.resetPPU();
    ppu.writeRegister(0x2005, 0x12);
    const state = ppu.getState();
    // 第一次写入设置 t 的 X 卷动
    return framework.assertTrue(state.t !== 0, 'PPUSCROLL 第一次写入未生效');
  });

  // 测试 PPUSCROLL ($2005) - 第二次写入
  await framework.runTest('PPUSCROLL 第二次写入', () => {
    framework.resetPPU();
    ppu.writeRegister(0x2005, 0x12);
    ppu.writeRegister(0x2005, 0x34);
    const state = ppu.getState();
    // 第二次写入设置 t 的 Y 卷动
    return framework.assertTrue(state.t !== 0, 'PPUSCROLL 第二次写入未生效');
  });

  // 测试 PPUADDR ($2006) - 第一次写入
  await framework.runTest('PPUADDR 第一次写入', () => {
    framework.resetPPU();
    ppu.writeRegister(0x2006, 0x20);
    const state = ppu.getState();
    return framework.assertTrue(state.t !== 0, 'PPUADDR 第一次写入未生效');
  });

  // 测试 PPUADDR ($2006) - 第二次写入
  await framework.runTest('PPUADDR 第二次写入', () => {
    framework.resetPPU();
    ppu.writeRegister(0x2006, 0x20);
    ppu.writeRegister(0x2006, 0x00);
    const state = ppu.getState();
    return framework.assertTrue(state.v !== 0, 'PPUADDR 第二次写入未生效');
  });

  // 测试 PPUDATA ($2007) - 读取调色板
  await framework.runTest('PPUDATA 读取调色板', () => {
    framework.resetPPU();
    ppu.writeRegister(0x2006, 0x3F00); // 调色板地址
    ppu.writeRegister(0x2007, 0x0F);  // 写入调色板
    ppu.writeRegister(0x2006, 0x3F00);
    const value = ppu.readRegister(0x2007);
    return framework.assertEqual(value, 0x0F, 'PPUDATA 调色板读取失败');
  });

  // 测试 PPUDATA ($2007) - VRAM 缓冲区
  await framework.runTest('PPUDATA VRAM 缓冲区', () => {
    framework.resetPPU();
    ppu.writeRegister(0x2006, 0x2000);
    ppu.readRegister(0x2007); // 填充缓冲区
    const value = ppu.readRegister(0x2007);
    return framework.assertTrue(value !== undefined, 'PPUDATA VRAM 缓冲区读取失败');
  });

  // 测试 PPUDATA 地址递增
  await framework.runTest('PPUDATA 地址递增', () => {
    framework.resetPPU();
    ppu.writeRegister(0x2000, 0x04); // 设置增量模式
    ppu.writeRegister(0x2006, 0x20);
    ppu.writeRegister(0x2006, 0x00);
    const state1 = ppu.getState();
    ppu.writeRegister(0x2007, 0x55);
    const state2 = ppu.getState();
    return framework.assertTrue(state2.v > state1.v, 'PPUDATA 地址未递增');
  });

  // 测试 NMI 输出控制
  await framework.runTest('PPUCTRL NMI 输出控制', () => {
    framework.resetPPU();
    ppu.writeRegister(0x2000, 0x80); // 启用 NMI
    const state = ppu.getState();
    return framework.assertTrue(state.nmiOutput, 'NMI 输出未启用');
  });

  // 测试名称表基址
  await framework.runTest('PPUCTRL 名称表基址', () => {
    framework.resetPPU();
    ppu.writeRegister(0x2000, 0x03); // 选择名称表 3
    const ctrl = ppu.readRegister(0x2000);
    return framework.assertTrue((ctrl & 0x03) === 0x03, '名称表基址未正确设置');
  });

  framework.endSuite('PPU 寄存器测试');
}
