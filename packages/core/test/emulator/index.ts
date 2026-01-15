import { Emulator } from '../../src/core/emulator/index';
import { readFileSync } from 'fs';
import { join } from 'path';
2
console.log('hello world')

const emulator = new Emulator();

// 调用 nodejs 的读取文件的方法，读取 cartridge 文件（在../../roms/[009]  桌面类 - 网球.NES）,然后返回Uint8Array的数据内容

function loadCartridge(): Uint8Array {
  const romPath = join(__dirname, '../../roms/[009]  桌面类 - 网球.NES');
  const buffer = readFileSync(romPath);
  return new Uint8Array(buffer);
}

const cartData = loadCartridge()

emulator.loadCartridge(cartData);

emulator.start();