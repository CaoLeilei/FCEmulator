/**
 * 内存管理单元 (MMU)
 * 管理 CPU、PPU、APU 和卡带的内存映射
 */

import type { Cartridge } from '../cartridge/index.js';

export interface MemoryMapper {
  read(address: number): number;
  write(address: number, value: number): void;
}

export class Memory implements MemoryMapper {
  // 内部 RAM (2KB)
  private ram = new Uint8Array(0x0800);

  // PPU 寄存器
  private ppuRegisters = new Uint8Array(8);
  private ppuWriteCallback?: (address: number, value: number) => void;
  private ppuReadCallback?: (address: number) => number;

  // APU 和 I/O 寄存器
  private ioRegisters = new Uint8Array(0x20);

  // 卡带接口
  private cartridge: Cartridge | null = null;
  private testCartridge: any = null; // 测试卡带

  constructor() {}

  /**
   * 读取内存字节
   */
  read(address: number): number {
    address &= 0xFFFF; // 16位地址

    // RAM 镜像
    if (address < 0x2000) {
      return this.ram[address % 0x0800];
    }
    
    // PPU 寄存器
    if (address < 0x4000) {
      const ppuAddr = (address - 0x2000) % 8;
      // 优先使用 PPU 读取回调
      if (this.ppuReadCallback) {
        return this.ppuReadCallback(ppuAddr);
      }
      return this.ppuRegisters[ppuAddr];
    }
    
    // APU 和 I/O 寄存器
    if (address < 0x4018) {
      if (address === 0x4016 || address === 0x4017) {
        // 手柄输入寄存器
        return this.readController(address - 0x4016);
      }
      return this.ioRegisters[address - 0x4000] || 0;
    }
    
    // 卡带空间 (PRG ROM/RAM)
    if (address >= 0x4020) {
      return this.cartridge?.readPRG(address) || this.testCartridge?.readPRG(address) || 0;
    }
    
    // 向量区域 - 优先使用TestCartridge
    if (address >= 0xFFFA && address <= 0xFFFF) {
      return this.testCartridge?.readPRG(address) || this.cartridge?.readPRG(address) || 0;
    }
    
    return 0;
  }

  /**
   * 写入内存字节
   */
  write(address: number, value: number): void {
    address &= 0xFFFF;
    value &= 0xFF;

    // RAM 镜像
    if (address < 0x2000) {
      this.ram[address % 0x0800] = value;
      return;
    }
    
    // PPU 寄存器
    if (address < 0x4000) {
      const ppuAddr = (address - 0x2000) % 8;
      this.ppuRegisters[ppuAddr] = value;
      // 通知 PPU 对象
      if (this.ppuWriteCallback) {
        this.ppuWriteCallback(ppuAddr, value);
      }
      return;
    }
    
    // APU 和 I/O 寄存器
    if (address < 0x4018) {
      if (address === 0x4016 || address === 0x4017) {
        // 手柄输出寄存器
        this.writeController(address - 0x4016, value);
        return;
      }
      this.ioRegisters[address - 0x4000] = value;
      return;
    }
    
    // 卡带空间
    if (address >= 0x4020) {
      if (this.cartridge) {
        this.cartridge.writePRG(address, value);
      } else if (this.testCartridge) {
        this.testCartridge.writePRG(address, value);
      }
    }
    
    // 向量区域 - 优先使用TestCartridge
    if (address >= 0xFFFA && address <= 0xFFFF) {
      if (this.testCartridge) {
        this.testCartridge.writePRG(address, value);
      } else if (this.cartridge) {
        this.cartridge.writePRG(address, value);
      }
    }
  }

  /**
   * 写入内存字节 (别名方法)
   */
  writeByte(address: number, value: number): void {
    this.write(address, value);
  }

  /**
   * 读取16位字 (小端序)
   */
  read16(address: number): number {
    return this.read(address) | (this.read(address + 1) << 8);
  }

  /**
   * 读取内存字节 (别名方法)
   */
  readByte(address: number): number {
    return this.read(address);
  }

  /**
   * 读取16位字 (别名方法)
   */
  readWord(address: number): number {
    return this.read16(address);
  }

  /**
   * 写入16位字 (小端序)
   */
  write16(address: number, value: number): void {
    this.write(address, value & 0xFF);
    this.write(address + 1, (value >> 8) & 0xFF);
  }

  /**
   * 写入16位字 (别名方法)
   */
  writeWord(address: number, value: number): void {
    this.write16(address, value);
  }

  /**
   * 设置卡带
   */
  setCartridge(cartridge: Cartridge): void {
    this.cartridge = cartridge;
  }

  /**
   * 设置测试卡带
   */
  setTestCartridge(testCartridge: any): void {
    this.testCartridge = testCartridge;
  }

  /**
   * 设置 PPU 寄存器访问
   */
  setPPURegisters(_registers: Uint8Array): void {
    // PPU 寄存器已通过构造函数初始化，这里可以添加额外的设置
  }

  /**
   * 设置 PPU 写入回调
   */
  setPPUWriteCallback(callback: (address: number, value: number) => void): void {
    this.ppuWriteCallback = callback;
  }

  /**
   * 设置 PPU 读取回调
   */
  setPPUReadCallback(callback: (address: number) => number): void {
    this.ppuReadCallback = callback;
  }

  /**
   * 设置输入控制器
   */
  setInputController(_controller: any): void {
    // 输入控制器集成
  }

  /**
   * 读取手柄状态 (临时实现)
   */
  private readController(_index: number): number {
    // TODO: 实现手柄输入
    return 0;
  }

  /**
   * 写入手柄寄存器 (临时实现)
   */
  private writeController(_index: number, _value: number): void {
    // TODO: 实现手柄输出
  }

  /**
   * 获取 PPU 寄存器访问接口
   */
  getPPURegisters(): Uint8Array {
    return this.ppuRegisters;
  }

  /**
   * 获取 RAM 副本 (用于调试)
   */
  getRAM(): Uint8Array {
    return new Uint8Array(this.ram);
  }
}