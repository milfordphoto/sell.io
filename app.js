const CONFIG = window.MP_USED_GEAR_CONFIG || {};
const API_BASE = resolveApiBase();

const MANUAL_BRAND = "__manual_brand";
const MANUAL_MODEL = "__manual_model";
const MANUAL_CATEGORY = "Other / Manual Review";
const SELECT_CATEGORY = "";
const SELECT_BRAND = "";
const SELECT_MODEL = "";
const SEARCH_RESULT_LIMIT = 30;

const FALLBACK_CATEGORIES = [
  "Digital Camera",
  "Film Camera",
  "Lens",
  "Flash / Lighting",
  "Video / Cinema Gear",
  MANUAL_CATEGORY,
];

const SIMPLE_CATEGORIES = [
  "Digital Camera",
  "Film Camera",
  "Lens",
  "Flash / Lighting",
  "Video / Cinema Gear",
  MANUAL_CATEGORY,
];

const STATUS_LABELS = {
  quoted: "Instant offer",
  high_value_review: "Staff approval",
  manual_review: "Manual review",
  declined: "Declined",
};

const CONDITION_LABELS = {
  like_new: "Like New",
  excellent: "Excellent",
  good: "Good",
  well_used: "Well Used",
  heavily_used: "Heavily Used",
  not_working: "Not Working",
};

const STEP_COPY = {
  gear: {
    title: "Get an offer for your used camera gear",
    intro: "Start with the gear and condition. Milford Photo verifies every offer after the item arrives or is dropped off in-store.",
  },
  quote: {
    title: "Review your instant offer",
    intro: "Check the current offer for each item before sending the quote to Milford Photo.",
  },
  details: {
    title: "Send this quote to Milford Photo",
    intro: "Add the customer's contact and delivery details so staff can receive, inspect, and follow up on the quote.",
  },
  done: {
    title: "Your quote has been submitted",
    intro: "The status below shows what has been completed, what happens next, and what Milford Photo will do after the gear arrives.",
  },
};

