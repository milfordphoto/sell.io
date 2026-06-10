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
const ricohBase = "https://www.ricoh-imaging.co.jp";

const sourceUrls = [
  "https://www.ricoh-imaging.co.jp/english/products/",
  "https://www.ricoh-imaging.co.jp/english/products/filmcamera/35mm/",
  "https://www.ricoh-imaging.co.jp/english/products/filmcamera/medium/",
];

const verifiedManualProducts = [
  {
    brand: "Ricoh",
    model: "GR III",
    category: "Camera Body — Digital",
    src: "https://www.ricoh-imaging.co.jp/japan/products/top/img/img-GRIII.jpg",
  },
  {
    brand: "Ricoh",
    model: "GR Digital IV",
    category: "Camera Body — Digital",
    src: "https://www.ricoh-imaging.co.jp/english/products/gr-digital4/img/img-main-digital4.jpg",
  },
  {
    brand: "Ricoh",
    model: "GR",
    category: "Camera Body — Digital",
    src: "https://www.ricoh-imaging.co.jp/english/products/gr/top/img/bod_cam_02.jpg",
  },
  {
    brand: "Ricoh",
    model: "GXR",
    category: "Camera Body — Digital",
    src: "https://www.ricoh-imaging.co.jp/english/products/gxr/img/img-main-gxr.jpg",
  },
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
    .replace(/\b(pentax|ricoh|camera|body|film|slr|d-?slr)\b/gi, " ")
    .replace(/\*/g, "")
    .replace(/[^a-z0-9]+/gi, "")
    .toLowerCase();
}

function canonicalSourceModel(value = "") {
  const text = decodeHtml(value).replace(/\s+/g, " ").trim();
  const manualMap = new Map([
    ["K-3IIImono", "K-3 III Monochrome"],
    ["K-3III", "K-3 III"],
    ["K-3II", "K-3 II"],
    ["K-5II", "K-5 II"],
    ["istD", "*ist D"],
    ["istDS", "*ist DS"],
    ["istDL", "*ist DL"],
    ["GRII", "GR II"],
    ["GRIIIx", "GR IIIx"],
    ["GRIIIxHDF", "GR IIIx HDF"],
  ]);
  return manualMap.get(text) || text;
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

async function verifyImage(url) {
  const response = await fetch(url, {
    method: "HEAD",
    headers: {
      "User-Agent": "Milford Photo used gear image catalog updater",
    },
  });
  return response.ok && (response.headers.get("content-type") || "").startsWith("image/");
}

function parseModernIndex(html) {
  const products = [];
  const itemPattern = /<input[^>]+value="([^"]+)"[\s\S]*?<a href="([^"]+)"[\s\S]*?<img src="([^"]+)"/gi;
  let match;
  while ((match = itemPattern.exec(html))) {
    const model = canonicalSourceModel(match[1]);
    const brand = /^gr|^gxr/i.test(model) ? "Ricoh" : "Pentax";
    products.push({
      brand,
      model,
      category: "Camera Body — Digital",
      src: new URL(decodeHtml(match[3]), ricohBase).href,
    });
  }
  return products;
}

function parseFilmIndex(html, sourceUrl) {
  const products = [];
  const itemPattern = /<a href="([^"]+)"[^>]*><img src="([^"]+)" alt="([^"]+)"/gi;
  let match;
  while ((match = itemPattern.exec(html))) {
    const model = canonicalSourceModel(match[3]);
    if (!model || /Products|Film Cameras|RICOH|Global/i.test(model)) continue;
    products.push({
      brand: "Pentax",
      model,
      category: "Camera Body — Film SLR",
      src: new URL(decodeHtml(match[2]), sourceUrl).href,
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
for (const staleKey of [
  "ricoh|digital camera|gr digital",
  "ricoh|digital camera|gr digital ii",
  "ricoh|digital camera|gr digital iii",
]) {
  if (imageMap[staleKey]?.src?.includes("ricoh-imaging.co.jp")) delete imageMap[staleKey];
}
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
for (const sourceUrl of sourceUrls) {
  const html = await fetchText(sourceUrl);
  if (sourceUrl.includes("filmcamera")) officialProducts.push(...parseFilmIndex(html, sourceUrl));
  else officialProducts.push(...parseModernIndex(html));
}

for (const product of verifiedManualProducts) {
  if (await verifyImage(product.src)) officialProducts.push(product);
}

const byBrandAndModel = new Map();
for (const product of officialProducts) {
  const key = `${product.brand}|${normalizeMatchText(product.model)}`;
  if (key.endsWith("|")) continue;
  const current = byBrandAndModel.get(key) || [];
  current.push(product);
  byBrandAndModel.set(key, current);
}

const added = [];
const skippedExisting = [];
const ambiguous = [];

for (const entry of catalogEntries) {
  if (!["Pentax", "Ricoh"].includes(entry.brand)) continue;
  const candidates = byBrandAndModel.get(`${entry.brand}|${normalizeMatchText(entry.model)}`) || [];
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

console.log(`Official Ricoh/Pentax products parsed: ${officialProducts.length}`);
console.log(`Pentax catalog entries: ${catalogEntries.filter((entry) => entry.brand === "Pentax").length}`);
console.log(`Ricoh catalog entries: ${catalogEntries.filter((entry) => entry.brand === "Ricoh").length}`);
console.log(`Existing entries already mapped by official exact match: ${skippedExisting.length}`);
console.log(`Ambiguous exact matches skipped: ${ambiguous.length}`);
console.log(`New official Ricoh/Pentax mappings added: ${added.length}`);

if (added.length) {
  console.log("\nAdded official Ricoh/Pentax mappings:");
  for (const { entry, match } of added) {
    console.log(`- ${entry.brand} | ${entry.category} | ${entry.model} <= ${match.model}`);
  }
}

if (ambiguous.length) {
  console.log("\nSkipped ambiguous Ricoh/Pentax mappings:");
  for (const { entry, candidates } of ambiguous.slice(0, 20)) {
    console.log(`- ${entry.brand} | ${entry.category} | ${entry.model} <= ${candidates.map((candidate) => candidate.model).join(" / ")}`);
  }
}
