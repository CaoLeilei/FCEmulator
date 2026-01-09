import type { AddressingModes } from '../addressingModes.js';

export class LoadInstructions {
  private cpu: any;
  private addressing: AddressingModes;

  constructor(cpu: any, addressing: AddressingModes) {
    this.cpu = cpu;
    this.addressing = addressing;
  }

  private updateNZFlags(value: number): void {
    const maskedValue = value & 0xFF;
    this.cpu.setFlag('Z', maskedValue === 0);
    this.cpu.setFlag('N', (maskedValue & 0x80) !== 0);
  }

  // LDA - Load Accumulator
  LDA_IMM(): number {
    const result = this.addressing.immediate();
    this.cpu.setA(result.value!);
    this.updateNZFlags(this.cpu.getA());
    return 2;
  }

  LDA_ZP(): number {
    const result = this.addressing.zeroPage();
    this.cpu.setA(result.value!);
    this.updateNZFlags(this.cpu.getA());
    return 3;
  }

  LDA_ZPX(): number {
    const result = this.addressing.zeroPageX();
    this.cpu.setA(result.value!);
    this.updateNZFlags(this.cpu.getA());
    return 4;
  }

  LDA_ABS(): number {
    const result = this.addressing.absolute();
    this.cpu.setA(result.value!);
    this.updateNZFlags(this.cpu.getA());
    return 4;
  }

  LDA_ABSX(): number {
    const result = this.addressing.absoluteX();
    this.cpu.setA(result.value!);
    this.updateNZFlags(this.cpu.getA());
    return 4 + result.cycles;
  }

  LDA_ABSY(): number {
    const result = this.addressing.absoluteY();
    this.cpu.setA(result.value!);
    this.updateNZFlags(this.cpu.getA());
    return 4 + result.cycles;
  }

  LDA_INDX(): number {
    const result = this.addressing.indirectX();
    this.cpu.setA(result.value!);
    this.updateNZFlags(this.cpu.getA());
    return 6;
  }

  LDA_INDY(): number {
    const result = this.addressing.indirectY();
    this.cpu.setA(result.value!);
    this.updateNZFlags(this.cpu.getA());
    return 5 + result.cycles;
  }

  // LDX - Load X Register
  LDX_IMM(): number {
    const result = this.addressing.immediate();
    this.cpu.setX(result.value!);
    this.updateNZFlags(this.cpu.getX());
    return 2;
  }

  LDX_ZP(): number {
    const result = this.addressing.zeroPage();
    this.cpu.setX(result.value!);
    this.updateNZFlags(this.cpu.getX());
    return 3;
  }

  LDX_ZPY(): number {
    const result = this.addressing.zeroPageY();
    this.cpu.setX(result.value!);
    this.updateNZFlags(this.cpu.getX());
    return 4;
  }

  LDX_ABS(): number {
    const result = this.addressing.absolute();
    this.cpu.setX(result.value!);
    this.updateNZFlags(this.cpu.getX());
    return 4;
  }

  LDX_ABSY(): number {
    const result = this.addressing.absoluteY();
    this.cpu.setX(result.value!);
    this.updateNZFlags(this.cpu.getX());
    return 4 + result.cycles;
  }

  // LDY - Load Y Register
  LDY_IMM(): number {
    const result = this.addressing.immediate();
    this.cpu.setY(result.value!);
    this.updateNZFlags(this.cpu.getY());
    return 2;
  }

  LDY_ZP(): number {
    const result = this.addressing.zeroPage();
    this.cpu.setY(result.value!);
    this.updateNZFlags(this.cpu.getY());
    return 3;
  }

  LDY_ZPX(): number {
    const result = this.addressing.zeroPageX();
    this.cpu.setY(result.value!);
    this.updateNZFlags(this.cpu.getY());
    return 4;
  }

  LDY_ABS(): number {
    const result = this.addressing.absolute();
    this.cpu.setY(result.value!);
    this.updateNZFlags(this.cpu.getY());
    return 4;
  }

  LDY_ABSX(): number {
    const result = this.addressing.absoluteX();
    this.cpu.setY(result.value!);
    this.updateNZFlags(this.cpu.getY());
    return 4 + result.cycles;
  }
}