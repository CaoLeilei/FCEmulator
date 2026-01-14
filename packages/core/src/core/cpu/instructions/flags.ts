import type { AddressingModes } from '../addressingModes.js';

export class FlagInstructions {
  private cpu: any;
  private addressing: AddressingModes;

  constructor(cpu: any, addressing: AddressingModes) {
    this.cpu = cpu;
    this.addressing = addressing;
  }

  // CLC - Clear Carry Flag
  CLC(): number {
    const result = this.addressing.implied();
    this.cpu.setFlag('C', false);
    return 2;
  }

  // CLD - Clear Decimal Mode
  CLD(): number {
    const result = this.addressing.implied();
    this.cpu.setFlag('D', false);
    return 2;
  }

  // CLI - Clear Interrupt Disable
  CLI(): number {
    const result = this.addressing.implied();
    this.cpu.setFlag('I', false);
    return 2;
  }

  // CLV - Clear Overflow Flag
  CLV(): number {
    const result = this.addressing.implied();
    this.cpu.setFlag('V', false);
    return 2;
  }

  // SEC - Set Carry Flag
  SEC(): number {
    const result = this.addressing.implied();
    this.cpu.setFlag('C', true);
    return 2;
  }

  // SED - Set Decimal Mode
  SED(): number {
    const result = this.addressing.implied();
    this.cpu.setFlag('D', true);
    return 2;
  }

  // SEI - Set Interrupt Disable
  SEI(): number {
    const result = this.addressing.implied();
    this.cpu.setFlag('I', true);
    return 2;
  }
}