import type { AddressingModes } from '../addressingModes.js';

export class StoreInstructions {
  private cpu: any;
  private addressing: AddressingModes;

  constructor(cpu: any, addressing: AddressingModes) {
    this.cpu = cpu;
    this.addressing = addressing;
  }

  // STA - Store Accumulator
  STA_ZP(): number {
    const result = this.addressing.zeroPage();
    this.cpu.writeByte(result.address, this.cpu.getA());
    return 3;
  }

  STA_ZPX(): number {
    const result = this.addressing.zeroPageX();
    this.cpu.writeByte(result.address, this.cpu.getA());
    return 4;
  }

  STA_ABS(): number {
    const result = this.addressing.absolute();
    this.cpu.writeByte(result.address, this.cpu.getA());
    return 4;
  }

  STA_ABSX(): number {
    const result = this.addressing.absoluteX();
    this.cpu.writeByte(result.address, this.cpu.getA());
    return 5;
  }

  STA_ABSY(): number {
    const result = this.addressing.absoluteY();
    this.cpu.writeByte(result.address, this.cpu.getA());
    return 5;
  }

  STA_INDX(): number {
    const result = this.addressing.indirectX();
    this.cpu.writeByte(result.address, this.cpu.getA());
    return 6;
  }

  STA_INDY(): number {
    const result = this.addressing.indirectY();
    this.cpu.writeByte(result.address, this.cpu.getA());
    return 6;
  }

  // STX - Store X Register
  STX_ZP(): number {
    const result = this.addressing.zeroPage();
    this.cpu.writeByte(result.address, this.cpu.getX());
    return 3;
  }

  STX_ZPY(): number {
    const result = this.addressing.zeroPageY();
    this.cpu.writeByte(result.address, this.cpu.getX());
    return 4;
  }

  STX_ABS(): number {
    const result = this.addressing.absolute();
    this.cpu.writeByte(result.address, this.cpu.getX());
    return 4;
  }

  // STY - Store Y Register
  STY_ZP(): number {
    const result = this.addressing.zeroPage();
    this.cpu.writeByte(result.address, this.cpu.getY());
    return 3;
  }

  STY_ZPX(): number {
    const result = this.addressing.zeroPageX();
    this.cpu.writeByte(result.address, this.cpu.getY());
    return 4;
  }

  STY_ABS(): number {
    const result = this.addressing.absolute();
    this.cpu.writeByte(result.address, this.cpu.getY());
    return 4;
  }
}