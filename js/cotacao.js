/* ============================================================
   COTAÇÃO LP — captura de leads, máscaras, validação,
   envio para Google Apps Script (planilha) e abertura do WhatsApp.
   ============================================================ */
(function () {
  const form = document.getElementById("form-cotacao-lp");
  if (!form) return;

  // Cole aqui a URL pública do Apps Script depois de publicar como Web App.
  // Enquanto estiver vazia, o formulário envia direto para o WhatsApp.
  const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyWS6C3mhXKyMS7Hp46p8NxUK9QfAIEkXdjGRNvGLNELfplt2bgoR3CDPS0Au21RyyEYw/exec";

  const WHATSAPP_NUMBER = "5541996483352";
  const ORIGEM = "Landing cotação Miro";
  const BTN_LABEL_DEFAULT = "Enviar cotação pelo WhatsApp";
  const META_PIXEL_ID = "958971496954944";

  // O snippet base do Meta Pixel é carregado inline no <head> de cotacao.html
  // (forma recomendada pela Meta). Aqui só disparamos o evento Lead após
  // validação do formulário.
  const trackLead = () => {
    if (META_PIXEL_ID && window.fbq) {
      try { window.fbq("track", "Lead"); } catch (_) {}
    }
  };

  // --- Captura UTMs uma vez ---
  const utms = (function () {
    const p = new URLSearchParams(window.location.search);
    return {
      utm_source:   p.get("utm_source")   || "",
      utm_medium:   p.get("utm_medium")   || "",
      utm_campaign: p.get("utm_campaign") || "",
      utm_content:  p.get("utm_content")  || "",
      utm_term:     p.get("utm_term")     || ""
    };
  })();

  // --- Máscaras ---
  const cnpjInput = form.querySelector('[name="cnpj"]');
  const waInput   = form.querySelector('[name="whatsapp"]');

  const formatCNPJ = v => {
    v = (v || "").replace(/\D/g, "").slice(0, 14);
    return v
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  };
  const formatTel = v => {
    v = (v || "").replace(/\D/g, "").slice(0, 11);
    if (v.length <= 10) {
      return v.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
    }
    return v.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
  };

  if (cnpjInput) cnpjInput.addEventListener("input", e => e.target.value = formatCNPJ(e.target.value));
  if (waInput)   waInput.addEventListener("input",   e => e.target.value = formatTel(e.target.value));

  // --- Helpers ---
  const mark = (name, hasError) => {
    const field = form.querySelector(`[data-field="${name}"]`);
    if (!field) return;
    field.classList.toggle("error", hasError);
  };

  const isCNPJValid  = raw => (raw || "").replace(/\D/g, "").length === 14;
  const isPhoneValid = raw => {
    const d = (raw || "").replace(/\D/g, "").length;
    return d >= 10 && d <= 11;
  };

  const buildWhatsMessage = d =>
    "Olá, Miro. Vim pelo anúncio e quero solicitar uma cotação B2B.\n\n" +
    "Nome: " + d.nome + "\n" +
    "WhatsApp: " + d.whatsapp + "\n" +
    "CNPJ: " + d.cnpj + "\n" +
    "Preciso cotar: " + d.cotacao;

  const sendToSheet = async (payload) => {
    if (!APPS_SCRIPT_URL) return;
    try {
      await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      // Falha no envio para planilha não bloqueia o WhatsApp.
      console.warn("[cotacao] Falha ao enviar para planilha:", err);
    }
  };

  // --- Submit ---
  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();

    const fields = {
      nome:     (form.nome.value || "").trim(),
      whatsapp: (form.whatsapp.value || "").trim(),
      cnpj:     (form.cnpj.value || "").trim(),
      cotacao:  (form.cotacao.value || "").trim()
    };

    let ok = true;
    const fail = name => { mark(name, true); ok = false; };

    if (!fields.nome)                 fail("nome");     else mark("nome", false);
    if (!fields.whatsapp || !isPhoneValid(fields.whatsapp)) fail("whatsapp"); else mark("whatsapp", false);
    if (!fields.cnpj || !isCNPJValid(fields.cnpj))          fail("cnpj");     else mark("cnpj", false);
    if (!fields.cotacao)              fail("cotacao");  else mark("cotacao", false);

    if (!ok) {
      const firstErr = form.querySelector(".field.error");
      if (firstErr) firstErr.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const btn = document.getElementById("cot-submit");
    if (btn) { btn.disabled = true; btn.textContent = "Enviando..."; }

    // Payload para a planilha (ordem segue o cabeçalho do .gs)
    const payload = {
      data:         new Date().toISOString(),
      nome:         fields.nome,
      whatsapp:     fields.whatsapp,
      cnpj:         fields.cnpj,
      cotacao:      fields.cotacao,
      origem:       ORIGEM,
      utm_source:   utms.utm_source,
      utm_medium:   utms.utm_medium,
      utm_campaign: utms.utm_campaign,
      utm_content:  utms.utm_content,
      utm_term:     utms.utm_term,
      pagina:       window.location.href,
      userAgent:    navigator.userAgent
    };

    // 1) Tenta enviar para a planilha (não bloqueia o lead se falhar).
    await sendToSheet(payload);

    // 2) Dispara Lead no Meta Pixel (formulário já validado).
    trackLead();

    // 3) Restaura o botão (caso o navegador não troque de aba imediatamente).
    if (btn) { btn.disabled = false; btn.textContent = BTN_LABEL_DEFAULT; }

    // 4) Abre o WhatsApp com a mensagem pronta.
    const waUrl = "https://wa.me/" + WHATSAPP_NUMBER +
                  "?text=" + encodeURIComponent(buildWhatsMessage(fields));
    window.location.href = waUrl;
  });
})();
