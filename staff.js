const CONFIG = window.MP_USED_GEAR_CONFIG || {};
const API_BASE = resolveApiBase();
const TEST_EMPLOYEE = "employee";
const TEST_PASSWORD = "password";
const STAFF_SECRET = CONFIG.staffSecret || TEST_PASSWORD;
const SHOW_DEMO_ORDERS = new URLSearchParams(window.location.search).get("showDemo") === "1";
const MANUAL_BRAND = "__manual_brand";
const MANUAL_MODEL = "__manual_model";
const MANUAL_CATEGORY = "Manual Review / Vintage / Specialty";
const SELECT_CATEGORY = "";
const SELECT_BRAND = "";
const SELECT_MODEL = "";
const SEARCH_RESULT_LIMIT = 30;

const FALLBACK_CATEGORIES = [
  "Digital Camera",
  "Film Camera",
  "Lens",
  "Flash / Lighting",
  "Tripod / Support",
  "Bags & Cases",
  "Filters",
  "Video / Cinema Gear",
  MANUAL_CATEGORY,
];

const SIMPLE_CATEGORIES = [
  "Digital Camera",
  "Film Camera",
  "Lens",
  "Flash / Lighting",
  "Tripod / Support",
  "Bags & Cases",
  "Filters",
  "Video / Cinema Gear",
  MANUAL_CATEGORY,
];

const DEMO_ORDER_PATTERNS = [
  "codex",
  "test",
  "smoke",
  "browser flow",
  "safe label",
  "may 19",
  "red raven",
  "redravenuas",
  "mikewilson.filmmaker",
];
const SOFT_LAUNCH_STARTED_AT = Date.parse("2026-06-02T00:00:00Z");

const CONDITION_MULTIPLIERS = {
  "Like New": 0.7,
  Excellent: 0.6,
  Good: 0.5,
  "Well Used": 0.4,
  "Heavily Used": 0.25,
};

const CONDITION_COPY = {
  "Like New": "Very clean, minimal signs of use, fully working.",
  Excellent: "Light normal use, clean glass or sensor, fully working.",
  Good: "Visible wear, fully usable, no major defects.",
  "Well Used": "Heavy wear or missing parts; still usable.",
  "Heavily Used": "Damaged, incomplete, or uncertain operation.",
};

const STAFF_INTAKE_CONDITIONS = [
  { value: "like_new", label: "Like New", copy: CONDITION_COPY["Like New"] },
  { value: "excellent", label: "Excellent", copy: CONDITION_COPY.Excellent },
  { value: "good", label: "Good", copy: CONDITION_COPY.Good },
  { value: "well_used", label: "Well Used", copy: CONDITION_COPY["Well Used"] },
  { value: "heavily_used", label: "Heavily Used", copy: CONDITION_COPY["Heavily Used"] },
];

const STAFF_ACTION_STEPS = [
  { action: "received", label: "Mark item received", status: "Received - Needs Inspection", email: true },
  { action: "save", label: "Save item intake", status: "Inspection In Progress" },
  { action: "adjusted", label: "Finish item evaluation", status: "Evaluated", primary: true },
  { action: "accepted", label: "Mark item accepted", status: "Customer Accepted Item" },
  { action: "payment", label: "Payment sent", status: "Payment Sent", email: true },
  { action: "return", label: "Return item", status: "Return Item", email: true, danger: true },
];

const STATUS_LABELS = {
  quoted: "Instant offer",
  high_value_review: "Staff approval",
  manual_review: "Manual review",
  declined: "Declined",
};

const INCLUDED_ITEMS = {
  camera: [
    { name: "USB connection cable", value: 15, checked: true },
    { name: "Rechargeable battery", value: 60, checked: true },
    { name: "Charger", value: 50, checked: true },
    { name: "Body cap", value: 10, checked: true },
    { name: "Strap", value: 20, checked: true },
    { name: "Original box", value: 10, checked: false, bonus: true },
  ],
  filmCamera: [
    { name: "Body cap", value: 10, checked: true },
    { name: "Strap", value: 20, checked: true },
    { name: "Original box", value: 10, checked: false, bonus: true },
  ],
  lens: [
    { name: "Rear cap", value: 10, checked: true },
    { name: "Lens cap", value: 15, checked: true },
    { name: "Lens hood", value: 35, checked: true },
    { name: "Original box", value: 10, checked: false, bonus: true },
  ],
  default: [
    { name: "Original box", value: 10, checked: false, bonus: true },
  ],
};

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const WORKFLOW_STEPS = [
  { key: "initial", label: "Initial Quote" },
  { key: "shipped", label: "Shipped to Milford Photo" },
  { key: "received", label: "Receive" },
  { key: "evaluated", label: "Evaluate" },
  { key: "final", label: "Final Quote" },
  { key: "customer", label: "Customer Decision" },
  { key: "payout", label: "Payout" },
  { key: "return", label: "Items Shipped to Customer" },
];

const usernameInput = document.getElementById("staff-username");
const passwordInput = document.getElementById("staff-password");
const loadButton = document.getElementById("load-records");
const refreshButton = document.getElementById("refresh-records");
const pricingReviewButton = document.getElementById("open-pricing-review");
const startStaffIntakeButton = document.getElementById("start-staff-intake");
const staffSearchInput = document.getElementById("staff-search");
const staffFilterSelect = document.getElementById("staff-filter");
const staffSortSelect = document.getElementById("staff-sort");
const loginEl = document.getElementById("staff-login");
const statusEl = document.getElementById("staff-status");
const countEl = document.getElementById("record-count");
const workspaceEl = document.getElementById("staff-workspace");
const listEl = document.getElementById("records-list");
const detailEl = document.getElementById("staff-detail");
const filterButtons = Array.from(document.querySelectorAll(".staff-filter"));

let records = [];
let orders = [];
let selectedOrderId = null;
let selectedItemId = null;
let activeFilter = staffFilterSelect?.value || "active";
let activeSearch = "";
let activeSort = staffSortSelect?.value || "newest";
let pricingReviewRows = [];
let staffIntakeState = createStaffIntakeState();
let staffIntakePreviewTimer = null;
let staffIntakePreviewRequestId = 0;
let staffIntakeCartQuoteRequestId = 0;
let staffIntakeToastTimer = null;
let staffIntakeToastHideTimer = null;

const STAFF_INTAKE_PREVIEW_DELAY_MS = 300;

function createStaffIntakeState() {
  return {
    cart: [],
    currentQuote: null,
    currentQuoteSignature: "",
    currentQuoteLoading: false,
    currentQuoteError: "",
    cartQuote: null,
    cartQuoteSignature: "",
    cartQuoteLoading: false,
    cartQuoteError: "",
  };
}

function resolveApiBase() {
  if (CONFIG.apiBase) return CONFIG.apiBase.replace(/\/$/, "");
  const host = window.location.hostname;
  if (window.location.protocol === "file:" || host === "localhost" || host === "127.0.0.1") {
    return "http://localhost:8787";
  }
  return "https://milford-used-gear-system-mvp.milfordphoto.workers.dev";
}