const PRODUCT_IMAGE_OVERRIDES = {
  "canon|digital camera|eos r1": {
    src: "https://cipher.dakiscdn.com/i/https://dakis-product-images.s3.bhs.io.cloud.ovh.net/zKX3tO1Y418zyXvWDdhMyA?w=228&h=228&p=1&a=1&q=display",
    alt: "Canon EOS R1 mirrorless camera body",
  },
  "canon|digital camera|eos r3": {
    src: "https://cipher.dakiscdn.com/i/https://dakis-product-images.s3.bhs.io.cloud.ovh.net/1N9swG-W0VWJMfH94N3hcA?w=228&h=228&p=1&a=1&q=display",
    alt: "Canon EOS R3 mirrorless camera body",
  },
  "canon|digital camera|eos r5": {
    src: "https://cipher.dakiscdn.com/i/https://dakis-product-images.s3.bhs.io.cloud.ovh.net/_JAE4kY4rOGIG92I_Z6tRw?w=228&h=228&p=1&a=1&q=display",
    alt: "Canon EOS R5 mirrorless camera body",
  },
  "canon|lens|rf 28-70mm f/2l usm": {
    src: "https://cipher.dakiscdn.com/i/https://dakis-product-images.s3.bhs.io.cloud.ovh.net/0wK_VW4xvh2EFG3vvyr5lA?w=228&h=228&p=1&a=1&q=display",
    alt: "Canon RF 28-70mm f/2L USM lens",
  },
  "canon|lens|rf 24-70mm f/2.8l is usm": {
    src: "https://cipher.dakiscdn.com/i/https://dakis-product-images.s3.bhs.io.cloud.ovh.net/XqaYHa67tlGK95BTtMIQug?w=228&h=228&p=1&a=1&q=display",
    alt: "Canon RF 24-70mm f/2.8L IS USM lens",
  },
  "canon|lens|rf 70-200mm f/2.8l is usm": {
    src: "https://cipher.dakiscdn.com/i/https://dakis-product-images.s3.bhs.io.cloud.ovh.net/LyWF9ixt27HyPRXeLYug8w?w=228&h=228&p=1&a=1&q=display",
    alt: "Canon RF 70-200mm f/2.8L IS USM lens",
  },
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

const state = {
  activeStep: "gear",
  cart: [],
  currentItem: null,
  currentQuote: null,
  currentQuoteLoading: false,
  currentQuoteRequest: 0,
  currentQuoteTimer: null,
  cartQuoteLoading: false,
  cartQuoteRequest: 0,
  cartQuoteTimer: null,
  quote: null,
  submission: null,
  frameResizePending: false,
};

const els = {
  appTitle: byId("app-title"),
  appIntro: byId("app-intro"),
  brand: byId("brand"),
  category: byId("category"),
  model: byId("model"),
  gearSearch: byId("gear-search"),
  gearSearchOptions: byId("gear-search-options"),
  gearSearchResults: byId("gear-search-results"),
  mountField: byId("mount-field"),
  lensMount: byId("lens-mount"),
  includedItems: byId("included-items"),
  manualFields: byId("manual-fields"),
  manualBrand: byId("manual-brand"),
  manualModel: byId("manual-model"),
  addItem: byId("add-item"),
  getQuote: byId("get-quote"),
  quoteResults: byId("quote-results"),
  quoteMessage: byId("quote-message"),
  acceptQuote: byId("accept-quote"),
  submitForm: byId("submit-form"),
  sellerFirstName: byId("seller-first-name"),
  sellerLastName: byId("seller-last-name"),
  sellerEmail: byId("seller-email"),
  sellerPhone: byId("seller-phone"),
  mailCopy: byId("mail-option-copy"),
  addressFields: byId("address-fields"),
  parcelFields: byId("parcel-fields"),
  street: byId("street"),
  city: byId("city"),
  stateField: byId("state"),
  zip: byId("zip"),
  parcelLength: byId("parcel-length"),
  parcelWidth: byId("parcel-width"),
  parcelHeight: byId("parcel-height"),
  parcelWeight: byId("parcel-weight"),
  terms: byId("terms"),
  submitQuote: byId("submit-quote"),
  doneTitle: byId("done-title"),
  doneCopy: byId("done-copy"),
  doneNextSteps: byId("done-next-steps"),
  labelLink: byId("label-link"),
  quoteRef: byId("quote-ref"),
  currentOfferCard: byId("current-offer-card"),
  currentOfferCash: byId("current-offer-cash"),
  currentOfferCredit: byId("current-offer-credit"),
  summaryCash: byId("summary-cash"),
  summarySubtitle: byId("summary-subtitle"),
  summaryCredit: byId("summary-credit"),
  summaryCreditCard: byId("summary-credit-card"),
  summaryCreditFeature: byId("summary-credit-feature"),
  summaryRouting: byId("summary-routing"),
  summaryLabel: byId("summary-label"),
  cartList: byId("cart-list"),
  statusPanel: byId("status-panel"),
  conditionGuideOpen: byId("condition-guide-open"),
  conditionGuideModal: byId("condition-guide-modal"),
  conditionGuideClose: byId("condition-guide-close"),
};

function byId(id) {
  return document.getElementById(id);
}

function resolveApiBase() {
  if (CONFIG.apiBase) return CONFIG.apiBase.replace(/\/$/, "");
  const host = window.location.hostname;
  if (window.location.protocol === "file:" || host === "localhost" || host === "127.0.0.1") {
    return "http://localhost:8787";
  }
  return "https://milford-used-gear-system-mvp.milfordphoto.workers.dev";
}

function init() {
  populateCategories();
  populateBrands();
  populateGearSearch();
  renderIncludedItems();
  bindEvents();
  renderCart();
  renderCurrentOffer();
  renderSummary();
  updateDeliveryFields();
  setStep("gear");
  scheduleCurrentOffer();
  resizeParentFrame();
}

function bindEvents() {
  els.gearSearch.addEventListener("change", applyGearSearch);
  els.gearSearch.addEventListener("focus", renderGearSearchResults);
  els.gearSearch.addEventListener("input", () => {
    renderGearSearchResults();
    const exactMatch = gearSearchOptions().find((option) => isExactGearSearchMatch(option, els.gearSearch.value));
    if (exactMatch) applyGearSearch();
  });
  els.gearSearch.addEventListener("keydown", (event) => {
    if (event.key === "Escape") hideGearSearchResults();
  });
  els.gearSearchResults.addEventListener("pointerdown", (event) => {
    const button = event.target.closest("[data-gear-search-key]");
    if (!button) return;
    event.preventDefault();
    const match = gearSearchOptions().find((option) => gearSearchKey(option) === button.dataset.gearSearchKey);
    if (match) applyGearSearchOption(match);
  });
  document.addEventListener("click", (event) => {
    if (event.target === els.gearSearch || els.gearSearchResults.contains(event.target)) return;
    hideGearSearchResults();
  });
  els.brand.addEventListener("change", () => {
    clearGearSearch();
    populateModels();
    renderIncludedItems();
    updateMountField();
    updateManualFields();
    scheduleCurrentOffer();
  });
  els.category.addEventListener("change", () => {
    clearGearSearch();
    populateBrands();
    populateModels();
    renderIncludedItems();
    updateMountField();
    updateManualFields();
    scheduleCurrentOffer();
  });
  els.model.addEventListener("change", () => {
    clearGearSearch();
    updateMountField();
    updateManualFields();
    scheduleCurrentOffer();
  });
  els.lensMount.addEventListener("change", () => {
    scheduleCurrentOffer();
  });
  document.querySelectorAll('input[name="condition"]').forEach((input) =>
    input.addEventListener("change", () => {
      scheduleCurrentOffer();
    }),
  );
  els.conditionGuideOpen.addEventListener("click", openConditionGuide);
  els.conditionGuideClose.addEventListener("click", closeConditionGuide);
  els.conditionGuideModal.addEventListener("click", (event) => {
    if (event.target === els.conditionGuideModal) closeConditionGuide();
  });
  els.addItem.addEventListener("click", addCurrentItem);
  els.getQuote.addEventListener("click", getQuote);
  els.submitForm.addEventListener("submit", submitQuote);

  document.querySelectorAll("[data-step-target]").forEach((button) => {
    button.addEventListener("click", () => setStep(button.dataset.stepTarget));
  });

  document.querySelectorAll('input[name="delivery"]').forEach((input) => {
    input.addEventListener("change", updateDeliveryFields);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !els.conditionGuideModal.hidden) closeConditionGuide();
  });

  window.addEventListener("resize", resizeParentFrame);
  window.addEventListener("load", resizeParentFrame);
  window.addEventListener("message", handleParentFrameMessage);
  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver(resizeParentFrame);
    resizeObserver.observe(document.documentElement);
    if (document.body) resizeObserver.observe(document.body);
  }
  if ("MutationObserver" in window && document.body) {
    new MutationObserver(resizeParentFrame).observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true,
      characterData: true,
    });
  }
  [100, 500, 1000, 2000, 4000].forEach((delay) => window.setTimeout(resizeParentFrame, delay));
}

function populateBrands() {
  const previous = els.brand.value;
  const category = els.category.value;
  if (!category) {
    els.brand.innerHTML = `<option value="${SELECT_BRAND}">Select brand</option>`;
    populateModels();
    return;
  }
  const brands = safeCatalogBrandsForCategory(category);
  els.brand.innerHTML = [
    `<option value="${SELECT_BRAND}">Select brand</option>`,
    ...brands.map((brand) => `<option value="${escapeAttribute(brand)}">${escapeHtml(brand)}</option>`),
    `<option value="${MANUAL_BRAND}">Other / not listed</option>`,
  ].join("");
  els.brand.value = brands.includes(previous) || previous === MANUAL_BRAND ? previous : SELECT_BRAND;
  populateModels();
}

