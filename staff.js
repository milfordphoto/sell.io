const CONFIG = window.MP_USED_GEAR_CONFIG || {};
const API_BASE = resolveApiBase();
const TEST_EMPLOYEE = "employee";
const TEST_PASSWORD = "password";
const STAFF_SECRET = CONFIG.staffSecret || TEST_PASSWORD;
const STAFF_URL_PARAMS = new URLSearchParams(window.location.search);
const SHOW_DEMO_ORDERS = STAFF_URL_PARAMS.get("showDemo") === "1";
const DEEP_LINK_QUOTE_REF = String(STAFF_URL_PARAMS.get("order") || STAFF_URL_PARAMS.get("quote") || STAFF_URL_PARAMS.get("quoteRef") || "").trim();
const STORE_CREDIT_BONUS = 0.1;
const MANUAL_BRAND = "__manual_brand";
const MANUAL_MODEL = "__manual_model";
const MANUAL_CATEGORY = "Manual Review / Vintage / Specialty";
const SELECT_CATEGORY = "";
const SELECT_BRAND = "";
const SELECT_MODEL = "";
const SEARCH_RESULT_LIMIT = 30;

const MANUFACTURER_LOGO_LABELS = {
  canon: "Canon",
  nikon: "Nikon",
  sony: "Sony",
  fujifilm: "Fujifilm",
  fuji: "Fujifilm",
  olympus: "Olympus",
  "om system": "OM System",
  panasonic: "Panasonic",
  lumix: "Lumix",
  pentax: "Pentax",
  leica: "Leica",
  hasselblad: "Hasselblad",
  sigma: "Sigma",
  tamron: "Tamron",
  tokina: "Tokina",
  zeiss: "Zeiss",
  voigtlander: "Voigtlander",
  rokinon: "Rokinon",
  samyang: "Samyang",
  godox: "Godox",
  profoto: "Profoto",
};

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

const STAFF_INTAKE_DELIVERY_OPTIONS = [
  {
    value: "dropoff",
    label: "Counter / in-store dropoff",
    copy: "Gear is already with Milford Photo or will be brought to the store. No inbound label is needed.",
  },
  {
    value: "ship",
    label: "Customer will ship later",
    copy: "Use for phone or remote quotes. Eligible quotes can create a customer-to-Milford inbound label.",
  },
];

const STAFF_ACTION_STEPS = [
  {
    action: "received",
    label: "Mark Item Received at Milford Photo",
    status: "Received - Needs Inspection",
    statusCopy: "Saves status: Received - needs inspection",
    notifyLabel: "Email received notice",
    notifyMeta: "Includes tracking when available and 1-2 business day inspection timing.",
  },
  {
    action: "save",
    label: "Save Inspection Progress",
    status: "Inspection In Progress",
    statusCopy: "Saves status: Inspection in progress",
    notifyLabel: "Email inspection update",
    notifyTemplate: "staff_item_update",
  },
  {
    action: "adjusted",
    label: "Mark Item Evaluation Complete",
    status: "Evaluated",
    statusCopy: "Saves status: Evaluated",
    primary: true,
    notifyLabel: "Email evaluation update",
    notifyTemplate: "staff_item_update",
  },
  {
    action: "accepted",
    label: "Mark Final Quote Accepted by Customer",
    status: "Customer Accepted Item",
    statusCopy: "Saves status: Customer accepted final quote",
    notifyLabel: "Email accepted update",
    notifyTemplate: "staff_item_update",
  },
  {
    action: "payment",
    label: "Mark Customer Payment Sent",
    status: "Payment Sent",
    statusCopy: "Saves status: Payment sent",
    notifyLabel: "Email payment sent",
  },
  {
    action: "return",
    label: "Mark Return Shipped / Closed",
    status: "Return Item",
    statusCopy: "Use after this item has been packed or sent back",
    notifyLabel: "Email return shipment update",
    danger: true,
  },
];

const STALE_STAFF_CREATED_REASON = "Staff-created quote. Gear has not been received yet.";

const STAFF_ACTION_UNDO_STATUSES = {
  received: "Accepted by Seller - Store Dropoff",
  save: "Received - Needs Inspection",
  adjusted: "Inspection In Progress",
  accepted: "Final Quote Sent",
  payment: "Customer Accepted Item",
  return: "Final Quote Sent",
};

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
  { key: "shipped", label: "Awaiting Gear" },
  { key: "received", label: "Gear Received" },
  { key: "evaluated", label: "Evaluation Complete" },
  { key: "final", label: "Final Quote Sent" },
  { key: "customer", label: "Customer Decision" },
  { key: "payout", label: "Payout" },
  { key: "return", label: "Return / Close" },
];

const MANUAL_QUOTE_STEP = { key: "manual", label: "Manual Quote" };

const usernameInput = document.getElementById("staff-username");
const passwordInput = document.getElementById("staff-password");
const loadButton = document.getElementById("load-records");
const refreshButton = document.getElementById("refresh-records");
const staffUndoButton = document.getElementById("staff-undo");
const staffRedoButton = document.getElementById("staff-redo");
const staffBugReportLink = document.getElementById("staff-bug-report-link");
const pricingReviewButton = document.getElementById("open-pricing-review");
const startStaffIntakeButton = document.getElementById("start-staff-intake");
const intakeQueueButton = document.getElementById("open-intake-queue");
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
let staffQueueGuideTargetOverride = "";
let staffUndoStack = [];
let staffRedoStack = [];
let unlockedCompletedOrderIds = new Set();

const STAFF_INTAKE_PREVIEW_DELAY_MS = 300;
const STAFF_HISTORY_LIMIT = 25;
const BUG_REPORT_EMAIL = CONFIG.bugReportEmail || "mikewilson.filmmaker@gmail.com";
const STAFF_HISTORY_RESTORE_FIELDS = [
  "Status",
  "Workflow Step",
  "Final Offer",
  "Staff Notes",
  "Decline Reason",
  "Serial Number",
  "Payment Method",
  "Payment Date",
  "Seller Name",
  "Seller Email",
  "Seller Phone",
  "Seller Street",
  "Seller City",
  "Seller State",
  "Seller ZIP",
  "Shippo Label URL",
  "Tracking Number",
  "Incoming Tracking Number",
  "Inbound Tracking Number",
  "Outgoing Tracking Number",
  "Outbound Tracking Number",
  "Return Tracking Number",
  "Return Shipment Tracking",
];
const PRICING_REVIEW_FLAGS_STORAGE_KEY = "milfordPricingReviewFlags";
const PRICING_REVIEW_FLAG_REASONS = [
  { value: "", label: "Choose reason" },
  { value: "price_too_high", label: "Price too high" },
  { value: "price_too_low", label: "Price too low" },
  { value: "bad_source_data", label: "Bad source data" },
  { value: "wrong_model_alias", label: "Wrong model or alias" },
  { value: "missing_price_table_row", label: "Missing price table row" },
  { value: "should_be_instant_quote", label: "Should be instant quote" },
  { value: "should_stay_manual_review", label: "Should stay manual review" },
  { value: "accessory_or_kit_dependent", label: "Accessory/kit dependent" },
  { value: "film_or_collectible", label: "Film or collectible pricing" },
  { value: "large_heavy_shipping", label: "Large/heavy shipping risk" },
  { value: "duplicate_catalog_cleanup", label: "Duplicate/catalog cleanup" },
  { value: "other", label: "Other" },
];

function createStaffIntakeState(options = {}) {
  return {
    mode: options.mode || "new_quote",
    orderId: options.orderId || "",
    quoteRef: options.quoteRef || "",
    sourceRecordId: options.sourceRecordId || "",
    customer: options.customer || "",
    returnOrderId: options.returnOrderId || "",
    cart: [],
    currentQuote: null,
    currentQuoteSignature: "",
    currentQuoteLoading: false,
    currentQuoteError: "",
    cartQuote: null,
    cartQuoteSignature: "",
    cartQuoteLoading: false,
    cartQuoteError: "",
    createdQuoteRef: options.createdQuoteRef || "",
    createdQuoteSignature: options.createdQuoteSignature || "",
    createdRecords: options.createdRecords || [],
    quoteEmailQueued: Boolean(options.quoteEmailQueued),
    guideTarget: options.guideTarget || "gear",
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
    staffQueueGuideTargetOverride = "";
    if (options.selectQuoteRef) {
      activeFilter = "all";
      if (staffFilterSelect) staffFilterSelect.value = "all";
      selectedOrderId = orderIdForQuoteRef(options.selectQuoteRef) || selectedOrderId;
    }
    if (options.selectRecordId) selectedItemId = options.selectRecordId;
    if (!orders.some((order) => order.id === selectedOrderId)) selectedOrderId = visibleOrders()[0]?.id || orders[0]?.id || null;
    syncSelectedItem();
    loginEl.hidden = true;
    workspaceEl.hidden = false;
    renderQueue();
    renderDetail();
    updateStaffHistoryButtons();
    updateBugReportLink();
    setStatus(demoRecords.length && !SHOW_DEMO_ORDERS ? `Orders loaded. ${demoRecords.length} demo order${demoRecords.length === 1 ? "" : "s"} hidden.` : "Orders loaded.");
  } catch (error) {
    records = [];
    orders = [];
    selectedOrderId = null;
    selectedItemId = null;
    renderQueue();
    renderDetail();
    updateStaffHistoryButtons();
    updateBugReportLink();
    setStatus(error.message || "Unable to load orders.", true);
  } finally {
    loadButton.disabled = false;
    refreshButton.disabled = false;
  }
}

function deepLinkLoadOptions() {
  return DEEP_LINK_QUOTE_REF ? { selectQuoteRef: DEEP_LINK_QUOTE_REF } : {};
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
        addressText: orderAddressText(fields),
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
  updateStaffHistoryButtons();
  updateBugReportLink();

  if (!filtered.length) {
    listEl.innerHTML = `<div class="staff-empty-card">No orders in this view.</div>`;
    return;
  }

  listEl.innerHTML = filtered.map(renderOrderCard).join("");
  listEl.querySelectorAll("[data-order-id]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedOrderId = button.dataset.orderId;
      staffQueueGuideTargetOverride = "";
      syncSelectedItem();
      renderQueue();
      renderDetail();
      updateBugReportLink();
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
  if (order.workflow.current?.key === "manual") return "Next: Manual quote";
  return order.workflow.current ? `Next: ${order.workflow.current.label}` : "Complete";
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
    updateBugReportLink();
    return;
  }

  const fields = record.fields || {};
  const accessories = accessoryListFor(fields);
  const parsed = parseStaffNotes(fields["Staff Notes"]);
  const received = itemPhysicallyReceived(record);
  const inspectionReason = inspectionReasonForDisplay(fields, parsed);
  const baseOffer = numberOrNull(fields["Milford Offer"]) ?? 0;
  const calculatedAdjustedOffer = calculateOffer(fields, parsed, accessories, baseOffer);
  const adjustedOffer = reviewRequiresCustomerDecision(fields, parsed, accessories)
    ? calculatedAdjustedOffer
    : numberOrNull(fields["Final Offer"]) ?? calculatedAdjustedOffer;
  const paymentMethod = paymentMethodValue(orderPayoutFields(order, fields));
  const defaultDecision = staffDecisionForRecord(record, order, adjustedOffer, parsed, accessories);
  const orderLocked = completedOrderLocked(order);

  detailEl.innerHTML = `
    <article class="staff-intake">
      ${renderOrderHeader(order, record, adjustedOffer)}
      ${renderOrderStatusProgress(order)}
      ${renderOrderInfoGrid(order, fields, baseOffer, paymentMethod)}
      ${renderOrderItemsProgress(order)}
      ${renderManualQuotePanel(order, record)}

      <header class="staff-intake-header">
        <div class="staff-item-header-main">
          <div class="staff-item-image-panel">
            ${productImageMarkup(productImageForRecord(fields), "staff-item-image", fields["Item Brand"])}
          </div>
          <div class="staff-item-title-block">
            <div class="staff-item-kicker">
              <p class="brand-line">${escapeHtml(fields["Quote Reference"] || record.id)}</p>
              <span class="staff-item-position">${escapeHtml(itemPositionLabel(order, record))}</span>
            </div>
            <h2>${escapeHtml(gearTitle(fields))}</h2>
            <p>${escapeHtml(fields.Category || "Gear")} - ${escapeHtml(fields.Condition || "Condition not listed")}</p>
          </div>
        </div>
        <div class="staff-offer-box">
          <span>Item quote</span>
          <strong>$${formatMoney(adjustedOffer)}</strong>
          <small class="staff-offer-store-credit">$${formatMoney(storeCreditOffer(adjustedOffer))} store credit</small>
          <small>${escapeHtml(fields.Status || "New")}</small>
        </div>
      </header>

      <form class="staff-review-form${orderLocked ? " is-locked" : ""}" id="staff-review-form">
        ${orderLocked ? `<p class="staff-order-locked-note">Order locked. Unlock the completed order before editing item details.</p>` : ""}
        <section class="staff-review-section" data-staff-queue-guide="receive">
          <div class="staff-section-title">
            <span>1</span>
            <div>
              <h3>Receive this item</h3>
              <p>Confirm this specific piece of gear arrived in the box or in-store dropoff.</p>
            </div>
          </div>
          <div class="staff-receive-grid">
            <label class="staff-check-row">
              <input type="checkbox" id="received-check" ${received ? "checked" : ""} />
              This item has been received
            </label>
            <label class="staff-check-row staff-check-row-warning">
              <input type="checkbox" id="not-received-check" ${parsed.notReceived ? "checked" : ""} />
              This item was NOT received
            </label>
          </div>
        </section>

        <section class="staff-review-section" data-staff-queue-guide="included">
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
            <input type="checkbox" id="all-accessories-check" ${parsed.allAccessories ? "checked" : ""} />
            All recommended accessories included
          </label>
        </section>

        <section class="staff-review-section" data-staff-queue-guide="condition">
          <div class="staff-section-title">
            <span>3</span>
            <div>
              <h3>Verify condition</h3>
              <p>Changing the grade recalculates the adjusted offer.</p>
            </div>
          </div>
          ${renderStaffConditionContext(fields)}
          <div class="staff-condition-grid">
            ${Object.keys(CONDITION_MULTIPLIERS).map((condition) => renderCondition(condition, parsed.verifiedCondition)).join("")}
          </div>
        </section>

        <section class="staff-review-section" data-staff-queue-guide="quote">
          <div class="staff-section-title">
            <span>4</span>
            <div>
              <h3>Final item quote</h3>
              <p>Set the final item offer. Unchanged or higher offers default to acceptance; reduced offers wait for customer confirmation.</p>
            </div>
          </div>
          <div class="staff-adjust-grid">
            <label class="field">
              <span>Instant quote offer</span>
              <input id="suggested-offer" type="number" min="0" step="1" value="${baseOffer}" readonly />
              ${renderOfferAmountSummary("instant", baseOffer)}
            </label>
            <label class="field">
              <span>Adjusted offer</span>
              <input id="custom-offer" type="number" min="0" step="1" value="${adjustedOffer}" />
              ${renderOfferAmountSummary("adjusted", adjustedOffer)}
            </label>
          </div>
          ${renderStaffReferencePricing(fields)}
          ${renderStaffDecisionContext(record, order, defaultDecision)}
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
            <label class="staff-decision-card staff-decision-card-decline">
              <input type="radio" name="item-decision" value="not_accepted" ${defaultDecision === "not_accepted" ? "checked" : ""} />
              <span>Not accepted by Milford Photo</span>
            </label>
          </div>
          <label class="field">
            <span>Adjustment reason / inspection notes</span>
            <textarea id="inspection-notes" rows="5" placeholder="Example: Customer selected Excellent, but inspection found heavy body wear and missing charger.">${escapeHtml(inspectionReason)}</textarea>
          </label>
          <div class="staff-finish-evaluation-row">
            <button class="primary-action staff-finish-evaluation-button" type="button" id="finish-item-evaluation">
              ${escapeHtml(finishEvaluationButtonLabel(order, record))}
            </button>
          </div>
        </section>
      </form>

      ${renderOrderDecisionPanel(order)}
      ${renderPayoutPanel(order, fields, paymentMethod)}
      ${renderStaffActionsPanel(record, parsed, order)}
    </article>
  `;

  bindDetail(record, accessories);
  updateStaffQueueGuidance();
  updateBugReportLink();
  updateStaffHistoryButtons();
}

function renderOrderHeader(order, currentRecord, currentCashOffer) {
  const totals = orderOfferTotals(order, currentRecord, currentCashOffer);
  const fields = currentRecord?.fields || {};
  return `
    <section class="staff-order-header">
      <div>
        <p class="brand-line staff-order-kicker">
          <span>Order ${escapeHtml(order.quote)}</span>
          <button class="staff-log-link" type="button" data-order-log="${escapeAttr(order.id)}">Open order log</button>
        </p>
        <h2>${escapeHtml(order.customer)}</h2>
        <p>${escapeHtml(order.items.length)} item${order.items.length === 1 ? "" : "s"} in this order${order.synthetic && order.items.length > 1 ? " - grouped for testing from same customer/address/time window" : ""}</p>
        ${renderOrderSellerContact(order, fields)}
      </div>
      <div class="staff-order-total" id="staff-order-total-card">
        <span>Order offer total</span>
        <strong data-order-cash-total>$${formatMoney(totals.cash)}</strong>
        <small data-order-store-credit-total>$${formatMoney(totals.storeCredit)} store credit</small>
        <small data-order-original-total>Original quote: $${formatMoney(totals.original)}</small>
      </div>
    </section>
  `;
}

function renderOrderSellerContact(order = {}, fields = {}) {
  const contact = sellerContactValues(order, fields);
  const orderLocked = completedOrderLocked(order);
  const lockedAttr = orderLocked ? "disabled" : "";
  const lockedTitle = orderLocked ? "Unlock completed order to edit contact details." : "Edit contact";
  const contactRows = [
    contact.addressHtml && contact.addressText
      ? `<a class="staff-contact-link staff-contact-link-address" href="${escapeAttr(mapsSearchUrl(contact.addressText))}" target="_blank" rel="noreferrer">${contact.addressHtml}</a>`
      : "",
    contact.email
      ? `<a class="staff-contact-link" href="mailto:${escapeAttr(String(contact.email).trim())}">${escapeHtml(contact.email)}</a>`
      : "",
    contact.phone && staffPhoneHref(contact.phone)
      ? `<a class="staff-contact-link" href="${escapeAttr(staffPhoneHref(contact.phone))}">${escapeHtml(formatStaffPhone(contact.phone))}</a>`
      : contact.phone ? escapeHtml(formatStaffPhone(contact.phone)) : "",
  ].filter(Boolean);
  const hasAddress = Boolean(contact.street && contact.city && contact.state && contact.zip);
  return `
    <div class="staff-order-contact-card" aria-label="Seller contact">
      <div class="staff-order-contact-heading">
        <div class="staff-order-contact">
          ${contactRows.length ? contactRows.map((row) => `<p>${row}</p>`).join("") : `<p class="staff-order-contact-empty">No contact details on file.</p>`}
        </div>
        <button class="secondary-action staff-contact-edit-button" type="button" id="edit-customer-contact" aria-expanded="false" aria-controls="staff-contact-editor" title="${escapeAttr(lockedTitle)}" ${lockedAttr}>Edit contact</button>
      </div>
      <div class="staff-contact-editor" id="staff-contact-editor" hidden>
        <div class="staff-address-grid">
          <label class="field">
            <span>Street</span>
            <input id="staff-address-street" autocomplete="off" value="${escapeAttr(contact.street)}" ${lockedAttr} />
          </label>
          <label class="field">
            <span>City</span>
            <input id="staff-address-city" autocomplete="off" value="${escapeAttr(contact.city)}" ${lockedAttr} />
          </label>
          <label class="field">
            <span>State</span>
            <input id="staff-address-state" autocomplete="off" maxlength="2" value="${escapeAttr(contact.state)}" ${lockedAttr} />
          </label>
          <label class="field">
            <span>ZIP</span>
            <input id="staff-address-zip" autocomplete="off" value="${escapeAttr(contact.zip)}" ${lockedAttr} />
          </label>
          <label class="field">
            <span>Email</span>
            <input id="staff-contact-email" type="email" autocomplete="off" value="${escapeAttr(contact.email)}" ${lockedAttr} />
          </label>
          <label class="field">
            <span>Phone</span>
            <input id="staff-contact-phone" autocomplete="off" value="${escapeAttr(contact.phone)}" ${lockedAttr} />
          </label>
        </div>
        <label class="staff-check-row staff-address-confirm">
          <input type="checkbox" id="staff-address-confirmed" ${hasAddress ? "checked" : ""} ${lockedAttr} />
          Customer confirmed this contact information
        </label>
        <button class="secondary-action staff-admin-action" type="button" id="save-customer-address" ${lockedAttr}>Save contact</button>
      </div>
    </div>
  `;
}

function sellerContactValues(order = {}, fields = {}) {
  const street = fields["Seller Street"] || "";
  const city = fields["Seller City"] || "";
  const state = fields["Seller State"] || "";
  const zip = fields["Seller ZIP"] || "";
  const addressHtml = orderAddress({ "Seller Street": street, "Seller City": city, "Seller State": state, "Seller ZIP": zip });
  const addressText = orderAddressText({ "Seller Street": street, "Seller City": city, "Seller State": state, "Seller ZIP": zip });
  return {
    street,
    city,
    state,
    zip,
    addressHtml,
    addressText,
    email: fields["Seller Email"] || order.email || "",
    phone: fields["Seller Phone"] || order.phone || "",
  };
}

function sellerAddressForOrder(order = {}) {
  const fields = order.items?.[0]?.fields || {};
  const contact = sellerContactValues(order, fields);
  return {
    street: String(contact.street || "").trim(),
    city: String(contact.city || "").trim(),
    state: String(contact.state || "").trim().toUpperCase(),
    zip: String(contact.zip || "").trim(),
  };
}

function formatStaffPhone(phone = "") {
  const raw = String(phone || "").trim();
  const digits = raw.replace(/\D/g, "");
  const localDigits = digits.length === 11 && digits.startsWith("1")
    ? digits.slice(1)
    : digits;
  if (localDigits.length !== 10) return raw;
  return `(${localDigits.slice(0, 3)}) ${localDigits.slice(3, 6)}-${localDigits.slice(6)}`;
}

function staffPhoneHref(phone = "") {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length === 10) return `tel:+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `tel:+${digits}`;
  return digits ? `tel:${digits}` : "";
}

function mapsSearchUrl(address = "") {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

function upsTrackingUrl(trackingNumber = "") {
  const clean = String(trackingNumber || "").trim();
  return clean ? `https://www.ups.com/track?tracknum=${encodeURIComponent(clean)}` : "";
}

function trackingLink(trackingNumber = "", label = trackingNumber) {
  const clean = String(trackingNumber || "").trim();
  if (!clean || clean === "-") return "-";
  return `<a href="${escapeAttr(upsTrackingUrl(clean))}" target="_blank" rel="noreferrer">${escapeHtml(label || clean)}</a>`;
}

function renderOfferAmountSummary(kind, cashAmount) {
  const cash = numberOrNull(cashAmount) ?? 0;
  return `
    <small class="staff-offer-amount-summary" data-offer-summary="${escapeAttr(kind)}">
      <span data-offer-cash>$${escapeHtml(formatMoney(cash))}</span>
      <span data-offer-store-credit>$${escapeHtml(formatMoney(storeCreditOffer(cash)))} store credit</span>
    </small>
  `;
}

function updateOfferAmountSummaries(instantCash, adjustedCash) {
  setOfferAmountSummary("instant", instantCash);
  setOfferAmountSummary("adjusted", adjustedCash);
}

function setOfferAmountSummary(kind, cashAmount) {
  const summary = document.querySelector(`[data-offer-summary="${kind}"]`);
  if (!summary) return;
  const cash = numberOrNull(cashAmount) ?? 0;
  const cashEl = summary.querySelector("[data-offer-cash]");
  const storeCreditEl = summary.querySelector("[data-offer-store-credit]");
  if (cashEl) cashEl.textContent = `$${formatMoney(cash)}`;
  if (storeCreditEl) storeCreditEl.textContent = `$${formatMoney(storeCreditOffer(cash))} store credit`;
}

