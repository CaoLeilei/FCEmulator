import { Emulator } from '@/core/emulator/index';
console.log('hello world')

const emulator = new Emulator();

// 调用 nodejs 的读取文件的方法，读取 cartridge 文件（在../../roms/[009]  桌面类 - 网球.NES）,然后返回Uint8Array的数据内容
function loadCartridge() {

}