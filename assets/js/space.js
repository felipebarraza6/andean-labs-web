/**
 * Andean Labs — ambient space / circuit field
 * Lightweight canvas layer: parallax scroll + subtle pointer reaction.
 * Respects prefers-reduced-motion, visibility, and device capability.
 */
(function () {
  'use strict';

  const canvas = document.getElementById('space-bg');
  const progressEl = document.getElementById('scroll-progress');
  if (!canvas || !canvas.getContext) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  let reducedMotion = false;
  try {
    reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (_) {
    reducedMotion = false;
  }

  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ||
    (window.matchMedia && window.matchMedia('(max-width: 720px)').matches);

  const mem = navigator.deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  const lowPower = mem <= 2 || cores <= 2 || isMobile;

  const MAX_DPR = lowPower ? 1 : 1.5;
  let dpr = 1;
  let w = 0;
  let h = 0;
  let nodes = [];
  let raf = 0;
  let running = false;
  let visible = !document.hidden;
  let scrollY = window.scrollY || 0;
  let targetPointer = { x: 0.5, y: 0.4 };
  let pointer = { x: 0.5, y: 0.4 };
  let gyro = { x: 0, y: 0 };
  let lastTs = 0;

  const COLORS = {
    node: 'rgba(143, 184, 168, 0.7)',
    nodeBright: 'rgba(224, 137, 90, 0.65)',
    link: 'rgba(111, 154, 137, 0.55)',
    spark: 'rgba(224, 137, 90, 0.4)',
    star: 'rgba(242, 239, 232, 0.28)'
  };

  function nodeCount() {
    if (reducedMotion) return 0;
    const area = (window.innerWidth * window.innerHeight) / 1000;
    let n = Math.round(area * (lowPower ? 0.035 : 0.055));
    n = Math.max(lowPower ? 18 : 28, Math.min(lowPower ? 42 : 72, n));
    return n;
  }

  function makeNodes(count) {
    const list = [];
    for (let i = 0; i < count; i++) {
      const deep = Math.random();
      list.push({
        x: Math.random(),
        y: Math.random(),
        z: 0.25 + deep * 0.75,
        r: 0.6 + Math.random() * 1.8,
        vx: (Math.random() - 0.5) * 0.00012,
        vy: (Math.random() - 0.5) * 0.00012,
        pulse: Math.random() * Math.PI * 2,
        kind: Math.random() > 0.82 ? 'copper' : 'patina'
      });
    }
    return list;
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = nodeCount();
    if (!nodes.length || Math.abs(nodes.length - count) > 8) {
      nodes = makeNodes(count);
    }
    if (reducedMotion) drawStatic();
  }

  function project(n) {
    const parallax = scrollY * 0.00018 * n.z;
    const px = (pointer.x - 0.5) * 0.04 * n.z;
    const py = (pointer.y - 0.5) * 0.03 * n.z;
    const gx = gyro.x * 0.03 * n.z;
    const gy = gyro.y * 0.03 * n.z;
    return {
      x: (n.x + px + gx) * w,
      y: ((n.y + parallax + py + gy) % 1.15) * h * 1.05 - h * 0.02
    };
  }

  function drawFrame(ts) {
    if (!running || !visible) return;
    const dt = Math.min(32, ts - (lastTs || ts));
    lastTs = ts;

    pointer.x += (targetPointer.x - pointer.x) * 0.06;
    pointer.y += (targetPointer.y - pointer.y) * 0.06;

    ctx.clearRect(0, 0, w, h);

    const positions = nodes.map(project);
    const linkDist = lowPower ? 120 : 155;

    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = positions[i];
        const b = positions[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > linkDist) continue;
        const alpha = (1 - dist / linkDist) * 0.55 * Math.min(nodes[i].z, nodes[j].z);
        ctx.strokeStyle = 'rgba(111, 154, 137,' + (alpha * 0.65).toFixed(3) + ')';
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const p = positions[i];
      n.pulse += dt * 0.0012;
      n.x += n.vx * dt;
      n.y += n.vy * dt;
      if (n.x < -0.05) n.x = 1.05;
      if (n.x > 1.05) n.x = -0.05;
      if (n.y < -0.05) n.y = 1.05;
      if (n.y > 1.05) n.y = -0.05;

      const glow = 0.55 + Math.sin(n.pulse) * 0.25;
      const r = n.r * (0.7 + n.z * 0.6);
      ctx.beginPath();
      ctx.fillStyle = n.kind === 'copper' ? COLORS.nodeBright : COLORS.node;
      ctx.globalAlpha = glow;
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();

      if (!lowPower && n.kind === 'copper') {
        ctx.beginPath();
        ctx.fillStyle = COLORS.spark;
        ctx.globalAlpha = glow * 0.35;
        ctx.arc(p.x, p.y, r * 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    raf = requestAnimationFrame(drawFrame);
  }

  function drawStatic() {
    ctx.clearRect(0, 0, w, h);
    if (!nodes.length) nodes = makeNodes(Math.min(24, nodeCount() || 24));
    const positions = nodes.map(project);
    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < Math.min(nodes.length, i + 6); j++) {
        const a = positions[i];
        const b = positions[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 120) continue;
        ctx.strokeStyle = 'rgba(111, 154, 137, 0.18)';
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      const p = positions[i];
      const n = nodes[i];
      ctx.beginPath();
      ctx.fillStyle = n.kind === 'copper' ? 'rgba(192, 113, 61, 0.28)' : 'rgba(111, 154, 137, 0.32)';
      ctx.arc(p.x, p.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function start() {
    if (running || reducedMotion || !visible) return;
    running = true;
    lastTs = 0;
    raf = requestAnimationFrame(drawFrame);
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function updateProgress() {
    if (!progressEl) return;
    const doc = document.documentElement;
    const max = Math.max(1, doc.scrollHeight - window.innerHeight);
    const pct = Math.min(1, Math.max(0, window.scrollY / max));
    progressEl.style.transform = 'scaleX(' + pct + ')';
    progressEl.setAttribute('aria-valuenow', String(Math.round(pct * 100)));
  }

  function onScroll() {
    scrollY = window.scrollY || 0;
    updateProgress();
    document.documentElement.classList.toggle('is-scrolled', scrollY > 24);
    if (reducedMotion) drawStatic();
  }

  function onPointer(e) {
    if (reducedMotion || isMobile) return;
    targetPointer.x = e.clientX / Math.max(1, w);
    targetPointer.y = e.clientY / Math.max(1, h);
  }

  function onOrientation(e) {
    if (reducedMotion || !isMobile) return;
    const beta = e.beta || 0;
    const gamma = e.gamma || 0;
    gyro.x = Math.max(-1, Math.min(1, gamma / 45));
    gyro.y = Math.max(-1, Math.min(1, (beta - 45) / 45));
  }

  function onVisibility() {
    visible = !document.hidden;
    if (visible) {
      if (reducedMotion) drawStatic();
      else start();
    } else {
      stop();
    }
  }

  // Logo entrance (CSS-driven); ensure class after paint
  function initLogo() {
    requestAnimationFrame(function () {
      document.documentElement.classList.add('logo-ready');
    });
  }

  resize();
  updateProgress();
  initLogo();

  if (reducedMotion) {
    document.documentElement.classList.add('space-static');
    drawStatic();
  } else {
    start();
  }

  window.addEventListener('resize', function () {
    stop();
    resize();
    if (!reducedMotion && visible) start();
  }, { passive: true });

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('pointermove', onPointer, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);

  if (isMobile && window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', onOrientation, { passive: true });
  }
})();
