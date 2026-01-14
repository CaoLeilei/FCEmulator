/**
 * PPU (Picture Processing Unit) 图形处理器
 * 负责 FC 的图形渲染和视频输出
 */

export class PPU {
  // 内部 VRAM
  private vram = new Uint8Array(0x1000);     // 2KB 视频 RAM
  private paletteRAM = new Uint8Array(32);   // 调色板 RAM
  
  // OAM (Object Attribute Memory) - 精灵数据
  private oam = new Uint8Array(256);         // 主 OAM
  private oamSecondary = new Uint8Array(32); // 次级 OAM
  
  // PPU 寄存器
  private ctrl: number = 0;          // $2000 PPUCTRL
  private mask: number = 0;          // $2001 PPUMASK
  private status: number = 0;        // $2002 PPUSTATUS
  private oamAddr: number = 0;       // $2003 OAMADDR
  private scroll: number = 0;         // $2005 PPUSCROLL
  private addr: number = 0;          // $2006 PPUADDR
  private data: number = 0;          // $2007 PPUDATA
  
  // 内部状态
  private v: number = 0;             // VRAM 地址 (15位)
  private t: number = 0;             // 临时 VRAM 地址
  private x: number = 0;             // 精细 X 滚动
  private w: boolean = false;        // 写入锁存器
  
  private cycle: number = 0;         // 当前扫描线周期
  private scanline: number = 0;      // 当前扫描线 (0-261)
  private frame: number = 0;         // 帧计数
  
  private nmiOccur: boolean = false;  // NMI 发生标志
  private nmiOutput: boolean = false; // NMI 输出使能

  private irqOccurred: boolean = false; // IRQ 发生标志

  // 帧缓冲区
  private frameBuffer: Uint8Array;     // RGBA 格式，256x240 像素
  private nameTable: Uint8Array;      // 名称表缓冲区

  // Cartridge 引用（用于 CHR ROM 访问）
  private cartridge: any = null;

  constructor() {
    this.frameBuffer = new Uint8Array(256 * 240 * 4); // RGBA
    this.nameTable = new Uint8Array(0x800);
    this.reset();
  }

  /**
   * 设置卡带引用
   */
  setCartridge(cartridge: any): void {
    this.cartridge = cartridge;
  }

  /**
   * 设置PPU寄存器引用
   */
  setRegisters(registers: Uint8Array): void {
    // PPU 寄存器将由内存管理器直接操作
  }

  /**
   * 重置 PPU 状态
   */
  reset(): void {
    this.ctrl = 0;
    this.mask = 0;
    this.status = 0;
    this.oamAddr = 0;
    this.scroll = 0;
    this.addr = 0;
    this.data = 0;

    this.v = 0;
    this.t = 0;
    this.x = 0;
    this.w = false;

    this.cycle = 0;
    this.scanline = 0;
    this.frame = 0;

    this.nmiOccur = false;
    this.nmiOutput = false;
    this.irqOccurred = false;

    // 清空缓冲区
    this.frameBuffer.fill(0);
    this.vram.fill(0);
    // 使用默认的黑色背景 (0x0D = 深色)
    this.paletteRAM.fill(0x0D);
    this.nameTable.fill(0);

    // 初始化默认背景色索引为0（透明色）
    this.paletteRAM[0] = 0x0D;
  }

