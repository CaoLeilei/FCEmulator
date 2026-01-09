import type { AddressingModes } from '../addressingModes.js';

export class ShiftInstructions {
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

  // ASL - Arithmetic Shift Left
  ASL_ACC(): number {
    const result = this.addressing.accumulator();
    const value = result.value!;
    const carry = (value & 0x80) !== 0;
    const shifted = (value << 1) & 0xFF;

    this.cpu.setFlag('C', carry);
    this.cpu.setA(shifted);
    this.updateNZFlags(shifted);

    return 2;
  }

  ASL_ZP(): number {
    const result = this.addressing.zeroPage();
    const value = result.value!;
    const carry = (value & 0x80) !== 0;
    const shifted = (value << 1) & 0xFF;

    this.cpu.setFlag('C', carry);
    this.cpu.writeByte(result.address, shifted);
    this.updateNZFlags(shifted);

    return 5;
  }

  ASL_ZPX(): number {
    const result = this.addressing.zeroPageX();
    const value = result.value!;
    const carry = (value & 0x80) !== 0;
    const shifted = (value << 1) & 0xFF;

    this.cpu.setFlag('C', carry);
    this.cpu.writeByte(result.address, shifted);
    this.updateNZFlags(shifted);

    return 6;
  }

  ASL_ABS(): number {
    const result = this.addressing.absolute();
    const value = result.value!;
    const carry = (value & 0x80) !== 0;
    const shifted = (value << 1) & 0xFF;

    this.cpu.setFlag('C', carry);
    this.cpu.writeByte(result.address, shifted);
    this.updateNZFlags(shifted);

    return 6;
  }

  ASL_ABSX(): number {
    const result = this.addressing.absoluteX();
    const value = result.value!;
    const carry = (value & 0x80) !== 0;
    const shifted = (value << 1) & 0xFF;

    this.cpu.setFlag('C', carry);
    this.cpu.writeByte(result.address, shifted);
    this.updateNZFlags(shifted);

    return 7;
  }

  // LSR - Logical Shift Right
  LSR_ACC(): number {
    const result = this.addressing.accumulator();
    const value = result.value!;
    const carry = (value & 0x01) !== 0;
    const shifted = value >> 1;

    this.cpu.setFlag('C', carry);
    this.cpu.setA(shifted);
    this.updateNZFlags(shifted);

    return 2;
  }

  LSR_ZP(): number {
    const result = this.addressing.zeroPage();
    const value = result.value!;
    const carry = (value & 0x01) !== 0;
    const shifted = value >> 1;

    this.cpu.setFlag('C', carry);
    this.cpu.writeByte(result.address, shifted);
    this.updateNZFlags(shifted);

    return 5;
  }

  LSR_ZPX(): number {
    const result = this.addressing.zeroPageX();
    const value = result.value!;
    const carry = (value & 0x01) !== 0;
    const shifted = value >> 1;

    this.cpu.setFlag('C', carry);
    this.cpu.writeByte(result.address, shifted);
    this.updateNZFlags(shifted);

    return 6;
  }

  LSR_ABS(): number {
    const result = this.addressing.absolute();
    const value = result.value!;
    const carry = (value & 0x01) !== 0;
    const shifted = value >> 1;

    this.cpu.setFlag('C', carry);
    this.cpu.writeByte(result.address, shifted);
    this.updateNZFlags(shifted);

    return 6;
  }

  LSR_ABSX(): number {
    const result = this.addressing.absoluteX();
    const value = result.value!;
    const carry = (value & 0x01) !== 0;
    const shifted = value >> 1;

    this.cpu.setFlag('C', carry);
    this.cpu.writeByte(result.address, shifted);
    this.updateNZFlags(shifted);

    return 7;
  }

  // ROL - Rotate Left
  ROL_ACC(): number {
    const result = this.addressing.accumulator();
    const value = result.value!;
    const carry = (value & 0x80) !== 0;
    const currentCarry = this.cpu.getFlag('C');
    const rotated = ((value << 1) | (currentCarry ? 1 : 0)) & 0xFF;

    this.cpu.setFlag('C', carry);
    this.cpu.setA(rotated);
    this.updateNZFlags(rotated);

    return 2;
  }

  ROL_ZP(): number {
    const result = this.addressing.zeroPage();
    const value = result.value!;
    const carry = (value & 0x80) !== 0;
    const currentCarry = this.cpu.getFlag('C');
    const rotated = ((value << 1) | (currentCarry ? 1 : 0)) & 0xFF;

    this.cpu.setFlag('C', carry);
    this.cpu.writeByte(result.address, rotated);
    this.updateNZFlags(rotated);

    return 5;
  }

  ROL_ZPX(): number {
    const result = this.addressing.zeroPageX();
    const value = result.value!;
    const carry = (value & 0x80) !== 0;
    const currentCarry = this.cpu.getFlag('C');
    const rotated = ((value << 1) | (currentCarry ? 1 : 0)) & 0xFF;

    this.cpu.setFlag('C', carry);
    this.cpu.writeByte(result.address, rotated);
    this.updateNZFlags(rotated);

    return 6;
  }

  ROL_ABS(): number {
    const result = this.addressing.absolute();
    const value = result.value!;
    const carry = (value & 0x80) !== 0;
    const currentCarry = this.cpu.getFlag('C');
    const rotated = ((value << 1) | (currentCarry ? 1 : 0)) & 0xFF;

    this.cpu.setFlag('C', carry);
    this.cpu.writeByte(result.address, rotated);
    this.updateNZFlags(rotated);

    return 6;
  }

