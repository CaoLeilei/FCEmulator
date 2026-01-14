import type { AddressingResult } from './types.js';

export class AddressingModes {
  private cpu: any; // CPU实例引用

  constructor(cpu: any) {
    this.cpu = cpu;
  }

  // 立即寻址 #$nn
  immediate(): AddressingResult {
    const address = this.cpu.getPC();
    const value = this.cpu.readByte(address);
    this.cpu.setPC(address + 1);
    
    return {
      address,
      value,
      crossedPage: false,
      cycles: 0 // 立即寻址不产生额外周期
    };
  }

  // 零页寻址 $nn
  zeroPage(): AddressingResult {
    const address = this.cpu.readByte(this.cpu.getPC());
    const value = this.cpu.readByte(address);
    this.cpu.setPC(this.cpu.getPC() + 1);
    
    return {
      address,
      value,
      crossedPage: false,
      cycles: 0
    };
  }

  // 零页X变址 $nn,X
  zeroPageX(): AddressingResult {
    const base = this.cpu.readByte(this.cpu.getPC());
    const address = (base + this.cpu.getX()) & 0xFF; // 零页回绕
    const value = this.cpu.readByte(address);
    this.cpu.setPC(this.cpu.getPC() + 1);
    
    return {
      address,
      value,
      crossedPage: false,
      cycles: 0
    };
  }

  // 零页Y变址 $nn,Y
  zeroPageY(): AddressingResult {
    const base = this.cpu.readByte(this.cpu.getPC());
    const address = (base + this.cpu.getY()) & 0xFF; // 零页回绕
    const value = this.cpu.readByte(address);
    this.cpu.setPC(this.cpu.getPC() + 1);
    
    return {
      address,
      value,
      crossedPage: false,
      cycles: 0
    };
  }

  // 绝对寻址 $nnnn
  absolute(): AddressingResult {
    const address = this.cpu.readWord(this.cpu.getPC());
    const value = this.cpu.readByte(address);
    this.cpu.setPC(this.cpu.getPC() + 2);
    
    return {
      address,
      value,
      crossedPage: false,
      cycles: 0
    };
  }

  // 绝对X变址 $nnnn,X
  absoluteX(): AddressingResult {
    const base = this.cpu.readWord(this.cpu.getPC());
    const address = base + this.cpu.getX();
    const value = this.cpu.readByte(address);
    const crossedPage = (base & 0xFF00) !== (address & 0xFF00);
    this.cpu.setPC(this.cpu.getPC() + 2);
    
    return {
      address,
      value,
      crossedPage,
      cycles: crossedPage ? 1 : 0 // 跨页额外周期
    };
  }

  // 绝对Y变址 $nnnn,Y
  absoluteY(): AddressingResult {
    const base = this.cpu.readWord(this.cpu.getPC());
    const address = base + this.cpu.getY();
    const value = this.cpu.readByte(address);
    const crossedPage = (base & 0xFF00) !== (address & 0xFF00);
    this.cpu.setPC(this.cpu.getPC() + 2);
    
    return {
      address,
      value,
      crossedPage,
      cycles: crossedPage ? 1 : 0 // 跨页额外周期
    };
  }

  // 间接寻址 ($nnnn) - JMP专用
  indirect(): AddressingResult {
    const indirectAddr = this.cpu.readWord(this.cpu.getPC());
    
    // 6502的间接寻址bug：如果间接地址的低位是0xFF，会跨页读取
    let effectiveAddr: number;
    if ((indirectAddr & 0x00FF) === 0x00FF) {
      // 模拟6502 bug
      const low = this.cpu.readByte(indirectAddr);
      const high = this.cpu.readByte(indirectAddr & 0xFF00); // 不增加高位
      effectiveAddr = (high << 8) | low;
    } else {
      effectiveAddr = this.cpu.readWord(indirectAddr);
    }
    
    this.cpu.setPC(this.cpu.getPC() + 2);
    
    return {
      address: effectiveAddr,
      crossedPage: false,
      cycles: 0
    };
  }

  // 间接X变址 ($nn,X)
  indirectX(): AddressingResult {
    const zeroPageAddr = this.cpu.readByte(this.cpu.getPC());
    const indirectAddr = (zeroPageAddr + this.cpu.getX()) & 0xFF;
    const effectiveAddr = this.cpu.readWord(indirectAddr);
    const value = this.cpu.readByte(effectiveAddr);
    this.cpu.setPC(this.cpu.getPC() + 1);
    
    return {
      address: effectiveAddr,
      value,
      crossedPage: false,
      cycles: 0
    };
  }

  // 间接Y变址 ($nn),Y
  indirectY(): AddressingResult {
    const zeroPageAddr = this.cpu.readByte(this.cpu.getPC());
    const base = this.cpu.readWord(zeroPageAddr);
    const effectiveAddr = base + this.cpu.getY();
    const value = this.cpu.readByte(effectiveAddr);
    const crossedPage = (base & 0xFF00) !== (effectiveAddr & 0xFF00);
    this.cpu.setPC(this.cpu.getPC() + 1);
    
    return {
      address: effectiveAddr,
      value,
      crossedPage,
      cycles: crossedPage ? 1 : 0 // 跨页额外周期
    };
  }

  // 相对寻址 - 分支指令专用
  relative(): AddressingResult {
    const currentPC = this.cpu.getPC(); // 此时PC指向偏移量
    const offset = this.cpu.readByte(currentPC);
    this.cpu.setPC(currentPC + 1); // PC指向下一条指令
    
    // 计算目标地址：当前PC+有符号偏移
    let targetAddress = this.cpu.getPC() + offset;
    
    // 处理有符号偏移
    if (offset >= 0x80) {
      targetAddress -= 0x100;
    }
    
    // 检查是否跨页
    const opcodePC = currentPC - 1;
    const crossedPage = (opcodePC & 0xFF00) !== (targetAddress & 0xFF00);
    
    return {
      address: targetAddress,
      crossedPage,
      cycles: crossedPage ? 2 : 1 // 分支周期：基础1+跨页额外1
    };
  }

  // 累加器寻址
  accumulator(): AddressingResult {
    return {
      address: 0, // 不使用地址
      value: this.cpu.getA(),
      crossedPage: false,
      cycles: 0
    };
  }

  // 隐含寻址
  implied(): AddressingResult {
    return {
      address: 0, // 不使用地址
      crossedPage: false,
      cycles: 0
    };
  }
}