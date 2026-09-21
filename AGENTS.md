# AGENTS.md — hwan-pr-learn

本文件面向 AI 协作者（CodeBuddy / Codex / Claude 等）。开始任何改动前先读这里。

## 这个项目是什么

一个**纯静态**的个人学习站（无构建步骤、无运行时依赖），把我在两个较大开源项目上提交的 PR
拆成可交互的知识卡片与分步动画：

- **Agent 篇**：`The-PR-Agent/pr-agent` — 学 Agent 工程（入口适配、命令解析、token 预算、并发与回退、取消与状态收敛、可观测性、A2A）。
- **Kubernetes 篇**：`k8sgpt-ai/k8sgpt` — 学 Kubernetes 语义（Analyzer 插件体系、conditions 是谁写的、status 新鲜度、RBAC 绑定、命名空间作用域、准入控制、DRA）。

PR 代码本身由 AI 起草，这个站的价值在于**复盘**：现象 → 根因 → 修法 → 真实 diff → 可迁移经验。

## 目录与职责

```
index.html               首页：统计、两条主线、学习路径、示例动画
prs.html                 PR 图谱：筛选 + 详情抽屉（diff + 学习卡片）
agent.html               Agent 篇：模块地图 + 3 个动画 + 案例网格
k8s.html                 Kubernetes 篇：模块地图 + 4 个动画 + 语义速查表 + 案例网格
lab.html                 代码实验室：9 个可播放的补丁精读（tab 切换）
assets/css/main.css      全站样式（CSS 变量集中在 :root）
assets/js/common.js      滚动进度、导航、出场动画、数字滚动、光斑、流程动画、PR 数据加载
assets/js/player.js      StepPlayer：分步播放器 + 抽屉（支持 node/lines/fill/cls 四类 step 指令）
assets/js/case.js        学习卡片渲染（抽屉内容、案例网格、播放器挂载）
assets/js/prs.js         PR 图谱页的筛选逻辑
assets/js/track.js       专题页：播放器挂载、案例网格、模块地图、tab
assets/js/home.js        首页统计与列表
assets/data/prs.json     由脚本生成的 PR 数据快照（可提交）
assets/data/lessons.js   手工维护：cases（案例）+ players（动画配置）
scripts/build_pr_data.py gh CLI → assets/data/prs.json
```

## 铁律：不要理会课内 / 校内"打工"项目

以下仓库是课内作业或校内实验室"打工"产物，**不是学习对象，属于噪音数据**：

| 仓库 | 原因 |
| --- | --- |
| `liuzhishun/Paper-Analysis-Viewer`、`junnhwan/Paper-Analysis-Viewer` | 校内实验室打工仓库（含 fork） |
| `Mmakit/makit` | 课内项目 |
| `nightwalkerkkk123/Moments` | 课内项目 |

- 不要为它们写案例、动画、知识点，也不要在任何统计、文案、图表中引用。
- 数据层面已在 `scripts/build_pr_data.py` 的 `IGNORE_REPOS` 中排除；重新生成数据时不应被拉回来。
- 如果发现它们又出现在 `assets/data/prs.json` 或页面上，说明排除逻辑被绕过，应修复脚本并重新生成。
- 若将来还有类似的"非学习性质"仓库，加入同一个 `IGNORE_REPOS` 集合，并同步更新本表格。

其余小仓库（如 `kprompt/kprompt`、`junnhwan/codepilot_test_repo`、`LeoninCS/GoClub` 等）
保留在数据中，但**默认不写案例**；只有主线仓库（PR-Agent / k8sgpt）才进入学习主线。

## 内容规范

- 代码片段必须来自对应 PR 的真实 diff；流程类代码要明确标注"简化示意/伪代码"，不得伪造真实源码。
- 保留已确认的编号、日期、链接、文件名；没查到证据的结论要标注"待核实"，不要编造数据或指标。
- 案例字段：`repo / number / url / track('agent'|'k8s') / theme / title / state / date /
  problem / root / fix / code{file,before,after} / knowledge[{t,d}] / takeaway / related`。
- 动画配置放在 `assets/data/lessons.js` 的 `players` 里，页面用 `<div data-player="key"></div>` 挂载。
- 改动后必须本地起 `python3 -m http.server` 验证：`fetch` 在 `file://` 下不可用，不能直接双击打开页面。

## 数据与刷新

```bash
python3 scripts/build_pr_data.py        # 需要 gh 已登录；写 assets/data/prs.json
```

## 部署

- GitHub Pages（Actions，`build_type: workflow`，`.github/workflows/deploy.yml`）：push 到 `main` 自动部署。
- Cloudflare Pages：构建命令留空，输出目录 `/`。

## Git

- 提交前先看 `git status`，不要动无关文件。
- **除非用户明确要求，不要执行 `git push`、改仓库可见性、强推等不可逆操作。**
- 提交信息用 conventional commit（如 `feat:` / `fix:` / `docs:`）。

## 完成标准

改动已落地、必要的本地渲染验证已跑过（页面能出、播放器能挂载、无控制台报错）、
未解决的 factual 项已明确标出、并汇报最终改动的文件路径。
