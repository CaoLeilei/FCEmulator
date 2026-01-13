/**
 * PPU 测试框架
 * 提供测试工具、ROM加载和测试报告功能
 */

import { PPU } from '../../src/core/ppu/index.js';
import { Cartridge } from '../../src/core/cartridge/index.js';
import * as fs from 'fs';
import * as path from 'path';

export interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration: number;
}

export interface TestSuite {
  name: string;
  results: TestResult[];
  passed: number;
  failed: number;
  duration: number;
}

export class PPUTestFramework {
  private ppu: PPU;
  private cartridge: Cartridge | null = null;
  private results: TestResult[] = [];
  private startTime: number = 0;

  constructor() {
    this.ppu = new PPU();
  }

  /**
   * 加载 ROM 文件
   */
  async loadROM(romPath: string): Promise<void> {
    try {
      const buffer = fs.readFileSync(romPath);
      const romData = new Uint8Array(buffer);
      this.cartridge = new Cartridge(romData);
      this.ppu.setCartridge(this.cartridge);
      console.log(`✅ 加载 ROM: ${romPath}`);
    } catch (error) {
      throw new Error(`加载 ROM 失败: ${error}`);
    }
  }

  /**
   * 重置 PPU
   */
  resetPPU(): void {
    this.ppu.reset();
  }

  /**
   * 获取 PPU 实例
   */
  getPPU(): PPU {
    return this.ppu;
  }

  /**
   * 获取 Cartridge 实例
   */
  getCartridge(): Cartridge | null {
    return this.cartridge;
  }

  /**
   * 运行单个测试
   */
  async runTest(name: string, testFn: () => boolean | Promise<boolean>, message: string = ''): Promise<void> {
    const testStart = Date.now();
    let passed = false;
    let errorMessage = '';

    try {
      const result = testFn();
      if (result instanceof Promise) {
        passed = await result;
      } else {
        passed = result;
      }
      errorMessage = passed ? (message || '测试通过') : (message || '测试失败');
    } catch (error) {
      passed = false;
      errorMessage = `测试异常: ${error}`;
    }

    this.results.push({
      name,
      passed,
      message: errorMessage,
      duration: Date.now() - testStart
    });

    const status = passed ? '✅' : '❌';
    console.log(`${status} ${name} - ${errorMessage}`);
  }

  /**
   * 断言相等
   */
  assertEqual(actual: any, expected: any, message: string = ''): boolean {
    if (actual !== expected) {
      throw new Error(`${message || '断言失败'}: 期望 ${expected}, 实际 ${actual}`);
    }
    return true;
  }

  /**
   * 断言布尔值
   */
  assertTrue(value: boolean, message: string = ''): boolean {
    if (!value) {
      throw new Error(message || '断言失败: 值为 false');
    }
    return true;
  }

  /**
   * 断言数组包含
   */
  assertArrayContains(array: any[], value: any, message: string = ''): boolean {
    if (!array.includes(value)) {
      throw new Error(message || '断言失败: 数组不包含指定值');
    }
    return true;
  }

  /**
   * 断言范围
   */
  assertInRange(value: number, min: number, max: number, message: string = ''): boolean {
    if (value < min || value > max) {
      throw new Error(`${message || '断言失败'}: 值 ${value} 不在范围 [${min}, ${max}] 内`);
    }
    return true;
  }

  /**
   * 开始测试套件
   */
  startSuite(name: string): void {
    this.results = [];
    this.startTime = Date.now();
    console.log(`\n🧪 开始测试套件: ${name}`);
    console.log('='.repeat(50));
  }

  /**
   * 结束测试套件并输出结果
   */
  endSuite(name: string): TestSuite {
    const duration = Date.now() - this.startTime;
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.length - passed;

    console.log('='.repeat(50));
    console.log(`\n📊 测试套件: ${name}`);
    console.log(`   总计: ${this.results.length}`);
    console.log(`   通过: ${passed}`);
    console.log(`   失败: ${failed}`);
    console.log(`   耗时: ${duration}ms`);

    if (failed > 0) {
      console.log('\n❌ 失败的测试:');
      this.results.filter(r => !r.passed).forEach(r => {
        console.log(`   - ${r.name}: ${r.message}`);
      });
    }

    return {
      name,
      results: this.results,
      passed,
      failed,
      duration
    };
  }

