/**
 * 输入控制器模块
 * 处理 FC 手柄输入
 */

export class InputController {
  // 手柄状态
  private controllers: [ControllerState, ControllerState] = [
    new ControllerState(),
    new ControllerState()
  ];
  
  // 串行读取状态
  private controllerStrobe: boolean = false;
  private controllerReadIndex: [number, number] = [0, 0];

  constructor() {
    this.setupKeyboardMapping();
  }

  /**
   * 重置输入控制器
   */
  reset(): void {
    this.controllers[0].reset();
    this.controllers[1].reset();
    this.controllerStrobe = false;
    this.controllerReadIndex = [0, 0];
  }

  /**
   * 写入手柄控制寄存器
   */
  writeController(value: number): void {
    const strobe = !!(value & 0x01);
    
    if (strobe && !this.controllerStrobe) {
      // 上升沿，锁存当前手柄状态
      this.controllers[0].latch();
      this.controllers[1].latch();
      this.controllerReadIndex = [0, 0];
    }
    
    this.controllerStrobe = strobe;
  }

  /**
   * 读取手柄状态
   */
  readController(index: number): number {
    if (index < 0 || index > 1) return 0;
    
    const controller = this.controllers[index];
    const result = controller.read(this.controllerReadIndex[index]);
    
    if (!this.controllerStrobe) {
      this.controllerReadIndex[index]++;
    }
    
    return result;
  }

  /**
   * 设置键盘按键状态
   */
  setKeyState(key: string, pressed: boolean): void {
    const mapping = this.getControllerButton(key);
    if (mapping) {
      this.controllers[mapping.controller].setButton(mapping.button, pressed);
    }
  }

  /**
   * 获取控制器状态 (用于调试)
   */
  getControllerState(index: number): ControllerState {
    return this.controllers[index];
  }

  /**
   * 设置键盘映射
   */
  private setupKeyboardMapping(): void {
    // 默认键盘映射
    this.keyboardMapping = {
      // 玩家 1
      'ArrowUp': { controller: 0, button: 'UP' },
      'ArrowDown': { controller: 0, button: 'DOWN' },
      'ArrowLeft': { controller: 0, button: 'LEFT' },
      'ArrowRight': { controller: 0, button: 'RIGHT' },
      'KeyZ': { controller: 0, button: 'A' },
      'KeyX': { controller: 0, button: 'B' },
      'Enter': { controller: 0, button: 'START' },
      'ShiftLeft': { controller: 0, button: 'SELECT' },
      
      // 玩家 2
      'KeyW': { controller: 1, button: 'UP' },
      'KeyS': { controller: 1, button: 'DOWN' },
      'KeyA': { controller: 1, button: 'LEFT' },
      'KeyD': { controller: 1, button: 'RIGHT' },
      'KeyO': { controller: 1, button: 'A' },
      'KeyP': { controller: 1, button: 'B' },
      'KeyI': { controller: 1, button: 'START' },
      'KeyU': { controller: 1, button: 'SELECT' }
    };
  }

  private keyboardMapping: Record<string, { controller: number; button: ControllerButton }> = {};

  private getControllerButton(key: string): { controller: number; button: ControllerButton } | null {
    return this.keyboardMapping[key] || null;
  }
}

/**
 * 控制器状态
 */
export class ControllerState {
  private buttons: Map<ControllerButton, boolean> = new Map();
  private latchedButtons: Map<ControllerButton, boolean> = new Map();
  private readIndex: number = 0;

  constructor() {
    this.reset();
  }

  /**
   * 重置控制器状态
   */
  reset(): void {
    this.buttons.clear();
    this.latchedButtons.clear();
    this.readIndex = 0;
    
    // 初始化所有按钮为 false
    const allButtons: ControllerButton[] = [
      'A', 'B', 'SELECT', 'START', 'UP', 'DOWN', 'LEFT', 'RIGHT'
    ];
    allButtons.forEach(button => {
      this.buttons.set(button, false);
      this.latchedButtons.set(button, false);
    });
  }

  /**
   * 设置按钮状态
   */
  setButton(button: ControllerButton, pressed: boolean): void {
    this.buttons.set(button, pressed);
  }

  /**
   * 获取按钮状态
   */
  getButton(button: ControllerButton): boolean {
    return this.buttons.get(button) || false;
  }

  /**
   * 锁存当前按钮状态
   */
  latch(): void {
    this.latchedButtons = new Map(this.buttons);
    this.readIndex = 0;
  }

  /**
   * 串行读取按钮状态
   */
  read(index: number): number {
    if (index >= 8) {
      return 1; // 超出范围返回 1
    }
    
    const buttonOrder: ControllerButton[] = [
      'A', 'B', 'SELECT', 'START', 'UP', 'DOWN', 'LEFT', 'RIGHT'
    ];
    
    if (index < buttonOrder.length) {
      const button = buttonOrder[index];
      return this.latchedButtons.get(button) ? 1 : 0;
    }
    
    return 1;
  }

  /**
   * 获取所有按钮状态
   */
  getAllButtons(): Record<ControllerButton, boolean> {
    const result = {} as Record<ControllerButton, boolean>;
    this.buttons.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }
}

/**
 * 控制器按钮类型
 */
export type ControllerButton = 
  | 'A' | 'B' | 'SELECT' | 'START' 
  | 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

/**
 * 初始化键盘输入事件监听
 */
export function setupKeyboardEvents(inputController: InputController): () => void {
  function handleKeyDown(event: KeyboardEvent): void {
    inputController.setKeyState(event.code, true);
  }

  function handleKeyUp(event: KeyboardEvent): void {
    inputController.setKeyState(event.code, false);
  }

  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);

  // 返回清理函数
  return () => {
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
  };
}