  /**
   * 执行一个 PPU 周期
   */
  step(): boolean {
    let nmiOccurred = false;

    // 渲染阶段 (扫描线 0-239)
    if (this.scanline >= 0 && this.scanline < 240) {
      // 在每个扫描线结束时渲染
      if (this.cycle === 340) {
        this.renderScanline();
      }

      // MMC3 IRQ: 在扫描线 260-260 时检查（渲染结束后）
      if (this.cycle === 260 && this.cartridge && this.cartridge.scanlineCounter) {
        if (this.cartridge.scanlineCounter()) {
          this.irqOccurred = true;
        }
      }
    }
    // VBlank 阶段
    else if (this.scanline === 241) {
      if (this.cycle === 1) {
        this.status |= 0x80; // 设置 VBlank 标志
        console.log(`PPU entering VBlank at scanline 241, cycle 1, frame ${this.frame}, status=0x${this.status.toString(16)}`);
        if (this.nmiOutput && !this.nmiOccur) {
          this.nmiOccur = true;
          nmiOccurred = true;
          console.log(`NMI set at scanline ${this.scanline}, cycle ${this.cycle}, frame ${this.frame}, nmiOutput=${this.nmiOutput}`);
        }
      }
    }
    // 预渲染扫描线 (261)
    else if (this.scanline === 261) {
      if (this.cycle === 1) {
        this.status &= ~0x80; // 清除 VBlank 标志
        this.nmiOccur = false;
      }
      if (this.cycle >= 280 && this.cycle <= 304) {
        if (this.renderingEnabled()) {
          this.v = (this.v & ~0x7BE0) | (this.t & 0x7BE0);
        }
      }
    }
    // 扫描线 240, 242-260 不做任何事 (空扫描线)

    this.cycle++;
    if (this.cycle >= 341) {
      this.cycle = 0;
      this.scanline++;
      if (this.scanline >= 262) {
        this.scanline = 0;
        this.frame++;
        return true; // 新帧开始
      }
    }
    return nmiOccurred;
  }

  /**
   * 渲染一条扫描线
   */
  private renderScanline(): void {
    // 只在可见扫描线渲染 (0-239)
    if (this.scanline >= 0 && this.scanline < 240) {
      if (this.scanline === 0) {
        console.log(`renderScanline called: scanline=${this.scanline}, mask=${this.mask.toString(16)}, bgEnabled=${(this.mask & 0x08) !== 0}`);
      }
      this.renderBackgroundScanline();
      this.renderSpritesScanline();
    }
  }

  /**
   * 渲染背景扫描线
   */
  private renderBackgroundScanline(): void {
    const bgEnabled = (this.mask & 0x08) !== 0; // 显示背景

    if (!bgEnabled) {
      // 背景禁用时用背景色填充
      const bgColor = this.getPaletteColor(0);
      for (let x = 0; x < 256; x++) {
        this.setPixel(x, this.scanline, bgColor);
      }
      return;
    }

    // 计算当前扫描线的名称表索引
    const nameTableBase = (this.ctrl & 0x03) * 0x400; // 名称表基址
    const nameTableOffset = ((this.scanline >> 3) & 0x1F) * 32;
    const fineY = this.scanline & 7;
    const patternTableSelect = (this.ctrl & 0x10) ? 0x1000 : 0x0000;

    let pixelsRendered = 0;

    // 调试：只在 scanline 0 输出
    if (this.scanline === 0) {
      console.log(`Rendering scanline 0: mask=${this.mask.toString(16)}, ctrl=${this.ctrl.toString(16)}, nameTableBase=${nameTableBase.toString(16)}`);
      // 显示名称表前 32 字节
      const nametableData = Array.from(this.nameTable.slice(0, 32)).map(x => x.toString(16).padStart(2,'0')).join(' ');
      console.log(`NameTable[0x0000-0x001F]: ${nametableData}`);
    }

    for (let tileX = 0; tileX < 32; tileX++) {
      const nameTableAddr = nameTableBase + nameTableOffset + tileX;
      const tileIndex = this.readVRAM(0x2000 + nameTableAddr);

      // 从 CHR ROM 获取图案数据
      const patternAddr = patternTableSelect + tileIndex * 16 + fineY;
      const patternL = this.readVRAM(patternAddr);
      const patternH = this.readVRAM(patternAddr + 8);

      // 获取属性表
      const attrTableBase = nameTableBase + 0x3C0;
      const attrX = tileX >> 2;
      const attrY = (this.scanline >> 3) >> 2;
      const attrAddr = attrTableBase + attrY * 8 + attrX;
      const attrByte = this.readVRAM(0x2000 + attrAddr);

      // 计算调色板移位
      const attrShift = ((tileX & 2) << 1) | ((this.scanline >> 3) & 2);
      const paletteNum = (attrByte >> attrShift) & 0x03;

      // 调试：第一个 tile
      if (this.scanline === 0 && tileX === 0) {
        console.log(`  First tile: tileIndex=${tileIndex}, patternL=${patternL.toString(16)}, patternH=${patternH.toString(16)}, attrByte=${attrByte.toString(16)}, paletteNum=${paletteNum}`);
        console.log(`  Palette[0]=${this.paletteRAM[0].toString(16)}, Palette[paletteNum*4+0]=${this.paletteRAM[paletteNum * 4].toString(16)}, Palette[paletteNum*4+1]=${this.paletteRAM[paletteNum * 4 + 1].toString(16)}`);
      }

      // 渲染8个像素
      for (let pixelX = 0; pixelX < 8; pixelX++) {
        const x = tileX * 8 + pixelX;

        const bitPosition = 7 - pixelX;
        const bitL = (patternL >> bitPosition) & 1;
        const bitH = (patternH >> bitPosition) & 1;
        const paletteIndex = (bitH << 1) | bitL;

        if (paletteIndex !== 0) {
          const finalPaletteIndex = paletteNum * 4 + paletteIndex;
          const color = this.getPaletteColor(finalPaletteIndex);
          this.setPixel(x, this.scanline, color);
          pixelsRendered++;
        } else {
          const bgColor = this.getPaletteColor(0);
          this.setPixel(x, this.scanline, bgColor);
        }
      }
    }
  }

