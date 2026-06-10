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

const historyPages = [
  "https://imaging.nikon.com/imaging/information/products_history/",
  "https://imaging.nikon.com/imaging/information/products_history/2010/",
  "https://imaging.nikon.com/imaging/information/products_history/2000/",
  "https://imaging.nikon.com/imaging/information/products_history/1990/",
  "https://imaging.nikon.com/imaging/information/products_history/1980/",
  "https://imaging.nikon.com/imaging/information/products_history/1970/",
  "https://imaging.nikon.com/imaging/information/products_history/1960/",
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
    .replace(/\b(af-s teleconverter|teleconverter)\b/gi, " ")
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

function cameraMatchKeys(value = "") {
  const raw = decodeHtml(value)
    .replace(/<small[\s\S]*?<\/small>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  const keys = new Set([normalizeCamera(raw)]);
  for (const part of raw.replace(/[()]/g, "/").split(/[\/,]/)) {
    const key = normalizeCamera(part);
    if (key) keys.add(key);
  }
  return [...keys].filter(Boolean);
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

function entryMatchKeys(entry) {
  const kind = entryKind(entry);
  if (kind === "camera") return cameraMatchKeys(entry.model);
  const key = entryMatchKey(entry);
  return key ? [key] : [];
}

function productKinds(product) {
  const filters = String(product.filters || "").split(",").map((part) => part.trim());
  const title = normalizeMatchText(product.name);
  const kinds = new Set();
  if (filters.includes("5") || title.includes("mm ") || title.includes("tc-")) kinds.add("lens");
  if (filters.includes("2") || filters.includes("3") || filters.includes("8")) kinds.add("camera");
  if (filters.includes("6") && title.includes("sb-")) kinds.add("flash");
  return [...kinds];
}

function sourceMatchKey(product, kind) {
  if (kind === "camera") return normalizeCamera(product.name);
  if (kind === "lens") return normalizeLens(product.name);
  if (kind === "flash") return normalizeFlash(product.name);
  return "";
}

function sourceMatchKeys(product, kind) {
  if (kind === "camera") return cameraMatchKeys(product.name);
  const key = sourceMatchKey(product, kind);
  return key ? [key] : [];
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

function parseNikonHistoryProducts(html, pageUrl) {
  const products = [];
  const itemPattern = /<div class="c-link-block-row__item[\s\S]*?<\/div><!-- c-link-block-row__item -->/g;
  let itemMatch;
  while ((itemMatch = itemPattern.exec(html))) {
    const block = itemMatch[0];
    const filters = block.match(/data-historyfilter-values="([^"]*)"/i)?.[1] || "";
    const titleHtml = block.match(/<h3 class="c-link-block-row__item__title">([\s\S]*?)<\/h3>/i)?.[1] || "";
    const imageSrc = block.match(/<div class="c-link-block-row__item__image">[\s\S]*?<img src="([^"]+)"/i)?.[1] || "";
    if (!titleHtml || !imageSrc) continue;

    const name = decodeHtml(titleHtml.replace(/<small[\s\S]*?<\/small>/gi, " ").replace(/<[^>]+>/g, " "))
      .replace(/\s+/g, " ")
      .trim();
    const src = new URL(decodeHtml(imageSrc), pageUrl).href;
    if (!name || !src) continue;
    products.push({ name, src, filters, pageUrl });
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
const nikonEntries = catalog
  .filter((brand) => brand.brand === "Nikon")
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

const historyProducts = [];
for (const pageUrl of historyPages) {
  historyProducts.push(...parseNikonHistoryProducts(await fetchText(pageUrl), pageUrl));
}

const byKindAndKey = new Map();
for (const product of historyProducts) {
  for (const kind of productKinds(product)) {
    for (const matchKey of sourceMatchKeys(product, kind)) {
      const key = `${kind}|${matchKey}`;
      if (!key.endsWith("|")) {
        if (!byKindAndKey.has(key)) byKindAndKey.set(key, []);
        byKindAndKey.get(key).push(product);
      }
    }
  }
}

const added = [];
const skippedExisting = [];
const skippedAmbiguous = [];
const skippedInvalidImage = [];

for (const entry of nikonEntries) {
  if (imageMap[entry.key]) continue;

  const kind = entryKind(entry);
  const matchKeys = entryMatchKeys(entry);
  if (!kind || !matchKeys.length) continue;

  const candidates = matchKeys.flatMap((matchKey) => byKindAndKey.get(`${kind}|${matchKey}`) || []);
  const uniqueCandidates = [...new Map(candidates.map((item) => [`${item.name}|${item.src}`, item])).values()];
  if (!uniqueCandidates.length) continue;
  if (uniqueCandidates.length > 1) {
    skippedAmbiguous.push(`${entry.model}: ${uniqueCandidates.map((item) => item.name).join(", ")}`);
    continue;
  }

  const match = uniqueCandidates[0];
  if (imageMap[entry.key]) {
    skippedExisting.push({ entry, match });
    continue;
  }
  if (!(await verifyImage(match.src))) {
    skippedInvalidImage.push(`${entry.model}: ${match.src}`);
    continue;
  }

  imageMap[entry.key] = {
    src: match.src,
    alt: `Nikon ${entry.model}`,
  };
  added.push({ entry, match });
}

if (added.length) {
  fs.writeFileSync(productImagesPath, renderProductImages(imageMap));
}

console.log(`Nikon history products parsed: ${historyProducts.length}`);
console.log(`Nikon catalog entries: ${nikonEntries.length}`);
console.log(`New Nikon history mappings added: ${added.length}`);
console.log(`Ambiguous Nikon history matches skipped: ${skippedAmbiguous.length}`);
console.log(`Invalid Nikon history images skipped: ${skippedInvalidImage.length}`);

if (added.length) {
  console.log("\nAdded Nikon history mappings:");
  for (const { entry, match } of added) {
    console.log(`- ${entry.category} | ${entry.model} <= ${match.name}`);
  }
}

if (skippedAmbiguous.length) {
  console.log("\nAmbiguous skipped:");
  for (const item of skippedAmbiguous.slice(0, 20)) console.log(`- ${item}`);
  if (skippedAmbiguous.length > 20) console.log(`- ... ${skippedAmbiguous.length - 20} more`);
}

if (skippedInvalidImage.length) {
  console.log("\nInvalid images skipped:");
  for (const item of skippedInvalidImage.slice(0, 20)) console.log(`- ${item}`);
  if (skippedInvalidImage.length > 20) console.log(`- ... ${skippedInvalidImage.length - 20} more`);
}