  ROL_ABSX(): number {
    const result = this.addressing.absoluteX();
    const value = result.value!;
    const carry = (value & 0x80) !== 0;
    const currentCarry = this.cpu.getFlag('C');
    const rotated = ((value << 1) | (currentCarry ? 1 : 0)) & 0xFF;

    this.cpu.setFlag('C', carry);
    this.cpu.writeByte(result.address, rotated);
    this.updateNZFlags(rotated);

    return 7;
  }

  // ROR - Rotate Right
  ROR_ACC(): number {
    const result = this.addressing.accumulator();
    const value = result.value!;
    const carry = (value & 0x01) !== 0;
    const currentCarry = this.cpu.getFlag('C');
    const rotated = (value >> 1) | (currentCarry ? 0x80 : 0);

    this.cpu.setFlag('C', carry);
    this.cpu.setA(rotated);
    this.updateNZFlags(rotated);

    return 2;
  }

  ROR_ZP(): number {
    const result = this.addressing.zeroPage();
    const value = result.value!;
    const carry = (value & 0x01) !== 0;
    const currentCarry = this.cpu.getFlag('C');
    const rotated = (value >> 1) | (currentCarry ? 0x80 : 0);

    this.cpu.setFlag('C', carry);
    this.cpu.writeByte(result.address, rotated);
    this.updateNZFlags(rotated);

    return 5;
  }

  ROR_ZPX(): number {
    const result = this.addressing.zeroPageX();
    const value = result.value!;
    const carry = (value & 0x01) !== 0;
    const currentCarry = this.cpu.getFlag('C');
    const rotated = (value >> 1) | (currentCarry ? 0x80 : 0);

    this.cpu.setFlag('C', carry);
    this.cpu.writeByte(result.address, rotated);
    this.updateNZFlags(rotated);

    return 6;
  }

  ROR_ABS(): number {
    const result = this.addressing.absolute();
    const value = result.value!;
    const carry = (value & 0x01) !== 0;
    const currentCarry = this.cpu.getFlag('C');
    const rotated = (value >> 1) | (currentCarry ? 0x80 : 0);

    this.cpu.setFlag('C', carry);
    this.cpu.writeByte(result.address, rotated);
    this.updateNZFlags(rotated);

    return 6;
  }

  ROR_ABSX(): number {
    const result = this.addressing.absoluteX();
    const value = result.value!;
    const carry = (value & 0x01) !== 0;
    const currentCarry = this.cpu.getFlag('C');
    const rotated = (value >> 1) | (currentCarry ? 0x80 : 0);

    this.cpu.setFlag('C', carry);
    this.cpu.writeByte(result.address, rotated);
    this.updateNZFlags(rotated);

    return 7;
  }

  // INC - Increment Memory
  INC_ZP(): number {
    const result = this.addressing.zeroPage();
    const value = result.value!;
    const incremented = (value + 1) & 0xFF;

    this.cpu.writeByte(result.address, incremented);
    this.updateNZFlags(incremented);

    return 5;
  }

  INC_ZPX(): number {
    const result = this.addressing.zeroPageX();
    const value = result.value!;
    const incremented = (value + 1) & 0xFF;

    this.cpu.writeByte(result.address, incremented);
    this.updateNZFlags(incremented);

    return 6;
  }

  INC_ABS(): number {
    const result = this.addressing.absolute();
    const value = result.value!;
    const incremented = (value + 1) & 0xFF;

    this.cpu.writeByte(result.address, incremented);
    this.updateNZFlags(incremented);

    return 6;
  }

  INC_ABSX(): number {
    const result = this.addressing.absoluteX();
    const value = result.value!;
    const incremented = (value + 1) & 0xFF;

    this.cpu.writeByte(result.address, incremented);
    this.updateNZFlags(incremented);

    return 7;
  }

  // DEC - Decrement Memory
  DEC_ZP(): number {
    const result = this.addressing.zeroPage();
    const value = result.value!;
    const decremented = (value - 1) & 0xFF;

    this.cpu.writeByte(result.address, decremented);
    this.updateNZFlags(decremented);

    return 5;
  }

  // DEC - Decrement Memory (X Indexed)
  DEC_ZPX(): number {
    const result = this.addressing.zeroPageX();
    const value = result.value!;
    const decremented = (value - 1) & 0xFF;

    this.cpu.writeByte(result.address, decremented);
    this.updateNZFlags(decremented);

    return 6;
  }

  DEC_ABS(): number {
    const result = this.addressing.absolute();
    const value = result.value!;
    const decremented = (value - 1) & 0xFF;

    this.cpu.writeByte(result.address, decremented);
    this.updateNZFlags(decremented);

    return 6;
  }

  DEC_ABSX(): number {
    const result = this.addressing.absoluteX();
    const value = result.value!;
    const decremented = (value - 1) & 0xFF;

    this.cpu.writeByte(result.address, decremented);
    this.updateNZFlags(decremented);

    return 7;
  }

  // INX - Increment X Register
  INX(): number {
    this.cpu.setX((this.cpu.getX() + 1) & 0xFF);
    this.updateNZFlags(this.cpu.getX());
    return 2;
  }

  // INY - Increment Y Register
  INY(): number {
    this.cpu.setY((this.cpu.getY() + 1) & 0xFF);
    this.updateNZFlags(this.cpu.getY());
    return 2;
  }

  // DEX - Decrement X Register
  DEX(): number {
    this.cpu.setX((this.cpu.getX() - 1) & 0xFF);
    this.updateNZFlags(this.cpu.getX());
    return 2;
  }

  // DEY - Decrement Y Register
  DEY(): number {
    this.cpu.setY((this.cpu.getY() - 1) & 0xFF);
    this.updateNZFlags(this.cpu.getY());
    return 2;
  }
}