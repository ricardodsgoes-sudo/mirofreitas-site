/* ============================================================
   COTAÇÃO B2B — WhatsApp direto, UTMs e Meta Pixel
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

  return Object.freeze({
    captureUtms,
    buildWhatsMessage,
    buildWhatsappUrl,
    classifyDevice,
    buildTrackingPayload,
    sendSheetEvent
  });
});

(function () {
  "use strict";

  if (typeof window === "undefined" || typeof document === "undefined") return;

  const CONFIG = Object.freeze({
    metaPixelId: "958971496954944",
    whatsappNumber: "5541996483352",
    appsScriptUrl: "https://script.google.com/macros/s/AKfycbyWS6C3mhXKyMS7Hp46p8NxUK9QfAIEkXdjGRNvGLNELfplt2bgoR3CDPS0Au21RyyEYw/exec"
  });

  const META_PIXEL_ID = CONFIG.metaPixelId.trim();
  const WHATSAPP_NUMBER = CONFIG.whatsappNumber.trim();
  const APPS_SCRIPT_URL = CONFIG.appsScriptUrl.trim();
  const ads = window.CotacaoAds;
  const isLocalPreview = ["localhost", "127.0.0.1"].includes(window.location.hostname);

  const trackMeta = eventName => {
    if (!META_PIXEL_ID || typeof window.fbq !== "function") return;
    try {
      window.fbq("track", eventName);
    } catch (error) {
      console.warn("[cotacao] O evento do Meta Pixel não pôde ser registrado.", error);
    }
  };

  const loadMetaPixel = () => {
    if (isLocalPreview) return;
    if (!/^\d{5,20}$/.test(META_PIXEL_ID)) return;

    if (!window.fbq) {
      const fbq = function () {
        if (fbq.callMethod) fbq.callMethod.apply(fbq, arguments);
        else fbq.queue.push(arguments);
      };

      window.fbq = fbq;
      window._fbq = fbq;
      fbq.push = fbq;
      fbq.loaded = true;
      fbq.version = "2.0";
      fbq.queue = [];

      const script = document.createElement("script");
      script.async = true;
      script.src = "https://connect.facebook.net/en_US/fbevents.js";
      const firstScript = document.getElementsByTagName("script")[0];
      if (firstScript && firstScript.parentNode) firstScript.parentNode.insertBefore(script, firstScript);
      else document.head.appendChild(script);
    }

    try {
      window.fbq("init", META_PIXEL_ID);
      trackMeta("PageView");
    } catch (error) {
      console.warn("[cotacao] O Meta Pixel não pôde ser inicializado.", error);
    }
  };

  loadMetaPixel();

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
      trackMeta("Lead");
      sendTrackingEvent("WhatsAppClick", link.dataset.ctaLocation || "unknown");
    });
  });
})();
