/* ============================================================
   COTAÇÃO B2B — WhatsApp direto, UTMs, GTM e Google Sheets
   ============================================================ */
(function (root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) module.exports = api;
  else root.CotacaoAds = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const UTM_KEYS = Object.freeze([
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term"
  ]);

  const captureUtms = search => {
    const params = new URLSearchParams(search || "");
    return UTM_KEYS.reduce((utms, key) => {
      utms[key] = params.get(key) || "";
      return utms;
    }, {});
  };

  const buildWhatsMessage = (utms = {}) => {
    const lines = [
      "Olá, Miro. Vim pela página de cotação e gostaria de atendimento B2B."
    ];

    const campaign = [
      utms.utm_source && `Fonte: ${utms.utm_source}`,
      utms.utm_medium && `Mídia: ${utms.utm_medium}`,
      utms.utm_campaign && `Campanha: ${utms.utm_campaign}`,
      utms.utm_content && `Anúncio: ${utms.utm_content}`,
      utms.utm_term && `Termo: ${utms.utm_term}`
    ].filter(Boolean);

    if (campaign.length) lines.push("", "Origem do anúncio:", ...campaign);
    return lines.join("\n");
  };

  const buildWhatsappUrl = (number, utms = {}) => {
    const digits = String(number || "").replace(/\D/g, "");
    return `https://wa.me/${digits}?text=${encodeURIComponent(buildWhatsMessage(utms))}`;
  };

  const classifyDevice = width => {
    const normalizedWidth = Number(width);
    if (!Number.isFinite(normalizedWidth) || normalizedWidth <= 0) return "desktop";
    return normalizedWidth <= 700 ? "mobile" : normalizedWidth <= 980 ? "tablet" : "desktop";
  };

  const buildTrackingPayload = ({
    event,
    cta = "",
    search = "",
    page = "",
    referrer = "",
    viewportWidth = 0
  }) => {
    const params = new URLSearchParams(search || "");

    return {
      event,
      cta,
      ...captureUtms(search),
      page,
      referrer,
      device: classifyDevice(viewportWidth),
      fbclid: params.get("fbclid") || ""
    };
  };

  const sendSheetEvent = async ({ endpoint, payload, navigatorRef, fetchRef }) => {
    if (!endpoint) return false;

    const body = JSON.stringify(payload);

    try {
      if (
        navigatorRef &&
        typeof navigatorRef.sendBeacon === "function" &&
        navigatorRef.sendBeacon(endpoint, body)
      ) {
        return true;
      }
    } catch (_) {}

    if (typeof fetchRef !== "function") return false;

    try {
      await fetchRef(endpoint, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body,
        keepalive: true
      });
      return true;
    } catch (_) {
      return false;
    }
  };

  const pushDataLayerEvent = (dataLayer, payload) => {
    if (!Array.isArray(dataLayer) || !payload || typeof payload !== "object") return false;
    dataLayer.push(payload);
    return true;
  };

  return Object.freeze({
    captureUtms,
    buildWhatsMessage,
    buildWhatsappUrl,
    classifyDevice,
    buildTrackingPayload,
    sendSheetEvent,
    pushDataLayerEvent
  });
});

(function () {
  "use strict";

  if (typeof window === "undefined" || typeof document === "undefined") return;

  const CONFIG = Object.freeze({
    whatsappNumber: "5541996483352",
    appsScriptUrl: "https://script.google.com/macros/s/AKfycbyWS6C3mhXKyMS7Hp46p8NxUK9QfAIEkXdjGRNvGLNELfplt2bgoR3CDPS0Au21RyyEYw/exec"
  });

  const WHATSAPP_NUMBER = CONFIG.whatsappNumber.trim();
  const APPS_SCRIPT_URL = CONFIG.appsScriptUrl.trim();
  const ads = window.CotacaoAds;
  const isLocalPreview = ["localhost", "127.0.0.1"].includes(window.location.hostname);

  const utms = ads.captureUtms(window.location.search);
  const whatsappUrl = ads.buildWhatsappUrl(WHATSAPP_NUMBER, utms);
  const sendTrackingEvent = (event, cta = "") => {
    if (isLocalPreview) return;

    const payload = ads.buildTrackingPayload({
      event,
      cta,
      search: window.location.search,
      page: window.location.href,
      referrer: document.referrer,
      viewportWidth: window.innerWidth
    });

    void ads.sendSheetEvent({
      endpoint: APPS_SCRIPT_URL,
      payload,
      navigatorRef: window.navigator,
      fetchRef: typeof window.fetch === "function" ? window.fetch.bind(window) : undefined
    });
  };

  const trackPageView = () => {
    if (isLocalPreview || window.__cotacaoSheetPageViewSent) return;
    window.__cotacaoSheetPageViewSent = true;
    sendTrackingEvent("PageView");
  };

  if (document.readyState === "complete") trackPageView();
  else window.addEventListener("load", trackPageView, { once: true });

  document.querySelectorAll("[data-whatsapp-cta]").forEach(link => {
    link.href = whatsappUrl;
    link.target = "_blank";
    link.rel = "noopener";
    link.addEventListener("click", () => {
      const ctaLocation = link.dataset.ctaLocation || "unknown";
      ads.pushDataLayerEvent(window.dataLayer || (window.dataLayer = []), {
        event: "whatsapp_click",
        meta_event_name: "Contact",
        cta_location: ctaLocation,
        ...utms,
        page_location: window.location.href,
        page_referrer: document.referrer,
        device: ads.classifyDevice(window.innerWidth)
      });
      sendTrackingEvent("WhatsAppClick", ctaLocation);
    });
  });
})();
