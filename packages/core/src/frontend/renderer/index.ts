/**
 * 前端渲染器
 * 负责 PPU 帧缓冲区的显示和 UI 界面
 */

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private imageData: ImageData;
  private nesPalette: Uint32Array = new Uint32Array(64);

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Unable to get 2D rendering context');
    }
    this.ctx = context;
    
    // 设置画布尺寸
    this.canvas.width = 256;
    this.canvas.height = 240;
    
    // 创建图像数据缓冲区
    this.imageData = this.ctx.createImageData(256, 240);
    
    // 初始化 NES 调色板
    this.initializePalette();
  }

  /**
   * 初始化 NES 调色板
   */
  private initializePalette(): void {
    this.nesPalette = new Uint32Array(64);
    
    // 标准 NES 调色板 (近似值)
    const paletteColors = [
      0x5C5C5C, 0x001F00, 0x0000FC, 0x7E007E, 0x00FC00, 0x0000FC, 0x7E007E, 0xFCFCFC,
      0xBCBCBC, 0x005C00, 0x0000FC, 0x7E007E, 0x00FC00, 0x0000FC, 0x7E007E, 0xFCFCFC,
      0x5C5C5C, 0x001F00, 0x0000FC, 0x7E007E, 0x00FC00, 0x0000FC, 0x7E007E, 0xFCFCFC,
      0xBCBCBC, 0x005C00, 0x0000FC, 0x7E007E, 0x00FC00, 0x0000FC, 0x7E007E, 0xFCFCFC,
      0x000000, 0x000000, 0x000000, 0x000000, 0x000000, 0x000000, 0x000000, 0x000000,
      0x000000, 0x000000, 0x000000, 0x000000, 0x000000, 0x000000, 0x000000, 0x000000,
      0x000000, 0x000000, 0x000000, 0x000000, 0x000000, 0x000000, 0x000000, 0x000000,
      0x000000, 0x000000, 0x000000, 0x000000, 0x000000, 0x000000, 0x000000, 0x000000
    ];
    
    for (let i = 0; i < 64; i++) {
      this.nesPalette[i] = paletteColors[i];
    }
  }

  /**
   * 渲染帧缓冲区
   */
  render(frameBuffer: Uint8Array): void {
    if (frameBuffer.length !== 256 * 240 * 4) {
      console.error('Invalid frame buffer size');
      return;
    }

    // 直接复制帧缓冲区数据到图像数据
    const data = this.imageData.data;
    
    for (let i = 0; i < frameBuffer.length; i++) {
      data[i] = frameBuffer[i];
    }
    
    // 绘制到画布
    this.ctx.putImageData(this.imageData, 0, 0);
  }

  /**
   * 清除画布
   */
  clear(): void {
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * 设置缩放显示
   */
  setScale(scale: number): void {
    this.canvas.style.width = `${256 * scale}px`;
    this.canvas.style.height = `${240 * scale}px`;
    this.canvas.style.imageRendering = scale > 1 ? 'pixelated' : 'auto';
  }

  /**
   * 截图
   */
  captureFrame(): string {
    return this.canvas.toDataURL('image/png');
  }
}

/**
 * 调试图形渲染器
 */
export class DebugRenderer {
  private canvas: HTMLCanvasElement = document.createElement('canvas');
  private ctx: CanvasRenderingContext2D = this.canvas.getContext('2d')!;
  private patternTableCanvas: HTMLCanvasElement[] = [];
  private patternTableCtx: CanvasRenderingContext2D[] = [];
  private nametableCanvas: HTMLCanvasElement[] = [];
  private nametableCtx: CanvasRenderingContext2D[] = [];

  constructor(
    patternCanvas1: HTMLCanvasElement,
    patternCanvas2: HTMLCanvasElement,
    nameCanvas1: HTMLCanvasElement,
    nameCanvas2: HTMLCanvasElement
  ) {
    this.patternTableCanvas = [patternCanvas1, patternCanvas2];
    this.nametableCanvas = [nameCanvas1, nameCanvas2];
    
    // 初始化上下文
    [patternCanvas1, patternCanvas2].forEach((canvas, index) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Unable to get pattern table context');
      this.patternTableCtx[index] = ctx;
      canvas.width = 128;
      canvas.height = 128;
    });
    
    [nameCanvas1, nameCanvas2].forEach((canvas, index) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Unable to get nametable context');
      this.nametableCtx[index] = ctx;
      canvas.width = 256;
      canvas.height = 240;
    });
  }

  /**
   * 渲染图案表
   */
  renderPatternTable(ppu: any): void {
    // TODO: 实现 PPU 图案表渲染
    // 这需要访问 PPU 的内部 VRAM 和 CHR ROM
  }

  /**
   * 渲染名称表
   */
  renderNametables(ppu: any): void {
    // TODO: 实现 PPU 名称表渲染
  }

  /**
   * 渲染调色板
   */
  renderPalette(paletteRAM: Uint8Array): void {
    // TODO: 实现调色板可视化
  }
}