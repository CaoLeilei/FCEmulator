import { Emulator } from '../../dist/core/emulator/index.js'
import { readFileSync } from 'fs'

// 测试PPU显示
async function testPPUDisplay () {
  try {
    const emulator = new Emulator()

    // 读取围棋大战ROM
    const romData = new Uint8Array(readFileSync('[008]  桌面类 - 围棋大战.NES'))

    // 加载ROM
    emulator.loadCartridge(romData)
    console.log('✅ ROM 加载成功')

    // 设置渲染回调
    let frameCount = 0
    emulator.onFrameRender = (frameBuffer) => {
      frameCount++
      if (frameCount % 60 === 0) { // 每秒打印一次
        console.log(`🎮 渲染第 ${frameCount} 帧`)
      }
    }

    // 启动模拟器
    console.log('🚀 启动模拟器...')
    emulator.start()

    // 运行一段时间
    setTimeout(() => {
      emulator.stop()
      console.log('⏹️ 模拟器已停止')

      // 输出状态信息
      const state = emulator.getState()
      console.log('📊 最终状态:')
      console.log(`  - 总周期数: ${state.cycleCount}`)
      console.log(`  - PPU扫描线: ${state.ppu.scanline}`)
      console.log(`  - PPU周期: ${state.ppu.cycle}`)
      console.log(`  - PPU控制器: ${state.ppu.ctrl.toString(16)}`)
      console.log(`  - PPUMask: ${state.ppu.mask.toString(16)}`)
    }, 5000)

  } catch (error) {
    console.error('❌ 测试失败:', error)
  }
}

testPPUDisplay()