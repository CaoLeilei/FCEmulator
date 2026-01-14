import type { AddressingModes } from '../addressingModes.js';

export class StackInstructions {
  private cpu: any;
  private addressing: AddressingModes;

  constructor(cpu: any, addressing: AddressingModes) {
    this.cpu = cpu;
    this.addressing = addressing;
  }

  // PHA - Push Accumulator
  PHA(): number {
    const result = this.addressing.implied();
    this.cpu.pushByte(this.cpu.getA());
    return 3;
  }

  // PHP - Push Processor Status
  PHP(): number {
    const result = this.addressing.implied();
    // PHP设置B标志(0x10)和保留位(0x20)
    this.cpu.pushByte(this.cpu.getStatusFlags() | 0x30);
    return 3;
  }

  // PLA - Pull Accumulator
  PLA(): number {
    const result = this.addressing.implied();
    const value = this.cpu.popByte();
    this.cpu.setA(value);
    
    // 更新标志位
    this.cpu.setFlag('Z', value === 0);
    this.cpu.setFlag('N', (value & 0x80) !== 0);
    
    return 4;
  }

  // PLP - Pull Processor Status
  PLP(): number {
    const result = this.addressing.implied();
    const status = this.cpu.popByte();
    this.cpu.setStatusFlags(status & 0xEF); // 清除B标志
    return 4;
  }
}