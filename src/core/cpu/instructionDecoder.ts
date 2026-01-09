import type { InstructionInfo } from './types.js';
import { AddressingModes } from './addressingModes.js';
import { BasicInstructions } from './instructions/basic.js';
import { TransferInstructions } from './instructions/transfer.js';
import { LoadInstructions } from './instructions/load.js';
import { StoreInstructions } from './instructions/store.js';
import { JumpInstructions } from './instructions/jump.js';
import { BranchInstructions } from './instructions/branch.js';
import { ArithmeticInstructions } from './instructions/arithmetic.js';
import { LogicInstructions } from './instructions/logic.js';
import { ShiftInstructions } from './instructions/shift.js';
import { StackInstructions } from './instructions/stack.js';
import { FlagInstructions } from './instructions/flags.js';

export class InstructionDecoder {
  private cpu: any;
  private addressing: AddressingModes;
  private basic: BasicInstructions;
  private transfer: TransferInstructions;
  private load: LoadInstructions;
  private store: StoreInstructions;
  private jump: JumpInstructions;
  private branch: BranchInstructions;
  private arithmetic: ArithmeticInstructions;
  private logic: LogicInstructions;
  private shift: ShiftInstructions;
  private stack: StackInstructions;
  private flags: FlagInstructions;

  constructor(cpu: any) {
    this.cpu = cpu;
    this.addressing = new AddressingModes(cpu);
    
    // 初始化指令实现类
    this.basic = new BasicInstructions(cpu, this.addressing);
    this.transfer = new TransferInstructions(cpu, this.addressing);
    this.load = new LoadInstructions(cpu, this.addressing);
    this.store = new StoreInstructions(cpu, this.addressing);
    this.jump = new JumpInstructions(cpu, this.addressing);
    this.branch = new BranchInstructions(cpu, this.addressing);
    this.arithmetic = new ArithmeticInstructions(cpu, this.addressing);
    this.logic = new LogicInstructions(cpu, this.addressing);
    this.shift = new ShiftInstructions(cpu, this.addressing);
    this.stack = new StackInstructions(cpu, this.addressing);
    this.flags = new FlagInstructions(cpu, this.addressing);
  }

