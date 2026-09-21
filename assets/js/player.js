/* 分步播放器：左边示意图 / 右边代码，逐步点亮节点与代码行并给出讲解。
 *
 * window.createPlayer(container, {
 *   title, subtitle, accent, speed,
 *   diagram: '<div class="p-row">…<div class="p-node" data-node="id">…</div>…</div>',
 *   code: { file: 'path', lines: ['…'], marks: { 12: 'add' } },
 *   steps: [{ node: 'id' | ['a','b'], lines: [3,4], title, note }]
 * })
 */

(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const players = [];

  function buildCode(code) {
    if (!code) return "";
    const marks = code.marks || {};
    const body = code.lines
      .map((text, i) => {
        const n = i + 1;
        const mark = marks[n] ? " " + marks[n] : "";
        return (
          '<div class="cl' + mark + '" data-line="' + n + '">' +
          '<span class="ln">' + n + "</span><span>" +
          window.escapeHtml(text) +
          "</span></div>"
        );
      })
      .join("");
    return (
      '<div class="code"><div class="code-bar"><span class="dots"><span></span><span></span><span></span></span>' +
      window.escapeHtml(code.file || "") +
      '</div><div class="code-body">' + body + "</div></div>"
    );
  }

  function build(cfg) {
    const accent = cfg.accent || "var(--violet)";
    return (
      '<div class="player-head"><div style="flex:1 1 300px"><h3>' +
      window.escapeHtml(cfg.title || "") +
      "</h3><p>" +
      window.escapeHtml(cfg.subtitle || "") +
      '</p></div><div class="ctrl-meta" data-meta></div></div>' +
      '<div class="stage' + (cfg.code ? "" : " stage-wide") + '">' +
      '<div class="diagram" style="--accent:' + accent + '">' +
      (cfg.diagram || "") +
      (cfg.diagramNote ? '<div class="diagram-note">' + cfg.diagramNote + "</div>" : "") +
      "</div>" +
      buildCode(cfg.code) +
      "</div>" +
      '<div class="player-note"><div class="step-title"><span class="step-idx" data-idx></span><span data-title></span></div><p data-note></p></div>' +
      '<div class="player-ctrl">' +
      '<button class="ctrl-btn" data-prev aria-label="上一步">&#10094;</button>' +
      '<button class="ctrl-btn play" data-play aria-label="播放/暂停">&#9658;</button>' +
      '<button class="ctrl-btn" data-next aria-label="下一步">&#10095;</button>' +
      '<div class="seg" data-seg></div>' +
      "</div>"
    );
  }

  window.createPlayer = function (container, cfg) {
    const steps = cfg.steps || [];
    if (!steps.length) return null;
    container.className = "player";
    container.innerHTML = build(cfg);

    const nodes = Array.from(container.querySelectorAll("[data-node]"));
    const lines = Array.from(container.querySelectorAll(".cl"));
    const seg = container.querySelector("[data-seg]");
    const meta = container.querySelector("[data-meta]");
    const titleEl = container.querySelector("[data-title]");
    const noteEl = container.querySelector("[data-note]");
    const idxEl = container.querySelector("[data-idx]");
    const playBtn = container.querySelector("[data-play]");
    const speed = cfg.speed || 2800;

    seg.innerHTML = steps
      .map((_, i) => '<button data-step="' + i + '" aria-label="第 ' + (i + 1) + ' 步"></button>')
      .join("");
    const segBtns = Array.from(seg.children);

    let cur = -1;
    let timer = null;
    let playing = false;

    // 记录被动态改写的元素（fill 宽度 / cls 类名），每步先复位
    const clsTargets = new Map();
    steps.forEach((s) => {
      (s.cls || []).forEach(([sel]) => {
        container.querySelectorAll(sel).forEach((el) => {
          if (!clsTargets.has(el)) clsTargets.set(el, el.className);
        });
      });
    });

    function render(i) {
      cur = i;
      const step = steps[i];
      const activeNodes = [].concat(step.node || []);

      clsTargets.forEach((original, el) => {
        el.className = original;
      });
      (step.cls || []).forEach(([sel, cls]) => {
        container.querySelectorAll(sel).forEach((el) => {
          el.className = cls;
        });
      });
      (step.fill || []).forEach(([sel, width]) => {
        container.querySelectorAll(sel).forEach((el) => {
          el.style.width = width;
        });
      });

      nodes.forEach((n) => {
        n.classList.toggle("active", activeNodes.indexOf(n.dataset.node) !== -1);
      });
      container.querySelectorAll(".p-conn").forEach((c) => c.classList.toggle("on", !!step.wire));

      const lineSet = step.lines || [];
      lines.forEach((l) => l.classList.toggle("on", lineSet.indexOf(+l.dataset.line) !== -1));
      if (lineSet.length) {
        const first = container.querySelector('.cl[data-line="' + lineSet[0] + '"]');
        if (first) {
          const box = first.closest(".code-body");
          if (box) {
            const top = first.offsetTop - box.clientHeight / 2 + first.clientHeight;
            box.scrollTo({ top: Math.max(0, top), behavior: reduceMotion ? "auto" : "smooth" });
          }
        }
      }

      titleEl.textContent = step.title || "";
      noteEl.innerHTML = step.note || "";
      idxEl.textContent = (i + 1) + " / " + steps.length;
      meta.textContent = (i + 1) + " / " + steps.length;

      const wrap = container.querySelector(".player-note");
      wrap.classList.remove("fade-in");
      void wrap.offsetWidth;
      wrap.classList.add("fade-in");

      segBtns.forEach((b, bi) => {
        b.classList.toggle("cur", bi === i);
        b.classList.toggle("done", bi < i);
      });
    }

    function go(i) {
      render(((i % steps.length) + steps.length) % steps.length);
    }

    function play() {
      if (timer) clearInterval(timer);
      playing = true;
      playBtn.innerHTML = "&#10073;&#10073;";
      timer = setInterval(() => go(cur + 1), speed);
    }

    function pause() {
      playing = false;
      if (timer) clearInterval(timer);
      timer = null;
      playBtn.innerHTML = "&#9658;";
    }

    playBtn.addEventListener("click", () => (playing ? pause() : play()));
    container.querySelector("[data-prev]").addEventListener("click", () => {
      pause();
      go(cur - 1);
    });
    container.querySelector("[data-next]").addEventListener("click", () => {
      pause();
      go(cur + 1);
    });
    segBtns.forEach((b) =>
      b.addEventListener("click", () => {
        pause();
        go(+b.dataset.step);
      })
    );

    render(0);
    playBtn.innerHTML = "&#9658;";

    const api = { play, pause, go, index: () => cur };
    players.push({ el: container, api });

    // 进入视口自动播放一次；离开视口暂停
    if (!reduceMotion && "IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              if (!playing) play();
            } else if (playing) {
              pause();
            }
          });
        },
        { threshold: 0.25 }
      );
      io.observe(container);
    }

    return api;
  };

  /* 通用抽屉（PR 详情） */
  window.openDrawer = function (html) {
    let mask = document.querySelector(".drawer-mask");
    let drawer = document.querySelector(".drawer");
    if (!drawer) {
      mask = document.createElement("div");
      mask.className = "drawer-mask";
      drawer = document.createElement("aside");
      drawer.className = "drawer";
      document.body.appendChild(mask);
      document.body.appendChild(drawer);
      mask.addEventListener("click", window.closeDrawer);
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") window.closeDrawer();
      });
    }
    drawer.innerHTML =
      '<button class="ctrl-btn close" onclick="window.closeDrawer()" aria-label="关闭">&#10005;</button>' + html;
    drawer.classList.add("open");
    mask.classList.add("open");
    drawer.scrollTop = 0;
    document.body.style.overflow = "hidden";
  };

  window.closeDrawer = function () {
    const drawer = document.querySelector(".drawer");
    const mask = document.querySelector(".drawer-mask");
    if (drawer) drawer.classList.remove("open");
    if (mask) mask.classList.remove("open");
    document.body.style.overflow = "";
  };
})();
