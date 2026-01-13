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
  private createMapper = (mapperNumber: number): Mapper => {
    switch (mapperNumber) {
      case 0:
        return new NROM(this.prgROM, this.chrROM, this.mirroring);
      case 1:
        return new MMC1(this.prgROM, this.chrROM, this.mirroring);
      case 2:
        return new UxROM(this.prgROM, this.chrROM, this.mirroring);
      case 3:
        return new CNROM(this.prgROM, this.chrROM, this.mirroring);
      case 4:
        return new MMC3(this.prgROM, this.chrROM, this.mirroring);
      default:
        throw new Error(`Unsupported mapper: ${mapperNumber}`);
    }
  };

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

/**
 * MMC3 映射器 (Mapper 4)
 * 复杂的 bank switching 映射器，支持 IRQ 计时器和扫描线计数器
 * 用于《魂斗罗2》等游戏
 */
class MMC3 implements Mapper {
  // PRG ROM bank 寄存器
  private registerIndex = 0;
  private prgBanks = new Uint8Array(8);
  private chrBanks = new Uint8Array(8);

  // PRG mode (0: $8000 switchable, $C000 fixed to last bank)
  //              (1: $8000 fixed to second-to-last, $C000 switchable)
  private prgMode = 0;

  // CHR mode (0: two 2KB banks at $0000, four 1KB banks at $1000)
  //             (1: four 1KB banks at $0000, two 2KB banks at $1000)
  private chrMode = 0;

  // IRQ 相关
  private irqEnabled = false;
  private irqReload = false;
  private irqCounter = 0;
  private irqReloadValue = 0;
  private irqPending = false;

  constructor(
    private prgROM: Uint8Array,
    private chrROM: Uint8Array,
    private mirroring: 'horizontal' | 'vertical' | 'four-screen'
  ) {
    // 初始化 PRG bank 为 0,1, 最后两个bank固定
    this.prgBanks[6] = (prgROM.length / 0x2000) - 2;
    this.prgBanks[7] = (prgROM.length / 0x2000) - 1;

    // CHR banks 默认全部映射到 bank 0
    for (let i = 0; i < 8; i++) {
      this.chrBanks[i] = 0;
    }
  }

  /**
   * 写入 PRG 寄存器（用于 bank switching 和 IRQ 控制）
   */
  writePRG(address: number, value: number): void {
    const addr = address & 0x6001;

    switch (addr) {
      case 0x8000:
        // Bank 选择寄存器
        this.registerIndex = value & 0x07;
        this.prgMode = (value >> 6) & 0x01;
        this.chrMode = (value >> 7) & 0x01;
        break;

      case 0x8001:
        // Bank 数据寄存器
        const bankNumber = value & 0xFF;

        if (this.registerIndex <= 1) {
          // CHR 2KB banks ($0000 or $0800)
          if (this.chrMode === 0) {
            // Mode 0: $0000-$0FFF 由 register 0,1 控制
            const bank = this.registerIndex * 2;
            this.chrBanks[bank] = bankNumber & 0xFE;
            this.chrBanks[bank + 1] = (bankNumber & 0xFE) + 1;
          } else {
            // Mode 1: $0000-$07FF, $0800-$0FFF 由 register 0,1 控制
            this.chrBanks[this.registerIndex] = bankNumber;
          }
        } else if (this.registerIndex <= 5) {
          // CHR 1KB banks ($1000-$1FFF)
          const bank = this.registerIndex;
          this.chrBanks[bank] = bankNumber;
        } else if (this.registerIndex === 6) {
          // PRG bank at $8000 (mode 0) or $C000 (mode 1)
          this.prgBanks[6] = bankNumber & 0x3F;
        } else if (this.registerIndex === 7) {
          // PRG bank at $A000
          this.prgBanks[7] = bankNumber & 0x3F;
        }
        break;

      case 0xA000:
        // 镜像控制
        if (value & 0x01) {
          this.mirroring = 'vertical';
        } else {
          this.mirroring = 'horizontal';
        }
        break;

      case 0xC000:
        // IRQ 重载值
        this.irqReloadValue = value;
        break;

      case 0xC001:
        // IRQ 重载标志
        this.irqReload = true;
        break;

      case 0xE000:
        // IRQ 禁用
        this.irqEnabled = false;
        this.irqPending = false;
        break;

      case 0xE001:
        // IRQ 启用
        this.irqEnabled = true;
        break;
    }
  }

