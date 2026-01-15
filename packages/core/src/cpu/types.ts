export interface CPURegisters {
  A: number;      // 累加器
  X: number;      // X寄存器
  Y: number;      // Y寄存器
  SP: number;     // 栈指针
  PC: number;     // 程序计数器
}

export interface CPUFlags {
  C: boolean;     // 进位标志
  Z: boolean;     // 零标志
  I: boolean;     // 中断禁用
  D: boolean;     // 十进制模式
  B: boolean;     // 中断标志
  V: boolean;     // 溢出标志
  N: boolean;     // 负数标志
}

export type AddressingMode = 
  | 'immediate' | 'zeroPage' | 'zeroPageX' | 'zeroPageY'
  | 'absolute' | 'absoluteX' | 'absoluteY' | 'indirect'
  | 'indirectX' | 'indirectY' | 'relative' | 'accumulator' | 'implied';

export interface InstructionInfo {
  mnemonic: string;
  mode: AddressingMode;
  cycles: number;
  size: number;
  func: () => number; // 返回实际执行周期数
}

export interface AddressingResult {
  address: number;    // 有效地址
  value?: number;      // 操作数值(如果有)
  crossedPage: boolean; // 是否跨页
  cycles: number;      // 寻址周期数
}