const DEMO_QUEUE_KEY = "mpUsedGearStaffQueue";
const API_BASE = resolveApiBase();

const els = {
  panel: document.getElementById("final-panel"),
  title: document.getElementById("final-title"),
  intro: document.getElementById("final-intro"),
};

const state = {
  quoteRef: new URLSearchParams(window.location.search).get("quote") || "",
  token: new URLSearchParams(window.location.search).get("token") || "",
  records: [],
  decisions: {},
  payout: "",
  submitted: false,
  mode: "demo",
  loadError: "",
};

async function init() {
  state.records = await matchingRecords();
  state.payout = existingPayoutPreference(state.records);
  state.submitted = hasSubmittedFinalDecision(state.records);
  state.records.forEach((record) => {
    state.decisions[record.id] = existingDecision(record) || defaultDecision(record);
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
      const params = new URLSearchParams({ quote: state.quoteRef });
      if (state.token) params.set("token", state.token);
      const data = await apiGet(`/api/final-quote?${params}`);
      state.mode = "api";
      state.loadError = "";
      return data.records || [];
    } catch (error) {
      state.loadError = error.message || "Unable to load this final quote.";
      state.mode = "demo";
      return [];
    }
  }
  return [];
}

function render() {
  if (!state.records.length) {
    renderMissing();
    renderTotals();
    return;
  }

  setFinalHeader(
    "Review your final quote",
    "Choose which items you want to sell to Milford Photo and which items you would like returned.",
  );

  if (state.submitted) {
    renderSubmitted({ alreadySubmitted: true });
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
      ${renderFinalFaq()}
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
  setFinalHeader(
    "Final quote unavailable",
    "Use the secure final quote link from your Milford Photo email.",
  );

  els.panel.innerHTML = `
    <div class="section-heading">
      <p>Final</p>
      <h2>Quote not found</h2>
    </div>
    <div class="final-intro-card">
      <strong>${state.loadError ? escapeHtml(state.loadError) : "We could not find this quote."}</strong>
      <span>Use the secure final quote link from Milford Photo. If the link expired or was copied incorrectly, reply to the email and Milford Photo can resend it.</span>
    </div>
    <div class="final-empty-actions">
      <a class="secondary-action" href="./index.html">Start another quote</a>
    </div>
  `;
}

function renderItem(record, index) {
  const fields = record.fields || {};
  const title = itemTitle(fields);
  const finalOffer = offerFor(fields);
  const originalOffer = numberOrNull(fields["Milford Offer"]);
  const offerChanged = originalOffer !== null && originalOffer !== finalOffer;
  const finalStoreCredit = storeCreditForCash(finalOffer);
  const condition = verifiedConditionFor(fields) || fields.Condition || "Condition not listed";
  const status = fields.Status || "Final quote ready";
  const reasons = adjustmentReasons(fields, originalOffer, finalOffer);
  const staffNotAccepted = staffDecisionFromNotes(fields) === "not_accepted";
  const accepted = state.decisions[record.id] === "accept";
  const returned = state.decisions[record.id] === "return";
  const image = finalProductImageForRecord(fields);

  return `
    <article class="final-item" data-record-id="${escapeAttribute(record.id)}">
      <div class="final-item-decision-row">
        <div class="final-item-main">
          <span class="final-item-number" aria-label="Item ${index + 1}">${index + 1}</span>
          ${finalProductImageMarkup(image, "final-item-image", fields["Item Brand"])}
          <div>
            <h3>${escapeHtml(title)}</h3>
            <p>${escapeHtml(condition)} · ${escapeHtml(status)}</p>
          </div>
        </div>
        <div class="final-item-actions" role="group" aria-label="${escapeAttribute(title)} decision">
          <label class="final-choice-card final-choice-card-compact final-choice-card-sell ${staffNotAccepted ? "is-disabled" : ""}">
            <input type="radio" name="decision-${escapeAttribute(record.id)}" value="accept" ${accepted ? "checked" : ""} ${staffNotAccepted ? "disabled" : ""} />
            <span>
              <strong>Sell this item</strong>
              <small>${staffNotAccepted ? "Not available for this item." : "Be paid for this item."}</small>
            </span>
          </label>
          <label class="final-choice-card final-choice-card-compact final-choice-card-return">
            <input type="radio" name="decision-${escapeAttribute(record.id)}" value="return" ${returned ? "checked" : ""} />
            <span>
              <strong>Return this item</strong>
              <small>Ship this item back to me.</small>
            </span>
          </label>
        </div>
        <div class="final-item-price ${returned ? "is-return" : ""}">
          ${renderFinalOfferPanel({
            finalOffer,
            finalStoreCredit,
            originalOffer,
            offerChanged,
            returned,
          })}
        </div>
      </div>
      ${reasons.length ? `
        <div class="final-adjustment">
          <strong>Why this item changed</strong>
          <ul>
            ${reasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join("")}
          </ul>
        </div>
      ` : ""}
    </article>
  `;
}

function renderPayout() {
  const contact = customerContactInfo();
  return `
    <section class="final-payout">
      <div class="final-payout-summary" aria-label="Quote summary">
        <div class="final-payout-summary-copy">
          <span>Quote summary</span>
          <strong id="final-quote-ref">${escapeHtml(state.quoteRef || "-")}</strong>
          <small id="final-cash-copy">Final offer for accepted items</small>
        </div>
        <div class="final-payout-total">
          <span id="final-total-label">Total accepted offer</span>
          <strong id="final-cash-total">$0</strong>
          <div class="final-credit-card final-summary-credit-card" id="final-summary-credit-card" hidden>
            <span id="final-store-credit-label">Get 10% more with store credit</span>
            <strong id="final-store-credit-total">$0 store credit</strong>
          </div>
        </div>
      </div>
      <div class="section-heading final-small-heading">
        <p>Payout</p>
        <h2>How would you like to be paid?</h2>
        <span>Choose a payout method for the items you are selling.</span>
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
          <input type="radio" name="payout" value="store_credit" ${state.payout === "store_credit" ? "checked" : ""} />
          <span>
            <strong>Store credit</strong>
            <small>Includes the Milford Photo store credit bonus.</small>
          </span>
        </label>
      </div>
      <div class="final-address-note">
        <strong>Confirm where Milford Photo should send anything owed or returned.</strong>
        <p>Returned gear and mailed checks will be sent to this address. Store credit will be sent to the email on this quote.</p>
        <div>
          <span>${escapeHtml(contact.addressText || "No mailing address is saved on this quote.")}</span>
          <span>${escapeHtml(contact.email || "No email is saved on this quote.")}</span>
        </div>
      </div>
    </section>
  `;
}

function renderFinalFaq() {
  return `
    <section class="final-faq" aria-labelledby="final-faq-title">
      <h2 id="final-faq-title">Common questions</h2>
      <div class="sell-faq">
        <details>
          <summary>When will returned gear be shipped back?</summary>
          <p>Milford Photo prepares return shipments after you submit your decision. You will receive an email with tracking when returned gear is packed and ready to ship.</p>
        </details>
        <details>
          <summary>How long will it take to issue a check by mail?</summary>
          <p>Checks are usually prepared within 1-2 business days after accepted items are processed. Mailing time depends on USPS delivery.</p>
        </details>
        <details>
          <summary>How long will it take to receive store credit?</summary>
          <p>Store credit is usually issued within 1 business day after accepted items are processed. Milford Photo will email the store credit code or instructions.</p>
        </details>
      </div>
    </section>
  `;
}

function bindForm() {
  document.querySelectorAll("[data-record-id]").forEach((item) => {
    item.querySelectorAll("input[type='radio']").forEach((input) => {
      input.addEventListener("change", () => {
        state.decisions[item.dataset.recordId] = input.value;
        clearFormError();
        renderTotals();
        updateItemOfferPanels();
      });
    });
  });

  document.querySelectorAll("input[name='payout']").forEach((input) => {
    input.addEventListener("change", () => {
      state.payout = input.value;
      clearFormError();
      renderTotals();
    });
  });

  document.getElementById("final-decision-form").addEventListener("submit", submitDecision);
}

async function submitDecision(event) {
  event.preventDefault();
  const submitButton = event.currentTarget.querySelector("button[type='submit']");
  const hasAcceptedItems = state.records.some((record) => state.decisions[record.id] !== "return");
  if (hasAcceptedItems && !state.payout) {
    renderFormError("Choose how you would like to be paid before submitting.");
    return;
  }
  submitButton.disabled = true;
  submitButton.textContent = "Submitting...";

  if (state.mode === "api") {
    try {
      await apiPost("/api/final-decision", {
        quoteRef: state.quoteRef,
        token: state.token,
        paymentMethod: hasAcceptedItems ? state.payout : "",
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
  const queuedRecords = readDemoQueue();
  const preservedRecords = queuedRecords.filter((record) => record.fields?.["Quote Reference"] !== state.quoteRef);
  const updated = state.records.map((record) => {
    const decision = state.decisions[record.id] || "accept";
    const action = decision === "accept" ? "accepted" : "return";
    const fields = {
      ...record.fields,
      Status: decision === "accept" ? "Customer Accepted Item" : "Return Item",
      "Payment Method": hasAcceptedItems ? payoutLabel(state.payout) : "",
      "Staff Notes": appendCustomerDecision(record.fields?.["Staff Notes"], decision, action, now),
    };
    return { ...record, fields };
  });

  localStorage.setItem(DEMO_QUEUE_KEY, JSON.stringify([...preservedRecords, ...updated]));
  state.records = updated;
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

function clearFormError() {
  document.querySelector(".final-error")?.remove();
}

function renderSubmitted(options = {}) {
  const acceptedCount = Object.values(state.decisions).filter((decision) => decision === "accept").length;
  const returnCount = Object.values(state.decisions).filter((decision) => decision === "return").length;
  setFinalHeader(
    options.alreadySubmitted ? "Quote decision already sent" : "Quote decision sent",
    options.alreadySubmitted
      ? "Milford Photo already has your response for this final quote."
      : "Milford Photo has your response and will follow up with payment or return updates.",
  );

  els.panel.innerHTML = `
    <div class="section-heading">
      <p>Done</p>
      <h2>${options.alreadySubmitted ? "Your decision was already sent" : "Your decision has been sent"}</h2>
    </div>
    <div class="final-intro-card">
      <strong>Milford Photo has your response for quote ${escapeHtml(state.quoteRef)}.</strong>
      <span>${acceptedCount} item${acceptedCount === 1 ? "" : "s"} accepted, ${returnCount} item${returnCount === 1 ? "" : "s"} marked for return. This link can no longer be used to change the decision.</span>
    </div>
    <div class="final-next-steps">
      <h3>What happens next</h3>
      <ol>
        ${acceptedCount ? `<li>Milford Photo will process accepted items using ${escapeHtml(payoutLabel(state.payout))}.</li>` : ""}
        <li>If you requested any returns, staff will prepare those items for return shipping.</li>
        <li>You will receive an update when payment or return shipment is ready.</li>
      </ol>
    </div>
    <div class="final-empty-actions">
      <a class="secondary-action" href="./index.html">Start another quote</a>
    </div>
  `;
  renderTotals();
}

function setFinalHeader(title, intro) {
  if (els.title) els.title.textContent = title;
  if (els.intro) els.intro.textContent = intro;
}

function renderTotals() {
  const accepted = state.records.filter((record) => state.decisions[record.id] !== "return");
  const cashTotal = accepted.reduce((total, record) => total + offerFor(record.fields || {}), 0);
  const storeCreditTotal = storeCreditForCash(cashTotal);
  const summary = summaryEls();

  if (!summary.cashTotal || !summary.totalLabel) return;
  const storeCreditSelected = state.payout === "store_credit";
  const totalAmount = storeCreditSelected ? storeCreditTotal : cashTotal;
  summary.quoteRef.textContent = state.quoteRef || "-";
  summary.totalLabel.textContent = storeCreditSelected ? "Total accepted store credit" : "Total accepted offer";
  summary.cashTotal.textContent = formatMoney(totalAmount);
  if (summary.storeCreditCard) {
    summary.storeCreditCard.hidden = !accepted.length || storeCreditSelected;
  }
  if (summary.storeCreditLabel) {
    summary.storeCreditLabel.textContent = "Get 10% more with store credit";
  }
  if (summary.storeCreditTotal) summary.storeCreditTotal.textContent = `${formatMoney(storeCreditTotal)} store credit`;
  summary.cashCopy.textContent = accepted.length
    ? `${accepted.length} accepted item${accepted.length === 1 ? "" : "s"}`
    : "No items selected for payout";
}

function summaryEls() {
  return {
    quoteRef: document.getElementById("final-quote-ref"),
    totalLabel: document.getElementById("final-total-label"),
    cashTotal: document.getElementById("final-cash-total"),
    storeCreditCard: document.getElementById("final-summary-credit-card"),
    storeCreditLabel: document.getElementById("final-store-credit-label"),
    storeCreditTotal: document.getElementById("final-store-credit-total"),
    cashCopy: document.getElementById("final-cash-copy"),
  };
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
  const decision = customerFinalDecisionFromNotes(record.fields?.["Staff Notes"]);
  if (decision === "accept" || decision === "return") return decision;
  if (decision === "not_accepted") return "return";
  return "";
}

function staffDecisionFromNotes(fields = {}) {
  return staffReviewDecisionFromNotes(fields["Staff Notes"]);
}

function customerFinalDecisionFromNotes(notes = "") {
  const decisions = customerFinalDecisionBlocks(notes);
  return decisions.length ? decisions[decisions.length - 1] : "";
}

function customerFinalDecisionBlocks(notes = "") {
  const decisions = [];
  let inCustomerDecisionBlock = false;
  String(notes || "").split(/\r?\n/).forEach((line) => {
    const clean = line.trim();
    if (!clean) return;
    if (clean === "CUSTOMER FINAL QUOTE DECISION") {
      inCustomerDecisionBlock = true;
      return;
    }
    if (inCustomerDecisionBlock && /^(INTAKE REVIEW|ORDER UPDATE|RETURN SHIPMENT)$/i.test(clean)) {
      inCustomerDecisionBlock = false;
      return;
    }
    if (inCustomerDecisionBlock && clean.startsWith("Customer decision:")) {
      const decision = clean.replace("Customer decision:", "").trim().toLowerCase();
      if (decision) decisions.push(decision);
    }
  });
  return decisions;
}

function staffReviewDecisionFromNotes(notes = "") {
  let decision = "";
  let inIntakeReview = false;
  String(notes || "").split(/\r?\n/).forEach((line) => {
    const clean = line.trim();
    if (!clean) return;
    if (clean === "INTAKE REVIEW") {
      inIntakeReview = true;
      return;
    }
    if (/^(CUSTOMER FINAL QUOTE DECISION|ORDER UPDATE|RETURN SHIPMENT)$/i.test(clean)) {
      inIntakeReview = false;
      return;
    }
    if (inIntakeReview && clean.startsWith("Customer decision:")) {
      decision = clean.replace("Customer decision:", "").trim().toLowerCase();
    }
  });
  return decision;
}

function defaultDecision(record) {
  return staffDecisionFromNotes(record.fields || {}) === "not_accepted" ? "return" : "accept";
}

function hasSubmittedFinalDecision(records = []) {
  return records.some((record) => ["accept", "return"].includes(customerFinalDecisionFromNotes(record.fields?.["Staff Notes"])));
}

function existingPayoutPreference(records = []) {
  const fields = records.find((record) => record?.fields?.["Payment Method"])?.fields || {};
  return normalizePayoutPreference(fields["Payment Method"] || paymentPreferenceFromNotes(records));
}

function paymentPreferenceFromNotes(records = []) {
  for (const record of records) {
    const matches = String(record.fields?.["Staff Notes"] || "").match(/Payment preference:\s*([^\n]+)/gi) || [];
    const last = matches[matches.length - 1] || "";
    if (last) return last.replace(/Payment preference:/i, "").trim();
  }
  return "";
}

function normalizePayoutPreference(value = "") {
  const normalized = String(value || "").trim().toLowerCase().replace(/[_-]+/g, " ");
  if (normalized.includes("store")) return "store_credit";
  if (normalized.includes("check")) return "check";
  return "";
}

function renderFinalOfferPanel({ finalOffer, finalStoreCredit, originalOffer, offerChanged, returned }) {
  if (returned) {
    return `
      <span>Final offer</span>
      <strong class="final-return-label">Return</strong>
      <small>Ship this item back to me.</small>
      <small>Final offer was ${formatMoney(finalOffer)} / ${formatMoney(finalStoreCredit)} store credit</small>
      ${offerChanged ? `<small>Original online offer ${formatMoney(originalOffer)} / ${formatMoney(storeCreditForCash(originalOffer))} store credit</small>` : ""}
    `;
  }

  return `
    <span>Final offer</span>
    <strong>${formatMoney(finalOffer)}</strong>
    ${renderStoreCreditCard(finalStoreCredit)}
    ${offerChanged ? `<small>Original online offer ${formatMoney(originalOffer)} / ${formatMoney(storeCreditForCash(originalOffer))} store credit</small>` : ""}
  `;
}

function renderStoreCreditCard(amount) {
  return `
    <div class="final-credit-card">
      <span>Get 10% more with store credit</span>
      <strong>${formatMoney(amount)} store credit</strong>
    </div>
  `;
}

function updateItemOfferPanels() {
  state.records.forEach((record) => {
    const fields = record.fields || {};
    const panel = document.querySelector(`[data-record-id="${cssEscape(record.id)}"] .final-item-price`);
    if (!panel) return;
    const finalOffer = offerFor(fields);
    const originalOffer = numberOrNull(fields["Milford Offer"]);
    const offerChanged = originalOffer !== null && originalOffer !== finalOffer;
    const returned = state.decisions[record.id] === "return";
    panel.classList.toggle("is-return", returned);
    panel.innerHTML = renderFinalOfferPanel({
      finalOffer,
      finalStoreCredit: storeCreditForCash(finalOffer),
      originalOffer,
      offerChanged,
      returned,
    });
  });
}

function cssEscape(value = "") {
  if (window.CSS && typeof window.CSS.escape === "function") return window.CSS.escape(String(value));
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function customerContactInfo() {
  const fields = state.records[0]?.fields || {};
  const cityLine = [fields["Seller City"], fields["Seller State"], fields["Seller ZIP"]].filter(Boolean).join(", ");
  return {
    email: fields["Seller Email"] || "",
    addressText: [fields["Seller Name"], fields["Seller Street"], cityLine].filter(Boolean).join("\n"),
  };
}

function itemTitle(fields) {
  return [fields["Item Brand"], fields["Item Model"]].filter(Boolean).join(" ") || "Used gear";
}

function finalProductImageForRecord(fields = {}) {
  return finalProductImageFor({
    brand: fields["Item Brand"],
    category: fields.Category,
    model: fields["Item Model"],
  });
}

function finalProductImageFor(item = {}) {
  const overrides =
    typeof window !== "undefined" && window.MP_PRODUCT_IMAGE_OVERRIDES ? window.MP_PRODUCT_IMAGE_OVERRIDES : {};
  const key = finalProductImageKey(item.brand, item.category, item.model);
  return overrides[key] || null;
}

function finalProductImageKey(brand = "", category = "", model = "") {
  return [
    normalizeFinalProductImageText(brand),
    normalizeFinalProductImageCategory(category),
    normalizeFinalProductImageText(model),
  ].join("|");
}

function normalizeFinalProductImageCategory(category = "") {
  const text = normalizeFinalProductImageText(category);
  if (text.includes("lens")) return "lens";
  if (text.includes("film")) return "film camera";
  if (text.includes("camera") || text.includes("body")) return "digital camera";
  return text;
}

function normalizeFinalProductImageText(value = "") {
  return String(value)
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function finalProductImageMarkup(image, className, brand = "") {
  if (image?.src) {
    return `<img class="${escapeAttribute(className)}" src="${escapeAttribute(image.src)}" alt="${escapeAttribute(image.alt || "")}" loading="lazy" />`;
  }
  const label = String(brand || "").trim();
  return `<span class="${escapeAttribute(className)} is-placeholder" aria-label="${escapeAttribute(label ? `${label} image unavailable` : "Item image unavailable")}" role="img"></span>`;
}

function offerFor(fields) {
  return numberOrNull(fields["Final Offer"]) ?? numberOrNull(fields["Milford Offer"]) ?? 0;
}

function storeCreditForCash(cashAmount) {
  return Math.floor((Number(cashAmount) || 0) * 1.1);
}

function verifiedConditionFor(fields) {
  return String(fields["Verified Condition"] || "").trim() || inspectionDetailsFromNotes(fields["Staff Notes"]).verifiedCondition;
}

function adjustmentReasons(fields, originalOfferAmount, finalOfferAmount) {
  const publicReasons = meaningfulInspectionReason(fields["Adjustment Reasons"]);
  if (publicReasons) return uniqueReasons(inspectionReasonLines(publicReasons).map(punctuateSentence));

  const inspection = inspectionDetailsFromNotes(fields["Staff Notes"]);
  return itemAdjustmentReasons(fields, inspection, originalOfferAmount, finalOfferAmount);
}

function inspectionDetailsFromNotes(notes = "") {
  const parsed = {
    verifiedCondition: "",
    accessories: {},
    reason: "",
  };
  let inAccessoryCheck = false;
  let inReasonNotes = false;
  const reasonLines = [];

  String(notes || "").split("\n").forEach((line) => {
    const clean = line.trim();
    const lower = clean.toLowerCase();
    if (!clean) {
      inAccessoryCheck = false;
      return;
    }

    if (inReasonNotes && staffNoteLineStartsNewField(clean)) {
      inReasonNotes = false;
    } else if (inReasonNotes) {
      reasonLines.push(clean);
      return;
    }

    if (lower === "accessory check:") {
      parsed.accessories = {};
      inAccessoryCheck = true;
      inReasonNotes = false;
      return;
    }

    if (inAccessoryCheck && clean.startsWith("- ")) {
      const separatorIndex = clean.indexOf(":");
      if (separatorIndex > 2) {
        const name = clean.slice(2, separatorIndex).trim();
        const state = clean.slice(separatorIndex + 1).trim().toLowerCase();
        if (name) parsed.accessories[name] = state;
      }
      return;
    }

    if (inAccessoryCheck && !clean.startsWith("- ")) {
      inAccessoryCheck = false;
    }

    if (lower.startsWith("verified condition:")) {
      parsed.verifiedCondition = clean.replace(/verified condition:/i, "").trim();
    }
    if (lower.startsWith("reason / notes:")) {
      const firstReasonLine = clean.replace(/reason \/ notes:/i, "").trim();
      reasonLines.length = 0;
      if (firstReasonLine) reasonLines.push(firstReasonLine);
      inReasonNotes = true;
    }
  });

  parsed.reason = meaningfulInspectionReason(reasonLines.join("\n"));
  return parsed;
}

function itemAdjustmentReasons(fields, inspection, originalOfferAmount, finalOfferAmount) {
  const reasons = [];
  const missingAccessories = Object.entries(inspection.accessories || {})
    .filter(([, state]) => String(state || "").toLowerCase() === "missing")
    .map(([name]) => name);

  if (missingAccessories.length) {
    reasons.push(`Adjusted for missing ${joinHumanList(missingAccessories)}.`);
  }

  const originalCondition = String(fields.Condition || "").trim();
  const verifiedCondition = String(inspection.verifiedCondition || "").trim();
  if (originalCondition && verifiedCondition && !sameCustomerText(originalCondition, verifiedCondition)) {
    reasons.push(`Condition adjusted from ${originalCondition} to ${verifiedCondition}.`);
  }

  inspectionReasonLines(inspection.reason)
    .map(punctuateSentence)
    .filter((reason) => !reasons.some((existing) => sameReason(existing, reason)))
    .filter((reason) => !legacyAutoReason(reason, originalCondition, verifiedCondition, missingAccessories))
    .forEach((reason) => reasons.push(reason));

  if (!reasons.length && originalOfferAmount !== null && Number(finalOfferAmount || 0) !== Number(originalOfferAmount || 0)) {
    reasons.push(
      Number(finalOfferAmount || 0) > Number(originalOfferAmount || 0)
        ? "Final offer increased after inspection."
        : "Final offer changed after inspection.",
    );
  }

  return [...new Set(reasons)];
}

function inspectionReasonLines(reason = "") {
  return String(reason || "")
    .split(/\r?\n/)
    .flatMap((line) => {
      const clean = stripReasonBullet(line);
      if (!clean) return [];
      return clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [clean];
    })
    .map(stripReasonBullet)
    .filter(Boolean);
}

function stripReasonBullet(value = "") {
  return String(value || "").trim().replace(/^[-*•]\s+/, "").trim();
}

function sameReason(left = "", right = "") {
  return normalizeReason(left) === normalizeReason(right);
}

function normalizeReason(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^[-*•]\s+/, "")
    .replace(/[.!?]+$/g, "")
    .replace(/\s+/g, " ");
}

function uniqueReasons(reasons = []) {
  const seen = new Set();
  return reasons.filter((reason) => {
    const key = normalizeReason(reason);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function legacyAutoReason(reason, originalCondition, verifiedCondition, missingAccessories = []) {
  if (originalCondition && verifiedCondition && sameReason(reason, `Customer selected ${originalCondition}; inspection verified ${verifiedCondition}.`)) {
    return true;
  }
  if (!missingAccessories.length) return false;
  return sameReason(reason, `${missingAccessories.length === 1 ? "Missing accessory" : "Missing accessories"}: ${joinHumanList(missingAccessories)}.`);
}

function meaningfulInspectionReason(reason = "") {
  const clean = String(reason || "").trim();
  const normalized = clean.toLowerCase().replace(/\.$/, "");
  if (!clean) return "";
  if (["none", "n/a", "na"].includes(normalized)) return "";
  if (normalized === "created through staff in-store intake") return "";
  if (normalized.startsWith("created through staff")) return "";
  return clean;
}

function staffNoteLineStartsNewField(clean = "") {
  return /^(INTAKE REVIEW|ORDER UPDATE|CUSTOMER FINAL QUOTE DECISION|Received:|Item not received:|All recommended accessories included:|Verified condition:|Accessory check:|Customer decision:|Final offer:|Last staff action:|Updated:)/i.test(clean);
}

function sameCustomerText(left = "", right = "") {
  return String(left || "").trim().toLowerCase() === String(right || "").trim().toLowerCase();
}

function punctuateSentence(value = "") {
  const clean = String(value || "").trim();
  if (!clean) return "";
  return /[.!?]$/.test(clean) ? clean : `${clean}.`;
}

function joinHumanList(items = []) {
  const cleanItems = items.map((item) => String(item || "").trim()).filter(Boolean);
  if (cleanItems.length <= 1) return cleanItems[0] || "";
  if (cleanItems.length === 2) return `${cleanItems[0]} and ${cleanItems[1]}`;
  return `${cleanItems.slice(0, -1).join(", ")}, and ${cleanItems[cleanItems.length - 1]}`;
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
        "Seller Phone": "(203) 555-0100",
        "Seller Street": "22 River Street",
        "Seller City": "Milford",
        "Seller State": "CT",
        "Seller ZIP": "06460",
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
        "Seller Phone": "(203) 555-0100",
        "Seller Street": "22 River Street",
        "Seller City": "Milford",
        "Seller State": "CT",
        "Seller ZIP": "06460",
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
    {
      id: `${quoteRef}-nikon-f80`,
      fields: {
        "Quote Reference": quoteRef,
        "Seller Name": "Demo Customer",
        "Seller Email": "demo@example.com",
        "Seller Phone": "(203) 555-0100",
        "Seller Street": "22 River Street",
        "Seller City": "Milford",
        "Seller State": "CT",
        "Seller ZIP": "06460",
        "Item Brand": "Nikon",
        "Item Model": "F80 / N80",
        Category: "Camera Body - Film",
        Condition: "Excellent",
        "Milford Offer": 130,
        "Final Offer": 125,
        "Quote Submitted": submitted,
        Status: "Final Quote Sent",
        "Staff Notes": "INTAKE REVIEW\nReceived: Yes\nSerial number: DEMO-NIKON-F80\nVerified condition: Good\nCustomer decision: pending\nFinal offer: $125\nReason / notes: None",
      },
    },
  ];
}

function payoutLabel(value) {
  if (value === "paypal" || value === "bank_transfer") return "Check";
  if (value === "store_credit") return "Store credit";
  if (value === "check") return "Check";
  return "Choose payout method";
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
