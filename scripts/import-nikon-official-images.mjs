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

const nikonSources = [
  { kind: "camera", url: "https://imaging.nikon.com/imaging/lineup/dslr/" },
  { kind: "camera", url: "https://imaging.nikon.com/imaging/lineup/mirrorless/" },
  { kind: "lens", url: "https://imaging.nikon.com/imaging/lineup/lens/f-mount/" },
  { kind: "lens", url: "https://imaging.nikon.com/imaging/lineup/lens/z-mount/" },
  { kind: "flash", url: "https://imaging.nikon.com/imaging/lineup/speedlights/" },
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
    .replace(/\((?:\d+(?:\.\d+)?x|discontinued)\)/gi, " ")
    .replace(/\bed-if\b/gi, "ed if")
    .replace(/\bif-ed\b/gi, "ed if")
    .replace(/\bf\//gi, "f")
    .replace(/\bzoom-nikkor\b/gi, " ")
    .replace(/\bmicro-nikkor\b/gi, " micro ")
    .replace(/\bnikkor\b/gi, " ")
    .replace(/\bnikon\b/gi, " ")
    .replace(/\bspeedlight\b/gi, " ")
    .replace(/\b(camera|body|lens|lenses|only|black|silver|white)\b/gi, " ")
    .replace(/\bai\b/gi, " ")
    .replace(/\//g, " ")
    .replace(/[^a-z0-9.+-]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function normalizeCamera(value = "") {
  return normalizeMatchText(value).replace(/[^a-z0-9]+/g, "");
}

function normalizeLens(value = "") {
  const tokens = normalizeMatchText(value)
    .split(" ")
    .filter(Boolean)
    .filter((token) => token !== "zoom");
  return tokens.sort().join(" ");
}

function normalizeFlash(value = "") {
  return normalizeMatchText(value).replace(/[^a-z0-9]+/g, "");
}

function entryKind(entry) {
  const category = normalizeProductImageCategory(entry.category);
  if (category === "lens") return "lens";
  if (normalizeProductImageText(entry.category).includes("flash")) return "flash";
  if (category.includes("camera")) return "camera";
  return null;
}

function entryMatchKey(entry) {
  const kind = entryKind(entry);
  if (kind === "camera") return normalizeCamera(entry.model);
  if (kind === "lens") return normalizeLens(entry.model);
  if (kind === "flash") return normalizeFlash(entry.model);
  return "";
}

function sourceMatchKey(product) {
  if (product.kind === "camera") return normalizeCamera(product.name);
  if (product.kind === "lens") return normalizeLens(product.name);
  if (product.kind === "flash") return normalizeFlash(product.name);
  return "";
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

function parseNikonProducts(html, source) {
  const products = [];
  const linkPattern = /<a\b[^>]*class="[^"]*\bc-link-block__item__link\b[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = linkPattern.exec(html))) {
    const block = match[1];
    const nameMatch = block.match(/<span>([\s\S]*?)<\/span>/i);
    const imageMatch = block.match(/<img\b[^>]*src="([^"]+)"[^>]*>/i);
    if (!nameMatch || !imageMatch) continue;

    const name = decodeHtml(nameMatch[1].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
    const src = new URL(decodeHtml(imageMatch[1]), source.url).href;
    if (!name || !src) continue;

    products.push({
      kind: source.kind,
      name,
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
for (const source of nikonSources) {
  const html = await fetchText(source.url);
  officialProducts.push(...parseNikonProducts(html, source));
}

const byKindAndKey = new Map();
for (const product of officialProducts) {
  const key = `${product.kind}|${sourceMatchKey(product)}`;
  if (!byKindAndKey.has(key)) byKindAndKey.set(key, []);
  byKindAndKey.get(key).push(product);
}

const added = [];
const skippedExisting = [];

for (const entry of catalogEntries) {
  if (entry.brand !== "Nikon") continue;
  const kind = entryKind(entry);
  const matchKey = entryMatchKey(entry);
  if (!kind || !matchKey) continue;

  const candidates = byKindAndKey.get(`${kind}|${matchKey}`) || [];
  if (candidates.length !== 1) continue;

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

console.log(`Official Nikon products parsed: ${officialProducts.length}`);
console.log(`Nikon catalog entries: ${catalogEntries.filter((entry) => entry.brand === "Nikon").length}`);
console.log(`Existing Nikon entries already mapped by official exact match: ${skippedExisting.length}`);
console.log(`New official Nikon mappings added: ${added.length}`);

if (added.length) {
  console.log("\nAdded official Nikon mappings:");
  for (const { entry, match } of added) {
    console.log(`- ${entry.category} | ${entry.model} <= ${match.name}`);
  }
}