async function loadRecords(options = {}) {
  const username = usernameInput.value.trim().toLowerCase();
  const password = passwordInput.value;
  const cookieAuthMode = CONFIG.staffAuthMode === "cookie";
  const secretAuthMode = CONFIG.staffAuthMode === "secret";
  if (!cookieAuthMode && !secretAuthMode && (username !== TEST_EMPLOYEE || password !== TEST_PASSWORD)) {
    setStatus("Use employee / password for this local test.", true);
    return;
  }

  setStatus("Loading orders...");
  loadButton.disabled = true;
  refreshButton.disabled = true;

  try {
    const response = await fetch(`${API_BASE}/api/staff/list`, {
      headers: staffAuthHeaders(),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Request failed with ${response.status}`);

    const allRecords = (data.records || []).sort(sortNewestFirst);
    const demoRecords = allRecords.filter(isDemoRecord);
    records = SHOW_DEMO_ORDERS ? allRecords : allRecords.filter((record) => !isDemoRecord(record));
    orders = buildOrders(records);
    if (options.selectQuoteRef) {
      selectedOrderId = orderIdForQuoteRef(options.selectQuoteRef) || selectedOrderId;
    }
    if (!orders.some((order) => order.id === selectedOrderId)) selectedOrderId = visibleOrders()[0]?.id || orders[0]?.id || null;
    syncSelectedItem();
    loginEl.hidden = true;
    workspaceEl.hidden = false;
    renderQueue();
    renderDetail();
    setStatus(demoRecords.length && !SHOW_DEMO_ORDERS ? `Orders loaded. ${demoRecords.length} demo order${demoRecords.length === 1 ? "" : "s"} hidden.` : "Orders loaded.");
  } catch (error) {
    records = [];
    orders = [];
    selectedOrderId = null;
    selectedItemId = null;
    renderQueue();
    renderDetail();
    setStatus(error.message || "Unable to load orders.", true);
  } finally {
    loadButton.disabled = false;
    refreshButton.disabled = false;
  }
}

function staffAuthHeaders() {
  return CONFIG.staffAuthMode === "cookie" ? {} : { "X-Staff-Secret": STAFF_SECRET };
}

function isDemoRecord(record) {
  const fields = record.fields || {};
  const hasSeller = Boolean(String(fields["Seller Name"] || fields["Seller Email"] || "").trim());
  const hasGear = Boolean(String(fields.Brand || fields.Model || fields.Category || "").trim());
  if (!hasSeller && !hasGear) return true;

  const submittedAt = Date.parse(fields["Quote Submitted"] || "");
  if (Number.isFinite(submittedAt) && submittedAt >= SOFT_LAUNCH_STARTED_AT) return false;

  const searchable = [
    fields["Seller Name"],
    fields["Seller Email"],
    fields["Seller Phone"],
    fields["Quote Reference"],
    fields.Brand,
    fields.Model,
    fields.Notes,
    fields["Staff Notes"],
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return DEMO_ORDER_PATTERNS.some((pattern) => searchable.includes(pattern));
}

function buildOrders(items) {
  const grouped = new Map();
  const quoteCounts = quoteReferenceCounts(items);
  items.forEach((record) => {
    const fields = record.fields || {};
    const quote = fields["Quote Reference"] || record.id;
    const customer = fields["Seller Name"] || "No customer name";
    const email = fields["Seller Email"] || "";
    const orderKey = orderGroupingKey(record, quoteCounts);
    if (!grouped.has(orderKey)) {
      grouped.set(orderKey, {
        id: orderKey,
        quote,
        quoteRefs: new Set(),
        synthetic: orderKey.startsWith("batch:"),
        customer,
        email,
        phone: fields["Seller Phone"] || "",
        address: orderAddress(fields),
        submitted: fields["Quote Submitted"],
        items: [],
      });
    }
    grouped.get(orderKey).quoteRefs.add(quote);
    grouped.get(orderKey).items.push(record);
  });

  return Array.from(grouped.values()).map((order) => {
    order.items.sort(sortNewestFirst);
    order.quoteRefs = Array.from(order.quoteRefs).filter(Boolean).sort();
    if (order.synthetic && order.quoteRefs.length > 1) {
      order.quote = `${order.quoteRefs[0]} + ${order.quoteRefs.length - 1}`;
    }
    order.totals = orderTotals(order);
    order.workflow = workflowState(order);
    return order;
  }).sort((a, b) => new Date(b.submitted || 0).getTime() - new Date(a.submitted || 0).getTime());
}

function renderQueue() {
  const filtered = visibleOrders();
  countEl.textContent = `${filtered.length} ${activeFilterLabel(activeFilter)} order${filtered.length === 1 ? "" : "s"}`;

  if (!filtered.length) {
    listEl.innerHTML = `<div class="staff-empty-card">No orders in this view.</div>`;
    return;
  }

  listEl.innerHTML = filtered.map(renderOrderCard).join("");
  listEl.querySelectorAll("[data-order-id]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedOrderId = button.dataset.orderId;
      syncSelectedItem();
      renderQueue();
      renderDetail();
    });
  });
}

function renderOrderCard(order) {
  const status = orderStatusLabel(order);
  const itemLabel = `${order.items.length} item${order.items.length === 1 ? "" : "s"}`;
  const total = order.totals.final || order.totals.original;
  const groupingNote = order.synthetic && order.items.length > 1 ? "Test grouped order" : "Order";

  return `
    <button class="staff-record-card ${order.id === selectedOrderId ? "is-selected" : ""}" type="button" data-order-id="${escapeAttr(order.id)}">
      <span class="staff-card-top">
        <strong>${escapeHtml(order.customer)}</strong>
        <span class="staff-status-pill">${escapeHtml(status)}</span>
      </span>
      <span class="staff-card-title">${escapeHtml(order.quote)}</span>
      <span class="staff-card-meta">${escapeHtml(groupingNote)} - ${escapeHtml(itemLabel)} - $${formatMoney(total)}</span>
    </button>
  `;
}

function orderStatusLabel(order) {
  if (order.workflow.isComplete) return "Complete";
  const needsManualReview = order.items.some((item) => staffWorkflowText(item.fields).includes("manual review"));
  if (needsManualReview && order.workflow.current.key === "shipped") return "Next: Manual review";
  return `Next: ${order.workflow.current.label}`;
}

function renderDetail() {
  const order = selectedOrder();
  const record = selectedRecord(order);
  if (!order || !record) {
    detailEl.innerHTML = `
      <div class="empty-detail">
        <p class="brand-line">Select an order</p>
        <h2>Choose a customer order</h2>
        <p>Open an order, switch between each gear tab, complete intake, then send the final quote for customer decisions.</p>
      </div>
    `;
    return;
  }

  const fields = record.fields || {};
  const accessories = accessoryListFor(fields);
  const parsed = parseStaffNotes(fields["Staff Notes"]);
  const baseOffer = numberOrNull(fields["Milford Offer"]) ?? 0;
  const finalOffer = numberOrNull(fields["Final Offer"]) ?? calculateOffer(fields, parsed, accessories, baseOffer);
  const paymentMethod = paymentMethodValue(fields);
  const defaultDecision = staffDecisionForRecord(record, order, finalOffer, parsed);

  detailEl.innerHTML = `
    <article class="staff-intake">
      ${renderOrderHeader(order)}
      ${renderOrderInfoGrid(order, fields, baseOffer, paymentMethod)}
      ${renderOrderProgress(order)}

      <header class="staff-intake-header">
        <div>
          <p class="brand-line">${escapeHtml(fields["Quote Reference"] || record.id)}</p>
          <h2>${escapeHtml(gearTitle(fields))}</h2>
          <p>${escapeHtml(fields.Category || "Gear")} - ${escapeHtml(fields.Condition || "Condition not listed")}</p>
        </div>
        <div class="staff-offer-box">
          <span>Item quote</span>
          <strong>$${formatMoney(finalOffer)}</strong>
          <small>${escapeHtml(fields.Status || "New")}</small>
        </div>
      </header>

      <form class="staff-review-form" id="staff-review-form">
        <section class="staff-review-section">
          <div class="staff-section-title">
            <span>1</span>
            <div>
              <h3>Receive this item</h3>
              <p>Confirm this specific piece of gear arrived in the box or in-store dropoff.</p>
            </div>
          </div>
          <label class="staff-check-row">
            <input type="checkbox" id="received-check" ${parsed.received || staffRecordLooksReceived(fields) ? "checked" : ""} />
            This item has been received
          </label>
        </section>

        <section class="staff-review-section">
          <div class="staff-section-title">
            <span>2</span>
            <div>
              <h3>Verify included items</h3>
              <p>Check what arrived. Missing recommended accessories can lower the final offer.</p>
            </div>
          </div>
          <div class="staff-accessory-grid">
            ${accessories.map((item) => renderAccessory(item, parsed)).join("")}
          </div>
          <label class="staff-check-row">
            <input type="checkbox" id="all-accessories-check" ${parsed.allAccessories || accessories.every((item) => parsed.accessories[item.name] !== false) ? "checked" : ""} />
            All recommended accessories included
          </label>
        </section>

        <section class="staff-review-section">
          <div class="staff-section-title">
            <span>3</span>
            <div>
              <h3>Verify condition</h3>
              <p>Changing the grade recalculates the suggested final offer.</p>
            </div>
          </div>
          <div class="staff-condition-grid">
            ${Object.keys(CONDITION_MULTIPLIERS).map((condition) => renderCondition(condition, parsed.verifiedCondition || fields.Condition)).join("")}
          </div>
        </section>

        <section class="staff-review-section">
          <div class="staff-section-title">
            <span>4</span>
            <div>
              <h3>Final item quote</h3>
              <p>Set the final item offer. Unchanged or higher offers default to acceptance; reduced offers wait for customer confirmation.</p>
            </div>
          </div>
          <div class="staff-adjust-grid">
            <label class="field">
              <span>Suggested final offer</span>
              <input id="suggested-offer" type="number" min="0" step="1" value="${finalOffer}" readonly />
            </label>
            <label class="field">
              <span>Custom final offer</span>
              <input id="custom-offer" type="number" min="0" step="1" value="${finalOffer}" />
            </label>
            <label class="field">
              <span>Payout method</span>
              <select id="payment-method">
                <option value="check" ${paymentMethod === "check" ? "selected" : ""}>Check</option>
                <option value="paypal" ${paymentMethod === "paypal" ? "selected" : ""}>PayPal</option>
                <option value="store_credit" ${paymentMethod === "store_credit" ? "selected" : ""}>Store credit</option>
              </select>
            </label>
          </div>
          <div class="staff-decision-grid">
            <label class="staff-decision-card">
              <input type="radio" name="item-decision" value="pending" ${defaultDecision === "pending" ? "checked" : ""} />
              <span>Await customer decision</span>
            </label>
            <label class="staff-decision-card">
              <input type="radio" name="item-decision" value="accept" ${defaultDecision === "accept" ? "checked" : ""} />
              <span>Customer accepts this item</span>
            </label>
            <label class="staff-decision-card">
              <input type="radio" name="item-decision" value="return" ${defaultDecision === "return" ? "checked" : ""} />
              <span>Customer wants this item returned</span>
            </label>
          </div>
          <label class="field">
            <span>Adjustment reason / inspection notes</span>
            <textarea id="inspection-notes" rows="5" placeholder="Example: Customer selected Excellent, but inspection found heavy body wear and missing charger.">${escapeHtml(parsed.reason || fields["Decline Reason"] || "")}</textarea>
          </label>
        </section>

        <section class="staff-actions-panel" aria-label="Item workflow actions">
          <div class="staff-actions-heading">
            <strong>Item workflow actions</strong>
            <span>Work left to right. Customer email actions ask for confirmation before sending.</span>
          </div>
          <div class="staff-action-steps">
            ${renderStaffActionSteps(fields, parsed)}
          </div>
        </section>
      </form>

      ${renderOrderDecisionPanel(order)}
    </article>
  `;

  bindDetail(record, accessories);
}

function renderOrderHeader(order) {
  return `
    <section class="staff-order-header">
      <div>
        <p class="brand-line staff-order-kicker">
          <span>Order ${escapeHtml(order.quote)}</span>
          <button class="staff-log-link" type="button" data-order-log="${escapeAttr(order.id)}">Open order log</button>
        </p>
        <h2>${escapeHtml(order.customer)}</h2>
        <p>${escapeHtml(order.items.length)} item${order.items.length === 1 ? "" : "s"} in this order${order.synthetic && order.items.length > 1 ? " - grouped for testing from same customer/address/time window" : ""}</p>
      </div>
      <div class="staff-order-total">
        <span>Final order total</span>
        <strong>$${formatMoney(order.totals.final || order.totals.original)}</strong>
        <small>Original quote: $${formatMoney(order.totals.original)}</small>
      </div>
    </section>
  `;
}

function renderOrderInfoGrid(order, fields, baseOffer, paymentMethod) {
  return `
    <div class="staff-info-grid staff-order-info-grid">
      <section>
        <h3>Seller</h3>
        <p>${escapeHtml(order.customer || "-")}</p>
        <p class="seller-address">${order.address || "-"}</p>
        <p>${escapeHtml(order.email || "-")}</p>
        <p>${escapeHtml(order.phone || "-")}</p>
      </section>
      <section>
        <h3>Original quote</h3>
        <p>Selected item cash offer: <strong>$${formatMoney(baseOffer)}</strong></p>
        <p>Order total: <strong>$${formatMoney(order.totals.original)}</strong></p>
        <p>Market estimate: ${moneyOrDash(fields["eBay Median Price"])}</p>
        <p>Quote source: ${escapeHtml(quoteSourceLabel(fields))}</p>
        <p>Pricing basis: ${escapeHtml(staffNoteValue(fields, "Pricing basis") || "-")}</p>
        <p>Price last reviewed: ${escapeHtml(staffNoteValue(fields, "Price last reviewed") || "-")}</p>
        <p><a href="${escapeAttr(ebaySoldListingsUrl(fields))}" target="_blank" rel="noreferrer">Search eBay sold listings</a></p>
        <p>Expires: ${formatDate(fields["Quote Expires"]) || "-"}</p>
      </section>
      <section>
        <h3>Shipping</h3>
        <p>Incoming tracking: ${escapeHtml(incomingTrackingNumber(fields))}</p>
        <p>Outgoing tracking: ${escapeHtml(outgoingTrackingNumber(fields))}</p>
        <p>${fields["Shippo Label URL"] ? `<a href="${escapeAttr(fields["Shippo Label URL"])}" target="_blank" rel="noreferrer">Open inbound label</a>` : "No inbound label link"}</p>
        <p>Payment method: ${escapeHtml(paymentMethodLabel(paymentMethod))}</p>
      </section>
    </div>
  `;
}

function renderStaffActionSteps(fields, parsed) {
  return STAFF_ACTION_STEPS.map((step, index) => {
    const completed = staffActionCompleted(step.action, fields, parsed);
    const classes = [
      "staff-step-action",
      step.primary ? "is-primary" : "",
      step.danger ? "is-danger" : "",
      completed ? "is-complete" : "",
    ].filter(Boolean).join(" ");
    const meta = completed ? "Completed" : step.email ? "Emails customer" : "No customer email";
    return `
      <button class="${classes}" type="button" data-action="${escapeAttr(step.action)}">
        <span class="staff-step-number">${index + 1}</span>
        <span class="staff-step-copy">
          <strong>${escapeHtml(step.label)}</strong>
          <small>${escapeHtml(meta)}</small>
        </span>
      </button>
    `;
  }).join("");
}

function renderOrderProgress(order) {
  return `
    <section class="staff-order-progress" aria-label="Order status and item navigation">
      <div class="staff-order-progress-group">
        <div class="staff-progress-heading">
          <strong>Order status</strong>
          <span>Overall customer order workflow</span>
        </div>
        ${renderWorkflow(order)}
      </div>
      <div class="staff-order-progress-group">
        <div class="staff-progress-heading">
          <strong>Items in this order</strong>
          <span>Open each item to receive and evaluate it</span>
        </div>
        ${renderItemTabs(order)}
      </div>
    </section>
  `;
}

function renderWorkflow(order) {
  return `
    <nav class="staff-workflow" aria-label="Order workflow">
      ${WORKFLOW_STEPS.map((step, index) => {
        const state = order.workflow.completed.has(step.key) ? "is-complete" : step.key === order.workflow.current.key ? "is-current" : "";
        return `
          <div class="staff-workflow-step ${state}">
            <span>${index + 1}</span>
            <strong>${escapeHtml(step.label)}</strong>
          </div>
        `;
      }).join("")}
    </nav>
  `;
}

function renderItemTabs(order) {
  return `
    <div class="staff-item-tabs" role="tablist" aria-label="Gear items in order">
      ${order.items.map((item, index) => {
        const fields = item.fields || {};
        const statusClass = itemStatusClass(item);
        return `
          <button class="staff-item-tab ${statusClass} ${item.id === selectedItemId ? "is-active" : ""}" type="button" data-item-id="${escapeAttr(item.id)}">
            <span>${index + 1}</span>
            ${escapeHtml(shortGearTitle(fields))}
          </button>
        `;
      }).join("")}
    </div>
  `;
}

function renderOrderDecisionPanel(order) {
  const evaluated = order.items.filter((item) => itemStatusClass(item) === "is-evaluated").length;
  const ready = evaluated === order.items.length;
  return `
    <section class="staff-order-decision">
      <div>
        <h3>Final quote email</h3>
        <p>${ready ? "All items are evaluated. Staff can send the item-by-item final quote for the customer to accept or return each item." : `${evaluated} of ${order.items.length} items evaluated. Finish every item before sending the final quote email.`}</p>
      </div>
      <button class="primary-action" type="button" id="send-final-quote" ${ready ? "" : "disabled"}>Send final quote email</button>
    </section>
  `;
}

function renderAccessory(item, parsed) {
  const checked = parsed.accessories[item.name] !== false;
  return `
    <label class="staff-accessory-item">
      <input type="checkbox" data-accessory="${escapeAttr(item.name)}" data-deduction="${item.deduction}" ${checked ? "checked" : ""} />
      <span>${escapeHtml(item.name)}</span>
      <strong>${formatAccessoryValue(item.deduction)}</strong>
    </label>
  `;
}

function renderCondition(condition, selectedCondition) {
  const checked = condition === selectedCondition;
  return `
    <label class="choice-card staff-condition-option ${checked ? "is-selected" : ""}">
      <input type="radio" name="verified-condition" value="${escapeAttr(condition)}" ${checked ? "checked" : ""} />
      <strong>${escapeHtml(condition)}</strong>
      <span>${escapeHtml(CONDITION_COPY[condition])}</span>
    </label>
  `;
}

function staffDecisionForRecord(record, order, finalOffer, parsed = parseStaffNotes(record?.fields?.["Staff Notes"])) {
  const fields = record?.fields || {};
  if (parsed.customerFinalDecision === "return") return "return";
  if (parsed.customerFinalDecision === "accept") return "accept";

  const status = staffWorkflowText(fields);
  if (status.includes("customer accepted") || status.includes("payment")) return "accept";

  if (!orderHasReducedFinalOffer(order, record, finalOffer)) return "accept";
  return itemOfferWasReduced(fields, finalOffer) ? "pending" : "accept";
}

function updateDefaultDecision(record, suggestedOffer) {
  const decisionInputs = Array.from(document.querySelectorAll("input[name='item-decision']"));
  if (!decisionInputs.length || decisionInputs.some((input) => input.dataset.userSelected === "true")) return;
  const customOffer = numberOrNull(document.getElementById("custom-offer")?.value);
  const finalOffer = customOffer ?? suggestedOffer;
  const decision = staffDecisionForRecord(record, selectedOrder(), finalOffer);
  decisionInputs.forEach((input) => {
    input.checked = input.value === decision;
  });
}

function orderHasReducedFinalOffer(order, currentRecord, currentFinalOffer) {
  return (order?.items || [currentRecord]).filter(Boolean).some((item) => {
    const fields = item.fields || {};
    const finalOffer = item.id === currentRecord?.id
      ? currentFinalOffer
      : numberOrNull(fields["Final Offer"]) ?? numberOrNull(fields["Milford Offer"]);
    return itemOfferWasReduced(fields, finalOffer);
  });
}

function itemOfferWasReduced(fields = {}, finalOffer) {
  const originalOffer = numberOrNull(fields["Milford Offer"]);
  const finalAmount = numberOrNull(finalOffer);
  return originalOffer !== null && finalAmount !== null && finalAmount < originalOffer;
}

function paymentMethodValue(fields = {}) {
  const raw = fields["Payment Method"]
    || noteValue(fields["Staff Notes"], "Payment preference")
    || staffNoteValue(fields, "Payment preference")
    || staffNoteValue(fields, "Preferred payout");
  const normalized = String(raw || "").toLowerCase();
  if (normalized.includes("store")) return "store_credit";
  if (normalized.includes("paypal") || normalized.includes("bank")) return "paypal";
  return "check";
}

function paymentMethodLabel(value = "") {
  if (value === "paypal") return "PayPal";
  if (value === "store_credit") return "Store credit";
  return "Check";
}

function bindDetail(record, accessories) {
  const form = document.getElementById("staff-review-form");
  const actionButtons = Array.from(form.querySelectorAll("[data-action]"));
  const allAccessoriesCheck = document.getElementById("all-accessories-check");
  const accessoryInputs = Array.from(form.querySelectorAll("[data-accessory]"));
  const sendFinalQuoteButton = document.getElementById("send-final-quote");

  detailEl.querySelectorAll("[data-item-id]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedItemId = button.dataset.itemId;
      renderDetail();
    });
  });

  detailEl.querySelector("[data-order-log]")?.addEventListener("click", () => {
    openOrderLog(selectedOrder());
  });

  form.querySelectorAll("input, textarea").forEach((input) => {
    if (input.name === "item-decision") return;
    input.addEventListener("input", () => updateSuggestedOffer(record, accessories));
    input.addEventListener("change", () => updateSuggestedOffer(record, accessories));
  });

  const customOfferInput = document.getElementById("custom-offer");
  customOfferInput?.addEventListener("input", () => {
    customOfferInput.dataset.customEdited = "true";
  });

  allAccessoriesCheck.addEventListener("change", () => {
    accessoryInputs.forEach((input) => {
      input.checked = allAccessoriesCheck.checked;
    });
    updateSuggestedOffer(record, accessories);
  });

  accessoryInputs.forEach((input) => {
    input.addEventListener("change", () => {
      allAccessoriesCheck.checked = accessoryInputs.every((item) => item.checked);
    });
  });

  form.querySelectorAll("input[name='verified-condition']").forEach((input) => {
    input.addEventListener("change", () => {
      form.querySelectorAll(".staff-condition-option").forEach((option) => option.classList.remove("is-selected"));
      input.closest(".staff-condition-option").classList.add("is-selected");
    });
  });

  form.querySelectorAll("input[name='item-decision']").forEach((input) => {
    input.addEventListener("change", () => {
      input.dataset.userSelected = "true";
    });
  });

  actionButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      await handleStaffAction(record, accessories, button.dataset.action, actionButtons);
    });
  });

  sendFinalQuoteButton.addEventListener("click", async () => {
    await handleOrderAction(selectedOrder(), "Final Quote Sent");
  });
}

function updateSuggestedOffer(record, accessories) {
  const fields = record.fields || {};
  const suggested = calculateOffer(fields, collectReviewState(accessories), accessories, numberOrNull(fields["Milford Offer"]) ?? 0);
  const suggestedInput = document.getElementById("suggested-offer");
  const customInput = document.getElementById("custom-offer");
  const previousSuggested = numberOrNull(suggestedInput.dataset.suggestedOffer ?? suggestedInput.value);
  const currentCustom = numberOrNull(customInput.value);
  const customDiffersFromPriorSuggestion = previousSuggested !== null
    && currentCustom !== null
    && currentCustom !== previousSuggested;
  const keepCustom = customInput.dataset.customEdited === "true"
    || document.activeElement === customInput
    || customDiffersFromPriorSuggestion;
  suggestedInput.value = suggested;
  suggestedInput.dataset.suggestedOffer = String(suggested);
  if (!keepCustom) customInput.value = suggested;
  updateDefaultDecision(record, suggested);
}

async function handleStaffAction(record, accessories, action, buttons) {
  const review = collectReviewState(accessories);
  const finalOffer = numberOrNull(document.getElementById("custom-offer").value)
    ?? numberOrNull(document.getElementById("suggested-offer")?.value)
    ?? 0;
  const status = staffActionStatus(action);
  if (!status) return;

  const body = {
    recordId: record.id,
    status,
    finalOffer,
    staffNotes: buildStaffNotes(review, action, finalOffer),
  };

  if (action === "payment") {
    body.action = "payment_sent";
    body.paymentMethod = document.getElementById("payment-method")?.value || "check";
  }
  if (action === "return") {
    body.declineReason = review.reason || "Customer wants this item returned.";
  }

  if (staffActionSendsCustomerEmail(action) && !confirmStaffActionEmail(action)) {
    setStatus("Action canceled. No customer email sent.");
    return;
  }

  setDetailBusy(buttons, true);
  setStatus("Saving item update...");

  try {
    const updated = await updateRecord(body);
    records = records.map((item) => (item.id === record.id ? updated : item));
    orders = buildOrders(records);
    selectedItemId = updated.id;
    selectedOrderId = selectedOrder()?.id || selectedOrderId;
    renderQueue();
    renderDetail();
    setStatus(`Saved: ${status}.`);
  } catch (error) {
    setStatus(error.message || "Unable to save item update.", true);
  } finally {
    setDetailBusy(buttons, false);
  }
}

function staffActionStatus(action) {
  return STAFF_ACTION_STEPS.find((step) => step.action === action)?.status || "";
}

function staffActionSendsCustomerEmail(action) {
  return Boolean(STAFF_ACTION_STEPS.find((step) => step.action === action)?.email);
}

function confirmStaffActionEmail(action) {
  const label = STAFF_ACTION_STEPS.find((step) => step.action === action)?.label || "This action";
  return window.confirm(`${label} will update the item and email the customer now. Continue?`);
}

async function handleOrderAction(order, status) {
  if (!order) return;
  setStatus("Saving order update...");
  try {
    const updatedRecords = await Promise.all(order.items.map((record) => updateRecord({
      recordId: record.id,
      status,
      staffNotes: appendOrderNote(record.fields?.["Staff Notes"], status),
    })));
    const updatedMap = new Map(updatedRecords.map((record) => [record.id, record]));
    records = records.map((record) => updatedMap.get(record.id) || record);
    orders = buildOrders(records);
    renderQueue();
    renderDetail();
    setStatus(`${status} saved for ${order.quote}.`);
  } catch (error) {
    setStatus(error.message || "Unable to save order update.", true);
  }
}

async function openOrderLog(order) {
  if (!order) return;
  showOrderLogModal(order, { loading: true });
  try {
    const history = await fetchOrderHistory(order);
    showOrderLogModal(order, { entries: buildOrderLogEntries(order, history) });
  } catch (error) {
    showOrderLogModal(order, { error: error.message || "Unable to load order log." });
  }
}

async function fetchOrderHistory(order) {
  const quoteRefs = order.quoteRefs?.length ? order.quoteRefs : [order.quote].filter(Boolean);
  const histories = await Promise.all(quoteRefs.map(async (quoteRef) => {
    const response = await fetch(`${API_BASE}/api/staff/history?quoteRef=${encodeURIComponent(quoteRef)}`, {
      headers: staffAuthHeaders(),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Request failed with ${response.status}`);
    return data;
  }));
  return {
    staffActions: histories.flatMap((history) => history.staffActions || []),
    emailEvents: histories.flatMap((history) => history.emailEvents || []),
  };
}

