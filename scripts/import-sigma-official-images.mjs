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
const sigmaBase = "https://www.sigma-global.com";

const sigmaSources = [
  { kind: "lens-index", url: "https://www.sigma-global.com/en/lenses/" },
  { kind: "camera-index", url: "https://www.sigma-global.com/en/cameras/" },
];

const verifiedLegacyUrls = [
  "https://www.sigma-global.com/en/lenses/a019_28_14/",
  "https://www.sigma-global.com/en/lenses/a018_40_14/",
  "https://www.sigma-global.com/en/lenses/a018_14_24_28/",
  "https://www.sigma-global.com/en/lenses/a019_24_70_28/",
  "https://www.sigma-global.com/en/lenses/s018_60_600_45_63/",
  "https://www.sigma-global.com/en/lenses/s018_70_200_28/",
  "https://www.sigma-global.com/en/lenses/s013_120_300_28/",
  "https://www.sigma-global.com/en/lenses/s016_500_4/",
  "https://www.sigma-global.com/en/cameras/fpl/",
  "https://www.sigma-global.com/en/cameras/fp/",
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
    .replace(/\bf\//gi, "f")
    .replace(/\bf(\d+)\.0\b/gi, "f$1")
    .replace(/\bf(\d+)\.0-/gi, "f$1-")
    .replace(/\b(sigma|lens|camera|body|for|mirrorless|dslr)\b/gi, " ")
    .replace(/\b(re|ii)\b/gi, (value) => value.toLowerCase())
    .replace(/\//g, " ")
    .replace(/[^a-z0-9.+-]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function normalizeSigmaModel(value = "") {
  return normalizeMatchText(value)
    .replace(/\b(diagonal fisheye|macro|contemporary series|art series|sports series)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function entryKind(entry) {
  const category = normalizeProductImageCategory(entry.category);
  if (category === "lens") return "lens";
  if (category === "digital camera") return "camera";
  return null;
}

function entryMatchKey(entry) {
  const kind = entryKind(entry);
  if (kind === "lens") return normalizeSigmaModel(entry.model);
  if (kind === "camera") return normalizeSigmaModel(entry.model).replace(/\s+/g, "");
  return "";
}

function sourceMatchKey(product) {
  if (product.kind === "lens") return normalizeSigmaModel(product.name);
  if (product.kind === "camera") return normalizeSigmaModel(product.name).replace(/\s+/g, "");
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

function parseLensIndex(html) {
  const products = [];
  const cardPattern =
    /<div\b(?=[^>]*class="[^"]*m-productCard\s+--listing[^"]*")[^>]*>([\s\S]*?)(?=<div\b(?=[^>]*class="[^"]*m-productCard\s+--listing)|<div class="m-moodProduct|<\/div>\s*<\/section>)/gi;
  let match;
  while ((match = cardPattern.exec(html))) {
    const block = match[1];
    const productMatch = block.match(
      /<a href="([^"]+)"[\s\S]*?<img[^>]+src="([^"]+)"[\s\S]*?<p><span[^>]*>([^<]+)<\/span><br>([^<]+)<\/p>/i,
    );
    if (!productMatch) continue;
    products.push({
      kind: "lens",
      name: `${decodeHtml(productMatch[3])} ${decodeHtml(productMatch[4])}`.replace(/\s+/g, " ").trim(),
      href: new URL(decodeHtml(productMatch[1]), sigmaBase).href,
      src: new URL(decodeHtml(productMatch[2]), sigmaBase).href,
    });
  }
  return products;
}

function parseCameraIndex(html) {
  const products = [];
  const cardPattern =
    /<div\b(?=[^>]*class="[^"]*m-productCard\s+--listing[^"]*")[^>]*>([\s\S]*?)(?=<div\b(?=[^>]*class="[^"]*m-productCard\s+--listing)|<\/div>\s*<\/main>)/gi;
  let match;
  while ((match = cardPattern.exec(html))) {
    const block = match[1];
    const productMatch = block.match(/<a href="([^"]+)"[\s\S]*?<img[^>]+src="([^"]+)"[\s\S]*?<p>([^<]+)<\/p>/i);
    if (!productMatch) continue;
    products.push({
      kind: "camera",
      name: decodeHtml(productMatch[3]).replace(/\s+/g, " ").trim(),
      href: new URL(decodeHtml(productMatch[1]), sigmaBase).href,
      src: new URL(decodeHtml(productMatch[2]), sigmaBase).href,
    });
  }
  return products;
}

function parseProductPage(html, url) {
  const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const imageMatch = html.match(/<img[^>]+src="([^"]*product_img01[^"]*)"[^>]*>/i);
  if (!titleMatch || !imageMatch) return null;

  const title = decodeHtml(titleMatch[1]).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const kind = url.includes("/cameras/") ? "camera" : "lens";
  return {
    kind,
    name: title,
    href: url,
    src: new URL(decodeHtml(imageMatch[1]), sigmaBase).href,
  };
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
for (const source of sigmaSources) {
  const html = await fetchText(source.url);
  if (source.kind === "lens-index") officialProducts.push(...parseLensIndex(html));
  if (source.kind === "camera-index") officialProducts.push(...parseCameraIndex(html));
}

for (const url of verifiedLegacyUrls) {
  const html = await fetchText(url);
  const product = parseProductPage(html, url);
  if (product) officialProducts.push(product);
}

const byKindAndKey = new Map();
for (const product of officialProducts) {
  const key = `${product.kind}|${sourceMatchKey(product)}`;
  if (key.endsWith("|")) continue;
  const current = byKindAndKey.get(key) || [];
  current.push(product);
  byKindAndKey.set(key, current);
}

const added = [];
const skippedExisting = [];
const ambiguous = [];

for (const entry of catalogEntries) {
  if (entry.brand !== "Sigma") continue;
  const kind = entryKind(entry);
  const matchKey = entryMatchKey(entry);
  if (!kind || !matchKey) continue;

  const candidates = byKindAndKey.get(`${kind}|${matchKey}`) || [];
  const uniqueSources = [...new Map(candidates.map((candidate) => [candidate.src, candidate])).values()];
  if (!uniqueSources.length) continue;
  if (uniqueSources.length > 1) {
    ambiguous.push({ entry, candidates: uniqueSources });
    continue;
  }

  const match = uniqueSources[0];
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

console.log(`Official Sigma products parsed: ${officialProducts.length}`);
console.log(`Sigma catalog entries: ${catalogEntries.filter((entry) => entry.brand === "Sigma").length}`);
console.log(`Existing Sigma entries already mapped by official exact match: ${skippedExisting.length}`);
console.log(`Ambiguous Sigma exact matches skipped: ${ambiguous.length}`);
console.log(`New official Sigma mappings added: ${added.length}`);

if (added.length) {
  console.log("\nAdded official Sigma mappings:");
  for (const { entry, match } of added) {
    console.log(`- ${entry.category} | ${entry.model} <= ${match.name}`);
  }
}

if (ambiguous.length) {
  console.log("\nSkipped ambiguous Sigma mappings:");
  for (const { entry, candidates } of ambiguous.slice(0, 20)) {
    console.log(`- ${entry.category} | ${entry.model} <= ${candidates.map((candidate) => candidate.name).join(" / ")}`);
  }
}
