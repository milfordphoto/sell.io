const gearCatalog = [
  { name: "Sony Alpha a7 III Body", category: "camera", value: 780 },
  { name: "Sony Alpha a7 IV Body", category: "camera", value: 1320 },
  { name: "Sony FE 24-70mm f/2.8 GM Lens", category: "lens", value: 980 },
  { name: "Canon EOS R6 Body", category: "camera", value: 1060 },
  { name: "Canon EOS R5 Body", category: "camera", value: 1850 },
  { name: "Canon RF 24-70mm f/2.8L IS USM Lens", category: "lens", value: 1260 },
  { name: "Nikon Z6 II Body", category: "camera", value: 820 },
  { name: "Nikon Z 24-70mm f/2.8 S Lens", category: "lens", value: 980 },
  { name: "Fujifilm X-T5 Body", category: "camera", value: 1040 },
  { name: "Fujifilm X100V Camera", category: "camera", value: 1180 },
  { name: "Canon Speedlite 600EX II-RT", category: "flash", value: 155 },
  { name: "Manual review item", category: "manual", value: 0 },
];

const conditionMultipliers = {
  "like-new": 1.08,
  excellent: 1,
  good: 0.84,
  "well-used": 0.62,
  "manual-review": 0,
};

const conditionLabels = {
  "like-new": "Like New",
  excellent: "Excellent",
  good: "Good",
  "well-used": "Well Used",
  "manual-review": "Manual Review",
};

const state = {
  stepIndex: 0,
  steps: ["gear", "condition", "contact", "shipping", "offer"],
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const form = document.querySelector("#quote-form");
const gearSearch = document.querySelector("#gear-search");
const category = document.querySelector("#category");
const quantity = document.querySelector("#quantity");
const shippingFields = document.querySelector("#shipping-fields");
const successPanel = document.querySelector("#success-panel");
const terms = document.querySelector("#terms");

function byId(id) {
  return document.getElementById(id);
}

function selectedRadio(name) {
  return form.querySelector(`input[name="${name}"]:checked`)?.value;
}

function selectedAccessories() {
  return [...form.querySelectorAll('input[name="accessories"]:checked')].map((input) => input.value);
}

function populateGearOptions() {
  const datalist = byId("gear-options");
  datalist.innerHTML = gearCatalog
    .map((item) => `<option value="${item.name}"></option>`)
    .join("");
}

function selectedGear() {
  const typed = gearSearch.value.trim().toLowerCase();
  return gearCatalog.find((item) => item.name.toLowerCase() === typed);
}

function estimate() {
  const gear = selectedGear();
  const itemValue = gear?.value ?? (category.value === "manual" ? 0 : 350);
  const qty = Math.max(1, Number(quantity.value || 1));
  const condition = selectedRadio("condition");
  const multiplier = conditionMultipliers[condition] ?? 1;
  const accessories = selectedAccessories();
  const hasCoreAccessories = accessories.includes("battery") || category.value === "lens";
  const hasCaps = accessories.includes("front-cap") || accessories.includes("rear-cap");
  let accessoryFactor = 1;

  if (!hasCoreAccessories) accessoryFactor -= 0.08;
  if (!hasCaps) accessoryFactor -= 0.05;
  if (accessories.includes("box")) accessoryFactor += 0.02;
  if (accessories.includes("hood")) accessoryFactor += 0.02;

  const manual = condition === "manual-review" || category.value === "manual" || itemValue === 0;
  const cash = manual ? 0 : Math.max(25, Math.round(itemValue * qty * multiplier * accessoryFactor));
  const storeCredit = Math.round(cash * 1.1);
  const highValue = cash >= 1500;
  const freeShipping = cash >= 250 && !highValue;
  const labelReview = cash >= 1500;

  return {
    gear,
    cash,
    storeCredit,
    highValue,
    freeShipping,
    labelReview,
    manual,
    condition,
    qty,
  };
}

function shippingMessage(data) {
  const delivery = selectedRadio("delivery");
  if (delivery === "dropoff") {
    return "<strong>In-store dropoff selected.</strong> The quote ID follows the customer to Milford Photo for specialist verification.";
  }

  if (data.manual) {
    return "<strong>Manual review required.</strong> Milford Photo would review this submission before issuing a shipping label.";
  }

  if (data.labelReview) {
    return "<strong>High-value label approval.</strong> A Milford specialist would approve insurance and carrier before the label is released.";
  }

  if (data.freeShipping) {
    return "<strong>Free inbound shipping eligible.</strong> The production system would generate an insured UPS/FedEx label or QR code here.";
  }

  return "<strong>Below free shipping threshold.</strong> Customer can drop off in-store, bundle more gear, or request a label deducted from payout.";
}

function routingLabel(data) {
  if (data.manual) return "Manual quote review";
  if (data.highValue) return "High-value staff approval";
  if (!byId("serial").value.trim()) return "Needs serial number before final";
  return "Standard inspection";
}

function updateSummary() {
  const data = estimate();
  const gearName = data.gear?.name || gearSearch.value.trim() || "Choose a model";
  const delivery = selectedRadio("delivery");
  const shippingText = delivery === "dropoff" ? "In-store dropoff" : data.freeShipping ? "Free label eligible" : data.labelReview ? "Staff-approved label" : "Customer-paid or dropoff";

  byId("cash-offer").textContent = data.manual ? "Review" : currency.format(data.cash);
  byId("final-cash-offer").textContent = data.manual ? "Manual review" : currency.format(data.cash);
  byId("final-credit-offer").textContent = data.manual ? "Manual review" : currency.format(data.storeCredit);
  byId("summary-gear").textContent = data.qty > 1 ? `${gearName} x${data.qty}` : gearName;
  byId("summary-condition").textContent = conditionLabels[data.condition] || "Excellent";
  byId("summary-shipping").textContent = shippingText;
  byId("summary-routing").textContent = routingLabel(data);
  byId("shipping-policy-note").innerHTML = shippingMessage(data);

  const quoteId = buildQuoteId();
  byId("quote-id").textContent = quoteId;

  byId("receipt-preview").innerHTML = `
    <strong>Customer receipt preview</strong>
    <span>Quote ${quoteId} would be emailed to the customer and Milford Photo.</span>
    <span>Offer: ${data.manual ? "manual review" : currency.format(data.cash)} cash or ${data.manual ? "manual review" : currency.format(data.storeCredit)} store credit.</span>
    <span>Status: instant offer pending physical inspection and verification.</span>
  `;

  const staffItems = [
    `Gear: ${data.qty > 1 ? `${gearName} x${data.qty}` : gearName}`,
    `Customer: ${byId("first-name").value || "First"} ${byId("last-name").value || "Last"}, ${byId("email").value || "email pending"}`,
    `Routing: ${routingLabel(data)}`,
    `Delivery: ${delivery === "dropoff" ? "Store dropoff" : "Mail-in intake"}`,
    `Prototype next step: create incoming gear record, inspection checklist, and payout status.`,
  ];
  byId("staff-list").innerHTML = staffItems.map((item) => `<li>${item}</li>`).join("");

  shippingFields.hidden = delivery === "dropoff";
  resizeParentFrame();
}

function buildQuoteId() {
  const name = (gearSearch.value.trim() || "DEMO").replace(/[^a-z0-9]/gi, "").slice(0, 4).toUpperCase();
  const suffix = Math.abs(hashCode(`${gearSearch.value}-${selectedRadio("condition")}-${quantity.value}`))
    .toString()
    .slice(0, 4)
    .padEnd(4, "0");
  return `MP-${name || "DEMO"}-${suffix}`;
}

function hashCode(value) {
  return [...value].reduce((hash, char) => (hash << 5) - hash + char.charCodeAt(0), 0);
}

function setStep(stepName) {
  const nextIndex = state.steps.indexOf(stepName);
  if (nextIndex < 0) return;
  state.stepIndex = nextIndex;

  document.querySelectorAll(".form-step").forEach((section) => {
    section.classList.toggle("is-active", section.dataset.step === stepName);
  });

  document.querySelectorAll(".step").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.stepTarget === stepName);
  });

  byId("prev-step").style.visibility = state.stepIndex === 0 ? "hidden" : "visible";
  byId("next-step").hidden = state.stepIndex === state.steps.length - 1;
  resizeParentFrame();
}

