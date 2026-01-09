/**
 * UI 控制器
 * 管理模拟器的用户界面
 */

import { Emulator } from '../../core/emulator/index.js';
import { Renderer } from '../renderer/index.js';
import { AudioSystem } from '../audio/index.js';

export class UIController {
  private emulator: Emulator;
  private elements: UIElements;
  private renderer: Renderer | null = null;
  private audioSystem: AudioSystem | null = null;
  private isFullscreen: boolean = false;

  constructor(emulator: Emulator) {
    this.emulator = emulator;
    this.elements = this.initializeElements();
    this.initializeRenderer();
    this.initializeAudio();
    this.setupEventListeners();
    this.setupEmulatorCallbacks();
  }

  /**
   * 初始化渲染器
   */
  private initializeRenderer(): void {
    const canvas = this.elements.canvas;
    if (canvas) {
      this.renderer = new Renderer(canvas);
      this.renderer.setScale(2); // 默认2倍缩放
    }
  }

  /**
   * 初始化音频系统
   */
  private initializeAudio(): void {
    this.audioSystem = new AudioSystem();
    this.audioSystem.setVolume(0.5);
    // 延迟初始化，等待用户交互
  }

  /**
   * 初始化 UI 元素
   */
  private initializeElements(): UIElements {
    return {
      // 主画布
      canvas: document.getElementById('game-canvas') as HTMLCanvasElement,

      // 控制按钮
      playButton: document.getElementById('play-button') as HTMLButtonElement,
      pauseButton: document.getElementById('pause-button') as HTMLButtonElement,
      resetButton: document.getElementById('reset-button') as HTMLButtonElement,
      stepButton: document.getElementById('step-button') as HTMLButtonElement,

      // ROM 加载
      fileInput: document.getElementById('rom-file') as HTMLInputElement,
      loadButton: document.getElementById('load-button') as HTMLButtonElement,

      // 音频控制
      volumeSlider: document.getElementById('volume-slider') as HTMLInputElement,
      muteButton: document.getElementById('mute-button') as HTMLButtonElement,

      // 显示控制
      scaleSelect: document.getElementById('scale-select') as HTMLSelectElement,
      fullscreenButton: document.getElementById('fullscreen-button') as HTMLButtonElement,

      // 调试面板
      debugPanel: document.getElementById('debug-panel') as HTMLElement,
      debugToggle: document.getElementById('debug-toggle') as HTMLButtonElement,

      // 状态显示
      fpsDisplay: document.getElementById('fps-display') as HTMLElement,
      cycleDisplay: document.getElementById('cycle-display') as HTMLElement,
      controllerDisplay: document.getElementById('controller-display') as HTMLElement
    };
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 播放控制
    this.elements.playButton?.addEventListener('click', () => this.handlePlay());
    this.elements.pauseButton?.addEventListener('click', () => this.handlePause());
    this.elements.resetButton?.addEventListener('click', () => this.handleReset());
    this.elements.stepButton?.addEventListener('click', () => this.handleStep());

    // 添加全局点击事件监听器来激活音频
    document.addEventListener('click', this.handleUserInteraction.bind(this), { once: true });

    // ROM 加载
    this.elements.loadButton?.addEventListener('click', () => this.handleLoadROM());
    this.elements.fileInput?.addEventListener('change', () => this.handleFileSelect());

    // 音频控制
    this.elements.volumeSlider?.addEventListener('input', (e) => this.handleVolumeChange(e));
    this.elements.muteButton?.addEventListener('click', () => this.handleMuteToggle());

    // 显示控制
    this.elements.scaleSelect?.addEventListener('change', (e) => this.handleScaleChange(e));
    this.elements.fullscreenButton?.addEventListener('click', () => this.handleFullscreen());

    // 调试面板
    this.elements.debugToggle?.addEventListener('click', () => this.toggleDebugPanel());

    // 键盘快捷键
    this.setupKeyboardShortcuts();
  }

  /**
   * 设置模拟器回调
   */
  private setupEmulatorCallbacks(): void {
    // 设置帧渲染回调
    this.emulator.onFrameRender = (frameBuffer: Uint8Array) => {
      this.updateCanvas(frameBuffer);
    };
  }

