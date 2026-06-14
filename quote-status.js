const params = new URLSearchParams(window.location.search);
const API_BASE = resolveApiBase();
const panel = document.getElementById("quote-status-panel");

init();

async function init() {
  const quote = params.get("quote") || "";
  const token = params.get("token") || "";
  if (quote && token) {
    await loadStatus(quote, token);
    return;
  }
  renderLookupForm();
}

async function loadStatus(quote, token) {
  panel.innerHTML = `<p>Loading quote status...</p>`;
  try {
    const data = await apiGet(`/api/status?quote=${encodeURIComponent(quote)}&token=${encodeURIComponent(token)}`);
    renderStatus(data);
  } catch (error) {
    panel.innerHTML = `
      <div class="quote-status-message is-error">
        <strong>Unable to load this status link.</strong>
        <p>${escapeHtml(error.message || "Request a fresh status link below.")}</p>
      </div>
      ${lookupFormHtml(quote)}
    `;
    bindLookupForm();
  }
}

function renderLookupForm(message = "") {
  panel.innerHTML = `
    ${message ? `<div class="quote-status-message is-success">${escapeHtml(message)}</div>` : ""}
    ${lookupFormHtml(params.get("quote") || "")}
  `;
  bindLookupForm();
}

function lookupFormHtml(quote = "") {
  return `
    <form class="quote-status-form" id="quote-status-form">
      <div class="section-heading final-small-heading">
        <p>Status link</p>
        <h2>Email me a secure status link</h2>
        <span>Enter the quote number plus the email or phone number from the quote.</span>
      </div>
      <label class="field">
        <span>Quote number</span>
        <input id="status-quote" autocomplete="off" required placeholder="MP-XXXXXXXX" value="${escapeAttr(quote)}" />
      </label>
      <label class="field">
        <span>Email or phone</span>
        <input id="status-contact" autocomplete="email tel" required />
      </label>
      <button class="primary-action" type="submit">Send status link</button>
    </form>
  `;
}

function bindLookupForm() {
  document.getElementById("quote-status-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = event.currentTarget.querySelector("button[type='submit']");
    submit.disabled = true;
    submit.textContent = "Sending...";
    try {
      const data = await apiPost("/api/status-link", {
        quoteRef: document.getElementById("status-quote").value.trim(),
        contact: document.getElementById("status-contact").value.trim(),
      });
      renderLookupForm(data.message || "If the information matches, Milford Photo will email a secure status link.");
    } catch (error) {
      panel.querySelector(".quote-status-message")?.remove();
      event.currentTarget.insertAdjacentHTML("afterbegin", `<div class="quote-status-message is-error">${escapeHtml(error.message || "Unable to request a status link.")}</div>`);
    } finally {
      submit.disabled = false;
      submit.textContent = "Send status link";
    }
  });
}

function renderStatus(data = {}) {
  panel.innerHTML = `
    <section class="quote-status-summary">
      <div>
        <p class="brand-line">Quote ${escapeHtml(data.quoteRef || "")}</p>
        <h2>${escapeHtml(data.status?.label || "Quote status")}</h2>
        <p>${escapeHtml(data.status?.copy || "")}</p>
      </div>
      <div class="quote-status-total">
        <span>${escapeHtml(data.itemCount || 0)} item${Number(data.itemCount) === 1 ? "" : "s"}</span>
        <strong>${escapeHtml(data.offerSummary || "Offer pending")}</strong>
      </div>
    </section>
    <ol class="quote-status-steps" aria-label="Quote progress">
      ${(data.steps || []).map((step) => `
        <li class="quote-status-step is-${escapeAttr(step.state)}">
          <span>${escapeHtml(step.label)}</span>
        </li>
      `).join("")}
    </ol>
    <section class="quote-status-details">
      <article>
        <h3>Delivery</h3>
        <p>${escapeHtml(data.delivery || "-")}</p>
        <p>${data.labelReady ? "Prepaid label ready" : "No active label shown"}</p>
        <p>Tracking: ${escapeHtml(data.trackingNumber || "-")}</p>
      </article>
      <article>
        <h3>Payout</h3>
        <p>${escapeHtml(data.paymentLabel || "To be selected after final quote")}</p>
      </article>
    </section>
  `;
}

async function apiGet(path) {
  const response = await fetch(`${API_BASE}${path}`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed with ${response.status}`);
  return data;
}

async function apiPost(path, payload) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed with ${response.status}`);
  return data;
}

function resolveApiBase() {
  const configured = params.get("apiBase") || "";
  if (configured) return configured.replace(/\/$/, "");
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") return "http://localhost:8787";
  return "https://milford-used-gear-system-mvp.milfordphoto.workers.dev";
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(value = "") {
  return escapeHtml(value).replace(/'/g, "&#39;");
}
