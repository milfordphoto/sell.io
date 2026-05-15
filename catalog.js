/**
 * catalog.js — Master gear catalog for Milford Photo Used Equipment widget
 *
 * Combines all brand-specific catalogs into a single GEAR_CATALOG array.
 * Each catalog item: { name, year, ebayQuery }
 * Organized as: brand → categories → items
 *
 * To use in the widget, include all catalog files before this one:
 *   <script src="catalog-canon.js"></script>
 *   <script src="catalog-nikon.js"></script>
 *   <script src="catalog-sony-fuji-oly.js"></script>
 *   <script src="catalog-panasonic-pentax-third-party.js"></script>
 *   <script src="catalog.js"></script>
 */

const GEAR_CATALOG = [
  CANON_CATALOG,
  NIKON_CATALOG,
  SONY_CATALOG,
  FUJIFILM_CATALOG,
  OLYMPUS_CATALOG,
  PANASONIC_CATALOG,
  PENTAX_CATALOG,
  SIGMA_CATALOG,
  TAMRON_CATALOG,
  TOKINA_CATALOG,
  ZEISS_CATALOG,
  GODOX_CATALOG,
  PROFOTO_CATALOG,
  MANFROTTO_CATALOG,
  GITZO_CATALOG,
];

/**
 * Supplemental categories added to every brand's catalog.
 * These are brand-agnostic accessories that we buy under any brand.
 * They appear in the "Other / Not Listed" manual review path.
 */
const ACCESSORY_CATEGORIES = [
  {
    name: "Flash / Speedlight",
    ebayQueryTemplate: (brand) => `${brand} speedlight flash`,
  },
  {
    name: "Tripod / Monopod",
    ebayQueryTemplate: (brand) => `${brand} tripod`,
  },
  {
    name: "Camera Bag / Case",
    ebayQueryTemplate: (brand) => `${brand} camera bag`,
  },
  {
    name: "Filter",
    ebayQueryTemplate: (brand) => `${brand} camera filter`,
  },
  {
    name: "Memory Card",
    ebayQueryTemplate: () => `memory card SD CFexpress`,
  },
  {
    name: "Other Accessory",
    ebayQueryTemplate: (brand, model) => `${brand} ${model} camera accessory`,
  },
];

/**
 * Get all brand names for the brand selector dropdown.
 * Returns sorted array of brand name strings.
 */
function getCatalogBrands() {
  return GEAR_CATALOG.map((b) => b.brand).sort();
}

/**
 * Get catalog entry for a specific brand.
 * @param {string} brandName
 * @returns {object|null} brand catalog object or null
 */
function getCatalogBrand(brandName) {
  return GEAR_CATALOG.find((b) => b.brand === brandName) || null;
}

/**
 * Get all category names for a given brand.
 * @param {string} brandName
 * @returns {string[]} array of category names
 */
function getCatalogCategories(brandName) {
  const brand = getCatalogBrand(brandName);
  if (!brand) return [];
  return brand.categories.map((c) => c.name);
}

/**
 * Get all items for a given brand + category.
 * Returns items sorted by year descending (newest first).
 * @param {string} brandName
 * @param {string} categoryName
 * @returns {object[]} array of { name, year, ebayQuery }
 */
function getCatalogItems(brandName, categoryName) {
  const brand = getCatalogBrand(brandName);
  if (!brand) return [];
  const cat = brand.categories.find((c) => c.name === categoryName);
  if (!cat) return [];
  return [...cat.items].sort((a, b) => b.year - a.year);
}

/**
 * Find a specific item by brand, category, and model name.
 * @param {string} brandName
 * @param {string} categoryName
 * @param {string} itemName
 * @returns {object|null}
 */
function getCatalogItem(brandName, categoryName, itemName) {
  const items = getCatalogItems(brandName, categoryName);
  return items.find((i) => i.name === itemName) || null;
}

/**
 * Map a catalog category name to an eBay category ID
 * for more precise search results.
 */
const EBAY_CATEGORY_MAP = {
  "Camera Body — DSLR":            "31388",  // Digital Cameras
  "Camera Body — Mirrorless":      "31388",
  "Camera Body — Film SLR":        "4977",   // Film Cameras
  "Camera Body — Point & Shoot":   "4977",
  "Camera Body — Rangefinder":     "4977",
  "Camera Body — Medium Format":   "4977",
  "Camera Body — Digital":         "31388",
  "Lens — E-Mount / FE-Mount":     "3323",   // Lenses
  "Lens — A-Mount":                "3323",
  "Lens — EF / EF-S":             "3323",
  "Lens — RF":                     "3323",
  "Lens — F-Mount":                "3323",
  "Lens — Z-Mount":                "3323",
  "Lens — XF / X-Mount":          "3323",
  "Lens — G / S":                  "3323",
  "Lens — K-Mount":                "3323",
  "Lens — M.Zuiko / MFT":         "3323",
  "Lens — Third-Party (Multi-Mount)": "3323",
  "Lens — Third-Party (E-Mount)":  "3323",
  "Lens — Third-Party (Various)":  "3323",
  "Lens — ZE/ZF (Third-Party)":   "3323",
  "Flash / Speedlight":            "15245",  // Flashes
  "Tripod / Monopod":              "64639",  // Tripods
  "Camera Bag / Case":             "3377",   // Camera Bags
};

/**
 * Look up the eBay category ID for a catalog category name.
 * Falls back to general Camera & Photo category if not found.
 * @param {string} categoryName
 * @returns {string} eBay category ID
 */
function getEbayCategoryId(categoryName) {
  return EBAY_CATEGORY_MAP[categoryName] || "625";  // 625 = Camera & Photo
}
