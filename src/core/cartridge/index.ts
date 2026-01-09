/**
 * FC 卡带系统
 * 支持 NES ROM 格式和不同的映射器 (Mapper)
 */

export interface Mapper {
  readPRG(address: number): number;
  writePRG(address: number, value: number): void;
  readCHR(address: number): number;
  writeCHR(address: number, value: number): void;
  getMirroring(): 'horizontal' | 'vertical' | 'four-screen';
}

export class Cartridge {
  private prgROM: Uint8Array = new Uint8Array(0);
  private chrROM: Uint8Array = new Uint8Array(0);
  private mapper: Mapper = new NROM(new Uint8Array(0), new Uint8Array(0), 'horizontal');
  private mirroring: 'horizontal' | 'vertical' | 'four-screen' = 'horizontal';
  private battery: boolean = false;
  private trainer: boolean = false;

  constructor(romData: Uint8Array) {
    this.parseROM(romData);
  }

  /**
   * 解析 NES ROM 格式
   */
  private parseROM(data: Uint8Array): void {
    // 检查 NES 头部标识
    if (data.length < 16 ||
      String.fromCharCode(data[0], data[1], data[2], data[3]) !== 'NES\x1A') {
      throw new Error('Invalid NES ROM format');
    }

    // 读取头部信息
    const prgBanks = data[4];
    const chrBanks = data[5];
    const flags6 = data[6];
    const flags7 = data[7];
    this.trainer = !!(flags6 & 0x04);
    this.battery = !!(flags6 & 0x02);

    // 确定镜像模式
    if (flags6 & 0x08) {
      this.mirroring = 'four-screen';
    } else if (flags6 & 0x01) {
      this.mirroring = 'vertical';
    } else {
      this.mirroring = 'horizontal';
    }

    // 确定映射器编号
    const mapperNumber = ((flags7 & 0xF0) | (flags6 >> 4)) & 0xFF;

    let offset = 16;

    // 跳过 trainer 数据
    if (this.trainer) {
      offset += 512;
    }

    // 读取 PRG ROM
    const prgSize = prgBanks * 0x4000;
    this.prgROM = new Uint8Array(data.slice(offset, offset + prgSize));
    offset += prgSize;

    // 读取 CHR ROM
    if (chrBanks > 0) {
      const chrSize = chrBanks * 0x2000;
      this.chrROM = new Uint8Array(data.slice(offset, offset + chrSize));
    } else {
      // CHR RAM
      this.chrROM = new Uint8Array(0x2000);
    }

    // 创建映射器
    this.mapper = this.createMapper(mapperNumber);
  }

  /**
   * 创建映射器实例
   */
  private createMapper(mapperNumber: number): Mapper {
    switch (mapperNumber) {
      case 0:
        return new NROM(this.prgROM, this.chrROM, this.mirroring);
      case 1:
        return new MMC1(this.prgROM, this.chrROM, this.mirroring);
      case 2:
        return new UxROM(this.prgROM, this.chrROM, this.mirroring);
      case 3:
        return new CNROM(this.prgROM, this.chrROM, this.mirroring);
      default:
        throw new Error(`Unsupported mapper: ${mapperNumber}`);
    }
  }

  /**
   * 读取 PRG ROM/RAM
   */
  readPRG(address: number): number {
    return this.mapper.readPRG(address);
  }

  /**
   * 写入 PRG (某些映射器支持)
   */
  writePRG(address: number, value: number): void {
    this.mapper.writePRG(address, value);
  }

  /**
   * 读取 CHR ROM/RAM
   */
  readCHR(address: number): number {
    return this.mapper.readCHR(address);
  }

  /**
   * 写入 CHR RAM
   */
  writeCHR(address: number, value: number): void {
    this.mapper.writeCHR(address, value);
  }

  /**
   * 获取镜像模式
   */
  getMirroring(): 'horizontal' | 'vertical' | 'four-screen' {
    return this.mapper.getMirroring();
  }
}

/**
 * NROM 映射器 (Mapper 0)
 * 最简单的映射器，用于大多数早期游戏
 */
class NROM implements Mapper {
  constructor(
    private prgROM: Uint8Array,
    private chrROM: Uint8Array,
    private mirroring: 'horizontal' | 'vertical' | 'four-screen'
  ) { }

  readPRG(address: number): number {
    if (address >= 0x8000 && address <= 0xFFFF) {
      if (this.prgROM.length === 0x4000) {
        // 16KB PRG ROM，镜像到0x8000-0xFFFF
        const offset = (address - 0x8000) % 0x4000;
        return this.prgROM[offset];
      } else {
        // 32KB PRG ROM
        // 0x8000-0xBFFF: 第一个16KB
        // 0xC000-0xFFFF: 第二个16KB  
        if (address >= 0x8000 && address <= 0xBFFF) {
          const offset = address - 0x8000;
          return this.prgROM[offset] || 0;
        } else if (address >= 0xC000 && address <= 0xFFFF) {
          const offset = address - 0xC000;
          return this.prgROM[0x4000 + offset] || 0;
        }
      }
    }
    return 0;
  }

