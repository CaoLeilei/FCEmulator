# FC 模拟器

一个基于 TypeScript 和 Web 技术的 FC (Family Computer) / NES 模拟器。

## 功能特性

- 🎮 完整的 6502 CPU 模拟
- 🖼️ PPU 图形处理器渲染
- 🔊 APU 音频处理器支持
- 📦 多种卡带映射器支持 (NROM, MMC1, UxROM)
- 🎮 双手柄输入支持
- 🔧 完整的调试工具
- 📱 响应式 Web 界面

## 项目架构

```
src/
├── core/                   # 模拟器核心
│   ├── cpu/               # 6502 CPU 处理器
│   ├── ppu/               # 图形处理器
│   ├── apu/               # 音频处理器
│   ├── memory/            # 内存管理单元
│   ├── cartridge/         # 卡带系统
│   ├── input/             # 输入控制器
│   └── emulator/          # 主模拟器引擎
├── frontend/              # 前端界面
│   ├── renderer/          # 渲染器
│   └── ui/               # 用户界面
├── share/                # 共享工具和类型
├── main.ts              # 入口文件
└── style.css            # 样式文件
```

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

### 构建项目

```bash
pnpm build
```

### 预览构建结果

```bash
pnpm preview
```

## 使用说明

1. 启动开发服务器后，在浏览器中打开项目
2. 点击"加载 ROM"按钮选择 NES 格式的游戏文件 (.nes)
3. 使用控制按钮控制模拟器：
   - **播放/暂停**: 控制模拟器运行状态
   - **重置**: 重新启动游戏
   - **单步**: 调试模式下逐条执行指令

### 手柄控制

**玩家 1:**
- 方向键: 十字键
- Z: A 键
- X: B 键  
- Enter: Start
- Shift: Select

**玩家 2:**
- W/A/S/D: 十字键
- O: A 键
- P: B 键
- I: Start
- U: Select

### 快捷键

- `Ctrl+O`: 打开 ROM 文件
- `Ctrl+R`: 重置模拟器
- `Ctrl+P`: 暂停/继续
- `F11`: 全屏模式
- `F12`: 打开/关闭调试面板

## 调试功能

项目内置了完整的调试工具：

- **实时状态监控**: 显示 CPU、PPU、APU 的实时状态
- **图案表查看器**: 显示 CHR ROM 中的图案数据
- **名称表查看器**: 显示当前的屏幕布局
- **控制器状态**: 实时显示手柄输入状态
- **单步调试**: 逐条执行 CPU 指令

## 支持的映射器

- **Mapper 0 (NROM)**: 最简单的映射器，支持大多数早期游戏
- **Mapper 1 (MMC1)**: 支持 bank switching 的复杂映射器
- **Mapper 2 (UxROM)**: 简单的 PRG bank switching

## 技术栈

- **TypeScript**: 类型安全的 JavaScript
- **Vite**: 快速的前端构建工具
- **Canvas API**: 高性能 2D 渲染
- **Web Audio API**: 音频生成和处理
- **HTML5**: 现代化的用户界面

## 开发指南

### 添加新的映射器

1. 在 `src/core/cartridge/index.ts` 中创建新的映射器类
2. 实现 `Mapper` 接口的所有方法
3. 在 `createMapper` 方法中添加对新映射器的支持

### 扩展调试功能

1. 在 `src/frontend/ui/index.ts` 中添加新的 UI 元素
2. 在 `src/frontend/renderer/index.ts` 中实现相应的渲染逻辑
3. 在 `src/main.ts` 中连接渲染回调和事件处理

### 性能优化建议

- 使用 Web Workers 进行重计算任务
- 实现 JIT 编译器优化 CPU 执行
- 使用 WebGL 加速图形渲染
- 实现声音的低延迟缓冲

## 贡献指南

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 致谢

感谢所有为 NES 模拟器开发做出贡献的开发者和研究者。

## 参考资料

- [NES Dev Wiki](https://www.nesdev.org/wiki/Nesdev_Wiki) - NES 开发的权威资源
- [6502 CPU 指令集参考](https://www.nesdev.org/wiki/6502_instructions)
- [PPU 文档](https://www.nesdev.org/wiki/PPU)
- [APU 文档](https://www.nesdev.org/wiki/APU)