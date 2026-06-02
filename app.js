const CONFIG = window.MP_USED_GEAR_CONFIG || {};
const API_BASE = resolveApiBase();

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
  previewItem: null,
  suppressCurrentPreview: false,
  liveQuoteRequest: 0,
  liveQuoteTimer: null,
  quote: null,
  submission: null,
};

const els = {
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
  itemNotes: byId("item-notes"),
  addItem: byId("add-item"),
  getQuote: byId("get-quote"),
  quoteResults: byId("quote-results"),
  quoteMessage: byId("quote-message"),
  acceptQuote: byId("accept-quote"),
  submitForm: byId("submit-form"),
  sellerName: byId("seller-name"),
  sellerEmail: byId("seller-email"),
  sellerPhone: byId("seller-phone"),
  paymentPreference: byId("payment-preference"),
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
  labelLink: byId("label-link"),
  quoteRef: byId("quote-ref"),
  summaryCash: byId("summary-cash"),
  summarySubtitle: byId("summary-subtitle"),
  summaryCredit: byId("summary-credit"),
  summaryCreditCard: byId("summary-credit-card"),
  summaryCreditFeature: byId("summary-credit-feature"),
  summaryRouting: byId("summary-routing"),
  summaryLabel: byId("summary-label"),
  cartList: byId("cart-list"),
  statusPanel: byId("status-panel"),
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
  renderSummary();
  updateDeliveryFields();
  setStep("gear");
  scheduleLiveQuote();
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
    state.suppressCurrentPreview = false;
    populateModels();
    renderIncludedItems();
    updateMountField();
    updateManualFields();
    scheduleLiveQuote();
  });
  els.category.addEventListener("change", () => {
    clearGearSearch();
    state.suppressCurrentPreview = false;
    populateBrands();
    populateModels();
    renderIncludedItems();
    updateMountField();
    updateManualFields();
    scheduleLiveQuote();
  });
  els.model.addEventListener("change", () => {
    clearGearSearch();
    state.suppressCurrentPreview = false;
    updateMountField();
    updateManualFields();
    scheduleLiveQuote();
  });
  els.lensMount.addEventListener("change", () => {
    state.suppressCurrentPreview = false;
    scheduleLiveQuote();
  });
  document.querySelectorAll('input[name="condition"]').forEach((input) =>
    input.addEventListener("change", () => {
      state.suppressCurrentPreview = false;
      scheduleLiveQuote();
    }),
  );
  els.itemNotes.addEventListener("input", () => {
    state.suppressCurrentPreview = false;
    scheduleLiveQuote();
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

  window.addEventListener("resize", resizeParentFrame);
  window.addEventListener("load", resizeParentFrame);
  if ("ResizeObserver" in window) {
    new ResizeObserver(resizeParentFrame).observe(document.documentElement);
  }
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
      (option) => `
        <button class="gear-search-result" type="button" data-gear-search-key="${escapeAttribute(gearSearchKey(option))}">
          <span>${escapeHtml(option.brand)} ${escapeHtml(catalogDisplayName({ name: option.model }, option.category))}</span>
          <small>${escapeHtml(option.category)}</small>
        </button>
      `,
    )
    .join("");
  els.gearSearchResults.hidden = false;
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

function applyGearSearch() {
  const query = els.gearSearch.value.trim();
  if (!query) return;
  const options = gearSearchOptions();
  const match = options.find((option) => isExactGearSearchMatch(option, query)) || matchingGearSearchOptions(query)[0];
  if (!match) return;

  applyGearSearchOption(match);
}

function applyGearSearchOption(match) {
  state.suppressCurrentPreview = false;
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
  scheduleLiveQuote();
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
  const items = includedItemsForCategory(els.category.value);
  if (!items.length) {
    els.includedItems.innerHTML = `
      <div class="included-copy">
        <strong>Choose a category to see what is assumed in the quote.</strong>
        <span>Standard accessories will be listed here before the offer is finalized.</span>
      </div>
    `;
    return;
  }
  const assumed = items.filter((item) => item.checked);
  els.includedItems.innerHTML = `
    <div class="included-copy">
      <strong>Price assumes standard manufacturer accessories.</strong>
      <span>Send what you have. Milford Photo will confirm everything after inspection and adjust the offer only if needed.</span>
    </div>
    ${assumed.length ? `<div class="included-columns">
      <div>
        <h3>Included in this quote</h3>
        <ul>
          ${assumed.map((item) => `<li>${escapeHtml(item.name)}</li>`).join("")}
        </ul>
      </div>
    </div>` : ""}
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

function addCurrentItem() {
  const item = readItemForm();
  if (!item) return false;
  state.cart.push(item);
  state.previewItem = null;
  state.suppressCurrentPreview = true;
  state.quote = null;
  els.itemNotes.value = "";
  renderCart();
  scheduleLiveQuote();
  setStatus(`${item.brand} ${item.model} added.`, "success");
  return true;
}

function quoteItemsIncludingCurrent() {
  if (state.suppressCurrentPreview) {
    state.previewItem = null;
    return state.cart;
  }
  const item = readItemForm({ silent: true });
  state.previewItem = item;
  if (!item) return state.cart;
  return [...state.cart, item];
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
  const accessories = includedItemsForCategory(selectedCategory)
    .filter((item) => item.checked)
    .map((item) => item.name);
  const validMounts = mountOptionsForSelectedLens();
  const requiresMountSelection = validMounts.length > 1;
  const mount = requiresMountSelection ? els.lensMount.value.trim() : validMounts[0] || "";
  const notes = [
    els.itemNotes.value.trim(),
    mount ? `Lens mount: ${mount}` : "",
    accessories.length ? `Standard accessories assumed for quote: ${accessories.join(", ")}` : "",
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
    catalogCategory: catalogItem ? catalogCategoryForItem(brand, selectedCategory, catalogItem.name) : "",
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
    isManual: selectedCategory === MANUAL_CATEGORY,
    manualReviewRequested: Boolean(catalogItem?.manualReview),
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
  const quoteItems = quoteItemsIncludingCurrent();
  if (!quoteItems.length) {
    readItemForm({ silent: false });
    return;
  }

  els.getQuote.disabled = true;
  els.getQuote.textContent = "Pricing...";

  try {
    const data = await apiPost("/api/quote", {
      items: quoteItems.map(({ id, ...item }) => item),
    });
    state.quote = data;
    renderQuote(data);
    renderSummary();
    updateDeliveryFields();
    setStep("quote");
  } catch (error) {
    setStatus(error.message || "Unable to get a quote right now.", "error");
  } finally {
    els.getQuote.disabled = false;
    els.getQuote.textContent = "Review offer";
  }
}

function scheduleLiveQuote() {
  if (state.activeStep !== "gear") return;
  clearTimeout(state.liveQuoteTimer);
  state.liveQuoteTimer = setTimeout(updateLiveQuote, 350);
}

async function updateLiveQuote() {
  const quoteItems = quoteItemsIncludingCurrent();
  if (!quoteItems.length) {
    renderCart();
    renderSummary();
    return;
  }

  const requestId = (state.liveQuoteRequest += 1);
  renderCart();
  els.summaryCash.textContent = "Pricing...";
  els.summarySubtitle.textContent = "Checking current quote rules.";

  try {
    const data = await apiPost("/api/quote", {
      items: quoteItems.map(({ id, ...item }) => item),
    });
    if (requestId !== state.liveQuoteRequest) return;
    state.quote = data;
    renderQuote(data);
    renderSummary();
    updateDeliveryFields();
  } catch (error) {
    if (requestId !== state.liveQuoteRequest) return;
    state.quote = null;
    renderSummary();
    setStatus(error.message || "Quote failed to fetch.", "error");
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
    const data = await apiPost("/api/submit", {
      quoteToken: state.quote.quoteToken,
      seller: {
        name: els.sellerName.value.trim(),
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
      paymentPreference: els.paymentPreference.value,
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
    els.submitQuote.textContent = "Submit quote";
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

function renderCart() {
  const displayItems = state.previewItem ? [...state.cart, { ...state.previewItem, isPreview: true }] : [...state.cart];
  if (!displayItems.length) {
    els.cartList.innerHTML = `<div class="cart-item"><span class="cart-meta">Choose gear to preview an offer.</span></div>`;
    return;
  }

  els.cartList.innerHTML = displayItems
    .map(
      (item) => `
        <article class="cart-item">
          <div class="cart-title">
            <strong>${escapeHtml(item.brand)} ${escapeHtml(item.model)}${item.isPreview ? " (current)" : ""}</strong>
            ${item.isPreview ? "" : `<button class="remove-item" type="button" aria-label="Remove item" data-remove-id="${escapeAttribute(item.id)}">x</button>`}
          </div>
          <span class="cart-meta">${escapeHtml(item.category)} · ${escapeHtml(CONDITION_LABELS[item.condition] || item.condition)}</span>
        </article>
      `,
    )
    .join("");

  document.querySelectorAll("[data-remove-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.cart = state.cart.filter((item) => item.id !== button.dataset.removeId);
      state.quote = null;
      renderCart();
      scheduleLiveQuote();
    });
  });
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

  return `
    <article class="quote-item">
      <div>
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
  els.doneCopy.textContent =
    result.nextStep ||
    "Watch your email for shipping or drop-off instructions. Milford Photo will inspect the gear after it arrives, confirm or adjust the offer if needed, and send payment after you accept the final amount.";
  if (result.labelUrl) {
    els.labelLink.href = result.labelUrl;
    els.labelLink.hidden = false;
  } else {
    els.labelLink.hidden = true;
  }
  renderSummary();
}

function updateDeliveryFields() {
  const delivery = selectedRadioValue("delivery") || "ship";
  const freeLabel = Boolean(state.quote?.routing?.freeLabelEligible);
  const addressRequired = delivery === "ship";

  els.addressFields.hidden = false;
  els.parcelFields.hidden = true;
  els.street.required = addressRequired;
  els.city.required = addressRequired;
  els.stateField.required = addressRequired;
  els.zip.required = addressRequired;

  if (delivery === "dropoff") {
    els.mailCopy.textContent = "Use a prepaid label when the quote qualifies.";
  } else if (freeLabel) {
    els.mailCopy.textContent = "Milford Photo can email a prepaid label after the quote is submitted. No box dimensions needed here.";
  } else if (state.quote?.routing?.requiresStaffBeforeLabel) {
    els.mailCopy.textContent = "Milford Photo will review before sending shipping instructions.";
  } else {
    els.mailCopy.textContent = "This quote can be dropped off or shipped after Milford Photo follows up.";
  }

  resizeParentFrame();
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
  document.querySelectorAll(".form-step").forEach((section) => {
    section.classList.toggle("is-active", section.dataset.step === step);
  });
  document.querySelectorAll(".step").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.stepTarget === step);
  });
  clearStatus();
  resizeParentFrame();
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
  window.requestAnimationFrame(() => {
    const height = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight,
    );
    window.parent?.postMessage(
      {
        type: "MP_USED_GEAR_HEIGHT",
        height,
      },
      "*",
    );
  });
}

init();