function showOrderLogModal(order, state = {}) {
  closeOrderLogModal();
  const modal = document.createElement("div");
  modal.className = "staff-log-modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "staff-log-title");

  const content = state.loading
    ? `<div class="staff-log-empty">Loading order log...</div>`
    : state.error
      ? `<div class="staff-log-empty is-error">${escapeHtml(state.error)}</div>`
      : renderOrderLogTimeline(state.entries || []);

  modal.innerHTML = `
    <div class="staff-log-backdrop" data-close-order-log></div>
    <section class="staff-log-panel">
      <header class="staff-log-header">
        <div>
          <p class="brand-line">Order log</p>
          <h2 id="staff-log-title">${escapeHtml(order.quote)}</h2>
          <p>${escapeHtml(order.customer)} - ${escapeHtml(order.items.length)} item${order.items.length === 1 ? "" : "s"}</p>
        </div>
        <button class="staff-log-close" type="button" data-close-order-log aria-label="Close order log">Close</button>
      </header>
      ${content}
    </section>
  `;
  document.body.append(modal);
  modal.querySelectorAll("[data-close-order-log]").forEach((button) => {
    button.addEventListener("click", closeOrderLogModal);
  });
  document.addEventListener("keydown", handleOrderLogKeydown);
}

function closeOrderLogModal() {
  document.querySelector(".staff-log-modal")?.remove();
  document.removeEventListener("keydown", handleOrderLogKeydown);
}

function handleOrderLogKeydown(event) {
  if (event.key === "Escape") closeOrderLogModal();
}

function renderOrderLogTimeline(entries) {
  if (!entries.length) return `<div class="staff-log-empty">No order activity has been recorded yet.</div>`;
  return `
    <ol class="staff-log-timeline">
      ${entries.map((entry) => `
        <li class="staff-log-entry">
          <div class="staff-log-entry-top">
            <span class="staff-log-actor is-${escapeAttr(entry.actorType)}">${escapeHtml(entry.actorLabel)}</span>
            <time>${escapeHtml(formatLogTimestamp(entry.timestamp))}</time>
          </div>
          <strong>${escapeHtml(entry.title)}</strong>
          ${entry.detail ? `<p>${escapeHtml(entry.detail)}</p>` : ""}
          ${entry.meta ? `<small>${escapeHtml(entry.meta)}</small>` : ""}
        </li>
      `).join("")}
    </ol>
  `;
}

function buildOrderLogEntries(order, history = {}) {
  const entries = [
    ...quoteSubmissionLogEntries(order),
    ...customerDecisionLogEntries(order),
    ...(history.staffActions || []).map(staffActionLogEntry),
    ...(history.emailEvents || []).map((record) => emailEventLogEntry(record, order)),
  ].filter(Boolean);

  return entries.sort((a, b) => (logTimestampValue(b.timestamp) - logTimestampValue(a.timestamp)));
}

function quoteSubmissionLogEntries(order) {
  const first = order.items[0]?.fields || {};
  const submitted = first["Quote Submitted"] || order.submitted;
  const source = String(first.Source || "").toLowerCase();
  const staffUser = noteValue(first["Staff Notes"], "Created by");
  const actorType = source.includes("staff") ? "staff" : "customer";
  const payment = paymentMethodLabel(paymentMethodValue(first));
  const delivery = staffDeliveryFromFields(first);
  return [{
    timestamp: submitted,
    actorType,
    actorLabel: actorType === "staff" ? `Staff: ${staffUser || "staff"}` : "Customer",
    title: actorType === "staff" ? "In-store quote created" : "Customer submitted quote",
    detail: `${order.items.length} item${order.items.length === 1 ? "" : "s"} added. Preferred payout: ${payment}. Delivery: ${delivery || "-"}.`,
    meta: `Quote ${order.quote}`,
  }];
}

function customerDecisionLogEntries(order) {
  return order.items.flatMap((record) => {
    const fields = record.fields || {};
    const decisions = parseCustomerDecisionBlocks(fields["Staff Notes"]);
    return decisions.map((decision) => ({
      timestamp: decision.submitted,
      actorType: "customer",
      actorLabel: "Customer",
      title: decision.decision === "return" ? "Customer requested item return" : "Customer accepted item",
      detail: `${shortGearTitle(fields)} - ${decision.decision === "return" ? "return to customer" : "sell to Milford Photo"}.`,
      meta: decision.paymentPreference ? `Payout preference: ${decision.paymentPreference}` : "",
    }));
  });
}

function staffActionLogEntry(record) {
  const fields = record.fields || {};
  const priorOffer = numberOrNull(fields["Prior Offer"]);
  const newOffer = numberOrNull(fields["New Offer"]);
  const offerMeta = priorOffer !== null && newOffer !== null && priorOffer !== newOffer
    ? `Offer changed from $${formatMoney(priorOffer)} to $${formatMoney(newOffer)}.`
    : "";
  const statusMeta = [fields["Prior Status"], fields["New Status"]].filter(Boolean).join(" -> ");
  return {
    timestamp: fields.Timestamp,
    actorType: "staff",
    actorLabel: `Staff: ${fields["Staff User"] || "unknown"}`,
    title: staffActionTitle(fields.Action || fields["New Status"]),
    detail: [statusMeta, offerMeta].filter(Boolean).join(" "),
    meta: compactLogNotes(fields.Notes || ""),
  };
}

function emailEventLogEntry(record, order) {
  const fields = record.fields || {};
  const recipient = fields.Recipient || "";
  const template = fields.Template || "";
  const toCustomer = recipient && recipient.toLowerCase() === String(order.email || "").toLowerCase();
  const toStaff = template.startsWith("staff_");
  return {
    timestamp: fields["Sent At"],
    actorType: "system",
    actorLabel: toStaff ? "System email to staff" : toCustomer ? "System email to customer" : "System email",
    title: emailTemplateTitle(template),
    detail: fields.Subject || "",
    meta: recipient ? `Recipient: ${recipient}` : "",
  };
}

function parseCustomerDecisionBlocks(notes = "") {
  const decisions = [];
  let current = null;
  String(notes || "").split(/\r?\n/).forEach((line) => {
    const clean = line.trim();
    if (clean === "CUSTOMER FINAL QUOTE DECISION") {
      if (current) decisions.push(current);
      current = { decision: "", paymentPreference: "", submitted: "" };
      return;
    }
    if (!current) return;
    if (clean.startsWith("Customer decision:")) current.decision = clean.replace("Customer decision:", "").trim();
    if (clean.startsWith("Payment preference:")) current.paymentPreference = clean.replace("Payment preference:", "").trim();
    if (clean.startsWith("Decision submitted:")) current.submitted = clean.replace("Decision submitted:", "").trim();
  });
  if (current) decisions.push(current);
  return decisions.filter((decision) => decision.decision);
}

function staffActionTitle(value = "") {
  const text = String(value || "").toLowerCase();
  if (text.includes("payment")) return "Staff marked payment sent";
  if (text.includes("return")) return "Staff started return";
  if (text.includes("final quote")) return "Staff sent final quote";
  if (text.includes("received")) return "Staff marked item received";
  if (text.includes("inspection")) return "Staff saved intake review";
  if (text.includes("evaluated")) return "Staff finished item evaluation";
  if (text.includes("accepted")) return "Staff marked item accepted";
  if (text.includes("feedback")) return "Staff added feedback";
  return value || "Staff updated order";
}

function emailTemplateTitle(template = "") {
  const labels = {
    quote_received: "Quote confirmation email sent",
    label_ready: "Shipping label email sent",
    label_pending: "Label pending email sent",
    staff_new_quote: "Staff new quote alert sent",
    staff_final_decision: "Staff customer decision alert sent",
    gear_received: "Gear received email sent",
    final_quote_ready: "Final quote email sent",
    offer_approved: "Final quote email sent",
    offer_adjusted: "Adjusted quote email sent",
    payment_sent: "Payment sent email sent",
    return_started: "Return shipment email sent",
  };
  return labels[template] || `Email sent${template ? `: ${template}` : ""}`;
}

function compactLogNotes(notes = "") {
  const compact = String(notes || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("- "))
    .slice(0, 4)
    .join(" | ");
  return compact.length > 240 ? `${compact.slice(0, 237)}...` : compact;
}

function staffDeliveryFromFields(fields = {}) {
  const delivery = staffNoteValue(fields, "Delivery");
  const normalized = delivery.toLowerCase();
  if (normalized === "dropoff") return "In-store drop-off";
  if (normalized === "ship") return "Mail-in shipment";
  return delivery;
}

function logTimestampValue(value) {
  const time = Date.parse(value || "");
  return Number.isFinite(time) ? time : 0;
}