function renderOrderInfoGrid(order, fields, baseOffer, paymentMethod) {
  const delivery = staffDeliveryFromFields(fields);
  const shipping = shippingPanelState(fields, delivery, order);
  const orderLocked = completedOrderLocked(order);
  const inboundActionDisabled = shipping.inboundDisabled || (orderLocked && !shipping.labelUrl);
  const outboundActionDisabled = shipping.outboundDisabled || (orderLocked && !shipping.returnLabelUrl);
  return `
    <div class="staff-info-grid staff-order-info-grid">
      <section>
        <h3>Original quote</h3>
        <p>Selected item offer: <strong>$${formatMoney(baseOffer)}</strong></p>
        <p>Order total: <strong>$${formatMoney(order.totals.original)}</strong></p>
        <p>Market estimate: ${moneyOrDash(fields["eBay Median Price"])}</p>
        <p>Quote source: ${escapeHtml(quoteSourceLabel(fields))}</p>
        <p>Pricing basis: ${escapeHtml(staffNoteValue(fields, "Pricing basis") || "-")}</p>
        <p>Price last reviewed: ${escapeHtml(staffNoteValue(fields, "Price last reviewed") || "-")}</p>
        <p>Expires: ${formatDate(fields["Quote Expires"]) || "-"}</p>
      </section>
      <section class="staff-logistics-panel">
        <h3>${escapeHtml(shipping.title)}</h3>
        <p>Delivery: <strong>${escapeHtml(delivery || "-")}</strong></p>
        <p class="staff-logistics-copy">${escapeHtml(shipping.copy)}</p>
        <dl class="staff-logistics-list">
          <div>
            <dt>Inbound label</dt>
            <dd>${escapeHtml(shipping.labelStatusText)}</dd>
          </div>
          <div>
            <dt>Inbound tracking</dt>
            <dd>${trackingLink(incomingTrackingNumber(fields))}</dd>
          </div>
          <div>
            <dt>Return tracking</dt>
            <dd>${trackingLink(shipping.returnTrackingText)}</dd>
          </div>
        </dl>
        <div class="staff-shipping-actions">
          <div class="staff-shipping-action">
            <button class="secondary-action staff-admin-action" type="button" id="create-shipping-label" title="${escapeAttr(orderLocked && !shipping.labelUrl ? "Unlock completed order to create an inbound label." : shipping.inboundReason)}" ${inboundActionDisabled ? "disabled" : ""}>${escapeHtml(shipping.inboundButtonLabel)}</button>
            <small>${escapeHtml(shipping.inboundReason)}</small>
          </div>
          <div class="staff-shipping-action">
            <button class="secondary-action staff-admin-action" type="button" id="create-outbound-label" title="${escapeAttr(orderLocked && !shipping.returnLabelUrl ? "Unlock completed order to create an outbound label." : shipping.outboundReason)}" ${outboundActionDisabled ? "disabled" : ""}>${escapeHtml(shipping.outboundButtonLabel)}</button>
            <small>${escapeHtml(shipping.outboundReason)}</small>
          </div>
          ${shipping.showReturnPackingSlip ? `
            <div class="staff-shipping-action">
              <button class="secondary-action staff-admin-action" type="button" id="print-return-packing-slip-top">Print return packing slip</button>
              <small>Print this slip for the box returning customer gear.</small>
            </div>
          ` : ""}
        </div>
        <p>Payout: ${escapeHtml(paymentMethodLabel(paymentMethod))}</p>
      </section>
    </div>
  `;
}

function shippingPanelState(fields = {}, delivery = "", order = selectedOrder()) {
  const isDropoff = delivery === "In-store drop-off";
  const hasAddress = sellerContactHasAddress(fields);
  const inboundLabel = inboundLabelMetadataForOrder(order);
  const labelUrl = inboundLabel.labelUrl || fields["Shippo Label URL"] || "";
  const returnLabel = returnLabelMetadataForOrder(order);
  const hasReturnItems = orderHasReturnItems(order);
  const returnLabelUrl = returnLabel.labelUrl || "";
  const manualQuoteOutstanding = Boolean(order?.workflow?.manualQuoteOutstanding);
  const inboundDisabled = !labelUrl && (manualQuoteOutstanding || isDropoff || !hasAddress);
  const title = isDropoff ? "In-store dropoff" : "Mail-in shipping";
  const copy = manualQuoteOutstanding
    ? "This order needs a manual quote before staff creates an inbound label or asks the customer to ship gear."
    : isDropoff
    ? "This order was created as a counter/dropoff quote, so staff should already have the gear. No customer-to-Milford inbound label is needed."
    : "Use the scan-based inbound label for customer-to-Milford shipments. Create outbound labels only for gear the customer asked Milford Photo to send back.";
  const inboundReason = labelUrl
    ? "Existing inbound label is on file. This opens the same label instead of creating another."
    : manualQuoteOutstanding
      ? "Save and email the manual quote before creating an inbound label."
      : isDropoff
      ? "In-store dropoff assumes the gear is already with Milford Photo."
      : hasAddress
        ? "Creates a scan-based prepaid customer-to-Milford label and emails it to the customer."
        : "Add and save the customer address before creating an inbound label.";
  const outboundReason = returnLabelUrl
    ? `Return label created${returnLabel.trackingNumber ? `, tracking ${returnLabel.trackingNumber}` : ""}.`
    : !hasReturnItems
      ? "No customer-return items are selected for this order."
      : hasAddress
        ? "Creates scan-based prepaid Milford-to-customer postage for the selected return item(s)."
        : "Add and save the customer address before creating an outbound label.";

  return {
    title,
    copy,
    labelUrl,
    labelText: isDropoff ? "Not needed for in-store dropoff" : "No inbound label yet",
    labelStatusText: labelUrl ? "Inbound label on file" : (isDropoff ? "Not needed for in-store dropoff" : "No inbound label yet"),
    returnTrackingText: returnLabel.trackingNumber || outgoingTrackingNumber(fields),
    returnLabelUrl,
    inboundButtonLabel: labelUrl ? "Open inbound label" : "Create inbound label",
    inboundDisabled,
    inboundReason,
    outboundButtonLabel: returnLabelUrl ? "Open outbound label" : "Create outbound label",
    outboundDisabled: !returnLabelUrl && (!hasReturnItems || !hasAddress),
    outboundReason,
    showReturnPackingSlip: hasReturnItems,
  };
}

function sellerContactHasAddress(fields = {}) {
  return Boolean(fields["Seller Street"] && fields["Seller City"] && fields["Seller State"] && fields["Seller ZIP"]);
}

function renderPayoutPanel(order, fields, paymentMethod) {
  const payoutFields = orderPayoutFields(order, fields);
  const payoutNotes = payoutFields["Staff Notes"] || "";
  const method = paymentMethod || paymentMethodValue(payoutFields);
  const storeCreditCode = noteValue(payoutNotes, "Store credit code");
  const checkNumber = noteValue(payoutNotes, "Check number");
  const payoutNote = noteValue(payoutNotes, "Payout notes");
  const paymentSent = orderPaymentComplete(order) || staffActionCompleted("payment", payoutFields, parseStaffNotes(payoutNotes));
  const customerPayout = orderCustomerPayoutSummary(order, fields, method);
  const returnOnly = orderIsReturnOnly(order, customerPayout);
  const returnComplete = returnOnly && orderReturnComplete(order);
  const hasReturnItems = orderHasReturnItems(order);
  const returnBoxed = hasReturnItems && orderReturnBoxed(order);
  const orderLocked = completedOrderLocked(order);
  const returnWorkflowComplete = hasReturnItems && orderReturnComplete(order);
  const stateLabel = returnComplete
    ? returnBoxed ? "Boxed" : "Closed"
    : returnOnly
      ? "Return only"
      : paymentSent
    ? "Sent"
    : customerPayout
      ? "Customer responded"
      : method
        ? "Selected"
        : "Needed";
  const paymentButtonLabel = returnOnly
    ? returnComplete ? "Gear shipped + email sent" : "Mark gear shipped + email customer"
    : paymentSent ? "Payment sent, resend email notification" : "Mark payment sent + email customer";
  const boxedButtonLabel = returnBoxed
    ? "Return items boxed / awaiting pickup"
    : "Mark return items boxed / awaiting pickup";
  const payoutDisabled = returnOnly || orderLocked;
  const paymentActionDisabled = orderLocked || (returnOnly && returnComplete);
  const boxedButtonDisabled = orderLocked || returnBoxed || returnWorkflowComplete;
  return `
    <article class="staff-admin-card staff-payout-card${returnOnly ? " is-return-only" : ""}" data-staff-queue-guide="payout">
      <div class="staff-admin-card-heading">
        <div>
          <h3>Payout</h3>
          <p>${escapeHtml(returnOnly ? "No payout is due. Pack and ship the returned gear, then close the return and email the customer." : "Record payout details for the order. Mark payment sent only after the check or store credit is issued.")}</p>
        </div>
        <span class="staff-admin-state ${returnComplete || paymentSent || customerPayout ? "is-ready" : method ? "is-needed" : ""}">${escapeHtml(stateLabel)}</span>
      </div>
      ${customerPayout ? `
        <div class="staff-customer-payout-response">
          <span>Customer response saved</span>
          <strong>${escapeHtml(customerPayout.title)}</strong>
          <p>${escapeHtml(customerPayout.copy)}</p>
        </div>
        ${renderCustomerFulfillmentCards(customerPayout)}
      ` : ""}
      <div class="staff-payout-grid">
        <label class="field">
          <span>Method</span>
          <select id="payment-method" ${payoutDisabled ? "disabled" : ""}>
            <option value="">Choose method</option>
            <option value="check" ${method === "check" ? "selected" : ""}>Check</option>
            <option value="store_credit" ${method === "store_credit" ? "selected" : ""}>Store credit</option>
          </select>
        </label>
        <label class="field">
          <span>Store credit code</span>
          <input id="store-credit-code" autocomplete="off" value="${escapeAttr(storeCreditCode)}" placeholder="Code" ${payoutDisabled ? "disabled" : ""} />
        </label>
        <label class="field">
          <span>Check number</span>
          <input id="check-number" autocomplete="off" value="${escapeAttr(checkNumber)}" ${payoutDisabled ? "disabled" : ""} />
        </label>
        <label class="field">
          <span>Payout note</span>
          <input id="payout-note" autocomplete="off" value="${escapeAttr(payoutNote)}" placeholder="Optional note" ${payoutDisabled ? "disabled" : ""} />
        </label>
      </div>
      <div class="staff-admin-actions ${hasReturnItems ? "has-return-boxed-action" : ""}">
        <button class="secondary-action staff-admin-action" type="button" id="save-payout-details" ${payoutDisabled ? "disabled" : ""}>Save payout details</button>
        <button class="primary-action staff-admin-action" type="button" id="${returnOnly ? "mark-return-shipped" : "mark-payment-sent"}" ${paymentActionDisabled ? "disabled" : ""}>${escapeHtml(paymentButtonLabel)}</button>
        ${hasReturnItems ? `<button class="secondary-action staff-admin-action" type="button" id="mark-return-boxed" ${boxedButtonDisabled ? "disabled" : ""}>${escapeHtml(boxedButtonLabel)}</button>` : ""}
      </div>
    </article>
  `;
}

function renderCustomerFulfillmentCards(summary) {
  const acceptedItems = summary.acceptedItems || [];
  const returnItems = summary.returnItems || [];
  const returnLabel = summary.returnLabel || {};
  const returnLabelUrl = returnLabel.labelUrl || "";
  const payoutTitle = acceptedItems.length
    ? `Pay ${summary.payoutAmountText} by ${summary.paymentLabel || "selected method"}`
    : "No payout due";
  const payoutCopy = acceptedItems.length
    ? summary.payoutDestination
    : "The customer did not accept any items for purchase.";
  const returnTitle = returnItems.length
    ? `Send back ${returnItems.length} item${returnItems.length === 1 ? "" : "s"}`
    : "No return shipment needed";
  const returnCopy = returnItems.length
    ? summary.returnDestination
    : "The customer did not request any returned gear.";

  return `
    <div class="staff-fulfillment-grid" aria-label="Customer decision staff tasks">
      <section class="staff-fulfillment-card is-payout">
        <span>Payout to issue</span>
        <strong>${escapeHtml(payoutTitle)}</strong>
        <p>${escapeHtml(payoutCopy)}</p>
        ${acceptedItems.length ? `<ul>${acceptedItems.map((item) => `<li>${escapeHtml(item.name)} - ${escapeHtml(item.amountText)}</li>`).join("")}</ul>` : ""}
      </section>
      <section class="staff-fulfillment-card is-return">
        <span>Gear to return</span>
        <strong>${escapeHtml(returnTitle)}</strong>
        <p>${escapeHtml(returnCopy)}</p>
        ${returnItems.length ? `<ul>${returnItems.map((item) => `<li>${escapeHtml(item.name)}</li>`).join("")}</ul>` : ""}
        ${returnLabel.trackingNumber ? `<p>Tracking ${trackingLink(returnLabel.trackingNumber)}</p>` : ""}
        <div class="staff-fulfillment-actions">
          <button class="secondary-action staff-admin-action" type="button" id="create-return-label" ${returnItems.length ? "" : "disabled"}>${escapeHtml(returnLabelUrl ? "Open outbound label" : "Create outbound label")}</button>
          <button class="secondary-action staff-admin-action" type="button" id="print-return-packing-quote" ${returnItems.length ? "" : "disabled"}>Print packing slip</button>
        </div>
        ${returnItems.length ? `<small>${escapeHtml(returnLabelUrl ? "Use the Shippo outbound label for postage, then include the packing slip in the box." : "Creates a scan-based prepaid Milford-to-customer outbound label; print the packing slip separately for the box.")}</small>` : ""}
      </section>
    </div>
  `;
}

function renderStaffActionSteps(record, parsed, order, locked = false) {
  const fields = record?.fields || {};
  return STAFF_ACTION_STEPS.map((step, index) => {
    const stepDisabled = staffActionDisabled(step.action, record, order);
    const disabled = stepDisabled || locked;
    const completed = !stepDisabled && staffActionCompletedForRecord(step.action, record, parsed, order);
    const classes = [
      "staff-step-action",
      step.primary ? "is-primary" : "",
      step.danger ? "is-danger" : "",
      completed ? "is-complete" : "",
      stepDisabled ? "is-disabled" : "",
      locked ? "is-locked" : "",
    ].filter(Boolean).join(" ");
    const meta = locked
      ? "Order locked"
      : stepDisabled
        ? staffActionDisabledCopy(step.action, record, order)
        : completed
          ? "Completed - click to undo"
          : (step.statusCopy || `Saves status: ${step.status}`);
    return `
      <div class="staff-action-card">
        <button class="${classes}" type="button" data-action="${escapeAttr(step.action)}" data-action-mode="${disabled ? "disabled" : completed ? "undo" : "apply"}" ${disabled ? "disabled" : ""}>
          <span class="staff-step-number">${index + 1}</span>
          <span class="staff-step-copy">
            <strong>${escapeHtml(step.label)}</strong>
            <small>${escapeHtml(meta)}</small>
          </span>
        </button>
        <button class="staff-notify-action" type="button" data-notify-action="${escapeAttr(step.action)}" ${disabled ? "disabled" : ""}>
          <span>Email customer</span>
          <small>${escapeHtml(locked ? "Order locked" : step.notifyLabel || "Send status update")}</small>
        </button>
      </div>
    `;
  }).join("");
}

function renderStaffActionsPanel(record, parsed, order) {
  const completeClass = order?.workflow?.isComplete ? " is-complete" : "";
  const locked = completedOrderLocked(order);
  const lockedClass = locked ? " is-locked" : "";
  return `
    <section class="staff-actions-panel${completeClass}${lockedClass}" aria-label="Item workflow actions" data-staff-queue-guide="actions">
      <div class="staff-actions-heading">
        <div class="staff-actions-heading-copy">
          <strong>Item workflow actions</strong>
          <span>Top buttons save the listed item status only. Email customer buttons send the matching customer email separately.</span>
        </div>
        ${order?.workflow?.isComplete ? renderCompletedOrderLockToggle(order, locked) : ""}
      </div>
      <div class="staff-action-steps">
        ${renderStaffActionSteps(record, parsed, order, locked)}
      </div>
      <p class="staff-actions-note">
        Tracking automation note: when incoming delivery tracking is connected, a delivered scan can trigger the received email automatically. Until then, email the customer from step 1 after the package is checked in.
      </p>
    </section>
  `;
}

function renderCompletedOrderLockToggle(order, locked) {
  return `
    <label class="staff-order-lock-toggle">
      <input id="staff-order-lock-toggle" type="checkbox" ${locked ? "checked" : ""} />
      <span class="staff-order-lock-switch" aria-hidden="true"></span>
      <span class="staff-order-lock-copy">
        <strong>${locked ? "Order Locked" : "Order Unlocked"}</strong>
        <small>${locked ? "Unlock to edit completed workflow actions." : "Editing completed order."}</small>
      </span>
    </label>
  `;
}

function completedOrderLocked(order = selectedOrder()) {
  return Boolean(order?.workflow?.isComplete && !unlockedCompletedOrderIds.has(order.id));
}

function handleCompletedOrderLockToggle(order, input) {
  if (!order?.workflow?.isComplete) return;
  if (!input.checked) {
    const confirmed = window.confirm("You are about to unlock an order that has been completed. Are you sure?");
    if (!confirmed) {
      input.checked = true;
      setStatus("Order remains locked.");
      return;
    }
    unlockedCompletedOrderIds.add(order.id);
    renderDetail();
    setStatus("Completed order unlocked. Use caution when editing finished workflow steps.");
    return;
  }

  unlockedCompletedOrderIds.delete(order.id);
  renderDetail();
  setStatus("Completed order locked.");
}

function finishEvaluationButtonLabel(order, record) {
  return nextOrderItemId(order, record?.id) ? "Finish item evaluation / next item" : "Finish evaluation";
}

function renderOrderProgress(order) {
  return `
    ${renderOrderStatusProgress(order)}
    ${renderOrderItemsProgress(order)}
  `;
}

function renderOrderStatusProgress(order) {
  return `
    <section class="staff-order-progress staff-order-status-progress" aria-label="Order status" data-staff-queue-guide="order">
      <div class="staff-order-progress-group">
        <div class="staff-progress-heading">
          <strong>Order status</strong>
          <span>Overall customer order workflow</span>
        </div>
        ${renderWorkflow(order)}
      </div>
    </section>
  `;
}

function renderOrderItemsProgress(order) {
  const orderLocked = completedOrderLocked(order);
  return `
    <section class="staff-order-progress staff-order-items-progress${orderLocked ? " is-locked" : ""}" aria-label="Order item navigation" data-staff-queue-guide="items">
      <div class="staff-order-progress-group">
        <div class="staff-progress-heading">
          <strong>Items in this order</strong>
          <span class="staff-progress-heading-actions">
            <span>${orderLocked ? "Order locked. Unlock to add or remove items." : "Open each item to receive and evaluate it"}</span>
            <button class="staff-add-item-button" type="button" data-add-order-item="${escapeAttr(order.id)}" ${orderLocked ? "disabled" : ""}>ADD ITEM</button>
          </span>
        </div>
        ${renderItemTabs(order)}
      </div>
    </section>
  `;
}

function renderWorkflow(order) {
  const workflowSteps = order.workflow?.steps || WORKFLOW_STEPS;
  return `
    <nav class="staff-workflow" aria-label="Order workflow">
      ${workflowSteps.map((step, index) => {
        const state = order.workflow.skipped?.has(step.key)
          ? "is-disabled"
          : order.workflow.completed.has(step.key)
            ? "is-complete"
            : step.key === order.workflow.current?.key
              ? "is-current"
              : "";
        return `
          <div class="staff-workflow-step ${state}">
            <span>${index + 1}</span>
            <strong>${escapeHtml(workflowStepDisplayLabel(step))}</strong>
          </div>
        `;
      }).join("")}
    </nav>
  `;
}

