/**
 * ONYX MUN — UPI deep links
 * Format: upi://pay?pa=PAYEE_VPA&pn=PAYEE_NAME&am=AMOUNT&cu=CURRENCY&tn=TRANSACTION_NOTE
 */
(() => {
  const PAYEE_VPA = "9493678346@ibl";
  const PAYEE_NAME = "Sunkara Murali Krishna";
  const CURRENCY = "INR";

  function buildPayUrl({ pa = PAYEE_VPA, pn = PAYEE_NAME, am, cu = CURRENCY, tn } = {}) {
    const parts = [
      `pa=${encodeURIComponent(pa)}`,
      `pn=${encodeURIComponent(pn)}`,
    ];
    if (am != null && am !== "") parts.push(`am=${encodeURIComponent(String(am))}`);
    parts.push(`cu=${encodeURIComponent(cu)}`);
    if (tn) parts.push(`tn=${encodeURIComponent(tn)}`);
    return `upi://pay?${parts.join("&")}`;
  }

  function qrImageUrl(upiUrl, size = 240) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(upiUrl)}`;
  }

  function initPanel(root) {
    if (!root) return;
    const amount = root.dataset.upiAmount;
    const note = root.dataset.upiNote || "ONYX MUN";
    const qrSize = root.dataset.upiQrSize || "240";
    const url = buildPayUrl({ am: amount, tn: note });

    const img = root.querySelector("[data-upi-qr]");
    const link = root.querySelector("[data-upi-link]");
    const upiIdEl = root.querySelector("[data-upi-id]");

    if (img) {
      img.src = qrImageUrl(url, qrSize);
      img.alt = amount ? `Scan to pay ₹${amount} via UPI` : "Scan to pay via UPI";
    }
    if (link) {
      link.href = url;
    }
    if (upiIdEl) {
      upiIdEl.textContent = PAYEE_VPA;
    }
  }

  function initAll() {
    document.querySelectorAll("[data-upi-panel]").forEach(initPanel);
  }

  window.ONYX_UPI = {
    PAYEE_VPA,
    PAYEE_NAME,
    CURRENCY,
    buildPayUrl,
    qrImageUrl,
    initPanel,
    initAll,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
