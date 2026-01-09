/**
 * 测试用的模拟卡带
 * 用于提供PRG ROM内存空间进行测试
 */

export class TestCartridge {
  private prgROM: Uint8Array;

  constructor(size: number = 0x8000) {
    this.prgROM = new Uint8Array(size);
  }

  readPRG(address: number): number {
    // 简单映射：0x8000-0xFFFF映射到PRG ROM
    if (address >= 0x8000 && address < 0x10000) {
      const offset = address - 0x8000;
      if (offset < this.prgROM.length) {
        return this.prgROM[offset];
      }
    }
    // 向量区域也映射到PRG ROM
    if (address >= 0xFFFA && address <= 0xFFFF) {
      const vectorOffset = address - 0x8000;
      if (vectorOffset < this.prgROM.length) {
        return this.prgROM[vectorOffset];
      }
    }
    return 0;
  }

  writePRG(address: number, value: number): void {
    // PRG ROM通常是只读的，但为了测试允许写入
    if (address >= 0x8000 && address < 0x10000) {
      const offset = address - 0x8000;
      if (offset < this.prgROM.length) {
        this.prgROM[offset] = value & 0xFF;
      }
    }
    // 向量区域
    if (address >= 0xFFFA && address <= 0xFFFF) {
      const vectorOffset = address - 0x8000;
      if (vectorOffset < this.prgROM.length) {
        this.prgROM[vectorOffset] = value & 0xFF;
      }
    }
  }

  // 写入测试程序到PRG ROM
  writeProgram(address: number, data: number[]): void {
    for (let i = 0; i < data.length; i++) {
      this.writePRG(address + i, data[i]);
    }
  }
}