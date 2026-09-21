/* 首页：统计数据、仓库分布、最新 PR、示例播放器 */

(function () {
  "use strict";

  function setCount(el, value) {
    el.dataset.count = value;
    el.textContent = "0";
    // 触发 common.js 的 count-up 逻辑
    const start = performance.now();
    const duration = 1100;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      el.textContent = Math.round(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function renderStats(data) {
    const merged = data.prs.filter((p) => p.state === "merged").length;
    const focusRepos = data.repos.filter((r) => r.focus).length;
    const cases = (window.LESSONS && window.LESSONS.cases) || [];
    const points = cases.reduce((sum, c) => sum + (c.knowledge ? c.knowledge.length : 0), 0);
    const stats = document.querySelectorAll("#stats [data-count]");
    if (stats.length === 4) {
      setCount(stats[0], merged);
      setCount(stats[1], focusRepos);
      setCount(stats[2], cases.length);
      setCount(stats[3], points);
    }
  }

  function renderRepoBars(data) {
    const box = document.getElementById("repo-bars");
    if (!box) return;
    const repos = data.repos
      .filter((r) => r.count > 1)
      .sort((a, b) => b.count - a.count)
      .slice(0, 7);
    const max = repos[0] ? repos[0].count : 1;
    box.innerHTML = repos
      .map((r) => {
        const pct = Math.max(6, Math.round((r.count / max) * 100));
        const accent = r.focus ? "linear-gradient(90deg,var(--violet),var(--cyan))" : "";
        return (
          '<div class="bar-row"><span>' +
          window.escapeHtml(r.label) +
          (r.focus ? ' <span class="pill violet" style="padding:1px 6px">主线</span>' : "") +
          '</span><div class="bar"><i style="width:' +
          pct +
          "%;" +
          (accent ? "background:" + accent + ";" : "") +
          '"></i></div><b style="font-size:12px">' +
          r.count +
          "</b></div>"
        );
      })
      .join("");
  }

  function renderRecent(data) {
    const box = document.getElementById("recent");
    if (!box) return;
    const items = data.prs.filter((p) => p.focus).slice(0, 6);
    box.innerHTML = items
      .map((p) => {
        const state =
          p.state === "merged"
            ? '<span class="pill mint">merged</span>'
            : p.state === "open"
            ? '<span class="pill amber">open</span>'
            : '<span class="pill rose">closed</span>';
        return (
          '<div style="display:flex;gap:10px;align-items:baseline;padding:7px 0;border-bottom:1px solid var(--line)">' +
          '<span style="font-family:var(--mono);font-size:12px;color:var(--text-faint);min-width:74px">' +
          p.createdAt.slice(0, 10) +
          "</span>" +
          '<a href="' + p.url + '" target="_blank" rel="noopener" style="font-size:13.5px;flex:1">' +
          window.escapeHtml(p.title) +
          "</a>" + state + "</div>"
        );
      })
      .join("");
  }

  document.addEventListener("DOMContentLoaded", () => {
    const demo = document.getElementById("demo-player");
    if (demo && window.LESSONS && window.LESSONS.players.k8sDeployment) {
      window.createPlayer(demo, window.LESSONS.players.k8sDeployment);
    }
    window.loadPRData().then((data) => {
      renderStats(data);
      renderRepoBars(data);
      renderRecent(data);
    });
  });
})();