function nextStep() {
  const next = Math.min(state.stepIndex + 1, state.steps.length - 1);
  setStep(state.steps[next]);
}

function prevStep() {
  const previous = Math.max(state.stepIndex - 1, 0);
  setStep(state.steps[previous]);
}

function resizeParentFrame() {
  window.requestAnimationFrame(() => {
    window.parent?.postMessage(
      {
        type: "MP_USED_GEAR_HEIGHT",
        height: document.documentElement.scrollHeight,
      },
      "*",
    );
  });
}

function handleGearChange() {
  const gear = selectedGear();
  if (gear) category.value = gear.category;
  updateSummary();
}

function submitPrototype(event) {
  event.preventDefault();
  if (!terms.checked) {
    terms.focus();
    successPanel.hidden = false;
    successPanel.textContent = "Please confirm the prototype offer notice before creating the quote.";
    resizeParentFrame();
    return;
  }

  const data = estimate();
  const labelLine = data.manual
    ? "This would enter manual review before a label or final estimate is issued."
    : data.freeShipping
      ? "This would trigger the automated label workflow in the production system."
      : "This would create the quote and present dropoff/customer-paid shipping options.";

  successPanel.hidden = false;
  successPanel.textContent = `Prototype quote ${buildQuoteId()} created. ${labelLine}`;
  resizeParentFrame();
}

populateGearOptions();
updateSummary();
setStep("gear");

document.querySelectorAll("[data-step-target]").forEach((button) => {
  button.addEventListener("click", () => setStep(button.dataset.stepTarget));
});

byId("next-step").addEventListener("click", nextStep);
byId("prev-step").addEventListener("click", prevStep);
byId("toggle-staff").addEventListener("click", () => {
  const panel = byId("staff-panel");
  panel.hidden = !panel.hidden;
  byId("toggle-staff").textContent = panel.hidden ? "Show Milford staff preview" : "Hide Milford staff preview";
  resizeParentFrame();
});

gearSearch.addEventListener("input", handleGearChange);
form.addEventListener("input", updateSummary);
form.addEventListener("change", updateSummary);
form.addEventListener("submit", submitPrototype);
window.addEventListener("load", resizeParentFrame);
window.addEventListener("resize", resizeParentFrame);
