const CONFIG = window.MP_USED_GEAR_CONFIG || {};
const API_BASE = resolveApiBase();
const TEST_STAFF_USERS = ["staff", "employee"];
const TEST_PASSWORD = "password";
const DEMO_QUEUE_KEY = "mpUsedGearStaffQueue";
const SECURE_STAFF_MODE = CONFIG.staffAuthMode === "cookie";

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

const WORKFLOW_STEPS = [
  { key: "initial", label: "Initial Quote" },
  { key: "shipped", label: "Shipped to Milford Photo" },
  { key: "received", label: "Received" },
  { key: "evaluated", label: "Evaluated" },
  { key: "final", label: "Final Quote" },
  { key: "customer", label: "Customer Decision" },
  { key: "payout", label: "Payout" },
  { key: "return", label: "Items Shipped to Customer" },
];

const QUEUE_FILTERS = {
  initial: { label: "Initial Quote", empty: "No orders are currently at Initial Quote." },
  shipped: { label: "Shipped to Milford Photo", empty: "No orders are currently waiting to arrive." },
  received: { label: "Received", empty: "No orders are currently at Received." },
  evaluated: { label: "Evaluated", empty: "No orders are currently at Evaluated." },
  final: { label: "Final Quote", empty: "No orders are currently ready for final quote." },
  customer: { label: "Customer Decision", empty: "No orders are currently waiting on a customer decision." },
  payout: { label: "Payout", empty: "No orders are currently at Payout." },
  return: { label: "Items Shipped to Customer", empty: "No orders are currently waiting on return shipment." },
  all: { label: "All Orders", empty: "No orders found." },
};

const usernameInput = document.getElementById("staff-username");
const passwordInput = document.getElementById("staff-password");
const loadButton = document.getElementById("load-records");
const refreshButton = document.getElementById("refresh-records");
const searchInput = document.getElementById("staff-search");
const filterSelect = document.getElementById("staff-filter");
const sortSelect = document.getElementById("staff-sort");
const loginEl = document.getElementById("staff-login");
const statusEl = document.getElementById("staff-status");
const countEl = document.getElementById("record-count");
const workspaceEl = document.getElementById("staff-workspace");
const listEl = document.getElementById("records-list");
const detailEl = document.getElementById("staff-detail");

let records = [];
let orders = [];
let selectedOrderId = null;
let selectedItemId = null;
let activeFilter = "all";
let activeSort = "first_received";
let searchQuery = "";

function resolveApiBase() {
  if (CONFIG.apiBase) return CONFIG.apiBase.replace(/\/$/, "");
  const host = window.location.hostname;
  if (window.location.protocol === "file:" || host === "localhost" || host === "127.0.0.1") {
    return "http://localhost:8787";
  }
  return "https://milford-used-gear-system-mvp.milfordphoto.workers.dev";
}