  /**
   * 读取 PRG ROM
   */
  readPRG(address: number): number {
    if (address >= 0x8000) {
      // 计算 8KB bank 索引
      let bankIndex = 0;

      if (address < 0xA000) {
        // $8000-$9FFF
        bankIndex = (this.prgMode === 0) ? 6 : 6;
      } else if (address < 0xC000) {
        // $A000-$BFFF
        bankIndex = 7;
      } else if (address < 0xE000) {
        // $C000-$DFFF
        bankIndex = (this.prgMode === 0) ? 8 : 6;
      } else {
        // $E000-$FFFF (固定到最后一个 bank)
        bankIndex = 9;
      }

      // 获取 bank 编号
      let bankNumber: number;
      const totalPRGBanks = this.prgROM.length / 0x2000;

      if (this.prgMode === 0) {
        if (address < 0xA000) {
          bankNumber = this.prgBanks[6];
        } else if (address < 0xC000) {
          bankNumber = this.prgBanks[7];
        } else if (address < 0xE000) {
          bankNumber = totalPRGBanks - 2;
        } else {
          bankNumber = totalPRGBanks - 1;
        }
      } else {
        // Mode 1
        if (address < 0xA000) {
          bankNumber = totalPRGBanks - 2;
        } else if (address < 0xC000) {
          bankNumber = this.prgBanks[7];
        } else if (address < 0xE000) {
          bankNumber = this.prgBanks[6];
        } else {
          bankNumber = totalPRGBanks - 1;
        }
      }

      bankNumber = bankNumber % totalPRGBanks;
      const offset = (bankNumber * 0x2000) + (address & 0x1FFF);
      return this.prgROM[offset] || 0;
    }
    return 0;
  }

  /**
   * 读取 CHR ROM/RAM
   */
  readCHR(address: number): number {
    if (address >= 0x0000 && address <= 0x1FFF) {
      let bankNumber: number;
      const totalCHRBanks = this.chrROM.length / 0x0400; // 每个bank是1KB

      // 计算bank索引（0-7）
      let bankIndex: number;
      if (this.chrMode === 0) {
        // Mode 0: $0000-$07FF=R0, $0800-$0FFF=R1, $1000-$13FF=R2, $1400-$17FF=R3, $1800-$1BFF=R4, $1C00-$1FFF=R5
        const addr1KB = address >> 10;
        if (addr1KB < 2) {
          bankIndex = addr1KB;
        } else {
          bankIndex = addr1KB;
        }
      } else {
        // Mode 1: $0000-$03FF=R0, $0400-$07FF=R1, $0800-$0BFF=R2, $0C00-$0FFF=R3, $1000-$13FF=R4, $1400-$17FF=R5, $1800-$1BFF=R6, $1C00-$1FFF=R7
        bankIndex = address >> 10;
      }

      // 获取 bank 编号
      if (this.chrMode === 0) {
        if (address < 0x0800) {
          // 2KB bank 0
          bankNumber = this.chrBanks[0] & 0xFE;
        } else if (address < 0x1000) {
          // 2KB bank 1
          bankNumber = this.chrBanks[1] & 0xFE;
        } else {
          // 1KB banks 2-5
          bankNumber = this.chrBanks[((address - 0x1000) >> 10) + 2];
        }
      } else {
        // Mode 1: all banks are 1KB
        bankNumber = this.chrBanks[bankIndex];
      }

      bankNumber = bankNumber % totalCHRBanks;
      const offset = (bankNumber * 0x0400) + (address & 0x03FF);
      return this.chrROM[offset] || 0;
    }
    return 0;
  }

  /**
   * 写入 CHR RAM
   */
  writeCHR(address: number, value: number): void {
    if (address >= 0x0000 && address <= 0x1FFF) {
      let bankNumber: number;
      const totalCHRBanks = this.chrROM.length / 0x0400;

      let bankIndex: number;
      if (this.chrMode === 0) {
        const addr1KB = address >> 10;
        if (addr1KB < 2) {
          bankIndex = addr1KB;
        } else {
          bankIndex = addr1KB;
        }
      } else {
        bankIndex = address >> 10;
      }

      if (this.chrMode === 0) {
        if (address < 0x0800) {
          bankNumber = this.chrBanks[0] & 0xFE;
        } else if (address < 0x1000) {
          bankNumber = this.chrBanks[1] & 0xFE;
        } else {
          bankNumber = this.chrBanks[((address - 0x1000) >> 10) + 2];
        }
      } else {
        bankNumber = this.chrBanks[bankIndex];
      }

      bankNumber = bankNumber % totalCHRBanks;
      const offset = (bankNumber * 0x0400) + (address & 0x03FF);
      this.chrROM[offset] = value;
    }
  }

  /**
   * 获取镜像模式
   */
  getMirroring(): 'horizontal' | 'vertical' | 'four-screen' {
    return this.mirroring;
  }

  /**
   * MMC3 扫描线计数器（由 PPU 调用）
   * 每次扫描线结束时调用
   */
  scanlineCounter(): boolean {
    // 在扫描线 240 处重载计数器
    // 实际实现应该在 PPU 中调用此方法

    // 重新加载计数器
    if (this.irqReload) {
      this.irqCounter = this.irqReloadValue;
      this.irqReload = false;
    } else if (this.irqCounter === 0) {
      this.irqCounter = this.irqReloadValue;
    } else {
      this.irqCounter--;
    }

    // 当计数器归零时触发 IRQ
    if (this.irqCounter === 0 && this.irqEnabled) {
      this.irqPending = true;
      return true;
    }

    return false;
  }

  /**
   * 检查是否有 IRQ 待处理
   */
  getIRQ(): boolean {
    return this.irqPending;
  }

  /**
   * 清除 IRQ
   */
  clearIRQ(): void {
    this.irqPending = false;
  }
}