function renderManualQuotePanel(order, currentRecord) {
  const manualItems = orderManualReviewItems(order);
  if (!manualItems.length || !order.workflow?.manualQuoteOutstanding) return "";

  const currentManualRecord = manualItems.find((item) => item.id === currentRecord.id) || manualItems[0];
  const currentFields = currentManualRecord.fields || {};
  const currentAmount = manualQuoteAmountForRecord(currentManualRecord);
  const unpricedItems = manualItems.filter((item) => !itemManualQuoteIsPriced(item));
  const allPriced = unpricedItems.length === 0;
  const helperCopy = allPriced
    ? "Manual pricing is saved. Email the prepared quote, then create the inbound label from the shipping panel when this is a mail-in order."
    : "Enter an offer for every manual-review item before emailing the prepared quote to the customer.";
  return `
    <section class="staff-admin-card staff-manual-quote-card" data-staff-queue-guide="manual">
      <div class="staff-admin-card-heading">
        <div>
          <h3>Manual quote needed</h3>
          <p>${escapeHtml(helperCopy)}</p>
        </div>
        <span class="staff-admin-state is-needed">${escapeHtml(allPriced ? "Ready to email" : `${unpricedItems.length} price${unpricedItems.length === 1 ? "" : "s"} needed`)}</span>
      </div>
      <div class="staff-manual-quote-grid">
        <div class="staff-manual-quote-items" aria-label="Manual quote items">
          ${manualItems.map((item) => {
            const fields = item.fields || {};
            const amount = manualQuoteAmountForRecord(item);
            const active = item.id === currentManualRecord.id;
            return `
              <button class="staff-manual-quote-item ${active ? "is-active" : ""}" type="button" data-item-id="${escapeAttr(item.id)}">
                <span>${escapeHtml(shortGearTitle(fields))}</span>
                <strong>${itemManualQuoteIsPriced(item) ? `$${formatMoney(amount)}` : "Needs price"}</strong>
              </button>
            `;
          }).join("")}
        </div>
        <div class="staff-manual-quote-editor">
          <label class="field">
            <span>Manual offer for ${escapeHtml(shortGearTitle(currentFields))}</span>
            <input id="manual-quote-offer" type="number" min="0" step="1" inputmode="numeric" value="${currentAmount ? escapeAttr(String(currentAmount)) : ""}" />
          </label>
          <div class="staff-admin-actions">
            <button class="secondary-action staff-admin-action" type="button" id="save-manual-quote" data-record-id="${escapeAttr(currentManualRecord.id)}">Save manual quote</button>
            <button class="primary-action staff-admin-action" type="button" id="send-manual-quote-email" ${allPriced ? "" : "disabled"}>Email quote to customer</button>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderItemTabs(order) {
  const orderLocked = completedOrderLocked(order);
  return `
    <div class="staff-item-tabs" role="tablist" aria-label="Gear items in order">
      ${order.items.map((item, index) => {
        const fields = item.fields || {};
        const statusClass = itemStatusClass(item);
        const tabStatus = itemTabStatusLabel(item);
        const canRemove = order.items.length > 1 && !orderLocked;
        const removeTitle = orderLocked
          ? "Unlock completed order to remove items"
          : canRemove
            ? "Remove this item from the order"
            : "Cannot remove the only item in an order";
        return `
          <div class="staff-item-tab-card ${item.id === selectedItemId ? "is-active" : ""}">
            <button class="staff-item-tab ${statusClass} ${item.id === selectedItemId ? "is-active" : ""}" type="button" data-item-id="${escapeAttr(item.id)}">
              <span class="staff-item-tab-number">${index + 1}</span>
              ${productImageMarkup(productImageForRecord(fields), "staff-item-tab-image", fields["Item Brand"])}
              <span class="staff-item-tab-copy">
                <span class="staff-item-tab-name">${escapeHtml(shortGearTitle(fields))}</span>
                ${tabStatus ? `<span class="staff-item-tab-status">${escapeHtml(tabStatus)}</span>` : ""}
              </span>
            </button>
            <button class="staff-item-remove-button" type="button" data-remove-item-id="${escapeAttr(item.id)}" data-remove-item-name="${escapeAttr(shortGearTitle(fields))}" ${canRemove ? "" : "disabled"} title="${escapeAttr(removeTitle)}">Remove</button>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function renderOrderDecisionPanel(order) {
  const evaluated = order.items.filter(itemIsEvaluated).length;
  const ready = evaluated === order.items.length;
  const sent = finalQuoteEmailSent(order);
  const orderLocked = completedOrderLocked(order);
  const copy = sent
    ? "Final quote email has already been sent. Resend only if the email address was corrected or the customer needs the link again."
    : ready
      ? "All items are evaluated. Staff can send the item-by-item final quote for the customer to accept or return each item."
      : `${evaluated} of ${order.items.length} items evaluated. Finish every item before sending the final quote email.`;
  const buttonDisabled = (sent || ready) && !orderLocked ? "" : "disabled";
  const buttonLabel = sent ? "Resend final quote email" : "Send final quote email";
  return `
    <section class="staff-order-decision ${sent ? "is-sent" : ""}" data-staff-queue-guide="final-email">
      <div>
        <h3>Final quote email</h3>
        <p>${escapeHtml(copy)}</p>
      </div>
      <button class="primary-action" type="button" id="send-final-quote" data-resend="${sent ? "true" : "false"}" ${buttonDisabled}>${buttonLabel}</button>
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

function renderStaffConditionContext(fields = {}) {
  return `
    <div class="staff-condition-context">
      <div>
        <span>${escapeHtml(conditionChoiceLabel(fields))}</span>
        <strong>${escapeHtml(fields.Condition || "Not listed")}</strong>
      </div>
      <p>${escapeHtml(quoteOriginLabel(fields))}</p>
    </div>
  `;
}

function conditionChoiceLabel(fields = {}) {
  return quoteOriginIsStaff(fields) ? "Counter intake condition" : "Customer selected condition";
}

function quoteOriginLabel(fields = {}) {
  if (quoteOriginIsStaff(fields)) return "Created through the staff dashboard counter-intake flow.";
  if (String(fields.Source || "").toLowerCase().includes("online")) return "Submitted by the customer through the online quote widget.";
  return "Submitted through the used-gear quote workflow.";
}

function quoteOriginIsStaff(fields = {}) {
  const source = String(fields.Source || "").toLowerCase();
  const notes = String(fields["Staff Notes"] || "").toLowerCase();
  return source.includes("staff") || notes.includes("staff in-store intake");
}

function staffDecisionForRecord(record, order, finalOffer, parsed = parseStaffNotes(record?.fields?.["Staff Notes"]), accessories = accessoryListFor(record?.fields || {}), options = {}) {
  const fields = record?.fields || {};
  const saved = parseStaffNotes(fields["Staff Notes"]);
  const customerFinalDecision = parsed.customerFinalDecision || saved.customerFinalDecision;
  if (customerFinalDecision === "return") return "return";
  if (customerFinalDecision === "accept") return "accept";
  const staffDecision = parsed.decision || saved.decision;
  if (staffDecision === "not_accepted") return "not_accepted";

  const reviewNeedsCustomerDecision = reviewRequiresCustomerDecision(fields, parsed, accessories);
  if (options.reviewChangesOverrideAcceptance && reviewNeedsCustomerDecision) return "pending";

  const status = staffWorkflowText(fields);
  if (status.includes("customer accepted") || status.includes("payment")) return "accept";

  if (reviewNeedsCustomerDecision) return "pending";

  if (!orderHasReducedFinalOffer(order, record, finalOffer)) return "accept";
  return itemOfferWasReduced(fields, finalOffer) ? "pending" : "accept";
}

function reviewRequiresCustomerDecision(fields = {}, review = {}, accessories = []) {
  if (review.notReceived) return true;

  const customerCondition = String(fields.Condition || "").trim();
  const verifiedCondition = String(review.verifiedCondition || "").trim();
  if (customerCondition && verifiedCondition && normalizeCondition(customerCondition) !== normalizeCondition(verifiedCondition)) {
    return true;
  }

  return accessories.some((item) => review.accessories?.[item.name] === false);
}

function renderStaffDecisionContext(record, order, selectedDecision = "pending") {
  const fields = record?.fields || {};
  const customerDecision = latestCustomerDecision(fields);
  const finalEmailSent = finalQuoteEmailSent(order);
  const choiceLabel = customerDecision
    ? customerDecisionLabel(customerDecision.decision)
    : finalEmailSent && selectedDecision === "pending"
      ? "Awaiting customer decision"
      : "No customer response yet";
  const choiceCopy = customerDecision
    ? customerDecisionDetail(customerDecision)
    : `Current staff selection: ${staffDecisionLabel(selectedDecision)}.`;
  const emailLabel = finalEmailSent ? "Sent to customer" : "Not sent yet";
  const emailCopy = customerDecision
    ? "Customer response is saved from the final quote link."
    : finalEmailSent
      ? "Final quote email was sent; the customer can accept this item or ask for it returned."
      : "Send the final quote email after every item is evaluated to request the customer decision.";
  const stateClass = customerDecision ? "has-customer-choice" : finalEmailSent ? "is-awaiting" : "is-unsent";

  return `
    <div class="staff-final-decision-context ${stateClass}" id="staff-final-decision-context" data-email-sent="${finalEmailSent ? "true" : "false"}" data-customer-decision="${escapeAttr(customerDecision?.decision || "")}">
      <div>
        <span>Customer choice</span>
        <strong data-staff-decision-choice>${escapeHtml(choiceLabel)}</strong>
        <p data-staff-decision-copy>${escapeHtml(choiceCopy)}</p>
      </div>
      <div>
        <span>Final quote email</span>
        <strong data-staff-email-status>${escapeHtml(emailLabel)}</strong>
        <p data-staff-email-copy>${escapeHtml(emailCopy)}</p>
      </div>
    </div>
  `;
}

function latestCustomerDecision(fields = {}) {
  const decisions = parseCustomerDecisionBlocks(fields["Staff Notes"]);
  if (!decisions.length) return null;
  return [...decisions].sort((a, b) => logTimestampValue(b.submitted) - logTimestampValue(a.submitted))[0];
}

function customerDecisionLabel(decision = "") {
  const normalized = String(decision || "").toLowerCase();
  if (normalized === "return") return "Customer wants this item returned";
  if (normalized === "accept") return "Customer accepted this item";
  return staffDecisionLabel(normalized);
}

function customerDecisionDetail(decision = {}) {
  const details = [];
  const paymentPreference = paymentPreferenceDisplay(decision.paymentPreference);
  if (decision.submitted) details.push(`Submitted ${formatLogTimestamp(decision.submitted)}`);
  if (paymentPreference) details.push(`Payout preference: ${paymentPreference}`);
  return details.length ? `${details.join(". ")}.` : "Saved from the final quote link.";
}

function orderCustomerPayoutSummary(order = {}, fields = {}, selectedMethod = "") {
  const decisions = orderCustomerDecisionItems(order);
  if (!decisions.length) return null;

  const sorted = [...decisions].sort((a, b) => logTimestampValue(b.submitted) - logTimestampValue(a.submitted));
  const submitted = sorted[0]?.submitted || "";
  const paymentPreference = paymentPreferenceDisplay(sorted.find((decision) => decision.paymentPreference)?.paymentPreference)
    || paymentMethodLabel(selectedMethod)
    || "";
  const accepted = decisions.filter((decision) => decision.decision === "accept");
  const returned = decisions.filter((decision) => decision.decision === "return");
  const acceptedText = `${accepted.length} accepted item${accepted.length === 1 ? "" : "s"}`;
  const returnedText = `${returned.length} return item${returned.length === 1 ? "" : "s"}`;
  const payoutText = paymentPreference || "No payout selected";
  const hasPayoutPreference = accepted.length > 0 && Boolean(paymentPreference);
  const cashTotal = accepted.reduce((total, item) => total + item.cashAmount, 0);
  const storeCreditTotal = accepted.reduce((total, item) => total + item.storeCreditAmount, 0);
  const selectedPaymentValue = selectedMethod || paymentMethodValue(fields);
  const payoutAmount = selectedPaymentValue === "store_credit" ? storeCreditTotal : cashTotal;
  const addressText = orderAddressText(fields) || order.addressText || "";
  const customerEmail = fields["Seller Email"] || order.email || "";
  const paymentLabelText = paymentPreference || paymentMethodLabel(selectedPaymentValue) || "selected method";
  const payoutDestination = selectedPaymentValue === "store_credit"
    ? `Issue store credit to ${customerEmail || "the customer record"}.`
    : `Mail check to ${addressText || "the saved customer mailing address"}.`;
  const returnDestination = `Ship return gear to ${addressText || "the saved customer mailing address"}.`;
  const returnLabel = returnLabelMetadataForOrder(order);
  const title = hasPayoutPreference
    ? `Customer wants to be paid by ${payoutText.toLowerCase()}.`
    : accepted.length > 0
      ? "Customer accepted items, but no payout method was saved."
      : "Customer requested return only.";
  const copy = [
    `${acceptedText}; ${returnedText}.`,
    hasPayoutPreference ? `Use ${payoutText.toLowerCase()} for accepted-item payout.` : "",
    submitted ? `Submitted ${formatLogTimestamp(submitted)}.` : "",
  ].filter(Boolean).join(" ");

  return {
    title,
    copy,
    acceptedCount: accepted.length,
    returnCount: returned.length,
    acceptedItems: accepted,
    returnItems: returned,
    cashTotal,
    storeCreditTotal,
    payoutAmount,
    payoutAmountText: `$${formatMoney(payoutAmount)}`,
    paymentLabel: paymentLabelText,
    payoutDestination,
    returnDestination,
    addressText,
    customerEmail,
    submitted,
    paymentPreference,
    returnLabel,
    logDetail: `${acceptedText}; ${returnedText}. ${hasPayoutPreference ? `Customer selected ${payoutText.toLowerCase()} payout.` : title}`,
  };
}

function orderPayoutFields(order = {}, fallbackFields = {}) {
  const items = order?.items || [];
  const paymentRecord = items.find((record) => staffActionCompleted("payment", record.fields || {}, parseStaffNotes(record.fields?.["Staff Notes"])));
  if (paymentRecord?.fields) return paymentRecord.fields;
  const savedPayoutRecord = items.find((record) => {
    const fields = record.fields || {};
    const notes = String(fields["Staff Notes"] || "");
    return paymentMethodValue(fields) || notes.includes("PAYOUT UPDATE");
  });
  if (savedPayoutRecord?.fields) return savedPayoutRecord.fields;
  const acceptedRecord = items.find((record) => customerAcceptedItem(record));
  return acceptedRecord?.fields || fallbackFields || {};
}

function orderCustomerDecisionItems(order = {}) {
  return (order.items || []).map((record) => {
    const fields = record.fields || {};
    const latestDecision = latestCustomerDecision(fields);
    if (!latestDecision) return null;
    const cashAmount = adjustedCashOfferForRecord(record);
    return {
      ...latestDecision,
      recordId: record.id,
      name: shortGearTitle(fields),
      itemName: shortGearTitle(fields),
      cashAmount,
      storeCreditAmount: storeCreditOffer(cashAmount),
      amountText: `$${formatMoney(cashAmount)} / $${formatMoney(storeCreditOffer(cashAmount))} store credit`,
    };
  }).filter(Boolean);
}

function inboundLabelMetadataForOrder(order = {}) {
  for (const record of order.items || []) {
    const fields = record.fields || {};
    const labelUrl = fields["Shippo Label URL"] || "";
    const trackingNumber = incomingTrackingNumber(fields) === "-" ? "" : incomingTrackingNumber(fields);
    const carrier = noteValue(fields["Staff Notes"], "Carrier");
    const service = noteValue(fields["Staff Notes"], "Service");
    if (labelUrl || trackingNumber) {
      return { labelUrl, trackingNumber, carrier, service };
    }
  }
  return { labelUrl: "", trackingNumber: "", carrier: "", service: "" };
}

function returnLabelMetadataForOrder(order = {}) {
  const returnRecords = orderReturnItems(order);
  const sourceRecords = returnRecords.length ? returnRecords : order.items || [];
  for (const record of sourceRecords) {
    const fields = record.fields || {};
    const notes = fields["Staff Notes"] || "";
    const labelUrl = noteValue(notes, "Return label URL");
    const trackingNumber = noteValue(notes, "Return tracking number")
      || fields["Outgoing Tracking Number"]
      || fields["Outbound Tracking Number"]
      || fields["Return Tracking Number"]
      || fields["Return Shipment Tracking"]
      || "";
    const carrier = noteValue(notes, "Return carrier");
    const service = noteValue(notes, "Return service");
    if (labelUrl || trackingNumber) {
      return { labelUrl, trackingNumber, carrier, service };
    }
  }
  return { labelUrl: "", trackingNumber: "", carrier: "", service: "" };
}

function customerDecisionValue(record = {}) {
  const fields = record.fields || {};
  return latestCustomerDecision(fields)?.decision || parseStaffNotes(fields["Staff Notes"]).customerFinalDecision || "";
}

function customerReturnRequested(record = {}) {
  return customerDecisionValue(record) === "return";
}

function customerAcceptedItem(record = {}) {
  const status = staffWorkflowText(record.fields || {});
  return customerDecisionValue(record) === "accept" || statusIncludesAny(status, ["accepted item", "customer accepted", "payment"]);
}

function staffReturnBoxed(record = {}) {
  const fields = record.fields || {};
  const parsed = parseStaffNotes(fields["Staff Notes"]);
  const status = staffWorkflowText(fields);
  return parsed.returnBoxed
    || parsed.returnReadyForPickup
    || parsed.lastAction === "return_boxed"
    || status.includes("return items boxed")
    || status.includes("awaiting pickup");
}

function staffReturnShipped(record = {}) {
  const fields = record.fields || {};
  const parsed = parseStaffNotes(fields["Staff Notes"]);
  const status = staffWorkflowText(fields);
  return parsed.returnShipped
    || parsed.lastAction === "return"
    || status.includes("items shipped to customer")
    || status.includes("return complete");
}

function staffReturnCompleted(record = {}) {
  return staffReturnBoxed(record) || staffReturnShipped(record);
}

function orderReturnItems(order = {}) {
  return (order?.items || []).filter((item) => customerReturnRequested(item) || staffWorkflowText(item.fields || {}).includes("return"));
}

function orderHasReturnItems(order = {}) {
  return orderReturnItems(order).length > 0;
}

function orderIsReturnOnly(order = {}, summary = orderCustomerPayoutSummary(order)) {
  return Boolean(summary && summary.returnCount > 0 && summary.acceptedCount === 0);
}

function orderReturnComplete(order = {}) {
  const returnItems = orderReturnItems(order);
  return returnItems.length > 0 && returnItems.every(staffReturnCompleted);
}

function orderReturnBoxed(order = {}) {
  const returnItems = orderReturnItems(order);
  return returnItems.length > 0 && returnItems.every((record) => staffReturnBoxed(record) && !staffReturnShipped(record));
}

function orderAcceptedItems(order = {}) {
  return (order?.items || []).filter(customerAcceptedItem);
}

function orderPaymentComplete(order = {}) {
  const acceptedItems = orderAcceptedItems(order);
  if (!acceptedItems.length) return orderHasPaymentSent(order);
  return acceptedItems.every((item) => staffActionCompleted("payment", item.fields || {}, parseStaffNotes(item.fields?.["Staff Notes"]))) || orderHasPaymentSent(order);
}

function orderHasPaymentSent(order = {}) {
  return (order?.items || []).some((item) => staffActionCompleted("payment", item.fields || {}, parseStaffNotes(item.fields?.["Staff Notes"])));
}

function staffActionCompletedForRecord(action, record = {}, parsed = {}, order = {}) {
  if (action === "payment" && orderPaymentComplete(order)) return true;
  return staffActionCompleted(action, record.fields || {}, parsed);
}

function staffActionDisabled(action, record = {}, order = {}) {
  if (action === "accepted" && customerReturnRequested(record)) return true;
  if (action === "payment" && !orderAcceptedItems(order).length) return true;
  return action === "return" && !orderHasReturnItems(order);
}

function staffActionDisabledCopy(action, record = {}, order = {}) {
  if (action === "accepted" && customerReturnRequested(record)) return "Not needed - customer requested return";
  if (action === "payment" && !orderAcceptedItems(order).length) return "Not needed - no payout due";
  if (action === "return") return "Not needed - no customer return items";
  return "Not needed for this order";
}

function itemTabStatusLabel(record = {}) {
  const fields = record.fields || {};
  const parsed = parseStaffNotes(fields["Staff Notes"]);
  const paymentComplete = staffActionCompleted("payment", fields, parsed);
  if (customerAcceptedItem(record)) return paymentComplete ? "Sold / paid" : "Accepted - pay";
  if (staffReturnBoxed(record) && !staffReturnShipped(record)) return "Return boxed";
  if (customerReturnRequested(record) && !staffReturnCompleted(record)) return "Return to customer";
  if (staffReturnCompleted(record)) return "Return complete";
  if (paymentComplete) return "Paid";
  if (itemIsEvaluated(record)) return "Evaluated";
  if (itemPhysicallyReceived(record)) return "Received";
  return "";
}
function staffDecisionLabel(value = "pending") {
  if (value === "accept") return "Customer accepts this item";
  if (value === "return") return "Customer wants this item returned";
  if (value === "not_accepted") return "Not accepted by Milford Photo";
  return "Await customer decision";
}

function refreshStaffDecisionContext(selectedDecision = "pending") {
  const panel = document.getElementById("staff-final-decision-context");
  if (!panel || panel.dataset.customerDecision) return;
  const emailSent = panel.dataset.emailSent === "true";
  const itemDeclinedByStaff = selectedDecision === "not_accepted";
  const choiceLabel = itemDeclinedByStaff
    ? "Not accepted by Milford Photo"
    : emailSent && selectedDecision === "pending"
    ? "Awaiting customer decision"
    : "No customer response yet";
  const emailCopy = itemDeclinedByStaff
    ? "Final quote email should show this item for return to the customer."
    : emailSent && selectedDecision === "pending"
    ? "Final quote email was sent; waiting for the customer to choose accept or return."
    : emailSent
      ? "Final quote email was sent; the customer can still respond from the final quote link."
      : "Send the final quote email after every item is evaluated to request the customer decision.";

  const choiceEl = panel.querySelector("[data-staff-decision-choice]");
  const choiceCopyEl = panel.querySelector("[data-staff-decision-copy]");
  const emailStatusEl = panel.querySelector("[data-staff-email-status]");
  const emailCopyEl = panel.querySelector("[data-staff-email-copy]");
  if (choiceEl) choiceEl.textContent = choiceLabel;
  if (choiceCopyEl) choiceCopyEl.textContent = `Current staff selection: ${staffDecisionLabel(selectedDecision)}.`;
  if (emailStatusEl) emailStatusEl.textContent = emailSent ? "Sent to customer" : "Not sent yet";
  if (emailCopyEl) emailCopyEl.textContent = emailCopy;
}

function updateDefaultDecision(record, suggestedOffer, review, accessories = []) {
  const decisionInputs = Array.from(document.querySelectorAll("input[name='item-decision']"));
  if (!decisionInputs.length) return;
  const customOffer = numberOrNull(document.getElementById("custom-offer")?.value);
  const finalOffer = customOffer ?? suggestedOffer;
  const reviewState = review || collectReviewState(accessories);
  const decision = staffDecisionForRecord(record, selectedOrder(), finalOffer, reviewState, accessories, { reviewChangesOverrideAcceptance: true });
  const forcePendingForReviewChange = decision === "pending" && reviewRequiresCustomerDecision(record?.fields || {}, reviewState, accessories);
  if (!forcePendingForReviewChange && decisionInputs.some((input) => input.dataset.userSelected === "true")) return;
  if (forcePendingForReviewChange) {
    decisionInputs.forEach((input) => {
      delete input.dataset.userSelected;
    });
  }
  decisionInputs.forEach((input) => {
    input.checked = input.value === decision;
  });
  refreshStaffDecisionContext(decision);
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
  if (!raw) return "";
  const normalized = String(raw || "").toLowerCase();
  if (normalized.includes("store")) return "store_credit";
  if (normalized.includes("check")) return "check";
  return "";
}

function paymentMethodLabel(value = "") {
  if (value === "store_credit") return "Store credit";
  if (value === "check") return "Check";
  return "Customer chooses after final quote";
}

function paymentPreferenceDisplay(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized.includes("store")) return "Store credit";
  if (normalized.includes("check")) return "Check";
  return "";
}

function staffCanSetPaymentMethod(fields = {}, paymentMethod = "") {
  if (paymentMethod) return true;
  const source = String(fields.Source || "").toLowerCase();
  const staffNotes = String(fields["Staff Notes"] || "").toLowerCase();
  return source.includes("staff") || staffNotes.includes("staff in-store intake");
}

function bindDetail(record, accessories) {
  const form = document.getElementById("staff-review-form");
  const actionButtons = Array.from(detailEl.querySelectorAll("[data-action]"));
  const notifyButtons = Array.from(detailEl.querySelectorAll("[data-notify-action]"));
  const workflowButtons = [...actionButtons, ...notifyButtons];
  const allAccessoriesCheck = document.getElementById("all-accessories-check");
  const accessoryInputs = Array.from(form.querySelectorAll("[data-accessory]"));
  const sendFinalQuoteButton = document.getElementById("send-final-quote");
  const finishEvaluationButton = document.getElementById("finish-item-evaluation");
  const receivedCheck = document.getElementById("received-check");
  const notReceivedCheck = document.getElementById("not-received-check");
  const fields = record.fields || {};
  const orderLocked = completedOrderLocked(selectedOrder());

  if (orderLocked && form) {
    form.querySelectorAll("input, textarea, select, button").forEach((control) => {
      control.disabled = true;
      control.setAttribute("aria-disabled", "true");
    });
  }

  detailEl.querySelectorAll("[data-item-id]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedItemId = button.dataset.itemId;
      staffQueueGuideTargetOverride = "";
      renderDetail();
    });
  });

  detailEl.querySelectorAll("[data-remove-item-id]").forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.stopPropagation();
      if (completedOrderLocked(selectedOrder())) {
        setStatus("Order is locked. Unlock the completed order before removing items.", true);
        return;
      }
      await removeOrderItem(selectedOrder(), button.dataset.removeItemId, button.dataset.removeItemName || "", button);
    });
  });

  detailEl.querySelector("[data-add-order-item]")?.addEventListener("click", () => {
    if (completedOrderLocked(selectedOrder())) {
      setStatus("Order is locked. Unlock the completed order before adding items.", true);
      return;
    }
    startAddOrderItem(selectedOrder());
  });

  detailEl.querySelector("[data-order-log]")?.addEventListener("click", () => {
    openOrderLog(selectedOrder());
  });

  document.getElementById("save-manual-quote")?.addEventListener("click", async (event) => {
    await saveManualQuoteForRecord(selectedOrder(), event.currentTarget.dataset.recordId, event.currentTarget);
  });

  document.getElementById("send-manual-quote-email")?.addEventListener("click", async (event) => {
    await sendManualQuoteEmail(selectedOrder(), event.currentTarget);
  });

  document.getElementById("save-customer-address")?.addEventListener("click", async (event) => {
    if (completedOrderLocked(selectedOrder())) {
      setStatus("Order is locked. Unlock the completed order before saving contact changes.", true);
      return;
    }
    await saveCustomerAddress(selectedOrder(), event.currentTarget);
  });

  document.getElementById("create-shipping-label")?.addEventListener("click", async (event) => {
    if (completedOrderLocked(selectedOrder()) && !inboundLabelMetadataForOrder(selectedOrder()).labelUrl) {
      setStatus("Order is locked. Unlock the completed order before creating a new inbound label.", true);
      return;
    }
    await createShippingLabelForOrder(selectedOrder(), event.currentTarget);
  });

  document.getElementById("create-outbound-label")?.addEventListener("click", async (event) => {
    if (completedOrderLocked(selectedOrder()) && !returnLabelMetadataForOrder(selectedOrder()).labelUrl) {
      setStatus("Order is locked. Unlock the completed order before creating a new outbound label.", true);
      return;
    }
    await createReturnLabelForOrder(selectedOrder(), event.currentTarget);
  });

  document.getElementById("print-return-packing-slip-top")?.addEventListener("click", () => {
    printReturnDocument(selectedOrder(), "packing");
  });

  document.getElementById("edit-customer-contact")?.addEventListener("click", (event) => {
    const editor = document.getElementById("staff-contact-editor");
    if (!editor) return;
    const shouldOpen = editor.hidden;
    editor.hidden = !shouldOpen;
    event.currentTarget.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
    event.currentTarget.textContent = shouldOpen ? "Close contact editor" : "Edit contact";
    if (shouldOpen) document.getElementById("staff-address-street")?.focus();
  });

  document.getElementById("save-payout-details")?.addEventListener("click", async (event) => {
    await savePayoutDetails(selectedOrder(), event.currentTarget, { markSent: false });
  });

  document.getElementById("mark-payment-sent")?.addEventListener("click", async (event) => {
    await savePayoutDetails(selectedOrder(), event.currentTarget, { markSent: true, notifyCustomer: true });
  });

  document.getElementById("mark-return-boxed")?.addEventListener("click", async (event) => {
    await markReturnBoxedForOrder(selectedOrder(), event.currentTarget);
  });

  document.getElementById("mark-return-shipped")?.addEventListener("click", async (event) => {
    await markReturnShippedForOrder(selectedOrder(), event.currentTarget);
  });

  document.getElementById("create-return-label")?.addEventListener("click", async (event) => {
    await createReturnLabelForOrder(selectedOrder(), event.currentTarget);
  });

  document.getElementById("print-return-packing-quote")?.addEventListener("click", () => {
    printReturnDocument(selectedOrder(), "packing");
  });

  document.getElementById("staff-order-lock-toggle")?.addEventListener("change", (event) => {
    handleCompletedOrderLockToggle(selectedOrder(), event.currentTarget);
  });

  receivedCheck?.addEventListener("change", () => {
    if (receivedCheck.checked && notReceivedCheck) notReceivedCheck.checked = false;
    setStaffQueueGuideTarget(receivedCheck.checked ? "included" : "receive");
    updateSuggestedOffer(record, accessories);
  });

  notReceivedCheck?.addEventListener("change", () => {
    if (notReceivedCheck.checked && receivedCheck) receivedCheck.checked = false;
    setStaffQueueGuideTarget(notReceivedCheck.checked ? "quote" : "receive");
    updateSuggestedOffer(record, accessories);
  });

  form.querySelectorAll("input, textarea").forEach((input) => {
    if (input.name === "item-decision" || input.id === "received-check" || input.id === "not-received-check") return;
    input.addEventListener("input", () => updateSuggestedOffer(record, accessories));
    input.addEventListener("change", () => updateSuggestedOffer(record, accessories));
  });

  const customOfferInput = document.getElementById("custom-offer");
  customOfferInput?.addEventListener("input", () => {
    customOfferInput.dataset.customEdited = "true";
    setStaffQueueGuideTarget("actions");
  });

  allAccessoriesCheck.addEventListener("change", () => {
    accessoryInputs.forEach((input) => {
      input.checked = allAccessoriesCheck.checked;
    });
    setStaffQueueGuideTarget("condition");
    updateSuggestedOffer(record, accessories);
  });

  accessoryInputs.forEach((input) => {
    input.addEventListener("change", () => {
      allAccessoriesCheck.checked = accessoryInputs.every((item) => item.checked);
      setStaffQueueGuideTarget("condition");
    });
  });

  form.querySelectorAll("input[name='verified-condition']").forEach((input) => {
    const selectCondition = () => {
      form.querySelectorAll(".staff-condition-option").forEach((option) => option.classList.remove("is-selected"));
      input.closest(".staff-condition-option").classList.add("is-selected");
      setStaffQueueGuideTarget("quote");
    };
    input.addEventListener("change", selectCondition);
    input.addEventListener("click", selectCondition);
  });

  form.querySelectorAll("input[name='item-decision']").forEach((input) => {
    input.addEventListener("change", () => {
      input.dataset.userSelected = "true";
      setStaffQueueGuideTarget("actions");
      updateSuggestedOffer(record, accessories);
      refreshStaffDecisionContext(input.value);
    });
  });

  document.getElementById("inspection-notes")?.addEventListener("input", () => {
    setStaffQueueGuideTarget("actions");
  });

  syncAutoInspectionNotes(fields, accessories);

  actionButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      await handleStaffAction(record, accessories, button.dataset.action, workflowButtons, {
        notifyCustomer: false,
        undo: button.dataset.actionMode === "undo",
      });
    });
  });

  notifyButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      await handleStaffAction(record, accessories, button.dataset.notifyAction, workflowButtons, {
        notifyCustomer: true,
        notifyOnly: true,
      });
    });
  });

  finishEvaluationButton?.addEventListener("click", async () => {
    await finishItemEvaluation(record, accessories, [finishEvaluationButton, ...workflowButtons]);
  });

  sendFinalQuoteButton.addEventListener("click", async () => {
    const isResend = sendFinalQuoteButton.dataset.resend === "true";
    if (isResend && !window.confirm("Resend the final quote email to the current customer email address on this order?")) {
      setStatus("Final quote resend canceled.");
      return;
    }
    sendFinalQuoteButton.disabled = true;
    try {
      await handleOrderAction(selectedOrder(), "Final Quote Sent", { resendFinalQuote: isResend });
    } finally {
      if (document.body.contains(sendFinalQuoteButton)) sendFinalQuoteButton.disabled = false;
    }
  });
}