  /**
   * 保存测试报告
   */
  saveReport(suite: TestSuite, outputPath: string): void {
    const report = {
      timestamp: new Date().toISOString(),
      suite,
      summary: {
        total: suite.results.length,
        passed: suite.passed,
        failed: suite.failed,
        duration: suite.duration,
        successRate: ((suite.passed / suite.results.length) * 100).toFixed(2) + '%'
      }
    };

    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 测试报告已保存: ${outputPath}`);
  }

  /**
   * 辅助: 运行指定数量的 PPU 周期
   */
  stepPPU(cycles: number): void {
    for (let i = 0; i < cycles; i++) {
      this.ppu.step();
    }
  }

  /**
   * 辅助: 运行一帧 (262扫描线 * 341周期)
   */
  runFrame(): void {
    this.stepPPU(262 * 341);
  }

  /**
   * 辅助: 运行多帧
   */
  runFrames(frameCount: number): void {
    for (let i = 0; i < frameCount; i++) {
      this.runFrame();
    }
  }

  /**
   * 辅助: 计算帧缓冲区非零像素数量
   */
  countNonZeroPixels(): number {
    const frameBuffer = this.ppu.getFrameBuffer();
    let count = 0;
    for (let i = 0; i < frameBuffer.length; i += 4) {
      if (frameBuffer[i] !== 0 || frameBuffer[i + 1] !== 0 || frameBuffer[i + 2] !== 0) {
        count++;
      }
    }
    return count;
  }

  /**
   * 辅助: 计算帧缓冲区中特定颜色的像素数量
   */
  countPixelsOfColor(color: { r: number, g: number, b: number }): number {
    const frameBuffer = this.ppu.getFrameBuffer();
    let count = 0;
    for (let i = 0; i < frameBuffer.length; i += 4) {
      if (frameBuffer[i] === color.r &&
          frameBuffer[i + 1] === color.g &&
          frameBuffer[i + 2] === color.b) {
        count++;
      }
    }
    return count;
  }

  /**
   * 辅助: 检查 PPU 状态
   */
  checkState(expected: { frame?: number, scanline?: number, cycle?: number }): boolean {
    const state = this.ppu.getState();
    if (expected.frame !== undefined && state.frame !== expected.frame) return false;
    if (expected.scanline !== undefined && state.scanline !== expected.scanline) return false;
    if (expected.cycle !== undefined && state.cycle !== expected.cycle) return false;
    return true;
  }
}

/**
 * 创建测试 ROM 辅助函数
 */
export class TestROMBuilder {
  private data: Uint8Array;

  constructor(prgSize: number = 0x4000, chrSize: number = 0x2000) {
    // NES 头部
    const header = new Uint8Array([
      0x4E, 0x45, 0x53, 0x1A, // 'NES\x1A'
      prgSize / 0x4000,        // PRG ROM 大小 (16KB 单位)
      chrSize / 0x2000,        // CHR ROM 大小 (8KB 单位)
      0x00,                    // Flags 6
      0x00,                    // Flags 7
      0x00, 0x00, 0x00, 0x00,  // 扩展区域
      0x00, 0x00               // 剩余头部
    ]);

    // 创建 ROM 数据
    const totalSize = header.length + prgSize + chrSize;
    this.data = new Uint8Array(totalSize);
    this.data.set(header, 0);
  }

  /**
   * 写入 PRG ROM
   */
  writePRG(address: number, value: number): void {
    const offset = 16 + address;
    if (offset >= this.data.length) return;
    this.data[offset] = value;
  }

  /**
   * 写入 CHR ROM
   */
  writeCHR(address: number, value: number): void {
    const prgSize = (this.data[4]) * 0x4000;
    const chrSize = (this.data[5]) * 0x2000;
    const offset = 16 + prgSize + address;
    if (offset >= this.data.length) return;
    this.data[offset] = value;
  }

  /**
   * 构建并返回 ROM 数据
   */
  build(): Uint8Array {
    return this.data;
  }
}
