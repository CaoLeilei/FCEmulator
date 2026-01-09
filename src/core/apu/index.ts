/**
 * APU (Audio Processing Unit) 音频处理器
 * 负责 FC 的声音生成和输出
 */

export class APU {
  // 脉冲波通道
  private pulse1 = new PulseChannel(true);   // 脉冲通道 1
  private pulse2 = new PulseChannel(false);  // 脉冲通道 2
  
  // 三角波通道
  private triangle = new TriangleChannel();
  
  // 噪声通道
  private noise = new NoiseChannel();
  
  // DMC 通道
  private dmc = new DMCChannel();
  
  // APU 寄存器状态
  private frameCounter: number = 0;
  private framePeriod: number = 4;
  private frameIrq: boolean = false;
  private frameIRQPending: boolean = false;
  
  private cycle: number = 0;
  
  constructor() {
    this.reset();
  }

  /**
   * 重置 APU 状态
   */
  reset(): void {
    this.pulse1.reset();
    this.pulse2.reset();
    this.triangle.reset();
    this.noise.reset();
    this.dmc.reset();
    
    this.frameCounter = 0;
    this.framePeriod = 4;
    this.frameIrq = false;
    this.frameIRQPending = false;
    
    this.cycle = 0;
  }

  /**
   * 执行一个 APU 周期
   */
  step(): void {
    this.cycle++;
    
    // 半帧时钟 (每 7457.5 个 CPU 周期)
    if (this.cycle % 7457 === 0) {
      this.halfFrameClock();
    }
    
    // 四分之一帧时钟
    if (this.cycle % 3728 === 0) {
      this.quarterFrameClock();
    }
    
    // 更新各通道
    this.pulse1.step();
    this.pulse2.step();
    this.triangle.step();
    this.noise.step();
    this.dmc.step();
  }

  /**
   * 写入寄存器
   */
  writeRegister(address: number, value: number): void {
    value &= 0xFF;
    
    switch (address) {
      case 0x4000: // 脉冲通道 1 控制寄存器
        this.pulse1.writeControl(value);
        break;
        
      case 0x4001: // 脉冲通道 1 扫描/禁止
        this.pulse1.writeSweep(value);
        break;
        
      case 0x4002: // 脉冲通道 1 定时器低字节
        this.pulse1.writeTimerLow(value);
        break;
        
      case 0x4003: // 脉冲通道 1 定时器高字节/长度计数器
        this.pulse1.writeTimerHigh(value);
        break;
        
      case 0x4004: // 脉冲通道 2 控制寄存器
        this.pulse2.writeControl(value);
        break;
        
      case 0x4005: // 脉冲通道 2 扫描/禁止
        this.pulse2.writeSweep(value);
        break;
        
      case 0x4006: // 脉冲通道 2 定时器低字节
        this.pulse2.writeTimerLow(value);
        break;
        
      case 0x4007: // 脉冲通道 2 定时器高字节/长度计数器
        this.pulse2.writeTimerHigh(value);
        break;
        
      case 0x4008: // 三角波通道线性计数器
        this.triangle.writeLinearCounter(value);
        break;
        
      case 0x4009: // 三角波通道 (未使用)
        break;
        
      case 0x400A: // 三角波通道定时器低字节
        this.triangle.writeTimerLow(value);
        break;
        
      case 0x400B: // 三角波通道定时器高字节/长度计数器
        this.triangle.writeTimerHigh(value);
        break;
        
      case 0x400C: // 噪声通道控制寄存器
        this.noise.writeControl(value);
        break;
        
      case 0x400D: // 噪声通道 (未使用)
        break;
        
      case 0x400E: // 噪声通道定时器/噪声模式
        this.noise.writePeriod(value);
        break;
        
      case 0x400F: // 噪声通道长度计数器
        this.noise.writeLength(value);
        break;
        
      case 0x4010: // DMC 通道控制寄存器
        this.dmc.writeControl(value);
        break;
        
      case 0x4011: // DMC 通道直接负载
        this.dmc.writeDirect(value);
        break;
        
      case 0x4012: // DMC 通道样本地址
        this.dmc.writeAddress(value);
        break;
        
      case 0x4013: // DMC 通道样本长度
        this.dmc.writeLength(value);
        break;
        
      case 0x4015: // 通道状态
        this.writeStatus(value);
        break;
        
      case 0x4017: // 帧计数器
        this.writeFrameCounter(value);
        break;
    }
  }