function updateSuggestedOffer(record, accessories) {
  const fields = record.fields || {};
  const review = collectReviewState(accessories);
  const originalOffer = numberOrNull(fields["Milford Offer"]) ?? 0;
  const adjustedOffer = calculateOffer(fields, review, accessories, originalOffer);
  const suggestedInput = document.getElementById("suggested-offer");
  const customInput = document.getElementById("custom-offer");
  const previousAdjusted = numberOrNull(customInput.dataset.adjustedOffer ?? customInput.value);
  const currentCustom = numberOrNull(customInput.value);
  const customDiffersFromPriorAdjusted = previousAdjusted !== null
    && currentCustom !== null
    && currentCustom !== previousAdjusted;
  const keepCustom = customInput.dataset.customEdited === "true"
    || document.activeElement === customInput
    || customDiffersFromPriorAdjusted;
  const forceAdjustedOffer = review.decision === "not_accepted";
  suggestedInput.value = originalOffer;
  suggestedInput.dataset.originalOffer = String(originalOffer);
  customInput.dataset.adjustedOffer = String(adjustedOffer);
  if (forceAdjustedOffer || !keepCustom) {
    customInput.value = adjustedOffer;
    if (forceAdjustedOffer) customInput.dataset.customEdited = "";
  }
  const displayedAdjustedOffer = numberOrNull(customInput.value) ?? adjustedOffer;
  updateOfferAmountSummaries(originalOffer, displayedAdjustedOffer);
  updateOrderTotalCard(selectedOrder(), record, displayedAdjustedOffer);
  updateDefaultDecision(record, displayedAdjustedOffer, review, accessories);
  syncAutoInspectionNotes(fields, accessories, review);
}

async function saveCustomerAddress(order, button) {
  if (!order?.quote) return;
  const before = orderSnapshots(order);
  const address = {
    street: document.getElementById("staff-address-street")?.value.trim() || "",
    city: document.getElementById("staff-address-city")?.value.trim() || "",
    state: document.getElementById("staff-address-state")?.value.trim().toUpperCase() || "",
    zip: document.getElementById("staff-address-zip")?.value.trim() || "",
  };
  const email = document.getElementById("staff-contact-email")?.value.trim() || "";
  const phone = document.getElementById("staff-contact-phone")?.value.trim() || "";
  setDetailBusy([button], true);
  setStatus("Saving customer contact...");
  try {
    const data = await staffPost("/api/staff/address", {
      quoteRef: order.quote,
      address,
      email,
      phone,
      confirmed: Boolean(document.getElementById("staff-address-confirmed")?.checked),
    }, { staff: true });
    mergeUpdatedRecords(data.records || []);
    pushStaffHistory("customer contact update", before, orderSnapshots(selectedOrder()));
    staffQueueGuideTargetOverride = "";
    renderQueue();
    renderDetail();
    setStatus("Customer contact saved.");
  } catch (error) {
    setStatus(error.message || "Unable to save customer contact.", true);
  } finally {
    setDetailBusy([button], false);
  }
}

async function saveManualQuoteForRecord(order, recordId, button) {
  if (!order?.quote || !recordId) return;
  const record = order.items.find((item) => item.id === recordId);
  if (!record) {
    setStatus("Choose a manual-review item before saving a quote.", true);
    return;
  }
  const amount = numberOrNull(document.getElementById("manual-quote-offer")?.value);
  if (!amount || amount <= 0) {
    setStatus("Enter a manual quote amount greater than $0 before saving.", true);
    return;
  }

  const before = orderSnapshots(order);
  setDetailBusy([button], true);
  setStatus("Saving manual quote...");
  try {
    const updatedRecord = await updateRecord({
      recordId,
      status: "Manual Quote Ready",
      finalOffer: amount,
      staffNotes: appendManualQuoteStaffNotes(record.fields?.["Staff Notes"], amount, false),
      notifyCustomer: false,
    });
    mergeUpdatedRecords([updatedRecord]);
    pushStaffHistory("manual quote saved", before, orderSnapshots(selectedOrder()));
    staffQueueGuideTargetOverride = "";
    renderQueue();
    renderDetail();
    setStatus("Manual quote saved. Email the prepared quote after all manual-review items have prices.");
  } catch (error) {
    setStatus(error.message || "Unable to save manual quote.", true);
  } finally {
    setDetailBusy([button], false);
  }
}

async function sendManualQuoteEmail(order, button) {
  if (!order?.quote) return;
  const unpricedItems = orderManualReviewItems(order).filter((item) => !itemManualQuoteIsPriced(item));
  if (unpricedItems.length) {
    setStatus(`Add a manual offer for ${unpricedItems.length} item${unpricedItems.length === 1 ? "" : "s"} before emailing the quote.`, true);
    return;
  }
  if (!window.confirm("Email this manually prepared quote to the customer? Create the inbound label from the shipping panel when the order needs a mail-in label.")) {
    setStatus("Manual quote email canceled.");
    return;
  }

  const before = orderSnapshots(order);
  setDetailBusy([button], true);
  setStatus("Emailing prepared manual quote...");
  try {
    const data = await staffPost("/api/staff/email-quote", {
      quoteRef: order.quote,
      to: order.email,
    }, { staff: true });
    mergeUpdatedRecords(data.records || []);
    pushStaffHistory("manual quote emailed", before, orderSnapshots(selectedOrder()));
    staffQueueGuideTargetOverride = "";
    renderQueue();
    renderDetail();
    setStatus("Prepared manual quote email queued. If this is a mail-in order, use Create inbound label in the shipping panel.");
  } catch (error) {
    setStatus(error.message || "Unable to email the manual quote.", true);
  } finally {
    setDetailBusy([button], false);
  }
}

async function createShippingLabelForOrder(order, button) {
  if (!order?.quote) return;
  const existing = inboundLabelMetadataForOrder(order);
  if (existing.labelUrl) {
    window.open(existing.labelUrl, "_blank", "noopener,noreferrer");
    setStatus("Inbound label opened.");
    return;
  }

  if (!window.confirm("Create a scan-based prepaid customer-to-Milford inbound shipping label using the confirmed customer address, then email it to the customer? Shippo should charge Milford only if the label is used.")) {
    setStatus("Label creation canceled.");
    return;
  }
  const savedAddress = sellerAddressForOrder(order);
  const address = {
    street: document.getElementById("staff-address-street")?.value.trim() || savedAddress.street,
    city: document.getElementById("staff-address-city")?.value.trim() || savedAddress.city,
    state: document.getElementById("staff-address-state")?.value.trim().toUpperCase() || savedAddress.state,
    zip: document.getElementById("staff-address-zip")?.value.trim() || savedAddress.zip,
  };
  const before = orderSnapshots(order);
  setDetailBusy([button], true);
  setStatus("Creating inbound shipping label...");
  try {
    const data = await staffPost("/api/staff/create-label", {
      quoteRef: order.quote,
      address,
      emailCustomer: true,
    }, { staff: true });
    mergeUpdatedRecords(data.records || []);
    pushStaffHistory("inbound label creation", before, orderSnapshots(selectedOrder()));
    staffQueueGuideTargetOverride = "";
    renderQueue();
    renderDetail();
    if (data.label?.reused && data.label?.labelUrl) {
      window.open(data.label.labelUrl, "_blank", "noopener,noreferrer");
      setStatus("Existing inbound label opened. No new label was created.");
      return;
    }
    const dryRun = data.label?.dryRun;
    const dryRunReason = data.label?.message || "Shippo did not create a real label.";
    setStatus(dryRun ? `${dryRunReason} No customer label email was sent because no printable label exists yet.` : "Inbound label created and customer email queued.");
  } catch (error) {
    setStatus(error.message || "Unable to create inbound label.", true);
  } finally {
    setDetailBusy([button], false);
  }
}

async function createReturnLabelForOrder(order, button) {
  if (!order?.quote) return;
  const existing = returnLabelMetadataForOrder(order);
  if (existing.labelUrl) {
    window.open(existing.labelUrl, "_blank", "noopener,noreferrer");
    setStatus("Outbound label opened.");
    return;
  }

  const returnItems = orderCustomerDecisionItems(order).filter((item) => item.decision === "return");
  if (!returnItems.length) {
    setStatus("No customer-return items are selected for this order.", true);
    return;
  }

  if (!window.confirm("Create scan-based prepaid Milford-to-customer outbound postage using the saved customer address, then email the customer a return shipment update? Shippo should charge Milford only if the label is used.")) {
    setStatus("Outbound label creation canceled.");
    return;
  }

  const savedAddress = sellerAddressForOrder(order);
  const address = {
    street: document.getElementById("staff-address-street")?.value.trim() || savedAddress.street,
    city: document.getElementById("staff-address-city")?.value.trim() || savedAddress.city,
    state: document.getElementById("staff-address-state")?.value.trim().toUpperCase() || savedAddress.state,
    zip: document.getElementById("staff-address-zip")?.value.trim() || savedAddress.zip,
  };

  const before = orderSnapshots(order);
  setDetailBusy([button], true);
  setStatus("Creating outbound shipping label...");
  try {
    const data = await staffPost("/api/staff/create-return-label", {
      quoteRef: order.quote,
      address,
      emailCustomer: true,
    }, { staff: true });
    mergeUpdatedRecords(data.records || []);
    pushStaffHistory("return label creation", before, orderSnapshots(selectedOrder()));
    staffQueueGuideTargetOverride = "";
    renderQueue();
    renderDetail();
    const dryRun = data.label?.dryRun;
    const dryRunReason = data.label?.message || "Shippo did not create a real outbound label.";
    if (dryRun) {
      setStatus(`${dryRunReason} No printable outbound label exists yet.`, true);
      return;
    }
    if (data.label?.labelUrl) {
      const labelWindow = window.open(data.label.labelUrl, "_blank", "noopener,noreferrer");
      setStatus(labelWindow ? "Outbound label created, opened, and customer return update queued." : "Outbound label created. Use Open outbound label to print it.");
      return;
    }
    setStatus("Outbound label request completed, but no printable label URL was returned.", true);
  } catch (error) {
    setStatus(error.message || "Unable to create outbound label.", true);
  } finally {
    setDetailBusy([button], false);
  }
}

async function markReturnBoxedForOrder(order, button) {
  if (!order?.quote) return;
  const returnRecords = orderReturnItems(order);
  const unboxedReturnRecords = returnRecords.filter((record) => !staffReturnBoxed(record) && !staffReturnShipped(record));
  if (!returnRecords.length) {
    setStatus("No customer-return items are selected for this order.", true);
    return;
  }
  if (!unboxedReturnRecords.length) {
    setStatus("Return items are already boxed or closed for this order.");
    return;
  }
  if (!window.confirm("Mark the return items boxed and awaiting pickup? This is a staff-only status and will not email the customer.")) {
    setStatus("Return boxed update canceled.");
    return;
  }

  const before = orderSnapshots(order);
  const returnLabel = returnLabelMetadataForOrder(order);
  setDetailBusy([button], true);
  setStatus("Marking return items boxed...");
  try {
    const updatedRecords = [];
    for (const record of unboxedReturnRecords) {
      updatedRecords.push(await updateRecord({
        recordId: record.id,
        status: "Return Items Boxed - Awaiting Pickup",
        finalOffer: adjustedCashOfferForRecord(record),
        staffNotes: appendReturnBoxedStaffNotes(record.fields?.["Staff Notes"], returnLabel),
        action: "return_boxed",
        notifyCustomer: false,
      }));
    }
    mergeUpdatedRecords(updatedRecords);
    pushStaffHistory("return items boxed", before, orderSnapshots(selectedOrder()));
    staffQueueGuideTargetOverride = "";
    renderQueue();
    renderDetail();
    setStatus("Return items marked boxed and awaiting pickup. No customer email was sent.");
  } catch (error) {
    setStatus(error.message || "Unable to mark return items boxed.", true);
  } finally {
    setDetailBusy([button], false);
  }
}

async function markReturnShippedForOrder(order, button) {
  if (!order?.quote) return;
  const returnRecords = orderReturnItems(order);
  const openReturnRecords = returnRecords.filter((record) => !staffReturnCompleted(record));
  if (!returnRecords.length) {
    setStatus("No customer-return items are selected for this order.", true);
    return;
  }
  if (!openReturnRecords.length) {
    setStatus("Return shipment is already closed for this order.");
    return;
  }
  if (!window.confirm("Mark the returned gear as shipped/closed and email the customer? Use this after the gear has been packed and handed off for return shipping.")) {
    setStatus("Return closeout canceled.");
    return;
  }

  const before = orderSnapshots(order);
  const returnLabel = returnLabelMetadataForOrder(order);
  setDetailBusy([button], true);
  setStatus("Closing return shipment...");
  try {
    const updatedRecords = [];
    for (let index = 0; index < openReturnRecords.length; index += 1) {
      const record = openReturnRecords[index];
      updatedRecords.push(await updateRecord({
        recordId: record.id,
        status: "Items Shipped to Customer",
        finalOffer: adjustedCashOfferForRecord(record),
        staffNotes: appendReturnShipmentStaffNotes(record.fields?.["Staff Notes"], returnLabel),
        action: "return_shipped",
        notifyCustomer: index === 0,
      }));
    }
    mergeUpdatedRecords(updatedRecords);
    pushStaffHistory("return shipment closeout", before, orderSnapshots(selectedOrder()));
    staffQueueGuideTargetOverride = "";
    renderQueue();
    renderDetail();
    setStatus("Return shipment marked shipped/closed and customer email queued.");
  } catch (error) {
    setStatus(error.message || "Unable to close return shipment.", true);
  } finally {
    setDetailBusy([button], false);
  }
}

function appendReturnBoxedStaffNotes(notes = "", returnLabel = {}) {
  const trackingNumber = returnLabel.trackingNumber || "";
  return [
    String(notes || "").trim(),
    "",
    "RETURN SHIPMENT",
    "Return boxed: Yes",
    "Return ready for pickup: Yes",
    trackingNumber ? `Return tracking number: ${trackingNumber}` : "",
    returnLabel.carrier ? `Return carrier: ${returnLabel.carrier}` : "",
    returnLabel.service ? `Return service: ${returnLabel.service}` : "",
    "Last staff action: return_boxed",
    `Updated: ${new Date().toLocaleString()}`,
  ].filter((line, index) => line || index === 1).join("\n").trim();
}

function appendManualQuoteStaffNotes(notes = "", amount = 0, sent = false) {
  const timestamp = new Date().toLocaleString();
  return [
    String(notes || "").trim(),
    "",
    "MANUAL QUOTE",
    `Manual quote amount: $${formatMoney(amount)}`,
    sent ? `Prepared quote sent: ${timestamp}` : `Manual quote saved: ${timestamp}`,
    `Last staff action: ${sent ? "manual_quote_sent" : "manual_quote_saved"}`,
    `Updated: ${timestamp}`,
  ].filter((line, index) => line || index === 1).join("\n").trim();
}

function appendReturnShipmentStaffNotes(notes = "", returnLabel = {}) {
  const trackingNumber = returnLabel.trackingNumber || "";
  return [
    String(notes || "").trim(),
    "",
    "RETURN SHIPMENT",
    "Return shipped: Yes",
    trackingNumber ? `Return tracking number: ${trackingNumber}` : "",
    returnLabel.carrier ? `Return carrier: ${returnLabel.carrier}` : "",
    returnLabel.service ? `Return service: ${returnLabel.service}` : "",
    "Last staff action: return",
    `Updated: ${new Date().toLocaleString()}`,
  ].filter((line, index) => line || index === 1).join("\n").trim();
}

async function savePayoutDetails(order, button, options = {}) {
  if (!order?.quote) return;
  const paymentMethod = document.getElementById("payment-method")?.value || "";
  if (!paymentMethod) {
    setStatus("Choose a payout method before saving payout details.", true);
    return;
  }
  if (options.markSent && !window.confirm("Mark payout sent and email the customer? Use this only after the check or store credit has actually been issued.")) {
    setStatus("Payout update canceled.");
    return;
  }
  const before = orderSnapshots(order);
  setDetailBusy([button], true);
  setStatus(options.markSent ? "Marking payout sent..." : "Saving payout details...");
  try {
    const data = await staffPost("/api/staff/payout", {
      quoteRef: order.quote,
      paymentMethod,
      storeCreditCode: document.getElementById("store-credit-code")?.value.trim() || "",
      checkNumber: document.getElementById("check-number")?.value.trim() || "",
      payoutNotes: document.getElementById("payout-note")?.value.trim() || "",
      markSent: Boolean(options.markSent),
      action: options.markSent ? "payment_sent" : "payout_saved",
      notifyCustomer: Boolean(options.notifyCustomer),
    }, { staff: true });
    mergeUpdatedRecords(data.records || []);
    pushStaffHistory(options.markSent ? "payment sent update" : "payout details update", before, orderSnapshots(selectedOrder()));
    staffQueueGuideTargetOverride = "";
    renderQueue();
    renderDetail();
    setStatus(options.markSent ? "Payout marked sent and customer email queued." : "Payout details saved.");
  } catch (error) {
    setStatus(error.message || "Unable to save payout details.", true);
  } finally {
    setDetailBusy([button], false);
  }
}

function printReturnDocument(order = selectedOrder(), type = "packing") {
  const returnItems = orderCustomerDecisionItems(order).filter((item) => item.decision === "return");
  if (!order || !returnItems.length) {
    setStatus("No customer-return items are selected for this order.", true);
    return;
  }

  const fields = order.items?.[0]?.fields || {};
  const customerName = fields["Seller Name"] || order.customer || "Customer";
  const addressText = orderAddressText(fields) || order.addressText || "";
  const email = fields["Seller Email"] || order.email || "";
  const phone = fields["Seller Phone"] || order.phone || "";
  const itemDetails = returnPackingItemDetails(order);
  const html = type === "label"
    ? returnLabelPrintHtml({ order, customerName, addressText, email, phone, returnItems, itemDetails })
    : returnPackingPrintHtml({ order, customerName, addressText, email, phone, returnItems, itemDetails });
  const printWindow = window.open("", "_blank", "width=820,height=900");
  if (!printWindow) {
    setStatus("Please allow pop-ups so the return paperwork can open for printing.", true);
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
  setStatus(type === "label" ? "Return label opened for printing." : "Return packing slip opened for printing.");
}

function returnPackingItemDetails(order = selectedOrder()) {
  return orderReturnItems(order).map((record) => {
    const fields = record.fields || {};
    const parsed = parseStaffNotes(fields["Staff Notes"]);
    const accessories = accessoryListFor(fields).map((accessory) => {
      const received = parsed.allAccessories || parsed.accessories?.[accessory.name] !== false;
      return {
        name: accessory.name,
        received,
        deduction: accessory.deduction,
      };
    });
    return {
      recordId: record.id,
      name: gearTitle(fields),
      conditionQuoted: fields.Condition || "",
      conditionVerified: parsed.verifiedCondition || "",
      finalOffer: adjustedCashOfferForRecord(record),
      allAccessories: parsed.allAccessories,
      receivedAccessories: accessories.filter((item) => item.received),
      missingAccessories: accessories.filter((item) => !item.received),
      notes: inspectionReasonForDisplay(fields, parsed),
    };
  });
}

function returnLabelPrintHtml(data) {
  return returnPrintShell("Return address label", `
    <section class="label">
      <p class="eyebrow">Return to customer</p>
      <h1>TO: ${escapeHtml(data.customerName)}</h1>
      <p class="address">${escapeHtml(data.addressText || "Customer address not saved")}</p>
      <p>${escapeHtml(data.email || "")}${data.email && data.phone ? " · " : ""}${escapeHtml(data.phone || "")}</p>
      <p class="quote">Quote ${escapeHtml(data.order.quote || "-")}</p>
    </section>
    <section class="from">
      <strong>FROM: Milford Photo Used Department</strong>
      <span>22 River Street, Milford, CT 06460</span>
    </section>
    <section class="items">
      <h2>Return items</h2>
      <ul>${data.returnItems.map((item) => `<li>${escapeHtml(item.name)}</li>`).join("")}</ul>
    </section>
    <p class="note">Fallback address label only. Use Create return label in the staff dashboard for prepaid postage.</p>
  `);
}

function returnPackingPrintHtml(data) {
  return returnPrintShell("Return packing slip", `
    <header>
      <p class="eyebrow">Milford Photo Used Department</p>
      <h1>Return packing slip</h1>
      <p>Quote ${escapeHtml(data.order.quote || "-")}</p>
    </header>
    <section class="grid">
      <div>
        <h2>Ship to</h2>
        <p><strong>${escapeHtml(data.customerName)}</strong></p>
        <p>${escapeHtml(data.addressText || "Customer address not saved")}</p>
        <p>${escapeHtml(data.email || "")}</p>
        <p>${escapeHtml(data.phone || "")}</p>
      </div>
      <div>
        <h2>Staff checklist</h2>
        <ul>
          <li>Pack only the return items listed below.</li>
          <li>Include this packing slip in the box.</li>
          <li>Attach the Shippo outbound label to the outside of the package.</li>
          <li>After shipment is handled, mark the item return shipped/closed in the dashboard.</li>
        </ul>
      </div>
    </section>
    <section>
      <h2>Items to return</h2>
      <table>
        <thead><tr><th>#</th><th>Item and accessories to pack</th><th>Condition</th></tr></thead>
        <tbody>${data.itemDetails.map((item, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>
              <strong>${escapeHtml(item.name)}</strong>
              ${item.notes ? `<br><small>${escapeHtml(item.notes)}</small>` : ""}
              ${item.receivedAccessories.length ? `
                <div class="return-accessory-heading">Accessories marked received</div>
                <ul class="return-accessory-list">
                  ${item.receivedAccessories.map((accessory) => `
                    <li><span class="return-accessory-box" aria-hidden="true"></span><span>${escapeHtml(accessory.name)}</span></li>
                  `).join("")}
                </ul>
              ` : `<div class="return-accessory-empty">No accessories marked received.</div>`}
            </td>
            <td>${escapeHtml(item.conditionVerified || item.conditionQuoted || "-")}</td>
          </tr>
        `).join("")}</tbody>
      </table>
    </section>
  `);
}

function returnPrintShell(title, body) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      * { box-sizing: border-box; }
      body { margin: 0; padding: 32px; color: #17181c; font-family: Arial, Helvetica, sans-serif; }
      h1, h2, p { margin-top: 0; }
      h1 { font-size: 34px; line-height: 1.05; }
      h2 { font-size: 18px; }
      .eyebrow { color: #d52127; font-size: 13px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
      .label { min-height: 360px; padding: 28px; border: 3px solid #17181c; }
      .address { font-size: 26px; font-weight: 800; line-height: 1.2; white-space: pre-line; }
      .quote { margin-top: 24px; font-size: 18px; font-weight: 800; }
      .from, .items, .note, header, section { margin-top: 24px; }
      .from { display: grid; gap: 4px; padding: 14px; border: 1px solid #d9dde5; }
      .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
      .grid > div { padding: 16px; border: 1px solid #d9dde5; border-radius: 8px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { padding: 12px; border: 1px solid #d9dde5; text-align: left; }
      th { background: #f4f6f8; text-transform: uppercase; font-size: 12px; letter-spacing: .06em; }
      .return-accessory-heading { margin-top: 10px; color: #5f6673; font-weight: 800; }
      .return-accessory-list { display: grid; gap: 6px; margin: 6px 0 0; padding: 0; list-style: none; }
      .return-accessory-list li { display: grid; grid-template-columns: 18px minmax(0, 1fr); gap: 8px; align-items: start; }
      .return-accessory-box { width: 15px; height: 15px; border: 1.5px solid #5f6673; border-radius: 3px; margin-top: 1px; }
      .return-accessory-empty { margin-top: 10px; color: #5f6673; }
      .note { color: #5f6673; font-size: 14px; }
      @media print { body { padding: 20px; } }
    </style>
  </head>
  <body>
    ${body}
    <script>window.addEventListener("load", () => window.setTimeout(() => window.print(), 250));<\/script>
  </body>
</html>`;
}

function mergeUpdatedRecords(updatedRecords = []) {
  if (!updatedRecords.length) return;
  const updatedMap = new Map(updatedRecords.map((record) => [record.id, record]));
  records = records.map((record) => updatedMap.get(record.id) || record);
  orders = buildOrders(records);
  const selected = selectedOrder();
  selectedOrderId = selected?.id || selectedOrderId;
  if (selectedItemId && !selected?.items?.some((item) => item.id === selectedItemId)) {
    selectedItemId = selected?.items?.[0]?.id || null;
  }
}

function recordSnapshot(record) {
  if (!record?.id) return null;
  const source = record.fields || {};
  const fields = {};
  STAFF_HISTORY_RESTORE_FIELDS.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(source, field)) fields[field] = source[field] ?? "";
  });
  return { id: record.id, fields };
}

function orderSnapshots(order = selectedOrder()) {
  return (order?.items || []).map(recordSnapshot).filter(Boolean);
}

