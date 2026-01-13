import fs from 'fs';

const romData = fs.readFileSync('roms/[009]  桌面类 - 网球.NES');

// NES 头部是 16 字节，PRG ROM 从偏移 16 开始
// NMI 向量在 PRG ROM 的最后 6 字节：
// 0xFFFA: NMI 向量
// 0xFFFC: RESET 向量
// 0xFFFE: IRQ/BRK 向量

const prgRomSize = romData[4] * 16384;
const headerSize = 16;

// 读取 NMI 向量（在 PRG ROM 的末尾）
const nmiVectorLow = romData[headerSize + prgRomSize - 6];
const nmiVectorHigh = romData[headerSize + prgRomSize - 5];
const nmiVector = (nmiVectorHigh << 8) | nmiVectorLow;

// 读取 RESET 向量
const resetVectorLow = romData[headerSize + prgRomSize - 4];
const resetVectorHigh = romData[headerSize + prgRomSize - 3];
const resetVector = (resetVectorHigh << 8) | resetVectorLow;

console.log(`PRG ROM size: ${prgRomSize} bytes`);
console.log(`NMI Vector: 0x${nmiVector.toString(16).padStart(4, '0')}`);
console.log(`RESET Vector: 0x${resetVector.toString(16).padStart(4, '0')}`);
