# code-cut — Agent Guidelines

## 核心原则

### 遇到难做的 feature，先找开源项目，不要重复造轮子
遇到复杂的渲染、编码、动画、音频等功能需求时，**先搜索是否已有成熟的开源实现**，确认没有合适的方案再自己实现。无意义的重复造轮子浪费时间，也引入更多 bug。

---

## 项目架构速查

```
MCP Server (packages/server)      ← AI agent 通过 MCP 调用
  ├── WebSocket :8765              ← 实时推送 project.json 变更
  └── tools: project_init, lottie_add, footage_add, subtitle_add, layer_update, layer_remove

Web UI (packages/ui, localhost:5173)
  ├── <video> 层                  ← 素材，原生播放
  ├── Lottie 层                   ← AI 生成的动效覆盖层（lottie-react）
  └── 字幕层                      ← CSS 文字叠加
```

## 关键开源依赖参考

| 需求 | 选型 | 为什么 |
|---|---|---|
| 动效格式 | **lottie-web / lottie-react** | JSON 描述动画，AI 可直接生成和 patch，不需要重渲染 |
| 复杂动画 | **GSAP** | Hyperframes 的主要动画引擎，seek-first 架构，适合逐帧控制 |
| 时间轴/关键帧 | **Theatre.js** | 参数动画时间轴，有 scene graph 概念 |
| WebGL 合成 | **PixiJS** | 如果需要 WebGL 层合成，PixiJS 有完整 scene graph + video texture |
| 最终导出 | **ffmpeg.wasm** | 浏览器内 FFmpeg，预览用 UI，导出用它 |
| 音频混合 | **Web Audio API** | 浏览器内置，多轨混音 |

## 来自 Hyperframes 的参考设计

参考代码库：`E:\CodeCode\hyperframes`

### 值得借鉴的

1. **适配器模式 (FrameAdapter)**
   - 文件：`packages/core/src/adapters/types.ts`
   - 核心接口：`seekFrame(frame)` — 确定性帧跳转，不依赖 wall-clock
   - 启示：动画库可插拔，GSAP / Lottie / Three.js 通过同一接口接入

2. **Seek-First 架构**
   - 用帧序号而不是时间戳定位内容，支持精确 seek、变速、随机访问
   - 禁止 `Date.now()` / `Math.random()` 无种子调用（保证确定性）

3. **postMessage 父子通信协议**
   - 文件：`packages/core/src/runtime/types.ts`
   - 父 → iframe：`{ action: "seek" | "play" | "pause" }`
   - iframe → 父：`{ type: "state", currentTime, duration, paused }`

4. **data-* 时序属性**
   - Hyperframes 用 HTML `data-start` / `data-duration` 描述时间轴
   - 我们用 JSON scene graph，概念等价，但 AI 操作更方便

5. **Skills 分层架构**
   - 目录：`hyperframes/skills/`
   - 每个 skill 自包含（SKILL.md + scripts/ + assets/）
   - 意图路由层 → 领域 skill 层 → 执行脚本层
   - 未来 code-cut 可以参考这种结构组织 AI 工作流

### 我们刻意不走的路

- ❌ Headless Chrome 逐帧截图 → 太慢，改一个字要重跑
- ❌ AI 生成 HTML/JS 代码 → 不可靠，改一个参数要重新生成整段代码
- ✅ AI 操作 JSON scene graph → 可靠，改一个字段 <100ms 生效

---

## 开发流程

1. MCP Server：`pnpm --filter server dev`（使用 tsx watch）
2. UI：`pnpm --filter ui dev`（localhost:5173）
3. 两者都起来后，AI 调 `project_init` → UI 状态栏变绿

## 需要注意的约定

- project.json 是唯一数据源（single source of truth）
- 所有图层变更通过 WebSocket 广播，UI 监听更新
- 不同图层类型独立渲染，修改一个图层不影响其他图层
