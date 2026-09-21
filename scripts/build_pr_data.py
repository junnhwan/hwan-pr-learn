#!/usr/bin/env python3
"""Pull every pull request authored by the configured GitHub user into data/prs.json.

The generated file is committed to the repository so the static site works without
any build step. Re-run this script whenever new pull requests should be published:

    python3 scripts/build_pr_data.py            # uses `gh`, writes data/prs.json
    python3 scripts/build_pr_data.py --author X  # another GitHub login

Requires: gh (https://cli.github.com) authenticated with `read` scope on public data.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_FILE = ROOT / "assets" / "data" / "prs.json"

PR_FIELDS = ",".join(
    [
        "number",
        "title",
        "state",
        "createdAt",
        "mergedAt",
        "closedAt",
        "url",
        "additions",
        "deletions",
        "changedFiles",
        "isDraft",
        "labels",
        "body",
        "files",
    ]
)

# Repositories that drive the two learning tracks of this site.
FOCUS = {
    "The-PR-Agent/pr-agent": {
        "track": "agent",
        "label": "PR-Agent",
        "blurb": "AI 代码评审 Agent：多平台 webhook、LLM 工具链、提示词与令牌预算。",
    },
    "k8sgpt-ai/k8sgpt": {
        "track": "k8s",
        "label": "k8sgpt",
        "blurb": "把集群信号翻译成人话的诊断器：Analyzer 插件 + AI 解释层。",
    },
}

# 忽略名单：这些仓库不是学习对象，完全不进入本站数据。
# - Paper-Analysis-Viewer：校内实验室"打工"仓库（含其 fork），与本站两条学习主线无关，
#   详见仓库根目录 AGENTS.md。任何统计、筛选、案例、文档都不要包含它。
IGNORE_REPOS = {
    "liuzhishun/Paper-Analysis-Viewer",
    "junnhwan/Paper-Analysis-Viewer",
}

K8S_REPOS = {
    "k8sgpt-ai/k8sgpt",
    "volcano-sh/kthena",
    "kubevela/kubevela",
    "kubernetes-sigs/kueue",
    "k0sproject/k0smotron",
    "kubeflow/sdk",
}

AGENT_REPOS = {
    "The-PR-Agent/pr-agent",
    "volcengine/OpenViking",
    "ag2ai/ag2",
    "HolmesGPT/holmesgpt",
    "kprompt/kprompt",
}

KIND_MAP = {
    "fix": "修复",
    "feat": "特性",
    "perf": "性能",
    "docs": "文档",
    "refactor": "重构",
    "chore": "杂项",
    "test": "测试",
    "ci": "CI",
}

CONVENTIONAL = re.compile(r"^(fix|feat|perf|docs|refactor|chore|test|ci)\(([^)]+)\)", re.I)


def run(args: list[str]) -> str:
    proc = subprocess.run(args, capture_output=True, text=True)
    if proc.returncode != 0:
        raise RuntimeError(f"command failed: {' '.join(args)}\n{proc.stderr.strip()}")
    return proc.stdout


def gh_json(args: list[str]):
    return json.loads(run(["gh"] + args))


def summarise(body: str | None, limit: int = 420) -> str:
    if not body:
        return ""
    text = body.replace("\r\n", "\n").strip()
    # Drop fenced blocks and HTML comments that pollute the card view.
    text = re.sub(r"```.*?```", " ", text, flags=re.S)
    text = re.sub(r"<!--.*?-->", " ", text, flags=re.S)
    text = re.sub(r"\n{2,}", "\n", text).strip()
    if len(text) <= limit:
        return text
    cut = text[:limit].rsplit("\n", 1)[0].strip()
    return cut + "…"


def classify(title: str) -> tuple[str, str]:
    match = CONVENTIONAL.match(title.strip())
    if match:
        return KIND_MAP.get(match.group(1).lower(), "其他"), match.group(2).strip().lower()
    lowered = title.lower()
    for key, value in KIND_MAP.items():
        if lowered.startswith(key + ":") or lowered.startswith(key + "("):
            return value, ""
    return "其他", ""


def discover_repos(author: str) -> list[str]:
    prs = gh_json(
        [
            "search",
            "prs",
            "--author",
            author,
            "--limit",
            "300",
            "--json",
            "repository",
        ]
    )
    counter = Counter(pr["repository"]["nameWithOwner"] for pr in prs)
    kept = [repo for repo, _ in counter.most_common() if repo not in IGNORE_REPOS]
    skipped = [(repo, n) for repo, n in counter.most_common() if repo in IGNORE_REPOS]
    for repo, n in skipped:
        print(f"  (ignored) {repo}: {n} — 见 IGNORE_REPOS / AGENTS.md")
    return kept


def fetch_repo(repo: str, author: str) -> list[dict]:
    return gh_json(
        [
            "pr",
            "list",
            "--repo",
            repo,
            "--author",
            author,
            "--state",
            "all",
            "--limit",
            "200",
            "--json",
            PR_FIELDS,
        ]
    )


def normalise(repo: str, pr: dict) -> dict:
    kind, scope = classify(pr["title"])
    files = [f["path"] for f in (pr.get("files") or [])][:40]
    meta = FOCUS.get(repo)
    track = "other"
    if repo in FOCUS:
        track = FOCUS[repo]["track"]
    elif repo in K8S_REPOS:
        track = "k8s"
    elif repo in AGENT_REPOS:
        track = "agent"

    return {
        "repo": repo,
        "project": meta["label"] if meta else repo.split("/")[-1],
        "number": pr["number"],
        "title": pr["title"],
        "state": pr["state"].lower(),
        "draft": bool(pr.get("isDraft")),
        "createdAt": pr["createdAt"],
        "mergedAt": pr.get("mergedAt"),
        "closedAt": pr.get("closedAt"),
        "url": pr["url"],
        "additions": pr.get("additions") or 0,
        "deletions": pr.get("deletions") or 0,
        "changedFiles": pr.get("changedFiles") or 0,
        "kind": kind,
        "scope": scope,
        "track": track,
        "focus": repo in FOCUS,
        "labels": [l["name"] for l in (pr.get("labels") or [])],
        "summary": summarise(pr.get("body")),
        "files": files,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--author", default="junnhwan")
    parser.add_argument("--out", default=str(OUT_FILE))
    args = parser.parse_args()

    repos = discover_repos(args.author)
    records: list[dict] = []
    for repo in repos:
        try:
            prs = fetch_repo(repo, args.author)
        except RuntimeError as exc:  # keep going, a single private repo should not kill the run
            print(f"! skipping {repo}: {exc}", file=sys.stderr)
            continue
        for pr in prs:
            records.append(normalise(repo, pr))
        print(f"  {repo}: {len(prs)}")

    records.sort(key=lambda r: r["createdAt"], reverse=True)
    payload = {
        "author": args.author,
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "repos": [
            {
                "name": repo,
                "label": FOCUS.get(repo, {}).get("label", repo.split("/")[-1]),
                "blurb": FOCUS.get(repo, {}).get("blurb", ""),
                "focus": repo in FOCUS,
                "count": sum(1 for r in records if r["repo"] == repo),
            }
            for repo in repos
        ],
        "prs": records,
    }

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"\nwrote {len(records)} pull requests to {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