  /**
   * 读取状态寄存器
   */
  readStatus(): number {
    let status = 0;
    
    if (this.pulse1.getLengthCounter() > 0) status |= 0x01;
    if (this.pulse2.getLengthCounter() > 0) status |= 0x02;
    if (this.triangle.getLengthCounter() > 0) status |= 0x04;
    if (this.noise.getLengthCounter() > 0) status |= 0x08;
    if (this.dmc.isActive()) status |= 0x10;
    
    if (this.frameIRQPending) {
      status |= 0x40;
      this.frameIRQPending = false;
    }
    
    return status;
  }

  /**
   * 写入通道状态寄存器
   */
  private writeStatus(value: number): void {
    this.pulse1.setEnabled(!(value & 0x01));
    this.pulse2.setEnabled(!(value & 0x02));
    this.triangle.setEnabled(!(value & 0x04));
    this.noise.setEnabled(!(value & 0x08));
    
    if (value & 0x10) {
      this.dmc.setEnabled(true);
    } else {
      this.dmc.setEnabled(false);
      this.dmc.interrupt = false;
    }
  }

  /**
   * 写入帧计数器寄存器
   */
  private writeFrameCounter(value: number): void {
    this.framePeriod = (value & 0x80) ? 5 : 4;
    this.frameIrq = !(value & 0x40);
    
    if (value & 0x80) {
      // 立即执行 quarter/half frame 时钟
      this.quarterFrameClock();
      this.halfFrameClock();
    }
    
    this.frameIRQPending = false;
  }

  /**
   * 四分之一帧时钟
   */
  private quarterFrameClock(): void {
    this.pulse1.envelopeClock();
    this.pulse2.envelopeClock();
    this.triangle.linearCounterClock();
    this.noise.envelopeClock();
  }

  /**
   * 半帧时钟
   */
  private halfFrameClock(): void {
    this.pulse1.lengthClock();
    this.pulse1.sweepClock();
    this.pulse2.lengthClock();
    this.pulse2.sweepClock();
    this.triangle.lengthClock();
    this.noise.lengthClock();
    
    // 帧中断
    if (this.frameIrq && this.framePeriod === 4) {
      this.frameIRQPending = true;
    }
  }

  /**
   * 生成音频样本
   */
  generateSample(): number {
    // 混合所有通道的输出
    const pulseOut = 0.00752 * (this.pulse1.output() + this.pulse2.output());
    const tndOut = 0.00851 * this.triangle.output() + 
                  0.00494 * this.noise.output() + 
                  0.00335 * this.dmc.output();
    
    return pulseOut + tndOut;
  }

  /**
   * 检查是否有 IRQ 请求
   */
  pollIRQ(): boolean {
    return this.frameIRQPending || this.dmc.interrupt;
  }

  // 调试信息
  getState() {
    return {
      cycle: this.cycle,
      frameCounter: this.frameCounter,
      framePeriod: this.framePeriod,
      frameIrq: this.frameIrq,
      frameIRQPending: this.frameIRQPending,
      pulse1: this.pulse1.getState(),
      pulse2: this.pulse2.getState(),
      triangle: this.triangle.getState(),
      noise: this.noise.getState(),
      dmc: this.dmc.getState()
    };
  }
}

/**
 * 脉冲波通道
 */
class PulseChannel {
  private enabled: boolean = false;
  private duty: number = 0;
  private lengthCounter: number = 0;
  private timer: number = 0;
  private period: number = 0;
  private envelope: Envelope = new Envelope();
  private sweep: Sweep = new Sweep();
  private channel: number; // 0 或 1

  constructor(isChannel1: boolean) {
    this.channel = isChannel1 ? 0 : 1;
  }

  reset(): void {
    this.enabled = false;
    this.duty = 0;
    this.lengthCounter = 0;
    this.timer = 0;
    this.period = 0;
    this.envelope.reset();
    this.sweep.reset();
  }

  writeControl(value: number): void {
    this.duty = (value >> 6) & 0x03;
    this.lengthCounter = this.lengthTable[(value >> 5) & 0x1F];
    this.envelope.writeControl(value);
  }