async function loadRecords() {
  const username = usernameInput.value.trim().toLowerCase();
  const password = passwordInput.value;
  if (!SECURE_STAFF_MODE && (!TEST_STAFF_USERS.includes(username) || password !== TEST_PASSWORD)) {
    setStatus("Use staff / password for this local test.", true);
    return;
  }

  setStatus("Loading orders...");
  loadButton.disabled = true;
  refreshButton.disabled = true;

  try {
    const response = await fetch(`${API_BASE}/api/staff/list`, {
      credentials: "include",
      headers: staffHeaders(),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Request failed with ${response.status}`);

    records = (data.records || []).sort(sortNewestFirst);
    orders = buildOrders(records);
    if (!selectedOrderId && orders.length) selectedOrderId = orders[0].id;
    syncSelectedItem();
    loginEl.hidden = true;
    workspaceEl.hidden = false;
    renderQueue();
    renderDetail();
    setStatus("Orders loaded.");
  } catch (error) {
    if (demoModeAllowed()) {
      records = demoRecords().sort(sortNewestFirst);
      orders = buildOrders(records);
      selectedOrderId = orders[0]?.id || null;
      syncSelectedItem();
      loginEl.hidden = true;
      workspaceEl.hidden = false;
      renderQueue();
      renderDetail();
      setStatus("Demo orders loaded. Real staff data requires protected hosting.");
      return;
    }
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

function demoRecords() {
  const submitted = new Date().toISOString();
  return [
    ...storedDemoRecords(),
    {
      id: "demo-r5",
      fields: {
        "Quote Reference": "MP-DEMO-1042",
        "Seller Name": "Michael Wilson",
        "Seller Email": "mikewilson.filmmaker@gmail.com",
        "Seller Phone": "310-863-2826",
        "Seller Street": "3603 W Hidden Lane Unit 204",
        "Seller City": "Rolling Hills Estates",
        "Seller State": "CA",
        "Seller ZIP": "90274",
        "Item Brand": "Canon",
        "Item Model": "EOS R5",
        Category: "Camera Body - Mirrorless",
        Condition: "Excellent",
        "Seller Notes": "Included items: USB connection cable, Rechargeable battery, Charger, Body cap, Strap\nQuote total cash: $1,379\nQuote total store credit: $1,516",
        "Serial Number": "",
        "eBay Median Price": 2299,
        "Condition Multiplier": 60,
        "Milford Offer": 1379,
        "Final Offer": 1379,
        "Quote Submitted": submitted,
        "Quote Expires": new Date(Date.now() + 7 * 86400000).toISOString(),
        Status: "Label Generated",
        Source: "Online",
        "Tracking Number": "1Z-DEMO-1042",
      },
    },
    {
      id: "demo-sigma",
      fields: {
        "Quote Reference": "MP-DEMO-1042",
        "Seller Name": "Michael Wilson",
        "Seller Email": "mikewilson.filmmaker@gmail.com",
        "Seller Phone": "310-863-2826",
        "Seller Street": "3603 W Hidden Lane Unit 204",
        "Seller City": "Rolling Hills Estates",
        "Seller State": "CA",
        "Seller ZIP": "90274",
        "Item Brand": "Sigma",
        "Item Model": "Art 24-70mm f/2.8 DG DN - Sony E",
        Category: "Lens - Mirrorless",
        Condition: "Excellent",
        "Seller Notes": "Lens mount: Sony E\nIncluded items: Rear cap, Lens cap, Lens hood\nQuote total cash: $555\nQuote total store credit: $611",
        "Serial Number": "DEMO-SIGMA-2470",
        "eBay Median Price": 925,
        "Condition Multiplier": 60,
        "Milford Offer": 555,
        "Final Offer": 555,
        "Quote Submitted": submitted,
        "Quote Expires": new Date(Date.now() + 7 * 86400000).toISOString(),
        Status: "Received",
        Source: "Online",
      },
    },
    {
      id: "demo-sony",
      fields: {
        "Quote Reference": "MP-DEMO-2098",
        "Seller Name": "John Doe",
        "Seller Email": "john@example.com",
        "Seller Phone": "203-555-0100",
        "Seller Street": "22 River Street",
        "Seller City": "Milford",
        "Seller State": "CT",
        "Seller ZIP": "06460",
        "Item Brand": "Sony",
        "Item Model": "A7 IV",
        Category: "Camera Body - Mirrorless",
        Condition: "Good",
        "Seller Notes": "Missing charger. Customer prefers store credit.",
        "Serial Number": "",
        "eBay Median Price": 1380,
        "Condition Multiplier": 50,
        "Milford Offer": 690,
        "Final Offer": 640,
        "Quote Submitted": new Date(Date.now() - 86400000).toISOString(),
        "Quote Expires": new Date(Date.now() + 6 * 86400000).toISOString(),
        Status: "Accepted by Seller",
        Source: "Online",
      },
    },
    {
      id: "demo-nikon-final",
      fields: {
        "Quote Reference": "MP-DEMO-3144",
        "Seller Name": "Anna Roberts",
        "Seller Email": "anna@example.com",
        "Seller Phone": "203-555-0188",
        "Seller Street": "18 Broad Street",
        "Seller City": "Stratford",
        "Seller State": "CT",
        "Seller ZIP": "06615",
        "Item Brand": "Nikon",
        "Item Model": "Zf",
        Category: "Camera Body - Mirrorless",
        Condition: "Excellent",
        "Seller Notes": "Included items: Rechargeable battery, Charger, Body cap, Strap",
        "Serial Number": "DEMO-NIKON-ZF",
        "Staff Notes": "INTAKE REVIEW\nReceived: Yes\nSerial number: DEMO-NIKON-ZF\nVerified condition: Excellent\nAll recommended accessories included: Yes\nAccessory check:\n- USB connection cable: missing\n- Rechargeable battery: received\n- Charger: received\n- Body cap: received\n- Strap: received\nCustomer decision: pending\nFinal offer: $1,113\nLast staff action: adjusted\nReason / notes: Missing USB cable only.",
        "eBay Median Price": 1855,
        "Condition Multiplier": 60,
        "Milford Offer": 1113,
        "Final Offer": 1113,
        "Quote Submitted": new Date(Date.now() - 2 * 86400000).toISOString(),
        "Quote Expires": new Date(Date.now() + 5 * 86400000).toISOString(),
        Status: "Evaluated",
        Source: "Online",
      },
    },
    {
      id: "demo-payout",
      fields: {
        "Quote Reference": "MP-DEMO-4091",
        "Seller Name": "Chris Lee",
        "Seller Email": "chris@example.com",
        "Seller Phone": "860-555-0140",
        "Seller Street": "5 Main Street",
        "Seller City": "Milford",
        "Seller State": "CT",
        "Seller ZIP": "06460",
        "Item Brand": "Canon",
        "Item Model": "RF 24-70mm f/2.8L IS USM",
        Category: "Lens - RF",
        Condition: "Excellent",
        "Seller Notes": "Included items: Rear cap, Lens cap, Lens hood",
        "Serial Number": "DEMO-CANON-RF2470",
        "Staff Notes": "INTAKE REVIEW\nReceived: Yes\nSerial number: DEMO-CANON-RF2470\nVerified condition: Excellent\nAll recommended accessories included: Yes\nAccessory check:\n- Rear cap: received\n- Lens cap: received\n- Lens hood: received\nCustomer decision: accept\nFinal offer: $1,050\nLast staff action: accepted\nReason / notes: Customer accepted final quote.",
        "eBay Median Price": 1750,
        "Condition Multiplier": 60,
        "Milford Offer": 1050,
        "Final Offer": 1050,
        "Quote Submitted": new Date(Date.now() - 3 * 86400000).toISOString(),
        "Quote Expires": new Date(Date.now() + 4 * 86400000).toISOString(),
        Status: "Customer Accepted Item",
        Source: "Online",
      },
    },
    {
      id: "demo-complete",
      fields: {
        "Quote Reference": "MP-DEMO-5128",
        "Seller Name": "Sam Patel",
        "Seller Email": "sam@example.com",
        "Seller Phone": "203-555-0199",
        "Seller Street": "91 Greenfield Avenue",
        "Seller City": "New Haven",
        "Seller State": "CT",
        "Seller ZIP": "06511",
        "Item Brand": "Sony",
        "Item Model": "FE 20mm f/1.8 G",
        Category: "Lens - Sony FE / E-Mount",
        Condition: "Like New",
        "Seller Notes": "Included items: Rear cap, Lens cap, Lens hood",
        "Serial Number": "DEMO-SONY-20G",
        "Staff Notes": "INTAKE REVIEW\nReceived: Yes\nSerial number: DEMO-SONY-20G\nVerified condition: Like New\nAll recommended accessories included: Yes\nAccessory check:\n- Rear cap: received\n- Lens cap: received\n- Lens hood: received\nCustomer decision: accept\nFinal offer: $520\nLast staff action: payment\nReason / notes: Paid by check.",
        "eBay Median Price": 743,
        "Condition Multiplier": 70,
        "Milford Offer": 520,
        "Final Offer": 520,
        "Quote Submitted": new Date(Date.now() - 7 * 86400000).toISOString(),
        "Quote Expires": new Date(Date.now() + 1 * 86400000).toISOString(),
        Status: "Payment Sent",
        Source: "Online",
      },
    },
  ];
}

function storedDemoRecords() {
  try {
    const records = JSON.parse(localStorage.getItem(DEMO_QUEUE_KEY) || "[]");
    return Array.isArray(records) ? records : [];
  } catch {
    return [];
  }
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
  const filtered = filterOrders(orders, activeFilter);
  const filterLabel = QUEUE_FILTERS[activeFilter]?.label || activeFilter;
  const searched = searchQuery ? ` matching "${searchQuery}"` : "";
  const countLabel = activeFilter === "all"
    ? `${filtered.length} order${filtered.length === 1 ? "" : "s"}`
    : `${filtered.length} ${filterLabel.toLowerCase()} order${filtered.length === 1 ? "" : "s"}`;
  countEl.textContent = `${countLabel}${searched}`;

  if (!filtered.length) {
    listEl.innerHTML = `<div class="staff-empty-card">${escapeHtml(QUEUE_FILTERS[activeFilter]?.empty || "No orders in this view.")}</div>`;
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
  const status = order.workflow.isComplete ? "Complete" : `Current: ${order.workflow.current.label}`;
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
      <span class="staff-card-gear">${escapeHtml(order.items.map((item) => shortGearTitle(item.fields || {})).join(", "))}</span>
      <span class="staff-card-meta">${escapeHtml(groupingNote)} - ${escapeHtml(itemLabel)} - $${formatMoney(total)}</span>
    </button>
  `;
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

  detailEl.innerHTML = `
    <article class="staff-intake">
      ${renderOrderHeader(order)}
      ${renderWorkflow(order)}
      ${renderItemTabs(order)}

      <header class="staff-intake-header">
        <div>
          <p class="brand-line">${escapeHtml(fields["Quote Reference"] || record.id)}</p>
          <h2>${escapeHtml(gearTitle(fields))}</h2>
          <p>${escapeHtml(fields.Category || "Gear")} - ${escapeHtml(fields.Condition || "Condition not listed")}</p>
        </div>
        <div class="staff-offer-box">
          <span>Item quote</span>
          <strong>$${formatMoney(finalOffer)}</strong>
          <small>${escapeHtml(recordStatusText(record) || "New")}</small>
        </div>
      </header>

      <div class="staff-info-grid">
        <section>
          <h3>Seller</h3>
          <p>${escapeHtml(order.customer || "-")}</p>
          <p>${escapeHtml(order.email || "-")}</p>
          <p>${escapeHtml(order.phone || "-")}</p>
          <p>${order.address || "-"}</p>
        </section>
        <section>
          <h3>Original quote</h3>
          <p>Item cash offer: <strong>$${formatMoney(baseOffer)}</strong></p>
          <p>Order total: <strong>$${formatMoney(order.totals.original)}</strong></p>
          <p>eBay median: ${moneyOrDash(fields["eBay Median Price"])}</p>
          <p>Expires: ${formatDate(fields["Quote Expires"]) || "-"}</p>
        </section>
        <section>
          <h3>Shipping</h3>
          <p>Tracking: ${escapeHtml(fields["Tracking Number"] || "-")}</p>
          <p>${fields["Shippo Label URL"] ? `<a href="${escapeAttr(fields["Shippo Label URL"])}" target="_blank" rel="noreferrer">Open label</a>` : "No label link"}</p>
          <p>Payment method: ${escapeHtml(fields["Payment Method"] || "-")}</p>
        </section>
      </div>

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
            <input type="checkbox" id="received-check" ${parsed.received ? "checked" : ""} />
            This item has been received
          </label>
          <label class="field staff-serial-field">
            <span>Serial number</span>
            <input id="serial-number" type="text" value="${escapeAttr(parsed.serialNumber || fields["Serial Number"] || "")}" placeholder="Enter serial number during intake" autocomplete="off" />
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
            <input type="checkbox" id="all-accessories-check" ${parsed.allAccessories ? "checked" : ""} />
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
              <p>Set the inspected final offer for this item. The customer will accept or return items after the final quote email is sent.</p>
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
          </div>
          <label class="field">
            <span>Adjustment reason / inspection notes</span>
            <textarea id="inspection-notes" rows="5" placeholder="Example: Customer selected Excellent, but inspection found heavy body wear and missing charger.">${escapeHtml(parsed.reason || fields["Decline Reason"] || "")}</textarea>
          </label>
        </section>

        <section class="staff-review-section customer-decision-section">
          <div class="staff-section-title">
            <span>5</span>
            <div>
              <h3>Customer decision</h3>
              <p>Use this after the customer responds to the final quote, or to manually record a phone/in-store decision.</p>
            </div>
          </div>
          <div class="staff-decision-grid">
            <label class="staff-decision-card">
              <input type="radio" name="item-decision" value="pending" ${parsed.decision === "pending" ? "checked" : ""} />
              <span>Awaiting customer response</span>
            </label>
            <label class="staff-decision-card">
              <input type="radio" name="item-decision" value="accept" ${parsed.decision === "accept" ? "checked" : ""} />
              <span>Customer accepted this item</span>
            </label>
            <label class="staff-decision-card">
              <input type="radio" name="item-decision" value="return" ${parsed.decision === "return" ? "checked" : ""} />
              <span>Customer requested return</span>
            </label>
          </div>
        </section>

        ${renderOrderDecisionPanel(order)}
        ${renderStaffActions(record, parsed)}
      </form>
    </article>
  `;

  bindDetail(record, accessories);
}

function renderOrderHeader(order) {
  return `
    <section class="staff-order-header">
      <div>
        <p class="brand-line">Order ${escapeHtml(order.quote)}</p>
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
  const emailState = orderEmailState(order, ready, evaluated);
  return `
    <section class="staff-order-decision">
      <div>
        <h3>${escapeHtml(emailState.title)}</h3>
        <p>${escapeHtml(emailState.copy)}</p>
      </div>
      <button class="${escapeAttr(emailState.className)}" type="button" id="send-final-quote" data-order-status="${escapeAttr(emailState.status)}" data-order-action="${escapeAttr(emailState.action)}" ${emailState.disabled ? "disabled" : ""}>${escapeHtml(emailState.label)}</button>
    </section>
  `;
}

function orderEmailState(order, ready, evaluated) {
  const statuses = order.items.map((item) => recordStatusText(item).toLowerCase());
  const sent = statuses.some((status) => status.includes("final quote sent") || status.includes("payment info requested"));
  const unchanged = orderQuoteUnchanged(order);

  if (!ready) {
    return {
      title: "Final quote email",
      copy: `${evaluated} of ${order.items.length} items evaluated. Finish every item before sending the customer email.`,
      label: "Send final quote email",
      status: "",
      action: "",
      className: "primary-action",
      disabled: true,
    };
  }

  if (sent) {
    return {
      title: unchanged ? "Payment info email" : "Final quote email",
      copy: "Email sent. The customer can now respond with the next step.",
      label: "Email sent",
      status: "",
      action: "",
      className: "secondary-action is-sent",
      disabled: true,
    };
  }

  if (unchanged) {
    return {
      title: "Payment info email",
      copy: "All items are evaluated and the quote is unchanged. Send the customer an email asking for payout information.",
      label: "Send payment info email",
      status: "Payment Info Requested",
      action: "payment_info_requested",
      className: "primary-action",
      disabled: false,
    };
  }

  return {
    title: "Final quote email",
    copy: "All items are evaluated. Staff can send the item-by-item final quote for the customer to accept or return each item.",
    label: "Send final quote email",
    status: "Final Quote Sent",
    action: "final_quote_sent",
    className: "primary-action",
    disabled: false,
  };
}

function orderQuoteUnchanged(order) {
  return order.items.every((item) => {
    const fields = item.fields || {};
    const original = numberOrNull(fields["Milford Offer"]) ?? 0;
    const final = numberOrNull(fields["Final Offer"]) ?? original;
    return final === original;
  });
}

function renderStaffActions(record, parsed) {
  const actions = staffActionsFor(record, parsed);
  return `
    <section class="staff-actions-panel">
      <div class="staff-actions-copy">
        <strong>${escapeHtml(actions.title)}</strong>
        <span>${escapeHtml(actions.copy)}</span>
      </div>
      <div class="staff-actions-buttons">
        ${actions.buttons.map((button) => `
          <button class="${escapeAttr(button.className)}" type="button" data-action="${escapeAttr(button.action)}">${escapeHtml(button.label)}</button>
        `).join("")}
      </div>
    </section>
  `;
}

function staffActionsFor(record, parsed) {
  const status = recordStatusText(record).toLowerCase();
  const decision = parsed.decision || "pending";
  if (!parsed.received && !status.includes("received") && !status.includes("inspection") && !status.includes("evaluated") && !status.includes("final")) {
    return {
      title: "Next step: receive this item",
      copy: "Confirm this item arrived, enter the serial number, then continue intake.",
      buttons: [
        { action: "save", label: "Save intake progress", className: "secondary-action" },
        { action: "received", label: "Mark item received", className: "primary-action" },
      ],
    };
  }
  if (!status.includes("evaluated") && !status.includes("final") && !status.includes("accepted item") && !status.includes("payment") && !status.includes("return")) {
    return {
      title: "Next step: finish evaluation",
      copy: "Verify accessories, condition, serial number, and final item offer.",
      buttons: [
        { action: "save", label: "Save intake progress", className: "secondary-action" },
        { action: "adjusted", label: "Finish item evaluation", className: "primary-action" },
      ],
    };
  }
  if (status.includes("accepted item") || status.includes("customer accepted") || status.includes("payment")) {
    return {
      title: "Next step: payout",
      copy: "Use this after payment has been sent for accepted gear.",
      buttons: [
        { action: "save", label: "Save note", className: "secondary-action" },
        { action: "payment", label: "Payment sent", className: "primary-action" },
      ],
    };
  }
  if (status.includes("return")) {
    return {
      title: "Next step: return item",
      copy: "Use this after the item is packed or shipped back to the customer.",
      buttons: [
        { action: "save", label: "Save note", className: "secondary-action" },
        { action: "return", label: "Return item", className: "secondary-action danger-action" },
      ],
    };
  }
  if (status.includes("payment info")) {
    return {
      title: "Next step: payout",
      copy: "Use this after the customer provides payout information and payment has been sent.",
      buttons: [
        { action: "save", label: "Save note", className: "secondary-action" },
        { action: "payment", label: "Payment sent", className: "primary-action" },
      ],
    };
  }
  if (status.includes("final")) {
    return {
      title: "Next step: wait for customer decision",
      copy: "After the final quote is sent, the customer can accept this item or request that it be returned.",
      buttons: [
        { action: "save", label: "Save decision note", className: "secondary-action" },
        { action: "accepted", label: "Record item accepted", className: "secondary-action" },
        { action: "return", label: "Record return request", className: "secondary-action danger-action" },
      ],
    };
  }
  if (status.includes("evaluated")) {
    return {
      title: "Item evaluated",
      copy: "Move to the next item. When every item is evaluated, use the final quote email panel below.",
      buttons: [
        { action: "save", label: "Save changes", className: "secondary-action" },
        { action: "adjusted", label: "Re-save evaluation", className: "secondary-action" },
      ],
    };
  }
  return {
    title: "Next step: wait for customer decision",
    copy: "After the final quote is sent, the customer can accept this item or request that it be returned.",
    buttons: [
      { action: "save", label: "Save decision note", className: "secondary-action" },
    ],
  };
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
    <label class="condition-option staff-condition-option ${checked ? "is-selected" : ""}">
      <input type="radio" name="verified-condition" value="${escapeAttr(condition)}" ${checked ? "checked" : ""} />
      <strong>${escapeHtml(condition)}</strong>
      <span>${escapeHtml(CONDITION_COPY[condition])}</span>
    </label>
  `;
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

  form.querySelectorAll("input, textarea").forEach((input) => {
    input.addEventListener("input", () => updateSuggestedOffer(record, accessories));
    input.addEventListener("change", () => updateSuggestedOffer(record, accessories));
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

  actionButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      await handleStaffAction(record, accessories, button.dataset.action, actionButtons);
    });
  });

  sendFinalQuoteButton.addEventListener("click", async () => {
    await handleOrderAction(
      selectedOrder(),
      sendFinalQuoteButton.dataset.orderStatus || "Final Quote Sent",
      sendFinalQuoteButton.dataset.orderAction || "final_quote_sent",
      sendFinalQuoteButton,
    );
  });
}

function updateSuggestedOffer(record, accessories) {
  const fields = record.fields || {};
  const suggested = calculateOffer(fields, collectReviewState(accessories), accessories, numberOrNull(fields["Milford Offer"]) ?? 0);
  const suggestedInput = document.getElementById("suggested-offer");
  const customInput = document.getElementById("custom-offer");
  suggestedInput.value = suggested;
  if (document.activeElement !== customInput) customInput.value = suggested;
}

async function handleStaffAction(record, accessories, action, buttons) {
  const review = collectReviewState(accessories);
  const finalOffer = numberOrNull(document.getElementById("custom-offer").value) ?? review.suggestedOffer;
  const statusByAction = {
    received: "Received - Needs Inspection",
    save: "Inspection In Progress",
    adjusted: "Evaluated",
    accepted: "Customer Accepted Item",
    payment: "Payment Sent",
    return: "Return Item",
  };

  const body = {
    recordId: record.id,
    status: statusByAction[action],
    finalOffer,
    serialNumber: review.serialNumber,
    staffNotes: buildStaffNotes(review, action, finalOffer),
    notifyCustomer: action === "payment" || action === "return",
  };

  if (action === "payment") {
    body.action = "payment_sent";
    body.paymentMethod = document.getElementById("payment-method")?.value || "check";
  }
  if (action === "return") {
    body.declineReason = review.reason || "Customer wants this item returned.";
  }

  setDetailBusy(buttons, true);
  setStatus("Saving item update...");

  try {
    const updated = await updateRecord(body);
    records = records.map((item) => (item.id === record.id ? updated : item));
    orders = buildOrders(records);
    selectedOrderId = selectedOrder()?.id || selectedOrderId;
    selectedItemId = action === "adjusted" ? nextItemAfterEvaluation(updated.id) : updated.id;
    renderQueue();
    renderDetail();
    if (action === "adjusted") scrollDetailToTop();
    setStatus(`Saved: ${statusByAction[action]}.`);
  } catch (error) {
    setStatus(error.message || "Unable to save item update.", true);
  } finally {
    setDetailBusy(buttons, false);
  }
}

function nextItemAfterEvaluation(currentItemId) {
  const order = selectedOrder();
  if (!order) return currentItemId;
  const currentIndex = order.items.findIndex((item) => item.id === currentItemId);
  const nextItems = [
    ...order.items.slice(currentIndex + 1),
    ...order.items.slice(0, Math.max(currentIndex, 0)),
  ];
  return nextItems.find((item) => itemStatusClass(item) !== "is-evaluated" && itemStatusClass(item) !== "is-return")?.id || currentItemId;
}

function scrollDetailToTop() {
  detailEl.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function handleOrderAction(order, status, action = "", triggerButton = null) {
  if (!order) return;
  if (!status) return;
  setStatus("Saving order update...");
  if (triggerButton) {
    triggerButton.disabled = true;
    triggerButton.textContent = "Sending...";
  }
  try {
    const updatedRecords = await Promise.all(order.items.map((record, index) => updateRecord({
      recordId: record.id,
      status,
      action,
      staffNotes: appendOrderNote(record.fields?.["Staff Notes"], status),
      notifyCustomer: index === 0,
    })));
    const updatedMap = new Map(updatedRecords.map((record) => [record.id, record]));
    records = records.map((record) => updatedMap.get(record.id) || record);
    orders = buildOrders(records);
    renderQueue();
    renderDetail();
    setStatus(`${status} saved for ${order.quote}.`);
  } catch (error) {
    setStatus(error.message || "Unable to save order update.", true);
  } finally {
    if (triggerButton) triggerButton.disabled = false;
  }
}

async function updateRecord(body) {
  if (demoModeAllowed() && String(body.recordId || "").startsWith("demo")) {
    const current = records.find((record) => record.id === body.recordId) || { id: body.recordId, fields: {} };
    const fields = { ...current.fields };
    if (body.status) fields.Status = body.status;
    if (body.finalOffer !== undefined && body.finalOffer !== null && body.finalOffer !== "") fields["Final Offer"] = Number(body.finalOffer);
    if (body.serialNumber !== undefined) fields["Serial Number"] = body.serialNumber;
    if (body.paymentMethod) fields["Payment Method"] = body.paymentMethod === "bank_transfer" ? "Bank transfer" : "Check";
    if (body.staffNotes) fields["Staff Notes"] = body.staffNotes;
    if (body.declineReason) fields["Decline Reason"] = body.declineReason;
    if (body.action === "payment_sent") fields["Payment Date"] = new Date().toISOString().slice(0, 10);
    const updated = { ...current, fields };
    persistDemoRecord(updated);
    return updated;
  }

  const response = await fetch(`${API_BASE}/api/staff/update`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...staffHeaders(),
    },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed with ${response.status}`);
  return data.record || { id: body.recordId, fields: body };
}

function persistDemoRecord(updated) {
  const stored = storedDemoRecords();
  const next = stored.map((record) => (record.id === updated.id ? updated : record));
  if (!next.some((record) => record.id === updated.id) && String(updated.id).startsWith("demo-live")) next.unshift(updated);
  localStorage.setItem(DEMO_QUEUE_KEY, JSON.stringify(next.slice(0, 40)));
}

function staffHeaders() {
  return CONFIG.staffSecret ? { "X-Staff-Secret": CONFIG.staffSecret } : {};
}

function demoModeAllowed() {
  const params = new URLSearchParams(window.location.search);
  return window.location.hostname === "milfordphoto.github.io" || params.get("demo") === "1" || params.get("staffTest") === "1";
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
    serialNumber: document.getElementById("serial-number")?.value.trim() || "",
    accessories: accessoryState,
    decision: document.querySelector("input[name='item-decision']:checked")?.value || "pending",
    reason: document.getElementById("inspection-notes")?.value.trim() || "",
  };
}

function calculateOffer(fields, review, accessories, fallbackOffer) {
  const market = numberOrNull(fields["eBay Median Price"]);
  const condition = review.verifiedCondition || fields.Condition || "Excellent";
  const conditionOffer = market ? Math.floor(market * (CONDITION_MULTIPLIERS[condition] || 0.6)) : fallbackOffer;
  const missingTotal = accessories.reduce((total, item) => {
    return review.accessories?.[item.name] === false ? total + item.deduction : total;
  }, 0);
  return Math.max(0, Math.floor(conditionOffer - missingTotal));
}

function buildStaffNotes(review, action, finalOffer) {
  const accessoryLines = Object.entries(review.accessories)
    .map(([name, checked]) => `- ${name}: ${checked ? "received" : "missing"}`)
    .join("\n");

  return [
    "INTAKE REVIEW",
    `Received: ${review.received ? "Yes" : "No"}`,
    `Serial number: ${review.serialNumber || "Not entered"}`,
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
    serialNumber: "",
    allAccessories: false,
    verifiedCondition: "",
    accessories: {},
    decision: "pending",
    reason: "",
  };

  notes.split("\n").forEach((line) => {
    const clean = line.trim();
    if (clean.startsWith("Received:")) parsed.received = clean.includes("Yes");
    if (clean.startsWith("Serial number:")) parsed.serialNumber = clean.replace("Serial number:", "").trim();
    if (clean.startsWith("All recommended accessories included:")) parsed.allAccessories = clean.includes("Yes");
    if (clean.startsWith("Verified condition:")) parsed.verifiedCondition = clean.replace("Verified condition:", "").trim();
    if (clean.startsWith("Customer decision:")) parsed.decision = clean.replace("Customer decision:", "").trim() || "pending";
    if (clean.startsWith("- ")) {
      const [name, state] = clean.slice(2).split(":").map((part) => part.trim());
      if (name) parsed.accessories[name] = state !== "missing";
    }
    if (clean.startsWith("Reason / notes:")) parsed.reason = clean.replace("Reason / notes:", "").trim();
  });

  return parsed;
}

function workflowState(order) {
  const statuses = order.items.map((item) => recordStatusText(item).toLowerCase());
  const completed = new Set(["initial"]);
  if (statuses.some((status) => status.includes("label") || status.includes("accepted") || status.includes("shipped"))) completed.add("shipped");
  if (statuses.some((status) => status.includes("received") || status.includes("inspection") || status.includes("evaluated"))) completed.add("received");
  if (statuses.every((status) => status.includes("evaluated") || status.includes("final") || status.includes("accepted") || status.includes("payment") || status.includes("return") || status.includes("declined"))) completed.add("evaluated");
  if (statuses.some((status) => status.includes("final quote"))) completed.add("final");
  if (statuses.some((status) => status.includes("accepted item") || status.includes("return item") || status.includes("customer accepted") || status.includes("payment info requested"))) completed.add("customer");
  if (statuses.some((status) => status.includes("payment sent"))) completed.add("payout");
  if (statuses.some((status) => status.includes("return"))) completed.add("return");

  completePriorWorkflowSteps(completed);

  const current = WORKFLOW_STEPS.find((step) => !completed.has(step.key)) || WORKFLOW_STEPS[WORKFLOW_STEPS.length - 1];
  return { completed, current, isComplete: completed.size >= WORKFLOW_STEPS.length };
}

function completePriorWorkflowSteps(completed) {
  const deepestIndex = WORKFLOW_STEPS.reduce((index, step, currentIndex) => {
    return completed.has(step.key) ? Math.max(index, currentIndex) : index;
  }, 0);
  WORKFLOW_STEPS.slice(0, deepestIndex + 1).forEach((step) => completed.add(step.key));
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
  const status = recordStatusText(record).toLowerCase();
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

function filterOrders(items, filter) {
  return sortOrders(items.filter((order) => {
    const matchesFilter = filter === "all" || order.workflow.current.key === filter;
    return matchesFilter && orderMatchesSearch(order, searchQuery);
  }), activeSort);
}

function sortOrders(items, sortKey) {
  const sorted = [...items];
  if (sortKey === "newest") return sorted.sort((a, b) => dateValue(b.submitted, -Infinity) - dateValue(a.submitted, -Infinity));
  if (sortKey === "first_received") return sorted.sort((a, b) => dateValue(a.submitted, Infinity) - dateValue(b.submitted, Infinity));
  if (sortKey === "customer") return sorted.sort((a, b) => a.customer.localeCompare(b.customer));
  if (sortKey === "value") return sorted.sort((a, b) => (b.totals.final || b.totals.original) - (a.totals.final || a.totals.original));
  return sorted.sort(sortByNextAction);
}

function sortByNextAction(a, b) {
  const stepDelta = workflowStepIndex(a.workflow.current.key) - workflowStepIndex(b.workflow.current.key);
  if (stepDelta !== 0) return stepDelta;
  const submittedDelta = dateValue(a.submitted, Infinity) - dateValue(b.submitted, Infinity);
  if (submittedDelta !== 0) return submittedDelta;
  return a.customer.localeCompare(b.customer);
}

function dateValue(value, fallback) {
  const timestamp = new Date(value || "").getTime();
  return Number.isFinite(timestamp) ? timestamp : fallback;
}

function workflowStepIndex(key) {
  const index = WORKFLOW_STEPS.findIndex((step) => step.key === key);
  return index === -1 ? WORKFLOW_STEPS.length : index;
}

function orderMatchesSearch(order, query) {
  const normalized = normalizeGroupValue(query);
  if (!normalized) return true;
  const haystack = [
    order.quote,
    ...order.quoteRefs,
    order.customer,
    order.email,
    order.phone,
    order.address,
    ...order.items.flatMap((record) => {
      const fields = record.fields || {};
      return [
        record.id,
        fields["Quote Reference"],
        fields["Seller Name"],
        fields["Seller Email"],
        fields["Seller Phone"],
        fields["Tracking Number"],
        fields["Serial Number"],
        fields["Item Brand"],
        fields["Item Model"],
        fields.Category,
        fields.Condition,
        fields.Status,
        fields["Workflow Step"],
      ];
    }),
  ].map((value) => normalizeGroupValue(value)).join(" ");
  return haystack.includes(normalized);
}

function recordStatusText(record) {
  const fields = record.fields || {};
  return String(fields["Workflow Step"] || fields.Status || "");
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
filterSelect.addEventListener("change", () => {
  activeFilter = filterSelect.value;
  const filtered = filterOrders(orders, activeFilter);
  if (!filtered.some((order) => order.id === selectedOrderId)) {
    selectedOrderId = filtered[0]?.id || null;
    syncSelectedItem();
  }
  renderQueue();
  renderDetail();
});
sortSelect.addEventListener("change", () => {
  activeSort = sortSelect.value;
  renderQueue();
});
searchInput.addEventListener("input", () => {
  searchQuery = searchInput.value.trim();
  const filtered = filterOrders(orders, activeFilter);
  if (!filtered.some((order) => order.id === selectedOrderId)) {
    selectedOrderId = filtered[0]?.id || null;
    syncSelectedItem();
  }
  renderQueue();
  renderDetail();
});
usernameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") passwordInput.focus();
});
passwordInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") loadRecords();
});

if (new URLSearchParams(window.location.search).get("staffTest") === "1") {
  usernameInput.value = TEST_EMPLOYEE;
  passwordInput.value = TEST_PASSWORD;
  loadRecords();
}

if (CONFIG.autoLoadStaff) {
  usernameInput.value = TEST_EMPLOYEE;
  passwordInput.value = TEST_PASSWORD;
  loadRecords();
}