  /**
   * 渲染精灵扫描线
   */
  private renderSpritesScanline(): void {
    const spritesEnabled = (this.mask & 0x10) !== 0; // 显示精灵
    
    if (!spritesEnabled) return;
    
    const spritePatternTable = (this.ctrl & 0x08) ? 0x1000 : 0x0000;
    
    // 从后往前渲染精灵（优先级）
    for (let i = 63; i >= 0; i--) {
      const spriteAddr = i * 4;
      const spriteY = this.oam[spriteAddr] + 1;
      const spriteIndex = this.oam[spriteAddr + 1];
      const spriteAttributes = this.oam[spriteAddr + 2];
      const spriteX = this.oam[spriteAddr + 3];
      
      // 检查精灵是否在当前扫描线
      if (this.scanline >= spriteY && this.scanline < spriteY + 8) {
        const spriteLine = this.scanline - spriteY;
        const isFlippedVertically = (spriteAttributes & 0x80) !== 0;
        const isFlippedHorizontally = (spriteAttributes & 0x40) !== 0;
        const behindBackground = (spriteAttributes & 0x20) !== 0;
        const palette = (spriteAttributes & 0x03) * 4 + 16; // 精灵调色板从16开始
        
        // 渲染精灵像素
        for (let x = 0; x < 8; x++) {
          const pixelX = spriteX + x;
          if (pixelX < 0 || pixelX >= 256) continue;
          
          const patternLine = isFlippedVertically ? (7 - spriteLine) : spriteLine;
          const patternX = isFlippedHorizontally ? (7 - x) : x;
          
          // 获取图案数据
          const patternAddr = spritePatternTable + spriteIndex * 16 + patternLine;
          const patternL = this.readVRAM(patternAddr);
          const patternH = this.readVRAM(patternAddr + 8);
          
          const bitL = (patternL >> patternX) & 1;
          const bitH = (patternH >> patternX) & 1;
          const pixelIndex = (bitH << 1) | bitL;
          
          // 像素值为0表示透明
          if (pixelIndex !== 0) {
            if (!behindBackground || this.isBackgroundPixelTransparent(pixelX, this.scanline)) {
              const color = this.getPaletteColor(palette + pixelIndex);
              this.setPixel(pixelX, this.scanline, color);
            }
          }
        }
      }
    }
  }