  writeSweep(value: number): void {
    this.sweep.writeControl(value, this.period);
  }

  writeTimerLow(value: number): void {
    this.period = (this.period & 0xFF00) | value;
  }

  writeTimerHigh(value: number): void {
    this.period = (this.period & 0x00FF) | ((value & 0x07) << 8);
    if (this.lengthCounter === 0 && this.enabled) {
      this.lengthCounter = this.lengthTable[(value >> 3) & 0x1F];
    }
    this.envelope.restart();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.lengthCounter = 0;
    }
  }

  step(): void {
    if (this.timer === 0) {
      this.timer = this.period;
    } else {
      this.timer--;
    }
  }

  envelopeClock(): void {
    this.envelope.clock();
  }

  sweepClock(): void {
    this.sweep.clock(this.channel === 0, this.period);
  }

  lengthClock(): void {
    if (this.lengthCounter > 0 && !this.lengthHalt()) {
      this.lengthCounter--;
    }
  }

  output(): number {
    if (this.lengthCounter === 0 || this.period < 8 || this.sweep.mute) {
      return 0;
    }
    
    const dutyTable = [
      [0, 0, 0, 0, 0, 0, 0, 1],
      [0, 0, 0, 0, 0, 0, 1, 1],
      [0, 0, 0, 0, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 0, 0]
    ];
    
    const sequence = dutyTable[this.duty][((this.timer) >> 1) & 0x07];
    return sequence ? this.envelope.output() : 0;
  }

  private lengthHalt(): boolean {
    return false; // TODO: implement loop check
  }

  getEnvelopeLoop(): boolean {
    return false; // TODO: implement loop check
  }

  getLengthCounter(): number {
    return this.lengthCounter;
  }

  getState() {
    return {
      enabled: this.enabled,
      duty: this.duty,
      lengthCounter: this.lengthCounter,
      timer: this.timer,
      period: this.period,
      envelope: this.envelope.getState(),
      sweep: this.sweep.getState()
    };
  }

  private readonly lengthTable = [
    10, 254, 20, 2, 40, 4, 80, 6, 160, 8, 60, 10, 14, 12, 26, 14,
    12, 16, 24, 18, 48, 20, 96, 22, 192, 24, 72, 26, 16, 28, 32, 30
  ];
}

/**
 * 包络发生器
 */
class Envelope {
  private start: boolean = false;
  private decay: boolean = false;
  private loop: boolean = false;
  private divider: number = 0;
  private counter: number = 0;
  private volume: number = 0;

  reset(): void {
    this.start = false;
    this.decay = false;
    this.loop = false;
    this.divider = 0;
    this.counter = 0;
    this.volume = 0;
  }

  writeControl(value: number): void {
    this.decay = !(value & 0x10);
    this.loop = !!(value & 0x20);
    this.divider = value & 0x0F;
    this.volume = value & 0x0F;
  }

  clock(): void {
    if (this.start) {
      this.start = false;
      this.counter = 15;
    } else if (this.divider === 0) {
      this.divider = this.divider;
      if (this.counter > 0) {
        this.counter--;
      } else if (this.loop) {
        this.counter = 15;
      }
    } else {
      this.divider--;
    }
  }

  restart(): void {
    this.start = true;
  }

  output(): number {
    if (this.decay) {
      return this.counter;
    } else {
      return this.divider;
    }
  }

  getState() {
    return {
      start: this.start,
      decay: this.decay,
      loop: this.loop,
      divider: this.divider,
      counter: this.counter,
      volume: this.volume
    };
  }
}

/**
 * 扫描单元
 */
class Sweep {
  private enabled: boolean = false;
  private period: number = 0;
  private negate: boolean = false;
  private shift: number = 0;
  private divider: number = 0;
  public mute: boolean = false;

  reset(): void {
    this.enabled = false;
    this.period = 0;
    this.negate = false;
    this.shift = 0;
    this.divider = 0;
    this.mute = false;
  }

  writeControl(value: number, currentPeriod: number): void {
    this.enabled = !!(value & 0x80);
    this.period = (value >> 4) & 0x07;
    this.negate = !!(value & 0x08);
    this.shift = value & 0x07;
    this.mute = currentPeriod < 8;
  }

