(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* entrada escalonada */
  document.querySelectorAll('.reveal').forEach((el, i) => {
    setTimeout(() => el.classList.add('visible'), 120 + i * 70);
  });

  /* relogio de Sao Luis no canto */
  const clock = document.querySelector('[data-clock]');
  const tick = () => {
    clock.textContent = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Fortaleza' }).format(new Date());
  };
  tick();
  setInterval(tick, 15000);

  /* toast */
  const toast = document.querySelector('.toast');
  let toastTimer;
  const showToast = (msg) => {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  };

  /* copiar numero */
  const copyBtn = document.querySelector('[data-copy]');
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(copyBtn.dataset.copy);
      showToast('Numero copiado');
    } catch {
      showToast('(98) 97028-6636');
    }
  });

  /* compartilhar */
  document.querySelector('[data-share]').addEventListener('click', async () => {
    const data = { title: 'ENTROPY', text: 'Estudio digital independente ENTROPY', url: location.href };
    if (navigator.share) {
      try { await navigator.share(data); } catch { /* cancelado */ }
      return;
    }
    try {
      await navigator.clipboard.writeText(location.href);
      showToast('Link copiado');
    } catch {
      showToast(location.href);
    }
  });

  /* salvar contato (vCard) */
  document.querySelector('[data-vcard]').addEventListener('click', () => {
    const vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      'FN:ENTROPY',
      'ORG:ENTROPY Digital Studio',
      'TEL;TYPE=CELL,VOICE:+5598970286636',
      'URL:https://entropytech.vercel.app',
      'NOTE:Sites, sistemas, automacoes, e-commerces e projetos 3D.',
      'END:VCARD'
    ].join('\r\n');
    const url = URL.createObjectURL(new Blob([vcard], { type: 'text/vcard' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: 'entropy.vcf' });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('Contato baixado');
  });

  /* ---------- particulas: caos que vira vortice em volta da logo ---------- */
  const canvas = document.querySelector('.entropy-canvas');
  const ctx = canvas.getContext('2d');
  const logo = document.querySelector('.logo-wrap');
  let w, h, dpr, cx, cy, particles = [];
  const pointer = { x: -9999, y: -9999 };

  const COUNT = () => Math.round(Math.min(260, (window.innerWidth * window.innerHeight) / 5200));

  function center() {
    const r = logo.getBoundingClientRect();
    cx = r.left + r.width / 2;
    cy = r.top + r.height / 2;
  }

  function makeParticle() {
    const angle = Math.random() * Math.PI * 2;
    const radius = 90 + Math.pow(Math.random(), .7) * Math.max(w, h) * .55;
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      vx: 0, vy: 0,
      angle, radius,
      speed: (.0009 + Math.random() * .0022) * (Math.random() < .5 ? 1 : 1.4),
      size: .8 + Math.random() * 2.6,
      rot: Math.random() * Math.PI,
      spin: (Math.random() - .5) * .04,
      shade: 90 + Math.floor(Math.random() * 160),
      seed: Math.random() * 1000
    };
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    center();
    const n = COUNT();
    while (particles.length < n) particles.push(makeParticle());
    particles.length = n;
  }

  // estilhaco: triangulo irregular, igual a logo
  function shard(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = `rgba(${p.shade},${p.shade},${p.shade - 2},${.35 + p.size / 6})`;
    ctx.beginPath();
    ctx.moveTo(0, -p.size * 1.8);
    ctx.lineTo(p.size, p.size);
    ctx.lineTo(-p.size * .7, p.size * .6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // ordem: 0 = caos, 1 = vortice. Oscila devagar.
  let order = reduceMotion ? 1 : 0;
  let t = 0;

  function step() {
    t += 1;
    if (!reduceMotion) {
      const cycle = (Math.sin(t * .0035 - Math.PI / 2) + 1) / 2; // 0..1
      order += (Math.min(1, cycle * 1.4) - order) * .03;
    }

    ctx.clearRect(0, 0, w, h);

    // halo claro atras da logo
    const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, 220);
    halo.addColorStop(0, `rgba(244,244,242,${.05 + order * .07})`);
    halo.addColorStop(1, 'rgba(244,244,242,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(cx - 220, cy - 220, 440, 440);

    for (const p of particles) {
      p.angle += p.speed * (1 + order * 2.2) * (140 / (p.radius * .6 + 40)) * 3;

      // alvo no vortice (elipse com leve inclinacao 3D)
      const tilt = .55;
      const tx = cx + Math.cos(p.angle) * p.radius;
      const ty = cy + Math.sin(p.angle) * p.radius * tilt;

      // campo de fluxo do caos
      const n = Math.sin(p.x * .004 + p.seed + t * .004) + Math.cos(p.y * .005 - t * .003);
      const fx = Math.cos(n * Math.PI) * .25;
      const fy = Math.sin(n * Math.PI) * .25;

      p.vx += (tx - p.x) * .0028 * order + fx * (1 - order);
      p.vy += (ty - p.y) * .0028 * order + fy * (1 - order);

      // cursor empurra
      const dx = p.x - pointer.x, dy = p.y - pointer.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 14000) {
        const f = (14000 - d2) / 14000 * 1.6;
        const d = Math.sqrt(d2) || 1;
        p.vx += dx / d * f;
        p.vy += dy / d * f;
      }

      p.vx *= .93;
      p.vy *= .93;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.spin + (p.vx * .01);

      // reaparece do outro lado no caos
      if (p.x < -20) p.x = w + 20;
      if (p.x > w + 20) p.x = -20;
      if (p.y < -20) p.y = h + 20;
      if (p.y > h + 20) p.y = -20;

      shard(p);
    }
  }

  let raf;
  function loop() {
    step();
    raf = requestAnimationFrame(loop);
  }

  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('scroll', center, { passive: true });
  window.addEventListener('pointermove', (e) => { pointer.x = e.clientX; pointer.y = e.clientY; }, { passive: true });
  window.addEventListener('pointerleave', () => { pointer.x = pointer.y = -9999; });

  if (reduceMotion) {
    // vortice estatico
    for (const p of particles) {
      p.x = cx + Math.cos(p.angle) * p.radius;
      p.y = cy + Math.sin(p.angle) * p.radius * .55;
    }
    step();
  } else {
    loop();
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else loop();
    });
  }
})();