function formatLogTimestamp(value) {
  const time = Date.parse(value || "");
  if (!Number.isFinite(time)) return "Time not recorded";
  return new Date(time).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

async function updateRecord(body) {
  const response = await fetch(`${API_BASE}/api/staff/update`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...staffAuthHeaders(),
    },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed with ${response.status}`);
  return data.record || { id: body.recordId, fields: body };
}

async function openPricingReview() {
  setStatus("Loading pricing review...");
  detailEl.innerHTML = `
    <div class="empty-detail">
      <p class="brand-line">Pricing review</p>
      <h2>Loading Milford price table</h2>
      <p>Preparing review rows by value, source, and last-reviewed date.</p>
    </div>
  `;

  try {
    if (!pricingReviewRows.length) {
      const response = await fetch(`${API_BASE}/api/staff/pricing-review`, {
        headers: staffAuthHeaders(),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `Request failed with ${response.status}`);
      pricingReviewRows = data.rows || [];
    }
    renderPricingReview();
    setStatus(`${pricingReviewRows.length} pricing rows loaded.`);
  } catch (error) {
    setStatus(error.message || "Unable to load pricing review.", true);
  }
}

function renderPricingReview() {
  const categories = ["All", "Digital Camera", "Film Camera", "Lens", "Flash / Lighting"];
  detailEl.innerHTML = `
    <article class="staff-pricing-review">
      <header class="staff-order-header">
        <div>
          <p class="brand-line">Pricing review</p>
          <h2>Milford price table</h2>
          <p>Sort and spot-check quote values, review dates, and research links.</p>
        </div>
        <div class="staff-order-total">
          <span>Rows</span>
          <strong>${pricingReviewRows.length}</strong>
          <small>${pricingReviewRows.filter((row) => row.priority !== "Normal").length} flagged</small>
        </div>
      </header>
      <div class="pricing-review-controls">
        <label>
          <span>Search</span>
          <input id="pricing-review-search" type="search" placeholder="Brand or model" />
        </label>
        <label>
          <span>Category</span>
          <select id="pricing-review-category">
            ${categories.map((category) => `<option value="${escapeAttr(category)}">${escapeHtml(category)}</option>`).join("")}
          </select>
        </label>
        <label>
          <span>Sort</span>
          <select id="pricing-review-sort">
            <option value="highest_cash">Highest cash offer</option>
            <option value="oldest_review">Oldest reviewed</option>
            <option value="flagged">Flagged first</option>
            <option value="brand">Brand / model</option>
          </select>
        </label>
      </div>
      <div class="pricing-review-table-wrap">
        <table class="pricing-review-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>Cash</th>
              <th>Resale</th>
              <th>Basis</th>
              <th>Reviewed</th>
              <th>Research</th>
            </tr>
          </thead>
          <tbody id="pricing-review-body"></tbody>
        </table>
      </div>
    </article>
  `;
  const redraw = () => renderPricingReviewRows();
  document.getElementById("pricing-review-search")?.addEventListener("input", redraw);
  document.getElementById("pricing-review-category")?.addEventListener("change", redraw);
  document.getElementById("pricing-review-sort")?.addEventListener("change", redraw);
  renderPricingReviewRows();
}

function renderPricingReviewRows() {
  const body = document.getElementById("pricing-review-body");
  if (!body) return;
  const search = document.getElementById("pricing-review-search")?.value.trim().toLowerCase() || "";
  const category = document.getElementById("pricing-review-category")?.value || "All";
  const sort = document.getElementById("pricing-review-sort")?.value || "highest_cash";
  const filtered = pricingReviewRows
    .filter((row) => category === "All" || row.category === category)
    .filter((row) => !search || `${row.brand} ${row.model}`.toLowerCase().includes(search))
    .sort(pricingReviewSort(sort))
    .slice(0, 250);

  body.innerHTML = filtered.map((row) => `
    <tr class="${row.priority !== "Normal" ? "is-flagged" : ""}">
      <td>
        <strong>${escapeHtml(row.brand)} ${escapeHtml(row.model)}</strong>
        <span>${escapeHtml(row.priority || "Normal")}${row.year ? ` - ${escapeHtml(row.year)}` : ""}</span>
      </td>
      <td>${escapeHtml(row.category)}</td>
      <td>$${formatMoney(row.cashOffer)}</td>
      <td>${row.targetResalePrice ? `$${formatMoney(row.targetResalePrice)}` : "-"}</td>
      <td>${escapeHtml(row.pricingBasis || row.source || "-")}</td>
      <td>${escapeHtml(row.priceLastReviewed || "-")}</td>
      <td>
        <a href="${escapeAttr(row.links?.mpb || "#")}">MPB</a>
        <a href="${escapeAttr(row.links?.ebaySold || "#")}">eBay sold</a>
        <a href="${escapeAttr(row.links?.keh || "#")}">KEH</a>
        <a href="${escapeAttr(row.links?.bhUsed || "#")}">B&H</a>
      </td>
    </tr>
  `).join("") || `<tr><td colspan="7">No matching pricing rows.</td></tr>`;
}

function pricingReviewSort(sort) {
  const priorityRank = (row) => row.priority === "Normal" ? 1 : 0;
  if (sort === "oldest_review") return (a, b) => String(a.priceLastReviewed || "0000").localeCompare(String(b.priceLastReviewed || "0000"));
  if (sort === "flagged") return (a, b) => priorityRank(a) - priorityRank(b) || b.cashOffer - a.cashOffer;
  if (sort === "brand") return (a, b) => `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`);
  return (a, b) => b.cashOffer - a.cashOffer;
}

function startStaffIntake() {
  selectedOrderId = null;
  selectedItemId = null;
  resetStaffIntakePricingRequests();
  staffIntakeState = createStaffIntakeState();
  renderQueue();
  renderStaffIntake();
  setStatus("New in-store quote started.");
}

function renderStaffIntake() {
  const heading = staffIntakeHeadingCopy();
  detailEl.innerHTML = `
    <article class="staff-intake staff-new-quote">
      <header class="staff-order-header">
        <div>
          <p class="brand-line">In-store intake</p>
          <h2 id="staff-intake-title">${escapeHtml(heading.title)}</h2>
          <p id="staff-intake-subtitle">${escapeHtml(heading.subtitle)}</p>
        </div>
        <div class="staff-order-total">
          <span>Current offer</span>
          <strong id="staff-intake-total">Draft</strong>
          <small id="staff-intake-routing">Add gear to price this quote.</small>
        </div>
      </header>

      <form class="staff-review-form" id="staff-intake-form">
        <section class="staff-review-section">
          <div class="staff-section-title">
            <span>1</span>
            <div>
              <h3>Gear at the counter</h3>
              <p>Select catalog gear or route specialty items into manual review.</p>
            </div>
          </div>

          <label class="field gear-search-field">
            <span>Search gear</span>
            <input id="staff-intake-gear-search" autocomplete="off" placeholder="Search by model, category, or brand" />
            <datalist id="staff-intake-gear-search-options"></datalist>
            <div class="gear-search-results" id="staff-intake-gear-search-results" hidden></div>
          </label>

          <div class="three-col">
            <label class="field">
              <span>Category</span>
              <select id="staff-intake-category"></select>
            </label>
            <label class="field">
              <span>Brand</span>
              <select id="staff-intake-brand"></select>
            </label>
            <label class="field">
              <span>Model</span>
              <select id="staff-intake-model"></select>
            </label>
          </div>

          <div class="manual-fields" id="staff-intake-manual-fields" hidden>
            <div class="two-col">
              <label class="field">
                <span>Brand name</span>
                <input id="staff-intake-manual-brand" autocomplete="off" placeholder="Example: Leica" />
              </label>
              <label class="field">
                <span>Model name</span>
                <input id="staff-intake-manual-model" autocomplete="off" placeholder="Example: M6 body" />
              </label>
            </div>
          </div>

          <label class="field" id="staff-intake-mount-field" hidden>
            <span>Lens mount</span>
            <select id="staff-intake-lens-mount">
              <option value="">Select mount</option>
            </select>
          </label>

          <fieldset class="condition-grid staff-intake-condition-grid">
            <legend>Customer-stated condition</legend>
            ${STAFF_INTAKE_CONDITIONS.map((condition) => `
              <label class="choice-card">
                <input type="radio" name="staff-intake-condition" value="${escapeAttr(condition.value)}" ${condition.value === "excellent" ? "checked" : ""} />
                <strong>${escapeHtml(condition.label)}</strong>
                <span>${escapeHtml(condition.copy)}</span>
              </label>
            `).join("")}
          </fieldset>

          <fieldset class="check-grid" id="staff-intake-included-fieldset">
            <legend>Included items</legend>
            <div id="staff-intake-included-items"></div>
          </fieldset>

          <div class="staff-intake-current-price" id="staff-intake-current-price"></div>

          <label class="field">
            <span>Counter notes</span>
            <textarea id="staff-intake-item-notes" rows="4" placeholder="Mention mount, kit details, shutter count, missing parts, known issues, or accessories."></textarea>
          </label>

          <div class="form-actions staff-intake-actions">
            <button class="primary-action staff-intake-add-action" type="button" id="staff-intake-add-item">${escapeHtml(heading.button)}</button>
          </div>
        </section>

        <section class="staff-review-section">
          <div class="staff-section-title">
            <span>2</span>
            <div>
              <h3>Offer preview</h3>
              <p>Review pricing for the gear in this in-store quote.</p>
            </div>
          </div>
          <div class="staff-intake-cart" id="staff-intake-cart"></div>
          <div class="quote-message" id="staff-intake-quote-message"></div>
        </section>

        <section class="staff-review-section">
          <div class="staff-section-title">
            <span>3</span>
            <div>
              <h3>Customer details</h3>
              <p>This creates the quote as an in-store dropoff and opens it in the staff intake queue.</p>
            </div>
          </div>
          <div class="two-col">
            <label class="field">
              <span>Name</span>
              <input id="staff-intake-seller-name" autocomplete="name" required />
            </label>
            <label class="field">
              <span>Email</span>
              <input id="staff-intake-seller-email" type="email" autocomplete="email" required />
            </label>
          </div>
          <div class="two-col">
            <label class="field">
              <span>Phone</span>
              <input id="staff-intake-seller-phone" type="tel" autocomplete="tel" />
            </label>
            <label class="field">
              <span>Preferred payout</span>
              <select id="staff-intake-payment-preference">
                <option value="check">Check</option>
                <option value="paypal">PayPal</option>
                <option value="store_credit">Store credit</option>
              </select>
            </label>
          </div>
          <div class="staff-intake-address-fields">
            <label class="field">
              <span>Mailing address <small>optional</small></span>
              <input id="staff-intake-seller-street" autocomplete="street-address" placeholder="Street address" />
            </label>
            <div class="three-col">
              <label class="field">
                <span>City</span>
                <input id="staff-intake-seller-city" autocomplete="address-level2" />
              </label>
              <label class="field">
                <span>State</span>
                <input id="staff-intake-seller-state" autocomplete="address-level1" maxlength="2" />
              </label>
              <label class="field">
                <span>ZIP</span>
                <input id="staff-intake-seller-zip" autocomplete="postal-code" />
              </label>
            </div>
            <p>Useful for mailed checks, return shipping, or matching a customer record. Leave blank for quick counter intake.</p>
          </div>
          <label class="consent staff-intake-consent">
            <input id="staff-intake-terms" type="checkbox" required />
            <span>Customer understands the quote is pending Milford Photo inspection and may be adjusted after verification.</span>
          </label>
          <div class="form-actions staff-intake-actions">
            <button class="secondary-action" type="button" id="staff-intake-cancel">Back to queue</button>
            <button class="primary-action" type="submit" id="staff-intake-submit">Create quote and open intake</button>
          </div>
        </section>
      </form>
      <div class="staff-intake-toast" id="staff-intake-toast" role="status" aria-live="polite" hidden></div>
    </article>
  `;

  bindStaffIntake();
}

function staffIntakeHeadingCopy() {
  const count = staffIntakeState.cart.length;
  if (!count) {
    return {
      title: "Start a new quote",
      subtitle: "Build the quote while the customer is at the counter, then open it in the staff intake workflow.",
      button: "Add item to quote",
    };
  }
  const itemCopy = `${count} item${count === 1 ? "" : "s"} added`;
  return {
    title: "Add next item",
    subtitle: `${itemCopy}. Select the next piece of gear, or enter customer details when the quote is ready.`,
    button: "Add next item to quote",
  };
}

function updateStaffIntakeHeading() {
  const title = document.getElementById("staff-intake-title");
  const subtitle = document.getElementById("staff-intake-subtitle");
  const addButton = document.getElementById("staff-intake-add-item");
  if (!title || !subtitle || !addButton) return;
  const heading = staffIntakeHeadingCopy();
  title.textContent = heading.title;
  subtitle.textContent = heading.subtitle;
  addButton.textContent = heading.button;
}

function bindStaffIntake() {
  const form = document.getElementById("staff-intake-form");
  const category = document.getElementById("staff-intake-category");
  const brand = document.getElementById("staff-intake-brand");
  const model = document.getElementById("staff-intake-model");
  const search = document.getElementById("staff-intake-gear-search");
  const lensMount = document.getElementById("staff-intake-lens-mount");
  const notes = document.getElementById("staff-intake-item-notes");
  const manualBrand = document.getElementById("staff-intake-manual-brand");
  const manualModel = document.getElementById("staff-intake-manual-model");

  populateStaffIntakeGearSearch();
  populateStaffIntakeCategories();
  populateStaffIntakeBrands();
  renderStaffIntakeIncludedItems();
  renderStaffIntakeCart();
  renderStaffIntakeQuote();
  renderStaffIntakeCurrentPreview();

  search.addEventListener("change", applyStaffIntakeGearSearch);
  search.addEventListener("focus", renderStaffIntakeGearSearchResults);
  search.addEventListener("input", () => {
    renderStaffIntakeGearSearchResults();
    const exactMatch = staffIntakeGearSearchOptions().find((option) => isExactGearSearchMatch(option, search.value));
    if (exactMatch) applyStaffIntakeGearSearch();
  });
  search.addEventListener("keydown", (event) => {
    if (event.key === "Escape") hideStaffIntakeGearSearchResults();
  });
  document.getElementById("staff-intake-gear-search-results").addEventListener("pointerdown", (event) => {
    const button = event.target.closest("[data-gear-search-key]");
    if (!button) return;
    event.preventDefault();
    const match = staffIntakeGearSearchOptions().find((option) => gearSearchKey(option) === button.dataset.gearSearchKey);
    if (match) applyStaffIntakeGearSearchOption(match);
  });
  document.removeEventListener("click", handleStaffIntakeGearSearchDocumentClick);
  document.addEventListener("click", handleStaffIntakeGearSearchDocumentClick);
  category.addEventListener("change", () => {
    clearStaffIntakeSearch();
    populateStaffIntakeBrands();
    populateStaffIntakeModels();
    updateStaffIntakeMountField();
    updateStaffIntakeManualFields();
    renderStaffIntakeIncludedItems();
    queueStaffIntakeCurrentPreview();
  });
  brand.addEventListener("change", () => {
    clearStaffIntakeSearch();
    populateStaffIntakeModels();
    updateStaffIntakeMountField();
    updateStaffIntakeManualFields();
    renderStaffIntakeIncludedItems();
    queueStaffIntakeCurrentPreview();
  });
  model.addEventListener("change", () => {
    clearStaffIntakeSearch();
    updateStaffIntakeMountField();
    updateStaffIntakeManualFields();
    queueStaffIntakeCurrentPreview();
  });
  lensMount.addEventListener("change", queueStaffIntakeCurrentPreview);
  manualBrand.addEventListener("input", queueStaffIntakeCurrentPreview);
  manualModel.addEventListener("input", queueStaffIntakeCurrentPreview);
  notes.addEventListener("input", queueStaffIntakeCurrentPreview);
  form.querySelectorAll('input[name="staff-intake-condition"]').forEach((input) => {
    input.addEventListener("change", queueStaffIntakeCurrentPreview);
  });
  document.getElementById("staff-intake-add-item").addEventListener("click", addStaffIntakeItem);
  document.getElementById("staff-intake-cancel").addEventListener("click", () => {
    selectedOrderId = visibleOrders()[0]?.id || orders[0]?.id || null;
    syncSelectedItem();
    renderQueue();
    renderDetail();
    setStatus("Back to the queue.");
  });
  form.addEventListener("submit", submitStaffIntakeQuote);
}

function handleStaffIntakeGearSearchDocumentClick(event) {
  const search = document.getElementById("staff-intake-gear-search");
  const results = document.getElementById("staff-intake-gear-search-results");
  if (!search || !results) return;
  if (event.target === search || results.contains(event.target)) return;
  hideStaffIntakeGearSearchResults();
}

function populateStaffIntakeGearSearch() {
  const options = document.getElementById("staff-intake-gear-search-options");
  options.innerHTML = staffIntakeGearSearchOptions()
    .map((option) => `<option value="${escapeAttr(option.label)}"></option>`)
    .join("");
  renderStaffIntakeGearSearchResults();
}

function staffIntakeGearSearchOptions() {
  const options = safeCatalogBrands()
    .flatMap((brand) =>
      safeCatalogCategories(brand).flatMap((catalogCategory) => {
        const category = displayCategoryForCatalog(catalogCategory);
        const catalogItems = typeof getCatalogItems === "function" ? getCatalogItems(brand, catalogCategory) : [];
        return sortCatalogItemsForDisplay(catalogItems, category).map((item) => ({
          brand,
          category,
          model: item.name,
          label: `${brand} ${catalogDisplayName(item, category)} - ${category}`,
        }));
      }),
    );

  return uniqueGearSearchOptions(options).sort((a, b) => naturalTextCompare(a.label, b.label));
}

function renderStaffIntakeGearSearchResults() {
  const search = document.getElementById("staff-intake-gear-search");
  const results = document.getElementById("staff-intake-gear-search-results");
  const query = search.value.trim();
  const matches = matchingGearSearchOptions(staffIntakeGearSearchOptions(), query).slice(0, SEARCH_RESULT_LIMIT);
  if (!query || !matches.length) {
    hideStaffIntakeGearSearchResults();
    return;
  }

  results.innerHTML = matches
    .map(
      (option) => `
        <button class="gear-search-result" type="button" data-gear-search-key="${escapeAttr(gearSearchKey(option))}">
          <span>${escapeHtml(option.brand)} ${escapeHtml(catalogDisplayName({ name: option.model }, option.category))}</span>
          <small>${escapeHtml(option.category)}</small>
        </button>
      `,
    )
    .join("");
  results.hidden = false;
}

function hideStaffIntakeGearSearchResults() {
  const results = document.getElementById("staff-intake-gear-search-results");
  if (!results) return;
  results.hidden = true;
  results.innerHTML = "";
}

function matchingGearSearchOptions(options, query) {
  const tokens = gearSearchTokens(query);
  if (!tokens.length) return [];
  return options
    .filter((option) => tokens.every((token) => gearSearchHaystack(option).includes(token)))
    .sort((a, b) => gearSearchScore(b, tokens) - gearSearchScore(a, tokens) || naturalTextCompare(a.label, b.label));
}

function isExactGearSearchMatch(option, query) {
  return normalizeGearSearchText(option.label) === normalizeGearSearchText(query);
}

function gearSearchScore(option, tokens) {
  const haystack = gearSearchHaystack(option);
  const brand = normalizeGearSearchText(option.brand);
  const model = normalizeGearSearchText(option.model);
  return tokens.reduce((score, token) => score + (brand.includes(token) ? 4 : 0) + (model.includes(token) ? 2 : 0) + (haystack.startsWith(token) ? 1 : 0), 0);
}

function gearSearchHaystack(option) {
  return normalizeGearSearchText(`${option.brand} ${option.model} ${option.label} ${option.category}`);
}

function gearSearchTokens(query) {
  return normalizeGearSearchText(query).split(" ").filter(Boolean);
}

function normalizeGearSearchText(value = "") {
  return ` ${String(value)
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*mm/g, "$1-$2mm $1mm $2mm $1 $2 mm")
    .replace(/(\d+(?:\.\d+)?)\s*mm/g, "$1mm $1 mm")
    .replace(/[^a-z0-9.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()} `;
}

function gearSearchKey(option) {
  return [option.brand, option.category, option.model].join("|").toLowerCase();
}

function applyStaffIntakeGearSearch() {
  const search = document.getElementById("staff-intake-gear-search");
  const query = search.value.trim();
  if (!query) return;
  const options = staffIntakeGearSearchOptions();
  const match = options.find((option) => isExactGearSearchMatch(option, query)) || matchingGearSearchOptions(options, query)[0];
  if (!match) return;

  applyStaffIntakeGearSearchOption(match);
}

function applyStaffIntakeGearSearchOption(match) {
  const category = document.getElementById("staff-intake-category");
  const brand = document.getElementById("staff-intake-brand");
  const model = document.getElementById("staff-intake-model");
  const search = document.getElementById("staff-intake-gear-search");
  category.value = match.category;
  populateStaffIntakeBrands();
  brand.value = match.brand;
  populateStaffIntakeModels();
  model.value = match.model;
  updateStaffIntakeMountField();
  updateStaffIntakeManualFields();
  renderStaffIntakeIncludedItems();
  search.value = match.label;
  hideStaffIntakeGearSearchResults();
  queueStaffIntakeCurrentPreview();
}

function clearStaffIntakeSearch() {
  const search = document.getElementById("staff-intake-gear-search");
  if (search) search.value = "";
  hideStaffIntakeGearSearchResults();
}

function populateStaffIntakeCategories() {
  const category = document.getElementById("staff-intake-category");
  const previous = category.value;
  const categories = safeCatalogAllCategories();
  category.innerHTML = [
    `<option value="${SELECT_CATEGORY}">Select category</option>`,
    ...categories.map((name) => `<option value="${escapeAttr(name)}">${escapeHtml(name)}</option>`),
  ].join("");
  if (categories.includes(previous)) category.value = previous;
}

function populateStaffIntakeBrands() {
  const brand = document.getElementById("staff-intake-brand");
  const category = document.getElementById("staff-intake-category").value;
  const previous = brand.value;
  if (!category) {
    brand.innerHTML = `<option value="${SELECT_BRAND}">Select brand</option>`;
    populateStaffIntakeModels();
    return;
  }
  const brands = safeCatalogBrandsForCategory(category);
  brand.innerHTML = [
    `<option value="${SELECT_BRAND}">Select brand</option>`,
    ...brands.map((name) => `<option value="${escapeAttr(name)}">${escapeHtml(name)}</option>`),
    `<option value="${MANUAL_BRAND}">Other / not listed</option>`,
  ].join("");
  brand.value = brands.includes(previous) || previous === MANUAL_BRAND ? previous : SELECT_BRAND;
  populateStaffIntakeModels();
}

function populateStaffIntakeModels() {
  const brand = document.getElementById("staff-intake-brand").value;
  const category = document.getElementById("staff-intake-category").value;
  const model = document.getElementById("staff-intake-model");
  if (!category || !brand) {
    model.innerHTML = `<option value="${SELECT_MODEL}">Select model</option>`;
    return;
  }
  const items = brand === MANUAL_BRAND ? [] : sortCatalogItemsForDisplay(uniqueCatalogItems(safeCatalogItems(brand, category)), category);
  model.innerHTML = [
    `<option value="${SELECT_MODEL}">Select model</option>`,
    ...items.map((item) => `<option value="${escapeAttr(item.name)}">${escapeHtml(catalogDisplayName(item, category))}</option>`),
    `<option value="${MANUAL_MODEL}">Other / not listed</option>`,
  ].join("");
}

function updateStaffIntakeManualFields() {
  const brand = document.getElementById("staff-intake-brand").value;
  const model = document.getElementById("staff-intake-model").value;
  const manualFields = document.getElementById("staff-intake-manual-fields");
  const manualBrand = document.getElementById("staff-intake-manual-brand");
  const manualModel = document.getElementById("staff-intake-manual-model");
  const needsManualText = brand === MANUAL_BRAND || model === MANUAL_MODEL;
  manualFields.hidden = !needsManualText;
  manualBrand.required = brand === MANUAL_BRAND;
  manualModel.required = needsManualText;
}

function updateStaffIntakeMountField() {
  const mountField = document.getElementById("staff-intake-mount-field");
  const lensMount = document.getElementById("staff-intake-lens-mount");
  const selectedMount = lensMount.value;
  const mounts = staffIntakeMountOptions();
  lensMount.innerHTML = [
    `<option value="">Select mount</option>`,
    ...mounts.map((mount) => `<option value="${escapeAttr(mount)}">${escapeHtml(mount)}</option>`),
  ].join("");
  lensMount.value = mounts.includes(selectedMount) ? selectedMount : "";
  const required = mounts.length > 1;
  mountField.hidden = !required;
  lensMount.required = required;
}

function renderStaffIntakeIncludedItems() {
  const container = document.getElementById("staff-intake-included-items");
  const category = document.getElementById("staff-intake-category")?.value || "";
  const items = includedItemsForCategory(category).filter((item) => item.checked);
  if (!items.length) {
    container.innerHTML = `
      <div class="included-copy">
        <strong>Choose a category to see assumed accessories.</strong>
        <span>Staff can adjust the final offer after physical inspection.</span>
      </div>
    `;
    return;
  }
  container.innerHTML = `
    <div class="included-copy">
      <strong>Check what the customer has with them now.</strong>
      <span>These selections travel into the quote notes for staff inspection.</span>
    </div>
    <div class="staff-intake-included-list">
      ${items.map((item) => `
        <label class="staff-accessory-item">
          <input type="checkbox" data-staff-intake-included="${escapeAttr(item.name)}" data-staff-intake-adjustment="${escapeAttr(item.value)}" ${item.checked ? "checked" : ""} />
          <span>${escapeHtml(item.name)}</span>
          <strong data-staff-intake-impact>${escapeHtml(staffIntakeAccessoryImpactText(item.value, item.checked))}</strong>
        </label>
      `).join("")}
    </div>
  `;
  container.querySelectorAll("[data-staff-intake-included]").forEach((input) => input.addEventListener("change", () => {
    const impact = input.closest(".staff-accessory-item")?.querySelector("[data-staff-intake-impact]");
    if (impact) impact.textContent = staffIntakeAccessoryImpactText(input.dataset.staffIntakeAdjustment, input.checked);
    queueStaffIntakeCurrentPreview();
  }));
}

function staffIntakeAccessoryImpactText(value, checked) {
  const amount = Number(value) || 0;
  if (!amount) return checked ? "Expected" : "No price change";
  return checked ? `Missing: -$${formatMoney(amount)}` : `Add: +$${formatMoney(amount)}`;
}

async function addStaffIntakeItem() {
  const item = readStaffIntakeItem();
  if (!item) return;
  const button = document.getElementById("staff-intake-add-item");
  button.disabled = true;
  staffIntakeState.cart.push(item);
  clearStaffIntakeItemForm();
  resetStaffIntakeCurrentPreview();
  renderStaffIntakeCurrentPreview();
  renderStaffIntakeQuote();
  setStatus(`${item.brand} ${item.model} added to the in-store quote. Updating offer...`);
  showStaffIntakeToast("Item added to quote");

  try {
    await priceStaffIntakeCart();
  } finally {
    button.disabled = false;
  }
}

function readStaffIntakeItem(options = {}) {
  const category = document.getElementById("staff-intake-category").value;
  const selectedBrand = document.getElementById("staff-intake-brand").value;
  const selectedModel = document.getElementById("staff-intake-model").value;
  const catalogItem =
    selectedBrand !== MANUAL_BRAND && selectedModel !== MANUAL_MODEL
      ? safeCatalogItem(selectedBrand, category, selectedModel)
      : null;
  const brand = selectedBrand === MANUAL_BRAND ? document.getElementById("staff-intake-manual-brand").value.trim() : selectedBrand;
  const model = selectedModel === MANUAL_MODEL
    ? document.getElementById("staff-intake-manual-model").value.trim()
    : catalogQuoteModel(catalogItem, selectedModel, category);
  const condition = document.querySelector('input[name="staff-intake-condition"]:checked')?.value || "excellent";
  const includedItems = Array.from(document.querySelectorAll("[data-staff-intake-included]:checked")).map((input) => input.dataset.staffIntakeIncluded);
  const validMounts = staffIntakeMountOptions();
  const requiresMount = validMounts.length > 1;
  const mount = requiresMount ? document.getElementById("staff-intake-lens-mount").value.trim() : validMounts[0] || "";
  const notes = [
    document.getElementById("staff-intake-item-notes").value.trim(),
    mount ? `Lens mount: ${mount}` : "",
    includedItems.length ? `Standard accessories with customer: ${includedItems.join(", ")}` : "",
  ].filter(Boolean).join("\n");

  if (!category || !selectedBrand || !selectedModel || !brand || !model || model === MANUAL_MODEL || (requiresMount && (!mount || !validMounts.includes(mount)))) {
    if (!options.silent) {
      const message = !category
        ? "Select a category for the in-store item."
        : !selectedBrand
          ? "Select a brand for the in-store item."
          : !selectedModel
            ? "Select a model for the in-store item."
            : requiresMount && (!mount || !validMounts.includes(mount))
              ? "Select a valid lens mount for this lens."
              : "Enter the brand and model for the in-store item.";
      setStatus(message, true);
    }
    return null;
  }

  return {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    brand,
    category,
    catalogCategory: catalogItem ? catalogCategoryForItem(brand, category, catalogItem.name) : "",
    model,
    year: catalogItem?.year || "",
    condition,
    notes,
    includedItems,
    mount,
    pricingKey: catalogItem?.pricingKey || "",
    productFamily: catalogItem?.productFamily || "",
    generation: catalogItem?.generation || "",
    ebayQuery: buildEbayQueryForCatalogItem({ brand, model, mount, catalogItem }),
    isManual: category === MANUAL_CATEGORY,
    manualReviewRequested: Boolean(catalogItem?.manualReview),
  };
}

function staffIntakeCartItems() {
  return [...staffIntakeState.cart];
}

function quoteItemStableKey(item) {
  return [item.brand, item.category, item.model, item.mount, item.condition, item.notes].join("|").toLowerCase();
}

function quoteItemsSignature(items) {
  return items.map((item) => quoteItemStableKey(item)).join("||");
}

function quoteItemPayload(item) {
  const { id, ...payload } = item;
  return payload;
}

async function requestStaffIntakeQuote(items) {
  return staffPost("/api/quote", {
    items: items.map(quoteItemPayload),
  });
}

function resetStaffIntakePricingRequests() {
  if (staffIntakePreviewTimer) clearTimeout(staffIntakePreviewTimer);
  staffIntakePreviewTimer = null;
  staffIntakePreviewRequestId += 1;
  staffIntakeCartQuoteRequestId += 1;
}

function resetStaffIntakeCurrentPreview() {
  if (staffIntakePreviewTimer) clearTimeout(staffIntakePreviewTimer);
  staffIntakePreviewTimer = null;
  staffIntakePreviewRequestId += 1;
  staffIntakeState.currentQuote = null;
  staffIntakeState.currentQuoteSignature = "";
  staffIntakeState.currentQuoteLoading = false;
  staffIntakeState.currentQuoteError = "";
}

function queueStaffIntakeCurrentPreview() {
  resetStaffIntakeCurrentPreview();
  renderStaffIntakeCurrentPreview();
  staffIntakePreviewTimer = setTimeout(priceStaffIntakeCurrentPreview, STAFF_INTAKE_PREVIEW_DELAY_MS);
}

async function priceStaffIntakeCurrentPreview() {
  const item = readStaffIntakeItem({ silent: true });
  if (!item) {
    resetStaffIntakeCurrentPreview();
    renderStaffIntakeCurrentPreview();
    return null;
  }

  const signature = quoteItemStableKey(item);
  const requestId = ++staffIntakePreviewRequestId;
  staffIntakeState.currentQuote = null;
  staffIntakeState.currentQuoteSignature = signature;
  staffIntakeState.currentQuoteLoading = true;
  staffIntakeState.currentQuoteError = "";
  renderStaffIntakeCurrentPreview();

  try {
    const quote = await requestStaffIntakeQuote([item]);
    if (requestId !== staffIntakePreviewRequestId) return null;
    staffIntakeState.currentQuote = quote;
    staffIntakeState.currentQuoteSignature = signature;
    return quote;
  } catch (error) {
    if (requestId === staffIntakePreviewRequestId) {
      staffIntakeState.currentQuoteError = error.message || "Unable to preview this item.";
    }
    return null;
  } finally {
    if (requestId === staffIntakePreviewRequestId) {
      staffIntakeState.currentQuoteLoading = false;
      renderStaffIntakeCurrentPreview();
    }
  }
}

async function priceStaffIntakeCart(options = {}) {
  const items = staffIntakeCartItems();
  const signature = quoteItemsSignature(items);
  if (!items.length) {
    staffIntakeState.cartQuote = null;
    staffIntakeState.cartQuoteSignature = "";
    staffIntakeState.cartQuoteLoading = false;
    staffIntakeState.cartQuoteError = "";
    renderStaffIntakeQuote();
    return null;
  }

  const requestId = ++staffIntakeCartQuoteRequestId;
  staffIntakeState.cartQuoteLoading = true;
  staffIntakeState.cartQuoteError = "";
  renderStaffIntakeQuote();

  try {
    const quote = await requestStaffIntakeQuote(items);
    if (requestId !== staffIntakeCartQuoteRequestId) return null;
    staffIntakeState.cartQuote = quote;
    staffIntakeState.cartQuoteSignature = signature;
    staffIntakeState.cartQuoteError = "";
    renderStaffIntakeQuote();
    if (options.announce !== false) setStatus(`Quote ${quote.quoteId} priced.`);
    return quote;
  } catch (error) {
    if (requestId === staffIntakeCartQuoteRequestId) {
      staffIntakeState.cartQuote = null;
      staffIntakeState.cartQuoteSignature = "";
      staffIntakeState.cartQuoteError = error.message || "Unable to price this in-store quote.";
      renderStaffIntakeQuote();
      setStatus(staffIntakeState.cartQuoteError, true);
    }
    if (options.throwOnError) throw error;
    return null;
  } finally {
    if (requestId === staffIntakeCartQuoteRequestId) {
      staffIntakeState.cartQuoteLoading = false;
      renderStaffIntakeQuote();
    }
  }
}

async function submitStaffIntakeQuote(event) {
  event.preventDefault();
  const items = staffIntakeCartItems();
  if (!items.length) {
    setStatus("Add at least one item to the quote before creating it.", true);
    return;
  }
  const signature = quoteItemsSignature(items);
  const submitButton = document.getElementById("staff-intake-submit");
  const sellerName = document.getElementById("staff-intake-seller-name").value.trim();
  const sellerEmail = document.getElementById("staff-intake-seller-email").value.trim();
  const sellerPhone = document.getElementById("staff-intake-seller-phone").value.trim();
  const sellerStreet = document.getElementById("staff-intake-seller-street").value.trim();
  const sellerCity = document.getElementById("staff-intake-seller-city").value.trim();
  const sellerState = document.getElementById("staff-intake-seller-state").value.trim();
  const sellerZip = document.getElementById("staff-intake-seller-zip").value.trim();
  const terms = document.getElementById("staff-intake-terms");

  if (!sellerName || !sellerEmail) {
    setStatus("Customer name and email are required before creating the quote.", true);
    return;
  }
  if (!terms.checked) {
    setStatus("Confirm that the customer understands the inspection terms.", true);
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Creating...";
  setStatus("Creating in-store quote...");

  try {
    let quote = staffIntakeState.cartQuote;
    if (!quote?.quoteToken || staffIntakeState.cartQuoteSignature !== signature) {
      quote = await priceStaffIntakeCart({ announce: false, throwOnError: true });
    }
    if (!quote?.quoteToken) {
      throw new Error("Unable to price this in-store quote.");
    }
    const result = await staffPost("/api/submit", {
      quoteToken: quote.quoteToken,
      source: "staff_dashboard",
      seller: {
        name: sellerName,
        email: sellerEmail,
        phone: sellerPhone,
        address: {
          street: sellerStreet,
          city: sellerCity,
          state: sellerState,
          zip: sellerZip,
        },
      },
      delivery: "dropoff",
      paymentPreference: document.getElementById("staff-intake-payment-preference").value,
    }, { staff: true });
    await loadRecords({ selectQuoteRef: result.quoteRef });
    setStatus(`In-store quote ${result.quoteRef} created and opened.`);
  } catch (error) {
    setStatus(error.message || "Unable to create the in-store quote.", true);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Create quote and open intake";
  }
}

function renderStaffIntakeCart() {
  const cart = document.getElementById("staff-intake-cart");
  if (!cart) return;
  if (!staffIntakeState.cart.length) {
    cart.innerHTML = `<div class="staff-empty-card">No added items yet. Add the current item to include it in the offer.</div>`;
    return;
  }
  cart.innerHTML = staffIntakeState.cart.map((item) => `
    <article class="cart-item staff-intake-cart-item has-remove-action">
      <button class="staff-intake-remove-item" type="button" aria-label="Remove item" data-staff-intake-remove="${escapeAttr(item.id)}"><span aria-hidden="true">x</span><small>Remove item</small></button>
      <div class="cart-title">
        <strong>${escapeHtml(item.brand)} ${escapeHtml(item.model)}</strong>
      </div>
      <span class="cart-meta">${escapeHtml(item.category)} - ${escapeHtml(conditionLabel(item.condition))}${item.mount ? ` - ${escapeHtml(item.mount)}` : ""}</span>
    </article>
  `).join("");
  wireStaffIntakeRemoveButtons(cart);
}

function renderStaffIntakeCurrentPreview() {
  const container = document.getElementById("staff-intake-current-price");
  if (!container) return;

  const item = readStaffIntakeItem({ silent: true });
  if (!item) {
    container.innerHTML = `
      <article class="staff-intake-price-panel is-empty">
        <div>
          <span>Item offer</span>
          <strong>Choose gear</strong>
        </div>
        <small>Price appears here before the item is added.</small>
      </article>
    `;
    return;
  }

  if (staffIntakeState.currentQuoteLoading) {
    container.innerHTML = `
      <article class="staff-intake-price-panel is-loading">
        <div>
          <span>Item offer</span>
          <strong>Pricing ${escapeHtml(item.brand)} ${escapeHtml(item.model)}...</strong>
        </div>
      </article>
    `;
    return;
  }

  if (staffIntakeState.currentQuoteError) {
    container.innerHTML = `
      <article class="staff-intake-price-panel is-error">
        <div>
          <span>Item offer</span>
          <strong>Preview unavailable</strong>
        </div>
        <small>${escapeHtml(staffIntakeState.currentQuoteError)}</small>
      </article>
    `;
    return;
  }

  const quotedItem = staffIntakeState.currentQuote?.items?.[0];
  if (!quotedItem) {
    container.innerHTML = `
      <article class="staff-intake-price-panel">
        <div>
          <span>Item offer</span>
          <strong>${escapeHtml(item.brand)} ${escapeHtml(item.model)}</strong>
        </div>
        <small>Pricing will update automatically.</small>
      </article>
    `;
    return;
  }

  container.innerHTML = `
    <div class="staff-intake-preview-heading">
      <span>Item offer</span>
      <small>Not added to quote yet</small>
    </div>
    ${renderStaffIntakeQuoteItem(quotedItem, null, { preview: true })}
  `;
}

function renderStaffIntakeQuote() {
  updateStaffIntakeHeading();
  const quote = staffIntakeState.cartQuote;
  const total = document.getElementById("staff-intake-total");
  const routing = document.getElementById("staff-intake-routing");
  const list = document.getElementById("staff-intake-cart");
  const message = document.getElementById("staff-intake-quote-message");
  if (!total || !routing || !list || !message) return;

  if (!staffIntakeState.cart.length) {
    total.textContent = "Draft";
    routing.textContent = "Add gear to price this quote.";
    renderStaffIntakeCart();
    message.textContent = "";
    return;
  }

  if (staffIntakeState.cartQuoteLoading) {
    total.textContent = "Pricing";
    routing.textContent = "Calculating added items.";
    renderStaffIntakeCart();
    message.textContent = "";
    return;
  }

  if (!quote) {
    total.textContent = staffIntakeState.cart.length ? `${staffIntakeState.cart.length} item${staffIntakeState.cart.length === 1 ? "" : "s"}` : "Draft";
    routing.textContent = staffIntakeState.cartQuoteError || "Pricing updates when items are added.";
    renderStaffIntakeCart();
    message.textContent = staffIntakeState.cartQuoteError;
    return;
  }

  total.textContent = quote.routing?.declinedOnly ? "Declined" : quote.totals.cash ? money.format(quote.totals.cash) : "Review";
  routing.textContent = quote.totals.storeCredit ? `${money.format(quote.totals.storeCredit)} store credit` : quote.routing.message;
  const sourceItems = staffIntakeCartItems();
  list.innerHTML = quote.items.map((item, index) => renderStaffIntakeQuoteItem(item, sourceItems[index])).join("");
  wireStaffIntakeRemoveButtons(list);
  message.textContent = quote.routing.message;
}

function renderStaffIntakeQuoteItem(item, sourceItem, options = {}) {
  const statusClass = item.status === "quoted" ? "quoted" : item.status === "declined" ? "declined" : "review";
  const price = item.offerAmount ? money.format(item.offerAmount) : item.status === "declined" ? "$0" : "Review";
  const credit = item.storeCreditAmount ? `${money.format(item.storeCreditAmount)} store credit` : item.message || "Staff follow-up needed";
  const marketCopy = item.marketPrice ? `Market estimate: ${money.format(item.marketPrice)}` : item.message || "";
  const canRemove = sourceItem?.id && staffIntakeState.cart.some((cartItem) => cartItem.id === sourceItem.id);
  return `
    <article class="quote-item staff-intake-quote-item${canRemove ? " has-remove-action" : ""}${options.preview ? " staff-intake-preview-item" : ""}">
      ${canRemove ? `<button class="staff-intake-remove-item" type="button" aria-label="Remove item" data-staff-intake-remove="${escapeAttr(sourceItem.id)}"><span aria-hidden="true">x</span><small>Remove item</small></button>` : ""}
      <div>
        <div class="quote-title">
          <strong>${escapeHtml(item.brand)} ${escapeHtml(item.model)}</strong>
          <span class="staff-intake-quote-actions">
            <span class="status-pill ${statusClass}">${escapeHtml(STATUS_LABELS[item.status] || item.status)}</span>
          </span>
        </div>
        <div class="quote-meta">
          ${escapeHtml(conditionLabel(item.condition))} - ${escapeHtml(item.category)}
          ${marketCopy ? `<br />${escapeHtml(marketCopy)}` : ""}
        </div>
      </div>
      <div class="quote-price">
        <strong>${escapeHtml(price)}</strong>
        <span>${escapeHtml(credit)}</span>
      </div>
    </article>
  `;
}

function wireStaffIntakeRemoveButtons(container) {
  container.querySelectorAll("[data-staff-intake-remove]").forEach((button) => {
    button.addEventListener("click", () => {
      staffIntakeState.cart = staffIntakeState.cart.filter((item) => item.id !== button.dataset.staffIntakeRemove);
      staffIntakeState.cartQuote = null;
      staffIntakeState.cartQuoteSignature = "";
      staffIntakeState.cartQuoteError = "";
      renderStaffIntakeQuote();
      priceStaffIntakeCart({ announce: false });
    });
  });
}

function clearStaffIntakeItemForm() {
  document.getElementById("staff-intake-gear-search").value = "";
  document.getElementById("staff-intake-category").value = "";
  populateStaffIntakeBrands();
  populateStaffIntakeModels();
  document.getElementById("staff-intake-manual-brand").value = "";
  document.getElementById("staff-intake-manual-model").value = "";
  document.getElementById("staff-intake-item-notes").value = "";
  const excellent = document.querySelector('input[name="staff-intake-condition"][value="excellent"]');
  if (excellent) excellent.checked = true;
  updateStaffIntakeManualFields();
  updateStaffIntakeMountField();
  renderStaffIntakeIncludedItems();
}

function showStaffIntakeToast(message) {
  const toast = document.getElementById("staff-intake-toast");
  if (!toast) return;
  window.clearTimeout(staffIntakeToastTimer);
  window.clearTimeout(staffIntakeToastHideTimer);
  toast.textContent = message;
  toast.hidden = false;
  window.requestAnimationFrame(() => toast.classList.add("is-visible"));
  staffIntakeToastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
    staffIntakeToastHideTimer = window.setTimeout(() => {
      toast.hidden = true;
    }, 180);
  }, 3000);
}

async function staffPost(path, payload, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(options.staff ? staffAuthHeaders() : {}),
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || data.detail || `Request failed with ${response.status}`);
  return data;
}

function collectReviewState(accessories) {
  const verifiedCondition = document.querySelector("input[name='verified-condition']:checked")?.value || "Excellent";
  const accessoryState = {};
  document.querySelectorAll("[data-accessory]").forEach((input) => {
    accessoryState[input.dataset.accessory] = Boolean(input.checked);
  });
  accessories.forEach((item) => {
    if (!(item.name in accessoryState)) accessoryState[item.name] = true;
  });

  return {
    received: Boolean(document.getElementById("received-check")?.checked),
    allAccessories: Boolean(document.getElementById("all-accessories-check")?.checked),
    verifiedCondition,
    accessories: accessoryState,
    decision: document.querySelector("input[name='item-decision']:checked")?.value || "pending",
    reason: document.getElementById("inspection-notes")?.value.trim() || "",
  };
}

function calculateOffer(fields, review, accessories, fallbackOffer) {
  const market = numberOrNull(fields["eBay Median Price"]);
  const condition = review.verifiedCondition || fields.Condition || "Excellent";
  const conditionMultiplier = condition in CONDITION_MULTIPLIERS ? CONDITION_MULTIPLIERS[condition] : 0.6;
  const missingTotal = accessories.reduce((total, item) => {
    return review.accessories?.[item.name] === false ? total + item.deduction : total;
  }, 0);
  const originalCondition = String(fields.Condition || "").trim() || "Excellent";
  const conditionOffer = condition === originalCondition
    ? fallbackOffer
    : market
      ? Math.floor(market * conditionMultiplier)
      : fallbackOffer;
  return Math.max(0, Math.floor(conditionOffer - missingTotal));
}

function staffNoteValue(fields = {}, label = "") {
  return noteValue(fields["Seller Notes"], label);
}

function noteValue(notes = "", label = "") {
  const prefix = `${label}:`;
  return String(notes || "")
    .split(/\r?\n/)
    .find((line) => line.trim().toLowerCase().startsWith(prefix.toLowerCase()))
    ?.slice(prefix.length)
    .trim() || "";
}

function quoteSourceLabel(fields = {}) {
  const source = staffNoteValue(fields, "Pricing source");
  const basis = staffNoteValue(fields, "Pricing basis");
  if (basis === "competitive_retail_review") return "Milford reviewed price table";
  if (basis === "store_estimated_catalog_review") return "Milford catalog-reviewed price";
  if (basis === "seeded_price_table") return "Milford exact price table";
  if (source === "milford_catalog_heuristic") return "Catalog heuristic";
  if (source.includes("ebay_browse")) return "eBay active-listing fallback";
  if (source.includes("manual")) return "Manual review";
  return source || "Unknown";
}

function staffRecordLooksReceived(fields = {}) {
  return staffWorkflowText(fields).includes("received");
}

function staffWorkflowText(fields = {}) {
  return `${fields.Status || ""} ${fields["Workflow Step"] || ""}`.toLowerCase();
}

function incomingTrackingNumber(fields = {}) {
  return fields["Incoming Tracking Number"]
    || fields["Inbound Tracking Number"]
    || fields["Tracking Number"]
    || "-";
}

function outgoingTrackingNumber(fields = {}) {
  return fields["Outgoing Tracking Number"]
    || fields["Outbound Tracking Number"]
    || fields["Return Tracking Number"]
    || fields["Return Shipment Tracking"]
    || "-";
}

function staffActionCompleted(action, fields = {}, parsed = {}) {
  const status = staffWorkflowText(fields);
  if (action === "received") {
    return parsed.received
      || statusIncludesAny(status, ["received", "inspection", "evaluated", "final", "accepted item", "customer accepted", "payment", "return"]);
  }
  if (action === "save") {
    return statusIncludesAny(status, ["inspection", "evaluated", "final", "accepted item", "customer accepted", "payment", "return"]);
  }
  if (action === "adjusted") {
    return statusIncludesAny(status, ["evaluated", "final", "accepted item", "customer accepted", "payment", "return"]);
  }
  if (action === "accepted") {
    return statusIncludesAny(status, ["accepted item", "customer accepted", "payment"]);
  }
  if (action === "payment") return status.includes("payment");
  if (action === "return") return status.includes("return");
  return false;
}

function statusIncludesAny(status, needles) {
  return needles.some((needle) => status.includes(needle));
}

function ebaySoldListingsUrl(fields = {}) {
  const query = [fields["Item Brand"], fields["Item Model"]].filter(Boolean).join(" ").trim();
  const url = new URL("https://www.ebay.com/sch/i.html");
  url.searchParams.set("_nkw", query || "camera gear");
  url.searchParams.set("_sacat", "625");
  url.searchParams.set("LH_Complete", "1");
  url.searchParams.set("LH_Sold", "1");
  return url.toString();
}

function buildStaffNotes(review, action, finalOffer) {
  const accessoryLines = Object.entries(review.accessories)
    .map(([name, checked]) => `- ${name}: ${checked ? "received" : "missing"}`)
    .join("\n");

  return [
    "INTAKE REVIEW",
    `Received: ${review.received ? "Yes" : "No"}`,
    `Verified condition: ${review.verifiedCondition}`,
    `All recommended accessories included: ${review.allAccessories ? "Yes" : "No"}`,
    "Accessory check:",
    accessoryLines,
    `Customer decision: ${review.decision}`,
    `Final offer: $${finalOffer}`,
    `Last staff action: ${action}`,
    `Reason / notes: ${review.reason || "None"}`,
    `Updated: ${new Date().toLocaleString()}`,
  ].join("\n");
}

function appendOrderNote(notes = "", status) {
  return [
    notes,
    "",
    "ORDER UPDATE",
    `Status: ${status}`,
    `Updated: ${new Date().toLocaleString()}`,
  ].join("\n").trim();
}

function parseStaffNotes(notes = "") {
  const parsed = {
    received: false,
    allAccessories: false,
    verifiedCondition: "",
    accessories: {},
    decision: "pending",
    customerFinalDecision: "",
    reason: "",
  };
  let inCustomerFinalQuoteDecision = false;

  notes.split("\n").forEach((line) => {
    const clean = line.trim();
    if (clean === "CUSTOMER FINAL QUOTE DECISION") inCustomerFinalQuoteDecision = true;
    if (clean === "INTAKE REVIEW" || clean === "ORDER UPDATE") inCustomerFinalQuoteDecision = false;
    if (clean.startsWith("Received:")) parsed.received = clean.includes("Yes");
    if (clean.startsWith("All recommended accessories included:")) parsed.allAccessories = clean.includes("Yes");
    if (clean.startsWith("Verified condition:")) parsed.verifiedCondition = clean.replace("Verified condition:", "").trim();
    if (clean.startsWith("Customer decision:")) {
      parsed.decision = clean.replace("Customer decision:", "").trim() || "pending";
      if (inCustomerFinalQuoteDecision) parsed.customerFinalDecision = parsed.decision;
    }
    if (clean.startsWith("- ")) {
      const [name, state] = clean.slice(2).split(":").map((part) => part.trim());
      if (name) parsed.accessories[name] = state !== "missing";
    }
    if (clean.startsWith("Reason / notes:")) parsed.reason = clean.replace("Reason / notes:", "").trim();
  });

  return parsed;
}

function workflowState(order) {
  const statuses = order.items.map((item) => staffWorkflowText(item.fields));
  const completed = new Set(["initial"]);
  if (statuses.some((status) => status.includes("label") || status.includes("accepted") || status.includes("shipped") || status.includes("received") || status.includes("inspection") || status.includes("evaluated") || status.includes("final") || status.includes("payment") || status.includes("return"))) completed.add("shipped");
  if (statuses.some((status) => status.includes("received") || status.includes("inspection") || status.includes("evaluated") || status.includes("final") || status.includes("accepted item") || status.includes("customer accepted") || status.includes("payment") || status.includes("return"))) completed.add("received");
  if (statuses.every((status) => status.includes("evaluated") || status.includes("final") || status.includes("accepted item") || status.includes("customer accepted") || status.includes("payment") || status.includes("return") || status.includes("declined"))) completed.add("evaluated");
  if (statuses.some((status) => status.includes("final quote") || status.includes("accepted item") || status.includes("customer accepted") || status.includes("payment") || status.includes("return"))) completed.add("final");
  if (statuses.some((status) => status.includes("accepted item") || status.includes("return item") || status.includes("customer accepted") || status.includes("payment"))) completed.add("customer");
  if (statuses.some((status) => status.includes("payment"))) completed.add("payout");
  if (statuses.some((status) => status.includes("return") || status.includes("payment"))) completed.add("return");

  const current = WORKFLOW_STEPS.find((step) => !completed.has(step.key)) || WORKFLOW_STEPS[WORKFLOW_STEPS.length - 1];
  return { completed, current, isComplete: completed.size >= WORKFLOW_STEPS.length };
}

function quoteReferenceCounts(items) {
  return items.reduce((counts, record) => {
    const quote = record.fields?.["Quote Reference"];
    if (quote) counts.set(quote, (counts.get(quote) || 0) + 1);
    return counts;
  }, new Map());
}

function orderGroupingKey(record, quoteCounts) {
  const fields = record.fields || {};
  const quote = fields["Quote Reference"];
  if (quote && quoteCounts.get(quote) > 1) return `quote:${quote}`;
  if (quote && !fields["Seller Email"]) return `quote:${quote}`;

  const sellerKey = [
    fields["Seller Email"],
    fields["Seller Name"],
    fields["Seller Street"],
    fields["Seller ZIP"],
  ].map(normalizeGroupValue).join("|");
  const bucket = submissionDayBucket(fields["Quote Submitted"]);
  if (sellerKey.replaceAll("|", "")) return `batch:${sellerKey}|${bucket}`;
  return `quote:${quote || record.id}`;
}

function submissionDayBucket(value) {
  const date = new Date(value || 0);
  if (Number.isNaN(date.getTime())) return "unknown-day";
  return date.toISOString().slice(0, 10);
}

function normalizeGroupValue(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function itemStatusClass(record) {
  const status = staffWorkflowText(record.fields);
  if (status.includes("return") || status.includes("declined")) return "is-return";
  if (status.includes("evaluated") || status.includes("final") || status.includes("accepted item") || status.includes("payment")) return "is-evaluated";
  if (status.includes("received") || status.includes("inspection")) return "is-progress";
  return "is-new";
}

function orderTotals(order) {
  return order.items.reduce((totals, item) => {
    totals.original += numberOrNull(item.fields?.["Milford Offer"]) ?? 0;
    totals.final += numberOrNull(item.fields?.["Final Offer"]) ?? numberOrNull(item.fields?.["Milford Offer"]) ?? 0;
    return totals;
  }, { original: 0, final: 0 });
}

function accessoryListFor(fields) {
  const category = String(fields.Category || "").toLowerCase();
  if (category.includes("lens")) {
    return [
      { name: "Rear cap", deduction: 10 },
      { name: "Lens cap", deduction: 15 },
      { name: "Lens hood", deduction: 35 },
    ];
  }
  if (category.includes("film")) {
    return [
      { name: "Body cap", deduction: 10 },
      { name: "Strap", deduction: 20 },
      { name: "Original box", deduction: 0 },
    ];
  }
  if (category.includes("camera") || category.includes("body") || category.includes("video")) {
    return [
      { name: "USB connection cable", deduction: 15 },
      { name: "Rechargeable battery", deduction: 60 },
      { name: "Charger", deduction: 50 },
      { name: "Body cap", deduction: 10 },
      { name: "Strap", deduction: 20 },
    ];
  }
  return [
    { name: "Required accessories", deduction: 25 },
    { name: "Original box", deduction: 0 },
  ];
}

function visibleOrders() {
  return sortOrdersForQueue(filterOrders(orders, activeFilter).filter(orderMatchesSearch));
}

function filterOrders(items, filter) {
  return items.filter((order) => {
    const statuses = order.items.map((record) => staffWorkflowText(record.fields));
    if (filter === "all") return true;
    if (filter === "received") return statuses.some((status) => status.includes("received") || status.includes("inspection") || status.includes("evaluated"));
    if (filter === "done") return statuses.every((status) => status.includes("payment") || status.includes("declined") || status.includes("return"));
    if (filter === "active") return !statuses.every((status) => status.includes("payment") || status.includes("declined") || status.includes("return"));
    return order.workflow.current.key === filter || order.workflow.completed.has(filter);
  });
}

function orderMatchesSearch(order) {
  const query = activeSearch.trim().toLowerCase();
  if (!query) return true;
  const searchable = [
    order.customer,
    order.email,
    order.phone,
    order.quote,
    order.quoteRefs?.join(" "),
    order.items.map((item) => {
      const fields = item.fields || {};
      return [
        fields["Item Brand"],
        fields["Item Model"],
        fields.Category,
        incomingTrackingNumber(fields),
        outgoingTrackingNumber(fields),
        fields.Status,
        fields["Workflow Step"],
      ].filter(Boolean).join(" ");
    }).join(" "),
  ].filter(Boolean).join(" ").toLowerCase();
  return searchable.includes(query);
}

function sortOrdersForQueue(items) {
  const sorted = [...items];
  if (activeSort === "customer") return sorted.sort((a, b) => a.customer.localeCompare(b.customer));
  if (activeSort === "value") return sorted.sort((a, b) => (b.totals.final || b.totals.original) - (a.totals.final || a.totals.original));
  if (activeSort === "next_action" || activeSort === "first_received") {
    return sorted.sort((a, b) => workflowRank(a.workflow.current.key) - workflowRank(b.workflow.current.key) || newestOrderTime(b) - newestOrderTime(a));
  }
  return sorted.sort((a, b) => newestOrderTime(b) - newestOrderTime(a));
}

function newestOrderTime(order) {
  return Math.max(...order.items.map((item) => new Date(item.fields?.["Quote Submitted"] || 0).getTime()), 0);
}

function workflowRank(key) {
  const index = WORKFLOW_STEPS.findIndex((step) => step.key === key);
  return index === -1 ? 99 : index;
}

function activeFilterLabel(filter) {
  if (filter === "all") return "visible";
  if (filter === "active") return "active";
  if (filter === "done") return "done";
  return (WORKFLOW_STEPS.find((step) => step.key === filter)?.label || filter).toLowerCase();
}

function orderIdForQuoteRef(quoteRef) {
  const wanted = String(quoteRef || "").trim();
  if (!wanted) return "";
  return orders.find((order) => order.quote === wanted || order.quoteRefs?.includes(wanted))?.id || "";
}

function conditionLabel(value = "") {
  return STAFF_INTAKE_CONDITIONS.find((condition) => condition.value === value)?.label || value;
}

function includedItemsForCategory(category = "") {
  const text = category.toLowerCase();
  if (!text) return [];
  if (text.includes("film")) return INCLUDED_ITEMS.filmCamera;
  if (text.includes("lens")) return INCLUDED_ITEMS.lens;
  if (text.includes("camera") || text.includes("body") || text.includes("dslr") || text.includes("mirrorless")) return INCLUDED_ITEMS.camera;
  return INCLUDED_ITEMS.default;
}

function safeCatalogBrands() {
  if (typeof getCatalogBrands === "function") return getCatalogBrands();
  return ["Canon", "Nikon", "Sony", "Fujifilm", "Olympus", "Panasonic", "Pentax", "Sigma", "Tamron"];
}

function safeCatalogAllCategories() {
  const catalogCategories = safeCatalogBrands().flatMap((brand) => safeCatalogCategories(brand));
  return catalogCategories.length ? SIMPLE_CATEGORIES : FALLBACK_CATEGORIES;
}

function safeCatalogBrandsForCategory(category) {
  if (!category || category === MANUAL_CATEGORY) return safeCatalogBrands();
  const matches = safeCatalogBrands().filter((brand) =>
    safeCatalogCategories(brand).some((catalogCategory) => categoryMatchesDisplay(catalogCategory, category)),
  );
  return matches.length ? matches : safeCatalogBrands();
}

function safeCatalogCategories(brand) {
  if (typeof getCatalogCategories === "function") return getCatalogCategories(brand);
  return FALLBACK_CATEGORIES;
}

function safeCatalogItems(brand, category) {
  if (typeof getCatalogItems === "function") {
    return catalogCategoriesForDisplay(brand, category).flatMap((catalogCategory) => getCatalogItems(brand, catalogCategory));
  }
  return [];
}

function uniqueCatalogItems(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = String(item.name || "").toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function uniqueGearSearchOptions(options) {
  const seen = new Set();
  return options.filter((option) => {
    const key = [option.brand, option.category, option.model].join("|").toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sortCatalogItemsForDisplay(items, category = "") {
  const sorted = [...items];
  if (category.toLowerCase().includes("lens")) {
    return sorted.sort((a, b) => compareLensModels(a.name, b.name));
  }
  return sorted.sort((a, b) => naturalTextCompare(a.name, b.name));
}

function displayModelName(name = "", category = "") {
  if (!category.toLowerCase().includes("lens")) return name;
  return String(name)
    .replace(/\s*\((?:sony\s+fe|sony\s+e|e-mount|canon\s+ef|canon\s+rf|nikon\s+f|nikon\s+z|fujifilm\s+x|x-mount|micro\s+four\s+thirds|mft|l-mount|pentax\s+k|dslr|mirrorless)\)\s*$/i, "")
    .trim();
}

function catalogDisplayName(item, category = "") {
  if (!item) return "";
  return item.displayName || displayModelName(item.name, category);
}

function catalogQuoteModel(item, fallbackModel, category = "") {
  if (!item) return displayModelName(fallbackModel, category);
  return item.quoteModel || item.displayName || displayModelName(item.name, category);
}

function safeCatalogItem(brand, category, model) {
  if (typeof getCatalogItem === "function") {
    for (const catalogCategory of catalogCategoriesForDisplay(brand, category)) {
      const item = getCatalogItem(brand, catalogCategory, model);
      if (item) return item;
    }
  }
  return null;
}

function catalogCategoriesForDisplay(brand, displayCategory) {
  const catalogCategories = safeCatalogCategories(brand);
  if (!displayCategory || displayCategory === MANUAL_CATEGORY) return catalogCategories;
  const matches = catalogCategories.filter((catalogCategory) => categoryMatchesDisplay(catalogCategory, displayCategory));
  return matches.length ? matches : catalogCategories.filter((catalogCategory) => catalogCategory === displayCategory);
}

function displayCategoryForCatalog(catalogCategory = "") {
  return SIMPLE_CATEGORIES.find((displayCategory) => categoryMatchesDisplay(catalogCategory, displayCategory)) || catalogCategory;
}

function categoryMatchesDisplay(catalogCategory = "", displayCategory = "") {
  const catalog = catalogCategory.toLowerCase();
  const display = displayCategory.toLowerCase();
  if (displayCategory === MANUAL_CATEGORY) return catalogCategory === MANUAL_CATEGORY;
  if (display === "lens") return catalog.includes("lens");
  if (display === "film camera") return catalog.includes("camera body") && catalog.includes("film");
  if (display === "digital camera") return catalog.includes("camera body") && !categoryMatchesDisplay(catalogCategory, "Film Camera");
  if (display === "flash / lighting") return catalog.includes("flash") || catalog.includes("speedlight") || catalog.includes("strobe") || catalog.includes("lighting");
  if (display === "tripod / support") return catalog.includes("tripod") || catalog.includes("monopod") || catalog.includes("support");
  if (display === "bags & cases") return catalog.includes("bag") || catalog.includes("case");
  if (display === "filters") return catalog.includes("filter");
  if (display === "video / cinema gear") return catalog.includes("video") || catalog.includes("cinema") || catalog.includes("camcorder");
  return catalog === display;
}

function catalogCategoryForItem(brand, displayCategory, itemName) {
  for (const catalogCategory of catalogCategoriesForDisplay(brand, displayCategory)) {
    if (typeof getCatalogItems !== "function") continue;
    if (getCatalogItems(brand, catalogCategory).some((item) => item.name === itemName)) return catalogCategory;
  }
  return "";
}

function staffIntakeMountOptions() {
  const category = document.getElementById("staff-intake-category")?.value || "";
  if (!category.toLowerCase().includes("lens")) return [];
  const brand = document.getElementById("staff-intake-brand")?.value || "";
  const model = document.getElementById("staff-intake-model")?.value || "";
  const manualModel = document.getElementById("staff-intake-manual-model")?.value || "";
  const catalogItem = brand !== MANUAL_BRAND && model !== MANUAL_MODEL ? safeCatalogItem(brand, category, model) : null;
  const inferredMounts = catalogMountsForItem(brand, category, catalogItem);
  if (inferredMounts.length) return inferredMounts;

  const text = `${category} ${model === MANUAL_MODEL ? manualModel : model}`.toLowerCase();
  const explicit = mountsFromText(text);
  if (explicit.length) return explicit;

  const brandText = brand.toLowerCase();
  if (brandText.includes("sigma")) {
    if (text.includes("dg dn")) return ["Sony E", "L-Mount"];
    if (text.includes("dc dn")) return ["Sony E", "Fujifilm X", "Micro Four Thirds"];
    if (text.includes("70mm f/2.8 dg macro")) return ["L-Mount", "Sony E", "Sigma SA", "Canon EF"];
    if (text.includes("dg hsm") || text.includes("os hsm")) return ["Canon EF", "Nikon F"];
  }
  if (brandText.includes("tamron")) {
    if (text.includes("mirrorless") || text.includes("di iii")) return ["Sony E"];
    return ["Canon EF", "Nikon F"];
  }
  if (brandText.includes("tokina")) {
    if (text.includes("sony e")) return ["Sony E"];
    if (text.includes("opera")) return ["Canon EF", "Nikon F"];
    return ["Canon EF", "Nikon F", "Sony E"];
  }
  if (brandText.includes("zeiss")) {
    if (text.includes("batis") || text.includes("loxia") || text.includes("sony fe")) return ["Sony E"];
    if (text.includes("otus ml")) return ["Sony E", "Nikon Z", "Canon RF"];
    if (text.includes("otus") || text.includes("milvus") || text.includes("dslr")) return ["Canon EF", "Nikon F"];
    return ["Canon EF", "Nikon F"];
  }
  return ["Canon EF", "Canon RF", "Nikon F", "Nikon Z", "Sony E", "Fujifilm X", "Micro Four Thirds", "L-Mount", "Pentax K"];
}

function catalogMountsForItem(brand = "", displayCategory = "", item = null) {
  if (Array.isArray(item?.mounts) && item.mounts.length) return item.mounts;
  if (!displayCategory.toLowerCase().includes("lens")) return [];
  const catalogCategory = item ? catalogCategoryForItem(brand, displayCategory, item.name) : "";
  return inferMountsFromProductText(brand, catalogCategory || displayCategory, item?.name || "");
}

function inferMountsFromProductText(brand = "", category = "", model = "") {
  const text = `${brand} ${category} ${model}`.toLowerCase();

  if (text.includes("lens") && text.includes("canon")) {
    if (text.includes("ef-s")) return ["Canon EF-S"];
    if (/\bef-m\b/.test(text)) return ["Canon EF-M"];
    if (/\brf\b/.test(text)) return ["Canon RF"];
    if (/\bef\b/.test(text)) return ["Canon EF"];
  }
  if (text.includes("lens") && text.includes("nikon")) {
    if (text.includes("z-mount") || /\bz\b/.test(model.toLowerCase())) return ["Nikon Z"];
    if (text.includes("f-mount") || /\baf\b|\baf-s\b|\baf-p\b|\bdx\b/.test(model.toLowerCase())) return ["Nikon F"];
  }
  if (text.includes("lens") && text.includes("sony")) {
    if (text.includes("a-mount")) return ["Sony A"];
    if (text.includes("e-mount") || /\bfe\b|\be\b/.test(model.toLowerCase())) return ["Sony E"];
  }
  if (text.includes("fujifilm") || text.includes("fuji")) {
    if (text.includes("gfx") || /\bgf\b/.test(model.toLowerCase())) return ["Fujifilm G"];
    if (text.includes("x-mount") || /\bxf\b|\bxc\b/.test(model.toLowerCase())) return ["Fujifilm X"];
  }
  if (text.includes("olympus") || text.includes("om system") || text.includes("m.zuiko")) return ["Micro Four Thirds"];
  if (text.includes("panasonic") || text.includes("lumix")) {
    if (text.includes("l-mount") || text.includes("lumix s")) return ["L-Mount"];
    if (text.includes("micro four thirds") || text.includes("lumix g")) return ["Micro Four Thirds"];
  }
  if (text.includes("leica")) {
    if (text.includes("m-mount") || /\bsummilux-m\b|\bsummicron-m\b|\belmarit-m\b/.test(text)) return ["Leica M"];
    if (text.includes("l-mount") || text.includes("-sl")) return ["L-Mount"];
  }
  if (text.includes("hasselblad") || text.includes("xcd")) return ["Hasselblad XCD"];
  if (text.includes("phase one") || text.includes("schneider kreuznach")) return ["Phase One XF"];
  if (text.includes("pentax") || text.includes("k-mount")) return ["Pentax K"];
  if (text.includes("zeiss")) {
    if (text.includes("batis") || text.includes("loxia") || text.includes("sony fe")) return ["Sony E"];
    if (text.includes("milvus") || text.includes("dslr")) return ["Canon EF", "Nikon F"];
  }

  if (text.includes("sigma")) {
    if (text.includes("dg dn")) return ["Sony E", "L-Mount"];
    if (text.includes("dc dn")) return ["Sony E", "Fujifilm X", "Micro Four Thirds"];
    if (text.includes("70mm f/2.8 dg macro")) return ["L-Mount", "Sony E", "Sigma SA", "Canon EF"];
    if (text.includes("dg hsm") || text.includes("os hsm")) return ["Canon EF", "Nikon F"];
  }
  if (text.includes("tamron")) {
    if (text.includes("sony e")) return ["Sony E"];
    if (text.includes("di iii")) return ["Sony E"];
    if (text.includes("dslr") || text.includes("di vc") || text.includes("sp ")) return ["Canon EF", "Nikon F"];
  }
  if (text.includes("tokina")) {
    if (text.includes("sony e")) return ["Sony E"];
    if (text.includes("opera")) return ["Canon EF", "Nikon F"];
    if (text.includes("dslr") || text.includes("at-x")) return ["Canon EF", "Nikon F"];
  }

  return [];
}

function mountsFromText(text) {
  const rules = [
    ["canon rf", "Canon RF"],
    [" rf", "Canon RF"],
    ["canon ef", "Canon EF"],
    [" ef", "Canon EF"],
    ["nikon z", "Nikon Z"],
    [" z-mount", "Nikon Z"],
    ["nikon f", "Nikon F"],
    [" f-mount", "Nikon F"],
    ["sony fe", "Sony E"],
    ["sony e", "Sony E"],
    [" e-mount", "Sony E"],
    ["fujifilm x", "Fujifilm X"],
    [" x-mount", "Fujifilm X"],
    ["micro four thirds", "Micro Four Thirds"],
    ["mft", "Micro Four Thirds"],
    ["l-mount", "L-Mount"],
    ["phase one xf", "Phase One XF"],
    ["pentax k", "Pentax K"],
    [" k-mount", "Pentax K"],
  ];
  return [...new Set(rules.filter(([needle]) => text.includes(needle)).map(([, mount]) => mount))];
}

function buildEbayQueryForCatalogItem({ brand, model, mount, catalogItem }) {
  const baseQuery = catalogItem?.ebayQuery || `${brand} ${model}`;
  return mount ? `${baseQuery} ${mount}` : baseQuery;
}

function compareLensModels(a, b) {
  const aKey = lensSortKey(a);
  const bKey = lensSortKey(b);
  for (let index = 0; index < aKey.length; index += 1) {
    const aValue = aKey[index];
    const bValue = bKey[index];
    if (typeof aValue === "number" && typeof bValue === "number" && aValue !== bValue) return aValue - bValue;
    if (aValue !== bValue) return naturalTextCompare(String(aValue), String(bValue));
  }
  return naturalTextCompare(a, b);
}

function lensSortKey(name = "") {
  const normalized = String(name).replace(/[–—]/g, "-").toLowerCase();
  const focal = normalized.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*mm|(\d+(?:\.\d+)?)\s*mm/);
  const firstFocal = focal ? Number(focal[1] || focal[3]) : 9999;
  const secondFocal = focal?.[2] ? Number(focal[2]) : 0;
  const aperture = normalized.match(/f\/?(\d+(?:\.\d+)?)/);
  const apertureValue = aperture ? Number(aperture[1]) : 99;
  return [mountPrefixRank(normalized), lensSeriesRank(normalized), firstFocal, secondFocal, apertureValue, generationRank(normalized), normalized];
}

function mountPrefixRank(text) {
  const prefixes = ["ef-s", "ef-m", "ef", "rf", "dx", "fx", "z", "fe", "e", "xf", "m.zuiko", "mft", "k"];
  const index = prefixes.findIndex((prefix) => text.startsWith(`${prefix} `) || text.startsWith(prefix));
  return index === -1 ? 99 : index;
}

function lensSeriesRank(text) {
  const series = [
    "at-x",
    "atx-m",
    "art",
    "batis",
    "contemporary",
    "loxia",
    "milvus",
    "opera",
    "otus",
    "sp",
    "sports",
  ];
  const index = series.findIndex((name) => text.startsWith(`${name} `));
  return index === -1 ? 99 : index;
}

function generationRank(text) {
  if (/\biii\b/.test(text)) return 3;
  if (/\bii\b/.test(text)) return 2;
  if (/\bi\b/.test(text)) return 1;
  return 0;
}

function naturalTextCompare(a, b) {
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
}

function syncSelectedItem() {
  const order = selectedOrder();
  if (!order) {
    selectedItemId = null;
    return;
  }
  if (!order.items.some((item) => item.id === selectedItemId)) selectedItemId = order.items[0]?.id || null;
}

function selectedOrder() {
  return orders.find((order) => order.id === selectedOrderId) || null;
}

function selectedRecord(order = selectedOrder()) {
  if (!order) return null;
  return order.items.find((item) => item.id === selectedItemId) || order.items[0] || null;
}

function sortNewestFirst(a, b) {
  const dateA = new Date(a.fields?.["Quote Submitted"] || 0).getTime();
  const dateB = new Date(b.fields?.["Quote Submitted"] || 0).getTime();
  return dateB - dateA;
}

function gearTitle(fields) {
  return [fields["Item Brand"], fields["Item Model"]].filter(Boolean).join(" ") || "Unknown gear";
}

function shortGearTitle(fields) {
  const title = gearTitle(fields);
  return title.length > 32 ? `${title.slice(0, 29)}...` : title;
}

function orderAddress(fields) {
  return [
    fields["Seller Street"],
    [fields["Seller City"], fields["Seller State"], fields["Seller ZIP"]].filter(Boolean).join(", "),
  ].filter(Boolean).map(escapeHtml).join("<br>");
}

function moneyOrDash(value) {
  const amount = numberOrNull(value);
  return amount === null ? "-" : `$${formatMoney(amount)}`;
}

function numberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function formatMoney(value) {
  return Math.round(Number(value) || 0).toLocaleString();
}

function formatAccessoryValue(value) {
  const amount = Number(value) || 0;
  return amount > 0 ? `-$${formatMoney(amount)}` : "Included";
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.className = isError ? "staff-error" : "";
}

function setDetailBusy(buttons, isBusy) {
  buttons.forEach((button) => {
    button.disabled = isBusy;
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

loadButton.addEventListener("click", loadRecords);
refreshButton.addEventListener("click", loadRecords);
pricingReviewButton?.addEventListener("click", openPricingReview);
startStaffIntakeButton?.addEventListener("click", startStaffIntake);
staffSearchInput?.addEventListener("input", () => {
  activeSearch = staffSearchInput.value;
  const filtered = visibleOrders();
  if (!filtered.some((order) => order.id === selectedOrderId)) {
    selectedOrderId = filtered[0]?.id || null;
    syncSelectedItem();
  }
  renderQueue();
  renderDetail();
});
staffFilterSelect?.addEventListener("change", () => {
  activeFilter = staffFilterSelect.value;
  const filtered = visibleOrders();
  if (!filtered.some((order) => order.id === selectedOrderId)) {
    selectedOrderId = filtered[0]?.id || null;
    syncSelectedItem();
  }
  renderQueue();
  renderDetail();
});
staffSortSelect?.addEventListener("change", () => {
  activeSort = staffSortSelect.value;
  renderQueue();
});
filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    const filtered = visibleOrders();
    if (!filtered.some((order) => order.id === selectedOrderId)) {
      selectedOrderId = filtered[0]?.id || null;
      syncSelectedItem();
    }
    filterButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    renderQueue();
    renderDetail();
  });
});
usernameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") passwordInput.focus();
});
passwordInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") loadRecords();
});

if ((CONFIG.staffAuthMode === "cookie" || CONFIG.staffAuthMode === "secret") && CONFIG.autoLoadStaff) {
  loadRecords();
} else if (new URLSearchParams(window.location.search).get("staffTest") === "1") {
  usernameInput.value = TEST_EMPLOYEE;
  passwordInput.value = TEST_PASSWORD;
  loadRecords();
}
