import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalogFiles = [
  "catalog-canon.js",
  "catalog-nikon.js",
  "catalog-sony-fuji-oly.js",
  "catalog-panasonic-pentax-third-party.js",
  "catalog-leica-hasselblad.js",
  "catalog-modern-supplement.js",
  "catalog.js",
];
const productImagesPath = path.join(root, "product-images.js");

const omSources = [
  { kind: "camera", url: "https://explore.omsystem.com/us/en/cameras" },
  { kind: "lens", url: "https://explore.omsystem.com/us/en/lenses" },
];

function loadCatalog() {
  const context = {};
  vm.createContext(context);
  vm.runInContext(
    `${catalogFiles.map((file) => fs.readFileSync(path.join(root, file), "utf8")).join("\n")}
globalThis.GEAR_CATALOG_EXPORT = GEAR_CATALOG;`,
    context,
    { filename: "catalog-bundle.js" },
  );
  return context.GEAR_CATALOG_EXPORT;
}

function loadImageMap() {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(productImagesPath, "utf8"), context, {
    filename: "product-images.js",
  });
  return context.window.MP_PRODUCT_IMAGE_OVERRIDES || {};
}

function normalizeProductImageText(value = "") {
  return String(value).replace(/[–—]/g, "-").replace(/\s+/g, " ").trim().toLowerCase();
}

function normalizeProductImageCategory(category = "") {
  const text = normalizeProductImageText(category);
  if (text.includes("lens")) return "lens";
  if (text.includes("film")) return "film camera";
  if (text.includes("camera") || text.includes("body")) return "digital camera";
  return text;
}

function productImageKey(brand = "", category = "", model = "") {
  return [
    normalizeProductImageText(brand),
    normalizeProductImageCategory(category),
    normalizeProductImageText(model),
  ].join("|");
}