function populateCategories() {
  const previous = els.category.value;
  const uniqueCategories = safeCatalogAllCategories();
  els.category.innerHTML = [
    `<option value="${SELECT_CATEGORY}">Select category</option>`,
    ...uniqueCategories.map((category) => `<option value="${escapeAttribute(category)}">${escapeHtml(category)}</option>`),
  ].join("");
  if (uniqueCategories.includes(previous)) els.category.value = previous;
}

function populateModels() {
  const brand = els.brand.value;
  const category = els.category.value;
  if (!category || !brand) {
    els.model.innerHTML = `<option value="${SELECT_MODEL}">Select model</option>`;
    return;
  }
  const items = brand === MANUAL_BRAND ? [] : sortCatalogItemsForDisplay(uniqueCatalogItems(safeCatalogItems(brand, category)), category);
  els.model.innerHTML = [
    `<option value="${SELECT_MODEL}">Select model</option>`,
    ...items.map((item) => `<option value="${escapeAttribute(item.name)}">${escapeHtml(catalogDisplayName(item, category))}</option>`),
    `<option value="${MANUAL_MODEL}">Other / not listed</option>`,
  ].join("");
}

function populateGearSearch() {
  els.gearSearchOptions.innerHTML = gearSearchOptions()
    .map((option) => `<option value="${escapeAttribute(option.label)}"></option>`)
    .join("");
  renderGearSearchResults();
}