  /**
   * 检查背景像素是否透明（用于精灵优先级）
   */
  private isBackgroundPixelTransparent(x: number, y: number): boolean {
    const pixelIndex = (y * 256 + x) * 4;
    return this.frameBuffer[pixelIndex] === 0 && 
           this.frameBuffer[pixelIndex + 1] === 0 && 
           this.frameBuffer[pixelIndex + 2] === 0;
  }

  /**
   * 设置像素颜色
   */
  private setPixel(x: number, y: number, color: number): void {
    if (x < 0 || x >= 256 || y < 0 || y >= 240) return;
    
    const index = (y * 256 + x) * 4;
    const r = (color >> 16) & 0xFF;
    const g = (color >> 8) & 0xFF;
    const b = color & 0xFF;
    
    this.frameBuffer[index] = r;
    this.frameBuffer[index + 1] = g;
    this.frameBuffer[index + 2] = b;
    this.frameBuffer[index + 3] = 255; // Alpha
  }

  /**
   * 获取调色板颜色
   */
  private getPaletteColor(index: number): number {
    // 获取调色板颜色
    const paletteIndex = index % 32;
    const colorIndex = this.paletteRAM[paletteIndex] & 0x3F;
    return this.getNESColor(colorIndex);
  }

  /**
   * 获取NES颜色值
   * 使用标准的 NES 2C02 调色板 (64色)
   * 参考: https://www.nesdev.org/wiki/PPU_palettes
   */
  private getNESColor(index: number): number {
    // NES 标准调色板 (2C02) - 64 色 RGB 映射表
    // 格式: 0xRRGGBB
    const nesPalette = [
      // 色相 0x0x (第0行: 灰度/深色)
      0x666666, 0x002A88, 0x1412A7, 0x3B00A4,
      0x5C007E, 0x6E0040, 0x6C0600, 0x561D00,
      0x333500, 0x0B4800, 0x005200, 0x004F08,
      0x00404D, 0x000000, 0x000000, 0x000000,
      // 色相 0x1x (第1行: 中等亮度)
      0xADADAD, 0x155FD9, 0x4240FF, 0x7527FE,
      0xA01ACC, 0xB71E7B, 0xB53120, 0x994E00,
      0x6B6D00, 0x388700, 0x0C9300, 0x008F32,
      0x007C8D, 0x000000, 0x000000, 0x000000,
      // 色相 0x2x (第2行: 高亮度)
      0xFFFEFF, 0x64B0FF, 0x9290FF, 0xC676FF,
      0xF36AFF, 0xFE6ECC, 0xFE8170, 0xEA9E22,
      0xBCBE00, 0x88D800, 0x5CE430, 0x45E082,
      0x48CDDE, 0x4F4F4F, 0x000000, 0x000000,
      // 色相 0x3x (第3行: 最亮)
      0xFFFEFF, 0xC0DFFF, 0xD3D2FF, 0xE8C8FF,
      0xFBC2FF, 0xFEC4EA, 0xFECCC5, 0xF7D8A5,
      0xE4E594, 0xCFEF96, 0xBDF4AB, 0xB3F3CC,
      0xB5EBF2, 0xB8B8B8, 0x000000, 0x000000
    ];

    return nesPalette[index & 0x3F];
  }

  /**
   * 读取寄存器
   */
  readRegister(address: number): number {
    const regAddr = address & 0x07; // 镜像到 0-7

    switch (regAddr) {
      case 0: return this.ctrl;       // $2000
      case 1: return this.mask;       // $2001
      case 2: {                       // $2002
        const result = this.status;
        this.status &= ~0x80; // 清除 VBlank 标志
        this.w = false; // 重置写入锁存器
        return result;
      }
      case 3: return this.oamAddr;    // $2003
      case 4: return this.oam[this.oamAddr]; // $2004
      case 5: return this.scroll;      // $2005
      case 6: return this.addr;        // $2006
      case 7: return this.readData(); // $2007
      default: return 0;
    }
  }

