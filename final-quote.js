const DEMO_QUEUE_KEY = "mpUsedGearStaffQueue";
const STORE_CREDIT_BONUS = 0.1;
const API_BASE = resolveApiBase();

const els = {
  panel: document.getElementById("final-panel"),
  quoteRef: document.getElementById("final-quote-ref"),
  cashTotal: document.getElementById("final-cash-total"),
  cashCopy: document.getElementById("final-cash-copy"),
  creditCard: document.getElementById("final-credit-card"),
  creditTotal: document.getElementById("final-credit-total"),
  summaryList: document.getElementById("final-summary-list"),
};

const state = {
  quoteRef: new URLSearchParams(window.location.search).get("quote") || "",
  records: [],
  decisions: {},
  payout: "check",
  submitted: false,
  mode: "demo",
};

async function init() {
  state.records = await matchingRecords();
  state.records.forEach((record) => {
    state.decisions[record.id] = existingDecision(record) || "accept";
  });
  render();
}

async function matchingRecords() {
  const records = readDemoQueue();
  if (!state.quoteRef && records.length) {
    state.quoteRef = records[0].fields?.["Quote Reference"] || "";
  }
  const matches = records.filter((record) => record.fields?.["Quote Reference"] === state.quoteRef);
  if (matches.length) {
    state.mode = "demo";
    return matches;
  }
  if (demoFinalEnabled()) {
    state.quoteRef = state.quoteRef || "MP-DEMO-FINAL";
    state.mode = "demo";
    return demoFinalRecords(state.quoteRef);
  }
  if (state.quoteRef) {
    try {
      const data = await apiGet(`/api/final-quote?quote=${encodeURIComponent(state.quoteRef)}`);
      state.mode = "api";
      return data.records || [];
    } catch {
      state.mode = "demo";
      return [];
    }
  }
  return [];
}

function render() {
  els.quoteRef.textContent = state.quoteRef || "-";
  if (!state.records.length) {
    renderMissing();
    renderTotals();
    return;
  }

  els.panel.innerHTML = `
    <div class="section-heading">
      <p>Final</p>
      <h2>${escapeHtml(state.quoteRef)}</h2>
    </div>
    <div class="final-intro-card">
      <strong>Milford Photo has completed inspection.</strong>
      <span>Review each item below. You can sell some items and ask Milford Photo to return others.</span>
    </div>
    <form id="final-decision-form" class="final-decision-form">
      <div class="final-item-list">
        ${state.records.map(renderItem).join("")}
      </div>
      ${renderPayout()}
      <label class="consent final-consent">
        <input id="final-confirm" type="checkbox" required />
        <span>I understand Milford Photo will process accepted items for payment and return any items I marked for return.</span>
      </label>
      <div class="form-actions">
        <a class="secondary-action" href="./index.html">Start another quote</a>
        <button class="primary-action" type="submit">Submit my decision</button>
      </div>
    </form>
  `;

  bindForm();
  renderTotals();
}

function renderMissing() {
  els.panel.innerHTML = `
    <div class="section-heading">
      <p>Final</p>
      <h2>Quote not found</h2>
    </div>
    <div class="final-intro-card">
      <strong>We could not find this quote in the demo queue.</strong>
      <span>For local testing, submit a quote with demo mode in this same browser, then open the final quote link again.</span>
    </div>
    <div class="final-empty-actions">
      <a class="primary-action" href="./index.html?demoQueue=1">Create demo quote</a>
      <a class="secondary-action" href="./staff.html?demo=1">Open staff dashboard</a>
    </div>
  `;
}

function renderItem(record, index) {
  const fields = record.fields || {};
  const title = itemTitle(fields);
  const finalOffer = offerFor(fields);
  const originalOffer = numberOrNull(fields["Milford Offer"]);
  const condition = fields.Condition || "Condition not listed";
  const status = fields.Status || "Final quote ready";
  const accepted = state.decisions[record.id] === "accept";
  const returned = state.decisions[record.id] === "return";

  return `
    <article class="final-item" data-record-id="${escapeAttribute(record.id)}">
      <div class="final-item-header">
        <div>
          <span class="final-item-number">${index + 1}</span>
          <h3>${escapeHtml(title)}</h3>
          <p>${escapeHtml(condition)} · ${escapeHtml(status)}</p>
        </div>
        <strong>${formatMoney(finalOffer)}</strong>
      </div>
      ${originalOffer !== null && originalOffer !== finalOffer ? `
        <div class="final-adjustment">
          <strong>Original online offer:</strong> ${formatMoney(originalOffer)}
        </div>
      ` : ""}
      ${adjustmentReason(fields) ? `
        <div class="final-adjustment">
          <strong>Inspection note:</strong> ${escapeHtml(adjustmentReason(fields))}
        </div>
      ` : ""}
      <div class="final-choice-grid">
        <label class="final-choice-card">
          <input type="radio" name="decision-${escapeAttribute(record.id)}" value="accept" ${accepted ? "checked" : ""} />
          <span>
            <strong>Sell this item</strong>
            <small>Milford Photo will include this item in payout.</small>
          </span>
        </label>
        <label class="final-choice-card">
          <input type="radio" name="decision-${escapeAttribute(record.id)}" value="return" ${returned ? "checked" : ""} />
          <span>
            <strong>Return this item</strong>
            <small>Milford Photo will prepare this item for return shipping.</small>
          </span>
        </label>
      </div>
    </article>
  `;
}

