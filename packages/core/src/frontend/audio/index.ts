/**
 * Web Audio API 音频输出系统
 * 负责将 APU 生成的音频样本转换为可播放的音频
 */

export class AudioSystem {
  private audioContext: AudioContext | null = null;
  private scriptNode: ScriptProcessorNode | null = null;
  private sampleRate: number = 44100;
  private bufferSize: number = 4096;
  private isInitialized: boolean = false;
  private volume: number = 0.5;
  private isMuted: boolean = false;

  constructor() {
    // 延迟创建 AudioContext，等待用户交互
  }

  /**
   * 创建音频上下文（需要用户交互）
   */
  private createAudioContext(): boolean {
    if (this.audioContext) return true;

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.sampleRate = this.audioContext.sampleRate;
      return true;
    } catch (error) {
      console.error('Failed to create AudioContext:', error);
      return false;
    }
  }

  /**
   * 初始化音频系统
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    // 尝试创建音频上下文
    if (!this.createAudioContext()) {
      console.warn('AudioContext creation failed, audio will be disabled');
      return false;
    }

    // 确保 audioContext 存在
    if (!this.audioContext) {
      console.error('AudioContext is null after creation');
      return false;
    }

    // 如果音频上下文被暂停，尝试恢复（需要用户交互）
    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (error) {
        console.warn('AudioContext resume failed:', error);
        return false;
      }
    }

    try {
      // 创建音频处理节点
      this.scriptNode = this.audioContext.createScriptProcessor(this.bufferSize, 0, 2);
      this.scriptNode.onaudioprocess = this.onAudioProcess.bind(this);
      
      // 连接到输出
      this.scriptNode.connect(this.audioContext.destination);
      
      this.isInitialized = true;
      console.log('Audio system initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize audio system:', error);
      return false;
    }
  }

  /**
   * 音频处理回调
   */
  private onAudioProcess(audioProcessingEvent: AudioProcessingEvent): void {
    if (!this.audioContext || !this.scriptNode) return;

    const outputLeft = audioProcessingEvent.outputBuffer.getChannelData(0);
    const outputRight = audioProcessingEvent.outputBuffer.getChannelData(1);

    // 生成静音（APU样本将在后续实现中填充）
    for (let i = 0; i < outputLeft.length; i++) {
      outputLeft[i] = 0;
      outputRight[i] = 0;
    }
  }

  /**
   * 播放音频样本
   */
  playSample(_sample: number): void {
    if (!this.isInitialized || this.isMuted || !this.audioContext) return;

    // 这里可以实现音频样本的缓冲和播放
    // 当前先简化处理
  }

  /**
   * 设置音量
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * 设置静音状态
   */
  setMuted(muted: boolean): void {
    this.isMuted = muted;
  }

  /**
   * 获取当前音量
   */
  getVolume(): number {
    return this.volume;
  }

  /**
   * 获取静音状态
   */
  getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * 暂停音频系统
   */
  async suspend(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'running') {
      await this.audioContext.suspend();
    }
  }

  /**
   * 恢复音频系统
   */
  async resume(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  /**
   * 销毁音频系统
   */
  async dispose(): Promise<void> {
    if (this.scriptNode) {
      this.scriptNode.disconnect();
      this.scriptNode = null;
    }
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      await this.audioContext.close();
      this.audioContext = null;
    }
    
    this.isInitialized = false;
  }

  /**
   * 获取音频上下文状态
   */
  getState(): string {
    return this.audioContext?.state || 'unavailable';
  }

  /**
   * 检查音频系统是否可用
   */
  isAvailable(): boolean {
    return this.audioContext !== null && this.isInitialized;
  }
}