function recordSnapshots(record) {
  const snapshot = recordSnapshot(record);
  return snapshot ? [snapshot] : [];
}

function normalizeStaffHistoryEntry(label, beforeSnapshots = [], afterSnapshots = []) {
  const beforeById = new Map(beforeSnapshots.filter(Boolean).map((snapshot) => [snapshot.id, snapshot]));
  const afterById = new Map(afterSnapshots.filter(Boolean).map((snapshot) => [snapshot.id, snapshot]));
  const ids = Array.from(new Set([...beforeById.keys(), ...afterById.keys()]));
  if (!ids.length) return null;

  const before = [];
  const after = [];
  let changed = false;
  ids.forEach((id) => {
    const beforeFields = beforeById.get(id)?.fields || {};
    const afterFields = afterById.get(id)?.fields || {};
    const fieldNames = Array.from(new Set([...Object.keys(beforeFields), ...Object.keys(afterFields)]))
      .filter((field) => STAFF_HISTORY_RESTORE_FIELDS.includes(field));
    if (!fieldNames.length) return;

    const normalizedBefore = {};
    const normalizedAfter = {};
    fieldNames.forEach((field) => {
      normalizedBefore[field] = beforeFields[field] ?? "";
      normalizedAfter[field] = afterFields[field] ?? "";
    });
    if (JSON.stringify(normalizedBefore) !== JSON.stringify(normalizedAfter)) changed = true;
    before.push({ id, fields: normalizedBefore });
    after.push({ id, fields: normalizedAfter });
  });

  if (!changed || !before.length || !after.length) return null;
  return {
    label: label || "staff change",
    quoteRef: selectedOrder()?.quote || "",
    selectedOrderId,
    selectedItemId,
    before,
    after,
  };
}

function pushStaffHistory(label, beforeSnapshots = [], afterSnapshots = []) {
  const entry = normalizeStaffHistoryEntry(label, beforeSnapshots, afterSnapshots);
  if (!entry) return;
  staffUndoStack.push(entry);
  if (staffUndoStack.length > STAFF_HISTORY_LIMIT) staffUndoStack = staffUndoStack.slice(-STAFF_HISTORY_LIMIT);
  staffRedoStack = [];
  updateStaffHistoryButtons();
}

function updateStaffHistoryButtons() {
  if (staffUndoButton) {
    const entry = staffUndoStack[staffUndoStack.length - 1];
    staffUndoButton.disabled = !entry;
    staffUndoButton.title = entry ? `Undo ${entry.label}` : "No queue changes to undo";
  }
  if (staffRedoButton) {
    const entry = staffRedoStack[staffRedoStack.length - 1];
    staffRedoButton.disabled = !entry;
    staffRedoButton.title = entry ? `Redo ${entry.label}` : "No queue changes to redo";
  }
}

function setStaffHistoryBusy(isBusy) {
  if (staffUndoButton) staffUndoButton.disabled = isBusy || !staffUndoStack.length;
  if (staffRedoButton) staffRedoButton.disabled = isBusy || !staffRedoStack.length;
}

async function restoreStaffHistory(direction = "undo") {
  const isRedo = direction === "redo";
  const source = isRedo ? staffRedoStack : staffUndoStack;
  const destination = isRedo ? staffUndoStack : staffRedoStack;
  const entry = source.pop();
  if (!entry) {
    updateStaffHistoryButtons();
    return;
  }

  setStaffHistoryBusy(true);
  setStatus(`${isRedo ? "Redoing" : "Undoing"} ${entry.label}...`);
  try {
    const data = await staffPost("/api/staff/restore-records", {
      records: isRedo ? entry.after : entry.before,
      direction: isRedo ? "redo" : "undo",
      label: entry.label,
      quoteRef: entry.quoteRef,
    }, { staff: true });
    mergeUpdatedRecords(data.records || []);
    if (entry.selectedOrderId && orders.some((order) => order.id === entry.selectedOrderId)) {
      selectedOrderId = entry.selectedOrderId;
    }
    if (entry.selectedItemId && selectedOrder()?.items?.some((item) => item.id === entry.selectedItemId)) {
      selectedItemId = entry.selectedItemId;
    } else {
      syncSelectedItem();
    }
    staffQueueGuideTargetOverride = "";
    destination.push(entry);
    if (destination.length > STAFF_HISTORY_LIMIT) destination.splice(0, destination.length - STAFF_HISTORY_LIMIT);
    renderQueue();
    renderDetail();
    setStatus(`${isRedo ? "Redo" : "Undo"} complete: ${entry.label}.`);
  } catch (error) {
    source.push(entry);
    setStatus(error.message || `Unable to ${isRedo ? "redo" : "undo"} the last queue change.`, true);
  } finally {
    updateStaffHistoryButtons();
  }
}

