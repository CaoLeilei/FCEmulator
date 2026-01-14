/**
 * 6502 CPU 核心实现
 * 支持 FC 的 Ricoh 2A03 处理器指令集
 */

import type { Memory } from '../memory/index.js';
import type { CPUFlags } from './types.js';
import { InstructionDecoder } from './instructionDecoder.js';

export class CPU {
  // 寄存器
  private A: number = 0;    // 累加器
  private X: number = 0;    // X 寄存器
  private Y: number = 0;    // Y 寄存器
  private SP: number = 0xFD; // 栈指针
  private PC: number = 0;   // 程序计数器

  // 状态寄存器标志位
  private flags: CPUFlags = {
    C: false, // 进位标志
    Z: false, // 零标志
    I: true,  // 中断禁用
    D: false, // 十进制模式
    B: false, // 中断标志
    V: false, // 溢出标志
    N: false  // 负标志
  };

  private cycles: number = 0;
  private decoder: InstructionDecoder;

  private memory: Memory;

  // 中断标志
  private nmiRequested: boolean = false;
  private irqRequested: boolean = false;

  constructor(memory: Memory) {
    this.memory = memory;
    this.decoder = new InstructionDecoder(this);
  }

  /**
   * 重置 CPU 状态
   */
  reset(): void {
    this.PC = this.readWord(0xFFFC); // 读取复位向量
    this.SP = 0xFD;
    this.A = this.X = this.Y = 0;
    this.flags = { C: false, Z: false, I: true, D: false, B: false, V: false, N: false };
    this.cycles = 0;
    this.nmiRequested = false;
    this.irqRequested = false;
  }

  /**
   * 执行一条指令
   */
  step(): number {
    // 在执行指令之前检查 NMI（NMI 不能被禁用）
    if (this.nmiRequested) {
      this.handleNMI();
      this.nmiRequested = false;
    }
    // 然后检查 IRQ（可以被 I 标志禁用）
    else if (this.irqRequested && !this.flags.I) {
      this.handleIRQ();
      this.irqRequested = false;
    }

    const opcode = this.readByte(this.PC++);
    return this.decoder.executeOpcode(opcode);
  }

  /**
   * 处理 NMI 中断
   */
  private handleNMI(): void {
    console.log(`CPU handling NMI: current PC=0x${this.PC.toString(16)}, jumping to 0xFFFA`);
    this.push16(this.PC);
    this.pushByte(this.getStatusFlags() & ~0x10); // 清除 B 标志
    this.flags.I = true;
    this.PC = this.readWord(0xFFFA);
    this.cycles += 7;
    console.log(`CPU NMI handled: new PC=0x${this.PC.toString(16)}`);
  }

  /**
   * 处理 IRQ 中断
   */
  private handleIRQ(): void {
    this.push16(this.PC);
    this.pushByte(this.getStatusFlags() & ~0x10); // 清除 B 标志
    this.flags.I = true;
    this.PC = this.readWord(0xFFFE);
    this.cycles += 7;
  }

  // 内存访问方法
  readByte(address: number): number {
    return this.memory.read(address);
  }

  writeByte(address: number, value: number): void {
    this.memory.write(address, value & 0xFF);
  }

  readWord(address: number): number {
    return this.memory.read16(address);
  }

  writeWord(address: number, value: number): void {
    this.memory.write16(address, value & 0xFFFF);
  }

  // 寄存器访问方法
  getA(): number { return this.A; }
  setA(value: number): void { this.A = value & 0xFF; }

  getX(): number { return this.X; }
  setX(value: number): void { this.X = value & 0xFF; }

  getY(): number { return this.Y; }
  setY(value: number): void { this.Y = value & 0xFF; }

  getSP(): number { return this.SP; }
  setSP(value: number): void { this.SP = value & 0xFF; }

  getPC(): number { return this.PC; }
  setPC(value: number): void { this.PC = value & 0xFFFF; }

  // 标志位访问方法
  getFlag(flag: keyof CPUFlags): boolean {
    return this.flags[flag];
  }

  setFlag(flag: keyof CPUFlags, value: boolean): void {
    this.flags[flag] = value;
  }

  /**
   * 获取状态寄存器值
   */
  getStatusFlags(): number {
    let flags = 0;
    flags |= this.flags.C ? 0x01 : 0;
    flags |= this.flags.Z ? 0x02 : 0;
    flags |= this.flags.I ? 0x04 : 0;
    flags |= this.flags.D ? 0x08 : 0;
    flags |= this.flags.B ? 0x10 : 0;
    flags |= this.flags.V ? 0x40 : 0;
    flags |= this.flags.N ? 0x80 : 0;
    return flags;
  }

  /**
   * 设置状态寄存器
   */
  setStatusFlags(flags: number): void {
    this.flags.C = !!(flags & 0x01);
    this.flags.Z = !!(flags & 0x02);
    this.flags.I = !!(flags & 0x04);
    this.flags.D = !!(flags & 0x08);
    this.flags.B = !!(flags & 0x10);
    this.flags.V = !!(flags & 0x40);
    this.flags.N = !!(flags & 0x80);
  }

  /**
   * 请求 NMI 中断（设置标志，实际处理在 step() 中）
   */
  requestNMI(): void {
    this.nmiRequested = true;
  }

  /**
   * 请求 IRQ 中断（设置标志，实际处理在 step() 中）
   */
  requestIRQ(): void {
    this.irqRequested = true;
  }

  pushByte(value: number): void {
    this.SP = (this.SP - 1) & 0xFF;
    this.writeByte(0x100 + this.SP, value);
  }

  push16(value: number): void {
    this.pushByte(value >> 8);
    this.pushByte(value & 0xFF);
  }

  popByte(): number {
    const value = this.readByte(0x100 + this.SP);
    this.SP = (this.SP + 1) & 0xFF;
    return value;
  }

  pop16(): number {
    const low = this.popByte();
    const high = this.popByte();
    return (high << 8) | low;
  }

  // 调试用方法
  getState() {
    return {
      PC: this.PC,
      A: this.A,
      X: this.X,
      Y: this.Y,
      SP: this.SP,
      flags: { ...this.flags },
      cycles: this.cycles
    };
  }

  // 获取指令信息
  getInstructionInfo(opcode: number) {
    return this.decoder.getInstructionInfo(opcode);
  }

  // 检查指令是否已实现
  isImplemented(opcode: number): boolean {
    return this.decoder.isImplemented(opcode);
  }

  // 获取已实现指令数量
  getImplementedCount(): number {
    return this.decoder.getImplementedCount();
  }
}