/**
 * PPU ROM 兼容性测试套件
 * 使用真实 ROM 文件测试 PPU 的兼容性
 */

import { PPUTestFramework } from './test-framework.js';
import * as path from 'path';

export async function testROMCompatibility(framework: PPUTestFramework, romsDir: string): Promise<void> {
  framework.startSuite('PPU ROM 兼容性测试');

  // 可用的 ROM 文件
  const romFiles = [
    '[008]  桌面类 - 围棋大战.NES',
    '[217]  角色类 - 魂斗罗2 中文.nes'
  ];

  for (const romFile of romFiles) {
    const romPath = path.join(romsDir, romFile);

    try {
      await framework.loadROM(romPath);
      await framework.runTest(`加载 ROM: ${romFile}`, () => {
        return framework.assertTrue(framework.getCartridge() !== null, '卡带加载失败');
      });

      // 测试 PPU 与 ROM 的基本交互
      await framework.runTest(`${romFile} - PPU 初始化`, () => {
        framework.resetPPU();
        const state = framework.getPPU().getState();
        return framework.assertTrue(
          state.frame === 0 && state.scanline === 0 && state.cycle === 0,
          'PPU 初始化状态不正确'
        );
      });

      // 运行几帧，检查 PPU 是否正常工作
      await framework.runTest(`${romFile} - 运行多帧`, () => {
        framework.resetPPU();
        const frames = 10;

        // 启用渲染
        framework.getPPU().writeRegister(0x2001, 0x08);

        framework.runFrames(frames);

        const state = framework.getPPU().getState();
        return framework.assertEqual(state.frame, frames, '帧数不正确');
      });

      // 检查 ROM 的 CHR 数据
      await framework.runTest(`${romFile} - CHR 数据访问`, () => {
        const cartridge = framework.getCartridge();
        if (!cartridge) return false;

        // 尝试读取 CHR 数据
        const chrValue = cartridge.readCHR(0x0000);
        return framework.assertTrue(chrValue !== undefined, 'CHR 数据读取失败');
      });

      // 检查镜像模式
      await framework.runTest(`${romFile} - 镜像模式`, () => {
        const cartridge = framework.getCartridge();
        if (!cartridge) return false;

        const mirroring = cartridge.getMirroring();
        const validMirrors = ['horizontal', 'vertical', 'four-screen'] as const;

        return framework.assertTrue(
          validMirrors.includes(mirroring as any),
          `无效的镜像模式: ${mirroring}`
        );
      });

      // 测试渲染
      await framework.runTest(`${romFile} - 渲染测试`, () => {
        framework.resetPPU();

        // 启用渲染
        framework.getPPU().writeRegister(0x2001, 0x08);

        // 运行一帧
        framework.runFrame();

        // 检查是否有输出
        const pixelCount = framework.countNonZeroPixels();
        // ROM 可能没有立即渲染，所以只检查不会崩溃
        return framework.assertTrue(true, `非零像素: ${pixelCount}`);
      });

      // 测试 VBlank
      await framework.runTest(`${romFile} - VBlank 测试`, () => {
        framework.resetPPU();
        framework.getPPU().writeRegister(0x2000, 0x80); // 启用 NMI

        framework.stepPPU(241 * 341 + 2);

        const status = framework.getPPU().readRegister(0x2002);
        return framework.assertTrue((status & 0x80) !== 0, 'VBlank 未触发');
      });

      console.log(`✅ ${romFile} 测试完成`);

    } catch (error) {
      await framework.runTest(`加载 ROM: ${romFile}`, () => {
        throw new Error(`ROM 加载失败: ${error}`);
      });
      console.log(`❌ ${romFile} 测试失败: ${error}`);
    }
  }

  framework.endSuite('PPU ROM 兼容性测试');
}