  /**
   * 写入寄存器
   */
  writeRegister(address: number, value: number): void {
    value &= 0xFF;
    const regAddr = address & 0x07; // 镜像到 0-7

    switch (regAddr) {
      case 0: // PPUCTRL ($2000)
        this.ctrl = value;
        this.t = (this.t & ~0x0C00) | ((value & 0x03) << 10);
        this.nmiOutput = !!(value & 0x80);
        console.log(`PPU Write at scanline ${this.scanline}, cycle ${this.cycle}, frame ${this.frame}: $2000 = 0x${value.toString(16).padStart(2, '0')}, nmiOutput=${this.nmiOutput}`);
        break;

      case 1: // PPUMASK ($2001)
        this.mask = value;
        console.log(`PPU Write at scanline ${this.scanline}, cycle ${this.cycle}, frame ${this.frame}: $2001 = 0x${value.toString(16).padStart(2, '0')} (bg: ${!!(value & 0x08)}, sprite: ${!!(value & 0x10)})`);
        break;

      case 2: // OAMADDR ($2003)
        this.oamAddr = value;
        break;

      case 3: // OAMDATA ($2004)
        this.oam[this.oamAddr++] = value;
        break;

      case 4: // PPUSCROLL ($2005)
        this.writeScroll(value);
        break;

      case 5: // PPUADDR ($2006)
        this.writeAddr(value);
        console.log(`PPU Write: $2006 = 0x${value.toString(16).padStart(2, '0')}, v=0x${this.v.toString(16)}`);
        break;

      case 6: // PPUDATA ($2007)
        this.writeData(value);
        console.log(`PPU Write: $2007 = 0x${value.toString(16).padStart(2, '0')}`);
        break;
    }
  }

  /**
   * 写入滚动寄存器
   */
  private writeScroll(value: number): void {
    if (!this.w) {
      this.t = (this.t & ~0x001F) | (value >> 3);
      this.x = value & 0x07;
      this.w = true;
    } else {
      this.t = (this.t & ~0x73E0) | ((value & 0x07) << 12) | ((value >> 3) << 5);
      this.w = false;
    }
  }

  /**
   * 写入地址寄存器
   */
  private writeAddr(value: number): void {
    if (!this.w) {
      this.t = (this.t & ~0xFF00) | (value << 8);
      this.w = true;
    } else {
      this.t = (this.t & ~0x00FF) | value;
      this.v = this.t;
      this.w = false;
    }
  }

  /**
   * 读取数据
   */
  private readData(): number {
    const addr = this.v & 0x3FFF;
    const result = this.readVRAM(addr);
    this.incrementV();

    // VRAM 缓冲区处理
    if (addr < 0x3F00) {
      const bufferedValue = this.data;
      this.data = result;
      return bufferedValue;
    } else {
      // 调色板读取 - 直接返回，不需要缓冲
      this.data = result;
      return result;
    }
  }

  /**
   * 写入数据
   */
  private writeData(value: number): void {
    const addr = this.v & 0x3FFF;
    // 调试：追踪所有 VRAM 写入
    console.log(`VRAM write at scanline ${this.scanline}, cycle ${this.cycle}: addr=0x${addr.toString(16).padStart(4,'0')}, value=0x${value.toString(16).padStart(2,'0')}, renderingEnabled=${this.renderingEnabled()}`);
    this.writeVRAM(addr, value);
    this.incrementV();
  }

  /**
   * 递增 VRAM 地址
   */
  private incrementV(): void {
    if (this.ctrl & 0x04) {
      this.v += 32; // 向下移动32行
    } else {
      this.v += 1;   // 向右移动1列
    }
    this.v &= 0x7FFF;
  }

