import type { AddressingModes } from '../addressingModes.js';

export class TransferInstructions {
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

  // TAX - Transfer Accumulator to X
  TAX(): number {
    this.cpu.setX(this.cpu.getA());
    this.updateNZFlags(this.cpu.getX());
    return 2;
  }

  // TAY - Transfer Accumulator to Y
  TAY(): number {
    this.cpu.setY(this.cpu.getA());
    this.updateNZFlags(this.cpu.getY());
    return 2;
  }

  // TXA - Transfer X to Accumulator
  TXA(): number {
    this.cpu.setA(this.cpu.getX());
    this.updateNZFlags(this.cpu.getA());
    return 2;
  }

  // TYA - Transfer Y to Accumulator
  TYA(): number {
    this.cpu.setA(this.cpu.getY());
    this.updateNZFlags(this.cpu.getA());
    return 2;
  }

  // TSX - Transfer Stack Pointer to X
  TSX(): number {
    this.cpu.setX(this.cpu.getSP());
    this.updateNZFlags(this.cpu.getX());
    return 2;
  }

  // TXS - Transfer X to Stack Pointer (不影响标志位)
  TXS(): number {
    this.cpu.setSP(this.cpu.getX());
    return 2;
  }
}