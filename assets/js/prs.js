/* PR 图谱：筛选、检索、详情抽屉 */

(function () {
  "use strict";

  const state = {
    scope: "focus",
    state: "all",
    kind: "all",
    theme: "all",
    sort: "date",
    onlyCase: false,
    trk: "all",
    q: "",
  };

  let DATA = null;
  let CASE_MAP = {};

  function caseKey(repo, number) {
    return repo + "#" + number;
  }

  function chipGroup(attr, key) {
    document.querySelectorAll("[data-" + attr + "]").forEach((el) => {
      el.addEventListener("click", () => {
        document
          .querySelectorAll("[data-" + attr + "]")
          .forEach((o) => o.classList.toggle("on", o === el));
        state[key] = el.dataset[attr];
        if (attr === "case") state.onlyCase = !state.onlyCase;
        render();
      });
    });
  }

  function matches(p) {
    if (state.scope === "focus" && !p.focus) return false;
    if (state.state !== "all" && p.state !== state.state) return false;
    if (state.kind !== "all" && p.kind !== state.kind) return false;
    if (state.onlyCase && !CASE_MAP[caseKey(p.repo, p.number)]) return false;
    if (state.theme !== "all") {
      const c = CASE_MAP[caseKey(p.repo, p.number)];
      if (!c || c.theme !== state.theme) return false;
    }
    if (state.trk !== "all") {
      const c = CASE_MAP[caseKey(p.repo, p.number)];
      if (!c || c.track !== state.trk) return false;
    }
    if (state.q) {
      const hay = (p.title + " " + p.repo + " " + (p.files || []).join(" ") + " " + (p.summary || "")).toLowerCase();
      if (hay.indexOf(state.q.toLowerCase()) === -1) return false;
    }
    return true;
  }

  function statePill(p) {
    if (p.state === "merged") return '<span class="pill mint">merged</span>';
    if (p.state === "open") return '<span class="pill amber">open</span>';
    return '<span class="pill rose">closed</span>';
  }

  function render() {
    const list = document.getElementById("list");
    const empty = document.getElementById("empty");
    const countEl = document.getElementById("count");
    let items = DATA.prs.filter(matches);
    items.sort((a, b) =>
      state.sort === "size"
        ? b.additions + b.deletions - (a.additions + a.deletions)
        : b.createdAt.localeCompare(a.createdAt)
    );

    countEl.textContent = "共 " + items.length + " 条 · 全站 " + DATA.prs.length + " 条（" + DATA.generatedAt.slice(0, 10) + " 抓取）";
    empty.style.display = items.length ? "none" : "block";

    list.innerHTML = items
      .map((p) => {
        const c = CASE_MAP[caseKey(p.repo, p.number)];
        return (
          '<article class="pr" data-repo="' + p.repo + '" data-number="' + p.number + '">' +
          '<div class="pr-num">#' + p.number + "</div>" +
          "<div>" +
          '<div class="pr-title">' + window.escapeHtml(p.title) + "</div>" +
          '<div class="pr-meta"><span>' + p.project + "</span><span>" + p.createdAt.slice(0, 10) + "</span>" +
          "<span>" + p.kind + (p.scope ? " · " + p.scope : "") + "</span>" +
          (c ? '<span class="pill violet">学习卡片 · ' + window.escapeHtml(c.theme) + "</span>" : "") +
          "</div></div>" +
          '<div class="pr-side">' + statePill(p) +
          '<span class="add">+' + p.additions + '</span><span class="del">-' + p.deletions + "</span>" +
          "<span>" + p.changedFiles + " files</span></div>" +
          "</article>"
        );
      })
      .join("");

    list.querySelectorAll(".pr").forEach((el) => {
      el.addEventListener("click", () => openPr(el.dataset.repo, +el.dataset.number));
    });
  }

  function codeBlock(title, lines, cls) {
    if (!lines || !lines.length) return "";
    return (
      '<div class="diff"><div class="diff-head">' + window.escapeHtml(title) + "</div><pre>" +
      lines
        .map((l) => '<span class="l-' + cls + '">' + window.escapeHtml((cls === "add" ? "+ " : cls === "del" ? "- " : "  ") + l) + "</span>")
        .join("\n") +
      "</pre></div>"
    );
  }

  function openPr(repo, number) {
    const p = DATA.prs.find((x) => x.repo === repo && x.number === number);
    if (!p) return;
    const c = CASE_MAP[caseKey(repo, number)];
    const files = (p.files || []).slice(0, 12);

    let html =
      '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:6px">' +
      '<span class="pill">' + window.escapeHtml(p.repo) + "</span>" + statePill(p) +
      '<span class="pill">' + p.createdAt.slice(0, 10) + "</span>" +
      (p.mergedAt ? '<span class="pill mint">merged ' + p.mergedAt.slice(0, 10) + "</span>" : "") +
      "</div>" +
      "<h2>" + window.escapeHtml(p.title) + "</h2>" +
      '<div style="font-size:13px;color:var(--text-faint);margin-bottom:12px">' +
      '<a href="' + p.url + '" target="_blank" rel="noopener">' + p.url.replace("https://github.com/", "") + " →</a>" +
      " · <span class=\"add\">+" + p.additions + '</span> / <span class="del">-' + p.deletions + "</span> · " +
      p.changedFiles + " files</div>";

    if (p.summary) {
      html += "<h4>PR 描述</h4><p style=\"color:var(--text-dim);font-size:14px;white-space:pre-wrap\">" + window.escapeHtml(p.summary) + "</p>";
    }

    if (files.length) {
      html +=
        "<h4>改动文件</h4><div style=\"font-family:var(--mono);font-size:12.5px;color:var(--text-dim);line-height:1.9\">" +
        files.map((f) => "· " + window.escapeHtml(f)).join("<br />") +
        "</div>";
    }

    if (c) {
      html += window.caseDetailHtml(c);
    } else {
      html +=
        '<h4>学习卡片</h4><p style="color:var(--text-faint);font-size:14px">这条 PR 还没写学习卡片——可以在 <code>assets/data/lessons.js</code> 里补充。</p>';
    }

    window.openDrawer(html);
  }

  document.addEventListener("DOMContentLoaded", () => {
    ((window.LESSONS && window.LESSONS.cases) || []).forEach((c) => {
      CASE_MAP[caseKey(c.repo, c.number)] = c;
    });

    const themeSel = document.getElementById("theme");
    const themes = Array.from(new Set(Object.values(CASE_MAP).map((c) => c.theme)));
    themes.sort();
    themeSel.innerHTML =
      '<option value="all">全部知识主题</option>' +
      themes.map((t) => '<option value="' + window.escapeHtml(t) + '">' + window.escapeHtml(t) + "</option>").join("");
    themeSel.addEventListener("change", () => {
      state.theme = themeSel.value;
      render();
    });

    const q = document.getElementById("q");
    q.addEventListener("input", () => {
      state.q = q.value.trim();
      render();
    });

    chipGroup("scope", "scope");
    chipGroup("state", "state");
    chipGroup("kind", "kind");
    chipGroup("sort", "sort");
    chipGroup("trk", "trk");

    const caseChip = document.querySelector("[data-case]");
    if (caseChip) {
      caseChip.addEventListener("click", () => {
        state.onlyCase = !state.onlyCase;
        caseChip.classList.toggle("on", state.onlyCase);
        render();
      });
    }

    window.loadPRData().then((data) => {
      DATA = data;
      document.getElementById("gen-at").textContent = data.generatedAt.slice(0, 10);
      render();
    });
  });
})();
