import type { AddressingModes } from '../addressingModes.js';

export class LogicInstructions {
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

  // AND - Logical AND
  AND_IMM(): number {
    const result = this.addressing.immediate();
    this.cpu.setA(this.cpu.getA() & result.value!);
    this.updateNZFlags(this.cpu.getA());
    return 2;
  }

  AND_ZP(): number {
    const result = this.addressing.zeroPage();
    this.cpu.setA(this.cpu.getA() & result.value!);
    this.updateNZFlags(this.cpu.getA());
    return 3;
  }

  AND_ZPX(): number {
    const result = this.addressing.zeroPageX();
    this.cpu.setA(this.cpu.getA() & result.value!);
    this.updateNZFlags(this.cpu.getA());
    return 4;
  }

  AND_ABS(): number {
    const result = this.addressing.absolute();
    this.cpu.setA(this.cpu.getA() & result.value!);
    this.updateNZFlags(this.cpu.getA());
    return 4;
  }

  AND_ABSX(): number {
    const result = this.addressing.absoluteX();
    this.cpu.setA(this.cpu.getA() & result.value!);
    this.updateNZFlags(this.cpu.getA());
    return 4 + result.cycles;
  }

  AND_ABSY(): number {
    const result = this.addressing.absoluteY();
    this.cpu.setA(this.cpu.getA() & result.value!);
    this.updateNZFlags(this.cpu.getA());
    return 4 + result.cycles;
  }

  AND_INDX(): number {
    const result = this.addressing.indirectX();
    this.cpu.setA(this.cpu.getA() & result.value!);
    this.updateNZFlags(this.cpu.getA());
    return 6;
  }

  AND_INDY(): number {
    const result = this.addressing.indirectY();
    this.cpu.setA(this.cpu.getA() & result.value!);
    this.updateNZFlags(this.cpu.getA());
    return 5 + result.cycles;
  }

  // ORA - Logical OR
  ORA_IMM(): number {
    const result = this.addressing.immediate();
    this.cpu.setA(this.cpu.getA() | result.value!);
    this.updateNZFlags(this.cpu.getA());
    return 2;
  }

  ORA_ZP(): number {
    const result = this.addressing.zeroPage();
    this.cpu.setA(this.cpu.getA() | result.value!);
    this.updateNZFlags(this.cpu.getA());
    return 3;
  }

  ORA_ZPX(): number {
    const result = this.addressing.zeroPageX();
    this.cpu.setA(this.cpu.getA() | result.value!);
    this.updateNZFlags(this.cpu.getA());
    return 4;
  }

  ORA_ABS(): number {
    const result = this.addressing.absolute();
    this.cpu.setA(this.cpu.getA() | result.value!);
    this.updateNZFlags(this.cpu.getA());
    return 4;
  }

  ORA_ABSX(): number {
    const result = this.addressing.absoluteX();
    this.cpu.setA(this.cpu.getA() | result.value!);
    this.updateNZFlags(this.cpu.getA());
    return 4 + result.cycles;
  }

  ORA_ABSY(): number {
    const result = this.addressing.absoluteY();
    this.cpu.setA(this.cpu.getA() | result.value!);
    this.updateNZFlags(this.cpu.getA());
    return 4 + result.cycles;
  }

  ORA_INDX(): number {
    const result = this.addressing.indirectX();
    this.cpu.setA(this.cpu.getA() | result.value!);
    this.updateNZFlags(this.cpu.getA());
    return 6;
  }

  ORA_INDY(): number {
    const result = this.addressing.indirectY();
    this.cpu.setA(this.cpu.getA() | result.value!);
    this.updateNZFlags(this.cpu.getA());
    return 5 + result.cycles;
  }

  // EOR - Exclusive OR
  EOR_IMM(): number {
    const result = this.addressing.immediate();
    this.cpu.setA(this.cpu.getA() ^ result.value!);
    this.updateNZFlags(this.cpu.getA());
    return 2;
  }

  EOR_ZP(): number {
    const result = this.addressing.zeroPage();
    this.cpu.setA(this.cpu.getA() ^ result.value!);
    this.updateNZFlags(this.cpu.getA());
    return 3;
  }

  EOR_ZPX(): number {
    const result = this.addressing.zeroPageX();
    this.cpu.setA(this.cpu.getA() ^ result.value!);
    this.updateNZFlags(this.cpu.getA());
    return 4;
  }

  EOR_ABS(): number {
    const result = this.addressing.absolute();
    this.cpu.setA(this.cpu.getA() ^ result.value!);
    this.updateNZFlags(this.cpu.getA());
    return 4;
  }

  EOR_ABSX(): number {
    const result = this.addressing.absoluteX();
    this.cpu.setA(this.cpu.getA() ^ result.value!);
    this.updateNZFlags(this.cpu.getA());
    return 4 + result.cycles;
  }

  EOR_ABSY(): number {
    const result = this.addressing.absoluteY();
    this.cpu.setA(this.cpu.getA() ^ result.value!);
    this.updateNZFlags(this.cpu.getA());
    return 4 + result.cycles;
  }

  EOR_INDX(): number {
    const result = this.addressing.indirectX();
    this.cpu.setA(this.cpu.getA() ^ result.value!);
    this.updateNZFlags(this.cpu.getA());
    return 6;
  }

  EOR_INDY(): number {
    const result = this.addressing.indirectY();
    this.cpu.setA(this.cpu.getA() ^ result.value!);
    this.updateNZFlags(this.cpu.getA());
    return 5 + result.cycles;
  }

  // BIT - Bit Test
  BIT_ZP(): number {
    const result = this.addressing.zeroPage();
    const value = result.value!;
    const andResult = this.cpu.getA() & value;
    
    this.cpu.setFlag('Z', andResult === 0);
    this.cpu.setFlag('V', (value & 0x40) !== 0);
    this.cpu.setFlag('N', (value & 0x80) !== 0);
    
    return 3;
  }

  BIT_ABS(): number {
    const result = this.addressing.absolute();
    const value = result.value!;
    const andResult = this.cpu.getA() & value;
    
    this.cpu.setFlag('Z', andResult === 0);
    this.cpu.setFlag('V', (value & 0x40) !== 0);
    this.cpu.setFlag('N', (value & 0x80) !== 0);
    
    return 4;
  }
}