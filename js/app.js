/* ============================================================
   MIRO FREITAS — global JS (vanilla)
   - Lenis cinematic smooth scroll
   - Active nav link
   - Cookie banner
   - Form validation + masks (only runs if form present)
   ============================================================ */
(function () {

  // --- Lenis cinematic scroll ---
  let lenis;
  const _reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!_reduced && typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      lerp: 0.07,
      smoothWheel: true,
      smoothTouch: false,
      wheelMultiplier: 0.85,
    });

    (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
  }

  // --- Para o Lenis antes de navegar (View Transitions API cuida da animação) ---
  if (lenis) {
    document.addEventListener('click', e => {
      const link = e.target.closest('a[href]');
      if (!link || link.target === '_blank') return;
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || /^https?:/.test(href)) return;
      lenis.stop();
    });
  }

  // --- Highlight active nav link based on current filename ---
  const path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("[data-nav]").forEach(a => {
    if (a.getAttribute("href") === path) a.classList.add("active");
    if (path === "" && a.getAttribute("href") === "index.html") a.classList.add("active");
  });

  // --- Sliding nav pill ---
  const _nav = document.querySelector('.nav');
  if (_nav) {
    const _pill = document.createElement('span');
    _pill.className = 'nav-pill';
    _nav.prepend(_pill);

    const _activeLink = _nav.querySelector('a.active');

    const _movePill = (el, instant) => {
      const navRect = _nav.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      if (instant) _pill.style.transition = 'none';
      _pill.style.left = (elRect.left - navRect.left) + 'px';
      _pill.style.width = elRect.width + 'px';
      _pill.style.opacity = '1';
      if (instant) requestAnimationFrame(() => { _pill.style.transition = ''; });
    };

    // Posiciona após fontes carregarem — evita "jump" quando Inter/Space Grotesk
    // altera o tamanho dos links e o pill animaria até a posição correta.
    const _placePill = () => {
      if (_activeLink) _movePill(_activeLink, true);
      // Se não tiver link ativo, permanece invisível (opacity: 0 no CSS).
    };

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(_placePill);
    } else {
      _placePill();
    }

    _nav.querySelectorAll('a').forEach(a => {
      a.addEventListener('mouseenter', () => _movePill(a, false));
    });
    _nav.addEventListener('mouseleave', () => {
      if (_activeLink) _movePill(_activeLink, false);
      else _pill.style.opacity = '0';
    });
  }

  // --- Mobile menu ---
  const menuBtn = document.getElementById("menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");
  const menuClose = document.getElementById("menu-close");
  const openMenu = () => {
    if (mobileMenu) {
      mobileMenu.classList.add("open");
      document.body.style.overflow = "hidden";
      if (lenis) lenis.stop();
    }
  };
  const closeMenu = () => {
    if (mobileMenu) {
      mobileMenu.classList.remove("open");
      document.body.style.overflow = "";
      if (lenis) lenis.start();
    }
  };
  if (menuBtn) menuBtn.addEventListener("click", openMenu);
  if (menuClose) menuClose.addEventListener("click", closeMenu);

  // --- Cookie banner ---
  const cookie = document.getElementById("cookie");
  if (cookie) {
    if (localStorage.getItem("mf_cookie_ok")) {
      cookie.classList.add("hidden");
    }
    const close = (val) => {
      localStorage.setItem("mf_cookie_ok", val);
      cookie.classList.add("hiding");
      setTimeout(() => cookie.classList.add("hidden"), 320);
    };
    const ok = document.getElementById("cookie-accept");
    const no = document.getElementById("cookie-refuse");
    if (ok) ok.addEventListener("click", () => close("yes"));
    if (no) no.addEventListener("click", () => close("no"));
  }

  // --- Contact form (only on contato.html) ---
  const form = document.getElementById("form-cotacao");
  if (form) {
    const cnpj = form.querySelector('[name="cnpj"]');
    const tel = form.querySelector('[name="telefone"]');

    const formatCNPJ = v => {
      v = v.replace(/\D/g, "").slice(0, 14);
      return v.replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    };
    const formatTel = v => {
      v = v.replace(/\D/g, "").slice(0, 11);
      return v.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
    };
    if (cnpj) cnpj.addEventListener("input", e => e.target.value = formatCNPJ(e.target.value));
    if (tel) tel.addEventListener("input", e => e.target.value = formatTel(e.target.value));

    form.addEventListener("submit", ev => {
      ev.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      let ok = true;
      const mark = (name, cond) => {
        const field = form.querySelector(`[data-field="${name}"]`);
        if (!field) return;
        if (cond) { field.classList.add("error"); ok = false; }
        else { field.classList.remove("error"); }
      };
      mark("nome", !data.nome || !data.nome.trim());
      mark("empresa", !data.empresa || !data.empresa.trim());
      mark("cnpj", !data.cnpj || data.cnpj.replace(/\D/g, "").length !== 14);
      mark("telefone", !data.telefone);
      mark("email", !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email || ""));
      mark("produto", !data.produto);
      mark("descricao", !data.descricao || !data.descricao.trim());

      if (!ok) return;

      const btn = form.querySelector('[type="submit"]');
      btn.disabled = true;
      btn.textContent = "Enviando…";

      fetch("https://formspree.io/f/xyklpvqw", {
        method: "POST",
        headers: { "Accept": "application/json" },
        body: new FormData(form)
      })
        .then(res => {
          if (!res.ok) throw new Error();
          const success = document.getElementById("form-success");
          const container = document.getElementById("form-container");
          if (success && container) {
            document.getElementById("success-nome").textContent = data.nome.split(" ")[0];
            document.getElementById("success-email").textContent = data.email;
            document.getElementById("success-tel").textContent = data.telefone;
            container.style.display = "none";
            success.style.display = "block";
            if (lenis) lenis.scrollTo(0); else window.scrollTo({ top: 0, behavior: "smooth" });
          }
        })
        .catch(() => {
          btn.disabled = false;
          btn.textContent = "Solicitar Cotação Agora →";
          alert("Erro ao enviar. Tente novamente ou entre em contato pelo WhatsApp.");
        });
    });
  }

  // --- Product filter (only on produtos.html) ---
  const pgrid = document.getElementById("products-grid");
  if (pgrid) {
    const chips = document.querySelectorAll("[data-cat]");
    const search = document.getElementById("search");
    const count = document.getElementById("products-count");
    const empty = document.getElementById("products-empty");
    let activeCat = "all";

    function apply() {
      const q = (search.value || "").toLowerCase().trim();
      let visible = 0;
      pgrid.querySelectorAll("[data-product]").forEach(card => {
        const cat = card.getAttribute("data-cat");
        const hay = (card.getAttribute("data-search") || "").toLowerCase();
        const show = (activeCat === "all" || cat === activeCat) && (q === "" || hay.includes(q));
        card.style.display = show ? "" : "none";
        if (show) visible++;
      });
      if (count) count.textContent = visible;
      if (empty) empty.style.display = visible === 0 ? "block" : "none";
    }

    chips.forEach(ch => {
      ch.addEventListener("click", () => {
        chips.forEach(c => { c.classList.remove("btn-primary"); c.classList.add("btn-outline"); });
        ch.classList.add("btn-primary");
        ch.classList.remove("btn-outline");
        activeCat = ch.getAttribute("data-cat");
        apply();
      });
    });
    if (search) search.addEventListener("input", apply);
  }

  // --- Scroll progress bar ---
  const _bar = document.createElement("div");
  _bar.className = "scroll-progress";
  document.body.prepend(_bar);

  if (lenis) {
    lenis.on('scroll', ({ scroll, limit }) => {
      _bar.style.width = limit > 0 ? (scroll / limit * 100) + '%' : '0%';
    });
  } else {
    window.addEventListener('scroll', () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      _bar.style.width = total > 0 ? (window.scrollY / total * 100) + "%" : "0%";
    }, { passive: true });
  }

  // --- Parallax (add data-parallax="-0.08" to any element) ---
  if (lenis) {
    const _pEls = document.querySelectorAll('[data-parallax]');
    if (_pEls.length) {
      lenis.on('scroll', ({ scroll }) => {
        _pEls.forEach(el => {
          el.style.transform = `translateY(${scroll * parseFloat(el.dataset.parallax)}px)`;
        });
      });
    }
  }

  // --- Reveal on scroll (IntersectionObserver) ---
  const _skip = ["header", ".topbar", ".hero-grid", "footer", ".mobile-menu"];
  const _inSkip = el => _skip.some(s => el.closest(s));

  // Stagger containers: animate children sequentially
  document.querySelectorAll(".grid-4, .grid-3, .audience-grid").forEach(g => {
    if (_inSkip(g)) return;
    g.classList.add("stagger");
    g.querySelectorAll(":scope > *").forEach(c => c.classList.add("reveal"));
  });

  // Individual elements on every page
  [".eyebrow", "h2", ".lead", ".partnership-card", ".cta-block",
    ".testimonial", ".diff-row", ".step-num", ".hero-portrait-card",
    ".card-form", ".card-success"]
    .forEach(sel => document.querySelectorAll(sel).forEach(el => {
      if (!_inSkip(el) && !el.classList.contains("reveal"))
        el.classList.add("reveal");
    }));

  const _obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("visible"); _obs.unobserve(e.target); }
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -32px 0px" });
  document.querySelectorAll(".reveal").forEach(el => _obs.observe(el));

})();
