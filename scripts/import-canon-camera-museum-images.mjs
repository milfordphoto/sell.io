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
const canonMuseumIndexes = [
  "https://global.canon/en/c-museum/camera.html",
  "https://global.canon/en/c-museum/lens.html",
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
    .replace(/&gt;/g, ">")
    .replace(/&#8211;/g, "-");
}

function canonMatchKey(value = "") {
  return decodeHtml(value)
    .normalize("NFKD")
    .replace(/[–—]/g, "-")
    .replace(/\bf\//gi, "f")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "");
}

function catalogAliases(model = "") {
  const parts = String(model).split("/").map((part) => part.trim()).filter(Boolean);
  const aliases = new Set([model, ...parts]);

  for (const part of parts) {
    if (/^(?:digital rebel|rebel)/i.test(part)) aliases.add(`EOS ${part}`);
    if (/^EOS \d+D/i.test(part)) aliases.add(`${part} Digital`);
  }

  return [...aliases].map(canonMatchKey);
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Milford Photo used gear image catalog updater",
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return response.text();
}

function parseCanonMuseumProducts(html, indexUrl) {
  const products = [];
  const productPattern =
    /<div class="product_box[\s\S]*?<img src="([^"]+)"[^>]*alt="([^"]*)"[\s\S]*?<p class="pro_name">([\s\S]*?)<\/p>/g;
  let match;
  while ((match = productPattern.exec(html))) {
    const rawName = match[3].replace(/<[^>]+>/g, " ");
    const name = decodeHtml(rawName).replace(/\s+/g, " ").trim();
    const thumbnail = new URL(match[1], indexUrl).href;
    const src = thumbnail.replace(/_s\.jpg$/i, "_b.jpg");
    if (!name || !src) continue;
    products.push({
      name,
      src,
      thumbnail,
    });
  }
  return products;
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
const canonEntries = catalog
  .filter((brand) => brand.brand === "Canon")
  .flatMap((brand) =>
    brand.categories.flatMap((category) =>
      category.items.map((item) => ({
        brand: brand.brand,
        category: category.name,
        model: item.name,
        key: productImageKey(brand.brand, category.name, item.name),
      })),
    ),
  );

const museumProducts = [];
for (const indexUrl of canonMuseumIndexes) {
  museumProducts.push(...parseCanonMuseumProducts(await fetchText(indexUrl), indexUrl));
}

const productsByKey = new Map();
for (const product of museumProducts) {
  const key = canonMatchKey(product.name);
  if (!productsByKey.has(key)) productsByKey.set(key, []);
  productsByKey.get(key).push(product);
}

const added = [];
const skipped = [];

for (const entry of canonEntries) {
  if (imageMap[entry.key]) continue;

  const matches = [];
  for (const alias of catalogAliases(entry.model)) {
    for (const product of productsByKey.get(alias) || []) matches.push(product);
  }
  const uniqueMatches = [...new Map(matches.map((product) => [`${product.name}|${product.src}`, product])).values()];

  if (uniqueMatches.length !== 1) {
    if (uniqueMatches.length > 1) skipped.push(`${entry.model}: ambiguous (${uniqueMatches.map((item) => item.name).join(", ")})`);
    continue;
  }

  const product = uniqueMatches[0];
  const image = (await verifyImage(product.src)) ? product.src : product.thumbnail;
  if (!(await verifyImage(image))) {
    skipped.push(`${entry.model}: image did not pass check (${product.src})`);
    continue;
  }

  imageMap[entry.key] = {
    src: image,
    alt: `Canon ${entry.model}`,
  };
  added.push(`${entry.model} -> ${product.name}`);
}

if (added.length) {
  fs.writeFileSync(productImagesPath, renderProductImages(imageMap));
}

console.log(`Canon Camera Museum products parsed: ${museumProducts.length}`);
console.log(`Canon Camera Museum mappings added: ${added.length}`);
for (const item of added) console.log(`+ ${item}`);
console.log(`Canon Camera Museum mappings skipped: ${skipped.length}`);
for (const item of skipped) console.log(`- ${item}`);