  clock(_isPulse1: boolean, currentPeriod: number): void {
    if (this.divider === 0) {
      this.divider = this.period;
      if (this.enabled && this.shift > 0 && !this.mute) {
        // TODO: 实现扫描算法
      }
    } else {
      this.divider--;
    }
  }

  getState() {
    return {
      enabled: this.enabled,
      period: this.period,
      negate: this.negate,
      shift: this.shift,
      divider: this.divider,
      mute: this.mute
    };
  }
}

/**
 * 三角波通道
 */
class TriangleChannel {
  private enabled: boolean = false;
  private lengthCounter: number = 0;
  private linearCounter: number = 0;
  private linearCounterReload: boolean = false;
  private linearCounterPeriod: number = 0;
  private timer: number = 0;
  private period: number = 0;

  reset(): void {
    this.enabled = false;
    this.lengthCounter = 0;
    this.linearCounter = 0;
    this.linearCounterReload = false;
    this.linearCounterPeriod = 0;
    this.timer = 0;
    this.period = 0;
  }

  writeLinearCounter(value: number): void {
    this.linearCounterPeriod = value & 0x7F;
    this.linearCounterReload = !!(value & 0x80);
  }

  writeTimerLow(value: number): void {
    this.period = (this.period & 0xFF00) | value;
  }

  writeTimerHigh(value: number): void {
    this.period = (this.period & 0x00FF) | ((value & 0x07) << 8);
    this.linearCounterReload = true;
    if (this.lengthCounter === 0 && this.enabled) {
      this.lengthCounter = this.lengthTable[(value >> 3) & 0x1F];
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.lengthCounter = 0;
    }
  }

  step(): void {
    if (this.timer === 0) {
      this.timer = this.period;
    } else {
      this.timer--;
    }
  }

  linearCounterClock(): void {
    if (this.linearCounterReload) {
      this.linearCounter = this.linearCounterPeriod;
    } else if (this.linearCounter > 0) {
      this.linearCounter--;
    }
    
    if (!this.linearCounterReload) {
      this.linearCounterReload = false;
    }
  }

  lengthClock(): void {
    if (this.lengthCounter > 0 && !this.linearCounterReload) {
      this.lengthCounter--;
    }
  }

  output(): number {
    if (this.lengthCounter === 0 || this.linearCounter === 0 || this.period < 3) {
      return 0;
    }
    
    const triangleSequence = [
      15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0,
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15
    ];
    
    return triangleSequence[this.timer & 0x1F];
  }

  getLengthCounter(): number {
    return this.lengthCounter;
  }

  getState() {
    return {
      enabled: this.enabled,
      lengthCounter: this.lengthCounter,
      linearCounter: this.linearCounter,
      linearCounterReload: this.linearCounterReload,
      linearCounterPeriod: this.linearCounterPeriod,
      timer: this.timer,
      period: this.period
    };
  }

  private readonly lengthTable = [
    10, 254, 20, 2, 40, 4, 80, 6, 160, 8, 60, 10, 14, 12, 26, 14,
    12, 16, 24, 18, 48, 20, 96, 22, 192, 24, 72, 26, 16, 28, 32, 30
  ];
}

/**
 * 噪声通道
 */
class NoiseChannel {
  private enabled: boolean = false;
  private lengthCounter: number = 0;
  private timer: number = 0;
  private period: number = 0;
  private mode: boolean = false; // false = 长模式, true = 短模式
  private envelope: Envelope = new Envelope();
  private shiftRegister: number = 1;

  reset(): void {
    this.enabled = false;
    this.lengthCounter = 0;
    this.timer = 0;
    this.period = 0;
    this.mode = false;
    this.envelope.reset();
    this.shiftRegister = 1;
  }

  writeControl(value: number): void {
    this.lengthCounter = this.lengthTable[(value >> 5) & 0x1F];
    this.envelope.writeControl(value);
  }

  writePeriod(value: number): void {
    this.mode = !!(value & 0x80);
    this.period = this.noisePeriods[value & 0x0F];
  }

