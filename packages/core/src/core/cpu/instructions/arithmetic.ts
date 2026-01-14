import type { AddressingModes } from '../addressingModes.js';

export class ArithmeticInstructions {
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

  // ADC - Add with Carry
  ADC_IMM(): number {
    const result = this.addressing.immediate();
    const operand = result.value!;
    const sum = this.cpu.getA() + operand + (this.cpu.getFlag('C') ? 1 : 0);
    
    // 设置进位
    this.cpu.setFlag('C', sum > 0xFF);
    
    // 设置溢出 - 使用标准的6502溢出检测
    const a = this.cpu.getA();
    const overflow = ((a ^ operand) & 0x80) === 0 && ((a ^ sum) & 0x80) !== 0;
    this.cpu.setFlag('V', overflow);
    
    this.cpu.setA(sum & 0xFF);
    this.updateNZFlags(this.cpu.getA());
    
    return 2;
  }

  ADC_ZP(): number {
    const result = this.addressing.zeroPage();
    const operand = result.value!;
    const sum = this.cpu.getA() + operand + (this.cpu.getFlag('C') ? 1 : 0);
    
    this.cpu.setFlag('C', sum > 0xFF);
    
    const a = this.cpu.getA();
    const overflow = ((a ^ operand) & 0x80) === 0 && ((a ^ sum) & 0x80) !== 0;
    this.cpu.setFlag('V', overflow);
    
    this.cpu.setA(sum & 0xFF);
    this.updateNZFlags(this.cpu.getA());
    
    return 3;
  }

  ADC_ZPX(): number {
    const result = this.addressing.zeroPageX();
    const operand = result.value!;
    const sum = this.cpu.getA() + operand + (this.cpu.getFlag('C') ? 1 : 0);
    
    this.cpu.setFlag('C', sum > 0xFF);
    
    const a = this.cpu.getA();
    const overflow = ((a ^ operand) & 0x80) === 0 && ((a ^ sum) & 0x80) !== 0;
    this.cpu.setFlag('V', overflow);
    
    this.cpu.setA(sum & 0xFF);
    this.updateNZFlags(this.cpu.getA());
    
    return 4;
  }

  ADC_ABS(): number {
    const result = this.addressing.absolute();
    const operand = result.value!;
    const sum = this.cpu.getA() + operand + (this.cpu.getFlag('C') ? 1 : 0);
    
    this.cpu.setFlag('C', sum > 0xFF);
    
    const a = this.cpu.getA();
    const overflow = ((a ^ operand) & 0x80) === 0 && ((a ^ sum) & 0x80) !== 0;
    this.cpu.setFlag('V', overflow);
    
    this.cpu.setA(sum & 0xFF);
    this.updateNZFlags(this.cpu.getA());
    
    return 4;
  }

  ADC_ABSX(): number {
    const result = this.addressing.absoluteX();
    const operand = result.value!;
    const sum = this.cpu.getA() + operand + (this.cpu.getFlag('C') ? 1 : 0);
    
    this.cpu.setFlag('C', sum > 0xFF);
    
    const a = this.cpu.getA();
    const overflow = ((a ^ operand) & 0x80) === 0 && ((a ^ sum) & 0x80) !== 0;
    this.cpu.setFlag('V', overflow);
    
    this.cpu.setA(sum & 0xFF);
    this.updateNZFlags(this.cpu.getA());
    
    return 4 + result.cycles;
  }

  ADC_ABSY(): number {
    const result = this.addressing.absoluteY();
    const operand = result.value!;
    const sum = this.cpu.getA() + operand + (this.cpu.getFlag('C') ? 1 : 0);
    
    this.cpu.setFlag('C', sum > 0xFF);
    
    const a = this.cpu.getA();
    const overflow = ((a ^ operand) & 0x80) === 0 && ((a ^ sum) & 0x80) !== 0;
    this.cpu.setFlag('V', overflow);
    
    this.cpu.setA(sum & 0xFF);
    this.updateNZFlags(this.cpu.getA());
    
    return 4 + result.cycles;
  }

