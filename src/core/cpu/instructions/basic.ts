import type { AddressingModes } from '../addressingModes.js';

export class BasicInstructions {
  private cpu: any;
  private addressing: AddressingModes;

  constructor(cpu: any, addressing: AddressingModes) {
    this.cpu = cpu;
    this.addressing = addressing;
  }

  // 标志位更新辅助函数
  private updateNZFlags(value: number): void {
    const maskedValue = value & 0xFF;
    this.cpu.setFlag('Z', maskedValue === 0);
    this.cpu.setFlag('N', (maskedValue & 0x80) !== 0);
  }

  // NOP - 空操作
  NOP(): number {
    return 2;
  }

  // BRK - 强制中断
  BRK(): number {
    this.cpu.push16(this.cpu.getPC() + 1);
    this.cpu.pushByte(this.cpu.getStatusFlags() | 0x10); // 设置B标志
    this.cpu.setFlag('I', true); // 禁用中断
    this.cpu.setPC(this.cpu.readWord(0xFFFE)); // 读取IRQ向量
    return 7;
  }
}