# hwan-pr-learn

一个纯静态学习站：把我在 [PR-Agent](https://github.com/The-PR-Agent/pr-agent)（Agent 工程）与
[k8sgpt](https://github.com/k8sgpt-ai/k8sgpt)（Kubernetes）上提交的开源 PR，拆成
**可交互的知识卡片与分步动画**。

> PR 代码由 AI 起草，这个站负责把它们变回知识：现象 → 根因 → 修法 → 真实 diff → 可迁移经验。

## 页面

| 页面 | 内容 |
| --- | --- |
| `index.html` | 总览：数据统计、两条学习主线、学习方法、示例动画 |
| `prs.html` | PR 图谱：全部 PR（由 `gh` 抓取），可按仓库 / 状态 / 类型 / 知识主题筛选，点开看 diff 与学习卡片 |
| `agent.html` | Agent 篇：模块地图、`/review` 生命周期动画、并发与回退、token 预算、23 个案例 |
| `k8s.html` | Kubernetes 篇：`analyze` 全链路、Deployment/Job/RBAC/分页动画、语义速查表、14 个案例 |
| `lab.html` | 代码实验室：九个可逐步播放的补丁精读（真实 diff 逐行高亮讲解） |

## 目录

```
├── assets/
│   ├── css/main.css          # 全站样式（无框架、无构建）
│   ├── js/                   # common / player / prs / case / track / home
│   └── data/
│       ├── prs.json          # PR 数据快照（由脚本生成，可提交）
│       └── lessons.js        # 知识内容：案例 + 动画配置（手工维护）
├── scripts/build_pr_data.py  # 用 gh CLI 抓取 PR → assets/data/prs.json
├── *.html                    # 五个页面
└── .github/workflows/        # GitHub Pages 部署（可选）
```

## 常用操作

```bash
# 本地预览（必须走 http，fetch JSON 在 file:// 下不可用）
python3 -m http.server 8123

# 刷新 PR 数据（需要 gh 已登录）
python3 scripts/build_pr_data.py

# 新增一个学习案例
#   编辑 assets/data/lessons.js → cases 数组：
#   repo / number / url / track('agent'|'k8s') / theme / title / state / date
#   problem / root / fix / code{file,before,after} / knowledge[{t,d}] / takeaway / related
#   想配动画就往 players 里加一份配置，然后在页面里 <div data-player="key"></div>
```

## 部署

- **GitHub Pages**：仓库 Settings → Pages → Source 选 **GitHub Actions**，推送到 `main` 即可
  （已内置 `.github/workflows/deploy.yml`）；或直接选 “Deploy from a branch / main / root”。
- **Cloudflare Pages**：连接仓库，构建命令留空，输出目录填 `/`（根目录即站点）。
- 无任何构建步骤与运行时依赖，纯 HTML/CSS/JS。

## 数据与隐私

- `prs.json` 只包含公开的 GitHub PR 元数据（标题、状态、diff 统计、文件列表、描述摘要）。
- 学习卡片中的代码片段均取自对应 PR 的公开 diff；流程类代码会标注为简化示意。
