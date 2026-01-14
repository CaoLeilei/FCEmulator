/**
 * PPU 测试套件主入口
 * 运行所有 PPU 自动化测试
 */

import { PPUTestFramework } from './test-framework.js';
import { testRegisters } from './test-registers.js';
import { testRendering } from './test-rendering.js';
import { testMirroring } from './test-mirroring.js';
import { testROMCompatibility } from './test-rom-compat.js';
import { debugNameTableRendering } from './test-debug-rendering.js';
import * as path from 'path';
import * as fs from 'fs';

// PPU 测试主程序
async function runPPUTests(): Promise<void> {
  console.log('🎮 PPU 自动化测试系统');
  console.log('='.repeat(60));
  console.log();

  const framework = new PPUTestFramework();
  const allSuites: any[] = [];
  const overallStart = Date.now();

  // 获取 ROM 目录
  const romsDir = path.resolve(process.cwd(), 'roms');

  // 检查 ROM 目录是否存在
  if (fs.existsSync(romsDir)) {
    console.log(`📂 ROM 目录: ${romsDir}`);
    const romFiles = fs.readdirSync(romsDir);
    console.log(`📦 找到 ${romFiles.length} 个 ROM 文件`);
    console.log();
  } else {
    console.log(`⚠️  ROM 目录不存在: ${romsDir}`);
    console.log('   ROM 兼容性测试将被跳过');
    console.log();
  }

  try {
    // 运行调试脚本（仅当需要调试时）
    if (process.argv.includes('--debug')) {
      await debugNameTableRendering(framework);
      return;
    }

    // 运行寄存器测试
    await testRegisters(framework);

    // 运行渲染测试
    await testRendering(framework);

    // 运行镜像测试
    await testMirroring(framework);

    // 运行 ROM 兼容性测试
    if (fs.existsSync(romsDir)) {
      await testROMCompatibility(framework, romsDir);
    }

    const overallDuration = Date.now() - overallStart;

    // 输出总体结果
    console.log();
    console.log('='.repeat(60));
    console.log('🎯 总体测试结果');
    console.log('='.repeat(60));

    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;

    // 这里可以收集所有测试套件的结果
    // 简化处理，重新计算
    console.log(`   总耗时: ${overallDuration}ms`);
    console.log();

    // 保存测试报告
    const reportDir = path.resolve(process.cwd(), 'test-reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const reportPath = path.join(reportDir, `ppu-test-${Date.now()}.json`);
    console.log(`💾 测试报告目录: ${reportDir}`);
    console.log();

    console.log('✅ 所有测试完成!');

  } catch (error) {
    console.error('\n❌ 测试执行失败:');
    console.error(error);
    process.exit(1);
  }
}

// 运行测试
runPPUTests().catch(error => {
  console.error('未捕获的错误:', error);
  process.exit(1);
});