function renderPayout() {
  return `
    <section class="final-payout">
      <div class="section-heading final-small-heading">
        <p>Payout</p>
        <h2>How would you like to be paid?</h2>
      </div>
      <div class="final-choice-grid payout-grid">
        <label class="final-choice-card">
          <input type="radio" name="payout" value="check" ${state.payout === "check" ? "checked" : ""} />
          <span>
            <strong>Check</strong>
            <small>Milford Photo mails a check after accepted items are processed.</small>
          </span>
        </label>
        <label class="final-choice-card">
          <input type="radio" name="payout" value="bank_transfer" ${state.payout === "bank_transfer" ? "checked" : ""} />
          <span>
            <strong>Bank transfer</strong>
            <small>Milford Photo will send secure bank-transfer instructions.</small>
          </span>
        </label>
        <label class="final-choice-card">
          <input type="radio" name="payout" value="store_credit" ${state.payout === "store_credit" ? "checked" : ""} />
          <span>
            <strong>Store credit</strong>
            <small>Includes the Milford Photo store credit bonus.</small>
          </span>
        </label>
      </div>
    </section>
  `;
}

function bindForm() {
  document.querySelectorAll("[data-record-id]").forEach((item) => {
    item.querySelectorAll("input[type='radio']").forEach((input) => {
      input.addEventListener("change", () => {
        state.decisions[item.dataset.recordId] = input.value;
        renderTotals();
      });
    });
  });

  document.querySelectorAll("input[name='payout']").forEach((input) => {
    input.addEventListener("change", () => {
      state.payout = input.value;
      renderTotals();
    });
  });

  document.getElementById("final-decision-form").addEventListener("submit", submitDecision);
}

async function submitDecision(event) {
  event.preventDefault();
  const submitButton = event.currentTarget.querySelector("button[type='submit']");
  submitButton.disabled = true;
  submitButton.textContent = "Submitting...";

  if (state.mode === "api") {
    try {
      await apiPost("/api/final-decision", {
        quoteRef: state.quoteRef,
        paymentMethod: state.payout,
        decisions: state.records.map((record) => ({
          recordId: record.id,
          decision: state.decisions[record.id] || "accept",
        })),
      });
      renderSubmitted();
    } catch (error) {
      submitButton.disabled = false;
      submitButton.textContent = "Submit my decision";
      renderFormError(error.message || "Unable to submit your decision right now.");
    }
    return;
  }

  const now = new Date().toLocaleString();
  const updated = readDemoQueue().map((record) => {
    if (record.fields?.["Quote Reference"] !== state.quoteRef) return record;
    const decision = state.decisions[record.id] || "accept";
    const action = decision === "accept" ? "accepted" : "return";
    const fields = {
      ...record.fields,
      Status: decision === "accept" ? "Customer Accepted Item" : "Return Item",
      "Payment Method": payoutLabel(state.payout),
      "Staff Notes": appendCustomerDecision(record.fields?.["Staff Notes"], decision, action, now),
    };
    return { ...record, fields };
  });

  localStorage.setItem(DEMO_QUEUE_KEY, JSON.stringify(updated));
  state.submitted = true;
  renderSubmitted();
}

function renderFormError(message) {
  const existing = document.querySelector(".final-error");
  if (existing) existing.remove();
  const error = document.createElement("div");
  error.className = "quote-message final-error is-error";
  error.textContent = message;
  document.getElementById("final-decision-form")?.prepend(error);
}

function renderSubmitted() {
  const acceptedCount = Object.values(state.decisions).filter((decision) => decision === "accept").length;
  const returnCount = Object.values(state.decisions).filter((decision) => decision === "return").length;
  els.panel.innerHTML = `
    <div class="section-heading">
      <p>Done</p>
      <h2>Your decision has been sent</h2>
    </div>
    <div class="final-intro-card">
      <strong>Milford Photo has your response for quote ${escapeHtml(state.quoteRef)}.</strong>
      <span>${acceptedCount} item${acceptedCount === 1 ? "" : "s"} accepted, ${returnCount} item${returnCount === 1 ? "" : "s"} marked for return.</span>
    </div>
    <div class="final-next-steps">
      <h3>What happens next</h3>
      <ol>
        <li>Milford Photo will process accepted items using your selected payout method.</li>
        <li>If you requested any returns, staff will prepare those items for return shipping.</li>
        <li>You will receive an update when payment or return shipment is ready.</li>
      </ol>
    </div>
    <div class="final-empty-actions">
      <a class="primary-action" href="./staff.html?demo=1">Open staff dashboard</a>
      <a class="secondary-action" href="./index.html?demoQueue=1">Start another quote</a>
    </div>
  `;
  renderTotals();
}