  writeLength(value: number): void {
    if (this.lengthCounter === 0 && this.enabled) {
      this.lengthCounter = this.lengthTable[(value >> 3) & 0x1F];
    }
    this.envelope.restart();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.lengthCounter = 0;
    }
  }

  step(): void {
    if (this.timer === 0) {
      this.timer = this.period;
      const bit1 = (this.shiftRegister & 0x01) !== 0;
      const bit2 = this.mode ? ((this.shiftRegister & 0x01) !== 0) : ((this.shiftRegister & 0x40) !== 0);
      const feedback = (bit1 !== bit2) ? 1 : 0;
      this.shiftRegister = (this.shiftRegister >> 1) | (feedback << 14);
    } else {
      this.timer--;
    }
  }

  envelopeClock(): void {
    this.envelope.clock();
  }

  lengthClock(): void {
    if (this.lengthCounter > 0 && !this.isLoop()) {
      this.lengthCounter--;
    }
  }

  private isLoop(): boolean {
    return true; // TODO: implement properly
  }

  output(): number {
    if (this.lengthCounter === 0 || (this.shiftRegister & 0x01)) {
      return 0;
    }
    return 0; // TODO: implement envelope output
  }

  getLengthCounter(): number {
    return this.lengthCounter;
  }

  getState() {
    return {
      enabled: this.enabled,
      lengthCounter: this.lengthCounter,
      timer: this.timer,
      period: this.period,
      mode: this.mode,
      envelope: this.envelope.getState(),
      shiftRegister: this.shiftRegister
    };
  }

  private readonly lengthTable = [
    10, 254, 20, 2, 40, 4, 80, 6, 160, 8, 60, 10, 14, 12, 26, 14,
    12, 16, 24, 18, 48, 20, 96, 22, 192, 24, 72, 26, 16, 28, 32, 30
  ];

  private readonly noisePeriods = [
    4, 8, 16, 32, 64, 96, 128, 160, 202, 254, 380, 508, 762, 1016, 2034, 4068
  ];
}

/**
 * DMC 通道 (Delta Modulation Channel)
 */
class DMCChannel {
  public interrupt: boolean = false;
  private enabled: boolean = false;
  private irq: boolean = false;
  private loop: boolean = false;
  private rate: number = 0;
  private address: number = 0;
  private length: number = 0;
  private currentAddress: number = 0;
  private currentLength: number = 0;
  private shiftRegister: number = 0;
  private bitsRemaining: number = 0;
  private outputLevel: number = 0;
  private silence: boolean = true;
  private period: number = 0;

  reset(): void {
    this.interrupt = false;
    this.enabled = false;
    this.irq = false;
    this.loop = false;
    this.rate = 0;
    this.address = 0;
    this.length = 0;
    this.currentAddress = 0;
    this.currentLength = 0;
    this.shiftRegister = 0;
    this.bitsRemaining = 0;
    this.outputLevel = 0;
    this.silence = true;
    this.period = 0;
  }

  writeControl(value: number): void {
    this.irq = !!(value & 0x80);
    this.loop = !!(value & 0x40);
    this.rate = value & 0x0F;
    this.period = this.dmcRates[this.rate];
    
    if (!this.interrupt) {
      this.interrupt = false;
    }
  }

  writeDirect(value: number): void {
    this.outputLevel = value & 0x7F;
  }

  writeAddress(value: number): void {
    this.address = 0xC000 | (value << 6);
  }

  writeLength(value: number): void {
    this.length = (value << 4) + 1;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (enabled) {
      this.currentAddress = this.address;
      this.currentLength = this.length;
    } else {
      this.currentLength = 0;
    }
  }

  step(): void {
    // TODO: 实现 DMC 通道逻辑
  }

  isActive(): boolean {
    return this.currentLength > 0;
  }

  output(): number {
    return this.outputLevel;
  }

  getState() {
    return {
      interrupt: this.interrupt,
      enabled: this.enabled,
      irq: this.irq,
      loop: this.loop,
      rate: this.rate,
      address: this.address,
      length: this.length,
      currentAddress: this.currentAddress,
      currentLength: this.currentLength,
      shiftRegister: this.shiftRegister,
      bitsRemaining: this.bitsRemaining,
      outputLevel: this.outputLevel,
      silence: this.silence,
      period: this.period
    };
  }

  private readonly dmcRates = [
    428, 380, 340, 320, 286, 254, 226, 214, 190, 160, 142, 128, 106, 84, 72, 54
  ];
}