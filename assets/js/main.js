/* =========================================================
   Pablo's TAPAS Gastrobar - interakcje i animacje
   ========================================================= */
(() => {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

  document.body.classList.add("is-loading");
  $(".js-year").textContent = new Date().getFullYear();

  /* ---------- Godziny otwarcia (czas Warszawy) ---------- */
  // 0 = niedziela; [otwarcie, zamknięcie] w minutach od północy
  const HOURS = {
    0: [12 * 60, 21 * 60 + 30],
    1: [12 * 60, 22 * 60], 2: [12 * 60, 22 * 60], 3: [12 * 60, 22 * 60], 4: [12 * 60, 22 * 60],
    5: [12 * 60, 23 * 60], 6: [12 * 60, 23 * 60]
  };
  const fmt = m => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

  function warsawNow() {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Warsaw", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false
    }).formatToParts(new Date());
    const get = t => parts.find(p => p.type === t).value;
    const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
    return { day, min: (parseInt(get("hour"), 10) % 24) * 60 + parseInt(get("minute"), 10) };
  }

  function updateStatus() {
    const el = $(".js-status");
    const { day, min } = warsawNow();
    const [o, c] = HOURS[day];
    el.classList.remove("is-open", "is-closed");
    if (min >= o && min < c) {
      el.classList.add("is-open");
      $("b", el).textContent = c - min <= 60 ? `Otwarte jeszcze ${c - min} min` : `Otwarte do ${fmt(c)}`;
    } else {
      el.classList.add("is-closed");
      const next = min < o ? `dziś od ${fmt(o)}` : `jutro od ${fmt(HOURS[(day + 1) % 7][0])}`;
      $("b", el).textContent = `Zamknięte · ${next}`;
    }
    $$(".js-hours li").forEach(li => {
      li.classList.toggle("is-today", li.dataset.days.split(",").map(Number).includes(day));
    });
  }
  updateStatus();
  setInterval(updateStatus, 60000);

  /* ---------- Loader ---------- */
  function runLoader(done) {
    const loader = $(".loader");
    const countEl = $(".js-count");
    const start = performance.now();
    const dur = reduceMotion ? 200 : 1500;
    const tick = now => {
      const p = Math.min(1, (now - start) / dur);
      countEl.textContent = Math.round(p * p * (3 - 2 * p) * 100);
      if (p < 1) requestAnimationFrame(tick);
      else finish();
    };
    const finish = () => {
      loader.classList.add("is-done");
      document.body.classList.remove("is-loading");
      if (hasGsap && !reduceMotion) {
        gsap.to(loader, { yPercent: -100, duration: 1.1, ease: "expo.inOut", onComplete: () => loader.remove() });
      } else {
        loader.style.transition = "opacity .4s";
        loader.style.opacity = "0";
        setTimeout(() => loader.remove(), 450);
      }
      done();
    };
    requestAnimationFrame(tick);
  }

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (window.Lenis && !reduceMotion) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true, wheelMultiplier: 1 });
    if (hasGsap) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  // Kotwice: płynne przewijanie z uwzględnieniem nawigacji
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener("click", e => {
      const id = a.getAttribute("href");
      if (id.length < 2 && id !== "#top") return;
      const target = id === "#top" ? document.body : $(id);
      if (!target) return;
      e.preventDefault();
      closeMenu();
      if (lenis) lenis.scrollTo(target, { offset: id === "#top" ? 0 : -90, duration: 1.4 });
      else target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    });
  });

  /* ---------- Nawigacja ---------- */
  const nav = $(".nav");
  let lastY = 0;
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle("is-scrolled", y > 40);
    nav.classList.toggle("is-hidden", y > 400 && y > lastY + 4 && !document.body.classList.contains("menu-open"));
    if (y < lastY - 4) nav.classList.remove("is-hidden");
    lastY = y;
  };
  window.addEventListener("scroll", onScroll, { passive: true });

  const burger = $(".nav__burger");
  const mobileMenu = $(".mobile-menu");
  function closeMenu() {
    mobileMenu.classList.remove("is-open");
    mobileMenu.setAttribute("aria-hidden", "true");
    burger.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
    lenis && lenis.start();
  }
  burger.addEventListener("click", () => {
    const open = !mobileMenu.classList.contains("is-open");
    if (!open) return closeMenu();
    mobileMenu.classList.add("is-open");
    mobileMenu.setAttribute("aria-hidden", "false");
    burger.setAttribute("aria-expanded", "true");
    document.body.classList.add("menu-open");
    lenis && lenis.stop();
  });

  // Aktywna sekcja w menu
  const sectionLinks = $$(".nav__links a");
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      sectionLinks.forEach(l => l.classList.toggle("is-active", l.getAttribute("href") === `#${en.target.id}`));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  ["historia", "wnetrze", "karta", "klimat", "kontakt"].forEach(id => $(`#${id}`) && io.observe($(`#${id}`)));

  /* ---------- Podział tekstu na słowa ---------- */
  function splitWords(el) {
    const walk = node => {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(part));
            else { const s = document.createElement("span"); s.className = "w"; s.textContent = part; frag.appendChild(s); }
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1) walk(child);
      });
    };
    walk(el);
    return $$(".w", el);
  }

  /* ---------- Liczniki ---------- */
  function animateCount(el) {
    const end = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.decimals || "0", 10);
    const suf = el.dataset.suffix || "";
    const from = end > 1000 ? end - 40 : 0;
    const dur = 1800;
    const t0 = performance.now();
    const step = now => {
      const p = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - p, 4);
      el.textContent = (from + (end - from) * e).toFixed(dec).replace(".", ",") + suf;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  const countIO = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { animateCount(en.target); countIO.unobserve(en.target); } });
  }, { threshold: .6 });
  $$(".stat__num").forEach(el => reduceMotion ? (el.textContent = String(el.dataset.count).replace(".", ",") + (el.dataset.suffix || "")) : countIO.observe(el));

  // Pierścienie ocen
  const ringIO = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add("is-in"); ringIO.unobserve(en.target); } });
  }, { threshold: .5 });
  $$(".ring").forEach(r => ringIO.observe(r));

  /* ---------- Animacje GSAP ---------- */
  function heroIntro() {
    if (!hasGsap || reduceMotion) return;
    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.from(".hero__bg img", { scale: 1.35, duration: 2.4, ease: "expo.out" }, 0)
      .from(".hero__title .line > span", { yPercent: 115, rotate: 4, duration: 1.4, stagger: .12 }, .25)
      .from(".hero__eyebrow, .hero__lead, .hero__cta", { y: 30, opacity: 0, duration: 1.2, stagger: .1 }, .6)
      .from(".hero__float", { y: 120, opacity: 0, rotate: 0, duration: 1.6, stagger: .15 }, .5)
      .from(".nav", { y: -80, opacity: 0, duration: 1.2 }, .7)
      .from(".hero__badge", { scale: 0, opacity: 0, duration: 1.2 }, 1);
  }

  function setupScrollAnimations() {
    if (!hasGsap || reduceMotion) {
      $$(".story__big .w").forEach(w => (w.style.opacity = 1));
      return;
    }
    gsap.registerPlugin(ScrollTrigger);

    // Hero parallax
    gsap.to(".hero__bg img", { yPercent: 12, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".hero__content", { y: -80, opacity: .2, ease: "none", scrollTrigger: { trigger: ".hero", start: "40% top", end: "bottom top", scrub: true } });
    gsap.to(".hero__float--a", { y: -160, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".hero__float--b", { y: -260, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

    // Tekst historii - słowa zapalają się podczas przewijania
    const words = $$(".story__big .w");
    gsap.to(words, {
      opacity: 1, stagger: .05, ease: "none",
      scrollTrigger: { trigger: ".story__big", start: "top 80%", end: "bottom 45%", scrub: true }
    });

    // Odsłanianie zdjęcia historii
    gsap.fromTo(".story__img", { clipPath: "inset(30% 20% 30% 20% round 22px)" }, {
      clipPath: "inset(0% 0% 0% 0% round 22px)", ease: "none",
      scrollTrigger: { trigger: ".story__img", start: "top 90%", end: "top 30%", scrub: true }
    });
    gsap.to(".story__img img", { yPercent: -15, ease: "none", scrollTrigger: { trigger: ".story__img", start: "top bottom", end: "bottom top", scrub: true } });

    // Nagłówki
    $$(".h2, .events__title").forEach(h => {
      gsap.from(h, { y: 60, opacity: 0, duration: 1.3, ease: "expo.out", scrollTrigger: { trigger: h, start: "top 88%" } });
    });
    $$(".section .eyebrow, .events .eyebrow").forEach(e => {
      gsap.from(e, { x: -20, opacity: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: e, start: "top 90%" } });
    });

    // Zygzak rysuje się sam
    $$(".zig__path").forEach((p, i) => {
      const len = p.getTotalLength();
      gsap.fromTo(p, { strokeDasharray: len, strokeDashoffset: len }, {
        strokeDashoffset: 0, ease: "none",
        scrollTrigger: { trigger: ".zig", start: "top 95%", end: "bottom 50%", scrub: 1 + i * .5 }
      });
    });

    // Wnętrze - poziomy scroll na desktopie
    const mm = gsap.matchMedia();
    mm.add("(min-width: 901px)", () => {
      const track = $(".interior__track");
      const dist = () => track.scrollWidth - window.innerWidth;
      const tween = gsap.to(track, {
        x: () => -dist(), ease: "none",
        scrollTrigger: {
          trigger: ".interior__pin", start: "top top", end: () => `+=${dist()}`,
          scrub: 1, pin: true, invalidateOnRefresh: true, anticipatePin: 1
        }
      });
      gsap.to(".interior__progress span", {
        scaleX: 1, ease: "none",
        scrollTrigger: { trigger: ".interior__pin", start: "top top", end: () => `+=${dist()}`, scrub: true }
      });
      $$(".panel__img img").forEach(img => {
        gsap.fromTo(img, { xPercent: -8 }, {
          xPercent: 8, ease: "none",
          scrollTrigger: { trigger: img.closest(".panel"), containerAnimation: tween, start: "left right", end: "right left", scrub: true }
        });
      });
    });

    // Bento i karty
    gsap.from(".tile", { y: 80, opacity: 0, duration: 1.2, stagger: .08, ease: "expo.out", scrollTrigger: { trigger: ".bento", start: "top 82%" } });
    gsap.from(".insta__item", { y: 60, opacity: 0, scale: .9, duration: 1.1, stagger: .07, ease: "expo.out", scrollTrigger: { trigger: ".insta__grid", start: "top 85%" } });
    gsap.from(".table-card", { y: 60, opacity: 0, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: ".menu__layout", start: "top 80%" } });

    // Marquee - pochylenie zależne od prędkości przewijania
    const skewTo = gsap.quickTo(".marquee span", "skewX", { duration: .5, ease: "power3" });
    ScrollTrigger.create({
      onUpdate: self => skewTo(gsap.utils.clamp(-12, 12, self.getVelocity() / -250))
    });

    // Eventy
    gsap.to(".events__bg img", { yPercent: -18, ease: "none", scrollTrigger: { trigger: ".events", start: "top bottom", end: "bottom top", scrub: true } });
    gsap.from(".events__chips span", { y: 20, opacity: 0, stagger: .08, duration: .8, ease: "back.out(2)", scrollTrigger: { trigger: ".events__chips", start: "top 90%" } });

    // Stopka
    gsap.from(".footer__big span", { yPercent: 60, opacity: 0, duration: 1.6, ease: "expo.out", scrollTrigger: { trigger: ".footer", start: "top 90%" } });

    window.addEventListener("load", () => ScrollTrigger.refresh());
  }

  /* ---------- Paralaksa myszy w hero ---------- */
  if (finePointer && !reduceMotion) {
    const floats = $$(".hero__float");
    let mx = 0, my = 0, cx = 0, cy = 0;
    $(".hero").addEventListener("mousemove", e => {
      mx = (e.clientX / window.innerWidth - .5) * 2;
      my = (e.clientY / window.innerHeight - .5) * 2;
    });
    const loop = () => {
      cx += (mx - cx) * .06; cy += (my - cy) * .06;
      floats.forEach(f => {
        const d = parseFloat(f.dataset.depth);
        f.style.translate = `${cx * 26 * d}px ${cy * 18 * d}px`;
      });
      requestAnimationFrame(loop);
    };
    loop();
  }

  /* ---------- Kursor ---------- */
  if (finePointer) {
    const cur = $(".cursor");
    const label = $(".cursor__label");
    let x = innerWidth / 2, y = innerHeight / 2, px = x, py = y;
    window.addEventListener("mousemove", e => { x = e.clientX; y = e.clientY; cur.classList.add("is-visible"); });
    document.addEventListener("mouseleave", () => cur.classList.remove("is-visible"));
    const loop = () => {
      px += (x - px) * .2; py += (y - py) * .2;
      cur.style.transform = `translate3d(${px}px, ${py}px, 0)`;
      requestAnimationFrame(loop);
    };
    loop();
    document.addEventListener("mouseover", e => {
      const big = e.target.closest("[data-cursor]");
      const link = e.target.closest("a, button, input, select, textarea");
      cur.classList.toggle("is-big", !!big);
      cur.classList.toggle("is-link", !big && !!link);
      label.textContent = big ? big.dataset.cursor : "";
    });
  }

  /* ---------- Magnetyczne przyciski ---------- */
  if (finePointer && !reduceMotion) {
    $$(".magnetic").forEach(btn => {
      btn.addEventListener("mousemove", e => {
        const r = btn.getBoundingClientRect();
        btn.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px, ${(e.clientY - r.top - r.height / 2) * .35}px)`;
      });
      btn.addEventListener("mouseleave", () => { btn.style.transform = ""; });
    });
  }

  /* ---------- Tilt kafelków ---------- */
  if (finePointer && !reduceMotion) {
    $$("[data-tilt]").forEach(t => {
      t.addEventListener("mousemove", e => {
        const r = t.getBoundingClientRect();
        const rx = ((e.clientY - r.top) / r.height - .5) * -8;
        const ry = ((e.clientX - r.left) / r.width - .5) * 8;
        t.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
      });
      t.addEventListener("mouseleave", () => { t.style.transform = ""; });
    });
  }

  /* ---------- Lightbox ---------- */
  const lb = $(".lightbox");
  const lbImg = $("img", lb);
  const lbCap = $(".lightbox__cap", lb);
  $$(".panel[data-cursor]").forEach(p => {
    p.addEventListener("click", () => {
      const img = $("img", p);
      lbImg.src = img.dataset.full || img.src;
      lbImg.alt = img.alt;
      lbCap.textContent = $("figcaption", p).textContent.replace(/^\d+\s*/, "");
      lb.classList.add("is-open");
      lb.setAttribute("aria-hidden", "false");
      lenis && lenis.stop();
    });
  });
  const closeLb = () => { lb.classList.remove("is-open"); lb.setAttribute("aria-hidden", "true"); lenis && lenis.start(); };
  lb.addEventListener("click", e => { if (e.target !== lbImg) closeLb(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") { closeLb(); closeMenu(); } });

  /* =========================================================
     Karta + "Twój stół"
     CENY ROBOCZE - do podmiany na aktualne ceny lokalu
     price: null = cena podawana na miejscu
     share: ile "porcji tapas" wnosi pozycja do stołu
     ========================================================= */
  const MENU = [
    { id: "klasyki", label: "Klasyki tapas", items: [
      { n: "Patatas Bravas", d: "Smażone ziemniaczki, pikantny sos bravas i aioli", p: 27, tag: "klasyk" },
      { n: "Croquetas de Jamón", d: "4 szt. · kremowy beszamel z hiszpańską szynką", p: 32, tag: "hit" },
      { n: "Croquetas de Espinaca", d: "4 szt. · beszamel ze szpinakiem", p: 28, veg: true },
      { n: "Tortilla de Queso", d: "Hiszpański omlet z serem, mokry w środku - tak jak trzeba", p: 36 },
      { n: "Nuestra Tortilla", d: "Wersja wege, również mokra w środku", p: 30, veg: true },
      { n: "Pimientos de Padrón", d: "Smażone zielone papryczki z solą. Jedna na kilka jest ostra", p: 39, veg: true },
      { n: "Gambas al Ajillo", d: "Krewetki w oliwie z czosnkiem i hiszpańską szynką", p: 45 }
    ]},
    { id: "sprobuj", label: "Musicie tego spróbować", items: [
      { n: "Cachopo", d: "Chrupiąca wołowina w panko, nadziewana szynką serrano i serem. Ogromne - do podziału", p: 89, tag: "hit", share: 2 },
      { n: "Churros de Calamar", d: "Chrupiące paski kałamarnicy", p: 49 },
      { n: "Boczniaki", d: "Boczniaki podane po hiszpańsku", p: 40, veg: true },
      { n: "Quesadilla Chorizo", d: "Z pikantną kiełbasą chorizo i serem", p: 46 },
      { n: "Tabla de Ibérico y Quesos", d: "Deska iberyjskich wędlin i hiszpańskich serów", p: 79, share: 2 }
    ]},
    { id: "paella", label: "Paella", items: [
      { n: "Paella z owocami morza", d: "Dla 2 osób · szafranowy ryż z owocami morza, prosto z patelni", p: 150, tag: "dla 2", share: 4 }
    ]},
    { id: "desery", label: "Desery", items: [
      { n: "Churros con Chocolate", d: "4 szt. · z gorzką czekoladą do maczania", p: 22, share: 0 },
      { n: "Tarta de Queso", d: "Baskijski sernik według przepisu babci Alicii", p: 26, tag: "babcia", share: 0 }
    ]},
    { id: "napoje", label: "Do picia", items: [
      { n: "Sangria", d: "Kieliszek · czerwone wino, owoce, przyprawy. Najlepiej w dzbanku", p: 24, share: 0 },
      { n: "Tinto de Verano", d: "Letnie czerwone wino z gazowaną lemoniadą", p: 22, share: 0 },
      { n: "Kalimotxo", d: "Baskijski klasyk: czerwone wino i cola", p: 20, share: 0 },
      { n: "Wina hiszpańskie", d: "Kieliszek · czerwone, białe i musujące prosto z Hiszpanii", p: 26, share: 0 },
      { n: "Koktajle 0%", d: "Bezalkoholowe koktajle dla kierowców i nie tylko", p: 22, share: 0 }
    ]}
  ];

  // Pływający skrót do stołu (mobile) - widoczny w sekcji karty, gdy stół nie jest pusty
  const pill = $(".table-pill");
  let pillHasItems = false, menuInView = false, cardInView = false;
  const updatePill = () => pill.classList.toggle("is-visible", pillHasItems && menuInView && !cardInView);
  new IntersectionObserver(([en]) => { menuInView = en.isIntersecting; updatePill(); }).observe($("#karta"));
  new IntersectionObserver(([en]) => { cardInView = en.isIntersecting; updatePill(); }).observe($(".table-card"));
  pill.addEventListener("click", () => {
    const card = $(".table-card");
    if (lenis) lenis.scrollTo(card, { offset: -90, duration: 1.2 });
    else card.scrollIntoView({ behavior: "smooth" });
  });

  const tabsEl = $(".menu__tabs");
  const listEl = $(".menu__list");
  const cart = new Map(); // klucz: nazwa -> {item, qty}
  let people = 2;
  let activeTab = MENU[0].id;

  MENU.forEach(cat => {
    const b = document.createElement("button");
    b.className = "tab";
    b.role = "tab";
    b.textContent = cat.label;
    b.setAttribute("aria-selected", String(cat.id === activeTab));
    b.addEventListener("click", () => { activeTab = cat.id; renderTabs(); renderList(true); });
    b.dataset.id = cat.id;
    tabsEl.appendChild(b);
  });
  function renderTabs() { $$(".tab", tabsEl).forEach(t => t.setAttribute("aria-selected", String(t.dataset.id === activeTab))); }

  const priceTxt = p => (p == null ? "na miejscu" : `${p} zł`);

  function renderList(animate) {
    const cat = MENU.find(c => c.id === activeTab);
    listEl.innerHTML = "";
    cat.items.forEach(it => {
      const li = document.createElement("li");
      li.className = "dish";
      const tags = [
        it.tag ? `<span class="dish__tag">${it.tag}</span>` : "",
        it.veg ? `<span class="dish__tag dish__tag--veg">wege</span>` : ""
      ].join("");
      const qty = cart.get(it.n)?.qty || 0;
      li.innerHTML = `
        <div class="dish__name">${it.n}${tags}</div>
        <p class="dish__desc">${it.d}</p>
        <span class="dish__price">${priceTxt(it.p)}</span>
        <button class="dish__add" data-qty="${qty}" aria-label="Dodaj ${it.n} do stołu">+</button>`;
      $(".dish__add", li).addEventListener("click", e => { addItem(it); e.currentTarget.dataset.qty = cart.get(it.n).qty; });
      listEl.appendChild(li);
    });
    if (animate && hasGsap && !reduceMotion) {
      gsap.from($$(".dish", listEl), { y: 24, opacity: 0, duration: .7, stagger: .05, ease: "expo.out" });
    }
  }

  function addItem(it) {
    const cur = cart.get(it.n) || { item: it, qty: 0 };
    cur.qty++;
    cart.set(it.n, cur);
    renderCart(true);
  }
  function removeItem(name) {
    const cur = cart.get(name);
    if (!cur) return;
    cur.qty--;
    if (cur.qty <= 0) cart.delete(name);
    renderCart(false);
    renderList(false);
  }

  function renderCart(bump) {
    const ul = $(".js-table-items");
    ul.innerHTML = "";
    let total = 0, unknown = 0, portions = 0;
    if (!cart.size) {
      ul.innerHTML = `<li class="table-card__empty">Pusto jak w poniedziałek o 11:59. Dodaj coś z karty.</li>`;
    }
    cart.forEach(({ item, qty }, name) => {
      if (item.p == null) unknown += qty; else total += item.p * qty;
      portions += (item.share ?? 1) * qty;
      const li = document.createElement("li");
      li.innerHTML = `<span>${qty}× ${name}</span><b>${item.p == null ? "na miejscu" : item.p * qty + " zł"}<button class="rm" aria-label="Usuń jedną porcję ${name}">×</button></b>`;
      $(".rm", li).addEventListener("click", () => removeItem(name));
      ul.appendChild(li);
    });
    const totalEl = $(".js-total");
    totalEl.textContent = `${total} zł${unknown ? " +" : ""}`;
    if (bump) { totalEl.classList.remove("bump"); void totalEl.offsetWidth; totalEl.classList.add("bump"); }

    const need = Math.round(people * 2.5);
    const ratio = Math.min(1, portions / need);
    $(".js-meter").style.width = `${ratio * 100}%`;
    let tip;
    if (!portions) tip = `Na ${people} ${people === 1 ? "osobę" : "osoby"} polecamy ${Math.max(2, people * 2)}-${people * 3} tapas.`;
    else if (ratio < .5) tip = `Dobry początek! Dorzuć jeszcze ${need - portions} - u nas nikt nie wychodzi głodny.`;
    else if (ratio < 1) tip = `Prawie gotowe. Jeszcze ${need - portions} i stół będzie pełny.`;
    else tip = `¡Perfecto! Tyle wystarczy dla ${people} ${people === 1 ? "osoby" : "osób"}. Teraz sangria?`;
    if (unknown) tip += " Część pozycji wycenimy na miejscu.";
    $(".js-tip").textContent = tip;

    const count = [...cart.values()].reduce((a, c) => a + c.qty, 0);
    $(".js-pill-count").textContent = count;
    $(".js-pill-total").textContent = totalEl.textContent;
    pillHasItems = count > 0;
    updatePill();
  }

  $$(".people__btn").forEach(b => b.addEventListener("click", () => {
    people = Math.min(20, Math.max(1, people + parseInt(b.dataset.dir, 10)));
    $(".js-people").textContent = people;
    renderCart(false);
  }));

  renderList(false);
  renderCart(false);

  /* ---------- Formularz rezerwacji ---------- */
  const form = $(".reserve");
  const dateIn = form.elements.date;
  const timeSel = form.elements.time;
  const peopleSel = form.elements.people;

  for (let i = 1; i <= 12; i++) peopleSel.add(new Option(i === 12 ? "12+" : String(i), String(i), i === 2, i === 2));

  const isoDate = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const today = new Date();
  dateIn.min = isoDate(today);
  dateIn.value = isoDate(today);

  function fillTimes() {
    const d = dateIn.value ? new Date(dateIn.value + "T12:00:00") : today;
    const [o, c] = HOURS[d.getDay()];
    const prev = timeSel.value;
    timeSel.innerHTML = "";
    // Ostatnia rezerwacja 90 min przed zamknięciem
    for (let m = o; m <= c - 90; m += 30) timeSel.add(new Option(fmt(m), fmt(m)));
    if (dateIn.value === isoDate(new Date())) {
      const { min } = warsawNow();
      [...timeSel.options].forEach(op => {
        const [h, mm] = op.value.split(":").map(Number);
        if (h * 60 + mm < min + 30) op.disabled = true;
      });
    }
    const firstFree = [...timeSel.options].find(o => !o.disabled);
    timeSel.value = [...timeSel.options].some(o => o.value === prev && !o.disabled) ? prev : (firstFree ? firstFree.value : "");
    if (!firstFree) timeSel.add(new Option("Brak wolnych godzin dziś", "", true, true));
  }
  dateIn.addEventListener("change", fillTimes);
  fillTimes();

  form.addEventListener("submit", e => {
    e.preventDefault();
    const msg = $(".reserve__msg");
    let ok = true;
    ["name", "phone", "date", "time"].forEach(n => {
      const f = form.elements[n];
      const bad = !f.value.trim();
      f.closest(".field").classList.toggle("is-error", bad);
      if (bad) ok = false;
    });
    if (!ok) { msg.textContent = "Uzupełnij zaznaczone pola, proszę."; return; }

    const d = new Date(dateIn.value + "T12:00:00").toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long" });
    const ordered = [...cart.values()].map(({ item, qty }) => `${qty}× ${item.n}`).join(", ");
    const body = [
      "Dzień dobry!",
      "",
      `Chciał(a)bym zarezerwować stolik na ${peopleSel.value === "12" ? "12+" : peopleSel.value} os.`,
      `Termin: ${d}, godz. ${timeSel.value}`,
      `Imię: ${form.elements.name.value.trim()}`,
      `Telefon: ${form.elements.phone.value.trim()}`,
      form.elements.notes.value.trim() ? `Uwagi: ${form.elements.notes.value.trim()}` : "",
      ordered ? `Mamy już ochotę na: ${ordered}` : "",
      "",
      "¡Gracias!"
    ].filter((l, i, a) => l !== "" || a[i - 1] !== "").join("\n");

    const href = `mailto:tapas@tapasgastrobar.pl?subject=${encodeURIComponent(`Rezerwacja ${dateIn.value} ${timeSel.value} · ${peopleSel.value} os.`)}&body=${encodeURIComponent(body)}`;
    window.location.href = href;
    msg.textContent = "¡Gracias! Otwieramy Twoją pocztę. Potwierdzimy rezerwację odpowiedzią lub telefonem.";
  });

  /* ---------- Start ---------- */
  setupScrollAnimations();
  runLoader(heroIntro);
})();
