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
const baseUrl = "https://fujifilm-x.com/global/products";

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

function decodeHtml(value = "") {
  return String(value)
    .replace(/&amp;/g, "&")
    .replace(/&#038;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#8211;|&ndash;/g, "-")
    .replace(/&#8212;|&mdash;/g, "-")
    .replace(/&nbsp;/g, " ");
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

function comparable(value = "") {
  return decodeHtml(value)
    .replace(/[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ]/g, (char) => ({
      "Ⅰ": "i",
      "Ⅱ": "ii",
      "Ⅲ": "iii",
      "Ⅳ": "iv",
      "Ⅴ": "v",
      "Ⅵ": "vi",
      "Ⅶ": "vii",
      "Ⅷ": "viii",
      "Ⅸ": "ix",
      "Ⅹ": "x",
    })[char] || char)
    .toLowerCase()
    .replace(/fujifilm|fujinon/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function cameraSlug(model) {
  const primary = model.split("/")[0].trim();
  if (!/^(x-|x\d|gfx)/i.test(primary)) return null;
  return primary
    .toLowerCase()
    .replace(/\s+ii\b/g, "-ii")
    .replace(/\s+/g, "")
    .replace(/gfx(?=\d)/, "gfx")
    .replace(/[^a-z0-9-]/g, "");
}

function lensSlug(model) {
  const primary = model.split("(")[0].trim();
  if (!/^(xf|xc|gf)\s/i.test(primary)) return null;
  return primary
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\bf\/(\d+)\.(\d+)/g, "f$1$2")
    .replace(/\bf\/(\d+)/g, "f$1")
    .replace(/\s+f/g, "f")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/mm-f/g, "mmf")
    .replace(/-ii$/, "-ii");
}

function candidateUrls(entry) {
  const urls = [];
  const camera = cameraSlug(entry.model);
  if (camera) urls.push(`${baseUrl}/cameras/${camera}/`);
  const lens = lensSlug(entry.model);
  if (lens) urls.push(`${baseUrl}/lenses/${lens}/`);
  return urls;
}

function extractProductImage(html) {
  const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const match of scripts) {
    try {
      const json = JSON.parse(decodeHtml(match[1]).trim());
      const graph = Array.isArray(json["@graph"]) ? json["@graph"] : [json];
      const product = graph.find((node) => node && node["@type"] === "Product");
      const image = product?.image?.url || product?.image;
      if (product?.name && typeof image === "string" && image.startsWith("http")) {
        return {
          name: product.name,
          src: decodeHtml(image),
        };
      }
    } catch {
      // Some pages include unrelated JSON-LD. Try the next block.
    }
  }
  return null;
}

async function fetchProduct(entry) {
  for (const url of candidateUrls(entry)) {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Milford Photo used gear image catalog updater",
      },
    });
    if (!response.ok) continue;
    const html = await response.text();
    if (/Page Not Found/i.test(html)) continue;
    const product = extractProductImage(html);
    if (!product) continue;
    const pageComparable = comparable(product.name);
    const entryComparable = comparable(entry.model);
    if (!pageComparable.includes(entryComparable) && !entryComparable.includes(pageComparable)) continue;
    return {
      ...product,
      pageUrl: url,
    };
  }
  return null;
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

const added = [];
const skippedExisting = [];
const unmatched = [];

for (const entry of catalogEntries) {
  if (entry.brand !== "Fujifilm") continue;
  if (imageMap[entry.key]) {
    skippedExisting.push(entry);
    continue;
  }
  if (!candidateUrls(entry).length) {
    unmatched.push(entry);
    continue;
  }
  const match = await fetchProduct(entry);
  if (!match || !await verifyImage(match.src)) {
    unmatched.push(entry);
    continue;
  }
  imageMap[entry.key] = {
    src: match.src,
    alt: `Fujifilm ${entry.model}`,
  };
  added.push({ ...entry, pageUrl: match.pageUrl });
}

fs.writeFileSync(productImagesPath, renderProductImages(imageMap));

console.log(`Existing Fujifilm entries already mapped: ${skippedExisting.length}`);
console.log(`New official Fujifilm mappings added: ${added.length}`);
console.log(`Fujifilm entries still unmatched/skipped: ${unmatched.length}`);
if (added.length) {
  console.log("\nAdded official Fujifilm mappings:");
  for (const entry of added) console.log(`- ${entry.category} | ${entry.model} | ${entry.pageUrl}`);
}