  /**
   * 读取VRAM
   */
  private readVRAM(address: number): number {
    if (address < 0x2000) {
      // 图案表 - 从 CHR ROM 读取
      if (this.cartridge) {
        return this.cartridge.readCHR(address);
      }
      return 0;
    } else if (address < 0x3F00) {
      // 名称表和属性表
      const mirrorAddr = this.mirrorNameTable(address);
      return this.nameTable[mirrorAddr - 0x2000];
    } else {
      // 调色板
      const paletteAddr = address % 32;
      return this.paletteRAM[paletteAddr];
    }
  }

  /**
   * 写入VRAM
   */
  private writeVRAM(address: number, value: number): void {
    if (address < 0x2000) {
      // 图案表 - 写入 CHR ROM/RAM
      if (this.cartridge) {
        this.cartridge.writeCHR(address, value);
      }
    } else if (address < 0x3F00) {
      // 名称表和属性表
      const mirrorAddr = this.mirrorNameTable(address);
      this.nameTable[mirrorAddr - 0x2000] = value;
    } else {
      // 调色板
      const paletteAddr = address % 32;

      // 处理调色板镜像: 0x10, 0x14, 0x18, 0x1C 镜像到 0x00
      if (paletteAddr === 0x00 || paletteAddr === 0x10 || paletteAddr === 0x14 || paletteAddr === 0x18 || paletteAddr === 0x1C) {
        this.paletteRAM[0] = value;
        this.paletteRAM[0x10] = value;
        this.paletteRAM[0x14] = value;
        this.paletteRAM[0x18] = value;
        this.paletteRAM[0x1C] = value;
      } else {
        this.paletteRAM[paletteAddr] = value;
      }
    }
  }

  /**
   * 名称表镜像处理
   */
  private mirrorNameTable(address: number): number {
    // 简单的水平镜像
    const base = address & 0x2FFF;
    const table = (base - 0x2000) >> 10;
    
    switch (this.getNameTableMirror()) {
      case 'horizontal':
        return 0x2000 + (table & 1) * 0x400 + (base & 0x3FF);
      case 'vertical':
        return 0x2000 + ((table >> 1) & 1) * 0x400 + (base & 0x3FF);
      default:
        return base;
    }
  }

  /**
   * 获取名称表镜像模式
   */
  private getNameTableMirror(): 'horizontal' | 'vertical' | 'four-screen' {
    // 从卡带获取镜像信息
    if (this.cartridge) {
      return this.cartridge.getMirroring();
    }
    return 'horizontal';
  }

  /**
   * 检查渲染是否启用
   */
  private renderingEnabled(): boolean {
    return (this.mask & 0x18) !== 0; // 背景或精灵启用
  }

  /**
   * 检查是否有 NMI 请求
   */
  pollNMI(): boolean {
    const result = this.nmiOccur;
    if (result) {
      console.log(`pollNMI returning true, clearing nmiOccur at frame ${this.frame}`);
    }
    this.nmiOccur = false;
    return result;
  }

  /**
   * 检查是否有 IRQ 请求
   */
  pollIRQ(): boolean {
    const result = this.irqOccurred;
    this.irqOccurred = false;

    // 如果 cartridge 有 clearIRQ 方法，调用它
    if (this.cartridge && this.cartridge.clearIRQ) {
      this.cartridge.clearIRQ();
    }

    return result;
  }

  /**
   * 获取当前帧缓冲区 (用于前端渲染)
   */
  getFrameBuffer(): Uint8Array {
    return this.frameBuffer.slice(); // 返回副本以防止外部修改
  }

  /**
   * 调试信息
   */
  getState() {
    return {
      cycle: this.cycle,
      scanline: this.scanline,
      frame: this.frame,
      v: this.v,
      t: this.t,
      x: this.x,
      w: this.w,
      ctrl: this.ctrl,
      mask: this.mask,
      status: this.status,
      nmiOccur: this.nmiOccur,
      nmiOutput: this.nmiOutput
    };
  }
}