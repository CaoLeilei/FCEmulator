/**
 * FC 模拟器主引擎
 * 协调 CPU、PPU、APU、内存和卡带的工作
 */

import { CPU } from '../cpu/index.js';
import { Memory } from '../memory/index.js';
import { Cartridge as CartridgeClass } from '../cartridge/index.js';
import { PPU } from '../ppu/index.js';
import { APU } from '../apu/index.js';
import { InputController, setupKeyboardEvents } from '../input/index.js';

export class Emulator {
  private cpu: CPU;
  private memory: Memory;
  private ppu: PPU;
  private apu: APU;
  private input: InputController;
  private cartridge: CartridgeClass | null = null;

  private cycleCount: number = 0;
  private isRunning: boolean = false;
  private animationId: number | null = null;

  private audioContext: AudioContext | null = null;

  private audioBuffer: Float32Array;
  private audioBufferIndex: number = 0;

  private cleanupKeyboard: (() => void) | null = null;

  constructor() {
    this.memory = new Memory();
    this.cpu = new CPU(this.memory);
    this.ppu = new PPU();
    this.apu = new APU();
    this.input = new InputController();

    this.audioBuffer = new Float32Array(4096);
    this.setupComponents();
    this.setupAudio();
    this.setupInput();
  }

  /**
   * 重置模拟器
   */
  reset(): void {
    this.cpu.reset();
    this.ppu.reset();
    this.apu.reset();
    this.input.reset();
    this.cycleCount = 0;

    if (this.cartridge) {
      this.memory.setCartridge(this.cartridge);
    }
  }

  /**
   * 加载卡带
   */
  loadCartridge(romData: Uint8Array): void {
    try {
      this.cartridge = new CartridgeClass(romData);
      this.memory.setCartridge(this.cartridge);
      this.ppu.setCartridge(this.cartridge);
      this.reset();
    } catch (error) {
      console.error('Failed to load ROM:', error);
      throw error;
    }
  }

  /**
   * 启动模拟器
   */
  start(): void {
    if (!this.cartridge) {
      throw new Error('No cartridge loaded');
    }

    this.isRunning = true;
    this.run();
  }

  /**
   * 停止模拟器
   */
  stop(): void {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * 暂停/恢复模拟器
   */
  togglePause(): void {
    this.isRunning = !this.isRunning;
    if (this.isRunning) {
      this.run();
    }
  }

  /**
   * 运行模拟器主循环
   */
  private run(): void {
    if (!this.isRunning) return;

    const cyclesPerFrame = 29781; // NTSC: ~60 FPS
    let cyclesThisFrame = 0;

    while (cyclesThisFrame < cyclesPerFrame) {
      // CPU 执行一个指令
      const cpuCycles = this.cpu.step();

      // PPU 执行对应周期 (PPU 运行在 CPU 的 3 倍频率)
      for (let i = 0; i < cpuCycles * 3; i++) {
        this.ppu.step();

        // 检查 PPU NMI
        if (this.ppu.pollNMI()) {
          this.cpu.requestNMI();
        }
      }

      // APU 执行对应周期
      for (let i = 0; i < cpuCycles; i++) {
        this.apu.step();

        // 生成音频样本
        const sample = this.apu.generateSample();
        this.addToAudioBuffer(sample);
      }

      // 检查 APU IRQ
      if (this.apu.pollIRQ()) {
        this.cpu.requestIRQ();
      }

      cyclesThisFrame += cpuCycles;
      this.cycleCount += cpuCycles;
    }

    // 渲染帧缓冲区
    this.renderFrame();

    // 继续下一帧
    this.animationId = requestAnimationFrame(() => this.run());
  }

  /**
   * 单步执行 (用于调试)
   */
  step(): void {
    if (!this.cartridge) {
      throw new Error('No cartridge loaded');
    }

    // CPU 执行一个指令
    const cpuCycles = this.cpu.step();

    // PPU 执行对应周期
    for (let i = 0; i < cpuCycles * 3; i++) {
      this.ppu.step();

      if (this.ppu.pollNMI()) {
        this.cpu.requestNMI();
      }
    }

    // APU 执行对应周期
    for (let i = 0; i < cpuCycles; i++) {
      this.apu.step();
      const sample = this.apu.generateSample();
      this.addToAudioBuffer(sample);
    }

    if (this.apu.pollIRQ()) {
      this.cpu.requestIRQ();
    }

    this.cycleCount += cpuCycles;
    this.renderFrame();
  }

  /**
   * 设置组件间的连接
   */
  private setupComponents(): void {
    // 设置 PPU 寄存器映射到内存
    const ppuRegisters = new Uint8Array(8);
    this.memory.setPPURegisters(ppuRegisters);
    this.ppu.setRegisters(ppuRegisters);

    // 设置输入控制器
    this.memory.setInputController(this.input);

    // 连接 PPU 写入回调
    this.memory.setPPUWriteCallback((address: number, value: number) => {
      this.ppu.writeRegister(address, value);
    });

    // 连接 PPU 读取回调
    this.memory.setPPUReadCallback((address: number) => {
      return this.ppu.readRegister(address);
    });
  }

  /**
   * 设置音频系统
   */
  private setupAudio(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // 创建音频处理
      const scriptNode = this.audioContext.createScriptProcessor(512, 0, 1);
      scriptNode.onaudioprocess = (event) => {
        const outputBuffer = event.outputBuffer.getChannelData(0);

        for (let i = 0; i < outputBuffer.length; i++) {
          if (this.audioBufferIndex > 0) {
            outputBuffer[i] = this.audioBuffer[this.audioBufferIndex--];
          } else {
            outputBuffer[i] = 0;
          }
        }
      };

      scriptNode.connect(this.audioContext.destination);
    } catch (error) {
      console.warn('Audio initialization failed:', error);
    }
  }

  /**
   * 设置输入系统
   */
  private setupInput(): void {
    this.cleanupKeyboard = setupKeyboardEvents(this.input);

    // 设置输入控制器到内存映射
    this.memory.setInputController(this.input);
  }

  /**
   * 添加音频样本到缓冲区
   */
  private addToAudioBuffer(sample: number): void {
    if (this.audioBufferIndex < this.audioBuffer.length - 1) {
      this.audioBuffer[++this.audioBufferIndex] = sample;
    }
  }

  /**
   * 渲染当前帧
   */
  private renderFrame(): void {
    const frameBuffer = this.ppu.getFrameBuffer();

    // console.log('private renderFrame():', frameBuffer);

    // 发送帧缓冲区到前端渲染
    this.onFrameRender?.(frameBuffer);
  }

  /**
   * 帧渲染回调
   */
  public onFrameRender?: (frameBuffer: Uint8Array) => void;

  /**
   * 获取模拟器状态 (用于调试)
   */
  getState() {
    return {
      cycleCount: this.cycleCount,
      isRunning: this.isRunning,
      cpu: this.cpu.getState(),
      ppu: this.ppu.getState(),
      apu: this.apu.getState(),
      memory: {
        ram: this.memory.getRAM(),
        size: 0x0800
      }
    };
  }

  /**
   * 获取控制器状态
   */
  getControllerState(index: number) {
    return this.input.getControllerState(index);
  }

  /**
   * 清理资源
   */
  destroy(): void {
    this.stop();

    if (this.cleanupKeyboard) {
      this.cleanupKeyboard();
      this.cleanupKeyboard = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// 类型声明扩展
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}