  // 指令表
  private instructionTable: { [key: number]: InstructionInfo } = {
    // 基础指令
    0xEA: { mnemonic: 'NOP', mode: 'implied', cycles: 2, size: 1, func: () => this.basic.NOP() },
    0x00: { mnemonic: 'BRK', mode: 'implied', cycles: 7, size: 1, func: () => this.basic.BRK() },
    
    // 寄存器传送指令
    0xAA: { mnemonic: 'TAX', mode: 'implied', cycles: 2, size: 1, func: () => this.transfer.TAX() },
    0xA8: { mnemonic: 'TAY', mode: 'implied', cycles: 2, size: 1, func: () => this.transfer.TAY() },
    0x8A: { mnemonic: 'TXA', mode: 'implied', cycles: 2, size: 1, func: () => this.transfer.TXA() },
    0x98: { mnemonic: 'TYA', mode: 'implied', cycles: 2, size: 1, func: () => this.transfer.TYA() },
    0xBA: { mnemonic: 'TSX', mode: 'implied', cycles: 2, size: 1, func: () => this.transfer.TSX() },
    0x9A: { mnemonic: 'TXS', mode: 'implied', cycles: 2, size: 1, func: () => this.transfer.TXS() },
    
    // LDA指令
    0xA9: { mnemonic: 'LDA', mode: 'immediate', cycles: 2, size: 2, func: () => this.load.LDA_IMM() },
    0xA5: { mnemonic: 'LDA', mode: 'zeroPage', cycles: 3, size: 2, func: () => this.load.LDA_ZP() },
    0xB5: { mnemonic: 'LDA', mode: 'zeroPageX', cycles: 4, size: 2, func: () => this.load.LDA_ZPX() },
    0xAD: { mnemonic: 'LDA', mode: 'absolute', cycles: 4, size: 3, func: () => this.load.LDA_ABS() },
    0xBD: { mnemonic: 'LDA', mode: 'absoluteX', cycles: 4, size: 3, func: () => this.load.LDA_ABSX() },
    0xB9: { mnemonic: 'LDA', mode: 'absoluteY', cycles: 4, size: 3, func: () => this.load.LDA_ABSY() },
    0xA1: { mnemonic: 'LDA', mode: 'indirectX', cycles: 6, size: 2, func: () => this.load.LDA_INDX() },
    0xB1: { mnemonic: 'LDA', mode: 'indirectY', cycles: 5, size: 2, func: () => this.load.LDA_INDY() },
    
    // LDX指令
    0xA2: { mnemonic: 'LDX', mode: 'immediate', cycles: 2, size: 2, func: () => this.load.LDX_IMM() },
    0xA6: { mnemonic: 'LDX', mode: 'zeroPage', cycles: 3, size: 2, func: () => this.load.LDX_ZP() },
    0xB6: { mnemonic: 'LDX', mode: 'zeroPageY', cycles: 4, size: 2, func: () => this.load.LDX_ZPY() },
    0xAE: { mnemonic: 'LDX', mode: 'absolute', cycles: 4, size: 3, func: () => this.load.LDX_ABS() },
    0xBE: { mnemonic: 'LDX', mode: 'absoluteY', cycles: 4, size: 3, func: () => this.load.LDX_ABSY() },
    
    // LDY指令
    0xA0: { mnemonic: 'LDY', mode: 'immediate', cycles: 2, size: 2, func: () => this.load.LDY_IMM() },
    0xA4: { mnemonic: 'LDY', mode: 'zeroPage', cycles: 3, size: 2, func: () => this.load.LDY_ZP() },
    0xB4: { mnemonic: 'LDY', mode: 'zeroPageX', cycles: 4, size: 2, func: () => this.load.LDY_ZPX() },
    0xAC: { mnemonic: 'LDY', mode: 'absolute', cycles: 4, size: 3, func: () => this.load.LDY_ABS() },
    0xBC: { mnemonic: 'LDY', mode: 'absoluteX', cycles: 4, size: 3, func: () => this.load.LDY_ABSX() },
    
    // STA指令
    0x85: { mnemonic: 'STA', mode: 'zeroPage', cycles: 3, size: 2, func: () => this.store.STA_ZP() },
    0x95: { mnemonic: 'STA', mode: 'zeroPageX', cycles: 4, size: 2, func: () => this.store.STA_ZPX() },
    0x8D: { mnemonic: 'STA', mode: 'absolute', cycles: 4, size: 3, func: () => this.store.STA_ABS() },
    0x9D: { mnemonic: 'STA', mode: 'absoluteX', cycles: 5, size: 3, func: () => this.store.STA_ABSX() },
    0x99: { mnemonic: 'STA', mode: 'absoluteY', cycles: 5, size: 3, func: () => this.store.STA_ABSY() },
    0x81: { mnemonic: 'STA', mode: 'indirectX', cycles: 6, size: 2, func: () => this.store.STA_INDX() },
    0x91: { mnemonic: 'STA', mode: 'indirectY', cycles: 6, size: 2, func: () => this.store.STA_INDY() },
    
    // STX指令
    0x86: { mnemonic: 'STX', mode: 'zeroPage', cycles: 3, size: 2, func: () => this.store.STX_ZP() },
    0x96: { mnemonic: 'STX', mode: 'zeroPageY', cycles: 4, size: 2, func: () => this.store.STX_ZPY() },
    0x8E: { mnemonic: 'STX', mode: 'absolute', cycles: 4, size: 3, func: () => this.store.STX_ABS() },
    
    // STY指令
    0x84: { mnemonic: 'STY', mode: 'zeroPage', cycles: 3, size: 2, func: () => this.store.STY_ZP() },
    0x94: { mnemonic: 'STY', mode: 'zeroPageX', cycles: 4, size: 2, func: () => this.store.STY_ZPX() },
    0x8C: { mnemonic: 'STY', mode: 'absolute', cycles: 4, size: 3, func: () => this.store.STY_ABS() },
    
    // ADC指令
    0x69: { mnemonic: 'ADC', mode: 'immediate', cycles: 2, size: 2, func: () => this.arithmetic.ADC_IMM() },
    0x65: { mnemonic: 'ADC', mode: 'zeroPage', cycles: 3, size: 2, func: () => this.arithmetic.ADC_ZP() },
    0x75: { mnemonic: 'ADC', mode: 'zeroPageX', cycles: 4, size: 2, func: () => this.arithmetic.ADC_ZPX() },
    0x6D: { mnemonic: 'ADC', mode: 'absolute', cycles: 4, size: 3, func: () => this.arithmetic.ADC_ABS() },
    0x7D: { mnemonic: 'ADC', mode: 'absoluteX', cycles: 4, size: 3, func: () => this.arithmetic.ADC_ABSX() },
    0x79: { mnemonic: 'ADC', mode: 'absoluteY', cycles: 4, size: 3, func: () => this.arithmetic.ADC_ABSY() },
    0x61: { mnemonic: 'ADC', mode: 'indirectX', cycles: 6, size: 2, func: () => this.arithmetic.ADC_INDX() },
    0x71: { mnemonic: 'ADC', mode: 'indirectY', cycles: 5, size: 2, func: () => this.arithmetic.ADC_INDY() },
    
    // SBC指令
    0xE9: { mnemonic: 'SBC', mode: 'immediate', cycles: 2, size: 2, func: () => this.arithmetic.SBC_IMM() },
    0xE5: { mnemonic: 'SBC', mode: 'zeroPage', cycles: 3, size: 2, func: () => this.arithmetic.SBC_ZP() },
    0xF5: { mnemonic: 'SBC', mode: 'zeroPageX', cycles: 4, size: 2, func: () => this.arithmetic.SBC_ZPX() },
    0xED: { mnemonic: 'SBC', mode: 'absolute', cycles: 4, size: 3, func: () => this.arithmetic.SBC_ABS() },
    0xFD: { mnemonic: 'SBC', mode: 'absoluteX', cycles: 4, size: 3, func: () => this.arithmetic.SBC_ABSX() },
    0xF9: { mnemonic: 'SBC', mode: 'absoluteY', cycles: 4, size: 3, func: () => this.arithmetic.SBC_ABSY() },
    0xE1: { mnemonic: 'SBC', mode: 'indirectX', cycles: 6, size: 2, func: () => this.arithmetic.SBC_INDX() },
    0xF1: { mnemonic: 'SBC', mode: 'indirectY', cycles: 5, size: 2, func: () => this.arithmetic.SBC_INDY() },
    
    // 比较指令
    0xC9: { mnemonic: 'CMP', mode: 'immediate', cycles: 2, size: 2, func: () => this.arithmetic.CMP_IMM() },
    0xC5: { mnemonic: 'CMP', mode: 'zeroPage', cycles: 3, size: 2, func: () => this.arithmetic.CMP_ZP() },
    0xD5: { mnemonic: 'CMP', mode: 'zeroPageX', cycles: 4, size: 2, func: () => this.arithmetic.CMP_ZPX() },
    0xCD: { mnemonic: 'CMP', mode: 'absolute', cycles: 4, size: 3, func: () => this.arithmetic.CMP_ABS() },
    0xDD: { mnemonic: 'CMP', mode: 'absoluteX', cycles: 4, size: 3, func: () => this.arithmetic.CMP_ABSX() },
    0xD9: { mnemonic: 'CMP', mode: 'absoluteY', cycles: 4, size: 3, func: () => this.arithmetic.CMP_ABSY() },
    0xC1: { mnemonic: 'CMP', mode: 'indirectX', cycles: 6, size: 2, func: () => this.arithmetic.CMP_INDX() },
    0xD1: { mnemonic: 'CMP', mode: 'indirectY', cycles: 5, size: 2, func: () => this.arithmetic.CMP_INDY() },
    
    0xE0: { mnemonic: 'CPX', mode: 'immediate', cycles: 2, size: 2, func: () => this.arithmetic.CPX_IMM() },
    0xE4: { mnemonic: 'CPX', mode: 'zeroPage', cycles: 3, size: 2, func: () => this.arithmetic.CPX_ZP() },
    0xEC: { mnemonic: 'CPX', mode: 'absolute', cycles: 4, size: 3, func: () => this.arithmetic.CPX_ABS() },
    
    0xC0: { mnemonic: 'CPY', mode: 'immediate', cycles: 2, size: 2, func: () => this.arithmetic.CPY_IMM() },
    0xC4: { mnemonic: 'CPY', mode: 'zeroPage', cycles: 3, size: 2, func: () => this.arithmetic.CPY_ZP() },
    0xCC: { mnemonic: 'CPY', mode: 'absolute', cycles: 4, size: 3, func: () => this.arithmetic.CPY_ABS() },
    
    // AND指令
    0x29: { mnemonic: 'AND', mode: 'immediate', cycles: 2, size: 2, func: () => this.logic.AND_IMM() },
    0x25: { mnemonic: 'AND', mode: 'zeroPage', cycles: 3, size: 2, func: () => this.logic.AND_ZP() },
    0x35: { mnemonic: 'AND', mode: 'zeroPageX', cycles: 4, size: 2, func: () => this.logic.AND_ZPX() },
    0x2D: { mnemonic: 'AND', mode: 'absolute', cycles: 4, size: 3, func: () => this.logic.AND_ABS() },
    0x3D: { mnemonic: 'AND', mode: 'absoluteX', cycles: 4, size: 3, func: () => this.logic.AND_ABSX() },
    0x39: { mnemonic: 'AND', mode: 'absoluteY', cycles: 4, size: 3, func: () => this.logic.AND_ABSY() },
    0x21: { mnemonic: 'AND', mode: 'indirectX', cycles: 6, size: 2, func: () => this.logic.AND_INDX() },
    0x31: { mnemonic: 'AND', mode: 'indirectY', cycles: 5, size: 2, func: () => this.logic.AND_INDY() },
    
    // ORA指令
    0x09: { mnemonic: 'ORA', mode: 'immediate', cycles: 2, size: 2, func: () => this.logic.ORA_IMM() },
    0x05: { mnemonic: 'ORA', mode: 'zeroPage', cycles: 3, size: 2, func: () => this.logic.ORA_ZP() },
    0x15: { mnemonic: 'ORA', mode: 'zeroPageX', cycles: 4, size: 2, func: () => this.logic.ORA_ZPX() },
    0x0D: { mnemonic: 'ORA', mode: 'absolute', cycles: 4, size: 3, func: () => this.logic.ORA_ABS() },
    0x1D: { mnemonic: 'ORA', mode: 'absoluteX', cycles: 4, size: 3, func: () => this.logic.ORA_ABSX() },
    0x19: { mnemonic: 'ORA', mode: 'absoluteY', cycles: 4, size: 3, func: () => this.logic.ORA_ABSY() },
    0x01: { mnemonic: 'ORA', mode: 'indirectX', cycles: 6, size: 2, func: () => this.logic.ORA_INDX() },
    0x11: { mnemonic: 'ORA', mode: 'indirectY', cycles: 5, size: 2, func: () => this.logic.ORA_INDY() },
    
    // EOR指令
    0x49: { mnemonic: 'EOR', mode: 'immediate', cycles: 2, size: 2, func: () => this.logic.EOR_IMM() },
    0x45: { mnemonic: 'EOR', mode: 'zeroPage', cycles: 3, size: 2, func: () => this.logic.EOR_ZP() },
    0x55: { mnemonic: 'EOR', mode: 'zeroPageX', cycles: 4, size: 2, func: () => this.logic.EOR_ZPX() },
    0x4D: { mnemonic: 'EOR', mode: 'absolute', cycles: 4, size: 3, func: () => this.logic.EOR_ABS() },
    0x5D: { mnemonic: 'EOR', mode: 'absoluteX', cycles: 4, size: 3, func: () => this.logic.EOR_ABSX() },
    0x59: { mnemonic: 'EOR', mode: 'absoluteY', cycles: 4, size: 3, func: () => this.logic.EOR_ABSY() },
    0x41: { mnemonic: 'EOR', mode: 'indirectX', cycles: 6, size: 2, func: () => this.logic.EOR_INDX() },
    0x51: { mnemonic: 'EOR', mode: 'indirectY', cycles: 5, size: 2, func: () => this.logic.EOR_INDY() },
    
    // BIT指令
    0x24: { mnemonic: 'BIT', mode: 'zeroPage', cycles: 3, size: 2, func: () => this.logic.BIT_ZP() },
    0x2C: { mnemonic: 'BIT', mode: 'absolute', cycles: 4, size: 3, func: () => this.logic.BIT_ABS() },
    
    // 跳转指令
    0x4C: { mnemonic: 'JMP', mode: 'absolute', cycles: 3, size: 3, func: () => this.jump.JMP_ABS() },
    0x6C: { mnemonic: 'JMP', mode: 'indirect', cycles: 5, size: 3, func: () => this.jump.JMP_IND() },
    0x20: { mnemonic: 'JSR', mode: 'absolute', cycles: 6, size: 3, func: () => this.jump.JSR_ABS() },
    0x60: { mnemonic: 'RTS', mode: 'implied', cycles: 6, size: 1, func: () => this.jump.RTS() },
    0x40: { mnemonic: 'RTI', mode: 'implied', cycles: 6, size: 1, func: () => this.jump.RTI() },
    
    // 分支指令
    0x90: { mnemonic: 'BCC', mode: 'relative', cycles: 2, size: 2, func: () => this.branch.BCC() },
    0xB0: { mnemonic: 'BCS', mode: 'relative', cycles: 2, size: 2, func: () => this.branch.BCS() },
    0xF0: { mnemonic: 'BEQ', mode: 'relative', cycles: 2, size: 2, func: () => this.branch.BEQ() },
    0x30: { mnemonic: 'BMI', mode: 'relative', cycles: 2, size: 2, func: () => this.branch.BMI() },
    0xD0: { mnemonic: 'BNE', mode: 'relative', cycles: 2, size: 2, func: () => this.branch.BNE() },
    0x10: { mnemonic: 'BPL', mode: 'relative', cycles: 2, size: 2, func: () => this.branch.BPL() },
    0x50: { mnemonic: 'BVC', mode: 'relative', cycles: 2, size: 2, func: () => this.branch.BVC() },
    0x70: { mnemonic: 'BVS', mode: 'relative', cycles: 2, size: 2, func: () => this.branch.BVS() },
    
    // 移位指令
    0x0A: { mnemonic: 'ASL', mode: 'accumulator', cycles: 2, size: 1, func: () => this.shift.ASL_ACC() },
    0x06: { mnemonic: 'ASL', mode: 'zeroPage', cycles: 5, size: 2, func: () => this.shift.ASL_ZP() },
    0x16: { mnemonic: 'ASL', mode: 'zeroPageX', cycles: 6, size: 2, func: () => this.shift.ASL_ZPX() },
    0x0E: { mnemonic: 'ASL', mode: 'absolute', cycles: 6, size: 3, func: () => this.shift.ASL_ABS() },
    0x1E: { mnemonic: 'ASL', mode: 'absoluteX', cycles: 7, size: 3, func: () => this.shift.ASL_ABSX() },
    
    0x4A: { mnemonic: 'LSR', mode: 'accumulator', cycles: 2, size: 1, func: () => this.shift.LSR_ACC() },
    0x46: { mnemonic: 'LSR', mode: 'zeroPage', cycles: 5, size: 2, func: () => this.shift.LSR_ZP() },
    0x56: { mnemonic: 'LSR', mode: 'zeroPageX', cycles: 6, size: 2, func: () => this.shift.LSR_ZPX() },
    0x4E: { mnemonic: 'LSR', mode: 'absolute', cycles: 6, size: 3, func: () => this.shift.LSR_ABS() },
    0x5E: { mnemonic: 'LSR', mode: 'absoluteX', cycles: 7, size: 3, func: () => this.shift.LSR_ABSX() },
    
    0x2A: { mnemonic: 'ROL', mode: 'accumulator', cycles: 2, size: 1, func: () => this.shift.ROL_ACC() },
    0x26: { mnemonic: 'ROL', mode: 'zeroPage', cycles: 5, size: 2, func: () => this.shift.ROL_ZP() },
    0x36: { mnemonic: 'ROL', mode: 'zeroPageX', cycles: 6, size: 2, func: () => this.shift.ROL_ZPX() },
    0x2E: { mnemonic: 'ROL', mode: 'absolute', cycles: 6, size: 3, func: () => this.shift.ROL_ABS() },
    0x3E: { mnemonic: 'ROL', mode: 'absoluteX', cycles: 7, size: 3, func: () => this.shift.ROL_ABSX() },
    
    0x6A: { mnemonic: 'ROR', mode: 'accumulator', cycles: 2, size: 1, func: () => this.shift.ROR_ACC() },
    0x66: { mnemonic: 'ROR', mode: 'zeroPage', cycles: 5, size: 2, func: () => this.shift.ROR_ZP() },
    0x76: { mnemonic: 'ROR', mode: 'zeroPageX', cycles: 6, size: 2, func: () => this.shift.ROR_ZPX() },
    0x6E: { mnemonic: 'ROR', mode: 'absolute', cycles: 6, size: 3, func: () => this.shift.ROR_ABS() },
    0x7E: { mnemonic: 'ROR', mode: 'absoluteX', cycles: 7, size: 3, func: () => this.shift.ROR_ABSX() },
    
    // 栈指令
    0x48: { mnemonic: 'PHA', mode: 'implied', cycles: 3, size: 1, func: () => this.stack.PHA() },
    0x08: { mnemonic: 'PHP', mode: 'implied', cycles: 3, size: 1, func: () => this.stack.PHP() },
    0x68: { mnemonic: 'PLA', mode: 'implied', cycles: 4, size: 1, func: () => this.stack.PLA() },
    0x28: { mnemonic: 'PLP', mode: 'implied', cycles: 4, size: 1, func: () => this.stack.PLP() },
    
    // 标志位指令
    0x18: { mnemonic: 'CLC', mode: 'implied', cycles: 2, size: 1, func: () => this.flags.CLC() },
    0xD8: { mnemonic: 'CLD', mode: 'implied', cycles: 2, size: 1, func: () => this.flags.CLD() },
    0x58: { mnemonic: 'CLI', mode: 'implied', cycles: 2, size: 1, func: () => this.flags.CLI() },
    0xB8: { mnemonic: 'CLV', mode: 'implied', cycles: 2, size: 1, func: () => this.flags.CLV() },
    0x38: { mnemonic: 'SEC', mode: 'implied', cycles: 2, size: 1, func: () => this.flags.SEC() },
    0xF8: { mnemonic: 'SED', mode: 'implied', cycles: 2, size: 1, func: () => this.flags.SED() },
    0x78: { mnemonic: 'SEI', mode: 'implied', cycles: 2, size: 1, func: () => this.flags.SEI() },
    
    // INC/DEC指令 (包含在shift类中)
    0xE6: { mnemonic: 'INC', mode: 'zeroPage', cycles: 5, size: 2, func: () => this.shift.INC_ZP() },
    0xF6: { mnemonic: 'INC', mode: 'zeroPageX', cycles: 6, size: 2, func: () => this.shift.INC_ZPX() },
    0xEE: { mnemonic: 'INC', mode: 'absolute', cycles: 6, size: 3, func: () => this.shift.INC_ABS() },
    0xFE: { mnemonic: 'INC', mode: 'absoluteX', cycles: 7, size: 3, func: () => this.shift.INC_ABSX() },
    
    0xC6: { mnemonic: 'DEC', mode: 'zeroPage', cycles: 5, size: 2, func: () => this.shift.DEC_ZP() },
    0xD6: { mnemonic: 'DEC', mode: 'zeroPageX', cycles: 6, size: 2, func: () => this.shift.DEC_ZPX() },
    0xCE: { mnemonic: 'DEC', mode: 'absolute', cycles: 6, size: 3, func: () => this.shift.DEC_ABS() },
    0xDE: { mnemonic: 'DEC', mode: 'absoluteX', cycles: 7, size: 3, func: () => this.shift.DEC_ABSX() },
    
    // INX/INY指令 (包含在shift类中)
    0xE8: { mnemonic: 'INX', mode: 'implied', cycles: 2, size: 1, func: () => this.shift.INX() },
    0xC8: { mnemonic: 'INY', mode: 'implied', cycles: 2, size: 1, func: () => this.shift.INY() },
    
    // DEX/DEY指令 (包含在shift类中)
    0xCA: { mnemonic: 'DEX', mode: 'implied', cycles: 2, size: 1, func: () => this.shift.DEX() },
    0x88: { mnemonic: 'DEY', mode: 'implied', cycles: 2, size: 1, func: () => this.shift.DEY() },
  };

  // 执行指令
  executeOpcode(opcode: number): number {
    const instruction = this.instructionTable[opcode];
    
    if (!instruction) {
      console.warn(`未实现的操作码: 0x${opcode.toString(16).toUpperCase().padStart(2, '0')}`);
      return 2; // 默认2个周期
    }
    
    try {
      return instruction.func();
    } catch (error) {
      console.error(`执行指令 ${instruction.mnemonic} 时出错:`, error);
      return instruction.cycles;
    }
  }

  // 获取指令信息
  getInstructionInfo(opcode: number): InstructionInfo | null {
    return this.instructionTable[opcode] || null;
  }

  // 获取指令助记符
  getMnemonic(opcode: number): string {
    const info = this.getInstructionInfo(opcode);
    return info ? info.mnemonic : '???';
  }

  // 检查指令是否已实现
  isImplemented(opcode: number): boolean {
    return opcode in this.instructionTable;
  }

  // 获取已实现指令数量
  getImplementedCount(): number {
    return Object.keys(this.instructionTable).length;
  }
}