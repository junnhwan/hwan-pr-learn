/* 专题页（Agent 篇 / K8s 篇）：播放器挂载、案例网格、模块地图交互 */

(function () {
  "use strict";

  function moduleMaps() {
    document.querySelectorAll("[data-map]").forEach((map) => {
      const out =
        (map.closest("section") || document).querySelector("[data-map-out]") ||
        document.querySelector("[data-map-out]");
      const nodes = Array.from(map.querySelectorAll("[data-mod]"));
      if (!out || !nodes.length) return;
      const show = (el) => {
        nodes.forEach((n) => n.classList.toggle("active", n === el));
        out.innerHTML =
          '<div class="step-title" style="margin-bottom:6px"><span class="step-idx">' +
          window.escapeHtml(el.dataset.mod) +
          "</span><span>" +
          window.escapeHtml(el.dataset.title || "") +
          "</span></div><p>" +
          window.escapeHtml(el.dataset.desc || "") +
          "</p>";
        out.classList.remove("fade-in");
        void out.offsetWidth;
        out.classList.add("fade-in");
      };
      nodes.forEach((n) => n.addEventListener("click", () => show(n)));
      show(nodes[0]);
    });
  }

  function tabs() {
    document.querySelectorAll("[data-tabs]").forEach((bar) => {
      const btns = Array.from(bar.querySelectorAll("[data-tab]"));
      const stage = bar.parentElement.querySelector("[data-tab-stage]");
      if (!stage) return;
      const activate = (btn) => {
        btns.forEach((b) => b.classList.toggle("on", b === btn));
        const cfg = window.LESSONS.players[btn.dataset.tab];
        stage.innerHTML = "";
        if (cfg) window.createPlayer(stage, cfg);
        stage.classList.remove("fade-in");
        void stage.offsetWidth;
        stage.classList.add("fade-in");
      };
      btns.forEach((b) => b.addEventListener("click", () => activate(b)));
      if (btns.length) activate(btns[0]);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    window.mountPlayers();
    const grid = document.getElementById("cases");
    if (grid) window.renderCaseGrid(grid, document.body.dataset.track || null);
    moduleMaps();
    tabs();
  });
})();
