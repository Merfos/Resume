(function () {
  const root = document.documentElement;
  const body = document.body;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- Work grid ---------- */
  function media(p) {
    if (!p.media) return "";
    if (p.media.type === "video") {
      const poster = p.media.poster ? ` poster="${p.media.poster}"` : "";
      const play = reduceMotion.matches ? 'preload="none"' : 'autoplay muted loop playsinline preload="metadata"';
      return `<video ${play}${poster}><source src="${p.media.src}" /></video>`;
    }
    return `<img src="${p.media.src}" alt="" loading="lazy" />`;
  }

  function pills(p) {
    if (!p.tags || !p.tags.length) return "";
    return `<div class="pills">${p.tags.map((t) => `<span>${t}</span>`).join("")}</div>`;
  }

  function card(p) {
    return `
      <a class="card" href="${p.href}" aria-label="${p.title} — ${p.date}">
        <div class="thumb" style="--ratio:${p.ratio};--ph:${p.ph}">${media(p)}${pills(p)}</div>
        <div class="meta">
          <span class="title">${p.title}: ${p.desc}</span>
          <span class="year">${p.date}</span>
        </div>
      </a>`;
  }

  const cols = {
    left: document.querySelector('.col[data-col="left"]'),
    right: document.querySelector('.col[data-col="right"]'),
  };
  (window.PROJECTS || PROJECTS).forEach((p) => {
    (cols[p.col] || cols.left).insertAdjacentHTML("beforeend", card(p));
  });

  /* ---------- Footer year + clock ---------- */
  document.getElementById("year").textContent = new Date().getFullYear();

  const TIME_ZONE = "America/New_York"; // the city shown in the top bar
  const CITY = "New York";
  const clock = document.getElementById("clock");
  const fmt = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: TIME_ZONE });
  function tick() { clock.textContent = `${CITY}, ${fmt.format(new Date())}`; }
  tick();
  setInterval(tick, 15000);

  /* ---------- Click email to copy ---------- */
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.setAttribute("role", "status");
  body.appendChild(toast);
  let toastTimer = 0;

  document.querySelectorAll(".js-copy-email").forEach((a) => {
    a.addEventListener("click", (e) => {
      const email = a.dataset.email;
      if (!navigator.clipboard) return; // fall back to mailto
      e.preventDefault();
      navigator.clipboard.writeText(email).then(() => {
        toast.textContent = `Copied ${email}`;
        toast.classList.add("show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
      }, () => { location.href = a.href; });
    });
  });

  /* ---------- Intro: ink the mark, then glide to the work ---------- */
  const intro = document.getElementById("intro");
  if (!intro || root.classList.contains("no-intro")) {
    body.classList.remove("in-intro");
    return;
  }

  const WAIT = 500, FILL = 2200, HOLD = 400;
  let raf = 0, timer = 0, finished = false;

  function setFill(v) {
    root.style.setProperty("--fill", v * 100 + "%");
    body.classList.toggle("in-intro", v < 0.92);
  }

  function goToWork() {
    document.getElementById("work").scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth" });
  }

  function finish(glide) {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(raf);
    clearTimeout(timer);
    setFill(1);
    try { localStorage.setItem("introSeenAt", String(Date.now())); } catch (e) {}
    // only move the visitor if they haven't scrolled away already
    if (glide && window.scrollY < intro.offsetHeight / 2) goToWork();
  }

  function run() {
    const start = performance.now();
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const frame = (now) => {
      const t = Math.min(1, (now - start) / FILL);
      setFill(ease(t));
      if (t < 1) raf = requestAnimationFrame(frame);
      else timer = setTimeout(() => finish(true), HOLD);
    };
    raf = requestAnimationFrame(frame);
  }

  intro.querySelector(".intro__mark").addEventListener("click", (e) => {
    e.preventDefault();
    finish(false);
    goToWork();
  });

  // once the intro has scrolled out of view, show the top bar regardless
  window.addEventListener("scroll", () => {
    if (window.scrollY > intro.offsetHeight * 0.6) body.classList.remove("in-intro");
  }, { passive: true });

  if (reduceMotion.matches) { finish(false); return; }
  setFill(0);
  timer = setTimeout(run, WAIT);
})();
