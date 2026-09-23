# CF-Server-Monitor Theme · Win2000

一款 Windows 2000 经典风格的 [CF-Server-Monitor](https://github.com/huilang-me/CF-Server-Monitor) 第三方主题。

整个页面就是桌面上的一个窗口：灰色立体控件、蓝色渐变标题栏、分段进度条、黑底绿网格的任务管理器风格图表。功能与默认主题一一对应，只换外观。

![预览](docs/preview.png)

## 功能

- **首页**：卡片 / 圆环 / 表格 / 地图四种视图，地区选项卡筛选（放不下时收进「更多」），按分组显示，全局统计，剩余价值与汇率。
- **详情页**：主机信息，以及 CPU、内存、网络、负载、硬盘、磁盘 IO、GPU、进程、连接数、延迟、丢包图表，历史范围从 10 分钟到 7 天。
- **实时数据**：WebSocket 订阅（首页按后端分组订阅，详情页只订阅单台）；页面隐藏时断开、重新可见时先补 REST 数据再恢复；支持 `frontend_ws_timeout_minutes` 超时询问。
- **多后端**：支持 `apiBase` 配置多个 Worker。
- **登录与验证**：支持非公开站点（JWT）与 Turnstile 人机验证。登录入口统一跳转 `/admin#admin`。
- **外观**：经典浅色 + 深色两套配色，跟随后台 `preferred_theme`，也可以在标题栏切换；中英文跟随 `default_language`。
- **错误提示**：加载失败、跨域被拦截、需要登录时，都会弹出对话框说明原因，不会静默跳转。

## 安装

在 CF-Server-Monitor 后台的主题设置中，填入本仓库 `build` 分支的地址，例如：

```
https://github.com/finch-xu/CF-Server-Monitor-theme-win2000/tree/build
```

建议使用某次构建的 commit id 固定版本。

## 开发

```bash
npm install
cp .env.example .env   # 设置 VITE_DEV_PROXY_TARGET 为你的 Worker 地址
npm run dev
```

本地开发时，需要在 Worker 的 `CORS_ALLOWED_ORIGINS` 中加入本地地址。

### 构建

```bash
npm run build
```

产物位于 `dist/`，只包含 `index.html` 和 `assets/`。推送到 `main` 后，GitHub Actions 会自动构建并发布到 `build` 分支。

### 纯静态部署（GitHub Pages 等）

在 `.env` 中设置 `API_BASE`（多个后端用英文逗号分隔），可选 `TITLE`、`BACKGROUND_IMAGE`、`BACKGROUND_IMAGE_MOBILE`，然后运行：

```bash
npm run build:github-page
```

每个后端 Worker 都要在 `CORS_ALLOWED_ORIGINS` 中加入主题所在的域名。

## 设计说明

见 [docs/DESIGN.md](docs/DESIGN.md)。

## 致谢与许可

- 数据层、实时推送、计费与国际化逻辑移植自 [CF-Server-Monitor](https://github.com/huilang-me/CF-Server-Monitor) 默认主题（MIT License）。
- 地图数据 `src/assets/world.zh.json` 来自 CF-Server-Monitor 仓库。
- 本主题的风格灵感来自 Windows 2000 经典界面。所有图标均为原创绘制，未使用 Microsoft 的图片、字体或声音素材；本项目与 Microsoft 无关。
- 本项目使用 [MIT License](LICENSE)。