  ADC_INDX(): number {
    const result = this.addressing.indirectX();
    const operand = result.value!;
    const sum = this.cpu.getA() + operand + (this.cpu.getFlag('C') ? 1 : 0);
    
    this.cpu.setFlag('C', sum > 0xFF);
    
    const a = this.cpu.getA();
    const overflow = ((a ^ operand) & 0x80) === 0 && ((a ^ sum) & 0x80) !== 0;
    this.cpu.setFlag('V', overflow);
    
    this.cpu.setA(sum & 0xFF);
    this.updateNZFlags(this.cpu.getA());
    
    return 6;
  }

  ADC_INDY(): number {
    const result = this.addressing.indirectY();
    const operand = result.value!;
    const sum = this.cpu.getA() + operand + (this.cpu.getFlag('C') ? 1 : 0);
    
    this.cpu.setFlag('C', sum > 0xFF);
    
    const a = this.cpu.getA();
    const overflow = ((a ^ operand) & 0x80) === 0 && ((a ^ sum) & 0x80) !== 0;
    this.cpu.setFlag('V', overflow);
    
    this.cpu.setA(sum & 0xFF);
    this.updateNZFlags(this.cpu.getA());
    
    return 5 + result.cycles;
  }

  // SBC - Subtract with Carry
  SBC_IMM(): number {
    const result = this.addressing.immediate();
    const operand = result.value!;
    const a = this.cpu.getA();
    const carry = this.cpu.getFlag('C') ? 0 : 1;
    const diff = a - operand - carry;
    
    // 设置进位 (无借位时设置为1)
    this.cpu.setFlag('C', diff >= 0);
    
    // 设置溢出 - 使用正确的6502 SBC溢出检测
    // SBC = A + (~operand) + C，所以溢出检测应该看符号变化
    const overflow = ((a ^ diff) & 0x80) !== 0 && ((a ^ operand) & 0x80) !== 0;
    this.cpu.setFlag('V', overflow);
    
    this.cpu.setA(diff & 0xFF);
    this.updateNZFlags(this.cpu.getA());
    
    return 2;
  }

  // 比较指令
  CMP_IMM(): number {
    const result = this.addressing.immediate();
    const operand = result.value!;
    const diff = this.cpu.getA() - operand;
    
    this.cpu.setFlag('C', diff >= 0);
    this.updateNZFlags(diff);
    
    return 2;
  }

  CPX_IMM(): number {
    const result = this.addressing.immediate();
    const operand = result.value!;
    const diff = this.cpu.getX() - operand;
    
    this.cpu.setFlag('C', diff >= 0);
    const maskedDiff = diff & 0xFF;
    this.cpu.setFlag('Z', maskedDiff === 0);
    this.cpu.setFlag('N', (maskedDiff & 0x80) !== 0);
    
    return 2;
  }

  CPY_IMM(): number {
    const result = this.addressing.immediate();
    const operand = result.value!;
    const y = this.cpu.getY();
    
    // 对于比较指令，C表示 Y >= operand (无符号比较)
    this.cpu.setFlag('C', y >= operand);
    this.cpu.setFlag('Z', y === operand);
    // 负标志基于结果，但比较指令通常不设置N标志或基于特定逻辑
    // 对于6502 CPY，N标志基于(y - operand)结果的第7位
    const diff = y - operand;
    this.cpu.setFlag('N', ((diff & 0xFF) & 0x80) !== 0);
    
    return 2;
  }

  // SBC的其他寻址模式
  SBC_ZP(): number {
    const result = this.addressing.zeroPage();
    const operand = result.value!;
    const a = this.cpu.getA();
    const carry = this.cpu.getFlag('C') ? 0 : 1;
    const diff = a - operand - carry;
    
    this.cpu.setFlag('C', diff >= 0);
    
    const overflow = ((a ^ diff) & 0x80) !== 0 && ((a ^ operand) & 0x80) !== 0;
    this.cpu.setFlag('V', overflow);
    
    this.cpu.setA(diff & 0xFF);
    this.updateNZFlags(this.cpu.getA());
    
    return 3;
  }