function decodeHtml(value = "") {
  return String(value)
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function normalizeMatchText(value = "") {
  return decodeHtml(value)
    .normalize("NFKD")
    .replace(/[–—]/g, "-")
    .replace(/\((?:om system|black|silver|white)\)/gi, " ")
    .replace(/\bf\//gi, "f")
    .replace(/\bf(\d+)\.0\b/gi, "f$1")
    .replace(/\bf(\d+)\.0-/gi, "f$1-")
    .replace(/\b(m\.?\s*zuiko|zuiko)\b/gi, "mzuiko")
    .replace(/\b(olympus|om system|om-system|digital|body|camera|lens|lenses|only|black|silver|white|red)\b/gi, " ")
    .replace(/\bed\b/gi, " ")
    .replace(/\//g, " ")
    .replace(/[^a-z0-9.+-]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function normalizeCamera(value = "") {
  return normalizeMatchText(value)
    .replace(/\bom-d\b/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[^a-z0-9]+/g, "");
}

function normalizeLens(value = "") {
  return normalizeMatchText(value)
    .split(" ")
    .filter(Boolean)
    .sort()
    .join(" ");
}

function entryKind(entry) {
  const category = normalizeProductImageCategory(entry.category);
  if (category === "lens") return "lens";
  if (category === "digital camera") return "camera";
  return null;
}

function entryMatchKey(entry) {
  const kind = entryKind(entry);
  if (kind === "camera") return normalizeCamera(entry.model);
  if (kind === "lens") return normalizeLens(entry.model);
  return "";
}

function sourceMatchKey(product) {
  if (product.kind === "camera") return normalizeCamera(product.name);
  if (product.kind === "lens") return normalizeLens(product.name);
  return "";
}

function isKitOrAccessory(name = "") {
  return /\b(kit|with|bundle|converter adapter|body cap|lens cap)\b/i.test(decodeHtml(name));
}

function sourceScore(product) {
  let score = 0;
  if (product.href.includes("body")) score += 20;
  if (product.href.includes("black")) score += 5;
  if (product.src.includes("/transparent/")) score += 5;
  score -= product.name.length / 1000;
  return score;
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Milford Photo used gear image catalog updater",
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  return response.text();
}

function parseOmProducts(html, source) {
  const products = [];
  const anchorPattern =
    /<a\b(?=[^>]*\bclass="[^"]*\bproduct-item-photo\b[^"]*")(?=[^>]*\btitle="([^"]+)")(?=[^>]*\bhref="([^"]+)")[^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = anchorPattern.exec(html))) {
    const name = decodeHtml(match[1]).replace(/\s+/g, " ").trim();
    const href = decodeHtml(match[2]);
    const block = match[3];
    const imageMatch = block.match(/<img\b[^>]*src="([^"]+)"[^>]*>/i);
    if (!name || !imageMatch || isKitOrAccessory(name)) continue;

    const src = new URL(decodeHtml(imageMatch[1]), source.url).href;
    products.push({
      kind: source.kind,
      name,
      href,
      src,
      sourceUrl: source.url,
    });
  }
  return products;
}

function renderProductImages(imageMap) {
  const sortedEntries = Object.entries(imageMap).sort(([a], [b]) => a.localeCompare(b));
  const lines = [
    `// Auto-generated from Milford/Dakis exports and conservative manufacturer matches on ${new Date().toISOString().slice(0, 10)}.`,
    "// Conservative matches only: existing quote catalog key -> product image URL.",
    "(function () {",
    "  window.MP_PRODUCT_IMAGE_OVERRIDES = Object.freeze({",
  ];

  for (const [key, image] of sortedEntries) {
    lines.push(`    ${JSON.stringify(key)}: {`);
    lines.push(`      src: ${JSON.stringify(image.src)},`);
    lines.push(`      alt: ${JSON.stringify(image.alt)},`);
    lines.push("    },");
  }

  lines.push("  });");
  lines.push("})();");
  lines.push("");
  return lines.join("\n");
}

const catalog = loadCatalog();
const imageMap = { ...loadImageMap() };
const catalogEntries = catalog.flatMap((brand) =>
  brand.categories.flatMap((category) =>
    category.items.map((item) => ({
      brand: brand.brand,
      category: category.name,
      model: item.name,
      key: productImageKey(brand.brand, category.name, item.name),
    })),
  ),
);

const officialProducts = [];
for (const source of omSources) {
  const html = await fetchText(source.url);
  officialProducts.push(...parseOmProducts(html, source));
}

const byKindAndKey = new Map();
for (const product of officialProducts) {
  const key = `${product.kind}|${sourceMatchKey(product)}`;
  if (!key.endsWith("|")) {
    const current = byKindAndKey.get(key) || [];
    current.push(product);
    byKindAndKey.set(key, current);
  }
}

const added = [];
const skippedExisting = [];
const ambiguous = [];

for (const entry of catalogEntries) {
  if (entry.brand !== "Olympus / OM System") continue;
  const kind = entryKind(entry);
  const matchKey = entryMatchKey(entry);
  if (!kind || !matchKey) continue;

  const candidates = (byKindAndKey.get(`${kind}|${matchKey}`) || []).sort(
    (a, b) => sourceScore(b) - sourceScore(a),
  );
  if (!candidates.length) continue;

  const topScore = sourceScore(candidates[0]);
  const topCandidates = candidates.filter((candidate) => sourceScore(candidate) === topScore);
  if (topCandidates.length > 1 && new Set(topCandidates.map((candidate) => candidate.src)).size > 1) {
    ambiguous.push({ entry, candidates: topCandidates });
    continue;
  }

  const match = candidates[0];
  if (imageMap[entry.key]) {
    skippedExisting.push({ entry, match });
    continue;
  }

  imageMap[entry.key] = {
    src: match.src,
    alt: `${entry.brand} ${entry.model}`,
  };
  added.push({ entry, match });
}

fs.writeFileSync(productImagesPath, renderProductImages(imageMap));

console.log(`Official OM System products parsed: ${officialProducts.length}`);
console.log(`OM System catalog entries: ${catalogEntries.filter((entry) => entry.brand === "Olympus / OM System").length}`);
console.log(`Existing OM entries already mapped by official exact match: ${skippedExisting.length}`);
console.log(`Ambiguous OM exact matches skipped: ${ambiguous.length}`);
console.log(`New official OM mappings added: ${added.length}`);

if (added.length) {
  console.log("\nAdded official OM System mappings:");
  for (const { entry, match } of added) {
    console.log(`- ${entry.category} | ${entry.model} <= ${match.name}`);
  }
}

if (ambiguous.length) {
  console.log("\nSkipped ambiguous OM System mappings:");
  for (const { entry, candidates } of ambiguous.slice(0, 20)) {
    console.log(`- ${entry.category} | ${entry.model} <= ${candidates.map((candidate) => candidate.name).join(" / ")}`);
  }
}
