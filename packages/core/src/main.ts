import './main.css'
import { Emulator } from './core/emulator/index.js'
import { DebugRenderer } from './frontend/renderer/index.js'
import { UIController } from './frontend/ui/index.js'
import './cpu-test.js' // 导入CPU测试

// 初始化模拟器
const emulator = new Emulator()

// 初始化调试渲染器 (可选)
const patternCanvas1 = document.getElementById('pattern-table-1') as HTMLCanvasElement
const patternCanvas2 = document.getElementById('pattern-table-2') as HTMLCanvasElement
const nameCanvas1 = document.getElementById('nametable-1') as HTMLCanvasElement
const nameCanvas2 = document.getElementById('nametable-2') as HTMLCanvasElement

let debugRenderer: DebugRenderer | null = null
if (patternCanvas1 && patternCanvas2 && nameCanvas1 && nameCanvas2) {
  debugRenderer = new DebugRenderer(patternCanvas1, patternCanvas2, nameCanvas1, nameCanvas2)
}

// 初始化 UI 控制器
const uiController = new UIController(emulator)

// // 设置渲染回调
// emulator.onFrameRender = (frameBuffer: Uint8Array) => {
//   // PPU 帧缓冲区格式: RGBA (4字节/像素), 256x240 像素
//   // 总大小: 256 * 240 * 4 = 245760 字节
//   // 布局: [R, G, B, A, R, G, B, A, ...]
//   // 每个像素占 4 个连续字节，范围 0-255

//   // 验证帧缓冲区数据完整性
//   if (frameBuffer.length !== 256 * 240 * 4) {
//     console.warn(`Invalid frame buffer size: ${frameBuffer.length}, expected ${256 * 240 * 4}`);
//     return;
//   }
// }

// 加载示例 ROM (如果有的话)
// loadSampleROM()

// 错误处理
window.addEventListener('error', (event) => {
  console.error('Emulator error:', event.error)
})

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
  emulator.stop()
})

console.log('FC Emulator initialized')