  SBC_ZPX(): number {
    const result = this.addressing.zeroPageX();
    const operand = result.value!;
    const a = this.cpu.getA();
    const carry = this.cpu.getFlag('C') ? 0 : 1;
    const diff = a - operand - carry;
    
    this.cpu.setFlag('C', diff >= 0);
    
    const overflow = ((a ^ diff) & 0x80) !== 0 && ((a ^ operand) & 0x80) !== 0;
    this.cpu.setFlag('V', overflow);
    
    this.cpu.setA(diff & 0xFF);
    this.updateNZFlags(this.cpu.getA());
    
    return 4;
  }

  SBC_ABS(): number {
    const result = this.addressing.absolute();
    const operand = result.value!;
    const a = this.cpu.getA();
    const carry = this.cpu.getFlag('C') ? 0 : 1;
    const diff = a - operand - carry;
    
    this.cpu.setFlag('C', diff >= 0);
    
    const overflow = ((a ^ diff) & 0x80) !== 0 && ((a ^ operand) & 0x80) !== 0;
    this.cpu.setFlag('V', overflow);
    
    this.cpu.setA(diff & 0xFF);
    this.updateNZFlags(this.cpu.getA());
    
    return 4;
  }

  SBC_ABSX(): number {
    const result = this.addressing.absoluteX();
    const operand = result.value!;
    const a = this.cpu.getA();
    const carry = this.cpu.getFlag('C') ? 0 : 1;
    const diff = a - operand - carry;
    
    this.cpu.setFlag('C', diff >= 0);
    
    const overflow = ((a ^ diff) & 0x80) !== 0 && ((a ^ operand) & 0x80) !== 0;
    this.cpu.setFlag('V', overflow);
    
    this.cpu.setA(diff & 0xFF);
    this.updateNZFlags(this.cpu.getA());
    
    return 4 + result.cycles;
  }

  SBC_ABSY(): number {
    const result = this.addressing.absoluteY();
    const operand = result.value!;
    const a = this.cpu.getA();
    const carry = this.cpu.getFlag('C') ? 0 : 1;
    const diff = a - operand - carry;
    
    this.cpu.setFlag('C', diff >= 0);
    
    const overflow = ((a ^ diff) & 0x80) !== 0 && ((a ^ operand) & 0x80) !== 0;
    this.cpu.setFlag('V', overflow);
    
    this.cpu.setA(diff & 0xFF);
    this.updateNZFlags(this.cpu.getA());
    
    return 4 + result.cycles;
  }

  SBC_INDX(): number {
    const result = this.addressing.indirectX();
    const operand = result.value!;
    const a = this.cpu.getA();
    const carry = this.cpu.getFlag('C') ? 0 : 1;
    const diff = a - operand - carry;
    
    this.cpu.setFlag('C', diff >= 0);
    
    const overflow = ((a ^ diff) & 0x80) !== 0 && ((a ^ operand) & 0x80) !== 0;
    this.cpu.setFlag('V', overflow);
    
    this.cpu.setA(diff & 0xFF);
    this.updateNZFlags(this.cpu.getA());
    
    return 6;
  }

  SBC_INDY(): number {
    const result = this.addressing.indirectY();
    const operand = result.value!;
    const a = this.cpu.getA();
    const carry = this.cpu.getFlag('C') ? 0 : 1;
    const diff = a - operand - carry;
    
    this.cpu.setFlag('C', diff >= 0);
    
    const overflow = ((a ^ diff) & 0x80) !== 0 && ((a ^ operand) & 0x80) !== 0;
    this.cpu.setFlag('V', overflow);
    
    this.cpu.setA(diff & 0xFF);
    this.updateNZFlags(this.cpu.getA());
    
    return 5 + result.cycles;
  }

