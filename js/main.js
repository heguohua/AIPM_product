/* ============================================================
   AI PM Personal Site — main.js
   Interactive behaviours & animations
   ============================================================ */
(function () {
  "use strict";

  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ---------- 1. Theme toggle (persisted) ---------- */
  const root = document.documentElement;
  const savedTheme = localStorage.getItem("aipm-theme");
  if (savedTheme) root.setAttribute("data-theme", savedTheme);

  const themeToggle = $("#theme-toggle");
  themeToggle?.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem("aipm-theme", next);
  });

  /* ---------- 2. Footer year ---------- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- 3. Nav: scroll state, progress, active link ---------- */
  const nav = $("#nav");
  const progress = $("#nav-progress");
  const navLinks = $$(".nav__link");
  const sections = navLinks
    .map((a) => $(a.getAttribute("href")))
    .filter(Boolean);

  function onScroll() {
    const y = window.scrollY;

    nav.classList.toggle("is-scrolled", y > 20);

    const docH = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (docH > 0 ? (y / docH) * 100 : 0) + "%";

    // active nav link
    const pos = y + window.innerHeight * 0.32;
    let current = sections[0];
    for (const s of sections) {
      if (s.offsetTop <= pos) current = s;
    }
    navLinks.forEach((a) =>
      a.classList.toggle(
        "is-active",
        current && a.getAttribute("href") === "#" + current.id,
      ),
    );
  }

  let scrollTicking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (!scrollTicking) {
        requestAnimationFrame(onScroll);
        scrollTicking = true;
      }
    },
    { passive: true },
  );
  window.addEventListener("resize", onScroll, { passive: true });
  onScroll();

  /* ---------- 4. Mobile menu ---------- */
  const burger = $("#nav-burger");
  const links = $("#nav-links");
  const closeMenu = () => {
    burger?.classList.remove("is-open");
    links?.classList.remove("is-open");
  };
  burger?.addEventListener("click", () => {
    burger.classList.toggle("is-open");
    links.classList.toggle("is-open");
  });
  navLinks.forEach((a) => a.addEventListener("click", closeMenu));

  /* ---------- 5. Typing effect ---------- */
  const typedEl = $("#typed");
  const phrases = [
    "AI 产品经理",
    "大模型应用设计者",
    "增长实验家",
    "Agent 产品 Builder",
  ];
  if (typedEl && !prefersReduced) {
    let p = 0,
      c = 0,
      deleting = false;
    const type = () => {
      const word = phrases[p];
      typedEl.textContent = word.slice(0, c);

      if (!deleting && c < word.length) {
        c++;
        setTimeout(type, 90);
      } else if (!deleting && c === word.length) {
        deleting = true;
        setTimeout(type, 1600);
      } else if (deleting && c > 0) {
        c--;
        setTimeout(type, 45);
      } else {
        deleting = false;
        p = (p + 1) % phrases.length;
        setTimeout(type, 400);
      }
    };
    type();
  } else if (typedEl) {
    typedEl.textContent = phrases[0];
  }

  /* ---------- 6. Reveal on scroll ---------- */
  const revealObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -60px 0px" },
  );
  $$(".reveal").forEach((el, i) => {
    el.style.transitionDelay = (i % 6) * 0.06 + "s";
    revealObserver.observe(el);
  });

  /* ---------- 7. Animated counters ---------- */
  function animateCount(el) {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    const duration = 1400;
    const start = performance.now();

    function frame(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  const countObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 },
  );
  $$("[data-count]").forEach((el) => countObserver.observe(el));

  /* ---------- 8. Skill bars ---------- */
  const barObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const span = entry.target;
          setTimeout(() => (span.style.width = span.dataset.width + "%"), 150);
          obs.unobserve(span);
        }
      });
    },
    { threshold: 0.5 },
  );
  $$(".bar span").forEach((el) => barObserver.observe(el));

  /* ---------- 9. Project filters ---------- */
  const filters = $("#filters");
  const projects = $$(".project");
  filters?.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter");
    if (!btn) return;
    $$(".filter").forEach((f) => f.classList.remove("is-active"));
    btn.classList.add("is-active");

    const cat = btn.dataset.filter;
    projects.forEach((card, i) => {
      const match = cat === "all" || card.dataset.cat === cat;
      card.classList.toggle("is-hidden", !match);
      if (match) {
        card.style.animation = "none";
        // force reflow for re-animation
        void card.offsetWidth;
        card.style.animation = `fadeUp 0.5s ${i * 0.05}s var(--ease) both`;
      }
    });
  });

  // inject keyframes for filter re-animation
  const style = document.createElement("style");
  style.textContent =
    "@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}";
  document.head.appendChild(style);

  /* ---------- 10. Contact form ---------- */
  const form = $("#contact-form");
  const formMsg = $("#form-msg");
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const name = (data.get("name") || "").toString().trim();
    const email = (data.get("email") || "").toString().trim();
    const message = (data.get("message") || "").toString().trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!name || !emailOk || !message) {
      formMsg.textContent = "请填写完整信息，并检查邮箱格式是否正确。";
      formMsg.className = "form-msg err";
      return;
    }

    formMsg.textContent = `谢谢你的消息，${name}！我会尽快回复你。`;
    formMsg.className = "form-msg ok";
    form.reset();
  });

  /* ---------- 11. Background particle network ---------- */
  const canvas = $("#bg-canvas");
  if (canvas && !prefersReduced) {
    const ctx = canvas.getContext("2d");
    let w, h, particles, dpr;

    const mouse = { x: null, y: null };

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.width = window.innerWidth * dpr;
      h = canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";

      const count = Math.min(
        Math.floor((window.innerWidth * window.innerHeight) / 16000),
        90,
      );
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35 * dpr,
        vy: (Math.random() - 0.5) * 0.35 * dpr,
        r: (Math.random() * 1.6 + 0.8) * dpr,
      }));
    }

    function draw() {
      const isDark = root.getAttribute("data-theme") === "dark";
      const dotColor = isDark ? "99,132,255" : "84,87,229";
      const lineColor = isDark ? "99,132,255" : "84,87,229";

      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${dotColor},0.6)`;
        ctx.fill();
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.hypot(dx, dy);
          const max = 130 * dpr;
          if (dist < max) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(${lineColor},${(1 - dist / max) * 0.22})`;
            ctx.lineWidth = dpr * 0.6;
            ctx.stroke();
          }
        }

        if (mouse.x !== null) {
          const dx = particles[i].x - mouse.x;
          const dy = particles[i].y - mouse.y;
          const dist = Math.hypot(dx, dy);
          const max = 170 * dpr;
          if (dist < max) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(34,211,238,${(1 - dist / max) * 0.4})`;
            ctx.lineWidth = dpr * 0.8;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(draw);
    }

    window.addEventListener("mousemove", (e) => {
      mouse.x = e.clientX * dpr;
      mouse.y = e.clientY * dpr;
    });
    window.addEventListener("mouseout", () => {
      mouse.x = null;
      mouse.y = null;
    });
    window.addEventListener("resize", resize);

    let running = true;
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && running) {
        running = false;
      } else if (!document.hidden && !running) {
        running = true;
        draw();
      }
    });

    resize();
    draw();
  }
})();
