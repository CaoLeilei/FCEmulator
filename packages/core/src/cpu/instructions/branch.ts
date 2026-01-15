import type { AddressingModes } from '../addressingModes.js';

export class BranchInstructions {
  private cpu: any;
  private addressing: AddressingModes;

  constructor(cpu: any, addressing: AddressingModes) {
    this.cpu = cpu;
    this.addressing = addressing;
  }

  // BCC - Branch if Carry Clear
  BCC(): number {
    const currentPC = this.cpu.getPC();
    const result = this.addressing.relative();
    if (!this.cpu.getFlag('C')) {
      // 分支成功：设置为分支目标地址
      this.cpu.setPC(result.address);
      return result.crossedPage ? 4 : 3; // 分支成功：基础3周期+跨页额外1
    }
    // 分支失败：PC已经指向下一条指令（relative()已经处理了）
    return 2; // 分支失败2周期
  }

  // BCS - Branch if Carry Set
  BCS(): number {
    const result = this.addressing.relative();
    if (this.cpu.getFlag('C')) {
      // 分支成功：设置为分支目标地址
      this.cpu.setPC(result.address);
      return result.crossedPage ? 4 : 3; // 分支成功：基础3周期+跨页额外1
    }
    // 分支失败：PC已经指向下一条指令（relative()已经处理了）
    return 2; // 分支失败2周期
  }

  // BEQ - Branch if Equal
  BEQ(): number {
    const result = this.addressing.relative();
    if (this.cpu.getFlag('Z')) {
      // 分支成功：设置为分支目标地址
      this.cpu.setPC(result.address);
      return result.crossedPage ? 4 : 3; // 分支成功：基础3周期+跨页额外1
    }
    // 分支失败：PC已经指向下一条指令（relative()已经处理了）
    return 2; // 分支失败2周期
  }

  // BMI - Branch if Minus
  BMI(): number {
    const result = this.addressing.relative();
    if (this.cpu.getFlag('N')) {
      // 分支成功：设置为分支目标地址
      this.cpu.setPC(result.address);
      return result.crossedPage ? 4 : 3; // 分支成功：基础3周期+跨页额外1
    }
    // 分支失败：PC已经指向下一条指令（relative()已经处理了）
    return 2; // 分支失败2周期
  }

  // BNE - Branch if Not Equal
  BNE(): number {
    const result = this.addressing.relative();
    if (!this.cpu.getFlag('Z')) {
      // 分支成功：设置为分支目标地址
      this.cpu.setPC(result.address);
      return result.crossedPage ? 4 : 3; // 分支成功：基础3周期+跨页额外1
    }
    // 分支失败：PC已经指向下一条指令（relative()已经处理了）
    return 2; // 分支失败2周期
  }

  // BPL - Branch if Plus
  BPL(): number {
    const result = this.addressing.relative();
    if (!this.cpu.getFlag('N')) {
      // 分支成功：设置为分支目标地址
      this.cpu.setPC(result.address);
      return result.crossedPage ? 4 : 3; // 分支成功：基础3周期+跨页额外1
    }
    // 分支失败：PC已经指向下一条指令（relative()已经处理了）
    return 2; // 分支失败2周期
  }

  // BVC - Branch if Overflow Clear
  BVC(): number {
    const result = this.addressing.relative();
    if (!this.cpu.getFlag('V')) {
      // 分支成功：设置为分支目标地址
      this.cpu.setPC(result.address);
      return result.crossedPage ? 4 : 3; // 分支成功：基础3周期+跨页额外1
    }
    // 分支失败：PC已经指向下一条指令（relative()已经处理了）
    return 2; // 分支失败2周期
  }

  // BVS - Branch if Overflow Set
  BVS(): number {
    const result = this.addressing.relative();
    if (this.cpu.getFlag('V')) {
      // 分支成功：设置为分支目标地址
      this.cpu.setPC(result.address);
      return result.crossedPage ? 4 : 3; // 分支成功：基础3周期+跨页额外1
    }
    // 分支失败：PC已经指向下一条指令（relative()已经处理了）
    return 2; // 分支失败2周期
  }
}