function renderTotals() {
  const accepted = state.records.filter((record) => state.decisions[record.id] !== "return");
  const returned = state.records.filter((record) => state.decisions[record.id] === "return");
  const cashTotal = accepted.reduce((total, record) => total + offerFor(record.fields || {}), 0);
  const storeCredit = Math.round(cashTotal * (1 + STORE_CREDIT_BONUS));

  els.cashTotal.textContent = formatMoney(cashTotal);
  els.cashCopy.textContent = accepted.length
    ? `${accepted.length} accepted item${accepted.length === 1 ? "" : "s"}`
    : "No items selected for payout";
  els.creditTotal.textContent = formatMoney(storeCredit);
  els.creditCard.hidden = state.payout !== "store_credit" && cashTotal <= 0;
  els.summaryList.innerHTML = `
    <section>
      <h3>Accepted</h3>
      <p>${accepted.length || 0} item${accepted.length === 1 ? "" : "s"}</p>
    </section>
    <section>
      <h3>Returning</h3>
      <p>${returned.length || 0} item${returned.length === 1 ? "" : "s"}</p>
    </section>
    <section>
      <h3>Payout</h3>
      <p>${escapeHtml(payoutLabel(state.payout))}</p>
    </section>
  `;
}

function appendCustomerDecision(notes = "", decision, action, now) {
  return [
    notes,
    "",
    "CUSTOMER FINAL QUOTE DECISION",
    `Customer decision: ${decision}`,
    `Last staff action: ${action}`,
    `Decision submitted: ${now}`,
  ].join("\n").trim();
}

function existingDecision(record) {
  const notes = String(record.fields?.["Staff Notes"] || "");
  const line = notes.split("\n").find((item) => item.trim().startsWith("Customer decision:"));
  if (!line) return "";
  const decision = line.replace("Customer decision:", "").trim();
  if (decision === "accept" || decision === "return") return decision;
  return "";
}

function itemTitle(fields) {
  return [fields["Item Brand"], fields["Item Model"]].filter(Boolean).join(" ") || "Used gear";
}

function offerFor(fields) {
  return numberOrNull(fields["Final Offer"]) ?? numberOrNull(fields["Milford Offer"]) ?? 0;
}

function adjustmentReason(fields) {
  const notes = String(fields["Staff Notes"] || "");
  const line = notes.split("\n").find((item) => item.trim().startsWith("Reason / notes:"));
  if (!line) return "";
  return line.replace(/Reason \/ notes:/i, "").trim();
}

function readDemoQueue() {
  try {
    const records = JSON.parse(localStorage.getItem(DEMO_QUEUE_KEY) || "[]");
    return Array.isArray(records) ? records : [];
  } catch {
    return [];
  }
}

function resolveApiBase() {
  const config = window.MP_USED_GEAR_CONFIG || {};
  if (config.apiBase) return config.apiBase.replace(/\/$/, "");
  const host = window.location.hostname;
  if (window.location.protocol === "file:" || host === "localhost" || host === "127.0.0.1") {
    return "http://localhost:8787";
  }
  return "https://milford-used-gear-system-mvp.milfordphoto.workers.dev";
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

function demoFinalEnabled() {
  return new URLSearchParams(window.location.search).get("demoFinal") === "1";
}

function demoFinalRecords(quoteRef) {
  const submitted = new Date().toISOString();
  return [
    {
      id: `${quoteRef}-canon-r5`,
      fields: {
        "Quote Reference": quoteRef,
        "Seller Name": "Demo Customer",
        "Seller Email": "demo@example.com",
        "Item Brand": "Canon",
        "Item Model": "EOS R5",
        Category: "Digital Camera",
        Condition: "Excellent",
        "Milford Offer": 1379,
        "Final Offer": 1425,
        "Quote Submitted": submitted,
        Status: "Final Quote Sent",
        "Staff Notes": "INTAKE REVIEW\nReceived: Yes\nSerial number: DEMO-R5-123\nVerified condition: Excellent\nCustomer decision: pending\nFinal offer: $1425\nReason / notes: Condition verified slightly better than expected.",
      },
    },
    {
      id: `${quoteRef}-sigma-2470`,
      fields: {
        "Quote Reference": quoteRef,
        "Seller Name": "Demo Customer",
        "Seller Email": "demo@example.com",
        "Item Brand": "Sigma",
        "Item Model": "Art 24-70mm f/2.8 DG DN - Sony E mount",
        Category: "Lens",
        Condition: "Good",
        "Milford Offer": 555,
        "Final Offer": 520,
        "Quote Submitted": submitted,
        Status: "Final Quote Sent",
        "Staff Notes": "INTAKE REVIEW\nReceived: Yes\nSerial number: DEMO-SIGMA-2470\nVerified condition: Good\nCustomer decision: pending\nFinal offer: $520\nReason / notes: Rear cap was missing and barrel wear was heavier than entered.",
      },
    },
  ];
}

function payoutLabel(value) {
  if (value === "bank_transfer") return "Bank transfer";
  if (value === "store_credit") return "Store credit";
  return "Check";
}

function numberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function formatMoney(value) {
  return `$${Math.round(Number(value) || 0).toLocaleString()}`;
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttribute(value = "") {
  return escapeHtml(value).replace(/'/g, "&#39;");
}

init();
