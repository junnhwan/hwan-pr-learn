/* 学习卡片的统一渲染（PR 抽屉与专题页共用） */

(function () {
  "use strict";

  function codeBlock(title, lines, cls) {
    if (!lines || !lines.length) return "";
    return (
      '<div class="diff"><div class="diff-head">' + window.escapeHtml(title) + "</div><pre>" +
      lines
        .map((l) => {
          const sign = cls === "add" ? "+ " : cls === "del" ? "- " : "  ";
          return '<span class="l-' + cls + '">' + window.escapeHtml(sign + l) + "</span>";
        })
        .join("\n") +
      "</pre></div>"
    );
  }

  window.caseDetailHtml = function (c) {
    let html =
      '<h4>学习卡片 · <span class="pill violet">' + window.escapeHtml(c.theme) + "</span></h4>" +
      '<p style="font-size:15.5px;font-weight:650;margin:8px 0 12px">' + window.escapeHtml(c.title) + "</p>" +
      '<p style="color:var(--text-dim);font-size:14px"><b>现象：</b>' + window.escapeHtml(c.problem) + "</p>" +
      '<p style="color:var(--text-dim);font-size:14px"><b>根因：</b>' + window.escapeHtml(c.root) + "</p>" +
      '<p style="color:var(--text-dim);font-size:14px"><b>修法：</b>' + window.escapeHtml(c.fix) + "</p>" +
      codeBlock((c.code && c.code.file ? c.code.file : "diff") + " · 修改前", c.code && c.code.before, "del") +
      codeBlock((c.code && c.code.file ? c.code.file : "diff") + " · 修改后", c.code && c.code.after, "add") +
      "<h4>知识点</h4><ul>" +
      (c.knowledge || [])
        .map((k) => "<li><b>" + window.escapeHtml(k.t) + "</b> — " + window.escapeHtml(k.d) + "</li>")
        .join("") +
      "</ul>" +
      '<p style="margin-top:14px;font-size:14px"><b>可迁移经验：</b>' + window.escapeHtml(c.takeaway) + "</p>" +
      '<p style="margin-top:10px;font-size:13.5px"><a href="' + c.url + '" target="_blank" rel="noopener">在 GitHub 上查看 #' + c.number + " →</a></p>";

    const related = ((window.LESSONS && window.LESSONS.cases) || []).filter(
      (x) => (c.related || []).indexOf(x.id) !== -1
    );
    if (related.length) {
      html +=
        "<h4>相关案例</h4><ul>" +
        related
          .map(
            (r) =>
              '<li><a href="#" data-open-case="' + r.id + '">#' + r.number + " " + window.escapeHtml(r.title) + "</a></li>"
          )
          .join("") +
        "</ul>";
    }
    return html;
  };

  /* 打开一个案例（自动带上它的 PR 元信息） */
  window.openCase = function (id, prMeta) {
    const c = ((window.LESSONS && window.LESSONS.cases) || []).find((x) => x.id === id);
    if (!c) return;
    const pill =
      c.state === "merged"
        ? '<span class="pill mint">merged</span>'
        : c.state === "open"
        ? '<span class="pill amber">open</span>'
        : '<span class="pill rose">closed</span>';
    const head =
      '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px">' +
      '<span class="pill">' + window.escapeHtml(c.repo) + "</span>" + pill +
      '<span class="pill">' + c.date + "</span></div>";
    const meta = prMeta ? prMeta : "";
    window.openDrawer(head + meta + window.caseDetailHtml(c));
  };

  /* 卡片列表：把某条主线的案例渲染成网格 */
  window.renderCaseGrid = function (container, track) {
    if (!container) return;
    const cases = ((window.LESSONS && window.LESSONS.cases) || []).filter((c) => !track || c.track === track);
    container.innerHTML = cases
      .map(
        (c) =>
          '<article class="card ' + (c.track === "k8s" ? "track-k8s" : "track-agent") + ' reveal" data-case-card="' + c.id + '">' +
          '<span class="pill ' + (c.track === "k8s" ? "sky" : "violet") + '"><span class="dotmark"></span>' +
          window.escapeHtml(c.theme) + "</span>" +
          '<h3 style="margin:12px 0 8px">' + window.escapeHtml(c.title) + "</h3>" +
          "<p>" + window.escapeHtml(c.takeaway) + "</p>" +
          '<div style="display:flex;gap:8px;align-items:center;margin-top:14px;flex-wrap:wrap">' +
          '<span style="font-family:var(--mono);font-size:12px;color:var(--text-faint)">#' + c.number + "</span>" +
          (c.state === "merged"
            ? '<span class="pill mint">merged</span>'
            : '<span class="pill amber">' + c.state + "</span>") +
          '<span class="pill" style="margin-left:auto">展开 →</span>' +
          "</div></article>"
      )
      .join("");

    container.querySelectorAll("[data-case-card]").forEach((el) => {
      el.addEventListener("click", () => window.openCase(el.dataset.caseCard));
    });
  };

  // 抽屉内跳转到另一个案例
  document.addEventListener("click", (e) => {
    const link = e.target.closest("[data-open-case]");
    if (link) {
      e.preventDefault();
      window.openCase(link.dataset.openCase);
    }
  });

  /* 挂载页面里的播放器 */
  window.mountPlayers = function () {
    document.querySelectorAll("[data-player]").forEach((el) => {
      const cfg = window.LESSONS.players[el.dataset.player];
      if (cfg) window.createPlayer(el, cfg);
    });
  };
})();