function bugReportMailto(order = selectedOrder(), record = selectedRecord(order)) {
  const quote = order?.quote || "No order selected";
  const item = record ? shortGearTitle(record.fields || {}) : "No item selected";
  const subject = `Used gear bug report - ${quote}`;
  const body = [
    "Milford Photo staff bug report",
    "",
    `Order: ${quote}`,
    `Customer: ${order?.customer || "No customer selected"}`,
    `Selected item: ${item}`,
    `Current workflow step: ${order?.workflow?.current?.label || order?.statusLabel || "Unknown"}`,
    `Page: ${window.location.href}`,
    "",
    "Please describe:",
    "1. What you were trying to do",
    "2. What happened",
    "3. What you expected to happen",
    "4. Which button or step you clicked",
    "5. Attach a screenshot if possible",
  ].join("\n");
  return `mailto:${BUG_REPORT_EMAIL.trim()}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function updateBugReportLink() {
  if (!staffBugReportLink) return;
  staffBugReportLink.href = bugReportMailto();
}

async function finishItemEvaluation(record, accessories, buttons = []) {
  const review = collectReviewState(accessories);
  if (!review.received && !review.notReceived) {
    setStaffQueueGuideTarget("receive");
    setStatus("Confirm this item was received before finishing the evaluation.", true);
    return;
  }
  if (!staffQueueIncludedItemsVerified(accessories)) {
    setStaffQueueGuideTarget("included");
    setStatus("Confirm all recommended accessories are included, or deselect anything missing.", true);
    return;
  }
  if (!review.verifiedCondition) {
    setStaffQueueGuideTarget("condition");
    setStatus("Select the verified condition, even when it matches the original quote.", true);
    return;
  }

  const orderBeforeUpdate = selectedOrder();
  const nextItemId = nextOrderItemId(orderBeforeUpdate, record.id);
  const finalOffer = numberOrNull(document.getElementById("custom-offer")?.value)
    ?? numberOrNull(document.getElementById("suggested-offer")?.value)
    ?? 0;
  const reviewForNotes = {
    ...review,
    received: !review.notReceived,
  };
  const before = recordSnapshots(record);

  setDetailBusy(buttons, true);
  setStatus(nextItemId ? "Finishing item evaluation and opening the next item..." : "Finishing item evaluation...");
  try {
    const updated = await updateRecord({
      recordId: record.id,
      status: staffActionStatus("adjusted"),
      finalOffer,
      staffNotes: buildStaffNotes(reviewForNotes, "adjusted", finalOffer),
      notifyCustomer: false,
    });
    pushStaffHistory("item evaluation update", before, recordSnapshots(updated));
    records = records.map((item) => (item.id === record.id ? updated : item));
    orders = buildOrders(records);
    selectedOrderId = orderBeforeUpdate?.id || selectedOrderId;
    selectedItemId = orderItemExists(selectedOrder(), nextItemId) ? nextItemId : updated.id;
    staffQueueGuideTargetOverride = nextItemId ? "receive" : "";
    renderQueue();
    renderDetail();
    if (nextItemId && selectedItemId === nextItemId) {
      window.requestAnimationFrame(scrollToStaffItemStart);
      setStatus("Item evaluation complete. Opened the next item in this order.");
      return;
    }
    window.requestAnimationFrame(() => scrollToStaffQueueGuideTarget(staffQueueCurrentGuideTarget()));
    setStatus("Item evaluation complete. Continue to the next highlighted section.");
  } catch (error) {
    setStatus(error.message || "Unable to finish item evaluation.", true);
  } finally {
    setDetailBusy(buttons, false);
  }
}

async function handleStaffAction(record, accessories, action, buttons, options = {}) {
  const review = collectReviewState(accessories);
  const finalOffer = numberOrNull(document.getElementById("custom-offer").value)
    ?? numberOrNull(document.getElementById("suggested-offer")?.value)
    ?? 0;
  const undo = options.undo === true;
  const status = undo ? staffActionUndoStatus(action, record.fields || {}) : staffActionStatus(action);
  if (!status) return;
  const notifyCustomer = options.notifyCustomer === true;
  const notifyOnly = options.notifyOnly === true;
  const step = staffActionStep(action);
  const orderBeforeUpdate = selectedOrder();
  const nextItemId = action === "adjusted" && !undo && !notifyCustomer && !notifyOnly
    ? nextOrderItemId(orderBeforeUpdate, record.id)
    : "";
  const actionForNotes = undo ? `undo_${action}` : action;
  const reviewForNotes = undoReviewState(review, action);
  const returnShipmentNotes = !undo && action === "return"
    ? appendReturnShipmentStaffNotes(record.fields?.["Staff Notes"], returnLabelMetadataForOrder(orderBeforeUpdate))
    : "";

  if (undo && !confirmStaffActionUndo(action)) {
    setStatus("Undo canceled. No item status changed.");
    return;
  }

  const body = {
    recordId: record.id,
    status,
    finalOffer,
    staffNotes: returnShipmentNotes || buildStaffNotes(reviewForNotes, actionForNotes, finalOffer),
    notifyCustomer,
  };
  if (notifyOnly) {
    body.notifyOnly = true;
    body.notificationType = step?.notifyTemplate || "";
  }

  if (action === "payment") {
    body.action = "payment_sent";
    const selectedPaymentMethod = document.getElementById("payment-method")?.value || "";
    if (selectedPaymentMethod) body.paymentMethod = selectedPaymentMethod;
  }
  if (action === "return") {
    body.declineReason = undo ? "" : review.reason || "Customer wants this item returned.";
  }
  if (!undo && review.decision === "not_accepted") {
    body.declineReason = review.reason || "Milford cannot accept this item for resale.";
  }

  if (notifyCustomer && !confirmStaffActionEmail(action)) {
    setStatus("Action canceled. No customer email sent.");
    return;
  }

  const before = recordSnapshots(record);
  setDetailBusy(buttons, true);
  setStatus(notifyOnly ? "Sending customer email..." : undo ? "Undoing item workflow step..." : "Saving item update...");

  try {
    const updated = await updateRecord(body);
    if (!notifyOnly) pushStaffHistory(undo ? `undo ${step?.label || action}` : step?.label || "item workflow update", before, recordSnapshots(updated));
    records = records.map((item) => (item.id === record.id ? updated : item));
    orders = buildOrders(records);
    selectedOrderId = orderBeforeUpdate?.id || selectedOrderId;
    selectedItemId = orderItemExists(selectedOrder(), nextItemId) ? nextItemId : updated.id;
    staffQueueGuideTargetOverride = nextItemId ? "receive" : "";
    renderQueue();
    renderDetail();
    if (nextItemId && selectedItemId === nextItemId) {
      window.requestAnimationFrame(scrollToStaffItemStart);
      setStatus(`Saved: ${status}. Opened the next item in this order.`);
    } else {
      setStatus(notifyOnly ? "Customer email sent." : undo ? `Undone: ${step?.label || "workflow step"}.` : `Saved: ${status}.`);
    }
  } catch (error) {
    setStatus(error.message || (notifyOnly ? "Unable to send customer email." : "Unable to save item update."), true);
  } finally {
    setDetailBusy(buttons, false);
  }
}

function staffActionStatus(action) {
  return staffActionStep(action)?.status || "";
}

function staffActionUndoStatus(action, fields = {}) {
  if (action === "received") {
    const delivery = staffDeliveryFromFields(fields);
    return delivery === "Mail-in shipment" ? "Accepted by Seller" : "Accepted by Seller - Store Dropoff";
  }
  return STAFF_ACTION_UNDO_STATUSES[action] || "";
}

function staffActionStep(action) {
  return STAFF_ACTION_STEPS.find((step) => step.action === action);
}

function undoReviewState(review = {}, action = "") {
  const next = {
    ...review,
    accessories: { ...(review.accessories || {}) },
    reason: cleanUndoReason(review.reason),
  };
  if (action === "received") {
    next.received = false;
    next.notReceived = false;
  }
  if (action === "accepted" || action === "payment" || action === "return") {
    next.decision = "pending";
  }
  return next;
}

function cleanUndoReason(reason = "") {
  const clean = String(reason || "").trim();
  return clean === STALE_STAFF_CREATED_REASON || clean.toLowerCase() === "none" ? "" : clean;
}

function confirmStaffActionUndo(action) {
  const step = staffActionStep(action);
  const label = step?.label || "this workflow step";
  return window.confirm(`Undo "${label}" for this item? This updates the item status only and does not email the customer.`);
}

function nextOrderItemId(order, currentItemId) {
  if (!order?.items?.length) return "";
  const currentIndex = order.items.findIndex((item) => item.id === currentItemId);
  return currentIndex >= 0 ? order.items[currentIndex + 1]?.id || "" : "";
}

function orderItemExists(order, itemId) {
  return Boolean(itemId && order?.items?.some((item) => item.id === itemId));
}

function scrollToStaffItemStart() {
  const target = detailEl.querySelector('[data-staff-queue-guide="items"]')
    || document.querySelector(".staff-intake-header")
    || document.querySelector(".staff-order-progress")
    || detailEl;
  target?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function scrollToStaffIntakeGearStart() {
  const target = document.getElementById("staff-intake-gear-section")
    || document.querySelector(".staff-intake-widget-section")
    || detailEl;
  target?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function confirmStaffActionEmail(action) {
  const step = staffActionStep(action);
  return window.confirm(`${step?.notifyLabel || "Email customer"} will send a customer email only. Staff progress will not change unless you use the internal workflow button. Continue?`);
}

async function handleOrderAction(order, status, options = {}) {
  if (!order) return;
  const before = orderSnapshots(order);
  setStatus("Saving order update...");
  try {
    const sendsFinalQuoteEmail = status === "Final Quote Sent";
    const updatedRecords = [];
    for (let index = 0; index < order.items.length; index += 1) {
      const record = order.items[index];
      updatedRecords.push(await updateRecord({
        recordId: record.id,
        status,
        staffNotes: appendOrderNote(record.fields?.["Staff Notes"], status),
        ...(sendsFinalQuoteEmail ? {
          notifyCustomer: index === 0,
          resendFinalQuote: options.resendFinalQuote === true,
        } : {}),
      }));
    }
    const updatedMap = new Map(updatedRecords.map((record) => [record.id, record]));
    pushStaffHistory(`${status} order update`, before, updatedRecords.map(recordSnapshot).filter(Boolean));
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
  document.body.classList.add("modal-open");
  modal.querySelectorAll("[data-close-order-log]").forEach((button) => {
    button.addEventListener("click", closeOrderLogModal);
  });
  document.addEventListener("keydown", handleOrderLogKeydown);
}

function closeOrderLogModal() {
  document.querySelector(".staff-log-modal")?.remove();
  document.body.classList.remove("modal-open");
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
    detail: `${order.items.length} item${order.items.length === 1 ? "" : "s"} added. Payout: ${payment}. Delivery: ${delivery || "-"}.`,
    meta: `Quote ${order.quote}`,
  }];
}

function customerDecisionLogEntries(order) {
  return [
    customerDecisionSummaryLogEntry(order),
    ...order.items.flatMap((record) => {
      const fields = record.fields || {};
      const decisions = parseCustomerDecisionBlocks(fields["Staff Notes"]);
      return decisions.map((decision) => ({
        timestamp: decision.submitted,
        actorType: "customer",
        actorLabel: "Customer",
        title: decision.decision === "return" ? "Customer requested item return" : "Customer accepted item",
        detail: `${shortGearTitle(fields)} - ${decision.decision === "return" ? "return to customer" : "sell to Milford Photo"}.`,
        meta: paymentPreferenceDisplay(decision.paymentPreference) ? `Payout preference: ${paymentPreferenceDisplay(decision.paymentPreference)}` : "",
      }));
    }),
  ].filter(Boolean);
}

function customerDecisionSummaryLogEntry(order) {
  const summary = orderCustomerPayoutSummary(order);
  if (!summary) return null;
  return {
    timestamp: summary.submitted,
    actorType: "customer",
    actorLabel: "Customer",
    title: "Customer submitted final quote decision",
    detail: summary.logDetail,
    meta: summary.paymentPreference ? `Payout preference: ${summary.paymentPreference}` : "",
  };
}

function staffActionLogEntry(record) {
  const fields = record.fields || {};
  const action = String(fields.Action || fields["New Status"] || "");
  const priorOffer = numberOrNull(fields["Prior Offer"]);
  const newOffer = numberOrNull(fields["New Offer"]);
  const offerMeta = priorOffer !== null && newOffer !== null && priorOffer !== newOffer
    ? `Offer changed from $${formatMoney(priorOffer)} to $${formatMoney(newOffer)}.`
    : "";
  const statusMeta = [fields["Prior Status"], fields["New Status"]].filter(Boolean).join(" -> ");
  return {
    timestamp: fields.Timestamp,
    actorType: action === "customer_final_decision" ? "customer" : "staff",
    actorLabel: action === "customer_final_decision" ? "Customer" : `Staff: ${fields["Staff User"] || "unknown"}`,
    title: staffActionTitle(action),
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
  if (text.includes("customer_final_decision")) return "Customer submitted final quote decision";
  if (text.includes("return_label_created")) return "Staff created outbound label";
  if (text.includes("return_label_dry_run")) return "Outbound label dry run";
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

async function removeOrderItem(order, recordId, itemName, button) {
  if (!order || !recordId) return;
  if (order.items.length <= 1) {
    setStatus("This is the only item in the order. Add another item or close the order instead of removing it.", true);
    return;
  }

  const item = order.items.find((record) => record.id === recordId);
  const fields = item?.fields || {};
  const displayName = itemName || shortGearTitle(fields) || "this item";
  const quoteRef = fields["Quote Reference"] || order.quoteRefs?.[0] || order.quote || "";
  const nextItemId = nextRemainingOrderItemId(order, recordId);
  const confirmed = window.confirm(`Remove ${displayName} from ${quoteRef || "this order"}? This deletes the item from the staff order and does not email the customer.`);
  if (!confirmed) {
    setStatus("Remove item canceled.");
    return;
  }

  button.disabled = true;
  setStatus(`Removing ${displayName}...`);
  try {
    await staffPost("/api/staff/remove-item", {
      recordId,
      quoteRef,
    }, { staff: true });
    await loadRecords({ selectQuoteRef: quoteRef, selectRecordId: nextItemId });
    setStatus(`${displayName} removed from ${quoteRef || "the order"}. No customer email was sent.`);
  } catch (error) {
    button.disabled = false;
    setStatus(error.message || "Unable to remove this item.", true);
  }
}

function nextRemainingOrderItemId(order, removedRecordId) {
  const index = order?.items?.findIndex((item) => item.id === removedRecordId) ?? -1;
  if (index < 0) return order?.items?.find((item) => item.id !== removedRecordId)?.id || "";
  return order.items[index + 1]?.id
    || order.items[index - 1]?.id
    || order.items.find((item) => item.id !== removedRecordId)?.id
    || "";
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
          <small id="pricing-review-flag-count">${pricingReviewFlagCount()} flagged</small>
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
            <option value="highest_cash">Highest offer</option>
            <option value="alphabetical">Alphabetical A-Z</option>
            <option value="newest_model">Newest model year</option>
            <option value="oldest_model">Oldest model year</option>
            <option value="oldest_review">Oldest reviewed</option>
            <option value="flagged">Flagged first</option>
          </select>
        </label>
      </div>
      <div class="pricing-review-table-wrap">
        <table class="pricing-review-table">
          <colgroup>
            <col class="pricing-review-item-col" />
            <col class="pricing-review-category-col" />
            <col class="pricing-review-money-col" />
            <col class="pricing-review-money-col" />
            <col class="pricing-review-basis-col" />
            <col class="pricing-review-reviewed-col" />
            <col class="pricing-review-links-col" />
          </colgroup>
          <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>Offer</th>
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
  document.getElementById("pricing-review-body")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-pricing-flag-key]");
    if (!button) return;
    togglePricingReviewFlag(button.getAttribute("data-pricing-flag-key"));
  });
  document.getElementById("pricing-review-body")?.addEventListener("change", (event) => {
    const select = event.target.closest("[data-pricing-flag-reason-key]");
    if (!select) return;
    setPricingReviewFlagReason(select.getAttribute("data-pricing-flag-reason-key"), select.value);
  });
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
    .filter((row) => pricingReviewMatchesSearch(row, search))
    .sort(pricingReviewSort(sort))
    .slice(0, 250);
  const flagOverrides = pricingReviewFlagOverrides();

  body.innerHTML = filtered.map((row) => `
    <tr class="${pricingReviewIsFlagged(row, flagOverrides) ? "is-flagged" : ""}">
      <td class="pricing-review-item-cell">
        <strong>${escapeHtml(row.brand)} ${escapeHtml(row.model)}</strong>
        <span>${escapeHtml(pricingReviewRowMeta(row))}</span>
        ${pricingReviewFlagControls(row, flagOverrides)}
      </td>
      <td class="pricing-review-category-cell">${escapeHtml(row.category)}</td>
      <td class="pricing-review-money-cell">$${formatMoney(row.cashOffer)}</td>
      <td class="pricing-review-money-cell">${row.targetResalePrice ? `$${formatMoney(row.targetResalePrice)}` : "-"}</td>
      <td class="pricing-review-basis-cell">${escapeHtml(row.pricingBasis || row.source || "-")}</td>
      <td class="pricing-review-reviewed-cell">${escapeHtml(row.priceLastReviewed || "-")}</td>
      <td class="pricing-review-links-cell">
        <div class="pricing-review-links">
          ${pricingReviewReferenceLinks(row).map((link) => `<a href="${escapeAttr(link.href)}" target="_blank" rel="noreferrer">${escapeHtml(link.label)}</a>`).join("")}
        </div>
      </td>
    </tr>
  `).join("") || `<tr><td colspan="7">No matching pricing rows.</td></tr>`;
  updatePricingReviewFlagCount();
}

function pricingReviewFlagButton(row = {}, overrides = pricingReviewFlagOverrides()) {
  const key = pricingReviewRowKey(row);
  const isFlagged = pricingReviewIsFlagged(row, overrides);
  return `
    <button
      class="pricing-review-flag-button${isFlagged ? " is-flagged" : ""}"
      type="button"
      data-pricing-flag-key="${escapeAttr(key)}"
      aria-pressed="${isFlagged ? "true" : "false"}"
    >${isFlagged ? "Flagged" : "Flag"}</button>
  `;
}

function pricingReviewFlagControls(row = {}, overrides = pricingReviewFlagOverrides()) {
  const key = pricingReviewRowKey(row);
  const isFlagged = pricingReviewIsFlagged(row, overrides);
  const reason = pricingReviewFlagReason(row, overrides);
  const systemReason = pricingReviewSystemFlagReason(row);
  const options = PRICING_REVIEW_FLAG_REASONS.map((item) =>
    `<option value="${escapeAttr(item.value)}"${item.value === reason ? " selected" : ""}>${escapeHtml(item.label)}</option>`
  ).join("");
  return `
    <div class="pricing-review-flag-group${isFlagged ? " is-flagged" : ""}">
      ${pricingReviewFlagButton(row, overrides)}
      <label class="pricing-review-flag-controls">
        <select data-pricing-flag-reason-key="${escapeAttr(key)}" aria-label="Pricing flag reason for ${escapeAttr(row.brand)} ${escapeAttr(row.model)}">
          ${options}
        </select>
      </label>
      ${systemReason ? `<small class="pricing-review-system-flag">System: ${escapeHtml(systemReason)}</small>` : ""}
    </div>
  `;
}

function pricingReviewRowMeta(row = {}) {
  const priority = row.priority || "Normal";
  const parts = [`Review priority: ${priority}`];
  if (row.year) parts.push(`Model year: ${row.year}`);
  return parts.join(" | ");
}

function pricingReviewRowKey(row = {}) {
  return [row.brand, row.model, row.category, row.year, row.cashOffer]
    .map((part) => String(part ?? "").trim().toLowerCase())
    .join("|");
}

function pricingReviewFlagOverrides() {
  try {
    return JSON.parse(localStorage.getItem(PRICING_REVIEW_FLAGS_STORAGE_KEY) || "{}") || {};
  } catch {
    return {};
  }
}

function savePricingReviewFlagOverrides(overrides = {}) {
  try {
    localStorage.setItem(PRICING_REVIEW_FLAGS_STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    // Staff can still review rows if local browser storage is unavailable.
  }
}

function pricingReviewBaseFlagged(row = {}) {
  return (row.priority || "Normal") !== "Normal";
}

function pricingReviewIsFlagged(row = {}, overrides = pricingReviewFlagOverrides()) {
  const key = pricingReviewRowKey(row);
  if (Object.prototype.hasOwnProperty.call(overrides, key)) {
    const entry = overrides[key];
    if (entry && typeof entry === "object" && Object.prototype.hasOwnProperty.call(entry, "flagged")) return Boolean(entry.flagged);
    return Boolean(entry);
  }
  return pricingReviewBaseFlagged(row);
}

function pricingReviewFlagReason(row = {}, overrides = pricingReviewFlagOverrides()) {
  const entry = overrides[pricingReviewRowKey(row)];
  return entry && typeof entry === "object" ? String(entry.reason || "") : "";
}

function pricingReviewReasonLabel(value = "") {
  return PRICING_REVIEW_FLAG_REASONS.find((item) => item.value === value)?.label || "";
}

function pricingReviewSystemFlagReason(row = {}) {
  const priority = String(row.priority || "").trim();
  if (priority && priority !== "Normal") return priority;
  if (row.reviewState === "catalog_review_placeholder") return "Catalog review required";
  if (row.reviewState === "no_match") return "Needs price table row";
  if (row.reviewState === "manual_by_design") return "Manual by design";
  return "";
}

function pricingReviewFlagCount() {
  const overrides = pricingReviewFlagOverrides();
  return pricingReviewRows.filter((row) => pricingReviewIsFlagged(row, overrides)).length;
}

function updatePricingReviewFlagCount() {
  const countEl = document.getElementById("pricing-review-flag-count");
  if (countEl) countEl.textContent = `${pricingReviewFlagCount()} flagged`;
}

function togglePricingReviewFlag(key) {
  if (!key) return;
  const row = pricingReviewRows.find((candidate) => pricingReviewRowKey(candidate) === key);
  if (!row) return;
  const overrides = pricingReviewFlagOverrides();
  const nextFlagged = !pricingReviewIsFlagged(row, overrides);
  const currentReason = pricingReviewFlagReason(row, overrides);
  if (nextFlagged === pricingReviewBaseFlagged(row)) {
    if (currentReason) {
      overrides[key] = { flagged: nextFlagged, reason: currentReason };
    } else {
      delete overrides[key];
    }
  } else {
    overrides[key] = { flagged: nextFlagged, reason: currentReason };
  }
  savePricingReviewFlagOverrides(overrides);
  renderPricingReviewRows();
}

function setPricingReviewFlagReason(key, reason) {
  if (!key) return;
  const row = pricingReviewRows.find((candidate) => pricingReviewRowKey(candidate) === key);
  if (!row) return;
  const cleanReason = String(reason || "");
  const overrides = pricingReviewFlagOverrides();
  const flagged = cleanReason ? true : pricingReviewIsFlagged(row, overrides);
  if (flagged === pricingReviewBaseFlagged(row) && !cleanReason) {
    delete overrides[key];
  } else {
    overrides[key] = { flagged, reason: cleanReason };
  }
  savePricingReviewFlagOverrides(overrides);
  renderPricingReviewRows();
  if (cleanReason) {
    submitPricingReviewFlagFeedback(row, cleanReason).catch((error) => {
      console.warn("Pricing review feedback failed:", error);
      setStatus(error.message || "Unable to save pricing feedback.", true);
    });
  }
}

function pricingReviewMatchesSearch(row = {}, search = "") {
  const terms = String(search || "").trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return true;
  const haystack = [
    row.brand,
    row.model,
    row.displayModel,
    row.category,
    row.catalogCategory,
    row.pricingBasis,
    row.source,
    row.priority,
    row.reviewState,
    row.confidence,
    row.year,
    row.notes,
  ].filter(Boolean).join(" ").toLowerCase();
  return terms.every((term) => haystack.includes(term));
}

async function submitPricingReviewFlagFeedback(row = {}, reason = "") {
  const reasonLabel = pricingReviewReasonLabel(reason);
  if (!reasonLabel) return;
  const itemName = `${row.brand || ""} ${row.model || ""}`.trim() || "Unknown item";
  const feedback = [
    `Pricing review flag: ${reasonLabel}`,
    `Item: ${itemName}`,
    `Category: ${row.category || "-"}`,
    `Offer: ${row.cashOffer ? `$${formatMoney(row.cashOffer)}` : "-"}`,
    `Target resale: ${row.targetResalePrice ? `$${formatMoney(row.targetResalePrice)}` : "-"}`,
    `Pricing basis: ${row.pricingBasis || row.source || "-"}`,
    `Reviewed: ${row.priceLastReviewed || "-"}`,
    `Model year: ${row.year || "-"}`,
    `Review state: ${row.reviewState || "-"}`,
  ].join("\n");
  await staffPost("/api/staff/feedback", {
    category: "Pricing review",
    orderId: `pricing:${pricingReviewRowKey(row)}`.slice(0, 160),
    pageUrl: window.location.href,
    feedback,
  }, { staff: true });
  setStatus(`Saved pricing feedback for ${itemName}.`);
}

function pricingReviewReferenceLinks(row = {}) {
  const fields = { "Item Brand": row.brand, "Item Model": row.model };
  const query = staffReferenceQuery(fields);
  return [
    { label: "MPB", href: marketSearchUrl("https://www.mpb.com/en-us/search", query) },
    { label: "eBay sold", href: ebaySoldListingsUrl(fields) },
    { label: "KEH", href: marketSearchUrl("https://www.keh.com/shop/search", query) },
    { label: "B&H", href: marketSearchUrl("https://www.bhphotovideo.com/c/search", `${query} used`) },
  ];
}

function pricingReviewSort(sort) {
  const flagOverrides = pricingReviewFlagOverrides();
  const priorityRank = (row) => pricingReviewIsFlagged(row, flagOverrides) ? 0 : 1;
  if (sort === "oldest_review") return (a, b) => String(a.priceLastReviewed || "0000").localeCompare(String(b.priceLastReviewed || "0000"));
  if (sort === "flagged") return (a, b) => priorityRank(a) - priorityRank(b) || b.cashOffer - a.cashOffer;
  if (sort === "newest_model") return (a, b) => (Number(b.year) || 0) - (Number(a.year) || 0) || `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`);
  if (sort === "oldest_model") return (a, b) => (Number(a.year) || 9999) - (Number(b.year) || 9999) || `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`);
  if (sort === "alphabetical") return (a, b) => `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`);
  if (sort === "brand") return (a, b) => `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`);
  return (a, b) => b.cashOffer - a.cashOffer;
}

function startStaffIntake() {
  const returnOrderId = selectedOrderId || "";
  selectedOrderId = null;
  selectedItemId = null;
  resetStaffIntakePricingRequests();
  staffIntakeState = createStaffIntakeState({ returnOrderId });
  renderQueue();
  renderStaffIntake();
  setStatus("New in-store quote started.");
}

function openStaffIntakeQueue() {
  if (!orders.length) {
    setStatus("Loading intake queue...");
    loadRecords();
    return;
  }
  const preferredOrderId = staffIntakeState.orderId || staffIntakeState.returnOrderId || selectedOrderId;
  resetStaffIntakePricingRequests();
  staffIntakeState = createStaffIntakeState();
  const filtered = visibleOrders();
  selectedOrderId = preferredOrderId && filtered.some((order) => order.id === preferredOrderId)
    ? preferredOrderId
    : filtered[0]?.id || orders[0]?.id || null;
  syncSelectedItem();
  renderQueue();
  renderDetail();
  setStatus(selectedOrderId ? "Showing intake queue." : "No orders in this view.");
}

function startAddOrderItem(order) {
  if (!order) return;
  const record = selectedRecord(order);
  const fields = record?.fields || {};
  const quoteRef = fields["Quote Reference"] || order.quoteRefs?.[0] || order.quote || "";
  if (!quoteRef) {
    setStatus("This order needs a quote reference before an item can be added.", true);
    return;
  }
  resetStaffIntakePricingRequests();
  staffIntakeState = createStaffIntakeState({
    mode: "add_item",
    orderId: order.id,
    quoteRef,
    sourceRecordId: record?.id || "",
    customer: order.customer || "",
  });
  renderQueue();
  renderStaffIntake();
  setStatus(`Adding an item to ${quoteRef}.`);
}

function staffIntakeIsAddingToOrder() {
  return staffIntakeState.mode === "add_item";
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
	          <strong id="staff-intake-header-total">Draft</strong>
	          <small id="staff-intake-header-routing">Add gear to price this quote.</small>
	        </div>
	      </header>

	      <form class="staff-review-form" id="staff-intake-form">
		        <section class="staff-review-section staff-intake-widget-section" id="staff-intake-gear-section">
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

	          <div class="staff-intake-widget-fields">
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

	          ${renderStaffIntakeConditionPicker()}
	        </section>

        <section class="staff-review-section" id="staff-intake-included-section">
	          <div class="staff-section-title">
	            <span>2</span>
	            <div>
	              <h3>Verify included items</h3>
	              <p>Check what arrived. Missing recommended accessories can lower the final offer.</p>
            </div>
          </div>
	          <fieldset class="check-grid" id="staff-intake-included-fieldset">
	            <legend>Included items</legend>
	            <div id="staff-intake-included-items"></div>
	          </fieldset>

		          <label class="field staff-intake-notes-field">
		            <span>Counter notes</span>
		            <textarea id="staff-intake-item-notes" rows="2" placeholder="Mention mount, kit details, shutter count, missing parts, known issues, or accessories."></textarea>
		          </label>

          <div class="form-actions staff-intake-actions">
            <button class="primary-action staff-intake-add-action" type="button" id="staff-intake-add-item">${escapeHtml(heading.button)}</button>
            ${staffIntakeIsAddingToOrder() ? "" : `<button class="secondary-action staff-intake-finalize-action" type="button" id="staff-intake-finalize">Finalize quote</button>`}
          </div>
        </section>

        <section class="staff-review-section">
	          <div class="staff-section-title staff-offer-preview-title">
	            <span>3</span>
	            <div>
	              <h3>Offer preview</h3>
	              <p>${staffIntakeIsAddingToOrder() ? "Review pricing for gear being added to this order." : "Review pricing for the gear in this in-store quote."}</p>
	            </div>
	            <div class="staff-intake-summary-compact">
	              <div class="summary-header">
	              <span>Quote summary</span>
	              <strong id="staff-intake-summary-state">Draft</strong>
	              </div>
		            <div class="summary-price">
		              <span id="staff-intake-total">Add gear</span>
		              <small class="staff-intake-store-credit-line" id="staff-intake-store-credit-line" hidden></small>
		              <small id="staff-intake-routing">Your offer will appear here as you add gear.</small>
		            </div>
	            </div>
	          </div>
	          <section class="summary-panel staff-intake-summary-panel" aria-label="Quote summary">
			            <div class="cart-list staff-intake-cart" id="staff-intake-cart"></div>
		            <dl class="summary-list staff-intake-summary-list">
		              <div>
		                <dt id="staff-intake-summary-label">Routing</dt>
		                <dd id="staff-intake-summary-routing">Awaiting gear</dd>
	              </div>
	            </dl>
	            <div class="status-panel" id="staff-intake-quote-message"></div>
	          </section>
	        </section>

        <section class="staff-review-section" id="staff-intake-customer-section">
	          <div class="staff-section-title">
	            <span>4</span>
	            <div>
	              <h3>${staffIntakeIsAddingToOrder() ? "Existing order" : "Customer details"}</h3>
	              <p>${staffIntakeIsAddingToOrder() ? "The added item will use this order's seller and delivery details." : "Create a 7-day quote without marking gear received. Email it if needed, or open intake when the gear arrives."}</p>
            </div>
          </div>
          ${staffIntakeIsAddingToOrder() ? renderAddItemOrderContext() : renderNewQuoteCustomerFields()}
          <div class="form-actions staff-intake-actions">
            <button class="secondary-action" type="button" id="staff-intake-cancel">${staffIntakeIsAddingToOrder() ? "Back to order" : "Back to queue"}</button>
            ${staffIntakeIsAddingToOrder()
              ? `<button class="primary-action" type="submit" id="staff-intake-submit">Add item to order</button>`
              : `<div class="staff-intake-submit-actions" aria-label="Quote actions">
                  <button class="secondary-action" type="submit" data-staff-intake-submit-mode="create">Create quote</button>
                  <button class="secondary-action" type="submit" data-staff-intake-submit-mode="email">Email Quote</button>
                  <button class="primary-action" type="submit" data-staff-intake-submit-mode="open">Open Intake</button>
                </div>`}
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
  if (staffIntakeIsAddingToOrder()) {
    const quoteRef = staffIntakeState.quoteRef || "this order";
    if (!count) {
      return {
        title: "Add item to order",
        subtitle: `Attach gear that arrived with ${quoteRef} but was not on the original quote.`,
        button: "Add item",
      };
    }
    return {
      title: "Add another item",
      subtitle: `${count} item${count === 1 ? "" : "s"} ready to attach to ${quoteRef}.`,
      button: "Add another item",
    };
  }
  if (!count) {
    return {
      title: "Start a new quote",
      subtitle: "Build a 7-day quote for a counter or phone customer, then open intake when the gear arrives.",
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

	function renderStaffIntakeConditionPicker() {
	  return `
	    <fieldset class="condition-picker staff-intake-condition-picker">
	      <legend>Condition</legend>
      <div class="condition-action-row">
        <button class="condition-picker-toggle" id="staff-intake-condition-toggle" type="button" aria-expanded="false" aria-controls="staff-intake-condition-options">
          <span id="staff-intake-condition-label">Choose condition</span>
          <small id="staff-intake-condition-summary">Select gear first, then choose condition.</small>
        </button>
      </div>
      <div class="condition-options" id="staff-intake-condition-options" hidden>
        ${STAFF_INTAKE_CONDITIONS.map((condition) => `
          <label class="choice-card condition-option-card">
            <input type="radio" name="staff-intake-condition" value="${escapeAttr(condition.value)}" />
            <strong>${escapeHtml(condition.label)}</strong>
            <span>${escapeHtml(condition.copy)}</span>
          </label>
        `).join("")}
      </div>
    </fieldset>
  `;
}

function toggleStaffIntakeConditionOptions(show) {
  const toggle = document.getElementById("staff-intake-condition-toggle");
  const options = document.getElementById("staff-intake-condition-options");
  if (!toggle || !options) return;
  options.hidden = !show;
  toggle.setAttribute("aria-expanded", String(show));
  toggle.classList.toggle("is-open", show);
}

function updateStaffIntakeConditionPicker() {
  const toggle = document.getElementById("staff-intake-condition-toggle");
  const label = document.getElementById("staff-intake-condition-label");
  const summary = document.getElementById("staff-intake-condition-summary");
  if (!toggle || !label || !summary) return;
  const value = document.querySelector('input[name="staff-intake-condition"]:checked')?.value || "";
  const text = conditionLabel(value);
  toggle.classList.toggle("has-condition", Boolean(text));
  label.textContent = text ? `${text} selected` : "Choose condition";
  summary.textContent = text
    ? "Change condition or add this item to the quote."
    : "Select gear first, then choose condition.";
}

function renderNewQuoteCustomerFields() {
  return `
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
        <span>Payout method <small>optional in-store</small></span>
        <select id="staff-intake-payment-preference">
          <option value="">Customer chooses after final quote</option>
          <option value="check">Check</option>
          <option value="store_credit">Store credit</option>
        </select>
      </label>
    </div>
    <fieldset class="delivery-grid staff-intake-delivery-grid">
      <legend>Delivery</legend>
      ${STAFF_INTAKE_DELIVERY_OPTIONS.map((option, index) => `
        <label class="choice-card staff-intake-delivery-option">
          <input type="radio" name="staff-intake-delivery" value="${escapeAttr(option.value)}" ${index === 0 ? "checked" : ""} />
          <strong>${escapeHtml(option.label)}</strong>
          <span>${escapeHtml(option.copy)}</span>
        </label>
      `).join("")}
    </fieldset>
    <div class="staff-intake-address-fields">
      <label class="field">
        <span>Mailing address <small id="staff-intake-address-requirement">optional</small></span>
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
      <p id="staff-intake-address-note">Useful for mailed checks, return shipping, or matching a customer record. Leave blank for quick counter intake.</p>
    </div>
  `;
}

function renderAddItemOrderContext() {
  return `
    <div class="staff-add-item-context">
      <span>Adding to quote</span>
      <strong>${escapeHtml(staffIntakeState.quoteRef || "Existing order")}</strong>
      <small>${escapeHtml(staffIntakeState.customer || "Customer details will be copied from this order.")}</small>
    </div>
  `;
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
  renderStaffIntakeReferencePricing();
  updateStaffIntakeConditionPicker();
  updateStaffIntakeSubmitButtons();
  updateStaffIntakeGuidance();

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
    updateStaffIntakeGuidance();
  });
  brand.addEventListener("change", () => {
    clearStaffIntakeSearch();
    populateStaffIntakeModels();
    updateStaffIntakeMountField();
    updateStaffIntakeManualFields();
    renderStaffIntakeIncludedItems();
    queueStaffIntakeCurrentPreview();
    updateStaffIntakeGuidance();
  });
  model.addEventListener("change", () => {
    clearStaffIntakeSearch();
    updateStaffIntakeMountField();
    updateStaffIntakeManualFields();
    queueStaffIntakeCurrentPreview();
    updateStaffIntakeGuidance();
  });
  lensMount.addEventListener("change", () => {
    queueStaffIntakeCurrentPreview();
    updateStaffIntakeGuidance();
  });
  manualBrand.addEventListener("input", () => {
    queueStaffIntakeCurrentPreview();
    updateStaffIntakeGuidance();
  });
  manualModel.addEventListener("input", () => {
    queueStaffIntakeCurrentPreview();
    updateStaffIntakeGuidance();
  });
  notes.addEventListener("focus", () => setStaffIntakeGuideTarget("add"));
  notes.addEventListener("input", () => {
    queueStaffIntakeCurrentPreview();
    setStaffIntakeGuideTarget("add");
  });
  document.getElementById("staff-intake-condition-toggle")?.addEventListener("click", () => {
    const options = document.getElementById("staff-intake-condition-options");
    toggleStaffIntakeConditionOptions(Boolean(options?.hidden));
  });
  form.querySelectorAll('input[name="staff-intake-condition"]').forEach((input) => {
    input.addEventListener("change", () => {
      updateStaffIntakeConditionPicker();
      toggleStaffIntakeConditionOptions(false);
      queueStaffIntakeCurrentPreview();
      setStaffIntakeGuideTarget("included");
    });
  });
  form.querySelectorAll('input[name="staff-intake-delivery"]').forEach((input) => {
    input.addEventListener("change", () => {
      renderStaffIntakeQuote();
      updateStaffIntakeSubmitButtons();
    });
  });
  updateStaffIntakeDeliveryUi();
  document.getElementById("staff-intake-add-item").addEventListener("click", addStaffIntakeItem);
  document.getElementById("staff-intake-finalize")?.addEventListener("click", finalizeStaffIntakeQuote);
  document.getElementById("staff-intake-cancel").addEventListener("click", () => {
    selectedOrderId = staffIntakeState.orderId || visibleOrders()[0]?.id || orders[0]?.id || null;
    syncSelectedItem();
    renderQueue();
    renderDetail();
    setStatus(staffIntakeIsAddingToOrder() ? "Back to the order." : "Back to the queue.");
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
      (option) => {
        const image = productImageForOption(option);
        return `
        <button class="gear-search-result" type="button" data-gear-search-key="${escapeAttr(gearSearchKey(option))}">
          ${productImageMarkup(image, "gear-search-thumb", option.brand)}
          <span class="gear-search-result-copy">
            <strong>${escapeHtml(option.brand)} ${escapeHtml(catalogDisplayName({ name: option.model }, option.category))}</strong>
            <small>${escapeHtml(option.category)}</small>
          </span>
        </button>
      `;
      },
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

function productImageForOption(option) {
  return productImageFor({
    brand: option.brand,
    category: option.category,
    model: option.model,
  });
}

function productImageForRecord(fields = {}) {
  return productImageFor({
    brand: fields["Item Brand"],
    category: productImageCategoryFromRecord(fields),
    model: fields["Item Model"],
    catalogModel: catalogModelFromRecord(fields),
    imageKey: imageKeyFromRecord(fields),
  });
}

function productImageCategoryFromRecord(fields = {}) {
  const explicit = [
    fields["Item Category"],
    fields["Item Type"],
    fields["Product Type"],
    fields.Type,
    fields.Category,
  ].find((value) => String(value || "").toLowerCase().includes("lens"));
  if (explicit) return explicit;

  const title = `${fields["Item Brand"] || ""} ${fields["Item Model"] || ""}`.toLowerCase();
  if (/\b\d+(?:-\d+)?mm\b/.test(title) || /\bf\/\d/.test(title)) return "Lens";
  return fields.Category;
}

function productImageFor(item = {}) {
  const overrides =
    typeof window !== "undefined" && window.MP_PRODUCT_IMAGE_OVERRIDES ? window.MP_PRODUCT_IMAGE_OVERRIDES : {};
  if (item.imageKey && overrides[item.imageKey]) return overrides[item.imageKey];
  if (item.catalogModel) {
    const catalogKey = productImageKey(item.brand, item.category, item.catalogModel);
    if (overrides[catalogKey]) return overrides[catalogKey];
  }
  const key = productImageKey(item.brand, item.category, item.model);
  if (overrides[key]) return overrides[key];
  return productImageFuzzyMatch(overrides, item.brand, item.category, item.model);
}

function catalogModelFromRecord(fields = {}) {
  return noteValue(fields["Seller Notes"], "Catalog model")
    || noteValue(fields["Staff Notes"], "Catalog model")
    || "";
}

function imageKeyFromRecord(fields = {}) {
  return noteValue(fields["Seller Notes"], "Image key")
    || noteValue(fields["Staff Notes"], "Image key")
    || "";
}

function productImageFuzzyMatch(overrides = {}, brand = "", category = "", model = "") {
  const normalizedBrand = normalizeProductImageText(brand);
  const normalizedCategory = normalizeProductImageCategory(category);
  const normalizedModel = normalizeProductImageText(model);
  if (!normalizedBrand || !normalizedCategory || !normalizedModel) return null;
  const base = [normalizedBrand, normalizedCategory, normalizedModel].join("|");
  const matchKey = Object.keys(overrides)
    .sort()
    .find((key) => key === base || key.startsWith(`${base} (`) || key.startsWith(`${base} -`));
  return matchKey ? overrides[matchKey] : null;
}

function productImageKey(brand = "", category = "", model = "") {
  return [
    normalizeProductImageText(brand),
    normalizeProductImageCategory(category),
    normalizeProductImageText(model),
  ].join("|");
}

function normalizeProductImageCategory(category = "") {
  const text = normalizeProductImageText(category);
  if (text.includes("lens")) return "lens";
  if (text.includes("film")) return "film camera";
  if (text.includes("camera") || text.includes("body")) return "digital camera";
  return text;
}

function normalizeProductImageText(value = "") {
  return String(value)
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function productImageMarkup(image, className, brand = "") {
  if (!image?.src) return productBrandLogoMarkup(className, brand);
  return `<img class="${escapeAttr(className)}" src="${escapeAttr(image.src)}" alt="${escapeAttr(image.alt || "")}" loading="lazy" />`;
}

function productBrandLogoMarkup(className, brand = "") {
  const label = manufacturerLogoLabel(brand);
  if (!label) return `<span class="${escapeAttr(className)} is-placeholder" aria-hidden="true"></span>`;

  return `
    <span class="${escapeAttr(className)} is-brand-logo brand-logo-${escapeAttr(brandSlug(label))}" aria-label="${escapeAttr(label)} logo" role="img">
      <span>${escapeHtml(label)}</span>
    </span>
  `;
}

function manufacturerLogoLabel(brand = "") {
  const normalized = normalizeProductImageText(brand);
  return MANUFACTURER_LOGO_LABELS[normalized] || String(brand || "").trim();
}

function brandSlug(brand = "") {
  return normalizeProductImageText(brand).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "manufacturer";
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
  setStaffIntakeGuideTarget("condition");
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
    updateStaffIntakeGuidance();
    return;
  }
  container.innerHTML = `
    <div class="staff-accessory-grid staff-intake-included-list">
      ${items.map((item) => `
        <label class="staff-accessory-item">
          <input type="checkbox" data-staff-intake-included="${escapeAttr(item.name)}" data-staff-intake-adjustment="${escapeAttr(item.value)}" ${item.checked ? "checked" : ""} />
          <span>${escapeHtml(item.name)}</span>
          <strong data-staff-intake-impact>${escapeHtml(staffIntakeAccessoryImpactText(item.value, item.checked))}</strong>
        </label>
      `).join("")}
    </div>
    <label class="staff-check-row staff-intake-all-accessories">
      <input type="checkbox" id="staff-intake-all-included-check" />
      <strong>All recommended accessories included</strong>
    </label>
  `;
  const includedInputs = Array.from(container.querySelectorAll("[data-staff-intake-included]"));
  const allIncluded = container.querySelector("#staff-intake-all-included-check");
  const syncAllIncluded = () => {
    if (!allIncluded) return;
    const checkedCount = includedInputs.filter((input) => input.checked).length;
    allIncluded.checked = checkedCount === includedInputs.length;
    allIncluded.indeterminate = checkedCount > 0 && checkedCount < includedInputs.length;
  };
  includedInputs.forEach((input) => input.addEventListener("change", () => {
    const impact = input.closest(".staff-accessory-item")?.querySelector("[data-staff-intake-impact]");
    if (impact) impact.textContent = staffIntakeAccessoryImpactText(input.dataset.staffIntakeAdjustment, input.checked);
    syncAllIncluded();
    queueStaffIntakeCurrentPreview();
    setStaffIntakeGuideTarget("add");
  }));
  if (allIncluded) {
    allIncluded.addEventListener("change", () => {
      includedInputs.forEach((input) => {
        input.checked = allIncluded.checked;
        const impact = input.closest(".staff-accessory-item")?.querySelector("[data-staff-intake-impact]");
        if (impact) impact.textContent = staffIntakeAccessoryImpactText(input.dataset.staffIntakeAdjustment, input.checked);
      });
      syncAllIncluded();
      queueStaffIntakeCurrentPreview();
      setStaffIntakeGuideTarget("add");
    });
  }
  allIncluded?.addEventListener("focus", () => setStaffIntakeGuideTarget("add"));
  includedInputs.forEach((input) => input.addEventListener("focus", () => setStaffIntakeGuideTarget("add")));
  updateStaffIntakeGuidance();
}

function staffIntakeAccessoryImpactText(value, checked) {
  const amount = Number(value) || 0;
  if (!amount) return checked ? "Included" : "No price change";
  return `-$${formatMoney(amount)}`;
}

function setStaffIntakeGuideTarget(target) {
  staffIntakeState.guideTarget = target || "gear";
  updateStaffIntakeGuidance();
}

function updateStaffIntakeGuidance() {
  document.querySelectorAll(".staff-intake-guide-active").forEach((element) => {
    element.classList.remove("staff-intake-guide-active");
  });

  const target = staffIntakeCurrentGuideTarget();
  const targetSelector = {
    gear: "#staff-intake-gear-section",
    condition: ".staff-intake-condition-picker",
    included: "#staff-intake-included-section",
    add: "#staff-intake-add-item",
    customer: "#staff-intake-customer-section",
  }[target];
  const element = targetSelector ? document.querySelector(targetSelector) : null;
  element?.classList.add("staff-intake-guide-active");
}

function staffIntakeCurrentGuideTarget() {
  if (!document.getElementById("staff-intake-form")) return "";
  if (staffIntakeState.guideTarget === "customer") return "customer";
  if (!staffIntakeGearSelectionComplete()) return "gear";
  if (!document.querySelector('input[name="staff-intake-condition"]:checked')) return "condition";
  if (staffIntakeState.guideTarget === "add") return "add";
  return "included";
}

function staffIntakeGearSelectionComplete() {
  const category = document.getElementById("staff-intake-category")?.value || "";
  const selectedBrand = document.getElementById("staff-intake-brand")?.value || "";
  const selectedModel = document.getElementById("staff-intake-model")?.value || "";
  const manualBrand = document.getElementById("staff-intake-manual-brand")?.value.trim() || "";
  const manualModel = document.getElementById("staff-intake-manual-model")?.value.trim() || "";
  const validMounts = staffIntakeMountOptions();
  const mountRequired = validMounts.length > 1;
  const mount = document.getElementById("staff-intake-lens-mount")?.value.trim() || "";
  if (!category || !selectedBrand || !selectedModel) return false;
  if (selectedBrand === MANUAL_BRAND && !manualBrand) return false;
  if (selectedModel === MANUAL_MODEL && !manualModel) return false;
  if (mountRequired && (!mount || !validMounts.includes(mount))) return false;
  return true;
}

function finalizeStaffIntakeQuote() {
  if (!staffIntakeState.cart.length) {
    setStatus("Add at least one item before finalizing the quote.", true);
    setStaffIntakeGuideTarget("gear");
    scrollToStaffIntakeGearStart();
    return;
  }
  setStaffIntakeGuideTarget("customer");
  document.getElementById("staff-intake-customer-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  document.getElementById("staff-intake-seller-name")?.focus({ preventScroll: true });
  setStatus("Add the customer details, then create, email, or open the quote.");
}

async function addStaffIntakeItem() {
  const item = readStaffIntakeItem();
  if (!item) return;
  const button = document.getElementById("staff-intake-add-item");
  button.disabled = true;
  staffIntakeState.cart.push(item);
  setStaffIntakeGuideTarget("gear");
  clearStaffIntakeItemForm();
  resetStaffIntakeCurrentPreview();
  renderStaffIntakeCurrentPreview();
  renderStaffIntakeQuote();
  window.requestAnimationFrame(scrollToStaffIntakeGearStart);
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
  const condition = document.querySelector('input[name="staff-intake-condition"]:checked')?.value || "";
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
    setStaffIntakeGuideTarget("gear");
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

  if (!condition) {
    setStaffIntakeGuideTarget("condition");
    if (!options.silent) {
      setStatus("Choose a condition before adding this item.", true);
      toggleStaffIntakeConditionOptions(true);
      document.getElementById("staff-intake-condition-toggle")?.focus({ preventScroll: true });
      document.getElementById("staff-intake-condition-toggle")?.scrollIntoView({ behavior: "smooth", block: "center" });
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

function staffIntakeCreatedQuoteMatches(signature = quoteItemsSignature(staffIntakeCartItems())) {
  return Boolean(staffIntakeState.createdQuoteRef && staffIntakeState.createdQuoteSignature === signature);
}

function rememberStaffIntakeCreatedQuote(result = {}, signature = "") {
  if (!result.quoteRef) return;
  staffIntakeState.createdQuoteRef = result.quoteRef;
  staffIntakeState.createdQuoteSignature = signature;
  staffIntakeState.createdRecords = result.records || staffIntakeState.createdRecords || [];
  staffIntakeState.quoteEmailQueued = Boolean(staffIntakeState.quoteEmailQueued || result.customerEmailQueued);
  updateStaffIntakeSubmitButtons();
}

function updateStaffIntakeSubmitButtons() {
  if (staffIntakeIsAddingToOrder()) return;
  const buttons = {
    create: document.querySelector('[data-staff-intake-submit-mode="create"]'),
    email: document.querySelector('[data-staff-intake-submit-mode="email"]'),
    open: document.querySelector('[data-staff-intake-submit-mode="open"]'),
  };
  if (!buttons.create && !buttons.email && !buttons.open) return;
  const saved = staffIntakeCreatedQuoteMatches();
  if (buttons.create) {
    buttons.create.disabled = saved;
    buttons.create.textContent = saved ? "Quote created" : "Create quote";
  }
  if (buttons.email) {
    buttons.email.textContent = saved && staffIntakeState.quoteEmailQueued ? "Email Quote again" : "Email Quote";
  }
  if (buttons.open) {
    buttons.open.textContent = "Open Intake";
  }
}

function staffIntakeDeliveryMethod() {
  return document.querySelector('input[name="staff-intake-delivery"]:checked')?.value || "dropoff";
}

function staffIntakeAddressValue() {
  return {
    street: document.getElementById("staff-intake-seller-street")?.value.trim() || "",
    city: document.getElementById("staff-intake-seller-city")?.value.trim() || "",
    state: document.getElementById("staff-intake-seller-state")?.value.trim().toUpperCase() || "",
    zip: document.getElementById("staff-intake-seller-zip")?.value.trim() || "",
  };
}

function staffIntakeAddressComplete(address = staffIntakeAddressValue()) {
  return Boolean(address.street && address.city && address.state && address.zip);
}

function staffIntakeNeedsAddressForInboundLabel() {
  return staffIntakeDeliveryMethod() === "ship" && Boolean(staffIntakeState.cartQuote?.routing?.freeLabelEligible);
}

function updateStaffIntakeDeliveryUi() {
  if (staffIntakeIsAddingToOrder()) return;
  const addressPanel = document.querySelector(".staff-intake-address-fields");
  const requirement = document.getElementById("staff-intake-address-requirement");
  const note = document.getElementById("staff-intake-address-note");
  const needsInboundAddress = staffIntakeNeedsAddressForInboundLabel();
  const isShipLater = staffIntakeDeliveryMethod() === "ship";
  ["staff-intake-seller-street", "staff-intake-seller-city", "staff-intake-seller-state", "staff-intake-seller-zip"].forEach((id) => {
    const input = document.getElementById(id);
    if (input) input.required = needsInboundAddress;
  });
  addressPanel?.classList.toggle("is-required", needsInboundAddress);
  if (requirement) {
    requirement.textContent = needsInboundAddress ? "required for inbound label" : "optional";
  }
  if (note) {
    note.textContent = needsInboundAddress
      ? "This mail-in quote is eligible for a prepaid customer-to-Milford label. Enter the full shipping address before creating or emailing it."
      : isShipLater
        ? "Recommended for mail-in quotes, return shipping, and customer matching. If the quote qualifies for a prepaid label, the full address will be required."
        : "Useful for mailed checks, return shipping, or matching a customer record. Leave blank for quick counter intake.";
  }
}

function staffIntakeDeliveryRoutingLabel(quote = {}) {
  if (staffIntakeIsAddingToOrder()) return "Routing";
  if (staffIntakeDeliveryMethod() === "dropoff") return "Delivery";
  return quote.routing?.freeLabelEligible ? "Shipping" : "Routing";
}

function staffIntakeDeliveryRoutingCopy(quote = {}) {
  if (staffIntakeIsAddingToOrder()) return quote.routing?.message || "Ready to quote";
  if (staffIntakeDeliveryMethod() === "dropoff") {
    return "Counter / in-store dropoff. No customer-to-Milford inbound label is needed.";
  }
  return quote.routing?.message || "Ready to quote";
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
  renderStaffIntakeReferencePricing();
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
    setStatus(staffIntakeIsAddingToOrder() ? "Add at least one item before adding it to the order." : "Add at least one item to the quote before creating it.", true);
    return;
  }
  const signature = quoteItemsSignature(items);
  const submitMode = staffIntakeIsAddingToOrder()
    ? "add"
    : event.submitter?.dataset?.staffIntakeSubmitMode || "open";
  const submitButton = event.submitter || document.getElementById("staff-intake-submit");
  const submitButtons = Array.from(document.querySelectorAll("#staff-intake-submit, [data-staff-intake-submit-mode]"));
  const submitButtonLabels = new Map(submitButtons.map((button) => [button, button.textContent]));

  submitButtons.forEach((button) => {
    button.disabled = true;
  });
  if (submitButton) {
    submitButton.textContent = staffIntakeSubmitWorkingLabel(submitMode);
  }
  setStatus(staffIntakeSubmitStatus(submitMode, "start"));

  try {
    if (staffIntakeIsAddingToOrder()) {
      const result = await staffPost("/api/staff/add-item", {
        quoteRef: staffIntakeState.quoteRef,
        sourceRecordId: staffIntakeState.sourceRecordId,
        items: items.map(quoteItemPayload),
      }, { staff: true });
      const firstRecordId = result.records?.[0]?.id || "";
      await loadRecords({ selectQuoteRef: result.quoteRef || staffIntakeState.quoteRef, selectRecordId: firstRecordId });
      setStatus(`${items.length} item${items.length === 1 ? "" : "s"} added to ${result.quoteRef || staffIntakeState.quoteRef}.`);
      return;
    }

    const sellerName = document.getElementById("staff-intake-seller-name").value.trim();
    const sellerEmail = document.getElementById("staff-intake-seller-email").value.trim();
    const sellerPhone = document.getElementById("staff-intake-seller-phone").value.trim();
    const delivery = staffIntakeDeliveryMethod();
    const address = staffIntakeAddressValue();

    if (!sellerName || !sellerEmail) {
      setStatus("Customer name and email are required before creating the quote.", true);
      return;
    }

    let quote = staffIntakeState.cartQuote;
    if (!quote?.quoteToken || staffIntakeState.cartQuoteSignature !== signature) {
      quote = await priceStaffIntakeCart({ announce: false, throwOnError: true });
    }
    if (!quote?.quoteToken) {
      throw new Error("Unable to price this in-store quote.");
    }

    if (delivery === "ship" && quote.routing?.freeLabelEligible && !staffIntakeAddressComplete(address)) {
      setStatus("Complete the customer shipping address before creating a prepaid inbound label.", true);
      document.getElementById("staff-intake-seller-street")?.focus({ preventScroll: true });
      document.querySelector(".staff-intake-address-fields")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const savedQuoteMatches = staffIntakeCreatedQuoteMatches(signature);
    if (savedQuoteMatches && submitMode === "create") {
      setStatus(`Quote ${staffIntakeState.createdQuoteRef} is already created.`);
      return;
    }
    if (savedQuoteMatches && submitMode === "email") {
      await staffPost("/api/staff/email-quote", {
        quoteRef: staffIntakeState.createdQuoteRef,
        to: sellerEmail,
      }, { staff: true });
      staffIntakeState.quoteEmailQueued = true;
      updateStaffIntakeSubmitButtons();
      setStatus(`Quote ${staffIntakeState.createdQuoteRef} customer quote email queued.`);
      return;
    }
    if (savedQuoteMatches && submitMode === "open") {
      await loadRecords({ selectQuoteRef: staffIntakeState.createdQuoteRef });
      setStatus(`Quote ${staffIntakeState.createdQuoteRef} opened in intake.`);
      return;
    }

    const submitPayload = {
      quoteToken: quote.quoteToken,
      source: "staff_dashboard",
      seller: {
        name: sellerName,
        email: sellerEmail,
        phone: sellerPhone,
        address,
      },
      delivery,
      paymentPreference: document.getElementById("staff-intake-payment-preference").value,
      emailCustomer: submitMode === "email",
    };
    const result = await staffPost("/api/submit", submitPayload, { staff: true });
    rememberStaffIntakeCreatedQuote(result, signature);

    if (submitMode === "open") {
      await loadRecords({ selectQuoteRef: result.quoteRef });
      setStatus(staffIntakeSubmitStatus(submitMode, "success", result.quoteRef));
      return;
    }
    setStatus(staffIntakeSubmitStatus(submitMode, "success", result.quoteRef));
  } catch (error) {
    setStatus(error.message || (staffIntakeIsAddingToOrder() ? "Unable to add item to this order." : "Unable to create the in-store quote."), true);
  } finally {
    submitButtons.forEach((button) => {
      button.disabled = false;
      button.textContent = submitButtonLabels.get(button) || button.textContent;
    });
    updateStaffIntakeSubmitButtons();
  }
}

function staffIntakeSubmitWorkingLabel(mode) {
  if (mode === "add") return "Adding...";
  if (mode === "email") return "Emailing...";
  if (mode === "open") return "Opening...";
  return "Creating...";
}

function staffIntakeSubmitStatus(mode, state, quoteRef = "") {
  if (mode === "add") return state === "success" ? "Item added to order." : "Adding item to order...";
  if (mode === "email") {
    return state === "success"
      ? `Quote ${quoteRef} created and customer quote email queued.`
      : "Creating quote and queueing customer email...";
  }
  if (mode === "open") {
    return state === "success"
      ? `Quote ${quoteRef} created and opened. No customer email was sent.`
      : "Creating quote and opening intake...";
  }
  return state === "success"
    ? `Quote ${quoteRef} created. No customer email was sent.`
    : "Creating quote...";
}

function renderStaffIntakeCart() {
  const cart = document.getElementById("staff-intake-cart");
  if (!cart) return;
  if (!staffIntakeState.cart.length) {
    cart.innerHTML = `<div class="cart-item"><span class="cart-meta">Add gear to build the quote summary.</span></div>`;
    return;
  }
  cart.innerHTML = staffIntakeState.cart.map((item) => `
    <article class="cart-item staff-intake-cart-item">
      ${staffIntakeItemImageMarkup(item, "product-thumb staff-intake-cart-image")}
      <div class="cart-body">
        <div class="cart-title">
          <strong>${escapeHtml(item.brand)} ${escapeHtml(item.model)}</strong>
          <div class="cart-actions">
            <span class="cart-price">Pending</span>
            <button class="remove-item" type="button" aria-label="Remove item" data-staff-intake-remove="${escapeAttr(item.id)}">x</button>
          </div>
        </div>
        <span class="cart-meta">${escapeHtml(item.category)} - ${escapeHtml(conditionLabel(item.condition))}${item.mount ? ` - ${escapeHtml(item.mount)}` : ""}</span>
      </div>
    </article>
  `).join("");
  wireStaffIntakeRemoveButtons(cart);
}

function renderStaffIntakeCurrentPreview() {
  const container = document.getElementById("staff-intake-current-price");
  const headerTotal = document.getElementById("staff-intake-header-total");
  const headerRouting = document.getElementById("staff-intake-header-routing");
  const setHeader = (totalCopy, routingCopy) => {
    if (headerTotal) headerTotal.textContent = totalCopy;
    if (headerRouting) headerRouting.textContent = routingCopy;
  };

  if (staffIntakeState.cart.length) return;

  const item = readStaffIntakeItem({ silent: true });
  if (!item) {
    setHeader("Draft", "Add gear to price this quote.");
    if (!container) return;
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
    setHeader("Pricing", "Checking the current item.");
    if (!container) return;
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
    setHeader("Review", staffIntakeState.currentQuoteError);
    if (!container) return;
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
    setHeader("Price pending", `${item.brand} ${item.model}`);
    if (!container) return;
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

  setHeader(
    priceLabelForStaffQuoteItem(quotedItem),
    quotedItem.storeCreditAmount ? `${money.format(quotedItem.storeCreditAmount)} store credit` : quotedItem.message || `${item.brand} ${item.model}`,
  );
  if (!container) return;
  container.innerHTML = `
    <div class="staff-intake-preview-heading">
      <span>Item offer</span>
      <small>Not added to quote yet</small>
    </div>
    ${renderStaffIntakeQuoteItem(quotedItem, null, { preview: true })}
  `;
}

function renderStaffIntakeReferencePricing() {
  const container = document.getElementById("staff-intake-reference-pricing");
  if (!container) return;
  const item = readStaffIntakeItem({ silent: true });
  if (!item) {
    container.innerHTML = `
      <div class="staff-reference-panel staff-intake-reference-panel is-empty">
        <div>
          <strong>Reference pricing</strong>
          <span>Select gear to compare used-market listings before adding this item.</span>
        </div>
      </div>
    `;
    return;
  }
  container.innerHTML = renderStaffReferencePricing(staffIntakeFieldsForReference(item));
}

function staffIntakeFieldsForReference(item = {}) {
  return {
    "Item Brand": item.brand,
    "Item Model": item.model,
  };
}

function renderStaffIntakeQuote() {
  updateStaffIntakeHeading();
  updateStaffIntakeDeliveryUi();
  const quote = staffIntakeState.cartQuote;
  const headerTotal = document.getElementById("staff-intake-header-total");
  const headerRouting = document.getElementById("staff-intake-header-routing");
  const total = document.getElementById("staff-intake-total");
	  const routing = document.getElementById("staff-intake-routing");
	  const storeCreditLine = document.getElementById("staff-intake-store-credit-line");
	  const list = document.getElementById("staff-intake-cart");
	  const message = document.getElementById("staff-intake-quote-message");
	  const state = document.getElementById("staff-intake-summary-state");
	  const creditCard = document.getElementById("staff-intake-credit-card");
  const creditFeature = document.getElementById("staff-intake-credit-feature");
  const summaryCredit = document.getElementById("staff-intake-summary-credit");
  const summaryRouting = document.getElementById("staff-intake-summary-routing");
  const summaryLabel = document.getElementById("staff-intake-summary-label");
  if (!total || !routing || !list || !message) return;
  updateStaffIntakeSubmitButtons();

  const setHeader = (totalCopy, routingCopy) => {
    if (headerTotal) headerTotal.textContent = totalCopy;
    if (headerRouting) headerRouting.textContent = routingCopy;
  };
  const setSummary = ({
    stateCopy = "Draft",
    cashCopy = "Add gear",
    subtitle = "Your offer will appear here as you add gear.",
    creditCopy = "-",
    showCreditCard = false,
    routeLabel = "Routing",
    routeCopy = "Awaiting gear",
    messageCopy = "",
    messageClass = "",
  } = {}) => {
	    if (state) state.textContent = stateCopy;
	    total.textContent = cashCopy;
	    routing.textContent = subtitle;
	    if (storeCreditLine) {
	      const hasStoreCredit = Boolean(creditCopy && creditCopy !== "-");
	      storeCreditLine.textContent = hasStoreCredit ? `${creditCopy} store credit` : "";
	      storeCreditLine.hidden = !hasStoreCredit;
	    }
	    if (summaryCredit) summaryCredit.textContent = creditCopy;
	    if (summaryRouting) summaryRouting.textContent = routeCopy;
	    if (summaryLabel) summaryLabel.textContent = routeLabel;
	    if (creditFeature) creditFeature.textContent = creditCopy;
	    if (creditCard) creditCard.hidden = true;
    message.textContent = messageCopy;
    message.className = `status-panel${messageCopy ? " is-visible" : ""}${messageClass ? ` ${messageClass}` : ""}`;
  };

  if (!staffIntakeState.cart.length) {
    setHeader("Draft", "Add gear to price this quote.");
    setSummary();
    renderStaffIntakeCart();
    return;
  }

  if (staffIntakeState.cartQuoteLoading) {
    setHeader("Pricing", "Calculating added items.");
    setSummary({
      stateCopy: "Draft",
      cashCopy: "Pricing...",
      subtitle: "Pricing added items.",
      routeCopy: "Updating quote",
    });
    renderStaffIntakeCart();
    return;
  }

  if (!quote) {
    const countCopy = `${staffIntakeState.cart.length} item${staffIntakeState.cart.length === 1 ? "" : "s"}`;
    setHeader(countCopy, staffIntakeState.cartQuoteError || "Pricing updates when items are added.");
    setSummary({
      cashCopy: countCopy,
      subtitle: staffIntakeState.cartQuoteError || "Pricing will update automatically.",
      routeCopy: staffIntakeState.cartQuoteError || "Ready to quote",
      messageCopy: staffIntakeState.cartQuoteError,
      messageClass: staffIntakeState.cartQuoteError ? "is-error" : "",
    });
    renderStaffIntakeCart();
    return;
  }

  const declinedOnly = Boolean(quote.routing?.declinedOnly);
  const cashCopy = declinedOnly ? "Declined" : quote.totals.cash ? money.format(quote.totals.cash) : "Review";
  const creditCopy = quote.totals.storeCredit ? money.format(quote.totals.storeCredit) : "-";
  const deliveryRouteCopy = staffIntakeDeliveryRoutingCopy(quote);
	  const subtitle = declinedOnly
	    ? "Not eligible for an in-store offer"
	    : quote.expiresAt
	      ? `Offer valid through ${formatDate(quote.expiresAt)}`
	      : "Offer updates with each added item.";
  setHeader(cashCopy, quote.totals.storeCredit ? `${creditCopy} store credit` : quote.routing.message);
  setSummary({
    stateCopy: "Draft",
    cashCopy,
    subtitle,
    creditCopy,
    showCreditCard: Boolean(quote.totals.storeCredit),
    routeLabel: staffIntakeDeliveryRoutingLabel(quote),
    routeCopy: deliveryRouteCopy,
  });
  const sourceItems = staffIntakeCartItems();
  list.innerHTML = quote.items.map((item, index) => renderStaffIntakeQuoteItem(item, sourceItems[index])).join("");
  wireStaffIntakeRemoveButtons(list);
}

function priceLabelForStaffQuoteItem(quoteItem) {
  if (!quoteItem) return "Pending";
  if (quoteItem.offerAmount) return money.format(quoteItem.offerAmount);
  if (quoteItem.status === "declined") return "$0";
  return "Review";
}

function renderStaffIntakeQuoteItem(item, sourceItem, options = {}) {
  const price = priceLabelForStaffQuoteItem(item);
  const credit = item.storeCreditAmount ? `${money.format(item.storeCreditAmount)} store credit` : "";
  const followUpNote = !credit ? item.message || "Staff follow-up needed" : "";
  const canRemove = sourceItem?.id && staffIntakeState.cart.some((cartItem) => cartItem.id === sourceItem.id);
  const imageSource = sourceItem || item;
  const referenceItem = sourceItem || item;
  return `
    <article class="quote-item staff-intake-quote-item${options.preview ? " staff-intake-preview-item" : ""}${followUpNote ? " has-follow-up-note" : ""}">
      ${staffIntakeItemImageMarkup(imageSource, "product-thumb staff-intake-quote-image")}
      <div class="quote-body">
        <div class="quote-title">
          <strong>${escapeHtml(item.brand)} ${escapeHtml(item.model)}</strong>
        </div>
        <div class="quote-meta">${escapeHtml(conditionLabel(item.condition))} &middot; ${escapeHtml(item.category)}</div>
      </div>
      ${renderStaffIntakeReferenceDropdown(referenceItem)}
      <div class="quote-price staff-intake-quote-price">
        <strong>${escapeHtml(price)}</strong>
        ${credit ? `<span>${escapeHtml(credit)}</span>` : ""}
        ${canRemove ? `<button class="remove-item staff-intake-quote-remove" type="button" aria-label="Remove item" data-staff-intake-remove="${escapeAttr(sourceItem.id)}">x</button>` : ""}
      </div>
      ${followUpNote ? `<p class="staff-intake-quote-note">${escapeHtml(followUpNote)}</p>` : ""}
    </article>
  `;
}

function renderStaffIntakeReferenceDropdown(item = {}) {
  return `
    <details class="staff-intake-reference-details">
      <summary class="status-pill staff-intake-reference-pill">Reference pricing</summary>
      <div class="staff-intake-reference-menu">
        ${renderStaffReferencePricing(staffIntakeFieldsForReference(item))}
      </div>
    </details>
  `;
}

function staffIntakeItemImageMarkup(item = {}, className = "product-thumb") {
  const image = productImageForOption({
    brand: item.brand,
    category: item.category,
    model: item.model,
  });
  return productImageMarkup(image, className, item.brand);
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
  document.querySelectorAll('input[name="staff-intake-condition"]').forEach((input) => {
    input.checked = false;
  });
  updateStaffIntakeConditionPicker();
  toggleStaffIntakeConditionOptions(false);
  updateStaffIntakeManualFields();
  updateStaffIntakeMountField();
  renderStaffIntakeIncludedItems();
  renderStaffIntakeReferencePricing();
  setStaffIntakeGuideTarget("gear");
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
  const verifiedCondition = document.querySelector("input[name='verified-condition']:checked")?.value || "";
  const accessoryState = {};
  document.querySelectorAll("[data-accessory]").forEach((input) => {
    accessoryState[input.dataset.accessory] = Boolean(input.checked);
  });
  accessories.forEach((item) => {
    if (!(item.name in accessoryState)) accessoryState[item.name] = true;
  });

  const notReceived = Boolean(document.getElementById("not-received-check")?.checked);

  return {
    received: !notReceived && Boolean(document.getElementById("received-check")?.checked),
    notReceived,
    allAccessories: Boolean(document.getElementById("all-accessories-check")?.checked),
    verifiedCondition,
    accessories: accessoryState,
    decision: document.querySelector("input[name='item-decision']:checked")?.value || "pending",
    reason: document.getElementById("inspection-notes")?.value.trim() || "",
  };
}

function calculateOffer(fields, review, accessories, fallbackOffer) {
  if (review.decision === "not_accepted") return 0;
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

function syncAutoInspectionNotes(fields = {}, accessories = [], review = collectReviewState(accessories)) {
  const notesInput = document.getElementById("inspection-notes");
  if (!notesInput || document.activeElement === notesInput) return;

  const generated = autoInspectionReason(fields, review, accessories);
  const previousGenerated = notesInput.dataset.autoInspectionReason || "";
  const current = notesInput.value.trim();

  if (!generated) {
    if (previousGenerated && current.includes(previousGenerated)) {
      notesInput.value = removeGeneratedInspectionReason(current, previousGenerated);
    }
    notesInput.dataset.autoInspectionReason = "";
    return;
  }

  const legacyGenerated = legacyAutoInspectionReason(fields, review, accessories);

  if (!current || current === previousGenerated || current === legacyGenerated) {
    notesInput.value = generated;
  } else if (previousGenerated && current.includes(previousGenerated)) {
    notesInput.value = current.replace(previousGenerated, generated).trim();
  } else if (legacyGenerated && current.includes(legacyGenerated)) {
    notesInput.value = current.replace(legacyGenerated, generated).trim();
  } else if (current !== generated && !current.includes(generated)) {
    notesInput.value = `${generated}\n${current}`;
  }

  notesInput.dataset.autoInspectionReason = generated;
}

function autoInspectionReason(fields = {}, review = {}, accessories = []) {
  const reasons = [];
  if (review.notReceived) {
    reasons.push("Item was marked not received.");
  }
  if (review.decision === "not_accepted") {
    reasons.push("Milford cannot accept this item for resale.");
  }

  const missingAccessories = accessories
    .filter((item) => review.accessories?.[item.name] === false)
    .map((item) => item.name);
  if (missingAccessories.length) {
    reasons.push(`Adjusted for missing ${formatInlineList(missingAccessories)}.`);
  }

  const customerCondition = String(fields.Condition || "").trim();
  const verifiedCondition = String(review.verifiedCondition || "").trim();
  if (customerCondition && verifiedCondition && normalizeCondition(customerCondition) !== normalizeCondition(verifiedCondition)) {
    reasons.push(`Condition adjusted from ${customerCondition} to ${verifiedCondition}.`);
  }

  return reasons.map((reason) => `- ${reason}`).join("\n");
}

function legacyAutoInspectionReason(fields = {}, review = {}, accessories = []) {
  const reasons = [];
  if (review.notReceived) {
    reasons.push("Item was marked not received.");
  }

  const customerCondition = String(fields.Condition || "").trim();
  const verifiedCondition = String(review.verifiedCondition || "").trim();
  if (customerCondition && verifiedCondition && normalizeCondition(customerCondition) !== normalizeCondition(verifiedCondition)) {
    reasons.push(`Customer selected ${customerCondition}; inspection verified ${verifiedCondition}.`);
  }

  const missingAccessories = accessories
    .filter((item) => review.accessories?.[item.name] === false)
    .map((item) => item.name);
  if (missingAccessories.length) {
    reasons.push(`${missingAccessories.length === 1 ? "Missing accessory" : "Missing accessories"}: ${formatInlineList(missingAccessories)}.`);
  }

  return reasons.join(" ");
}

function removeGeneratedInspectionReason(current = "", generated = "") {
  if (!generated) return String(current || "").trim();
  return String(current || "")
    .replace(generated, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeCondition(value = "") {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function formatInlineList(items = []) {
  if (items.length <= 1) return items[0] || "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function staffNoteValue(fields = {}, label = "") {
  return noteValue(fields["Seller Notes"], label);
}

function noteValue(notes = "", label = "") {
  const prefix = `${label}:`;
  return String(notes || "")
    .split(/\r?\n/)
    .reverse()
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

function staffWorkflowText(fields = {}) {
  return `${fields.Status || ""} ${fields["Workflow Step"] || ""}`.toLowerCase();
}

function recordNeedsManualQuote(record = {}) {
  const fields = record.fields || {};
  const status = staffWorkflowText(fields);
  const quoteSource = quoteSourceLabel(fields).toLowerCase();
  return status.includes("manual review") || quoteSource.includes("manual");
}

function manualQuoteAmountForRecord(record = {}) {
  const fields = record.fields || {};
  return numberOrNull(fields["Final Offer"]) || numberOrNull(fields["Milford Offer"]) || 0;
}

function itemManualQuoteIsPriced(record = {}) {
  return manualQuoteAmountForRecord(record) > 0;
}

function itemManualQuoteIsComplete(record = {}) {
  const fields = record.fields || {};
  const status = staffWorkflowText(fields);
  const notes = String(fields["Staff Notes"] || "").toLowerCase();
  return itemManualQuoteIsPriced(record)
    && (status.includes("manual quote sent")
      || status.includes("label")
      || status.includes("received")
      || status.includes("inspection")
      || status.includes("evaluated")
      || status.includes("final")
      || status.includes("accepted item")
      || status.includes("customer accepted")
      || status.includes("payment")
      || status.includes("return")
      || notes.includes("prepared quote sent:"));
}

function orderManualReviewItems(order = {}) {
  return (order.items || []).filter(recordNeedsManualQuote);
}

function orderManualQuoteOutstanding(order = {}) {
  const manualItems = orderManualReviewItems(order);
  return manualItems.length > 0 && manualItems.some((item) => !itemManualQuoteIsComplete(item));
}

function workflowStepsForOrderState(hasManualQuoteStep = false) {
  return hasManualQuoteStep ? [MANUAL_QUOTE_STEP, ...WORKFLOW_STEPS.slice(1)] : WORKFLOW_STEPS;
}

function staffRecordLooksReceived(fields = {}) {
  return fieldsPhysicallyReceived(fields);
}

function itemPhysicallyReceived(record = {}) {
  return fieldsPhysicallyReceived(record.fields || {});
}

function fieldsPhysicallyReceived(fields = {}) {
  const parsed = parseStaffNotes(fields["Staff Notes"]);
  if (parsed.notReceived) return false;
  if (parsed.received) return true;
  if (parsed.receivedRecorded) return false;
  const status = staffWorkflowText(fields);
  return statusIncludesAny(status, ["received", "inspection"]);
}

function inspectionReasonForDisplay(fields = {}, parsed = parseStaffNotes(fields["Staff Notes"])) {
  const reason = String(parsed.reason || fields["Decline Reason"] || "").trim();
  return reason === STALE_STAFF_CREATED_REASON || reason.toLowerCase() === "none" ? "" : reason;
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
    || noteValue(fields["Staff Notes"], "Return tracking number")
    || "-";
}

function staffActionCompleted(action, fields = {}, parsed = {}) {
  const status = staffWorkflowText(fields);
  const received = fieldsPhysicallyReceived(fields);
  if (action === "received") {
    return received;
  }
  if (action === "save") {
    return received && statusIncludesAny(status, ["inspection", "evaluated", "final", "accepted item", "customer accepted", "payment", "return"]);
  }
  if (action === "adjusted") {
    return received && statusIncludesAny(status, ["evaluated", "final", "accepted item", "customer accepted", "payment", "return"]);
  }
  if (action === "accepted") {
    return statusIncludesAny(status, ["accepted item", "customer accepted", "payment"]);
  }
  if (action === "payment") return status.includes("payment") || /payment sent:\s*yes/i.test(String(fields["Staff Notes"] || ""));
  if (action === "return") {
    return parsed.lastAction === "return"
      || parsed.lastAction === "return_boxed"
      || parsed.returnBoxed
      || parsed.returnReadyForPickup
      || status.includes("return items boxed")
      || status.includes("awaiting pickup")
      || status.includes("items shipped to customer")
      || status.includes("return complete");
  }
  return false;
}

function setStaffQueueGuideTarget(target) {
  staffQueueGuideTargetOverride = target || "";
  updateStaffQueueGuidance();
}

function staffQueueIncludedItemsVerified(accessories = []) {
  const accessoryInputs = Array.from(document.querySelectorAll("[data-accessory]"));
  if (!accessories.length && !accessoryInputs.length) return true;
  const allAccessoriesCheck = document.getElementById("all-accessories-check");
  return Boolean(allAccessoriesCheck?.checked) || accessoryInputs.some((input) => !input.checked);
}

function updateStaffQueueGuidance() {
  document.querySelectorAll(".staff-queue-guide-active, .staff-queue-guide-complete").forEach((element) => {
    element.classList.remove("staff-queue-guide-active");
    element.classList.remove("staff-queue-guide-complete");
  });

  const order = selectedOrder();
  const record = selectedRecord(order);
  const target = staffQueueGuideTargetOverride || staffQueueCurrentGuideTarget(order, record);
  if (!target) return;

  const element = detailEl.querySelector(`[data-staff-queue-guide="${target}"]`);
  const isCompleteActionTarget = target === "actions" && order?.workflow?.isComplete;
  element?.classList.add(isCompleteActionTarget ? "staff-queue-guide-complete" : "staff-queue-guide-active");
}

function staffQueueCurrentGuideTarget(order = selectedOrder(), record = selectedRecord(order)) {
  if (!order || !record || !document.getElementById("staff-review-form")) return "";
  if (order.workflow?.current?.key === "manual" || order.workflow?.manualQuoteOutstanding) return "manual";
  const fields = record.fields || {};
  const parsed = parseStaffNotes(fields["Staff Notes"]);
  const selectedItemEvaluated = itemIsEvaluated(record);

  if (!selectedItemEvaluated) {
    if (!itemPhysicallyReceived(record) && !parsed.notReceived) return "receive";
    if (!staffActionCompleted("save", fields, parsed)) return "included";
    if (!parsed.verifiedCondition) return "condition";
    return "quote";
  }

  const nextItemNeedingReview = (order.items || []).find((item) => !itemIsEvaluated(item));
  if (nextItemNeedingReview) return "items";

  if (!finalQuoteEmailSent(order)) return "final-email";

  if (order.workflow?.isComplete || orderPaymentComplete(order)) return "actions";

  const currentStep = order.workflow?.current?.key || "";
  if (currentStep === "payout") return "payout";
  if (currentStep === "return") return "actions";
  if (currentStep === "customer") return latestCustomerDecision(fields) ? "actions" : "final-email";

  return currentStep ? "order" : "";
}

function scrollToStaffQueueGuideTarget(target) {
  if (!target) return;
  const element = detailEl.querySelector(`[data-staff-queue-guide="${target}"]`);
  element?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function finalQuoteEmailSent(order) {
  if (orderCustomerDecisionItems(order).length) return true;
  return (order?.items || []).some((item) => {
    const status = staffWorkflowText(item.fields);
    return statusIncludesAny(status, [
      "final quote sent",
      "customer final quote decision",
      "customer accepted",
      "payment",
      "items shipped to customer",
    ]);
  });
}

function statusIncludesAny(status, needles) {
  return needles.some((needle) => status.includes(needle));
}

function renderStaffReferencePricing(fields = {}) {
  const links = staffReferenceLinks(fields);
  return `
    <div class="staff-reference-panel">
      <div>
        <strong>Reference pricing</strong>
        <span>Compare used-market listings before setting the final offer.</span>
      </div>
      <nav class="staff-reference-links" aria-label="Reference pricing searches">
        ${links.map((link) => `<a href="${escapeAttr(link.href)}" target="_blank" rel="noreferrer">${escapeHtml(link.label)}</a>`).join("")}
      </nav>
    </div>
  `;
}

function staffReferenceLinks(fields = {}) {
  const query = staffReferenceQuery(fields);
  return [
    { label: "eBay sold", href: ebaySoldListingsUrl(fields) },
    { label: "MPB", href: marketSearchUrl("https://www.mpb.com/en-us/search", query) },
    { label: "B&H used", href: marketSearchUrl("https://www.bhphotovideo.com/c/search", `${query} used`) },
    { label: "KEH", href: marketSearchUrl("https://www.keh.com/shop/search", query) },
  ];
}

function staffReferenceQuery(fields = {}) {
  const product = [fields["Item Brand"], fields["Item Model"]]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .replace(/"/g, "")
    .trim();
  return product ? `"${product}"` : "camera gear";
}

function marketSearchUrl(baseUrl, query) {
  const url = new URL(baseUrl);
  url.searchParams.set("q", query || "camera gear");
  return url.toString();
}

function ebaySoldListingsUrl(fields = {}) {
  const url = new URL("https://www.ebay.com/sch/i.html");
  url.searchParams.set("_nkw", staffReferenceQuery(fields));
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
    `Received: ${review.notReceived ? "No - item not received" : review.received ? "Yes" : "No"}`,
    `Item not received: ${review.notReceived ? "Yes" : "No"}`,
    `Verified condition: ${review.verifiedCondition}`,
    `All recommended accessories included: ${review.allAccessories ? "Yes" : "No"}`,
    "Accessory check:",
    accessoryLines,
    `Customer decision: ${review.decision}`,
    `Final offer: $${finalOffer}`,
    `Last staff action: ${action}`,
    `Reason / notes: ${review.reason || ""}`,
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
    receivedRecorded: false,
    notReceived: false,
    allAccessories: false,
    verifiedCondition: "",
    accessories: {},
    decision: "pending",
    customerFinalDecision: "",
    lastAction: "",
    reason: "",
    returnBoxed: false,
    returnReadyForPickup: false,
    returnShipped: false,
  };
  let inCustomerFinalQuoteDecision = false;
  let inAccessoryCheck = false;
  let inReasonNotes = false;
  const reasonLines = [];

  notes.split("\n").forEach((line) => {
    const clean = line.trim();
    if (!clean) {
      inAccessoryCheck = false;
      return;
    }
    if (clean === "CUSTOMER FINAL QUOTE DECISION") {
      inCustomerFinalQuoteDecision = true;
      inReasonNotes = false;
    }
    if (clean === "INTAKE REVIEW" || clean === "ORDER UPDATE") {
      inCustomerFinalQuoteDecision = false;
      inReasonNotes = false;
    }
    if (inReasonNotes && staffNoteLineStartsNewField(clean)) {
      inReasonNotes = false;
    } else if (inReasonNotes) {
      reasonLines.push(clean);
      return;
    }
    if (clean.startsWith("Received:")) {
      const receivedText = clean.toLowerCase();
      parsed.receivedRecorded = true;
      parsed.received = clean.includes("Yes") && !receivedText.includes("not received");
      if (receivedText.includes("not received")) parsed.notReceived = true;
    }
    if (clean.startsWith("Item not received:")) parsed.notReceived = clean.includes("Yes");
    if (clean.startsWith("All recommended accessories included:")) parsed.allAccessories = clean.includes("Yes");
    if (clean.startsWith("Verified condition:")) parsed.verifiedCondition = clean.replace("Verified condition:", "").trim();
    if (clean.startsWith("Customer decision:")) {
      parsed.decision = clean.replace("Customer decision:", "").trim() || "pending";
      if (inCustomerFinalQuoteDecision) parsed.customerFinalDecision = parsed.decision;
    }
    if (clean.startsWith("Last staff action:")) parsed.lastAction = clean.replace("Last staff action:", "").trim();
    if (clean.startsWith("Return boxed:")) parsed.returnBoxed = clean.includes("Yes");
    if (clean.startsWith("Return ready for pickup:")) parsed.returnReadyForPickup = clean.includes("Yes");
    if (clean.startsWith("Return shipped:")) parsed.returnShipped = clean.includes("Yes");
    if (clean === "Accessory check:") {
      inAccessoryCheck = true;
      return;
    }
    if (inAccessoryCheck && clean.startsWith("- ")) {
      const [name, state] = clean.slice(2).split(":").map((part) => part.trim());
      if (name) parsed.accessories[name] = state !== "missing";
      return;
    }
    if (inAccessoryCheck && !clean.startsWith("- ")) {
      inAccessoryCheck = false;
    }
    if (clean.startsWith("Reason / notes:")) {
      const firstReasonLine = clean.replace("Reason / notes:", "").trim();
      reasonLines.length = 0;
      if (firstReasonLine) reasonLines.push(firstReasonLine);
      inReasonNotes = true;
    }
  });

  parsed.reason = reasonLines.join("\n").trim();
  return parsed;
}

function staffNoteLineStartsNewField(clean = "") {
  return /^(INTAKE REVIEW|ORDER UPDATE|MANUAL QUOTE|CUSTOMER FINAL QUOTE DECISION|RETURN SHIPMENT|Received:|Item not received:|All recommended accessories included:|Verified condition:|Accessory check:|Customer decision:|Final offer:|Manual quote amount:|Manual quote saved:|Prepared quote sent:|Return boxed:|Return ready for pickup:|Return shipped:|Last staff action:|Updated:)/i.test(clean);
}

function workflowState(order) {
  const items = order.items || [];
  const statuses = items.map((item) => staffWorkflowText(item.fields));
  const manualItems = orderManualReviewItems(order);
  const hasManualQuoteStep = manualItems.length > 0;
  const manualQuoteOutstanding = hasManualQuoteStep && orderManualQuoteOutstanding(order);
  const workflowSteps = workflowStepsForOrderState(hasManualQuoteStep);
  const acceptedItems = orderAcceptedItems(order);
  const returnItems = orderReturnItems(order);
  const hasCustomerDecision = acceptedItems.length > 0 || returnItems.length > 0;
  const paymentComplete = !acceptedItems.length || orderPaymentComplete(order);
  const returnsComplete = !returnItems.length || returnItems.every(staffReturnCompleted);
  const completed = new Set();
  const skipped = new Set();
  if (hasManualQuoteStep) {
    if (!manualQuoteOutstanding) completed.add("manual");
  } else {
    completed.add("initial");
  }
  if (hasCustomerDecision && !returnItems.length) skipped.add("return");
  if (statuses.some((status) => status.includes("label") || status.includes("accepted") || status.includes("shipped") || status.includes("received") || status.includes("inspection") || status.includes("evaluated") || status.includes("final") || status.includes("payment") || status.includes("return"))) completed.add("shipped");
  if (allItemsReceived(items)) completed.add("received");
  if (allItemsEvaluated(items)) completed.add("evaluated");
  if (completed.has("evaluated") && (finalQuoteEmailSent(order) || statuses.some((status) => status.includes("accepted item") || status.includes("customer accepted") || status.includes("payment") || status.includes("return")))) completed.add("final");
  if (completed.has("final") && (hasCustomerDecision || statuses.some((status) => status.includes("accepted item") || status.includes("return item") || status.includes("customer accepted") || status.includes("payment")))) completed.add("customer");
  if (completed.has("customer") && paymentComplete) completed.add("payout");
  if (returnItems.length && completed.has("customer") && paymentComplete && returnsComplete) completed.add("return");

  const current = workflowSteps.find((step) => !completed.has(step.key) && !skipped.has(step.key)) || null;
  const isComplete = workflowSteps.every((step) => completed.has(step.key) || skipped.has(step.key));
  return { completed, skipped, current, isComplete, steps: workflowSteps, hasManualQuoteStep, manualQuoteOutstanding };
}

function workflowStepDisplayLabel(step) {
  return step.label;
}

function allItemsReceived(items = []) {
  return items.length > 0 && items.every(itemPhysicallyReceived);
}

function allItemsEvaluated(items = []) {
  return items.length > 0 && items.every(itemIsEvaluated);
}

function itemIsEvaluated(item = {}) {
  return itemPhysicallyReceived(item) && itemIsEvaluatedStatus(staffWorkflowText(item.fields || {}));
}

function itemIsEvaluatedStatus(status) {
  return statusIncludesAny(status, [
    "evaluated",
    "final",
    "accepted item",
    "customer accepted",
    "payment",
    "return",
    "declined",
  ]);
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
  if (customerAcceptedItem(record)) {
    const fields = record.fields || {};
    return staffActionCompleted("payment", fields, parseStaffNotes(fields["Staff Notes"])) ? "is-paid" : "is-evaluated";
  }
  const status = staffWorkflowText(record.fields);
  if (staffReturnCompleted(record)) return "is-return-complete";
  if (customerReturnRequested(record)) return "is-return-requested";
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

function orderOfferTotals(order, currentRecord, currentCashOffer) {
  const currentOffer = numberOrNull(currentCashOffer);
  const totals = (order?.items || []).reduce((summary, item) => {
    const original = numberOrNull(item.fields?.["Milford Offer"]) ?? 0;
    const cash = item.id === currentRecord?.id && currentOffer !== null
      ? currentOffer
      : adjustedCashOfferForRecord(item);
    summary.original += original;
    summary.cash += cash;
    return summary;
  }, { original: 0, cash: 0 });
  totals.storeCredit = storeCreditOffer(totals.cash);
  return totals;
}

function adjustedCashOfferForRecord(record) {
  const fields = record?.fields || {};
  const original = numberOrNull(fields["Milford Offer"]) ?? 0;
  const review = parseStaffNotes(fields["Staff Notes"]);
  const accessories = accessoryListFor(fields);
  const calculated = calculateOffer(fields, review, accessories, original);
  return reviewRequiresCustomerDecision(fields, review, accessories)
    ? calculated
    : numberOrNull(fields["Final Offer"]) ?? calculated;
}

function storeCreditOffer(cashAmount) {
  return Math.floor((Number(cashAmount) || 0) * (1 + STORE_CREDIT_BONUS));
}

function updateOrderTotalCard(order, currentRecord, currentCashOffer) {
  const card = document.getElementById("staff-order-total-card");
  if (!card || !order) return;
  const totals = orderOfferTotals(order, currentRecord, currentCashOffer);
  const cashEl = card.querySelector("[data-order-cash-total]");
  const storeCreditEl = card.querySelector("[data-order-store-credit-total]");
  const originalEl = card.querySelector("[data-order-original-total]");
  if (cashEl) cashEl.textContent = `$${formatMoney(totals.cash)}`;
  if (storeCreditEl) storeCreditEl.textContent = `$${formatMoney(totals.storeCredit)} store credit`;
  if (originalEl) originalEl.textContent = `Original quote: $${formatMoney(totals.original)}`;
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
    if (filter === "manual") return order.workflow.current?.key === "manual" || order.workflow.manualQuoteOutstanding;
    if (filter === "received") return statuses.some((status) => status.includes("received") || status.includes("inspection") || status.includes("evaluated"));
    if (filter === "done") return statuses.every((status) => status.includes("payment") || status.includes("declined") || status.includes("return"));
    if (filter === "active") return !statuses.every((status) => status.includes("payment") || status.includes("declined") || status.includes("return"));
    return order.workflow.current?.key === filter || order.workflow.completed.has(filter);
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
    return sorted.sort((a, b) => workflowRank(a.workflow.current?.key) - workflowRank(b.workflow.current?.key) || newestOrderTime(b) - newestOrderTime(a));
  }
  return sorted.sort((a, b) => newestOrderTime(b) - newestOrderTime(a));
}

function newestOrderTime(order) {
  return Math.max(...order.items.map((item) => new Date(item.fields?.["Quote Submitted"] || 0).getTime()), 0);
}

function workflowRank(key) {
  const queueSteps = [MANUAL_QUOTE_STEP, ...WORKFLOW_STEPS];
  const index = queueSteps.findIndex((step) => step.key === key);
  return index === -1 ? 99 : index;
}

function activeFilterLabel(filter) {
  if (filter === "all") return "visible";
  if (filter === "active") return "active";
  if (filter === "done") return "done";
  if (filter === "manual") return "manual quote";
  return ([MANUAL_QUOTE_STEP, ...WORKFLOW_STEPS].find((step) => step.key === filter)?.label || filter).toLowerCase();
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

function itemPositionLabel(order, record) {
  const total = order?.items?.length || 0;
  if (!total) return "Item 0 of 0";
  const index = order.items.findIndex((item) => item.id === record?.id);
  return `Item ${index >= 0 ? index + 1 : 1} of ${total}`;
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

function orderAddressText(fields) {
  return [
    fields["Seller Street"],
    [fields["Seller City"], fields["Seller State"], fields["Seller ZIP"]].filter(Boolean).join(", "),
  ].filter(Boolean).join(", ");
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

loadButton.addEventListener("click", () => loadRecords(deepLinkLoadOptions()));
refreshButton.addEventListener("click", () => loadRecords(deepLinkLoadOptions()));
staffUndoButton?.addEventListener("click", () => restoreStaffHistory("undo"));
staffRedoButton?.addEventListener("click", () => restoreStaffHistory("redo"));
staffBugReportLink?.addEventListener("click", () => updateBugReportLink());
pricingReviewButton?.addEventListener("click", openPricingReview);
startStaffIntakeButton?.addEventListener("click", startStaffIntake);
intakeQueueButton?.addEventListener("click", openStaffIntakeQueue);
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
  if (event.key === "Enter") loadRecords(deepLinkLoadOptions());
});

if ((CONFIG.staffAuthMode === "cookie" || CONFIG.staffAuthMode === "secret") && CONFIG.autoLoadStaff) {
  loadRecords(deepLinkLoadOptions());
} else if (new URLSearchParams(window.location.search).get("staffTest") === "1") {
  usernameInput.value = TEST_EMPLOYEE;
  passwordInput.value = TEST_PASSWORD;
  loadRecords(deepLinkLoadOptions());
}
