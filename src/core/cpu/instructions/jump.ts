import type { AddressingModes } from '../addressingModes.js';

export class JumpInstructions {
  private cpu: any;
  private addressing: AddressingModes;

  constructor(cpu: any, addressing: AddressingModes) {
    this.cpu = cpu;
    this.addressing = addressing;
  }

  // JMP - Jump
  JMP_ABS(): number {
    const result = this.addressing.absolute();
    this.cpu.setPC(result.address);
    return 3;
  }

  JMP_IND(): number {
    const result = this.addressing.indirect();
    this.cpu.setPC(result.address);
    return 5;
  }

  // JSR - Jump to Subroutine
  JSR_ABS(): number {
    const currentPC = this.cpu.getPC();
    // 从PC读取目标地址 (PC此时指向地址低字节)
    const address = this.cpu.readWord(currentPC);
    // 压入返回地址：操作码地址 + 3
    this.cpu.push16((currentPC - 1) + 3); // 操作码地址 = currentPC - 1
    // 跳转到目标地址
    this.cpu.setPC(address);
    return 6;
  }

  // RTS - Return from Subroutine
  RTS(): number {
    const result = this.addressing.implied();
    const returnAddress = this.cpu.pop16();
    this.cpu.setPC(returnAddress); // JSR压入的地址就是正确的返回地址
    return 6;
  }

  // RTI - Return from Interrupt
  RTI(): number {
    const result = this.addressing.implied();
    const status = this.cpu.popByte();
    this.cpu.setStatusFlags(status & 0xEF); // 清除B标志
    const pc = this.cpu.pop16();
    this.cpu.setPC(pc);
    return 6;
  }
}