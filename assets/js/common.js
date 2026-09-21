/* 全站通用交互：滚动进度、导航、出场动画、数字滚动、卡片光斑、流程动画 */

(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 滚动进度条 ---------- */
  function scrollProgress() {
    const bar = document.querySelector(".scroll-progress");
    if (!bar) return;
    const update = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      bar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + "%";
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  /* ---------- 导航 ---------- */
  function nav() {
    const toggle = document.querySelector(".nav-toggle");
    const links = document.querySelector(".nav-links");
    if (toggle && links) {
      toggle.addEventListener("click", () => links.classList.toggle("open"));
      links.addEventListener("click", (e) => {
        if (e.target.closest("a")) links.classList.remove("open");
      });
    }
    const here = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav-link").forEach((a) => {
      if (a.getAttribute("href") === here) a.classList.add("active");
    });
  }

  /* ---------- 出场动画 ---------- */
  function reveal() {
    const items = document.querySelectorAll(".reveal");
    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px" }
    );
    items.forEach((el) => io.observe(el));
  }

  /* ---------- 数字滚动 ---------- */
  function counters() {
    const nodes = document.querySelectorAll("[data-count]");
    if (!nodes.length) return;
    const run = (el) => {
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || "";
      if (reduceMotion) {
        el.textContent = target + suffix;
        return;
      }
      const duration = 1100;
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    if (!("IntersectionObserver" in window)) {
      nodes.forEach(run);
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          run(entry.target);
          io.unobserve(entry.target);
        }
      });
    });
    nodes.forEach((el) => io.observe(el));
  }

  /* ---------- 卡片光标光斑 ---------- */
  function spotlight() {
    document.querySelectorAll(".card, .stat, .mini").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", (e.clientX - r.left) + "px");
        card.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
    });
  }

  /* ---------- 简易流程动画（hero 等） ---------- */
  function flows() {
    document.querySelectorAll("[data-flow]").forEach((root) => {
      const nodes = Array.from(root.querySelectorAll(".flow-node"));
      const wires = Array.from(root.querySelectorAll(".flow-wire"));
      if (!nodes.length) return;
      let i = 0;
      const step = () => {
        nodes.forEach((n, idx) => n.classList.toggle("lit", idx === i));
        wires.forEach((w, idx) => {
          w.classList.remove("run");
          if (idx === i) {
            void w.offsetWidth;
            w.classList.add("run");
          }
        });
        i = (i + 1) % nodes.length;
      };
      step();
      if (reduceMotion) return;
      let timer = setInterval(step, 1500);
      // 页面不可见时暂停，省电
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          clearInterval(timer);
        } else {
          timer = setInterval(step, 1500);
        }
      });
    });
  }

  /* ---------- PR 数据加载（带缓存） ---------- */
  let prCache = null;
  window.loadPRData = function () {
    if (prCache) return Promise.resolve(prCache);
    return fetch("assets/data/prs.json", { cache: "no-cache" })
      .then((r) => {
        if (!r.ok) throw new Error("无法加载 PR 数据：" + r.status);
        return r.json();
      })
      .then((data) => {
        prCache = data;
        return data;
      });
  };

  window.escapeHtml = function (str) {
    return String(str == null ? "" : str).replace(/[&<>"']/g, (c) => {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };

  document.addEventListener("DOMContentLoaded", () => {
    scrollProgress();
    nav();
    reveal();
    counters();
    spotlight();
    flows();
  });
})();