  // CMP的其他寻址模式
  CMP_ZP(): number {
    const result = this.addressing.zeroPage();
    const operand = result.value!;
    const diff = this.cpu.getA() - operand;
    
    this.cpu.setFlag('C', diff >= 0);
    this.updateNZFlags(diff);
    
    return 3;
  }

  CMP_ZPX(): number {
    const result = this.addressing.zeroPageX();
    const operand = result.value!;
    const diff = this.cpu.getA() - operand;
    
    this.cpu.setFlag('C', diff >= 0);
    this.updateNZFlags(diff);
    
    return 4;
  }

  CMP_ABS(): number {
    const result = this.addressing.absolute();
    const operand = result.value!;
    const diff = this.cpu.getA() - operand;
    
    this.cpu.setFlag('C', diff >= 0);
    this.updateNZFlags(diff);
    
    return 4;
  }

  CMP_ABSX(): number {
    const result = this.addressing.absoluteX();
    const operand = result.value!;
    const diff = this.cpu.getA() - operand;
    
    this.cpu.setFlag('C', diff >= 0);
    this.updateNZFlags(diff);
    
    return 4 + result.cycles;
  }

  CMP_ABSY(): number {
    const result = this.addressing.absoluteY();
    const operand = result.value!;
    const diff = this.cpu.getA() - operand;
    
    this.cpu.setFlag('C', diff >= 0);
    this.updateNZFlags(diff);
    
    return 4 + result.cycles;
  }

  CMP_INDX(): number {
    const result = this.addressing.indirectX();
    const operand = result.value!;
    const diff = this.cpu.getA() - operand;
    
    this.cpu.setFlag('C', diff >= 0);
    this.updateNZFlags(diff);
    
    return 6;
  }

  CMP_INDY(): number {
    const result = this.addressing.indirectY();
    const operand = result.value!;
    const diff = this.cpu.getA() - operand;
    
    this.cpu.setFlag('C', diff >= 0);
    this.updateNZFlags(diff);
    
    return 5 + result.cycles;
  }

  // CPX的其他寻址模式
  CPX_ZP(): number {
    const result = this.addressing.zeroPage();
    const operand = result.value!;
    const diff = this.cpu.getX() - operand;
    
    this.cpu.setFlag('C', diff >= 0);
    const maskedDiff = diff & 0xFF;
    this.cpu.setFlag('Z', maskedDiff === 0);
    this.cpu.setFlag('N', (maskedDiff & 0x80) !== 0);
    
    return 3;
  }

  CPX_ABS(): number {
    const result = this.addressing.absolute();
    const operand = result.value!;
    const diff = this.cpu.getX() - operand;
    
    this.cpu.setFlag('C', diff >= 0);
    const maskedDiff = diff & 0xFF;
    this.cpu.setFlag('Z', maskedDiff === 0);
    this.cpu.setFlag('N', (maskedDiff & 0x80) !== 0);
    
    return 4;
  }

  // CPY的其他寻址模式
  CPY_ZP(): number {
    const result = this.addressing.zeroPage();
    const operand = result.value!;
    const diff = this.cpu.getY() - operand;
    
    this.cpu.setFlag('C', diff >= 0);
    const maskedDiff = diff & 0xFF;
    this.cpu.setFlag('Z', maskedDiff === 0);
    this.cpu.setFlag('N', (maskedDiff & 0x80) !== 0);
    
    return 3;
  }

  CPY_ABS(): number {
    const result = this.addressing.absolute();
    const operand = result.value!;
    const diff = this.cpu.getY() - operand;
    
    this.cpu.setFlag('C', diff >= 0);
    const maskedDiff = diff & 0xFF;
    this.cpu.setFlag('Z', maskedDiff === 0);
    this.cpu.setFlag('N', (maskedDiff & 0x80) !== 0);
    
    return 4;
  }
}