  writePRG(address: number, value: number): void {
    // NROM 不支持写入
  }

  readCHR(address: number): number {
    if (address >= 0x0000 && address <= 0x1FFF) {
      return this.chrROM[address] || 0;
    }
    return 0;
  }

  writeCHR(address: number, value: number): void {
    if (address >= 0x0000 && address <= 0x1FFF) {
      this.chrROM[address] = value;
    }
  }

  getMirroring(): 'horizontal' | 'vertical' | 'four-screen' {
    return this.mirroring;
  }
}

/**
 * MMC1 映射器 (Mapper 1)
 * 支持 bank switching 的复杂映射器
 */
class MMC1 implements Mapper {
  private prgBank = 0;
  private chrBank = 0;
  private shiftRegister = 0x10;
  private control = 0x0C;

  constructor(
    private prgROM: Uint8Array,
    private chrROM: Uint8Array,
    private mirroring: 'horizontal' | 'vertical' | 'four-screen'
  ) { }

  readPRG(address: number): number {
    // TODO: 实现 MMC1 PRG bank switching
    return 0;
  }

  writePRG(address: number, value: number): void {
    // TODO: 实现 MMC1 寄存器写入
  }

  readCHR(address: number): number {
    // TODO: 实现 MMC1 CHR bank switching
    return 0;
  }

  writeCHR(address: number, value: number): void {
    // TODO: 实现 MMC1 CHR RAM 写入
  }

  getMirroring(): 'horizontal' | 'vertical' | 'four-screen' {
    // TODO: 根据控制寄存器返回镜像模式
    return this.mirroring;
  }
}

/**
 * UxROM 映射器 (Mapper 2)
 * 简单的 PRG bank switching
 */
class UxROM implements Mapper {
  constructor(
    private prgROM: Uint8Array,
    private chrROM: Uint8Array,
    private mirroring: 'horizontal' | 'vertical' | 'four-screen'
  ) { }

  readPRG(address: number): number {
    // TODO: 实现 UxROM PRG bank switching
    return 0;
  }

  writePRG(address: number, value: number): void {
    // TODO: 实现 UxROM bank 选择
  }

  readCHR(address: number): number {
    return this.chrROM[address] || 0;
  }

  writeCHR(address: number, value: number): void {
    this.chrROM[address] = value;
  }

  getMirroring(): 'horizontal' | 'vertical' | 'four-screen' {
    return this.mirroring;
  }
}

/**
 * CNROM 映射器 (Mapper 3)
 * 简单的 CHR bank switching，PRG固定
 */
class CNROM implements Mapper {
  private chrBank = 0;

  constructor(
    private prgROM: Uint8Array,
    private chrROM: Uint8Array,
    private mirroring: 'horizontal' | 'vertical' | 'four-screen'
  ) { }

  readPRG(address: number): number {
    if (address >= 0x8000 && address <= 0xFFFF) {
      if (this.prgROM.length === 0x4000) {
        // 16KB PRG ROM，镜像到0x8000-0xFFFF
        const offset = (address - 0x8000) % 0x4000;
        return this.prgROM[offset];
      } else {
        // 32KB PRG ROM
        // 0x8000-0xBFFF: 第一个16KB
        // 0xC000-0xFFFF: 第二个16KB  
        if (address >= 0x8000 && address <= 0xBFFF) {
          const offset = address - 0x8000;
          return this.prgROM[offset] || 0;
        } else if (address >= 0xC000 && address <= 0xFFFF) {
          const offset = address - 0xC000;
          return this.prgROM[0x4000 + offset] || 0;
        }
      }
    }
    return 0;
  }

  writePRG(address: number, value: number): void {
    // CNROM通过写入地址0x8000-0xFFFF选择CHR bank
    if (address >= 0x8000 && address <= 0xFFFF) {
      this.chrBank = value & 0x03; // CNROM通常支持最多4个CHR banks
    }
  }

  readCHR(address: number): number {
    if (address >= 0x0000 && address <= 0x1FFF) {
      const bankSize = 0x2000; // 8KB per CHR bank
      const selectedBank = this.chrBank * bankSize;
      return this.chrROM[selectedBank + (address % bankSize)] || 0;
    }
    return 0;
  }

  writeCHR(address: number, value: number): void {
    if (address >= 0x0000 && address <= 0x1FFF) {
      const bankSize = 0x2000;
      const selectedBank = this.chrBank * bankSize;
      this.chrROM[selectedBank + (address % bankSize)] = value;
    }
  }

  getMirroring(): 'horizontal' | 'vertical' | 'four-screen' {
    return this.mirroring;
  }
}