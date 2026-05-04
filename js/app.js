/* ============================================================
   MIRO FREITAS — global JS (vanilla)
   - Active nav link
   - Cookie banner
   - Form validation + masks (only runs if form present)
   ============================================================ */
(function () {
  // --- Highlight active nav link based on current filename ---
  const path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("[data-nav]").forEach(a => {
    if (a.getAttribute("href") === path) a.classList.add("active");
    if (path === "" && a.getAttribute("href") === "index.html") a.classList.add("active");
  });

  // --- Mobile menu ---
  const menuBtn = document.getElementById("menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");
  const menuClose = document.getElementById("menu-close");
  const openMenu = () => { if (mobileMenu) { mobileMenu.classList.add("open"); document.body.style.overflow = "hidden"; } };
  const closeMenu = () => { if (mobileMenu) { mobileMenu.classList.remove("open"); document.body.style.overflow = ""; } };
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
            window.scrollTo({ top: 0, behavior: "smooth" });
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
  window.addEventListener("scroll", () => {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    _bar.style.width = total > 0 ? (window.scrollY / total * 100) + "%" : "0%";
  }, { passive: true });

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