function gearSearchOptions() {
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

function renderGearSearchResults() {
  const query = els.gearSearch.value.trim();
  const matches = matchingGearSearchOptions(query).slice(0, SEARCH_RESULT_LIMIT);
  if (!query || !matches.length) {
    hideGearSearchResults();
    return;
  }

  els.gearSearchResults.innerHTML = matches
    .map(
      (option) => {
        const image = productImageForOption(option);
        return `
        <button class="gear-search-result" type="button" data-gear-search-key="${escapeAttribute(gearSearchKey(option))}">
          ${productImageMarkup(image, "gear-search-thumb")}
          <span class="gear-search-result-copy">
            <strong>${escapeHtml(option.brand)} ${escapeHtml(catalogDisplayName({ name: option.model }, option.category))}</strong>
            <small>${escapeHtml(option.category)}</small>
          </span>
        </button>
      `;
      },
    )
    .join("");
  els.gearSearchResults.hidden = false;
}

function openConditionGuide() {
  els.conditionGuideModal.hidden = false;
  document.body.classList.add("modal-open");
  els.conditionGuideClose.focus();
  resizeParentFrame();
}

function closeConditionGuide() {
  els.conditionGuideModal.hidden = true;
  document.body.classList.remove("modal-open");
  els.conditionGuideOpen.focus();
  resizeParentFrame();
}

function hideGearSearchResults() {
  els.gearSearchResults.hidden = true;
  els.gearSearchResults.innerHTML = "";
}

function matchingGearSearchOptions(query) {
  const tokens = gearSearchTokens(query);
  if (!tokens.length) return [];
  return gearSearchOptions()
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

function productImageFor(item = {}) {
  const key = productImageKey(item.brand, item.category, item.model);
  return PRODUCT_IMAGE_OVERRIDES[key] || null;
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

function productImageMarkup(image, className) {
  if (!image?.src) return `<span class="${escapeAttribute(className)} is-placeholder" aria-hidden="true"></span>`;
  return `<img class="${escapeAttribute(className)}" src="${escapeAttribute(image.src)}" alt="${escapeAttribute(image.alt || "")}" loading="lazy" />`;
}

function applyGearSearch() {
  const query = els.gearSearch.value.trim();
  if (!query) return;
  const options = gearSearchOptions();
  const match = options.find((option) => isExactGearSearchMatch(option, query)) || matchingGearSearchOptions(query)[0];
  if (!match) return;

  applyGearSearchOption(match);
}

function applyGearSearchOption(match) {
  els.category.value = match.category;
  populateBrands();
  els.brand.value = match.brand;
  populateModels();
  els.model.value = match.model;
  updateMountField();
  updateManualFields();
  renderIncludedItems();
  els.gearSearch.value = match.label;
  hideGearSearchResults();
  scheduleCurrentOffer();
}

function clearGearSearch() {
  els.gearSearch.value = "";
  hideGearSearchResults();
}

function updateManualFields() {
  const needsManualText = els.brand.value === MANUAL_BRAND || els.model.value === MANUAL_MODEL;
  els.manualFields.hidden = !needsManualText;
  els.manualBrand.required = els.brand.value === MANUAL_BRAND;
  els.manualModel.required = needsManualText;
  resizeParentFrame();
}

function updateMountField() {
  const required = needsLensMount();
  renderMountOptions();
  els.mountField.hidden = !required;
  els.lensMount.required = required;
  resizeParentFrame();
}

function renderMountOptions() {
  const selectedMount = els.lensMount.value;
  const mounts = mountOptionsForSelectedLens();
  els.lensMount.innerHTML = [
    `<option value="">Select mount</option>`,
    ...mounts.map((mount) => `<option value="${escapeAttribute(mount)}">${escapeHtml(mount)}</option>`),
  ].join("");
  els.lensMount.value = mounts.includes(selectedMount) ? selectedMount : "";
}

function needsLensMount() {
  return mountOptionsForSelectedLens().length > 1;
}

function mountOptionsForSelectedLens() {
  if (!els.category.value.toLowerCase().includes("lens")) return [];
  const catalogItem = selectedCatalogItem();
  const inferredMounts = catalogMountsForItem(els.brand.value, els.category.value, catalogItem);
  if (inferredMounts.length) return inferredMounts;

  const brand = els.brand.value.toLowerCase();
  const category = els.category.value.toLowerCase();
  const model = els.model.value === MANUAL_MODEL ? els.manualModel.value : els.model.value;
  const text = `${category} ${model}`.toLowerCase();
  const explicit = mountsFromText(text);
  if (explicit.length) return explicit;

  if (brand.includes("sigma")) {
    if (text.includes("dg dn")) return ["Sony E", "L-Mount"];
    if (text.includes("dc dn")) return ["Sony E", "Fujifilm X", "Micro Four Thirds"];
    if (text.includes("70mm f/2.8 dg macro")) return ["L-Mount", "Sony E", "Sigma SA", "Canon EF"];
    if (text.includes("dg hsm") || text.includes("os hsm")) return ["Canon EF", "Nikon F"];
  }
  if (brand.includes("tamron")) {
    if (text.includes("mirrorless") || text.includes("di iii")) return ["Sony E"];
    return ["Canon EF", "Nikon F"];
  }
  if (brand.includes("tokina")) {
    if (text.includes("sony e")) return ["Sony E"];
    if (text.includes("opera")) return ["Canon EF", "Nikon F"];
    return ["Canon EF", "Nikon F", "Sony E"];
  }
  if (brand.includes("zeiss")) {
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

function catalogCategoryForItem(brand, displayCategory, itemName) {
  for (const catalogCategory of catalogCategoriesForDisplay(brand, displayCategory)) {
    if (typeof getCatalogItems !== "function") continue;
    if (getCatalogItems(brand, catalogCategory).some((item) => item.name === itemName)) return catalogCategory;
  }
  return "";
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

function renderIncludedItems() {
  const items = expectedIncludedItemsForCategory(els.category.value);
  if (!items.length) {
    els.includedItems.innerHTML = `
      <div class="included-copy">
        <span>Instant price includes standard original manufacturer accessories when applicable.</span>
      </div>
    `;
    return;
  }
  els.includedItems.innerHTML = `
    <div class="included-copy">
      <span>Instant price includes all standard original manufacturer accessories.</span>
    </div>
  `;
}

function includedItemsForCategory(category = "") {
  const text = category.toLowerCase();
  if (!text) return [];
  if (text.includes("film")) return INCLUDED_ITEMS.filmCamera;
  if (text.includes("lens")) return INCLUDED_ITEMS.lens;
  if (text.includes("camera") || text.includes("body") || text.includes("dslr") || text.includes("mirrorless")) return INCLUDED_ITEMS.camera;
  return INCLUDED_ITEMS.default;
}

function expectedIncludedItemsForCategory(category = "") {
  return includedItemsForCategory(category).filter((item) => !item.bonus);
}

function selectedIncludedAccessoriesForCategory(category = "") {
  const expected = expectedIncludedItemsForCategory(category);
  const checkedInputs = [...els.includedItems.querySelectorAll("input[data-accessory-name]:checked")];
  if (!checkedInputs.length && !els.includedItems.querySelector("input[data-accessory-name]")) {
    return expected.filter((item) => item.checked).map((item) => item.name);
  }
  return checkedInputs.map((input) => input.dataset.accessoryName).filter(Boolean);
}

function missingIncludedAccessoriesForCategory(category = "") {
  const selected = new Set(selectedIncludedAccessoriesForCategory(category).map((name) => name.toLowerCase()));
  return expectedIncludedItemsForCategory(category).filter((item) => !selected.has(item.name.toLowerCase()));
}

function renderAccessoryAdjustments() {
  const missing = [];
  els.includedItems.querySelectorAll(".accessory-check").forEach((label) => {
    const input = label.querySelector("input[data-accessory-name]");
    const status = label.querySelector("[data-accessory-status]");
    if (!input || !status) return;
    const value = Number(input.dataset.accessoryValue || 0);
    const isMissing = !input.checked;
    label.classList.toggle("is-missing", isMissing);
    status.textContent = isMissing ? `Missing: -${money.format(value)}` : "Included";
    if (isMissing) missing.push({ name: input.dataset.accessoryName, value });
  });
  const summary = els.includedItems.querySelector("[data-accessory-summary]");
  if (!summary) return;
  const total = missing.reduce((sum, item) => sum + item.value, 0);
  summary.textContent = total
    ? `Current offer reduced by ${money.format(total)} for missing original manufacturer accessories.`
    : "No accessory deductions selected.";
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
  const index = prefixes.findIndex((prefix) => text.startsWith(prefix));
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

function selectedCatalogItem() {
  const selectedBrand = els.brand.value;
  const selectedCategory = els.category.value;
  const selectedModel = els.model.value;
  if (!selectedBrand || !selectedCategory || !selectedModel || selectedBrand === MANUAL_BRAND || selectedModel === MANUAL_MODEL) return null;
  return safeCatalogItem(selectedBrand, selectedCategory, selectedModel);
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
  if (!displayCategory) return catalogCategories;
  if (displayCategory === MANUAL_CATEGORY) return catalogCategories.filter(catalogCategoryBelongsToManualReview);
  const matches = catalogCategories.filter((catalogCategory) => categoryMatchesDisplay(catalogCategory, displayCategory));
  return matches.length ? matches : catalogCategories.filter((catalogCategory) => catalogCategory === displayCategory);
}

function displayCategoryForCatalog(catalogCategory = "") {
  if (catalogCategoryBelongsToManualReview(catalogCategory)) return MANUAL_CATEGORY;
  return SIMPLE_CATEGORIES.find((displayCategory) => categoryMatchesDisplay(catalogCategory, displayCategory)) || catalogCategory;
}

function categoryMatchesDisplay(catalogCategory = "", displayCategory = "") {
  const catalog = catalogCategory.toLowerCase();
  const display = displayCategory.toLowerCase();
  if (displayCategory === MANUAL_CATEGORY) return catalogCategoryBelongsToManualReview(catalogCategory) || catalogCategory === MANUAL_CATEGORY;
  if (catalogCategoryBelongsToManualReview(catalogCategory)) return false;
  if (display === "lens") return catalog.includes("lens");
  if (display === "film camera") return catalog.includes("camera body") && catalog.includes("film");
  if (display === "digital camera") return catalog.includes("camera body") && !categoryMatchesDisplay(catalogCategory, "Film Camera");
  if (display === "flash / lighting") return catalog.includes("flash") || catalog.includes("speedlight") || catalog.includes("strobe") || catalog.includes("lighting");
  if (display === "video / cinema gear") return catalog.includes("video") || catalog.includes("cinema") || catalog.includes("camcorder");
  return catalog === display;
}

function catalogCategoryBelongsToManualReview(catalogCategory = "") {
  const text = String(catalogCategory).toLowerCase();
  return (
    text.includes("tripod") ||
    text.includes("monopod") ||
    text.includes("support") ||
    text.includes("bag") ||
    text.includes("case") ||
    text.includes("filter")
  );
}

function addCurrentItem() {
  const item = readItemForm();
  if (!item) return false;
  state.cart.push(item);
  state.quote = null;
  state.cartQuoteLoading = true;
  renderCart();
  renderSummary();
  scheduleCartQuote();
  setStatus(`${item.brand} ${item.model} added.`, "success");
  return true;
}

function readItemForm(options = {}) {
  const selectedBrand = els.brand.value;
  const selectedCategory = els.category.value;
  const selectedModel = els.model.value;
  const catalogItem =
    selectedBrand !== MANUAL_BRAND && selectedModel !== MANUAL_MODEL
      ? safeCatalogItem(selectedBrand, selectedCategory, selectedModel)
      : null;

  const brand = selectedBrand === MANUAL_BRAND ? els.manualBrand.value.trim() : selectedBrand;
  let model = selectedModel === MANUAL_MODEL ? els.manualModel.value.trim() : catalogQuoteModel(catalogItem, selectedModel, selectedCategory);
  const condition = selectedRadioValue("condition");
  const accessories = selectedIncludedAccessoriesForCategory(selectedCategory);
  const missingAccessories = missingIncludedAccessoriesForCategory(selectedCategory);
  const validMounts = mountOptionsForSelectedLens();
  const requiresMountSelection = validMounts.length > 1;
  const mount = requiresMountSelection ? els.lensMount.value.trim() : validMounts[0] || "";
  const catalogCategory = catalogItem ? catalogCategoryForItem(brand, selectedCategory, catalogItem.name) : selectedCategory;
  const isManualReviewItem = selectedCategory === MANUAL_CATEGORY || catalogCategoryBelongsToManualReview(catalogCategory);
  const notes = [
    mount ? `Lens mount: ${mount}` : "",
    accessories.length ? `Original manufacturer accessories included for quote: ${accessories.join(", ")}` : "",
    missingAccessories.length ? `Original manufacturer accessories missing: ${missingAccessories.map((item) => `${item.name} (-${money.format(item.value)})`).join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  if (
    !selectedCategory ||
    !selectedBrand ||
    !selectedModel ||
    !brand ||
    !model ||
    model === MANUAL_MODEL ||
    (requiresMountSelection && (!mount || !validMounts.includes(mount)))
  ) {
    if (!options.silent) {
      const message = !selectedCategory
        ? "Please select a category before adding the item."
        : !selectedBrand
          ? "Please select a brand before adding the item."
          : !selectedModel
            ? "Please select a model before adding the item."
            : requiresMountSelection && (!mount || !validMounts.includes(mount))
              ? "Please select a valid lens mount before adding the item."
              : "Please enter the brand and model before adding the item.";
      setStatus(message, "error");
    }
    return null;
  }

  return {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    brand,
    category: selectedCategory,
    catalogCategory: catalogItem ? catalogCategory : "",
    model,
    year: catalogItem?.year || "",
    condition,
    notes,
    includedItems: accessories,
    mount,
    pricingKey: catalogItem?.pricingKey || "",
    productFamily: catalogItem?.productFamily || "",
    generation: catalogItem?.generation || "",
    ebayQuery: buildEbayQueryForCatalogItem({ brand, model, mount, catalogItem }),
    isManual: isManualReviewItem,
    manualReviewRequested: isManualReviewItem || Boolean(catalogItem?.manualReview),
  };
}

function buildEbayQueryForCatalogItem({ brand, model, mount, catalogItem }) {
  const baseQuery = catalogItem?.ebayQuery || `${brand} ${model}`;
  return mount ? `${baseQuery} ${mount}` : baseQuery;
}

function selectedRadioValue(name) {
  return document.querySelector(`input[name="${name}"]:checked`)?.value;
}

async function getQuote() {
  clearStatus();
  const quoteItems = state.cart;
  if (!quoteItems.length) {
    if (readItemForm({ silent: true })) {
      setStatus("Add this item to the quote before reviewing the offer.", "error");
    } else {
      readItemForm({ silent: false });
    }
    return;
  }

  els.getQuote.disabled = true;
  els.getQuote.textContent = "Pricing...";

  try {
    await fetchCartQuoteNow();
    setStep("quote");
  } catch (error) {
    setStatus(error.message || "Unable to get a quote right now.", "error");
  } finally {
    els.getQuote.disabled = false;
    els.getQuote.textContent = "Review offer";
  }
}

function scheduleCurrentOffer() {
  if (state.activeStep !== "gear") return;
  clearTimeout(state.currentQuoteTimer);
  state.currentQuoteTimer = setTimeout(updateCurrentOffer, 350);
}

function scheduleCartQuote() {
  clearTimeout(state.cartQuoteTimer);
  state.cartQuoteTimer = setTimeout(fetchCartQuoteNow, 250);
}

async function updateCurrentOffer() {
  const item = readItemForm({ silent: true });
  state.currentItem = item;
  state.currentQuote = null;

  if (!item) {
    state.currentQuoteLoading = false;
    renderCurrentOffer();
    return;
  }

  const requestId = (state.currentQuoteRequest += 1);
  state.currentQuoteLoading = true;
  renderCurrentOffer();

  try {
    const { id, ...priceItem } = item;
    const data = await apiPost("/api/quote", {
      items: [priceItem],
    });
    if (requestId !== state.currentQuoteRequest) return;
    state.currentQuote = data;
    state.currentQuoteLoading = false;
    renderCurrentOffer();
  } catch (error) {
    if (requestId !== state.currentQuoteRequest) return;
    state.currentQuote = {
      error: error.message || "Unable to price this item right now.",
    };
    state.currentQuoteLoading = false;
    renderCurrentOffer();
  }
}

async function fetchCartQuoteNow() {
  if (!state.cart.length) {
    state.cartQuoteLoading = false;
    state.quote = null;
    renderCart();
    renderSummary();
    updateDeliveryFields();
    return null;
  }

  const requestId = (state.cartQuoteRequest += 1);
  state.cartQuoteLoading = true;
  renderCart();
  renderSummary();

  try {
    const data = await apiPost("/api/quote", {
      items: state.cart.map(({ id, ...item }) => item),
    });
    if (requestId !== state.cartQuoteRequest) return null;
    state.quote = data;
    state.cartQuoteLoading = false;
    renderQuote(data);
    renderCart();
    renderSummary();
    updateDeliveryFields();
    return data;
  } catch (error) {
    if (requestId !== state.cartQuoteRequest) return null;
    state.quote = null;
    state.cartQuoteLoading = false;
    renderCart();
    renderSummary();
    setStatus(error.message || "Quote failed to fetch.", "error");
    throw error;
  }
}

async function submitQuote(event) {
  event.preventDefault();
  if (!state.quote?.quoteToken) {
    setStatus("Please get an offer before submitting.", "error");
    setStep("gear");
    return;
  }

  els.submitQuote.disabled = true;
  els.submitQuote.textContent = "Submitting...";
  clearStatus();

  try {
    const delivery = selectedRadioValue("delivery") || "ship";
    const firstName = els.sellerFirstName.value.trim();
    const lastName = els.sellerLastName.value.trim();
    const data = await apiPost("/api/submit", {
      quoteToken: state.quote.quoteToken,
      seller: {
        firstName,
        lastName,
        name: [firstName, lastName].filter(Boolean).join(" "),
        email: els.sellerEmail.value.trim(),
        phone: els.sellerPhone.value.trim(),
        address: {
          street: els.street.value.trim(),
          city: els.city.value.trim(),
          state: els.stateField.value.trim(),
          zip: els.zip.value.trim(),
        },
      },
      delivery,
      parcel: {
        length: numberOrNull(els.parcelLength.value),
        width: numberOrNull(els.parcelWidth.value),
        height: numberOrNull(els.parcelHeight.value),
        weight: numberOrNull(els.parcelWeight.value),
      },
    });

    state.submission = data;
    renderDone(data);
    setStep("done");
  } catch (error) {
    setStatus(error.message || "Unable to submit the quote right now.", "error");
  } finally {
    els.submitQuote.disabled = false;
    updateSubmitQuoteButtonLabel();
  }
}

async function apiPost(path, payload) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || data.detail || `Request failed with ${response.status}`);
  return data;
}

function renderCurrentOffer() {
  els.currentOfferCard.classList.toggle("is-loading", state.currentQuoteLoading);
  els.currentOfferCard.classList.toggle("is-error", Boolean(state.currentQuote?.error));

  if (!state.currentItem) {
    els.currentOfferCash.textContent = "Choose gear";
    els.currentOfferCredit.textContent = "Price appears here before the item is added.";
    return;
  }

  if (state.currentQuoteLoading) {
    els.currentOfferCash.textContent = "Pricing...";
    els.currentOfferCredit.textContent = "Checking the current item.";
    return;
  }

  if (state.currentQuote?.error) {
    els.currentOfferCash.textContent = "Review";
    els.currentOfferCredit.textContent = state.currentQuote.error;
    return;
  }

  const quoteItem = state.currentQuote?.items?.[0];
  if (!quoteItem) {
    els.currentOfferCash.textContent = "Price pending";
    els.currentOfferCredit.textContent = `${state.currentItem.brand} ${state.currentItem.model}`;
    return;
  }

  els.currentOfferCash.textContent = priceLabelForQuoteItem(quoteItem);
  els.currentOfferCredit.textContent = quoteItem.storeCreditAmount
    ? `${money.format(quoteItem.storeCreditAmount)} store credit`
    : quoteItem.message || `${state.currentItem.brand} ${state.currentItem.model}`;
}

function renderCart() {
  updateQuoteActionVisibility();
  if (!state.cart.length) {
    els.cartList.innerHTML = `<div class="cart-item"><span class="cart-meta">Add gear to build the quote summary.</span></div>`;
    return;
  }

  els.cartList.innerHTML = state.cart
    .map(
      (item, index) => {
        const quoteItem = state.quote?.items?.[index];
        const price = cartItemPriceLabel(quoteItem);
        const storeCredit = quoteItem?.storeCreditAmount ? `${money.format(quoteItem.storeCreditAmount)} store credit` : "";
        const image = productImageFor(item);
        return `
        <article class="cart-item">
          ${productImageMarkup(image, "product-thumb")}
          <div class="cart-body">
            <div class="cart-title">
              <strong>${escapeHtml(item.brand)} ${escapeHtml(item.model)}</strong>
              <div class="cart-actions">
                <span class="cart-price">${escapeHtml(price)}</span>
                <button class="remove-item" type="button" aria-label="Remove item" data-remove-id="${escapeAttribute(item.id)}">x</button>
              </div>
            </div>
            <span class="cart-meta">${escapeHtml(item.category)} · ${escapeHtml(CONDITION_LABELS[item.condition] || item.condition)}${storeCredit ? `<br />${escapeHtml(storeCredit)}` : ""}</span>
          </div>
        </article>
      `;
      },
    )
    .join("");

  document.querySelectorAll("[data-remove-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.cart = state.cart.filter((item) => item.id !== button.dataset.removeId);
      state.quote = null;
      state.cartQuoteLoading = true;
      renderCart();
      renderSummary();
      scheduleCartQuote();
    });
  });
}

function updateQuoteActionVisibility() {
  els.getQuote.hidden = !state.cart.length;
}

function cartItemPriceLabel(quoteItem) {
  if (state.cartQuoteLoading) return "Pricing...";
  return priceLabelForQuoteItem(quoteItem);
}

function priceLabelForQuoteItem(quoteItem) {
  if (!quoteItem) return "Pending";
  if (quoteItem.offerAmount) return money.format(quoteItem.offerAmount);
  if (quoteItem.status === "declined") return "$0";
  return "Review";
}

function renderQuote(quote) {
  els.quoteResults.innerHTML = quote.items.map(renderQuoteItem).join("");
  els.quoteMessage.textContent = quote.routing.message;
  els.acceptQuote.textContent = quote.routing.declinedOnly ? "Not eligible online" : quote.totals.cash > 0 ? "Continue" : "Submit for review";
  els.acceptQuote.disabled = Boolean(quote.routing.declinedOnly);
}

function renderQuoteItem(item) {
  const statusClass = item.status === "quoted" ? "quoted" : item.status === "declined" ? "declined" : "review";
  const price = item.offerAmount ? money.format(item.offerAmount) : item.status === "declined" ? "$0" : "Review";
  const credit = item.storeCreditAmount ? `${money.format(item.storeCreditAmount)} store credit` : item.message || "Staff follow-up needed";
  const marketCopy = item.marketPrice ? `Market estimate: ${money.format(item.marketPrice)}` : item.message || "";
  const image = productImageFor(item);

  return `
    <article class="quote-item">
      ${productImageMarkup(image, "product-thumb")}
      <div class="quote-body">
        <div class="quote-title">
          <strong>${escapeHtml(item.brand)} ${escapeHtml(item.model)}</strong>
          <span class="status-pill ${statusClass}">${escapeHtml(STATUS_LABELS[item.status] || item.status)}</span>
        </div>
        <div class="quote-meta">
          ${escapeHtml(CONDITION_LABELS[item.condition] || item.condition)} · ${escapeHtml(item.category)}
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

function renderSummary() {
  if (state.cartQuoteLoading) {
    els.quoteRef.textContent = "Draft";
    els.summaryCash.textContent = "Pricing...";
    els.summarySubtitle.textContent = "Pricing added items.";
    els.summaryCredit.textContent = "-";
    els.summaryCreditFeature.textContent = "-";
    els.summaryCreditCard.hidden = true;
    els.summaryRouting.textContent = "Updating quote";
    els.summaryLabel.textContent = "Calculated after quote";
    return;
  }

  if (!state.quote) {
    els.quoteRef.textContent = "Draft";
    els.summaryCash.textContent = state.cart.length ? `${state.cart.length} item${state.cart.length === 1 ? "" : "s"}` : "Add gear";
    els.summarySubtitle.textContent = state.cart.length ? "Ready for server pricing." : "Server-priced offer appears here.";
    els.summaryCredit.textContent = "-";
    els.summaryCreditFeature.textContent = "-";
    els.summaryCreditCard.hidden = true;
    els.summaryRouting.textContent = state.cart.length ? "Ready to quote" : "Awaiting gear";
    els.summaryLabel.textContent = "Calculated after quote";
    return;
  }

  els.quoteRef.textContent = state.quote.quoteId;
  const declinedOnly = Boolean(state.quote.routing?.declinedOnly);
  els.summaryCash.textContent = declinedOnly ? "Declined" : state.quote.totals.cash ? money.format(state.quote.totals.cash) : "Review";
  els.summarySubtitle.textContent = declinedOnly
    ? "Not eligible for an online offer"
    : state.quote.totals.cash
      ? `Cash offer valid through ${formatDate(state.quote.expiresAt)}`
      : "Manual review request";
  els.summaryCredit.textContent = state.quote.totals.storeCredit ? money.format(state.quote.totals.storeCredit) : "-";
  els.summaryCreditFeature.textContent = state.quote.totals.storeCredit ? money.format(state.quote.totals.storeCredit) : "-";
  els.summaryCreditCard.hidden = !state.quote.totals.storeCredit;
  els.summaryRouting.textContent = state.quote.routing.message;
  els.summaryLabel.textContent = declinedOnly
    ? "No shipping label"
    : state.quote.routing.freeLabelEligible
    ? "Free prepaid inbound label"
    : state.quote.routing.requiresStaffBeforeLabel
      ? "Staff approval first"
      : `Below ${money.format(state.quote.policy.freeShippingMin)} threshold`;
}

function renderDone(result) {
  els.doneTitle.textContent = `Quote ${result.quoteRef} submitted`;
  els.doneCopy.textContent = doneIntroFor(result);
  els.doneNextSteps.innerHTML = renderDoneNextSteps(result);
  if (result.labelUrl) {
    els.labelLink.href = result.labelUrl;
    els.labelLink.hidden = false;
  } else {
    els.labelLink.hidden = true;
  }
  renderSummary();
}

function doneIntroFor(result = {}) {
  const delivery = selectedRadioValue("delivery") || "ship";
  if (result.labelUrl) {
    return "Milford Photo received your quote and your prepaid shipping label is ready. The label and quote are valid for 7 days. Follow the status below to see what has been completed and what happens next.";
  }
  if (delivery === "dropoff") {
    return "Milford Photo received your quote. Follow the status below to see what has been completed and what happens when you bring the gear in.";
  }
  return "Milford Photo received your quote. Follow the status below to see what has been completed, what to do next, and what happens after your gear arrives.";
}

function renderDoneNextSteps(result = {}) {
  const delivery = selectedRadioValue("delivery") || "ship";
  const quoteRef = result.quoteRef || state.quote?.quoteId || "your quote";
  const hasLabel = Boolean(result.labelUrl);
  const freeLabelExpected = Boolean(result.labelDryRun || state.quote?.routing?.freeLabelEligible);
  const requiresStaffFirst = Boolean(state.quote?.routing?.requiresStaffBeforeLabel);

  const currentStep = delivery === "dropoff"
    ? {
        title: "Bring in your gear",
        copy: `Bring the items and quote ${quoteRef} to Milford Photo. Staff will look up the quote and check each item in at the counter.`,
      }
    : hasLabel
      ? {
          title: "Ship your gear",
          copy: "Print the prepaid label, pack the gear securely, and drop it off with the carrier within 7 days.",
        }
      : freeLabelExpected
        ? {
            title: "Ship your gear",
            copy: "Milford Photo will email the prepaid label and packing instructions. The label will be valid for 7 days after it is created.",
          }
        : requiresStaffFirst
          ? {
              title: "Watch for staff follow-up",
              copy: "Milford Photo will review the submission and email the next step, usually within 1 business day.",
            }
          : {
              title: "Choose mail-in or drop-off",
              copy: "Milford Photo will email shipping options within 1 business day, or you can bring the gear to the store with this quote number.",
            };

  const steps = [
    {
      stepLabel: "Step 1",
      title: "Receive quote",
      status: "complete",
      statusLabel: "Completed",
      copy: `Milford Photo received quote ${quoteRef} and sent a confirmation email.`,
    },
    {
      stepLabel: "Step 2",
      title: currentStep.title,
      status: "current",
      statusLabel: "Next step",
      copy: currentStep.copy,
    },
    {
      stepLabel: "Step 3",
      title: "Gear evaluated",
      status: "upcoming",
      statusLabel: "Upcoming",
      copy: "After the gear arrives or is dropped off, Milford Photo verifies the model, condition, and standard original manufacturer accessories. Most quotes are inspected within 1-3 business days.",
    },
    {
      stepLabel: "Step 4",
      title: "Get paid",
      status: "upcoming",
      statusLabel: "Upcoming",
      copy: "If anything changes, Milford Photo emails a line-item explanation before you accept or decline. Payment or store credit is processed after the final quote is accepted.",
    },
  ];

  return `
    <h3>Your quote status</h3>
    <ol class="done-roadmap" aria-label="Quote status">
      ${steps.map((step) => `
        <li class="done-roadmap-step is-${escapeHtml(step.status)}"${step.status === "current" ? ' aria-current="step"' : ""}>
          <div class="done-roadmap-meta">
            <span class="done-roadmap-step-label">${escapeHtml(step.stepLabel)}</span>
            <span class="done-roadmap-status">${escapeHtml(step.statusLabel)}</span>
          </div>
          <div class="done-roadmap-copy">
            <h4>${escapeHtml(step.title)}</h4>
            <p>${escapeHtml(step.copy)}</p>
          </div>
        </li>
      `).join("")}
    </ol>
  `;
}

function updateDeliveryFields() {
  const delivery = selectedRadioValue("delivery") || "ship";
  const freeLabel = Boolean(state.quote?.routing?.freeLabelEligible);

  updateSubmitQuoteButtonLabel();
  els.addressFields.hidden = false;
  els.parcelFields.hidden = true;
  els.street.required = true;
  els.city.required = true;
  els.stateField.required = true;
  els.zip.required = true;

  if (delivery === "dropoff") {
    els.mailCopy.textContent = "Use this quote with a Milford Photo specialist.";
  } else if (freeLabel) {
    els.mailCopy.textContent = "Milford Photo can email a prepaid label after the quote is submitted. The label is valid for 7 days.";
  } else if (state.quote?.routing?.requiresStaffBeforeLabel) {
    els.mailCopy.textContent = "Milford Photo will review before sending shipping instructions.";
  } else {
    els.mailCopy.textContent = "This quote can be dropped off or shipped after Milford Photo follows up.";
  }

  resizeParentFrame();
}

function updateSubmitQuoteButtonLabel() {
  if (!els.submitQuote || els.submitQuote.disabled) return;
  const delivery = selectedRadioValue("delivery") || "ship";
  els.submitQuote.textContent = delivery === "dropoff" ? "Finalize quote" : "Ship your gear";
}

function setStep(step) {
  if (step === "quote" && !state.quote) {
    setStatus("Get an offer before moving to the offer step.", "error");
    return;
  }
  if (step === "details" && !state.quote) {
    setStatus("Get an offer before entering customer details.", "error");
    return;
  }
  if (step === "done" && !state.submission) return;

  state.activeStep = step;
  renderStepCopy(step);
  document.querySelectorAll(".form-step").forEach((section) => {
    section.classList.toggle("is-active", section.dataset.step === step);
  });
  document.querySelectorAll(".step").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.stepTarget === step);
  });
  clearStatus();
  resizeParentFrame();
}

function renderStepCopy(step) {
  const copy = STEP_COPY[step] || STEP_COPY.gear;
  els.appTitle.textContent = copy.title;
  els.appIntro.textContent = copy.intro;
}

function setStatus(message, type = "info") {
  els.statusPanel.textContent = message;
  els.statusPanel.className = `status-panel is-visible ${type === "error" ? "is-error" : type === "success" ? "is-success" : ""}`;
  resizeParentFrame();
}

function clearStatus() {
  els.statusPanel.textContent = "";
  els.statusPanel.className = "status-panel";
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function formatDate(value) {
  const [year, month, day] = String(value || "").slice(0, 10).split("-").map(Number);
  const date = year && month && day ? new Date(year, month - 1, day, 12) : new Date(value);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
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

function resizeParentFrame() {
  if (state.frameResizePending) return;
  state.frameResizePending = true;
  window.requestAnimationFrame(() => {
    state.frameResizePending = false;
    const height = measuredWidgetHeight();
    window.parent?.postMessage(
      {
        type: "MP_USED_GEAR_HEIGHT",
        height: Math.ceil(height + 24),
        source: "milford-used-gear-widget",
      },
      "*",
    );
  });
}

function measuredWidgetHeight() {
  const app = document.getElementById("app");
  const shell = document.querySelector(".shell");
  if (app && shell) {
    const appStyle = window.getComputedStyle(app);
    const paddingTop = Number.parseFloat(appStyle.paddingTop) || 0;
    const paddingBottom = Number.parseFloat(appStyle.paddingBottom) || 0;
    return Math.max(900, Math.ceil(shell.offsetHeight + paddingTop + paddingBottom));
  }
  return Math.max(900, Math.ceil(document.body.scrollHeight || document.documentElement.scrollHeight || 0));
}

function handleParentFrameMessage(event) {
  if (!event.data || event.data.type !== "MP_USED_GEAR_REQUEST_HEIGHT") return;
  resizeParentFrame();
}

init();