  /**
   * 设置键盘快捷键
   */
  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'o':
            e.preventDefault();
            this.elements.fileInput?.click();
            break;
          case 'r':
            e.preventDefault();
            this.handleReset();
            break;
          case 'p':
            e.preventDefault();
            this.handlePause();
            break;
        }
      }

      switch (e.key) {
        case 'F11':
          e.preventDefault();
          this.handleFullscreen();
          break;
        case 'F12':
          e.preventDefault();
          this.toggleDebugPanel();
          break;
      }
    });
  }

  /**
   * 处理用户交互（用于激活音频）
   */
  private async handleUserInteraction(): Promise<void> {
    if (this.audioSystem && !this.audioSystem.isAvailable()) {
      const audioInitialized = await this.audioSystem.initialize();
      if (audioInitialized) {
        console.log('Audio system successfully initialized after user interaction');
      } else {
        console.warn('Audio system still unavailable after user interaction');
      }
    }
  }

  /**
   * 处理播放
   */
  private async handlePlay(): Promise<void> {
    try {
      this.emulator.start();
      this.updatePlayState(true);
    } catch (error) {
      console.error('Failed to start emulator:', error);
      this.showMessage('Failed to start emulator. Please load a ROM first.', 'error');
    }
  }

  /**
   * 处理暂停
   */
  private handlePause(): void {
    this.emulator.togglePause();
    this.updatePlayState(!this.emulator['isRunning']);
  }

  /**
   * 处理重置
   */
  private handleReset(): void {
    this.emulator.reset();
    this.showMessage('Emulator reset', 'info');
  }

  /**
   * 处理单步执行
   */
  private handleStep(): void {
    if (!this.emulator['isRunning']) {
      this.emulator.step();
      this.updateDebugInfo();
    }
  }

  /**
   * 处理文件选择
   */
  private handleFileSelect(): void {
    const file = this.elements.fileInput?.files?.[0];
    if (file) {
      this.loadROMFile(file);
    }
  }

  /**
   * 处理 ROM 加载
   */
  private handleLoadROM(): void {
    this.elements.fileInput?.click();
  }

  /**
   * 加载 ROM 文件
   */
  private async loadROMFile(file: File): Promise<void> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const romData = new Uint8Array(arrayBuffer);

      this.emulator.loadCartridge(romData);
      this.showMessage(`ROM loaded: ${file.name}`, 'success');

      // 自动开始运行
      this.handlePlay();
    } catch (error) {
      console.error('Failed to load ROM:', error);
      this.showMessage('Failed to load ROM. Please check the file format.', 'error');
    }
  }

  /**
   * 处理音量变化
   */
  private handleVolumeChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const volume = parseFloat(target.value) / 100;
    if (this.audioSystem) {
      this.audioSystem.setVolume(volume);
    }
  }

  /**
   * 处理静音切换
   */
  private handleMuteToggle(): void {
    if (this.audioSystem) {
      const currentMuted = this.audioSystem.getMuted();
      this.audioSystem.setMuted(!currentMuted);

      // 更新按钮文本
      if (this.elements.muteButton) {
        this.elements.muteButton.textContent = currentMuted ? '🔇 静音' : '🔊 静音';
      }
    }

    this.elements.muteButton?.classList.toggle('muted');
  }

  /**
   * 处理缩放变化
   */
  private handleScaleChange(event: Event): void {
    const scale = parseInt((event.target as HTMLSelectElement).value);
    if (this.renderer) {
      this.renderer.setScale(scale);
    }
  }

  /**
   * 处理全屏切换
   */
  private handleFullscreen(): void {
    if (!this.isFullscreen) {
      if (this.elements.canvas.requestFullscreen) {
        this.elements.canvas.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    this.isFullscreen = !this.isFullscreen;
  }

  /**
   * 切换调试面板
   */
  private toggleDebugPanel(): void {
    this.elements.debugPanel?.classList.toggle('hidden');
  }

  /**
   * 更新画布
   */
  private updateCanvas(frameBuffer: Uint8Array): void {
    if (this.renderer) {
      this.renderer.render(frameBuffer);
    }
  }

  /**
   * 更新播放状态
   */
  private updatePlayState(isPlaying: boolean): void {
    if (this.elements.playButton) {
      this.elements.playButton.style.display = isPlaying ? 'none' : 'inline-block';
    }
    if (this.elements.pauseButton) {
      this.elements.pauseButton.style.display = isPlaying ? 'inline-block' : 'none';
    }
  }

  /**
   * 更新调试信息
   */
  private updateDebugInfo(): void {
    const state = this.emulator.getState();

    if (this.elements.cycleDisplay) {
      this.elements.cycleDisplay.textContent = `Cycles: ${state.cycleCount}`;
    }

    // 更新控制器状态
    if (this.elements.controllerDisplay) {
      const controller1 = this.emulator.getControllerState(0).getAllButtons();
      const controller2 = this.emulator.getControllerState(1).getAllButtons();

      this.elements.controllerDisplay.innerHTML = `
        <div><strong>Controller 1:</strong> ${this.formatControllerState(controller1)}</div>
        <div><strong>Controller 2:</strong> ${this.formatControllerState(controller2)}</div>
      `;
    }
  }

  /**
   * 格式化控制器状态
   */
  private formatControllerState(controller: Record<string, boolean>): string {
    const buttons = Object.entries(controller)
      .filter(([_, pressed]) => pressed)
      .map(([button]) => button);
    return buttons.length > 0 ? buttons.join(', ') : 'None';
  }

  /**
   * 显示消息
   */
  private showMessage(message: string, type: 'info' | 'success' | 'error' = 'info'): void {
    // 创建消息元素
    const messageElement = document.createElement('div');
    messageElement.className = `message message-${type}`;
    messageElement.textContent = message;

    // 添加到页面
    document.body.appendChild(messageElement);

    // 自动移除
    setTimeout(() => {
      if (messageElement.parentNode) {
        messageElement.parentNode.removeChild(messageElement);
      }
    }, 3000);
  }

  /**
   * 销毁 UI 控制器
   */
  destroy(): void {
    // 清理事件监听器等
  }

  /**
   * 获取渲染器实例
   */
  getRenderer(): Renderer | null {
    return this.renderer;
  }

  /**
   * 渲染帧到 Canvas
   * @param frameBuffer - RGBA格式的帧缓冲区 (256x240像素, 每像素4字节)
   */
  renderFrame(frameBuffer: Uint8Array): void {
    if (this.renderer) {
      this.renderer.render(frameBuffer);
    }
  }
}

/**
 * UI 元素接口
 */
interface UIElements {
  canvas: HTMLCanvasElement;
  playButton?: HTMLButtonElement;
  pauseButton?: HTMLButtonElement;
  resetButton?: HTMLButtonElement;
  stepButton?: HTMLButtonElement;
  fileInput?: HTMLInputElement;
  loadButton?: HTMLButtonElement;
  volumeSlider?: HTMLInputElement;
  muteButton?: HTMLButtonElement;
  scaleSelect?: HTMLSelectElement;
  fullscreenButton?: HTMLButtonElement;
  debugPanel?: HTMLElement;
  debugToggle?: HTMLButtonElement;
  fpsDisplay?: HTMLElement;
  cycleDisplay?: HTMLElement;
  controllerDisplay?: HTMLElement;
}